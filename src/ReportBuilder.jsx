import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, CartesianGrid, Legend,
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import {
  calcKPIs, getAmpel, detectAnomalies, fmtEur, fmtPct, fmtNum, fmtMonth, fmtMonthFull,
  buildWaterfall, COLORS, renderLogoToCanvas
} from './data';

// ═══════════════════════════════════════════════════════════
// RECIPIENTS – empfängerorientierte Berichtstypen
// ═══════════════════════════════════════════════════════════
const RECIPIENTS = [
  {
    id: 'general',
    label: 'Allgemeiner Bericht',
    icon: '📄',
    description: 'Standardbericht ohne spezifischen Empfänger',
    tone: 'sachlich-professionell, ausgewogene Darstellung aller wesentlichen Kennzahlen',
    focus: 'Gesamtüberblick über die finanzielle Lage, Entwicklungen und Handlungsfelder',
    detail: 'mittel',
  },
  {
    id: 'geschaeftsfuehrung',
    label: 'Geschäftsführung / CEO',
    icon: '👔',
    description: 'Strategischer Überblick mit Handlungsempfehlungen',
    tone: 'ergebnisorientiert, prägnant, auf Entscheidungsrelevanz fokussiert. Verwende „die Geschäftsführung" als Anrede im Bericht. Strategische Implikationen betonen. Executive Summary an den Anfang.',
    focus: 'Gesamtperformance, strategische Risiken, Zielerreichung, Ergebnisentwicklung, Handlungsbedarfe mit konkreten Empfehlungen und Prioritäten',
    detail: 'hoch (aggregiert, aber mit Drill-Down bei Auffälligkeiten)',
  },
  {
    id: 'cfo',
    label: 'CFO / Finanzvorstand',
    icon: '💼',
    description: 'Detaillierte Finanzanalyse mit Kennzahlensystematik',
    tone: 'fachlich-präzise, kennzahlenbasiert, analytisch. Der CFO versteht alle Fachbegriffe – verwende Controlling-Terminologie korrekt und ohne Vereinfachungen.',
    focus: 'Vollständige Kennzahlenanalyse inkl. DuPont, Liquiditätsgrade, EK-Quote, Cashflow-Details, Bilanzstruktur, Planabweichungen mit Ursachenanalyse',
    detail: 'sehr hoch (alle KPIs, detaillierte Abweichungsanalyse)',
  },
  {
    id: 'aufsichtsrat',
    label: 'Aufsichtsrat / Beirat',
    icon: '🏛️',
    description: 'Überwachungsorientierter Bericht mit Risikofokus',
    tone: 'formell, transparent, vollständig. Verwende „der Aufsichtsrat" bzw. „das Kontrollgremium". Compliance- und Risikoaspekte besonders hervorheben. Sachverhalte vollständig darstellen – der Aufsichtsrat muss seiner Kontrollpflicht nachkommen können.',
    focus: 'Vermögens-, Finanz- und Ertragslage im Überblick, wesentliche Risiken und Chancen, Zielerreichung vs. Plan, Going-Concern-relevante Aspekte, Liquiditätslage',
    detail: 'mittel-hoch (aggregiert, aber vollständig)',
  },
  {
    id: 'gesellschafter',
    label: 'Gesellschafter / Investoren',
    icon: '🤝',
    description: 'Wertorientierter Bericht mit Rendite- und Wachstumsfokus',
    tone: 'transparent, vertrauensbildend, ergebnisorientiert. Gesellschafter interessieren sich primär für Rendite, Unternehmenswert und Ausschüttungsfähigkeit.',
    focus: 'Ergebnisentwicklung, Eigenkapitalrentabilität, Cashflow-Generierung, Ausschüttungspotenzial, Wachstumsperspektiven, Unternehmenswertentwicklung',
    detail: 'mittel (fokussiert auf die Kernkennzahlen)',
  },
  {
    id: 'abteilungsleiter',
    label: 'Abteilungsleiter / Bereichsleiter',
    icon: '👥',
    description: 'Operativer Bericht mit Kostenstellenfokus',
    tone: 'praxisnah, handlungsorientiert, motivierend. Abteilungsleiter brauchen umsetzbare Erkenntnisse für ihren Verantwortungsbereich.',
    focus: 'Kostenentwicklung, Personalkosten-Quote, Effizienz, Produktivität, operative Stellhebel, Soll-Ist-Vergleiche mit Maßnahmen',
    detail: 'mittel (operativ ausgerichtet)',
  },
  {
    id: 'bank',
    label: 'Hausbank / Kreditgeber',
    icon: '🏦',
    description: 'Kreditwürdigkeitsorientierter Bericht',
    tone: 'sachlich-nüchtern, faktenbasiert, positiv aber realistisch. Banken bewerten Kreditrisiko – Liquidität und Kapitalstruktur sind entscheidend. Financial Covenants und Kreditlinien berücksichtigen.',
    focus: 'Liquiditätslage (alle drei Grade), Eigenkapitalquote, Verschuldungsgrad, Schuldendienstfähigkeit, Cashflow, Sicherheitenpotenzial, Planverlässlichkeit',
    detail: 'hoch (besonders bei Bilanzkennzahlen)',
  },
  {
    id: 'steuerberater',
    label: 'Steuerberater / Wirtschaftsprüfer',
    icon: '📋',
    description: 'Daten- und bilanzorientierter Bericht',
    tone: 'fachlich, HGB-orientiert, plausibilitätsfokussiert. Buchhalterische Korrektheit und Nachvollziehbarkeit stehen im Vordergrund.',
    focus: 'Bilanzstruktur, GuV-Entwicklung, Plausibilität der Veränderungen, steuerrelevante Aspekte, Bewertungsfragen, Rückstellungsbedarf',
    detail: 'sehr hoch (vollständige Datengrundlage)',
  },
];

// ═══════════════════════════════════════════════════════════
// KPI CATEGORIES für Filter-System
// ═══════════════════════════════════════════════════════════
const KPI_CATEGORIES = [
  {
    id: 'ertrag',
    label: 'Ertragslage',
    icon: '📈',
    kpis: [
      { id: 'umsatz', label: 'Umsatzentwicklung', default: true },
      { id: 'ebit', label: 'EBIT & EBIT-Marge', default: true },
      { id: 'kostenstruktur', label: 'Kostenstruktur (Material, Personal, Sonstige)', default: true },
      { id: 'deckungsbeitrag', label: 'Deckungsbeitragsrechnung', default: false },
      { id: 'produktsegmente', label: 'Produktsegmente (A/B/C)', default: false },
    ],
  },
  {
    id: 'bilanz',
    label: 'Bilanzstruktur',
    icon: '⚖️',
    kpis: [
      { id: 'aktivPassiv', label: 'Aktiva/Passiva-Struktur', default: true },
      { id: 'ekQuote', label: 'Eigenkapitalquote & Verschuldungsgrad', default: true },
      { id: 'anlagendeckung', label: 'Anlagendeckung', default: false },
    ],
  },
  {
    id: 'liquiditaet',
    label: 'Liquidität',
    icon: '💧',
    kpis: [
      { id: 'liqGrade', label: 'Liquiditätsgrade 1-3', default: true },
      { id: 'workingCapital', label: 'Working Capital', default: false },
      { id: 'cashflow', label: 'Cashflow-Analyse', default: true },
    ],
  },
  {
    id: 'rentabilitaet',
    label: 'Rentabilität',
    icon: '🎯',
    kpis: [
      { id: 'umsatzrentabilitaet', label: 'Umsatzrentabilität', default: true },
      { id: 'roi', label: 'ROI (DuPont-System)', default: false },
      { id: 'personalQuote', label: 'Personalkosten-Quote', default: true },
    ],
  },
  {
    id: 'planung',
    label: 'Planung & Abweichung',
    icon: '📊',
    kpis: [
      { id: 'sollIst', label: 'Soll-Ist-Vergleich Umsatz', default: true },
      { id: 'anomalien', label: 'Anomalien & Auffälligkeiten', default: true },
      { id: 'trend', label: 'Trendanalyse 6 Monate', default: false },
    ],
  },
];

const TIME_PERIODS = [
  { id: 'latest', label: 'Aktueller Monat', description: 'Fokus auf den letzten verfügbaren Monat' },
  { id: 'quarter', label: 'Letztes Quartal', description: 'Quartalsauswertung der letzten 3 Monate' },
  { id: 'halfYear', label: 'Letztes Halbjahr', description: 'Auswertung der letzten 6 Monate' },
  { id: 'year', label: 'Gesamtjahr', description: 'Alle verfügbaren Daten des Jahres' },
  { id: 'all', label: 'Gesamter Zeitraum', description: 'Alle geladenen Daten' },
  { id: 'q_compare', label: 'Quartalsvergleich', description: 'Q1 vs. Q2 vs. Q3 vs. Q4' },
];

const REPORT_LENGTHS = [
  { id: 'compact', label: 'Kompakt', pages: '2–3 Seiten', description: 'Wesentliche Kennzahlen & Executive Summary' },
  { id: 'standard', label: 'Standard', pages: '4–6 Seiten', description: 'Ausführliche Analyse mit Diagrammen' },
  { id: 'comprehensive', label: 'Umfassend', pages: '7–10 Seiten', description: 'Vollständiger Controlling-Report mit Details' },
];

// ═══════════════════════════════════════════════════════════
// CHART DEFINITIONS (for PDF rendering)
// ═══════════════════════════════════════════════════════════
const CHART_REGISTRY = [
  { id: 'umsatz_ebit_trend', title: 'Umsatz- & Ergebnisentwicklung', category: 'ertrag', description: 'Balkendiagramm Umsatz vs. Plan mit EBIT-Linie und EBIT-Marge' },
  { id: 'kostenstruktur', title: 'Kostenstruktur', category: 'ertrag', description: 'Donut-Diagramm der Kostenverteilung (Material, Personal, Sonstige, AfA, Zinsen)' },
  { id: 'aktiva_struktur', title: 'Aktivastruktur', category: 'bilanz', description: 'Donut-Diagramm Aktiva (Anlagevermögen, Vorräte, Forderungen, Flüssige Mittel)' },
  { id: 'passiva_struktur', title: 'Passivastruktur', category: 'bilanz', description: 'Donut-Diagramm Passiva (Eigenkapital, Langfr. FK, Kurzfr. FK)' },
  { id: 'working_capital', title: 'Working Capital Trend', category: 'liquiditaet', description: 'Flächendiagramm Working Capital über 12 Monate' },
  { id: 'cashflow_waterfall', title: 'Cashflow-Waterfall', category: 'liquiditaet', description: 'Wasserfall-Diagramm der Cashflow-Komponenten' },
  { id: 'rentabilitaet_trend', title: 'Rentabilitätskennzahlen', category: 'rentabilitaet', description: 'Liniendiagramm EBIT-Marge, Umsatzrentabilität, ROI über 12 Monate' },
  { id: 'deckungsbeitrag', title: 'Deckungsbeitragsrechnung', category: 'ertrag', description: 'Horizontales Balkendiagramm: Umsatz → DB I → DB II → Betriebsergebnis' },
  { id: 'soll_ist_umsatz', title: 'Soll-Ist-Vergleich Umsatz', category: 'planung', description: 'Combo-Chart Ist vs. Soll Umsatz mit Abweichungs-Linie in %' },
  { id: 'abweichung_monate', title: 'Monatliche Planabweichung', category: 'planung', description: 'Balkendiagramm der prozentualen Planabweichung je Monat (grün/rot)' },
  { id: 'produktsegmente', title: 'Produktsegmente', category: 'ertrag', description: 'Balkendiagramm Umsatz nach Produkten A, B, C über die Monate' },
];

// ═══════════════════════════════════════════════════════════
// HIDDEN CHART RENDERER (PDF-optimized)
// ═══════════════════════════════════════════════════════════
const PDF_COLORS = {
  primary: '#3B82F6',
  secondary: '#F59E0B',
  success: '#10B981',
  danger: '#EF4444',
  purple: '#8B5CF6',
  text: '#1F2937',
  textMuted: '#6B7280',
  gridStroke: '#E5E7EB',
  donut: ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444'],
};

export function HiddenChartRenderer({ data, allKPIs, latestKPI }) {
  if (!latestKPI || !data.length) return null;

  const chartData = allKPIs.slice(-12).map(k => ({
    name: fmtMonth(k.datum), umsatz: k.umsatz, plan: k.umsatz_plan,
    ebit: k.ebit, marge: k.ebitMarge,
  }));

  const kostenData = [
    { name: 'Material', value: latestKPI.materialaufwand },
    { name: 'Personal', value: latestKPI.personalaufwand },
    { name: 'Sonstiges', value: latestKPI.sonst_aufwand },
    { name: 'AfA', value: latestKPI.abschreibungen },
    { name: 'Zinsen', value: latestKPI.zinsaufwand },
  ];

  const aktivData = [
    { name: 'Anlagevermögen', value: latestKPI.anlagevermoegen },
    { name: 'Vorräte', value: latestKPI.vorraete },
    { name: 'Forderungen', value: latestKPI.kurzfr_forderungen },
    { name: 'Flüssige Mittel', value: latestKPI.fluessige_mittel },
  ];
  const passivData = [
    { name: 'Eigenkapital', value: latestKPI.eigenkapital },
    { name: 'Langfr. FK', value: latestKPI.langfr_verbindlichkeiten },
    { name: 'Kurzfr. FK', value: latestKPI.kurzfr_verbindlichkeiten },
  ];

  const wcData = allKPIs.slice(-12).map(k => ({ name: fmtMonth(k.datum), wc: k.workingCapital }));

  const wfRaw = buildWaterfall(latestKPI);
  let cum = 0;
  const wfBars = wfRaw.map(d => {
    if (d.type.startsWith('total')) return { ...d, bottom: 0, bar: d.value };
    const bottom = d.value >= 0 ? cum : cum + d.value;
    cum += d.value;
    return { ...d, bottom: Math.max(0, bottom), bar: Math.abs(d.value) };
  });

  const rentData = allKPIs.slice(-12).map(k => ({ name: fmtMonth(k.datum), ur: k.umsatzrentabilitaet, roi: k.roi, em: k.ebitMarge }));

  const dbData = [
    { name: 'Umsatz', value: latestKPI.umsatz },
    { name: 'DB I (nach Material)', value: latestKPI.umsatz - latestKPI.materialaufwand },
    { name: 'DB II (nach Personal)', value: latestKPI.umsatz - latestKPI.materialaufwand - latestKPI.personalaufwand },
    { name: 'Betriebsergebnis', value: latestKPI.gewinn },
  ];

  const abwData = allKPIs.slice(-12).map(k => ({
    name: fmtMonth(k.datum), ist: k.umsatz, soll: k.umsatz_plan,
    abw: k.umsatz_plan ? ((k.umsatz - k.umsatz_plan) / k.umsatz_plan * 100) : 0,
  }));

  const prodData = allKPIs.slice(-12).map(k => ({
    name: fmtMonth(k.datum), a: k.umsatz_a || 0, b: k.umsatz_b || 0, c: k.umsatz_c || 0,
  }));

  const commonAxisTick = { fill: PDF_COLORS.text, fontSize: 11, fontFamily: 'Helvetica' };
  const kFormatter = v => `${(v/1000).toFixed(0)}k`;
  const pctFormatter = v => `${v.toFixed(0)}%`;
  const pdfLegend = v => <span style={{ color: PDF_COLORS.text, fontSize: 11 }}>{v}</span>;

  const chartStyle = { background: '#fff', padding: '16px', borderRadius: 8 };

  return (
    <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '680px', background: '#fff' }}>

      <div data-chart-id="umsatz_ebit_trend" style={chartStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PDF_COLORS.text, marginBottom: 12, fontFamily: 'Helvetica' }}>Umsatz- & Ergebnisentwicklung</div>
        <ResponsiveContainer width={640} height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={PDF_COLORS.gridStroke} />
            <XAxis dataKey="name" tick={commonAxisTick} />
            <YAxis yAxisId="left" tick={commonAxisTick} tickFormatter={kFormatter} />
            <YAxis yAxisId="right" orientation="right" tick={commonAxisTick} tickFormatter={pctFormatter} />
            <Legend formatter={pdfLegend} />
            <Bar yAxisId="left" dataKey="umsatz" name="Umsatz (Ist)" fill={PDF_COLORS.primary} radius={[3,3,0,0]} barSize={22} isAnimationActive={false} />
            <Bar yAxisId="left" dataKey="plan" name="Umsatz (Plan)" fill="#CBD5E1" radius={[3,3,0,0]} barSize={22} isAnimationActive={false} />
            <Line yAxisId="left" dataKey="ebit" name="EBIT" stroke={PDF_COLORS.secondary} strokeWidth={2.5} dot={{ r: 3, fill: PDF_COLORS.secondary }} isAnimationActive={false} />
            <Line yAxisId="right" dataKey="marge" name="EBIT-Marge (%)" stroke={PDF_COLORS.success} strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div data-chart-id="kostenstruktur" style={chartStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PDF_COLORS.text, marginBottom: 12 }}>Kostenstruktur ({fmtMonthFull(latestKPI.datum)})</div>
        <ResponsiveContainer width={640} height={280}>
          <PieChart>
            <Pie data={kostenData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={105} paddingAngle={2} strokeWidth={1} stroke="#fff" isAnimationActive={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`} labelLine={{ stroke: PDF_COLORS.textMuted }}>
              {kostenData.map((_, i) => <Cell key={i} fill={PDF_COLORS.donut[i]} />)}
            </Pie>
            <Legend formatter={pdfLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div data-chart-id="aktiva_struktur" style={chartStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PDF_COLORS.text, marginBottom: 12 }}>Aktivastruktur ({fmtEur(latestKPI.gesamtkapital)})</div>
        <ResponsiveContainer width={640} height={260}>
          <PieChart>
            <Pie data={aktivData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} strokeWidth={1} stroke="#fff" isAnimationActive={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`} labelLine={{ stroke: PDF_COLORS.textMuted }}>
              {aktivData.map((_, i) => <Cell key={i} fill={PDF_COLORS.donut[i]} />)}
            </Pie>
            <Legend formatter={pdfLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div data-chart-id="passiva_struktur" style={chartStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PDF_COLORS.text, marginBottom: 12 }}>Passivastruktur ({fmtEur(latestKPI.gesamtkapital)})</div>
        <ResponsiveContainer width={640} height={260}>
          <PieChart>
            <Pie data={passivData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} strokeWidth={1} stroke="#fff" isAnimationActive={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`} labelLine={{ stroke: PDF_COLORS.textMuted }}>
              {passivData.map((d, i) => <Cell key={i} fill={PDF_COLORS.donut[i]} />)}
            </Pie>
            <Legend formatter={pdfLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div data-chart-id="working_capital" style={chartStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PDF_COLORS.text, marginBottom: 12 }}>Working Capital Trend</div>
        <ResponsiveContainer width={640} height={260}>
          <AreaChart data={wcData}>
            <CartesianGrid strokeDasharray="3 3" stroke={PDF_COLORS.gridStroke} />
            <XAxis dataKey="name" tick={commonAxisTick} />
            <YAxis tick={commonAxisTick} tickFormatter={kFormatter} />
            <Legend formatter={pdfLegend} />
            <defs><linearGradient id="wcGradPDF" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PDF_COLORS.primary} stopOpacity={0.3}/><stop offset="100%" stopColor={PDF_COLORS.primary} stopOpacity={0}/></linearGradient></defs>
            <Area type="monotone" dataKey="wc" name="Working Capital" stroke={PDF_COLORS.primary} fill="url(#wcGradPDF)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div data-chart-id="cashflow_waterfall" style={chartStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PDF_COLORS.text, marginBottom: 12 }}>Cashflow-Waterfall ({fmtMonthFull(latestKPI.datum)})</div>
        <ResponsiveContainer width={640} height={260}>
          <BarChart data={wfBars} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke={PDF_COLORS.gridStroke} />
            <XAxis dataKey="name" tick={{ ...commonAxisTick, fontSize: 10 }} />
            <YAxis tick={commonAxisTick} tickFormatter={kFormatter} />
            <Bar dataKey="bottom" stackId="a" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="bar" stackId="a" name="Betrag" radius={[3,3,0,0]} isAnimationActive={false}>
              {wfBars.map((d, i) => <Cell key={i} fill={d.type === 'positive' || d.type === 'total_start' ? PDF_COLORS.success : d.type === 'negative' ? PDF_COLORS.danger : PDF_COLORS.primary} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div data-chart-id="rentabilitaet_trend" style={chartStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PDF_COLORS.text, marginBottom: 12 }}>Rentabilitätskennzahlen im Zeitverlauf</div>
        <ResponsiveContainer width={640} height={280}>
          <LineChart data={rentData}>
            <CartesianGrid strokeDasharray="3 3" stroke={PDF_COLORS.gridStroke} />
            <XAxis dataKey="name" tick={commonAxisTick} />
            <YAxis tick={commonAxisTick} tickFormatter={pctFormatter} />
            <Legend formatter={pdfLegend} />
            <Line dataKey="em" name="EBIT-Marge" stroke={PDF_COLORS.primary} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
            <Line dataKey="ur" name="Umsatzrentabilität" stroke={PDF_COLORS.success} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
            <Line dataKey="roi" name="ROI" stroke={PDF_COLORS.secondary} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div data-chart-id="deckungsbeitrag" style={chartStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PDF_COLORS.text, marginBottom: 12 }}>Deckungsbeitragsrechnung ({fmtMonthFull(latestKPI.datum)})</div>
        <ResponsiveContainer width={640} height={240}>
          <BarChart data={dbData} layout="vertical" barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke={PDF_COLORS.gridStroke} />
            <XAxis type="number" tick={commonAxisTick} tickFormatter={kFormatter} />
            <YAxis type="category" dataKey="name" tick={{ ...commonAxisTick, fontSize: 11 }} width={150} />
            <Bar dataKey="value" name="Betrag" radius={[0,3,3,0]} isAnimationActive={false}>
              {dbData.map((d, i) => <Cell key={i} fill={d.value >= 0 ? PDF_COLORS.donut[i] : PDF_COLORS.danger} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div data-chart-id="soll_ist_umsatz" style={chartStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PDF_COLORS.text, marginBottom: 12 }}>Soll-Ist-Vergleich Umsatz</div>
        <ResponsiveContainer width={640} height={280}>
          <ComposedChart data={abwData}>
            <CartesianGrid strokeDasharray="3 3" stroke={PDF_COLORS.gridStroke} />
            <XAxis dataKey="name" tick={commonAxisTick} />
            <YAxis yAxisId="left" tick={commonAxisTick} tickFormatter={kFormatter} />
            <YAxis yAxisId="right" orientation="right" tick={commonAxisTick} tickFormatter={pctFormatter} />
            <Legend formatter={pdfLegend} />
            <Bar yAxisId="left" dataKey="ist" name="Ist-Umsatz" fill={PDF_COLORS.primary} radius={[3,3,0,0]} barSize={18} isAnimationActive={false} />
            <Bar yAxisId="left" dataKey="soll" name="Plan-Umsatz" fill="#CBD5E1" radius={[3,3,0,0]} barSize={18} isAnimationActive={false} />
            <Line yAxisId="right" dataKey="abw" name="Abweichung %" stroke={PDF_COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div data-chart-id="abweichung_monate" style={chartStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PDF_COLORS.text, marginBottom: 12 }}>Monatliche Planabweichung</div>
        <ResponsiveContainer width={640} height={240}>
          <BarChart data={abwData} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke={PDF_COLORS.gridStroke} />
            <XAxis dataKey="name" tick={commonAxisTick} />
            <YAxis tick={commonAxisTick} tickFormatter={pctFormatter} />
            <Bar dataKey="abw" name="Abweichung %" radius={[3,3,0,0]} isAnimationActive={false}>
              {abwData.map((d, i) => <Cell key={i} fill={d.abw >= 0 ? PDF_COLORS.success : PDF_COLORS.danger} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div data-chart-id="produktsegmente" style={chartStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PDF_COLORS.text, marginBottom: 12 }}>Umsatz nach Produktsegmenten</div>
        <ResponsiveContainer width={640} height={280}>
          <BarChart data={prodData}>
            <CartesianGrid strokeDasharray="3 3" stroke={PDF_COLORS.gridStroke} />
            <XAxis dataKey="name" tick={commonAxisTick} />
            <YAxis tick={commonAxisTick} tickFormatter={kFormatter} />
            <Legend formatter={pdfLegend} />
            <Bar dataKey="a" name="Produkt A" fill={PDF_COLORS.primary} stackId="stack" isAnimationActive={false} />
            <Bar dataKey="b" name="Produkt B" fill={PDF_COLORS.secondary} stackId="stack" isAnimationActive={false} />
            <Bar dataKey="c" name="Produkt C" fill={PDF_COLORS.success} stackId="stack" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CHART CAPTURE FUNCTION
// ═══════════════════════════════════════════════════════════
async function captureCharts() {
  const chartElements = document.querySelectorAll('[data-chart-id]');
  const charts = {};

  for (const el of chartElements) {
    const id = el.getAttribute('data-chart-id');
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      charts[id] = {
        base64: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
      };
    } catch (e) {
      console.warn(`Failed to capture chart ${id}:`, e);
    }
  }
  return charts;
}

// ═══════════════════════════════════════════════════════════
// REPORT BUILDER MODAL
// ═══════════════════════════════════════════════════════════
export function ReportBuilder({ show, onClose, data, allKPIs, latestKPI, settings, companyName, anomalies }) {
  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState('general');
  const [selectedKPIs, setSelectedKPIs] = useState(() => {
    const defaults = {};
    KPI_CATEGORIES.forEach(cat => cat.kpis.forEach(k => { defaults[k.id] = k.default; }));
    return defaults;
  });
  const [timePeriod, setTimePeriod] = useState('year');
  const [reportLength, setReportLength] = useState('standard');
  const [customInstructions, setCustomInstructions] = useState('');
  const [outputFormat, setOutputFormat] = useState('pdf');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  // Feature 1: Minimizable report builder
  const [minimized, setMinimized] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  // Feature 2: Format selection (PDF + Word)
  const [formats, setFormats] = useState({ pdf: true, word: false });

  // Feature 5: Smart AI filter loading
  const [smartLoading, setSmartLoading] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (show) { setStep(1); setError(''); setProgress(''); setGenerating(false); setMinimized(false); setReportDone(false); }
  }, [show]);

  const toggleKPI = (id) => setSelectedKPIs(prev => ({ ...prev, [id]: !prev[id] }));
  const selectAllKPIs = () => {
    const all = {};
    KPI_CATEGORIES.forEach(cat => cat.kpis.forEach(k => { all[k.id] = true; }));
    setSelectedKPIs(all);
  };
  const deselectAllKPIs = () => {
    const none = {};
    KPI_CATEGORIES.forEach(cat => cat.kpis.forEach(k => { none[k.id] = false; }));
    setSelectedKPIs(none);
  };

  const selectedCount = Object.values(selectedKPIs).filter(Boolean).length;
  const totalKPIs = Object.keys(selectedKPIs).length;

  // Feature 5: Smart AI filter – auto-select KPIs based on instructions
  const smartFilter = async () => {
    if (!customInstructions.trim()) return;
    setSmartLoading(true);
    try {
      const allKpiIds = KPI_CATEGORIES.flatMap(c => c.kpis.map(k => k.id));
      const apiKey = settings.apiKey || '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';
      const kpiDescriptions = KPI_CATEGORIES.flatMap(c => c.kpis.map(k => `${k.id}: ${k.label} (Kategorie: ${c.label})`)).join('\n');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929', max_tokens: 300,
          messages: [{ role: 'user', content: `Verfügbare Report-Sektionen:\n${kpiDescriptions}\n\nDer Benutzer möchte folgenden Bericht erstellen: "${customInstructions}"\n\nWelche Sektions-IDs sind relevant? Antworte NUR mit einer kommaseparierten Liste der IDs, z.B.: umsatz, ebit, cashflow` }]
        })
      });
      const json = await res.json();
      const text = (json.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
      const ids = text.split(',').map(s => s.trim().toLowerCase());
      const newSel = {};
      allKpiIds.forEach(id => { newSel[id] = ids.some(sel => id.includes(sel) || sel.includes(id)); });
      if (Object.values(newSel).filter(Boolean).length === 0) allKpiIds.forEach(id => { newSel[id] = true; });
      setSelectedKPIs(newSel);
    } catch (e) { console.error('Smart filter error:', e); }
    setSmartLoading(false);
  };

  // ─── GENERATE REPORT ───
  const generateReport = async () => {
    if (!latestKPI) return;
    setGenerating(true);
    setError('');

    try {
      // Step 1: Capture charts
      setProgress('Diagramme werden erfasst...');
      await new Promise(r => setTimeout(r, 300)); // Let charts render
      const charts = await captureCharts();
      const chartCount = Object.keys(charts).length;

      // Step 2: Build comprehensive data payload
      setProgress('Daten werden aufbereitet...');
      const recipientInfo = RECIPIENTS.find(r => r.id === recipient);
      const activeKPIs = Object.entries(selectedKPIs).filter(([, v]) => v).map(([k]) => k);

      // Determine which charts are relevant based on selected KPIs
      const relevantChartIds = CHART_REGISTRY
        .filter(c => {
          // Map chart categories to KPI selections
          if (activeKPIs.includes('umsatz') && c.id === 'umsatz_ebit_trend') return true;
          if (activeKPIs.includes('ebit') && c.id === 'umsatz_ebit_trend') return true;
          if (activeKPIs.includes('kostenstruktur') && c.id === 'kostenstruktur') return true;
          if (activeKPIs.includes('aktivPassiv') && (c.id === 'aktiva_struktur' || c.id === 'passiva_struktur')) return true;
          if (activeKPIs.includes('liqGrade') && c.id === 'working_capital') return true;
          if (activeKPIs.includes('workingCapital') && c.id === 'working_capital') return true;
          if (activeKPIs.includes('cashflow') && c.id === 'cashflow_waterfall') return true;
          if (activeKPIs.includes('umsatzrentabilitaet') && c.id === 'rentabilitaet_trend') return true;
          if (activeKPIs.includes('roi') && c.id === 'rentabilitaet_trend') return true;
          if (activeKPIs.includes('deckungsbeitrag') && c.id === 'deckungsbeitrag') return true;
          if (activeKPIs.includes('sollIst') && (c.id === 'soll_ist_umsatz' || c.id === 'abweichung_monate')) return true;
          if (activeKPIs.includes('produktsegmente') && c.id === 'produktsegmente') return true;
          return false;
        })
        .map(c => c.id);

      // Step 3: Prepare data for Claude
      const dataByPeriod = (() => {
        switch (timePeriod) {
          case 'latest': return data.slice(-1);
          case 'quarter': return data.slice(-3);
          case 'halfYear': return data.slice(-6);
          case 'year': return data.slice(-12);
          case 'q_compare': return data;
          default: return data;
        }
      })();

      const kpisForReport = dataByPeriod.map(calcKPIs).filter(Boolean);
      const detectedAnomalies = detectAnomalies(data);
      const lengthInfo = REPORT_LENGTHS.find(l => l.id === reportLength);
      const maxTokens = reportLength === 'compact' ? 6000 : reportLength === 'standard' ? 12000 : 16000;

      // Step 4: Build the AI prompt
      setProgress('KI generiert den Bericht...');

      const chartListForPrompt = relevantChartIds
        .filter(id => charts[id])
        .map(id => {
          const info = CHART_REGISTRY.find(c => c.id === id);
          return `- [[CHART:${id}]] → "${info.title}": ${info.description}`;
        })
        .join('\n');

      const systemPrompt = buildReportSystemPrompt({
        companyName,
        branche: settings.branche,
        recipientInfo,
        kpisForReport,
        latestKPI,
        allKPIs,
        data: dataByPeriod,
        anomalies: detectedAnomalies,
        activeKPIs,
        timePeriod,
        lengthInfo,
        chartListForPrompt,
        customInstructions,
      });

      const apiKey = settings.apiKey || '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';

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: maxTokens,
          thinking: { type: 'enabled', budget_tokens: 10000 },
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: `Erstelle jetzt den vollständigen ${lengthInfo.pages}-Bericht. ${customInstructions ? `\n\nZusätzliche Anweisungen des Erstellers:\n${customInstructions}` : ''}\n\nVerfügbare Diagramme zum Einbetten:\n${chartListForPrompt}\n\nBitte verwende die [[CHART:id]] Marker an den passenden Stellen im Text.`,
          }],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API-Fehler: ${response.status}`);
      }

      const json = await response.json();
      const textBlocks = (json.content || []).filter(b => b.type === 'text');
      const reportText = textBlocks.map(b => b.text).join('\n');

      if (!reportText.trim()) {
        throw new Error('Der KI-Bericht konnte nicht generiert werden. Bitte versuchen Sie es erneut.');
      }

      // Step 5: Render outputs
      setProgress('Dateien werden erstellt...');
      const filename = `PULSE_Report_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;

      if (formats.pdf) {
        await renderProfessionalPDF({
          reportText, charts, companyName, branche: settings.branche,
          recipientInfo, latestKPI, data: dataByPeriod, timePeriod, allKPIs: kpisForReport,
        });
      }

      if (formats.word) {
        await generateWordDoc({ reportText, companyName, branche: settings.branche, recipientInfo, data: dataByPeriod, allKPIs: kpisForReport, filename });
      }

      setProgress('✅ Bericht erfolgreich erstellt!');
      setReportDone(true);
      if (!minimized) setTimeout(() => onClose(), 1500);

    } catch (err) {
      console.error('Report generation error:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setGenerating(false);
    }
  };

  if (!show && !minimized) return null;

  // Feature 1: Minimized state – toast / notification
  if (minimized) {
    if (reportDone) {
      return (
        <div className="report-notification" onClick={() => { setMinimized(false); setReportDone(false); onClose(); }}>
          ✅ Report fertig! Klicken zum Schließen.
        </div>
      );
    }
    if (generating) {
      return (
        <div className="report-toast">
          <div className="gen-spinner" /> Report wird generiert...
        </div>
      );
    }
    return null;
  }

  return (
    <div className="report-overlay" onClick={e => e.target === e.currentTarget && !generating && onClose()}>
      <div className="report-modal">
        {/* Header */}
        <div className="report-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📊</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Report erstellen</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Professioneller Controlling-Bericht mit KI</div>
            </div>
          </div>
          <button className="report-close" onClick={onClose} disabled={generating}>✕</button>
          {/* Feature 1: Minimize button (only during generation) */}
          {generating && (
            <button className="report-close" onClick={() => setMinimized(true)} title="Minimieren" style={{ marginRight: 4 }}>▬</button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="report-steps">
          {[
            { n: 1, label: 'Empfänger' },
            { n: 2, label: 'Inhalt' },
            { n: 3, label: 'Optionen' },
          ].map(s => (
            <div key={s.n} className={`report-step ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`} onClick={() => !generating && setStep(s.n)}>
              <div className="step-number">{step > s.n ? '✓' : s.n}</div>
              <span className="step-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="report-modal-body">
          {/* ─── STEP 1: RECIPIENT ─── */}
          {step === 1 && (
            <div className="step-content">
              <div className="step-title">An wen richtet sich der Bericht?</div>
              <p className="step-description">Der Empfänger bestimmt Tonalität, Detailgrad und Schwerpunkte des Berichts.</p>
              <div className="recipient-grid">
                {RECIPIENTS.map(r => (
                  <div key={r.id} className={`recipient-card ${recipient === r.id ? 'selected' : ''}`} onClick={() => setRecipient(r.id)}>
                    <div className="recipient-icon">{r.icon}</div>
                    <div className="recipient-label">{r.label}</div>
                    <div className="recipient-desc">{r.description}</div>
                    {recipient === r.id && <div className="recipient-check">✓</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── STEP 2: CONTENT / FILTERS ─── */}
          {step === 2 && (
            <div className="step-content">
              <div className="step-title">Was soll berichtet werden?</div>

              {/* Free text instructions */}
              <div className="filter-section">
                <div className="filter-header">
                  <span className="filter-icon">✍️</span>
                  <span className="filter-title">Individuelle Anweisungen</span>
                  <span className="filter-badge">Optional</span>
                </div>
                <textarea
                  className="report-textarea"
                  value={customInstructions}
                  onChange={e => setCustomInstructions(e.target.value)}
                  placeholder="z.B. &quot;Vergleiche Q1 und Q3 detailliert&quot;, &quot;Fokus auf die Materialkosten-Entwicklung seit September&quot;, &quot;Erkläre die Liquiditätsverschlechterung im November&quot;..."
                  rows={3}
                />
                {/* Feature 5: Smart AI filter */}
                {customInstructions.trim() && (
                  <button className="mini-btn" style={{ marginTop: 8 }} onClick={smartFilter} disabled={smartLoading}>
                    {smartLoading ? '⏳ KI analysiert...' : '✨ Smart-Auswahl (KI wählt passende Kennzahlen)'}
                  </button>
                )}
              </div>

              {/* KPI Selection */}
              <div className="filter-section">
                <div className="filter-header">
                  <span className="filter-icon">📊</span>
                  <span className="filter-title">Kennzahlen & Themen</span>
                  <span className="filter-badge">{selectedCount}/{totalKPIs}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button className="mini-btn" onClick={selectAllKPIs}>Alle auswählen</button>
                  <button className="mini-btn" onClick={deselectAllKPIs}>Alle abwählen</button>
                </div>

                {KPI_CATEGORIES.map(cat => (
                  <div key={cat.id} className="kpi-category">
                    <div className="kpi-cat-header">
                      <span>{cat.icon} {cat.label}</span>
                    </div>
                    <div className="kpi-options">
                      {cat.kpis.map(k => (
                        <label key={k.id} className={`kpi-option ${selectedKPIs[k.id] ? 'checked' : ''}`}>
                          <input type="checkbox" checked={!!selectedKPIs[k.id]} onChange={() => toggleKPI(k.id)} />
                          <span className="kpi-checkbox">{selectedKPIs[k.id] ? '✓' : ''}</span>
                          <span>{k.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Period */}
              <div className="filter-section">
                <div className="filter-header">
                  <span className="filter-icon">📅</span>
                  <span className="filter-title">Berichtszeitraum</span>
                </div>
                <div className="time-options">
                  {TIME_PERIODS.map(t => (
                    <label key={t.id} className={`time-option ${timePeriod === t.id ? 'selected' : ''}`} onClick={() => setTimePeriod(t.id)}>
                      <span className="time-radio">{timePeriod === t.id ? '●' : '○'}</span>
                      <div>
                        <div className="time-label">{t.label}</div>
                        <div className="time-desc">{t.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: OPTIONS ─── */}
          {step === 3 && (
            <div className="step-content">
              <div className="step-title">Berichtsoptionen</div>

              {/* Report Length */}
              <div className="filter-section">
                <div className="filter-header">
                  <span className="filter-icon">📏</span>
                  <span className="filter-title">Umfang</span>
                </div>
                <div className="length-options">
                  {REPORT_LENGTHS.map(l => (
                    <div key={l.id} className={`length-card ${reportLength === l.id ? 'selected' : ''}`} onClick={() => setReportLength(l.id)}>
                      <div className="length-pages">{l.pages}</div>
                      <div className="length-label">{l.label}</div>
                      <div className="length-desc">{l.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature 2: Output Format Selection */}
              <div className="filter-section">
                <div className="filter-header">
                  <span className="filter-icon">💾</span>
                  <span className="filter-title">Ausgabeformat</span>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <label className={`kpi-option ${formats.pdf ? 'checked' : ''}`} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={formats.pdf} onChange={() => setFormats(f => ({ ...f, pdf: !f.pdf }))} />
                    <span className="kpi-checkbox">{formats.pdf ? '✓' : ''}</span>
                    <span>📄 PDF (mit Diagrammen)</span>
                  </label>
                  <label className={`kpi-option ${formats.word ? 'checked' : ''}`} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={formats.word} onChange={() => setFormats(f => ({ ...f, word: !f.word }))} />
                    <span className="kpi-checkbox">{formats.word ? '✓' : ''}</span>
                    <span>📝 Word (.docx)</span>
                  </label>
                </div>
              </div>

              {/* Summary Preview */}
              <div className="filter-section">
                <div className="filter-header">
                  <span className="filter-icon">📋</span>
                  <span className="filter-title">Zusammenfassung</span>
                </div>
                <div className="summary-preview">
                  <div className="summary-row"><span>Empfänger:</span><strong>{RECIPIENTS.find(r => r.id === recipient)?.label}</strong></div>
                  <div className="summary-row"><span>Kennzahlen:</span><strong>{selectedCount} von {totalKPIs}</strong></div>
                  <div className="summary-row"><span>Zeitraum:</span><strong>{TIME_PERIODS.find(t => t.id === timePeriod)?.label}</strong></div>
                  <div className="summary-row"><span>Umfang:</span><strong>{REPORT_LENGTHS.find(l => l.id === reportLength)?.pages}</strong></div>
                  <div className="summary-row"><span>Format:</span><strong>{[formats.pdf && 'PDF', formats.word && 'Word'].filter(Boolean).join(' + ') || 'Keines gewählt'}</strong></div>
                  <div className="summary-row"><span>Datengrundlage:</span><strong>{data.length} Monate</strong></div>
                  {customInstructions && <div className="summary-row"><span>Individuelle Anweisung:</span><strong style={{ fontWeight: 400, fontStyle: 'italic' }}>„{customInstructions.slice(0, 60)}{customInstructions.length > 60 ? '...' : ''}"</strong></div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="report-modal-footer">
          {error && <div className="report-error">{error}</div>}
          {generating && progress && <div className="report-progress">{progress}</div>}

          <div className="report-actions">
            {step > 1 && !generating && (
              <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}>← Zurück</button>
            )}
            <div style={{ flex: 1 }} />
            {step < 3 && (
              <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Weiter →</button>
            )}
            {step === 3 && !generating && (
              <button className="btn btn-primary btn-generate" onClick={generateReport} disabled={!formats.pdf && !formats.word}>
                🚀 Bericht generieren
              </button>
            )}
            {generating && (
              <div className="generating-indicator">
                <div className="gen-spinner"></div>
                <span>Bitte warten...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SYSTEM PROMPT BUILDER
// ═══════════════════════════════════════════════════════════
function buildReportSystemPrompt({ companyName, branche, recipientInfo, kpisForReport, latestKPI, allKPIs, data, anomalies, activeKPIs, timePeriod, lengthInfo, chartListForPrompt, customInstructions }) {
  const latest = kpisForReport[kpisForReport.length - 1];
  const first = kpisForReport[0];

  const kpiSummary = kpisForReport.map(k =>
    `${fmtMonthFull(k.datum)}: Umsatz ${fmtEur(k.umsatz)} (Plan: ${fmtEur(k.umsatz_plan)}), EBIT ${fmtEur(k.ebit)}, EBIT-Marge ${fmtPct(k.ebitMarge)}, Liq2 ${fmtPct(k.liq2)}, EK-Quote ${fmtPct(k.ekQuote)}, Cashflow ${fmtEur(k.cashflow)}, PersonalQ ${fmtPct(k.personalQuote)}, ROI ${fmtPct(k.roi)}`
  ).join('\n');

  const anomalyText = anomalies.length
    ? anomalies.map(a => `[${a.severity.toUpperCase()}] ${a.text}`).join('\n')
    : 'Keine wesentlichen Anomalien erkannt.';

  return `Du bist ein hochqualifizierter Senior Controller mit 20+ Jahren Erfahrung in der Erstellung professioneller Controlling-Berichte für deutsche KMU. Du erstellst jetzt einen ${lengthInfo.pages}-Bericht.

═══ UNTERNEHMEN ═══
Name: ${companyName}
Branche: ${branche || 'nicht angegeben'}
Berichtszeitraum: ${first ? fmtMonthFull(first.datum) : ''} bis ${latest ? fmtMonthFull(latest.datum) : ''}
Erstelldatum: ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}

═══ EMPFÄNGER ═══
Adressat: ${recipientInfo.label}
Tonalität: ${recipientInfo.tone}
Inhaltlicher Fokus: ${recipientInfo.focus}
Erwarteter Detailgrad: ${recipientInfo.detail}

═══ GEWÜNSCHTE INHALTE ═══
Vom Ersteller ausgewählte Themen: ${activeKPIs.join(', ')}
${customInstructions ? `\nIndividuelle Anweisung des Erstellers: "${customInstructions}"` : ''}

═══ VOLLSTÄNDIGE DATENGRUNDLAGE ═══
${kpiSummary}

═══ AKTUELLE POSITION (${latest ? fmtMonthFull(latest.datum) : 'N/A'}) ═══
${latest ? `Umsatz: ${fmtEur(latest.umsatz)} (Plan: ${fmtEur(latest.umsatz_plan)}) → Planabweichung: ${latest.umsatz_plan ? ((latest.umsatz - latest.umsatz_plan) / latest.umsatz_plan * 100).toFixed(1) + '%' : 'N/A'}
EBIT: ${fmtEur(latest.ebit)} | EBIT-Marge: ${fmtPct(latest.ebitMarge)}
Materialaufwand: ${fmtEur(latest.materialaufwand)} (${fmtPct(latest.materialQuote || (latest.materialaufwand / latest.umsatz * 100))} des Umsatzes)
Personalaufwand: ${fmtEur(latest.personalaufwand)} (${fmtPct(latest.personalQuote)} des Umsatzes)
Sonstige Aufwendungen: ${fmtEur(latest.sonst_aufwand)}
Abschreibungen: ${fmtEur(latest.abschreibungen)} | Zinsen: ${fmtEur(latest.zinsaufwand)}
Liquidität 1°: ${fmtPct(latest.liq1)} | 2°: ${fmtPct(latest.liq2)} | 3°: ${fmtPct(latest.liq3)}
Working Capital: ${fmtEur(latest.workingCapital)}
EK-Quote: ${fmtPct(latest.ekQuote)} | FK-Quote: ${fmtPct(latest.fkQuote)} | Verschuldungsgrad: ${fmtPct(latest.verschuldungsgrad)}
Anlagendeckung I: ${fmtPct(latest.anlagendeckung1)} | II: ${fmtPct(latest.anlagendeckung2)}
Umsatzrentabilität: ${fmtPct(latest.umsatzrentabilitaet)} | ROI: ${fmtPct(latest.roi)} | Kapitalumschlag: ${latest.kapitalumschlag?.toFixed(2)}x
Operativer Cashflow: ${fmtEur(latest.cashflow)}
Bilanzsumme: ${fmtEur(latest.gesamtkapital)}
Eigenkapital: ${fmtEur(latest.eigenkapital)} | Kurzfr. FK: ${fmtEur(latest.kurzfr_verbindlichkeiten)} | Langfr. FK: ${fmtEur(latest.langfr_verbindlichkeiten)}
Produktsegmente: A=${fmtEur(latest.umsatz_a || 0)}, B=${fmtEur(latest.umsatz_b || 0)}, C=${fmtEur(latest.umsatz_c || 0)}` : 'Keine Daten'}

═══ ERKANNTE ANOMALIEN ═══
${anomalyText}

═══ BERICHTSSTRUKTUR & FORMATIERUNG ═══
Erstelle den Bericht EXAKT in folgender Struktur. Verwende die angegebenen Marker:

1. Beginne mit [[SECTION:Executive Summary]] – Maximal 5-6 Sätze, die das Wichtigste zusammenfassen.
2. Danach für JEDEN thematischen Block: [[SECTION:Titel des Abschnitts]]
   - Fließtext mit Analyse
   - [[CHART:chart_id]] an passenden Stellen (IMMER auf eigener Zeile!)
   - Interpretiere jedes Diagramm kurz NACH dem Marker
3. Vorletzter Abschnitt: [[SECTION:Handlungsempfehlungen]] – Nummerierte, konkrete Maßnahmen mit Priorität und erwarteter Wirkung
4. Letzter Abschnitt: [[SECTION:Ausblick & Fazit]]

═══ WICHTIGE REGELN ═══
- Schreibe in professionellem Deutsch. Keine Markdown-Formatierung (kein **, kein #, keine Aufzählungszeichen).
- Verwende Absätze und Fließtext. Handlungsempfehlungen mit Nummerierung "1.", "2." etc.
- Integriere IMMER konkrete Zahlen aus den Daten. Nie vage formulieren.
- Platziere Diagramme MIT Kontext: Beschreibe kurz, was das Diagramm zeigt, NACHDEM du es platzierst.
- Handlungsempfehlungen sind PFLICHT und müssen konkret, messbar und priorisiert sein.
- Passe Tonalität und Detailgrad an den Empfänger an (s.o.).
- Bei ${recipientInfo.id === 'bank' ? 'Bankberichten: Liquidität und Kapitalstruktur besonders betonen, Going-Concern-Aspekte darstellen' : recipientInfo.id === 'geschaeftsfuehrung' ? 'GF-Berichten: Strategische Implikationen und Entscheidungsbedarf hervorheben' : recipientInfo.id === 'aufsichtsrat' ? 'Aufsichtsrats-Berichten: Risiken transparent darstellen, Kontrollrelevanz betonen' : 'allen Berichten: Ausgewogene Darstellung'}.
- Jeder Abschnitt soll mindestens 2-3 Absätze enthalten (bei Standard/Umfassend).
- KEINE Einleitung wie "Hier ist der Bericht" – beginne direkt mit dem Inhalt.`;
}

// ═══════════════════════════════════════════════════════════
// PDF TEXT SANITIZER – jsPDF helvetica only supports Latin-1
// ═══════════════════════════════════════════════════════════
function sanitizeForPDF(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\u201E\u201C\u201D\u201F\u2033]/g, '"')   // „ " " → "
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")   // ' ' → '
    .replace(/[\u2013\u2014\u2015]/g, ' - ')               // – — → -
    .replace(/\u2026/g, '...')                              // … → ...
    .replace(/\u20AC/g, 'EUR ')                             // € → EUR
    .replace(/[\u2192\u2794\u279C]/g, '->')                // → → ->
    .replace(/[\u2190]/g, '<-')                             // ←
    .replace(/[\u2191\u25B2]/g, '(+)')                     // ↑ → (+)
    .replace(/[\u2193\u25BC]/g, '(-)')                     // ↓ → (-)
    .replace(/[\u2022\u2023\u25CF]/g, '- ')                // • → -
    .replace(/\u00AD/g, '')                                 // Soft hyphen
    .replace(/[\u00B2]/g, '2')                              // ²
    .replace(/[\u00B3]/g, '3')                              // ³
    .replace(/[\u00B0]/g, ' Grad')                          // °
    .replace(/\*\*/g, '')                                   // Markdown bold **
    .replace(/^#+\s*/gm, '')                                // Markdown headings # ## ###
    .replace(/[^\n\r\x20-\x7E\u00A0-\u00FF]/g, '')        // Strip everything outside Latin-1
    ;
}

// Robust text wrapping that never returns single-character arrays
function safeSplitText(pdf, text, maxWidth) {
  const cleaned = sanitizeForPDF(text);
  if (!cleaned.trim()) return [];

  try {
    const result = pdf.splitTextToSize(cleaned, maxWidth);
    // Sanity check: if result has more items than words, something is wrong
    if (Array.isArray(result) && result.length > cleaned.length / 2) {
      // Fallback: manual word wrap
      return manualWordWrap(cleaned, maxWidth, pdf);
    }
    return result || [cleaned];
  } catch (e) {
    return manualWordWrap(cleaned, maxWidth, pdf);
  }
}

function manualWordWrap(text, maxWidth, pdf) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    let w;
    try { w = pdf.getTextWidth(test); } catch { w = test.length * 2; }
    if (w > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

// ═══════════════════════════════════════════════════════════
// PDF RENDERER – Professional output
// ═══════════════════════════════════════════════════════════
async function renderProfessionalPDF({ reportText, charts, companyName, branche, recipientInfo, latestKPI, data, timePeriod, allKPIs }) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const W = 210, H = 297;
  const ML = 22, MR = 22, MT = 25, MB = 20;
  const TW = W - ML - MR;

  // Color palette (professional, clean)
  const C = {
    bg: [255, 255, 255],
    bgDark: [15, 23, 42],
    primary: [37, 99, 235],
    primaryLight: [219, 234, 254],
    accent: [0, 180, 216],
    text: [31, 41, 55],
    textLight: [107, 114, 128],
    heading: [15, 23, 42],
    success: [16, 185, 129],
    danger: [239, 68, 68],
    line: [226, 232, 240],
  };

  const setColor = (c) => pdf.setTextColor(...c);
  const setFill = (c) => pdf.setFillColor(...c);

  let currentPage = 1;
  let y = MT;

  const addPageIfNeeded = (needed = 20) => {
    if (y + needed > H - MB) {
      pdf.addPage();
      currentPage++;
      y = MT;
      // Page header line
      pdf.setDrawColor(...C.line);
      pdf.setLineWidth(0.3);
      pdf.line(ML, MT - 5, W - MR, MT - 5);
      return true;
    }
    return false;
  };

  // ─── COVER PAGE ───
  // Full dark background
  setFill(C.bgDark);
  pdf.rect(0, 0, W, H, 'F');

  // Accent stripe at top
  pdf.setFillColor(...C.primary);
  pdf.rect(0, 0, W, 4, 'F');

  // Try to add logo image – Feature 4: High-res SVG logo
  try {
    const logoDataUrl = await renderLogoToCanvas(800);
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, 'PNG', W / 2 - 20, 30, 40, 40);
    }
  } catch (e) {
    // Fallback: try DOM image
    try {
      const logoImg = document.querySelector('img[alt="PULSE"]');
      if (logoImg) {
        const canvas = document.createElement('canvas');
        canvas.width = 80; canvas.height = 80;
        canvas.getContext('2d').drawImage(logoImg, 0, 0, 80, 80);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', W / 2 - 15, 35, 30, 30);
      }
    } catch (_) {}
  }

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(32);
  setColor([255, 255, 255]);
  pdf.text('PULSE', W / 2, 80, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Performance Unified Liquidity & Strategy Engine', W / 2, 88, { align: 'center' });

  // Separator
  pdf.setDrawColor(...C.primary);
  pdf.setLineWidth(0.8);
  pdf.line(W / 2 - 40, 95, W / 2 + 40, 95);

  // Report title
  pdf.setFontSize(20);
  setColor([255, 255, 255]);
  pdf.text('Management Report', W / 2, 115, { align: 'center' });

  pdf.setFontSize(15);
  pdf.text(companyName, W / 2, 128, { align: 'center' });

  // Metadata block
  pdf.setFontSize(11);
  pdf.setTextColor(148, 163, 184);
  const firstDatum = data[0]?.datum || allKPIs[0]?.datum || '';
  const lastDatum = data[data.length - 1]?.datum || allKPIs[allKPIs.length - 1]?.datum || '';
  pdf.text(`${sanitizeForPDF(fmtMonthFull(firstDatum))} - ${sanitizeForPDF(fmtMonthFull(lastDatum))}`, W / 2, 145, { align: 'center' });

  pdf.setFontSize(10);
  pdf.text(`Erstellt am ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}`, W / 2, 155, { align: 'center' });

  if (recipientInfo.id !== 'general') {
    pdf.text(`Adressat: ${recipientInfo.label}`, W / 2, 165, { align: 'center' });
  }

  if (branche) {
    pdf.text(`Branche: ${branche}`, W / 2, 175, { align: 'center' });
  }

  // Footer decoration on cover
  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(0.3);
  pdf.line(ML + 20, H - 30, W - MR - 20, H - 30);
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Automatisch erstellt mit PULSE - KI-gestuetztes Controlling fuer KMU', W / 2, H - 22, { align: 'center' });

  // ─── CONTENT PAGES ───
  pdf.addPage();
  currentPage++;
  y = MT;

  // Parse report text into sections and chart markers
  const sections = parseReportText(reportText);

  for (const section of sections) {
    if (section.type === 'section_title') {
      addPageIfNeeded(25);

      // Section heading
      pdf.setDrawColor(...C.primary);
      pdf.setLineWidth(0.6);
      pdf.line(ML, y, ML + 35, y);
      y += 6;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      setColor(C.heading);
      pdf.text(sanitizeForPDF(section.text), ML, y);
      y += 10;

    } else if (section.type === 'chart') {
      const chartData = charts[section.chartId];
      if (chartData) {
        // Calculate chart dimensions to fit nicely
        const maxChartW = TW;
        const aspectRatio = chartData.height / chartData.width;
        const chartW = Math.min(maxChartW, 160);
        const chartH = chartW * aspectRatio;
        const cappedH = Math.min(chartH, 90);

        addPageIfNeeded(cappedH + 10);

        // Light background for chart
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(ML, y - 2, TW, cappedH + 6, 2, 2, 'F');

        // Border
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.2);
        pdf.roundedRect(ML, y - 2, TW, cappedH + 6, 2, 2, 'S');

        // Center the chart
        const chartX = ML + (TW - chartW) / 2;
        pdf.addImage(chartData.base64, 'PNG', chartX, y, chartW, cappedH);
        y += cappedH + 10;
      }

    } else if (section.type === 'text') {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      setColor(C.text);

      // Check for numbered recommendations (1., 2., etc.)
      const text = sanitizeForPDF(section.text).trim();
      if (!text) { y += 3; continue; }

      // Handle numbered items specially
      const numberedMatch = text.match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        addPageIfNeeded(15);
        // Number badge
        const num = numberedMatch[1];
        const content = numberedMatch[2];

        pdf.setFillColor(...C.primary);
        pdf.circle(ML + 4, y - 1, 3.5, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        setColor([255, 255, 255]);
        pdf.text(num, ML + 4, y + 0.5, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        setColor(C.text);
        const lines = safeSplitText(pdf, content, TW - 14);
        pdf.text(lines, ML + 12, y);
        y += lines.length * 5.5 + 4;
      } else {
        // Regular paragraph
        const lines = safeSplitText(pdf, text, TW);
        for (let i = 0; i < lines.length; i++) {
          addPageIfNeeded(6);
          pdf.text(lines[i], ML, y);
          y += 5.5;
        }
        y += 3; // Paragraph spacing
      }
    }
  }

  // ─── FOOTER ON ALL PAGES ───
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    if (i === 1) continue; // Skip cover

    // Footer line
    pdf.setDrawColor(...C.line);
    pdf.setLineWidth(0.2);
    pdf.line(ML, H - 14, W - MR, H - 14);

    // Footer text
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`PULSE - ${companyName}`, ML, H - 9);
    pdf.text(`Seite ${i - 1} von ${totalPages - 1}`, W - MR, H - 9, { align: 'right' });
  }

  // Save
  const filename = `PULSE_Report_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
}

// ═══════════════════════════════════════════════════════════
// WORD GENERATION (Feature 2)
// ═══════════════════════════════════════════════════════════
async function generateWordDoc({ reportText, companyName, branche, recipientInfo, data, allKPIs, filename }) {
  const blocks = parseReportText(reportText);
  const children = [];
  const firstDatum = data[0]?.datum || '';
  const lastDatum = data[data.length - 1]?.datum || '';

  // Title page
  children.push(
    new Paragraph({ children: [new TextRun({ text: 'PULSE', size: 56, bold: true, color: '2563EB', font: 'Helvetica' })], alignment: AlignmentType.CENTER, spacing: { before: 800 } }),
    new Paragraph({ children: [new TextRun({ text: 'Performance Unified Liquidity & Strategy Engine', size: 20, color: '6B7280' })], alignment: AlignmentType.CENTER, spacing: { before: 100 } }),
    new Paragraph({ children: [new TextRun({ text: 'Management Report', size: 36, color: '1F2937' })], alignment: AlignmentType.CENTER, spacing: { before: 400 } }),
    new Paragraph({ children: [new TextRun({ text: companyName, size: 28, bold: true, color: '1F2937' })], alignment: AlignmentType.CENTER, spacing: { before: 200 } }),
    new Paragraph({ children: [new TextRun({ text: `${fmtMonthFull(firstDatum)} – ${fmtMonthFull(lastDatum)}`, size: 22, color: '6B7280' })], alignment: AlignmentType.CENTER, spacing: { before: 100 } }),
    new Paragraph({ children: [new TextRun({ text: `Erstellt am ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}`, size: 20, color: '6B7280' })], alignment: AlignmentType.CENTER, spacing: { before: 100 } }),
    new Paragraph({ children: [new TextRun({ text: recipientInfo.id !== 'general' ? `Adressat: ${recipientInfo.label}` : '', size: 20, color: '94A3B8' })], alignment: AlignmentType.CENTER, spacing: { before: 60 } }),
    new Paragraph({ children: [new PageBreak()] })
  );

  for (const block of blocks) {
    if (block.type === 'section_title') {
      children.push(new Paragraph({
        children: [new TextRun({ text: block.text, size: 28, bold: true, color: '0F172A' })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        keepNext: true, keepLines: true, // Feature 3: prevents orphaned headings
      }));
    } else if (block.type === 'text') {
      const text = block.text.trim();
      if (!text) continue;
      const numMatch = text.match(/^(\d+)\.\s+(.+)/);
      if (numMatch) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `${numMatch[1]}. `, size: 22, bold: true, color: '2563EB' }),
            new TextRun({ text: numMatch[2], size: 22, color: '1F2937' }),
          ],
          spacing: { after: 120 },
        }));
      } else {
        children.push(new Paragraph({
          children: [new TextRun({ text, size: 22, color: '1F2937' })],
          spacing: { after: 100 },
        }));
      }
    }
    // Charts: text note since images can't be easily embedded
    else if (block.type === 'chart') {
      const def = CHART_REGISTRY.find(c => c.id === block.chartId);
      if (def) {
        children.push(new Paragraph({
          children: [new TextRun({ text: `[Diagramm: ${def.title}]`, size: 20, italics: true, color: '6B7280' })],
          spacing: { before: 100, after: 100 },
        }));
      }
    }
  }

  // Footer
  children.push(new Paragraph({
    children: [new TextRun({ text: 'Automatisch erstellt mit PULSE – KI-gestütztes Controlling für KMU', size: 16, color: '94A3B8' })],
    alignment: AlignmentType.CENTER, spacing: { before: 600 },
  }));

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}

// ─── Parse report text into structured elements (robust version) ───
function parseReportText(text) {
  if (!text || typeof text !== 'string') return [];

  const elements = [];

  // Normalize line breaks
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split entire text by section/chart markers using global regex
  // This handles markers on their own line OR embedded in text
  const markerPattern = /\[\[SECTION:(.+?)\]\]|\[\[CHART:(.+?)\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = markerPattern.exec(normalized)) !== null) {
    // Text before this marker
    const before = normalized.slice(lastIndex, match.index).trim();
    if (before) {
      // Split into paragraphs
      for (const para of before.split('\n')) {
        const t = para.trim();
        elements.push({ type: 'text', text: t });
      }
    }

    if (match[1]) {
      // Section title
      elements.push({ type: 'section_title', text: match[1].trim() });
    } else if (match[2]) {
      // Chart
      elements.push({ type: 'chart', chartId: match[2].trim() });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last marker
  const remaining = normalized.slice(lastIndex).trim();
  if (remaining) {
    for (const para of remaining.split('\n')) {
      const t = para.trim();
      elements.push({ type: 'text', text: t });
    }
  }

  // If no markers were found at all, try fallback: split by lines
  if (elements.length === 0) {
    for (const line of normalized.split('\n')) {
      const t = line.trim();
      if (t) elements.push({ type: 'text', text: t });
      else elements.push({ type: 'text', text: '' });
    }
  }

  return elements;
}

export default ReportBuilder;
