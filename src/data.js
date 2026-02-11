// ═══════════════════════════════════════════
// PULSE – Demo Data & Calculations
// ═══════════════════════════════════════════

// --- TechParts GmbH Demo Dataset (24 Months) ---
export const DEMO_COMPANY = { name: 'TechParts GmbH', branche: 'Industriezulieferer', waehrung: '€', gjBeginn: 1 };

export const DEMO_DATA = [
  { datum:'2024-01', umsatz:880000, umsatz_plan:900000, materialaufwand:340000, personalaufwand:265000, sonst_aufwand:95000, abschreibungen:42000, zinsaufwand:12000, fluessige_mittel:420000, kurzfr_forderungen:310000, vorraete:180000, kurzfr_verbindlichkeiten:290000, langfr_verbindlichkeiten:480000, eigenkapital:850000, anlagevermoegen:710000, umsatz_a:440000, umsatz_b:264000, umsatz_c:176000 },
  { datum:'2024-02', umsatz:920000, umsatz_plan:910000, materialaufwand:355000, personalaufwand:268000, sonst_aufwand:92000, abschreibungen:42000, zinsaufwand:12000, fluessige_mittel:445000, kurzfr_forderungen:325000, vorraete:175000, kurzfr_verbindlichkeiten:285000, langfr_verbindlichkeiten:475000, eigenkapital:870000, anlagevermoegen:700000, umsatz_a:460000, umsatz_b:276000, umsatz_c:184000 },
  { datum:'2024-03', umsatz:970000, umsatz_plan:960000, materialaufwand:375000, personalaufwand:270000, sonst_aufwand:98000, abschreibungen:42000, zinsaufwand:12000, fluessige_mittel:460000, kurzfr_forderungen:340000, vorraete:185000, kurzfr_verbindlichkeiten:295000, langfr_verbindlichkeiten:470000, eigenkapital:890000, anlagevermoegen:690000, umsatz_a:485000, umsatz_b:291000, umsatz_c:194000 },
  { datum:'2024-04', umsatz:1050000, umsatz_plan:1020000, materialaufwand:405000, personalaufwand:272000, sonst_aufwand:101000, abschreibungen:42000, zinsaufwand:11500, fluessige_mittel:490000, kurzfr_forderungen:360000, vorraete:190000, kurzfr_verbindlichkeiten:300000, langfr_verbindlichkeiten:465000, eigenkapital:920000, anlagevermoegen:680000, umsatz_a:525000, umsatz_b:315000, umsatz_c:210000 },
  { datum:'2024-05', umsatz:1120000, umsatz_plan:1060000, materialaufwand:430000, personalaufwand:275000, sonst_aufwand:105000, abschreibungen:42000, zinsaufwand:11500, fluessige_mittel:510000, kurzfr_forderungen:380000, vorraete:195000, kurzfr_verbindlichkeiten:310000, langfr_verbindlichkeiten:460000, eigenkapital:950000, anlagevermoegen:670000, umsatz_a:560000, umsatz_b:336000, umsatz_c:224000 },
  { datum:'2024-06', umsatz:1080000, umsatz_plan:1040000, materialaufwand:415000, personalaufwand:275000, sonst_aufwand:100000, abschreibungen:42000, zinsaufwand:11500, fluessige_mittel:530000, kurzfr_forderungen:370000, vorraete:190000, kurzfr_verbindlichkeiten:305000, langfr_verbindlichkeiten:455000, eigenkapital:970000, anlagevermoegen:665000, umsatz_a:540000, umsatz_b:324000, umsatz_c:216000 },
  { datum:'2024-07', umsatz:950000, umsatz_plan:980000, materialaufwand:365000, personalaufwand:278000, sonst_aufwand:96000, abschreibungen:42000, zinsaufwand:11000, fluessige_mittel:505000, kurzfr_forderungen:345000, vorraete:185000, kurzfr_verbindlichkeiten:298000, langfr_verbindlichkeiten:450000, eigenkapital:960000, anlagevermoegen:658000, umsatz_a:475000, umsatz_b:285000, umsatz_c:190000 },
  { datum:'2024-08', umsatz:940000, umsatz_plan:950000, materialaufwand:360000, personalaufwand:278000, sonst_aufwand:94000, abschreibungen:42000, zinsaufwand:11000, fluessige_mittel:495000, kurzfr_forderungen:335000, vorraete:188000, kurzfr_verbindlichkeiten:292000, langfr_verbindlichkeiten:445000, eigenkapital:965000, anlagevermoegen:650000, umsatz_a:470000, umsatz_b:282000, umsatz_c:188000 },
  { datum:'2024-09', umsatz:1000000, umsatz_plan:1010000, materialaufwand:385000, personalaufwand:280000, sonst_aufwand:98000, abschreibungen:42000, zinsaufwand:11000, fluessige_mittel:515000, kurzfr_forderungen:355000, vorraete:192000, kurzfr_verbindlichkeiten:300000, langfr_verbindlichkeiten:440000, eigenkapital:985000, anlagevermoegen:642000, umsatz_a:500000, umsatz_b:300000, umsatz_c:200000 },
  { datum:'2024-10', umsatz:1100000, umsatz_plan:1080000, materialaufwand:420000, personalaufwand:282000, sonst_aufwand:102000, abschreibungen:42000, zinsaufwand:11000, fluessige_mittel:540000, kurzfr_forderungen:375000, vorraete:198000, kurzfr_verbindlichkeiten:308000, langfr_verbindlichkeiten:435000, eigenkapital:1010000, anlagevermoegen:635000, umsatz_a:550000, umsatz_b:330000, umsatz_c:220000 },
  { datum:'2024-11', umsatz:1150000, umsatz_plan:1100000, materialaufwand:440000, personalaufwand:285000, sonst_aufwand:108000, abschreibungen:42000, zinsaufwand:10500, fluessige_mittel:560000, kurzfr_forderungen:390000, vorraete:202000, kurzfr_verbindlichkeiten:315000, langfr_verbindlichkeiten:430000, eigenkapital:1040000, anlagevermoegen:628000, umsatz_a:575000, umsatz_b:345000, umsatz_c:230000 },
  { datum:'2024-12', umsatz:1200000, umsatz_plan:1150000, materialaufwand:460000, personalaufwand:288000, sonst_aufwand:112000, abschreibungen:42000, zinsaufwand:10500, fluessige_mittel:580000, kurzfr_forderungen:405000, vorraete:205000, kurzfr_verbindlichkeiten:320000, langfr_verbindlichkeiten:425000, eigenkapital:1070000, anlagevermoegen:620000, umsatz_a:600000, umsatz_b:360000, umsatz_c:240000 },
  // 2025
  { datum:'2025-01', umsatz:950000, umsatz_plan:970000, materialaufwand:365000, personalaufwand:290000, sonst_aufwand:99000, abschreibungen:43000, zinsaufwand:10500, fluessige_mittel:550000, kurzfr_forderungen:340000, vorraete:195000, kurzfr_verbindlichkeiten:310000, langfr_verbindlichkeiten:420000, eigenkapital:1060000, anlagevermoegen:645000, umsatz_a:475000, umsatz_b:285000, umsatz_c:190000 },
  { datum:'2025-02', umsatz:990000, umsatz_plan:985000, materialaufwand:380000, personalaufwand:292000, sonst_aufwand:97000, abschreibungen:43000, zinsaufwand:10500, fluessige_mittel:565000, kurzfr_forderungen:355000, vorraete:190000, kurzfr_verbindlichkeiten:305000, langfr_verbindlichkeiten:415000, eigenkapital:1080000, anlagevermoegen:638000, umsatz_a:495000, umsatz_b:297000, umsatz_c:198000 },
  { datum:'2025-03', umsatz:1040000, umsatz_plan:1030000, materialaufwand:400000, personalaufwand:295000, sonst_aufwand:102000, abschreibungen:43000, zinsaufwand:10000, fluessige_mittel:580000, kurzfr_forderungen:365000, vorraete:198000, kurzfr_verbindlichkeiten:312000, langfr_verbindlichkeiten:410000, eigenkapital:1100000, anlagevermoegen:630000, umsatz_a:520000, umsatz_b:312000, umsatz_c:208000 },
  { datum:'2025-04', umsatz:1140000, umsatz_plan:1100000, materialaufwand:438000, personalaufwand:298000, sonst_aufwand:108000, abschreibungen:43000, zinsaufwand:10000, fluessige_mittel:600000, kurzfr_forderungen:385000, vorraete:205000, kurzfr_verbindlichkeiten:318000, langfr_verbindlichkeiten:405000, eigenkapital:1130000, anlagevermoegen:623000, umsatz_a:570000, umsatz_b:342000, umsatz_c:228000 },
  { datum:'2025-05', umsatz:1200000, umsatz_plan:1140000, materialaufwand:460000, personalaufwand:300000, sonst_aufwand:112000, abschreibungen:43000, zinsaufwand:10000, fluessige_mittel:620000, kurzfr_forderungen:400000, vorraete:210000, kurzfr_verbindlichkeiten:325000, langfr_verbindlichkeiten:400000, eigenkapital:1160000, anlagevermoegen:615000, umsatz_a:600000, umsatz_b:360000, umsatz_c:240000 },
  { datum:'2025-06', umsatz:1160000, umsatz_plan:1120000, materialaufwand:445000, personalaufwand:300000, sonst_aufwand:107000, abschreibungen:43000, zinsaufwand:10000, fluessige_mittel:610000, kurzfr_forderungen:395000, vorraete:205000, kurzfr_verbindlichkeiten:320000, langfr_verbindlichkeiten:395000, eigenkapital:1180000, anlagevermoegen:608000, umsatz_a:580000, umsatz_b:348000, umsatz_c:232000 },
  { datum:'2025-07', umsatz:1020000, umsatz_plan:1050000, materialaufwand:392000, personalaufwand:295000, sonst_aufwand:100000, abschreibungen:43000, zinsaufwand:9500, fluessige_mittel:590000, kurzfr_forderungen:365000, vorraete:198000, kurzfr_verbindlichkeiten:312000, langfr_verbindlichkeiten:390000, eigenkapital:1170000, anlagevermoegen:600000, umsatz_a:510000, umsatz_b:306000, umsatz_c:204000 },
  { datum:'2025-08', umsatz:1010000, umsatz_plan:1020000, materialaufwand:388000, personalaufwand:282000, sonst_aufwand:99000, abschreibungen:43000, zinsaufwand:9500, fluessige_mittel:575000, kurzfr_forderungen:358000, vorraete:195000, kurzfr_verbindlichkeiten:308000, langfr_verbindlichkeiten:385000, eigenkapital:1175000, anlagevermoegen:593000, umsatz_a:505000, umsatz_b:303000, umsatz_c:202000 },
  // Sep 2025: Materialkosten-Explosion!
  { datum:'2025-09', umsatz:1060000, umsatz_plan:1080000, materialaufwand:520000, personalaufwand:280000, sonst_aufwand:104000, abschreibungen:43000, zinsaufwand:9500, fluessige_mittel:480000, kurzfr_forderungen:370000, vorraete:220000, kurzfr_verbindlichkeiten:335000, langfr_verbindlichkeiten:380000, eigenkapital:1140000, anlagevermoegen:585000, umsatz_a:530000, umsatz_b:318000, umsatz_c:212000 },
  { datum:'2025-10', umsatz:1180000, umsatz_plan:1160000, materialaufwand:495000, personalaufwand:278000, sonst_aufwand:110000, abschreibungen:43000, zinsaufwand:9500, fluessige_mittel:450000, kurzfr_forderungen:390000, vorraete:215000, kurzfr_verbindlichkeiten:340000, langfr_verbindlichkeiten:375000, eigenkapital:1150000, anlagevermoegen:580000, umsatz_a:590000, umsatz_b:354000, umsatz_c:236000 },
  // Nov 2025: Liquiditätsengpass
  { datum:'2025-11', umsatz:1220000, umsatz_plan:1200000, materialaufwand:480000, personalaufwand:276000, sonst_aufwand:115000, abschreibungen:43000, zinsaufwand:9000, fluessige_mittel:320000, kurzfr_forderungen:350000, vorraete:210000, kurzfr_verbindlichkeiten:710000, langfr_verbindlichkeiten:370000, eigenkapital:1100000, anlagevermoegen:800000, umsatz_a:610000, umsatz_b:366000, umsatz_c:244000 },
  { datum:'2025-12', umsatz:1280000, umsatz_plan:1240000, materialaufwand:490000, personalaufwand:275000, sonst_aufwand:118000, abschreibungen:43000, zinsaufwand:9000, fluessige_mittel:410000, kurzfr_forderungen:420000, vorraete:205000, kurzfr_verbindlichkeiten:480000, langfr_verbindlichkeiten:365000, eigenkapital:1150000, anlagevermoegen:790000, umsatz_a:640000, umsatz_b:384000, umsatz_c:256000 },
];

// --- Month helpers ---
const MONTHS_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
export const fmtMonth = (d) => { const [y,m] = d.split('-'); return `${MONTHS_DE[+m-1]} ${y.slice(2)}`; };
export const fmtMonthFull = (d) => { const [y,m] = d.split('-'); return `${MONTHS_DE[+m-1]} ${y}`; };

// --- Number formatting ---
export const fmtEur = (v) => {
  if (v === null || v === undefined || isNaN(v)) return '–';
  const abs = Math.abs(v);
  if (abs >= 1000000) return `${(v/1000000).toFixed(2).replace('.',',')} Mio. €`;
  if (abs >= 1000) return `${(v/1000).toFixed(1).replace('.',',')} T€`;
  return `${v.toFixed(0)} €`;
};
export const fmtPct = (v) => v === null || v === undefined || isNaN(v) ? '–' : `${v.toFixed(1).replace('.',',')} %`;
export const fmtNum = (v) => v === null || v === undefined || isNaN(v) ? '–' : v.toLocaleString('de-DE', { maximumFractionDigits: 0 });

// --- KPI Calculations ---
export function calcKPIs(row) {
  if (!row) return null;
  const u = row.umsatz || 0;
  const gesamtkosten = (row.materialaufwand||0) + (row.personalaufwand||0) + (row.sonst_aufwand||0) + (row.abschreibungen||0) + (row.zinsaufwand||0);
  const ebit = u - gesamtkosten + (row.zinsaufwand||0);
  const gewinn = u - gesamtkosten;
  const ebitMarge = u ? (ebit / u) * 100 : 0;
  const umsatzrentabilitaet = u ? (gewinn / u) * 100 : 0;
  const personalQuote = u ? ((row.personalaufwand||0) / u) * 100 : 0;

  const fm = row.fluessige_mittel || 0;
  const kfFord = row.kurzfr_forderungen || 0;
  const vorraete = row.vorraete || 0;
  const kfVerb = row.kurzfr_verbindlichkeiten || 1;
  const liq1 = (fm / kfVerb) * 100;
  const liq2 = ((fm + kfFord) / kfVerb) * 100;
  const liq3 = ((fm + kfFord + vorraete) / kfVerb) * 100;

  const ek = row.eigenkapital || 0;
  const av = row.anlagevermoegen || 0;
  const uv = fm + kfFord + vorraete;
  const gk = av + uv;
  const fk = kfVerb + (row.langfr_verbindlichkeiten || 0);
  const ekQuote = gk ? (ek / gk) * 100 : 0;
  const fkQuote = gk ? (fk / gk) * 100 : 0;
  const verschuldungsgrad = ek ? (fk / ek) * 100 : 0;
  const anlagendeckung1 = av ? (ek / av) * 100 : 0;
  const anlagendeckung2 = av ? ((ek + (row.langfr_verbindlichkeiten||0)) / av) * 100 : 0;

  const cashflow = ebit + (row.abschreibungen || 0);
  const workingCapital = uv - kfVerb;

  const kapitalumschlag = gk ? u / gk : 0;
  const roi = gk ? (gewinn / gk) * 100 : 0;

  return {
    umsatz: u, umsatz_plan: row.umsatz_plan||0, ebit, gewinn, ebitMarge, umsatzrentabilitaet, personalQuote,
    gesamtkosten, materialaufwand: row.materialaufwand||0, personalaufwand: row.personalaufwand||0,
    sonst_aufwand: row.sonst_aufwand||0, abschreibungen: row.abschreibungen||0, zinsaufwand: row.zinsaufwand||0,
    liq1, liq2, liq3, ekQuote, fkQuote, verschuldungsgrad, anlagendeckung1, anlagendeckung2,
    cashflow, workingCapital,
    fluessige_mittel: fm, kurzfr_forderungen: kfFord, vorraete, kurzfr_verbindlichkeiten: kfVerb,
    langfr_verbindlichkeiten: row.langfr_verbindlichkeiten||0, eigenkapital: ek,
    anlagevermoegen: av, umlaufvermoegen: uv, gesamtkapital: gk, fremdkapital: fk,
    kapitalumschlag, roi,
    umsatz_a: row.umsatz_a||0, umsatz_b: row.umsatz_b||0, umsatz_c: row.umsatz_c||0,
    datum: row.datum
  };
}

// --- Ampel (traffic light) ---
export const DEFAULT_THRESHOLDS = {
  umsatz: { green: 100, yellow: 90 }, // % of plan
  ebit: { green: 0.01, yellow: 0 },
  ebitMarge: { green: 10, yellow: 5 },
  liq2: { green: 120, yellow: 100 },
  ekQuote: { green: 30, yellow: 20 },
  cashflow: { green: 0.01, yellow: 0 },
  personalQuote: { green: 30, yellow: 40, inverted: true },
  umsatzrentabilitaet: { green: 5, yellow: 2 },
};

export function getAmpel(kpiKey, value, plan, thresholds = DEFAULT_THRESHOLDS) {
  const t = thresholds[kpiKey];
  if (!t) return 'green';
  if (kpiKey === 'umsatz' && plan) {
    const pct = (value / plan) * 100;
    return pct >= t.green ? 'green' : pct >= t.yellow ? 'yellow' : 'red';
  }
  if (t.inverted) return value <= t.green ? 'green' : value <= t.yellow ? 'yellow' : 'red';
  return value >= t.green ? 'green' : value >= t.yellow ? 'yellow' : 'red';
}

// --- Anomaly Detection ---
export function detectAnomalies(data) {
  if (!data || data.length < 6) return [];
  const anomalies = [];
  const last = data[data.length - 1];
  const kpis = calcKPIs(last);
  const prev6 = data.slice(-7, -1).map(calcKPIs);

  // Check for significant deviations from 6-month average
  const checks = [
    { key: 'materialaufwand', label: 'Materialkosten', fmt: fmtEur, type: 'cost' },
    { key: 'personalaufwand', label: 'Personalkosten', fmt: fmtEur, type: 'cost' },
    { key: 'umsatz', label: 'Umsatz', fmt: fmtEur, type: 'revenue' },
  ];

  for (const c of checks) {
    const vals = prev6.map(k => k[c.key]);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length);
    const current = kpis[c.key];
    if (std > 0 && Math.abs(current - avg) > 1.8 * std) {
      const pctDiff = ((current - avg) / avg * 100).toFixed(0);
      const dir = current > avg ? 'über' : 'unter';
      const severity = Math.abs(current - avg) > 2.5 * std ? 'critical' : 'warning';
      anomalies.push({
        severity,
        icon: current > avg ? (c.type === 'cost' ? '⚠️' : '📈') : (c.type === 'cost' ? '📉' : '⚠️'),
        text: `${c.label} im ${fmtMonthFull(last.datum)}: ${c.fmt(current)} – das liegt ${Math.abs(pctDiff)}% ${dir} dem 6-Monats-Durchschnitt (${c.fmt(avg)}).`
      });
    }
  }

  // Check liquidity threshold
  if (kpis.liq2 < 100) {
    anomalies.push({
      severity: 'critical',
      icon: '🔴',
      text: `Liquidität 2. Grades bei ${fmtPct(kpis.liq2)} – kritischer Wert unter 100%. Kurzfristige Zahlungsfähigkeit gefährdet.`
    });
  }

  // Check trend (3 consecutive months same direction)
  if (data.length >= 4) {
    const last4 = data.slice(-4).map(d => d.umsatz);
    const rising = last4.every((v, i) => i === 0 || v > last4[i-1]);
    const falling = last4.every((v, i) => i === 0 || v < last4[i-1]);
    if (rising) anomalies.push({ severity: 'info', icon: '📈', text: `Umsatz steigt seit 3 Monaten kontinuierlich – positiver Wachstumstrend.` });
    if (falling) anomalies.push({ severity: 'critical', icon: '📉', text: `Umsatz fällt seit 3 Monaten kontinuierlich – negativer Trend erfordert Aufmerksamkeit.` });
  }

  return anomalies;
}

// --- Scenario Calculation ---
export function applyScenario(row, deltas) {
  if (!row || !deltas) return row;
  return {
    ...row,
    umsatz: row.umsatz * (1 + (deltas.umsatz || 0) / 100),
    materialaufwand: row.materialaufwand * (1 + (deltas.material || 0) / 100),
    personalaufwand: row.personalaufwand * (1 + (deltas.personal || 0) / 100),
    sonst_aufwand: row.sonst_aufwand * (1 + (deltas.sonstige || 0) / 100),
  };
}

// --- Storage helpers ---
const STORAGE_KEY = 'pulse_data';
const SETTINGS_KEY = 'pulse_settings';
const SCENARIOS_KEY = 'pulse_scenarios';

export function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
      companyName: '', branche: '', apiKey: '', thresholds: DEFAULT_THRESHOLDS
    };
  } catch {
    return { companyName: '', branche: '', apiKey: '', thresholds: DEFAULT_THRESHOLDS };
  }
}
export function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
export function loadScenarios() {
  try { return JSON.parse(localStorage.getItem(SCENARIOS_KEY)) || {}; } catch { return {}; }
}
export function saveScenarios(s) { localStorage.setItem(SCENARIOS_KEY, JSON.stringify(s)); }

// --- Heatmap color ---
export function heatColor(val, min, max, inverted = false) {
  if (val === null || val === undefined) return 'transparent';
  let ratio = max === min ? 0.5 : (val - min) / (max - min);
  if (inverted) ratio = 1 - ratio;
  if (ratio > 0.6) return 'rgba(0,230,138,0.15)';
  if (ratio < 0.4) return 'rgba(255,71,87,0.15)';
  return 'transparent';
}

// --- Cashflow Waterfall data ---
export function buildWaterfall(kpis) {
  if (!kpis) return [];
  return [
    { name: 'Umsatz', value: kpis.umsatz, type: 'positive' },
    { name: 'Material', value: -kpis.materialaufwand, type: 'negative' },
    { name: 'Personal', value: -kpis.personalaufwand, type: 'negative' },
    { name: 'Sonstiges', value: -kpis.sonst_aufwand, type: 'negative' },
    { name: 'AfA', value: -kpis.abschreibungen, type: 'negative' },
    { name: 'Zinsen', value: -kpis.zinsaufwand, type: 'negative' },
    { name: 'Ergebnis', value: kpis.gewinn, type: kpis.gewinn >= 0 ? 'total-pos' : 'total-neg' },
  ];
}

// Custom tooltip style
export const tooltipStyle = {
  backgroundColor: '#1C2333',
  border: '1px solid #232B3E',
  borderRadius: '8px',
  color: '#F0F2F5',
  fontSize: '12px',
  fontFamily: "'DM Sans', sans-serif",
  padding: '10px 14px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

// ─── High-res SVG Logo for PDF Export ───
export const PULSE_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0B0F19"/><stop offset="100%" stop-color="#1a1f2e"/></linearGradient>
    <linearGradient id="pulse" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#00D4FF"/><stop offset="50%" stop-color="#00E68A"/><stop offset="100%" stop-color="#00D4FF"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="6" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <rect x="24" y="24" width="464" height="464" rx="80" fill="none" stroke="#00D4FF" stroke-width="2" opacity="0.15"/>
  <polyline points="80,310 160,310 200,180 240,360 280,120 320,340 360,200 400,280 432,280" fill="none" stroke="url(#pulse)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
  <circle cx="280" cy="120" r="10" fill="#00D4FF" opacity="0.9"/>
  <text x="256" y="440" text-anchor="middle" fill="#ffffff" font-family="Helvetica,Arial" font-weight="700" font-size="56" letter-spacing="8">PULSE</text>
</svg>`;

export async function renderLogoToCanvas(size = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    const blob = new Blob([PULSE_LOGO_SVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      c.getContext('2d').drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// Chart colors
export const COLORS = {
  primary: '#00D4FF',
  secondary: '#FFB800',
  success: '#00E68A',
  danger: '#FF4757',
  muted: '#5A6478',
  bar: '#00D4FF',
  line: '#FFB800',
  area: 'rgba(0,212,255,0.1)',
  donut: ['#00D4FF', '#FFB800', '#00E68A', '#FF4757', '#A855F7', '#EC4899'],
};
