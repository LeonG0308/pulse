import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, CartesianGrid, Legend,
  RadialBarChart, RadialBar, Treemap
} from 'recharts';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import {
  DEMO_DATA, DEMO_COMPANY, calcKPIs, getAmpel, detectAnomalies, applyScenario,
  fmtEur, fmtPct, fmtNum, fmtMonth, fmtMonthFull, buildWaterfall,
  loadData, saveData, loadSettings, saveSettings, loadScenarios, saveScenarios,
  DEFAULT_THRESHOLDS, heatColor, tooltipStyle, COLORS
} from './data';
import { ReportBuilder, HiddenChartRenderer } from './ReportBuilder';

// ═══════════════════════════════════════════
// Icons (inline SVG)
// ═══════════════════════════════════════════
const Icon = ({ d, size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const icons = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  analysis: 'M21 12h-4l-3 9L9 3l-3 9H2',
  ai: 'M12 2a10 10 0 1010 10A10 10 0 0012 2z M12 8v4l3 3',
  scenarios: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  chevDown: 'M6 9l6 6 6-6',
  plus: 'M12 5v14 M5 12h14',
  trash: 'M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6',
};

const PulseLogo = ({ size = 36 }) => (
  <img src="./icon-192.png" alt="PULSE" width={size} height={size} style={{ borderRadius: size > 40 ? 16 : 8 }} />
);

// ═══════════════════════════════════════════
// AnimatedNumber
// ═══════════════════════════════════════════
function AnimatedNumber({ value, format = fmtEur, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const start = ref.current || 0;
    const diff = value - start;
    const startTime = performance.now();
    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = value;
    }
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <span>{format(display)}</span>;
}

// ═══════════════════════════════════════════
// Custom Tooltip
// ═══════════════════════════════════════════
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: '#8892A4', fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: '#8892A4', fontSize: 11 }}>{p.name}:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12 }}>
            {typeof p.value === 'number' ? (p.value > 100 ? fmtEur(p.value) : fmtPct(p.value)) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════
// Sparkline (mini chart in KPI tile)
// ═══════════════════════════════════════════
const Sparkline = ({ data, color = COLORS.primary }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
      <defs>
        <linearGradient id={`sp-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sp-${color.replace('#','')})`} dot={false} isAnimationActive={false}/>
    </AreaChart>
  </ResponsiveContainer>
);

// ═══════════════════════════════════════════
// Gauge (half-circle)
// ═══════════════════════════════════════════
const Gauge = ({ value, max = 200, label, color }) => {
  const pct = Math.min(value / max, 1);
  const angle = pct * 180;
  const r = 70, cx = 80, cy = 80;
  const rad = (a) => (a - 180) * Math.PI / 180;
  const x1 = cx + r * Math.cos(rad(0)), y1 = cy + r * Math.sin(rad(0));
  const x2 = cx + r * Math.cos(rad(angle)), y2 = cy + r * Math.sin(rad(angle));
  const large = angle > 180 ? 1 : 0;
  return (
    <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
      <svg width="160" height="100" viewBox="0 0 160 100" style={{ margin: '0 auto', display: 'block' }}>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round"/>
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" style={{ transition: 'all 1s ease' }}/>
        <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-display)" fontSize="22" fontWeight="700">{fmtPct(value)}</text>
      </svg>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
    </div>
  );
};

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App() {
  const [view, setView] = useState('dashboard');
  const [data, setData] = useState([]);
  const [settings, setSettings] = useState(loadSettings());
  const [scenarios, setScenarios] = useState(loadScenarios());
  const [reportLoading, setReportLoading] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);

  useEffect(() => { const d = loadData(); if (d.length) setData(d); }, []);
  useEffect(() => { if (data.length) saveData(data); }, [data]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  const allKPIs = useMemo(() => data.map(calcKPIs).filter(Boolean), [data]);
  const latestKPI = allKPIs.length ? allKPIs[allKPIs.length - 1] : null;
  const prevKPI = allKPIs.length > 1 ? allKPIs[allKPIs.length - 2] : null;
  const anomalies = useMemo(() => detectAnomalies(data), [data]);
  const companyName = settings.companyName || 'Kein Unternehmen';

  const loadDemo = () => {
    setData(DEMO_DATA);
    setSettings(s => ({ ...s, companyName: DEMO_COMPANY.name, branche: DEMO_COMPANY.branche }));
  };

  // ─── Report Builder (see ReportBuilder.jsx) ───

  // ─── Navigation items ───
  const navItems = [
    { id: 'dashboard', icon: icons.dashboard, label: 'Dashboard' },
    { id: 'analysis', icon: icons.analysis, label: 'Analyse' },
    { id: 'ai', icon: icons.ai, label: 'KI-Assistent' },
    { id: 'scenarios', icon: icons.scenarios, label: 'Szenarien' },
    { id: 'settings', icon: icons.settings, label: 'Einstellungen' },
  ];

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo"><PulseLogo /></div>
        <div className="nav-items">
          {navItems.map(n => (
            <div key={n.id} className={`nav-item ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)}>
              <Icon d={n.icon} />
              <span className="nav-label">{n.label}</span>
            </div>
          ))}
        </div>
      </nav>

      {/* Mobile Tab Bar */}
      <div className="mobile-tab-bar">
        <div className="tab-bar-inner">
          {navItems.map(n => (
            <button key={n.id} className={`tab-item ${view === n.id ? 'active' : ''} ${n.id === 'ai' ? 'ai-tab' : ''}`} onClick={() => setView(n.id)}>
              <Icon d={n.icon} size={n.id === 'ai' ? 24 : 22} />
              {n.id !== 'ai' && <span>{n.label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {!data.length && view !== 'settings' ? (
          <EmptyState onLoadDemo={loadDemo} onGoSettings={() => setView('settings')} />
        ) : (
          <>
            {view === 'dashboard' && <Dashboard allKPIs={allKPIs} latestKPI={latestKPI} prevKPI={prevKPI} data={data} anomalies={anomalies} companyName={companyName} settings={settings} />}
            {view === 'analysis' && <Analysis allKPIs={allKPIs} latestKPI={latestKPI} data={data} />}
            {view === 'ai' && <AIChat allKPIs={allKPIs} data={data} settings={settings} companyName={companyName} />}
            {view === 'scenarios' && <Scenarios latestKPI={latestKPI} data={data} allKPIs={allKPIs} scenarios={scenarios} setScenarios={(s) => { setScenarios(s); saveScenarios(s); }} />}
            {view === 'settings' && <Settings data={data} setData={setData} settings={settings} setSettings={setSettings} onLoadDemo={loadDemo} />}
          </>
        )}
      </main>

      {/* Report Button */}
      {data.length > 0 && view !== 'ai' && (
        <button className="report-btn" onClick={() => setShowReportBuilder(true)} title="Professionellen Management Report erstellen">
          <Icon d={icons.download} size={18} color="var(--bg-base)" /> Report
        </button>
      )}

      {/* Report Builder Modal */}
      <ReportBuilder
        show={showReportBuilder}
        onClose={() => setShowReportBuilder(false)}
        data={data}
        allKPIs={allKPIs}
        latestKPI={latestKPI}
        settings={settings}
        companyName={companyName}
        anomalies={anomalies}
      />

      {/* Hidden PDF-optimized chart renderer */}
      <HiddenChartRenderer data={data} allKPIs={allKPIs} latestKPI={latestKPI} />
    </div>
  );
}

// ═══════════════════════════════════════════
// Empty State
// ═══════════════════════════════════════════
function EmptyState({ onLoadDemo, onGoSettings }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center', padding: 24 }}>
      <PulseLogo size={80} />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginTop: 20, marginBottom: 8 }}>Willkommen bei PULSE</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 420, marginBottom: 32, fontSize: 14 }}>Laden Sie Demo-Daten oder importieren Sie Ihre eigenen Finanzdaten, um das Controlling-Dashboard zu aktivieren.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-primary" onClick={onLoadDemo} style={{ fontSize: 15, padding: '14px 28px' }}>🚀 Demo-Daten laden</button>
        <button className="btn btn-secondary" onClick={onGoSettings} style={{ fontSize: 15, padding: '14px 28px' }}>📁 CSV importieren</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════
function Dashboard({ allKPIs, latestKPI, prevKPI, data, anomalies, companyName, settings }) {
  if (!latestKPI) return null;
  const thresholds = settings?.thresholds || DEFAULT_THRESHOLDS;

  const change = (key, prev, current) => {
    if (!prev || !prev[key] || !current[key]) return null;
    return ((current[key] - prev[key]) / Math.abs(prev[key])) * 100;
  };

  const kpiTiles = [
    { key: 'umsatz', label: 'Umsatz', value: latestKPI.umsatz, fmt: fmtEur, ampelKey: 'umsatz', plan: latestKPI.umsatz_plan },
    { key: 'ebit', label: 'EBIT', value: latestKPI.ebit, fmt: fmtEur, ampelKey: 'ebit' },
    { key: 'ebitMarge', label: 'EBIT-Marge', value: latestKPI.ebitMarge, fmt: fmtPct, ampelKey: 'ebitMarge' },
    { key: 'liq2', label: 'Liquidität 2°', value: latestKPI.liq2, fmt: fmtPct, ampelKey: 'liq2' },
    { key: 'ekQuote', label: 'EK-Quote', value: latestKPI.ekQuote, fmt: fmtPct, ampelKey: 'ekQuote' },
    { key: 'cashflow', label: 'Cashflow (op.)', value: latestKPI.cashflow, fmt: fmtEur, ampelKey: 'cashflow' },
    { key: 'personalQuote', label: 'Personalkosten', value: latestKPI.personalQuote, fmt: fmtPct, ampelKey: 'personalQuote' },
    { key: 'umsatzrentabilitaet', label: 'Umsatzrend.', value: latestKPI.umsatzrentabilitaet, fmt: fmtPct, ampelKey: 'umsatzrentabilitaet' },
  ];

  const chartData = allKPIs.slice(-12).map(k => ({
    name: fmtMonth(k.datum), umsatz: k.umsatz, ebit: k.ebit, marge: k.ebitMarge, plan: k.umsatz_plan
  }));

  const kostenData = [
    { name: 'Material', value: latestKPI.materialaufwand },
    { name: 'Personal', value: latestKPI.personalaufwand },
    { name: 'Sonstiges', value: latestKPI.sonst_aufwand },
    { name: 'AfA', value: latestKPI.abschreibungen },
    { name: 'Zinsen', value: latestKPI.zinsaufwand },
  ];

  // Trend table data (last 6 months)
  const trendMonths = allKPIs.slice(-6);
  const trendKPIs = [
    { key: 'umsatz', label: 'Umsatz', fmt: fmtEur },
    { key: 'ebit', label: 'EBIT', fmt: fmtEur },
    { key: 'ebitMarge', label: 'EBIT-Marge', fmt: fmtPct },
    { key: 'liq2', label: 'Liquidität 2°', fmt: fmtPct },
    { key: 'ekQuote', label: 'EK-Quote', fmt: fmtPct },
    { key: 'personalQuote', label: 'Personalkosten-Q.', fmt: fmtPct, inverted: true },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{companyName}</div>
          <div className="page-subtitle">Dashboard · {latestKPI ? fmtMonthFull(latestKPI.datum) : ''}</div>
        </div>
      </div>

      {/* Anomaly Banners */}
      {anomalies.map((a, i) => (
        <div key={i} className={`anomaly-banner ${a.severity}`}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{a.icon}</span>
          <span>{a.text}</span>
        </div>
      ))}

      {/* KPI Tiles */}
      <div className="kpi-grid">
        {kpiTiles.map((t, i) => {
          const ch = change(t.key, prevKPI, latestKPI);
          const ampel = getAmpel(t.ampelKey, t.value, t.plan, thresholds);
          const sparkData = allKPIs.slice(-12).map(k => ({ v: k[t.key] || 0 }));
          const sparkColor = ampel === 'red' ? COLORS.danger : ampel === 'yellow' ? COLORS.secondary : COLORS.success;
          return (
            <div key={t.key} className="kpi-tile" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="kpi-label"><span className={`ampel ${ampel}`} />{t.label}</div>
              <div className="kpi-value"><AnimatedNumber value={t.value} format={t.fmt} /></div>
              {ch !== null && (
                <span className={`kpi-change ${ch >= 0 ? 'positive' : 'negative'}`}>
                  {ch >= 0 ? '↑' : '↓'} {Math.abs(ch).toFixed(1)}%
                </span>
              )}
              <div className="kpi-sparkline"><Sparkline data={sparkData} color={sparkColor} /></div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">Umsatz- & Ergebnisentwicklung</div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${v.toFixed(0)}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="umsatz" name="Umsatz" fill={COLORS.primary} radius={[4,4,0,0]} opacity={0.8} barSize={24} />
              <Bar yAxisId="left" dataKey="plan" name="Plan" fill="var(--border-light)" radius={[4,4,0,0]} opacity={0.4} barSize={24} />
              <Line yAxisId="left" dataKey="ebit" name="EBIT" stroke={COLORS.secondary} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.secondary }} />
              <Line yAxisId="right" dataKey="marge" name="EBIT-Marge" stroke={COLORS.success} strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Kostenstruktur</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={kostenData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} strokeWidth={0}>
                {kostenData.map((_, i) => <Cell key={i} fill={COLORS.donut[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Table */}
      <div className="chart-card">
        <div className="chart-title">Trend der letzten 6 Monate</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="trend-table">
            <thead>
              <tr>
                <th>KPI</th>
                {trendMonths.map(k => <th key={k.datum}>{fmtMonth(k.datum)}</th>)}
              </tr>
            </thead>
            <tbody>
              {trendKPIs.map(t => {
                const vals = trendMonths.map(k => k[t.key]);
                const min = Math.min(...vals), max = Math.max(...vals);
                return (
                  <tr key={t.key}>
                    <td className="kpi-name">{t.label}</td>
                    {trendMonths.map(k => (
                      <td key={k.datum}>
                        <span className="heatmap-cell" style={{ background: heatColor(k[t.key], min, max, t.inverted) }}>
                          {t.fmt(k[t.key])}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// ANALYSIS
// ═══════════════════════════════════════════
function Analysis({ allKPIs, latestKPI, data }) {
  const [tab, setTab] = useState('bilanz');
  if (!latestKPI) return <p style={{ color: 'var(--text-muted)' }}>Keine Daten verfügbar.</p>;

  const tabs = [
    { id: 'bilanz', label: 'Bilanz' },
    { id: 'liquiditaet', label: 'Liquidität' },
    { id: 'rentabilitaet', label: 'Rentabilität' },
    { id: 'dupont', label: 'DuPont-Schema' },
    { id: 'sollIst', label: 'Soll-Ist' },
  ];

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Analyse</div><div className="page-subtitle">Tiefgehende Auswertungen & Kennzahlensysteme</div></div>
      </div>

      <div className="analysis-tabs">
        {tabs.map(t => <button key={t.id} className={`analysis-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      {tab === 'bilanz' && <BilanzAnalysis kpi={latestKPI} />}
      {tab === 'liquiditaet' && <LiquiditaetAnalysis kpi={latestKPI} allKPIs={allKPIs} />}
      {tab === 'rentabilitaet' && <RentabilitaetAnalysis kpi={latestKPI} allKPIs={allKPIs} />}
      {tab === 'dupont' && <DuPontAnalysis kpi={latestKPI} />}
      {tab === 'sollIst' && <SollIstAnalysis allKPIs={allKPIs} />}
    </div>
  );
}

function BilanzAnalysis({ kpi }) {
  const aktivData = [
    { name: 'Anlagevermögen', value: kpi.anlagevermoegen, fill: COLORS.primary },
    { name: 'Vorräte', value: kpi.vorraete, fill: COLORS.secondary },
    { name: 'Forderungen', value: kpi.kurzfr_forderungen, fill: COLORS.success },
    { name: 'Flüssige Mittel', value: kpi.fluessige_mittel, fill: '#A855F7' },
  ];
  const passivData = [
    { name: 'Eigenkapital', value: kpi.eigenkapital, fill: COLORS.success },
    { name: 'Langfr. FK', value: kpi.langfr_verbindlichkeiten, fill: COLORS.secondary },
    { name: 'Kurzfr. FK', value: kpi.kurzfr_verbindlichkeiten, fill: COLORS.danger },
  ];

  const kennzahlen = [
    { label: 'Eigenkapitalquote', value: kpi.ekQuote, color: getAmpel('ekQuote', kpi.ekQuote) === 'green' ? COLORS.success : COLORS.danger },
    { label: 'Fremdkapitalquote', value: kpi.fkQuote, color: COLORS.secondary },
    { label: 'Verschuldungsgrad', value: kpi.verschuldungsgrad, color: kpi.verschuldungsgrad > 200 ? COLORS.danger : COLORS.secondary },
    { label: 'Anlagendeckung I', value: kpi.anlagendeckung1, color: kpi.anlagendeckung1 >= 100 ? COLORS.success : COLORS.danger },
    { label: 'Anlagendeckung II', value: kpi.anlagendeckung2, color: kpi.anlagendeckung2 >= 100 ? COLORS.success : COLORS.danger },
  ];

  return (
    <div>
      <div className="charts-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="chart-card">
          <div className="chart-title">Aktiva ({fmtEur(kpi.gesamtkapital)})</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={aktivData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                {aktivData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="chart-title">Passiva ({fmtEur(kpi.gesamtkapital)})</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={passivData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                {passivData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card mt-16">
        <div className="chart-title">Bilanzkennzahlen</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {kennzahlen.map(k => (
            <div key={k.label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: k.color }}>{fmtPct(k.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiquiditaetAnalysis({ kpi, allKPIs }) {
  const liqColor = (v, t) => v >= t ? COLORS.success : v >= t * 0.8 ? COLORS.secondary : COLORS.danger;
  const wcData = allKPIs.slice(-12).map(k => ({ name: fmtMonth(k.datum), wc: k.workingCapital }));

  const waterfallData = buildWaterfall(kpi);
  let cumulative = 0;
  const wfBars = waterfallData.map(d => {
    if (d.type.startsWith('total')) return { ...d, bottom: 0, bar: d.value };
    const bottom = d.value >= 0 ? cumulative : cumulative + d.value;
    cumulative += d.value;
    return { ...d, bottom: Math.max(0, bottom), bar: Math.abs(d.value) };
  });

  return (
    <div>
      <div className="gauge-row" style={{ marginBottom: 24 }}>
        <Gauge value={kpi.liq1} max={100} label="Liquidität 1. Grades" color={liqColor(kpi.liq1, 20)} />
        <Gauge value={kpi.liq2} max={200} label="Liquidität 2. Grades" color={liqColor(kpi.liq2, 100)} />
        <Gauge value={kpi.liq3} max={250} label="Liquidität 3. Grades" color={liqColor(kpi.liq3, 120)} />
      </div>

      <div className="charts-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="chart-card">
          <div className="chart-title">Working Capital Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={wcData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="wcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="wc" name="Working Capital" stroke={COLORS.primary} fill="url(#wcGrad)" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Cashflow-Waterfall ({fmtMonthFull(kpi.datum)})</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={wfBars} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="bottom" stackId="a" fill="transparent" />
              <Bar dataKey="bar" stackId="a" name="Betrag" radius={[4,4,0,0]}>
                {wfBars.map((d, i) => (
                  <Cell key={i} fill={d.type === 'positive' || d.type === 'total-pos' ? COLORS.success : COLORS.danger} opacity={d.type.startsWith('total') ? 1 : 0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function RentabilitaetAnalysis({ kpi, allKPIs }) {
  const rentData = allKPIs.slice(-12).map(k => ({ name: fmtMonth(k.datum), ur: k.umsatzrentabilitaet, roi: k.roi, em: k.ebitMarge }));

  // Deckungsbeitragsrechnung
  const dbData = [
    { name: 'Umsatz', value: kpi.umsatz },
    { name: 'DB I (nach Material)', value: kpi.umsatz - kpi.materialaufwand },
    { name: 'DB II (nach Personal)', value: kpi.umsatz - kpi.materialaufwand - kpi.personalaufwand },
    { name: 'Betriebsergebnis', value: kpi.gewinn },
  ];

  return (
    <div>
      <div className="chart-card mb-24">
        <div className="chart-title">Rentabilitätskennzahlen im Zeitverlauf</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${v.toFixed(0)}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Line dataKey="em" name="EBIT-Marge" stroke={COLORS.primary} strokeWidth={2.5} dot={{ r: 3 }} />
            <Line dataKey="ur" name="Umsatzrentabilität" stroke={COLORS.success} strokeWidth={2} dot={{ r: 3 }} />
            <Line dataKey="roi" name="ROI" stroke={COLORS.secondary} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
            <Legend formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{v}</span>} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <div className="chart-title">Deckungsbeitragsrechnung ({fmtMonthFull(kpi.datum)})</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dbData} layout="vertical" barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={140} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Betrag" radius={[0,4,4,0]}>
              {dbData.map((d, i) => <Cell key={i} fill={d.value >= 0 ? COLORS.donut[i] : COLORS.danger} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── DuPont Schema ───
function DuPontAnalysis({ kpi }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  const Node = ({ label, value, fmt = fmtPct, nodeKey, children, operator }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div className="dupont-node" onClick={() => children && toggle(nodeKey)} style={{ cursor: children ? 'pointer' : 'default' }}>
        <div className="node-label">{label}</div>
        <div className="node-value">{fmt(value)}</div>
        {children && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{expanded[nodeKey] ? '▲ einklappen' : '▼ aufklappen'}</div>}
      </div>
      {operator && <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{operator}</div>}
      {children && expanded[nodeKey] && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', animation: 'tileIn 0.3s ease both' }}>
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="chart-card">
        <div className="chart-title">Interaktives DuPont-Kennzahlensystem</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>Klicken Sie auf einen Knoten, um die Unterkomponenten aufzuklappen.</p>
        <div className="dupont-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Node label="Gesamtkapitalrentabilität (ROI)" value={kpi.roi} nodeKey="roi" operator="=" children={<>
            <Node label="Umsatzrentabilität" value={kpi.umsatzrentabilitaet} nodeKey="ur" operator="×" children={<>
              <Node label="Gewinn" value={kpi.gewinn} fmt={fmtEur} nodeKey="gewinn" children={<>
                <Node label="Umsatz" value={kpi.umsatz} fmt={fmtEur} />
                <div style={{ alignSelf: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 18 }}>−</div>
                <Node label="Gesamtkosten" value={kpi.gesamtkosten} fmt={fmtEur} nodeKey="kosten" children={<>
                  <Node label="Material" value={kpi.materialaufwand} fmt={fmtEur} />
                  <Node label="Personal" value={kpi.personalaufwand} fmt={fmtEur} />
                  <Node label="Sonstiges" value={kpi.sonst_aufwand} fmt={fmtEur} />
                  <Node label="AfA" value={kpi.abschreibungen} fmt={fmtEur} />
                  <Node label="Zinsen" value={kpi.zinsaufwand} fmt={fmtEur} />
                </>} />
              </>} />
              <div style={{ alignSelf: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 18 }}>÷</div>
              <Node label="Umsatz" value={kpi.umsatz} fmt={fmtEur} />
            </>} />
            <Node label="Kapitalumschlag" value={kpi.kapitalumschlag} fmt={v => `${v.toFixed(2)}x`} nodeKey="ku" children={<>
              <Node label="Umsatz" value={kpi.umsatz} fmt={fmtEur} />
              <div style={{ alignSelf: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 18 }}>÷</div>
              <Node label="Gesamtkapital" value={kpi.gesamtkapital} fmt={fmtEur} nodeKey="gk" children={<>
                <Node label="Anlagevermögen" value={kpi.anlagevermoegen} fmt={fmtEur} />
                <div style={{ alignSelf: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 18 }}>+</div>
                <Node label="Umlaufvermögen" value={kpi.umlaufvermoegen} fmt={fmtEur} nodeKey="uv" children={<>
                  <Node label="Vorräte" value={kpi.vorraete} fmt={fmtEur} />
                  <Node label="Forderungen" value={kpi.kurzfr_forderungen} fmt={fmtEur} />
                  <Node label="Kasse/Bank" value={kpi.fluessige_mittel} fmt={fmtEur} />
                </>} />
              </>} />
            </>} />
          </>} />
        </div>
      </div>
    </div>
  );
}

function SollIstAnalysis({ allKPIs }) {
  const last12 = allKPIs.slice(-12);
  const abwData = last12.map(k => ({
    name: fmtMonth(k.datum),
    ist: k.umsatz,
    soll: k.umsatz_plan,
    abw: k.umsatz_plan ? ((k.umsatz - k.umsatz_plan) / k.umsatz_plan * 100) : 0
  }));

  return (
    <div>
      <div className="chart-card mb-24">
        <div className="chart-title">Soll-Ist-Vergleich Umsatz</div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={abwData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${v.toFixed(0)}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="left" dataKey="ist" name="Ist-Umsatz" fill={COLORS.primary} radius={[4,4,0,0]} barSize={20} />
            <Bar yAxisId="left" dataKey="soll" name="Soll-Umsatz" fill="var(--border-light)" radius={[4,4,0,0]} barSize={20} opacity={0.5} />
            <Line yAxisId="right" dataKey="abw" name="Abweichung %" stroke={COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} />
            <Legend formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{v}</span>} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <div className="chart-title">Abweichungsanalyse je Monat</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={abwData} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${v.toFixed(0)}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="abw" name="Abweichung %" radius={[4,4,0,0]}>
              {abwData.map((d, i) => <Cell key={i} fill={d.abw >= 0 ? COLORS.success : COLORS.danger} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// AI CHAT
// ═══════════════════════════════════════════
function AIChat({ allKPIs, data, settings, companyName }) {
  const [messages, setMessages] = useState([
    { role: 'ai', content: `Hallo! Ich bin der PULSE KI-Assistent. Stellen Sie mir Fragen zu den Finanzdaten von **${companyName}** – ich analysiere die Daten und liefere konkrete Einschätzungen.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);
  const apiKey = settings.apiKey || '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';

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const suggestions = [
    'Fasse die finanzielle Lage zusammen',
    'Warum sind die Materialkosten gestiegen?',
    'Welche Risiken siehst du?',
    'Optimierungspotenziale?',
    'Vergleiche Q1 und Q3 2025',
  ];

  const quickActions = [
    { label: '📋 Management Summary', prompt: 'Erstelle ein Management Summary der aktuellen finanziellen Lage. Strukturiere es mit: 1. Executive Summary (3 Sätze), 2. Stärken, 3. Schwächen, 4. Empfehlungen.' },
    { label: '⚠️ Risikoanalyse', prompt: 'Identifiziere die drei größten finanziellen Risiken basierend auf den Daten. Nenne konkrete Zahlen und bewerte die Dringlichkeit.' },
    { label: '💡 Optimierung', prompt: 'Nenne die drei wirkungsvollsten Maßnahmen zur Verbesserung der finanziellen Kennzahlen. Beziehe dich auf konkrete Schwachstellen in den Daten.' },
  ];

  const buildSystemPrompt = () => {
    const latest = allKPIs[allKPIs.length - 1];
    const last6 = allKPIs.slice(-6);
    return `Du bist PULSE AI, ein hochspezialisierter Controlling- und Finanzanalyse-Assistent.
Du analysierst die Finanzdaten des Unternehmens "${companyName}" (Branche: ${settings.branche || 'nicht angegeben'}).

AKTUELLE KENNZAHLEN (${latest ? fmtMonthFull(latest.datum) : 'N/A'}):
${latest ? `- Umsatz: ${fmtEur(latest.umsatz)} (Plan: ${fmtEur(latest.umsatz_plan)})
- EBIT: ${fmtEur(latest.ebit)} | EBIT-Marge: ${fmtPct(latest.ebitMarge)}
- Materialaufwand: ${fmtEur(latest.materialaufwand)} | Personalaufwand: ${fmtEur(latest.personalaufwand)}
- Liquidität 2. Grades: ${fmtPct(latest.liq2)}
- Eigenkapitalquote: ${fmtPct(latest.ekQuote)}
- Operativer Cashflow: ${fmtEur(latest.cashflow)}
- Personalkosten-Quote: ${fmtPct(latest.personalQuote)}
- Umsatzrentabilität: ${fmtPct(latest.umsatzrentabilitaet)}
- ROI: ${fmtPct(latest.roi)}
- Working Capital: ${fmtEur(latest.workingCapital)}` : 'Keine Daten verfügbar.'}

ENTWICKLUNG DER LETZTEN 6 MONATE:
${last6.map(k => `${fmtMonthFull(k.datum)}: Umsatz ${fmtEur(k.umsatz)}, EBIT ${fmtEur(k.ebit)}, Liq2 ${fmtPct(k.liq2)}, EK-Quote ${fmtPct(k.ekQuote)}`).join('\n')}

VOLLSTÄNDIGE MONATSDATEN (JSON):
${JSON.stringify(data.slice(-12), null, 0)}

Antworte auf Deutsch. Sei präzise, nenne immer konkrete Zahlen aus den Daten. Verwende **fett** für wichtige Begriffe. Halte Antworten kompakt aber gehaltvoll.`;
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Determine if this is a complex task that benefits from extended thinking
    const isComplex = text.includes('Management Summary') || text.includes('Risikoanalyse') || 
      text.includes('Optimierung') || text.includes('Empfehlungen') || text.includes('Maßnahmen') ||
      text.length > 200;

    const chatHistory = messages.filter((m, i) => i > 0).map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content
    }));

    const body = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: isComplex ? 16000 : 4096,
      system: buildSystemPrompt(),
      messages: [...chatHistory, { role: 'user', content: text }],
    };

    // Enable extended thinking for complex analyses
    if (isComplex) {
      body.thinking = { type: 'enabled', budget_tokens: 8000 };
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error.message || 'API-Fehler');
      }
      // Extract text blocks (skip thinking blocks)
      const textBlocks = (json.content || []).filter(b => b.type === 'text');
      const aiText = textBlocks.map(b => b.text).join('\n') || 'Keine Antwort erhalten.';
      setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: `Fehler: ${err.message}. Bitte prüfen Sie den API-Key in den Einstellungen.` }]);
    }
    setLoading(false);
  };

  const formatMsg = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">KI-Assistent</div><div className="page-subtitle">Natürlichsprachige Analyse Ihrer Finanzdaten</div></div>
      </div>

      <div className="card chat-container">
        <div className="quick-actions">
          {quickActions.map((qa, i) => (
            <button key={i} className="quick-action-btn" onClick={() => sendMessage(qa.prompt)}>{qa.label}</button>
          ))}
        </div>

        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role === 'user' ? 'user' : 'ai'}`} dangerouslySetInnerHTML={{ __html: formatMsg(m.content) }} />
          ))}
          {loading && (
            <div className="chat-msg ai">
              <div className="typing-indicator">
                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        <div className="chat-input-area">
          <div className="chat-suggestions">
            {suggestions.map((s, i) => <span key={i} className="chat-chip" onClick={() => sendMessage(s)}>{s}</span>)}
          </div>
          <div className="chat-input-row">
            <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage(input)} placeholder="Stellen Sie eine Frage zu Ihren Daten..." />
            <button className="chat-send" onClick={() => sendMessage(input)} disabled={!input.trim() || loading}>Senden</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// SCENARIOS
// ═══════════════════════════════════════════
function Scenarios({ latestKPI, data, allKPIs, scenarios, setScenarios }) {
  const [deltas, setDeltas] = useState({ umsatz: 0, material: 0, personal: 0, sonstige: 0 });
  const [activeScenario, setActiveScenario] = useState('custom');
  const [savedScenarios, setSavedScenarios] = useState(scenarios || {});
  const lastRow = data[data.length - 1];
  const scenarioRow = lastRow ? applyScenario(lastRow, deltas) : null;
  const scenarioKPIs = scenarioRow ? calcKPIs(scenarioRow) : null;

  // Feature 6: Load custom presets from localStorage, with defaults as fallback
  const defaultPresets = {
    bestCase: { label: 'Best Case', deltas: { umsatz: 20, material: -10, personal: 0, sonstige: -5 } },
    worstCase: { label: 'Worst Case', deltas: { umsatz: -25, material: 15, personal: 5, sonstige: 10 } },
    realistic: { label: 'Realistisch', deltas: { umsatz: 5, material: 3, personal: 2, sonstige: 1 } },
  };
  const [customPresets, setCustomPresets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pulse_presets')) || defaultPresets; }
    catch { return defaultPresets; }
  });

  const presets = {
    custom: { label: 'Individuell', deltas: deltas },
    ...customPresets,
  };

  const selectPreset = (key) => {
    setActiveScenario(key);
    if (key !== 'custom') setDeltas(presets[key].deltas);
  };

  // Feature 6: Save current sliders as a preset
  const saveCurrentAsPreset = (key) => {
    const updated = { ...customPresets, [key]: { ...customPresets[key], deltas: { ...deltas } } };
    setCustomPresets(updated);
    localStorage.setItem('pulse_presets', JSON.stringify(updated));
  };

  // Feature 6: Rename preset (takes name directly)
  const renamePreset = (key, newName) => {
    if (!newName) return;
    const updated = { ...customPresets, [key]: { ...customPresets[key], label: newName } };
    setCustomPresets(updated);
    localStorage.setItem('pulse_presets', JSON.stringify(updated));
  };

  // Feature 6: Reset presets to defaults
  const resetPresets = () => {
    setCustomPresets(defaultPresets);
    localStorage.removeItem('pulse_presets');
  };

  const sliders = [
    { key: 'umsatz', label: 'Umsatzveränderung', min: -50, max: 50 },
    { key: 'material', label: 'Materialkosten', min: -30, max: 30 },
    { key: 'personal', label: 'Personalkosten', min: -30, max: 30 },
    { key: 'sonstige', label: 'Sonstige Kosten', min: -30, max: 30 },
  ];

  const compareKPIs = (kpiKey, label, fmt = fmtEur) => {
    const original = latestKPI ? latestKPI[kpiKey] : 0;
    const scenario = scenarioKPIs ? scenarioKPIs[kpiKey] : 0;
    const diff = original ? ((scenario - original) / Math.abs(original) * 100) : 0;
    return { label, original, scenario, diff, fmt };
  };

  const compareRows = [
    compareKPIs('umsatz', 'Umsatz', fmtEur),
    compareKPIs('ebit', 'EBIT', fmtEur),
    compareKPIs('ebitMarge', 'EBIT-Marge', fmtPct),
    compareKPIs('gewinn', 'Gewinn', fmtEur),
    compareKPIs('umsatzrentabilitaet', 'Umsatzrend.', fmtPct),
    compareKPIs('cashflow', 'Cashflow', fmtEur),
    compareKPIs('personalQuote', 'Personalkosten-Q.', fmtPct),
  ];

  // Build forecast chart data
  const forecastData = allKPIs.slice(-6).map(k => ({ name: fmtMonth(k.datum), umsatz: k.umsatz, type: 'Ist' }));
  if (scenarioKPIs) {
    for (let i = 1; i <= 6; i++) {
      forecastData.push({
        name: `+${i}M`,
        forecast: scenarioKPIs.umsatz * (1 + (i - 1) * (deltas.umsatz / 100) * 0.08),
        type: 'Prognose',
      });
    }
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Szenario-Simulator</div><div className="page-subtitle">What-If-Analysen & Echtzeit-Prognosen</div></div>
      </div>

      <div className="scenario-layout">
        {/* Slider Panel */}
        <div className="slider-panel">
          <div className="scenario-tabs">
            {Object.entries(presets).map(([key, p]) => (
              <button key={key} className={`scenario-tab-btn ${activeScenario === key ? 'active' : ''}`} onClick={() => selectPreset(key)}>{p.label}</button>
            ))}
          </div>
          {/* Feature 6: Save/Reset/Rename preset buttons */}
          {activeScenario !== 'custom' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <button className="mini-btn" onClick={() => saveCurrentAsPreset(activeScenario)}>Preset speichern</button>
              <button className="mini-btn" onClick={() => {
                const name = window.prompt('Neuer Name:', presets[activeScenario]?.label);
                if (name?.trim()) renamePreset(activeScenario, name.trim());
              }}>Umbenennen</button>
              <button className="mini-btn" onClick={resetPresets}>Standard</button>
            </div>
          )}

          {sliders.map(s => (
            <div key={s.key} className="slider-group">
              <div className="slider-label">
                <span>{s.label}</span>
                <span className={`slider-value ${deltas[s.key] > 0 ? 'positive' : deltas[s.key] < 0 ? 'negative' : 'neutral'}`}>
                  {deltas[s.key] > 0 ? '+' : ''}{deltas[s.key]}%
                </span>
              </div>
              <input type="range" min={s.min} max={s.max} value={deltas[s.key]} onChange={e => { setDeltas(d => ({ ...d, [s.key]: +e.target.value })); setActiveScenario('custom'); }} />
            </div>
          ))}

          <button className="btn btn-secondary" style={{ width: '100%', marginTop: 12 }} onClick={() => setDeltas({ umsatz: 0, material: 0, personal: 0, sonstige: 0 })}>Zurücksetzen</button>
        </div>

        {/* Results */}
        <div>
          {/* KPI Comparison */}
          <div className="chart-card mb-24">
            <div className="chart-title">Kennzahlen-Vergleich: Ist vs. Szenario</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="trend-table">
                <thead>
                  <tr><th>KPI</th><th>Ist-Wert</th><th>Szenario</th><th>Veränderung</th></tr>
                </thead>
                <tbody>
                  {compareRows.map(r => (
                    <tr key={r.label}>
                      <td className="kpi-name">{r.label}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{r.fmt(r.original)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: r.diff >= 0 ? 'var(--success)' : 'var(--danger)' }}>{r.fmt(r.scenario)}</td>
                      <td><span className={`kpi-change ${r.diff >= 0 ? 'positive' : 'negative'}`}>{r.diff >= 0 ? '↑' : '↓'} {Math.abs(r.diff).toFixed(1)}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="chart-card">
            <div className="chart-title">Umsatzprognose</div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="umsatz" name="Ist-Umsatz" fill={COLORS.primary} radius={[4,4,0,0]} barSize={28} />
                <Line dataKey="forecast" name="Prognose" stroke={COLORS.secondary} strokeWidth={2.5} strokeDasharray="8 4" dot={{ r: 4, fill: COLORS.secondary }} />
                <Legend formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{v}</span>} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════
// ─── Smart Column Matching ───
const COLUMN_ALIASES = {
  datum: ['datum','date','monat','month','periode','period','zeitraum','monate','buchungsmonat','stichtag'],
  umsatz: ['umsatz','umsatzerlöse','umsatzerloese','umsatzerlös','erlöse','erloese','revenue','sales','gesamtleistung','umsatz_gesamt','umsatz gesamt','umsatzerlöse (zeile 1)','leistung'],
  umsatz_plan: ['umsatz_plan','plan','plan_umsatz','planumsatz','soll','soll_umsatz','budget','target','plan-umsatz','planzahl'],
  materialaufwand: ['materialaufwand','material','materialkosten','material_aufwand','wareneinsatz','mat_wareneinsatz','material- und wareneinsatz','material-/wareneinsatz','materialeinsatz','wareneinkauf','rohstoffe','material- u. wareneinsatz','materialaufwand/wareneinsatz'],
  personalaufwand: ['personalaufwand','personal','personalkosten','personal_aufwand','löhne','loehne','gehälter','gehaelter','löhne und gehälter','lohnkosten','personalkosten gesamt','personalaufw.','personalaufwand (zeile 10)'],
  sonst_aufwand: ['sonst_aufwand','sonstiges','sonstige_aufwendungen','sonstige betriebliche aufwendungen','sonst. betriebl. aufwendungen','sonstige kosten','sonstige aufwend.','sonst. aufwand','sba','sonst.betr.aufwand'],
  abschreibungen: ['abschreibungen','afa','abschr','abschreibung','abschreibungen (zeile 12)','abschr.','absetzung'],
  zinsaufwand: ['zinsaufwand','zinsen','zinskosten','zins','zinsaufwendungen','zinsaufw.','zinsen u.ä.','zinsen und ähnl. aufwendungen','zinsergebnis'],
  fluessige_mittel: ['fluessige_mittel','flüssige_mittel','kasse','bank','liquide_mittel','kasse_bank','bankguthaben','kassenbestand','flüssige mittel','kasse und bank','zahlungsmittel','guthaben bei kreditinstituten','liquide mittel'],
  kurzfr_forderungen: ['kurzfr_forderungen','forderungen','ford','forderungen_kfr','kurzfristige_forderungen','forderungen aus lul','forderungen aus lieferungen','ford. lul','ford. a. lul','forderungen a. ll'],
  vorraete: ['vorraete','vorräte','lager','lagerbestand','bestand','warenbestand','roh_hilfs_betriebsstoffe','vorräte gesamt'],
  kurzfr_verbindlichkeiten: ['kurzfr_verbindlichkeiten','kfverb','kurzfristige_verbindlichkeiten','verb_kfr','kurzfr. verbindlichkeiten','verbindlichkeiten kfr.','verb. aus lul','verb. a. lul','kurzfr.verb.','verbindlichkeiten (kurzfristig)'],
  langfr_verbindlichkeiten: ['langfr_verbindlichkeiten','lfverb','langfristige_verbindlichkeiten','verb_lfr','darlehen','bankdarlehen','langfr. verbindlichkeiten','langfr.verb.','verbindlichkeiten (langfristig)','verbindl. ggü. kreditinst.'],
  eigenkapital: ['eigenkapital','ek','equity','eigenkapital_gesamt','gezeichnetes kapital + rücklagen','eigenkapital gesamt','ek gesamt','eigenk.'],
  anlagevermoegen: ['anlagevermoegen','anlagevermögen','av','anlagen','sachanlagen','anlagev.','anlagevermögen gesamt','immaterielle + sachanlagen'],
  umsatz_a: ['umsatz_a','umsatz_produkt_a','produkt_a','segment_a','sparte_a','produktgruppe_a','umsatz produkt a','erlöse produkt a'],
  umsatz_b: ['umsatz_b','umsatz_produkt_b','produkt_b','segment_b','sparte_b','produktgruppe_b','umsatz produkt b','erlöse produkt b'],
  umsatz_c: ['umsatz_c','umsatz_produkt_c','produkt_c','segment_c','sparte_c','produktgruppe_c','umsatz produkt c','erlöse produkt c'],
};

function fuzzyMatchColumn(header) {
  const clean = header.trim().toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9äöüß ]/g, ' ').replace(/\s+/g,' ').trim();
  const cleanOriginal = header.trim().toLowerCase();

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const a = alias.toLowerCase();
      if (cleanOriginal === a || clean === a || cleanOriginal.includes(a) || clean.includes(a.replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss'))) {
        return field;
      }
    }
  }
  return null;
}

function parseNumericValue(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  // Handle German number format: 1.234.567,89 → 1234567.89
  // Also handle negative with parentheses: (1.234) → -1234
  let neg = false;
  let cleaned = s;
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) { neg = true; cleaned = cleaned.slice(1, -1); }
  if (cleaned.startsWith('-')) { neg = true; cleaned = cleaned.slice(1); }
  // Remove currency symbols and whitespace
  cleaned = cleaned.replace(/[€$\s]/g, '');
  // Detect format: if last separator is comma and has 1-2 digits after → German format
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  if (lastComma > lastDot) {
    // German: 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // English or just dots as thousands: 1,234.56 or 1,234,567
    cleaned = cleaned.replace(/,/g, '');
  }
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return neg ? -num : num;
}

function Settings({ data, setData, settings, setSettings, onLoadDemo }) {
  const [dragOver, setDragOver] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [importDetails, setImportDetails] = useState(null);
  const fileRef = useRef();

  // Feature 8: Unified file handler for CSV + Excel
  const processRows = (headers, rows) => {
    if (!rows.length) {
      setImportStatus('❌ Keine Daten gefunden.');
      return;
    }

    const mapping = {};
    const unmapped = [];
    const mapped = [];

    for (const h of headers) {
      const match = fuzzyMatchColumn(h);
      if (match && !mapping[match]) {
        mapping[match] = h;
        mapped.push({ original: h, mapped: match });
      } else if (!match) {
        unmapped.push(h);
      }
    }

    const hasDatum = !!mapping.datum;
    const hasUmsatz = !!mapping.umsatz;

    if (!hasDatum || !hasUmsatz) {
      setImportStatus('❌ Pflichtfelder nicht erkannt: Benötigt werden mindestens "Datum" und "Umsatz".');
      setImportDetails({ mapped, unmapped, total: headers.length });
      return;
    }

    const importedData = rows.map(row => {
      const r = {};
      for (const [field, originalHeader] of Object.entries(mapping)) {
        const rawVal = row[originalHeader];
        if (field === 'datum') {
          r[field] = rawVal ? String(rawVal).trim() : '';
        } else {
          r[field] = parseNumericValue(rawVal);
        }
      }
      for (const field of Object.keys(COLUMN_ALIASES)) {
        if (!(field in r)) r[field] = 0;
      }
      for (const costField of ['materialaufwand','personalaufwand','sonst_aufwand','abschreibungen','zinsaufwand']) {
        r[costField] = Math.abs(r[costField]);
      }
      return r;
    }).filter(r => r.datum && r.datum.length > 0);

    if (!importedData.length) {
      setImportStatus('❌ Keine gültigen Zeilen mit Datum gefunden.');
      return;
    }

    const guv = ['umsatz','materialaufwand','personalaufwand','sonst_aufwand','abschreibungen','zinsaufwand'].filter(f => mapping[f]).length;
    const bilanz = ['fluessige_mittel','kurzfr_forderungen','vorraete','kurzfr_verbindlichkeiten','langfr_verbindlichkeiten','eigenkapital','anlagevermoegen'].filter(f => mapping[f]).length;

    setData(importedData);
    setImportStatus(`✅ ${importedData.length} Monate importiert – ${mapped.length} von ${headers.length} Spalten erkannt.`);
    setImportDetails({ mapped, unmapped, total: headers.length, rows: importedData.length, guv, bilanz, hasGuV: guv >= 3, hasBilanz: bilanz >= 3 });
  };

  const handleCSV = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();

    // Feature 8: Excel import
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' });
          if (jsonData.length) {
            processRows(Object.keys(jsonData[0]), jsonData);
          } else {
            setImportStatus('❌ Keine Daten in der Excel-Datei gefunden.');
          }
        } catch (err) {
          setImportStatus('❌ Fehler beim Lesen der Excel-Datei: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // CSV handling (original)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data?.length) {
          setImportStatus('❌ Keine Daten in der CSV gefunden.');
          return;
        }
        processRows(Object.keys(results.data[0]), results.data);
      },
      error: () => setImportStatus('❌ Fehler beim Parsen der CSV-Datei.'),
    });
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleCSV(e.dataTransfer.files[0]); };
  const handleFile = (e) => { if (e.target.files[0]) handleCSV(e.target.files[0]); };

  const clearData = () => { setData([]); localStorage.removeItem('pulse_data'); setImportStatus(''); setImportDetails(null); };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Einstellungen</div><div className="page-subtitle">Datenimport, Konfiguration & Profil</div></div>
      </div>

      {/* Demo Data */}
      <div className="settings-section">
        <h3>🚀 Schnellstart</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
          Laden Sie den Demo-Datensatz der TechParts GmbH (24 Monate), um PULSE sofort zu erleben.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onLoadDemo}>Demo-Daten laden</button>
          {data.length > 0 && <button className="btn btn-danger" onClick={clearData}>Alle Daten löschen</button>}
        </div>
        {data.length > 0 && <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>Aktuell: {data.length} Monate geladen.</p>}
      </div>

      {/* Datenimport mit Kontext */}
      <div className="settings-section">
        <h3>📁 Datenimport</h3>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
            Woher kommen die Daten?
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.7, marginBottom: 10 }}>
            Die meisten KMU erhalten monatlich eine <strong style={{ color: 'var(--text-primary)' }}>BWA</strong> (Betriebswirtschaftliche Auswertung) 
            vom Steuerberater oder aus DATEV. Für die vollständige Analyse benötigt PULSE zusätzlich 
            <strong style={{ color: 'var(--text-primary)' }}> Bilanzdaten</strong> aus der Summen- und Saldenliste (SuSa).
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.7, marginBottom: 10 }}>
            Typischerweise konsolidiert der Controller diese Daten in einer <strong style={{ color: 'var(--text-primary)' }}>monatlichen Excel-Übersicht</strong> – 
            pro Monat eine Zeile, mit den wichtigsten GuV- und Bilanzpositionen als Spalten. 
            Genau diese Datei kann als CSV in PULSE importiert werden.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--primary)' }}>Intelligente Erkennung:</strong> PULSE erkennt automatisch gängige Spaltenbezeichnungen – 
            ob „Umsatzerlöse", „Umsatz", „Revenue" oder „Erlöse". Deutsche BWA-Begriffe, DATEV-Bezeichnungen und 
            englische Begriffe werden unterstützt. Auch deutsche Zahlenformate (1.234.567,89) werden korrekt verarbeitet.
          </p>
        </div>

        <div className={`drop-zone ${dragOver ? 'drag-over' : ''}`} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()}>
          <Icon d={icons.upload} size={32} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>CSV- oder Excel-Datei hierher ziehen</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>oder klicken zum Auswählen · .csv .xlsx .xls</p>
        </div>
        <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" style={{ display: 'none' }} onChange={handleFile} />

        {importStatus && (
          <p style={{ marginTop: 12, fontSize: 13, color: importStatus.startsWith('✅') ? 'var(--success)' : importStatus.startsWith('❌') ? 'var(--danger)' : 'var(--text-secondary)' }}>
            {importStatus}
          </p>
        )}

        {importDetails && (
          <div style={{ marginTop: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 14, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Import-Ergebnis</div>

            {importDetails.hasGuV !== undefined && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: importDetails.hasGuV ? 'var(--success-dim)' : 'var(--danger-dim)', color: importDetails.hasGuV ? 'var(--success)' : 'var(--danger)' }}>
                  GuV-Daten: {importDetails.guv}/6 Felder
                </span>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: importDetails.hasBilanz ? 'var(--success-dim)' : 'var(--warning-dim)', color: importDetails.hasBilanz ? 'var(--success)' : 'var(--warning)' }}>
                  Bilanzdaten: {importDetails.bilanz}/7 Felder
                </span>
              </div>
            )}

            {!importDetails.hasBilanz && importDetails.hasGuV && (
              <p style={{ fontSize: 11, color: 'var(--warning)', marginBottom: 8 }}>
                ⚠️ Ohne Bilanzdaten sind Liquiditäts- und Bilanzanalysen nicht verfügbar. 
                Ergänzen Sie Ihre CSV um Bilanzpositionen (Eigenkapital, Forderungen, Verbindlichkeiten etc.) für die volle Analyse.
              </p>
            )}

            {importDetails.mapped?.length > 0 && (
              <details style={{ marginTop: 4 }}>
                <summary style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  ✅ {importDetails.mapped.length} erkannte Spalten anzeigen
                </summary>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {importDetails.mapped.map((m, i) => (
                    <div key={i} style={{ fontSize: 11, display: 'flex', gap: 8, color: 'var(--text-secondary)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: 180 }}>„{m.original}"</span>
                      <span>→</span>
                      <span style={{ color: 'var(--success)', fontWeight: 500 }}>{m.mapped}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
            {importDetails.unmapped?.length > 0 && (
              <details style={{ marginTop: 6 }}>
                <summary style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  ℹ️ {importDetails.unmapped.length} nicht zugeordnete Spalten
                </summary>
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {importDetails.unmapped.join(', ')}
                </div>
              </details>
            )}
          </div>
        )}

        <details style={{ marginTop: 16 }}>
          <summary style={{ color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>📋 Erwartetes Datenformat & Spaltenbezeichnungen</summary>
          <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 8, marginTop: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.6 }}>
              CSV mit einer Zeile pro Monat und Spaltenüberschriften in der ersten Zeile. 
              PULSE erkennt viele Varianten – hier die <strong>Pflicht-</strong> und optionalen Felder:
            </p>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.9 }}>
              <div><strong style={{ color: 'var(--danger)' }}>Pflicht:</strong></div>
              <div style={{ paddingLeft: 12 }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Datum</strong> – z.B. „2025-01", „01/2025", „Jan 25", „Januar 2025"<br/>
                <strong style={{ color: 'var(--text-secondary)' }}>Umsatz</strong> – z.B. „Umsatz", „Umsatzerlöse", „Erlöse", „Revenue"<br/>
              </div>
              <div style={{ marginTop: 6 }}><strong style={{ color: 'var(--secondary)' }}>Empfohlen (GuV):</strong></div>
              <div style={{ paddingLeft: 12 }}>
                Materialaufwand · Personalaufwand · Sonstige Aufwendungen · Abschreibungen · Zinsaufwand · Umsatz Plan
              </div>
              <div style={{ marginTop: 6 }}><strong style={{ color: 'var(--primary)' }}>Optional (Bilanz):</strong></div>
              <div style={{ paddingLeft: 12 }}>
                Flüssige Mittel · Kurzfr. Forderungen · Vorräte · Kurzfr. Verbindlichkeiten · Langfr. Verbindlichkeiten · Eigenkapital · Anlagevermögen
              </div>
              <div style={{ marginTop: 6 }}><strong style={{ color: 'var(--text-muted)' }}>Extra (Segmente):</strong></div>
              <div style={{ paddingLeft: 12 }}>
                Umsatz Produkt A/B/C (für Produkt-Vergleiche)
              </div>
            </div>
            <div style={{ marginTop: 12, overflowX: 'auto' }}>
              <table className="data-format-table">
                <thead>
                  <tr>
                    <th>Datum</th><th>Umsatzerlöse</th><th>Plan-Umsatz</th><th>Materialaufw.</th><th>Personalaufw.</th><th>Sonst. Aufw.</th><th>AfA</th><th>Zinsen</th><th>Fl. Mittel</th><th>Forderungen</th><th>Vorräte</th><th>Kurzfr. Verb.</th><th>Langfr. Verb.</th><th>EK</th><th>AV</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2025-01</td><td>950.000</td><td>970.000</td><td>365.000</td><td>290.000</td><td>99.000</td><td>43.000</td><td>10.500</td><td>550.000</td><td>340.000</td><td>195.000</td><td>310.000</td><td>420.000</td><td>1.060.000</td><td>645.000</td>
                  </tr>
                  <tr>
                    <td>2025-02</td><td>990.000</td><td>985.000</td><td>380.000</td><td>292.000</td><td>97.000</td><td>43.000</td><td>10.500</td><td>565.000</td><td>355.000</td><td>190.000</td><td>305.000</td><td>415.000</td><td>1.080.000</td><td>638.000</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
              Hinweis: Sowohl Semikolon (;) als auch Komma (,) als Trennzeichen werden erkannt. Deutsche Zahlenformate (1.234,56) werden automatisch konvertiert.
            </p>
          </div>
        </details>
      </div>

      {/* Company Profile */}
      <div className="settings-section">
        <h3>🏢 Unternehmensprofil</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Unternehmensname</label>
            <input className="form-input" value={settings.companyName || ''} onChange={e => setSettings(s => ({ ...s, companyName: e.target.value }))} placeholder="z.B. TechParts GmbH" />
          </div>
          <div className="form-group">
            <label className="form-label">Branche</label>
            <input className="form-input" value={settings.branche || ''} onChange={e => setSettings(s => ({ ...s, branche: e.target.value }))} placeholder="z.B. Industriezulieferer" />
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="settings-section">
        <h3>🤖 KI-Konfiguration</h3>
        <div className="form-group">
          <label className="form-label">Claude API Key</label>
          <input className="form-input" type="password" value={settings.apiKey || ''} onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))} placeholder="sk-ant-..." />
          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>Optional – ein Standard-Key ist bereits hinterlegt.</p>
        </div>
      </div>
    </div>
  );
}
