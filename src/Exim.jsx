import { useState, useCallback } from "react";

const EXAMPLE_RATES = { USD: "83.50", EUR: "91.20", GBP: "106.80", JPY: "0.56", AED: "22.73", CNY: "11.50" };
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AED", "CNY"];

const fmt = (n) =>
  isNaN(n) || n === undefined ? "—"
    : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const toINR = (val, cur, rate) => num(val) * (cur === "INR" ? 1 : num(rate));

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────
// navy:#1E3A5F  lime:#C8E84A  dark:#0D0C20  green:#2ECB72
// yellow:#F7DF1E  midnight:#001920  light:#F5F6F6  lavender:#C8C3FC

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:      #1E3A5F;
    --lime:      #C8E84A;
    --dark:      #0D0C20;
    --green:     #2ECB72;
    --yellow:    #F7DF1E;
    --midnight:  #001920;
    --light:     #F5F6F6;
    --lavender:  #C8C3FC;
    --white:     #FFFFFF;
    --black:     #000000;

    /* Surface layers */
    --bg:        var(--dark);
    --surface:   #111228;
    --surface-2: #192040;
    --surface-3: #1a2d50;

    /* Borders */
    --border:    rgba(200,232,74,.12);
    --border-2:  rgba(200,232,74,.22);

    /* Text */
    --text-1: #F5F6F6;
    --text-2: #9eaec0;
    --text-3: #5a6e82;

    /* Accents */
    --accent:    var(--lime);
    --accent-d:  #a8c43a;
    --accent-dim:rgba(200,232,74,.08);
    --green-dim: rgba(46,203,114,.08);
    --lav-dim:   rgba(200,195,252,.08);
  }

  body { background: var(--bg); color: var(--text-1); font-family: 'Inter', sans-serif; min-height: 100vh; }
  .app { max-width: 1100px; margin: 0 auto; padding: 28px 16px 72px; }

  input[type=number] { -moz-appearance: textfield; }
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

  /* ── Header ── */
  .header { display: flex; align-items: center; gap: 16px; margin-bottom: 36px; }
  .header-icon {
    width: 52px; height: 52px; flex-shrink: 0; border-radius: 14px;
    background: linear-gradient(135deg, var(--lime) 0%, var(--yellow) 100%);
    display: flex; align-items: center; justify-content: center; font-size: 24px;
    box-shadow: 0 0 24px rgba(200,232,74,.35);
  }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: -.4px; color: var(--text-1); }
  .header p  { font-size: 13px; color: var(--text-3); margin-top: 3px; }

  /* ── Tabs ── */
  .tabs { display: flex; gap: 4px; background: var(--surface); border-radius: 12px;
    padding: 4px; border: 1px solid var(--border); margin-bottom: 24px; width: fit-content; }
  .tab { padding: 8px 22px; border-radius: 9px; font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: all .18s; color: var(--text-3); background: transparent;
    font-family: 'Inter', sans-serif; }
  .tab.active { background: var(--lime); color: var(--dark); font-weight: 700; }
  .tab:hover:not(.active) { color: var(--text-1); background: var(--surface-2); }

  /* ── Card ── */
  .card { background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 24px; margin-bottom: 20px; }
  .card-title { font-size: 10px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 1.5px; color: var(--lime); margin-bottom: 20px; }
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media(max-width: 660px) { .grid-2 { grid-template-columns: 1fr; } }

  /* ── Field ── */
  .field { display: flex; flex-direction: column; gap: 7px; }
  .field label { font-size: 10px; font-weight: 700; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 1px; }
  .field-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
  .field-head-label { font-size: 10px; font-weight: 700; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 1px; }

  /* ── Combined currency + value ── */
  .cx-wrap { display: flex; border: 1px solid var(--border); border-radius: 9px;
    overflow: hidden; background: var(--surface-2); transition: border-color .18s; }
  .cx-wrap:focus-within { border-color: var(--lime); box-shadow: 0 0 0 2px rgba(200,232,74,.12); }
  .cx-select { border: none; border-right: 1px solid var(--border); border-radius: 0;
    background: rgba(30,58,95,.6); color: var(--lime); font-size: 11px; font-weight: 800;
    padding: 10px 6px; width: 66px; flex-shrink: 0; cursor: pointer; outline: none;
    appearance: none; -webkit-appearance: none; text-align: center; font-family: 'Inter', sans-serif; }
  .cx-select option { background: var(--surface-2); color: var(--text-1); font-weight: 400; }
  .cx-input { border: none; background: transparent; color: var(--text-1); font-size: 14px;
    padding: 10px 12px; width: 100%; outline: none; font-family: 'Inter', sans-serif; }
  .cx-input::placeholder { color: var(--text-3); }

  /* ── Plain input ── */
  .input { background: var(--surface-2); border: 1px solid var(--border); border-radius: 9px;
    color: var(--text-1); font-size: 14px; padding: 10px 12px; width: 100%;
    font-family: 'Inter', sans-serif; outline: none; transition: all .18s; }
  .input:focus { border-color: var(--lime); box-shadow: 0 0 0 2px rgba(200,232,74,.12); }
  .input.readonly { background: rgba(46,203,114,.06); border-color: rgba(46,203,114,.2);
    color: var(--green); cursor: default; font-weight: 600; }

  /* ── Hint ── */
  .hint { font-size: 11px; color: var(--text-3); margin-top: 5px; padding-left: 2px; }

  /* ── Value / % Toggle ── */
  .vp-toggle { display: flex; border: 1px solid var(--border); border-radius: 7px; overflow: hidden; flex-shrink: 0; }
  .vp-btn { padding: 5px 11px; font-size: 11px; font-weight: 700; cursor: pointer;
    border: none; transition: all .15s; color: var(--text-3); background: transparent;
    font-family: 'Inter', sans-serif; letter-spacing: .3px; }
  .vp-btn.on { background: var(--lime); color: var(--dark); }
  .vp-btn:not(.on):hover { color: var(--text-1); background: var(--surface-2); }

  /* ── Per-field exchange rate row ── */
  .rate-row { display: flex; align-items: center; gap: 8px; margin-top: 7px;
    background: rgba(30,58,95,.5); border: 1px solid var(--border); border-radius: 8px; padding: 7px 10px; }
  .rate-row-inherited { background: rgba(200,232,74,.05); border-color: rgba(200,232,74,.15); }
  .rate-row-label { font-size: 11px; color: var(--text-3); white-space: nowrap; flex-shrink: 0; }
  .rate-input { flex: 1; background: transparent; border: none; color: var(--lime);
    font-size: 13px; font-weight: 700; outline: none; font-family: 'Inter', sans-serif; min-width: 0; }
  .rate-input::placeholder { color: var(--text-3); font-weight: 400; font-style: italic; }
  .rate-converted { font-size: 11px; color: var(--green); white-space: nowrap; flex-shrink: 0; font-weight: 600; }
  .rate-tag-inherited { font-size: 9px; font-weight: 800; color: var(--dark);
    background: var(--lime); border-radius: 10px; padding: 2px 8px; white-space: nowrap;
    flex-shrink: 0; letter-spacing: .5px; text-transform: uppercase; }

  /* ── % suffix input ── */
  .pct-only-wrap { display: flex; border: 1px solid var(--border); border-radius: 9px;
    overflow: hidden; background: var(--surface-2); transition: all .18s; }
  .pct-only-wrap:focus-within { border-color: var(--lime); box-shadow: 0 0 0 2px rgba(200,232,74,.12); }
  .pct-suffix { display: flex; align-items: center; padding: 10px 12px;
    background: rgba(30,58,95,.6); color: var(--lime); font-size: 13px;
    font-weight: 700; flex-shrink: 0; border-left: 1px solid var(--border); }

  /* ── Warning ── */
  .warning { background: rgba(247,223,30,.07); border: 1px solid rgba(247,223,30,.25);
    border-radius: 9px; padding: 10px 14px; font-size: 12px; color: var(--yellow);
    margin-top: 8px; display: flex; gap: 8px; align-items: flex-start; }

  /* ── Info box ── */
  .info-box { background: var(--lav-dim); border: 1px solid rgba(200,195,252,.2);
    border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; }
  .info-box-title { font-size: 10px; font-weight: 800; color: var(--lavender);
    text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .info-box p { font-size: 12px; color: var(--text-2); line-height: 1.75; }
  .info-box strong { color: var(--text-1); }

  /* ── Tape accent ── */
  .tape { height: 2px; background: linear-gradient(90deg, transparent, var(--lime), var(--yellow), var(--lime), transparent);
    border-radius: 2px; margin: 6px 0 22px; box-shadow: 0 0 16px rgba(200,232,74,.5); }

  /* ── Result rows ── */
  .result-row { display: flex; justify-content: space-between; align-items: center;
    padding: 9px 0; border-bottom: 1px solid rgba(200,232,74,.06); }
  .result-row:last-child { border-bottom: none; }
  .result-label { font-size: 13px; color: var(--text-2); }
  .result-value { font-size: 14px; font-weight: 600; color: var(--text-1); }
  .rv-lime { color: var(--lime); }
  .rv-green{ color: var(--green); }
  .rv-lav  { color: var(--lavender); }
  .rv-yel  { color: var(--yellow); }
  .rv-dim  { color: var(--text-2); font-weight: 500; }
  .rv-big  { font-size: 15px; }

  /* ── Sub result block ── */
  .sub-result { background: var(--surface-2); border-radius: 10px; padding: 14px 16px; border: 1px solid var(--border); }
  .sub-result .result-row { padding: 7px 0; }
  .block-label { font-size: 10px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 1px; color: var(--text-3); margin: 18px 0 8px; }
  .block-label:first-child { margin-top: 0; }

  /* ── Summary block ── */
  .summary-block { background: rgba(46,203,114,.06); border: 1px solid rgba(46,203,114,.15);
    border-radius: 10px; padding: 14px 16px; margin-top: 14px; }
  .summary-block .result-row { padding: 7px 0; }

  /* ── Sep row ── */
  .sep-row { border-top: 1px solid rgba(200,232,74,.15) !important; padding-top: 10px !important; margin-top: 4px; }

  /* ── Total cards ── */
  .total-card {
    background: linear-gradient(135deg, #1a2d10 0%, #2a4a1a 100%);
    border: 1px solid rgba(200,232,74,.3);
    border-radius: 14px; padding: 22px 24px;
    display: flex; justify-content: space-between; align-items: center; margin-top: 20px;
    box-shadow: 0 0 32px rgba(200,232,74,.1);
  }
  .total-card-green {
    background: linear-gradient(135deg, #0a2010 0%, #163320 100%);
    border: 1px solid rgba(46,203,114,.3);
    border-radius: 14px; padding: 22px 24px;
    display: flex; justify-content: space-between; align-items: center; margin-top: 20px;
    box-shadow: 0 0 32px rgba(46,203,114,.1);
  }
  .total-label { font-size: 13px; font-weight: 600; color: var(--text-2); }
  .total-value { font-size: 28px; font-weight: 800; }
  .total-sub   { font-size: 11px; color: var(--text-3); margin-top: 3px; }
  .total-card .total-value { color: var(--lime); }
  .total-card-green .total-value { color: var(--green); }

  /* ── Buttons ── */
  .btn-reset { background: transparent; border: 1px solid var(--border); border-radius: 8px;
    color: var(--text-3); font-size: 12px; padding: 7px 18px; cursor: pointer; transition: all .18s;
    font-family: 'Inter', sans-serif; font-weight: 600; }
  .btn-reset:hover { border-color: rgba(247,223,30,.4); color: var(--yellow); }

  /* ── Auto badge ── */
  .auto-badge { display: inline-flex; align-items: center; background: rgba(46,203,114,.1);
    border: 1px solid rgba(46,203,114,.25); border-radius: 20px; font-size: 9px;
    color: var(--green); padding: 2px 7px; font-weight: 800; letter-spacing: .6px;
    text-transform: uppercase; }

  /* ── Auto group ── */
  .auto-group { background: var(--green-dim); border: 1px solid rgba(46,203,114,.15);
    border-radius: 12px; padding: 18px; margin-bottom: 16px; }
  .auto-group-title { font-size: 10px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 1.2px; color: var(--green); margin-bottom: 14px; }

  /* ── Divider ── */
  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  /* ── LC dynamic rows ── */
  .lc-add-btn { background: transparent; border: 1px dashed rgba(200,232,74,.25); border-radius: 9px;
    color: var(--text-3); font-size: 13px; padding: 10px 16px; cursor: pointer; width: 100%;
    margin-top: 10px; transition: all .18s; font-family: 'Inter', sans-serif; font-weight: 500; }
  .lc-add-btn:hover { border-color: var(--lime); color: var(--lime); }
  .lc-item { display: grid; grid-template-columns: 1fr 170px auto;
    gap: 10px; align-items: center; margin-bottom: 10px; }
  .lc-del { background: transparent; border: 1px solid transparent; color: var(--text-3);
    cursor: pointer; font-size: 16px; padding: 6px 8px; border-radius: 7px; transition: all .18s; }
  .lc-del:hover { color: var(--yellow); border-color: rgba(247,223,30,.3); background: rgba(247,223,30,.06); }

  /* ── Stat boxes ── */
  .stat-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
  .stat-box { flex: 1; min-width: 120px; background: var(--surface-2); border: 1px solid var(--border);
    border-radius: 10px; padding: 12px 16px; }
  .stat-label { font-size: 10px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: .8px; margin-bottom: 5px; font-weight: 600; }
  .stat-value { font-size: 18px; font-weight: 800; }

  /* ── Section group label ── */
  .group-label { font-size: 10px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 1.2px; color: var(--lime); margin-bottom: 14px;
    padding-bottom: 8px; border-bottom: 1px solid var(--border); }
`;

// ─── Small components ───────────────────────────────────────────────────────
const VPToggle = ({ mode, onChange }) => (
  <div className="vp-toggle">
    <button className={`vp-btn ${mode==="value"?"on":""}`} onClick={() => onChange("value")}>Value</button>
    <button className={`vp-btn ${mode==="pct"?"on":""}`}   onClick={() => onChange("pct")}>%</button>
  </div>
);

const CxField = ({ currency, value, onCurrencyChange, onValueChange, placeholder="0.00" }) => (
  <div className="cx-wrap">
    <select className="cx-select" value={currency} onChange={onCurrencyChange}>
      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
    <input className="cx-input" type="number" placeholder={placeholder} value={value} onChange={onValueChange} />
  </div>
);

const PctField = ({ value, onChange, placeholder="0.00" }) => (
  <div className="pct-only-wrap">
    <input className="cx-input" type="number" placeholder={placeholder} value={value} onChange={onChange} />
    <div className="pct-suffix">%</div>
  </div>
);

const PerFieldRate = ({ currency, invoiceCur, invoiceRateStr, rate, onRateChange, fieldValue, isSource=false }) => {
  if (currency === "INR") return null;
  const hasValue = num(fieldValue) > 0;
  const eg = EXAMPLE_RATES[currency] ?? "—";

  if (isSource) {
    const hasRate = num(rate) > 0;
    const inrVal  = hasValue && hasRate ? num(fieldValue) * num(rate) : 0;
    return (
      <div className="rate-row">
        <span className="rate-row-label">1 {currency} =</span>
        <input className="rate-input" type="number" placeholder={`e.g. ${eg}`} value={rate} onChange={onRateChange} />
        <span className="rate-row-label">INR</span>
        {inrVal > 0 && <span className="rate-converted">= ₹{fmt(inrVal)}</span>}
      </div>
    );
  }

  if (currency === invoiceCur) {
    const inheritedRate = num(invoiceRateStr);
    const inrVal = hasValue && inheritedRate > 0 ? num(fieldValue) * inheritedRate : 0;
    return (
      <div className="rate-row rate-row-inherited">
        <span className="rate-row-label">1 {currency} =</span>
        <span style={{ flex:1, fontSize:13, fontWeight:700, color:"var(--lime)" }}>
          {inheritedRate > 0 ? fmt(inheritedRate)
            : <em style={{ color:"var(--text-3)", fontWeight:400, fontSize:12 }}>enter invoice rate above</em>}
        </span>
        <span className="rate-row-label">INR</span>
        <span className="rate-tag-inherited">From invoice</span>
        {inrVal > 0 && <span className="rate-converted">= ₹{fmt(inrVal)}</span>}
      </div>
    );
  }

  const hasRate = num(rate) > 0;
  const inrVal  = hasValue && hasRate ? num(fieldValue) * num(rate) : 0;
  return (
    <div className="rate-row">
      <span className="rate-row-label">1 {currency} =</span>
      <input className="rate-input" type="number" placeholder={`e.g. ${eg}`} value={rate} onChange={onRateChange} />
      <span className="rate-row-label">INR</span>
      {inrVal > 0 && <span className="rate-converted">= ₹{fmt(inrVal)}</span>}
    </div>
  );
};

const ReadonlyField = ({ label, value, color }) => (
  <div className="field">
    <label style={{ display:"flex", alignItems:"center", gap:6 }}>
      {label}<span className="auto-badge">AUTO</span>
    </label>
    <input className="input readonly" readOnly
      value={value > 0 ? `₹ ${fmt(value)}` : "—"}
      style={color ? { color } : {}} />
  </div>
);

const RR = ({ label, value, cls="", bold=false, sep=false }) => (
  <div className={`result-row ${sep?"sep-row":""}`}>
    <span className="result-label" style={bold?{fontWeight:600,color:"var(--text-1)"}:{}}>{label}</span>
    <span className={`result-value ${cls}`}>{value > 0 ? `₹${fmt(value)}` : "—"}</span>
  </div>
);

// ─── Init ──────────────────────────────────────────────────────────────────
const INIT_DUTY = {
  invoiceCurrency:"USD", invoiceValue:"", invoiceRate:"",
  freightMode:"value",
  freightCurrency:"INR", freightValue:"", freightRate:"", freightPct:"",
  insMode:"value",
  insCurrency:"INR", insValue:"", insRate:"", insPct:"",
  miscCurrency:"INR", miscValue:"", miscRate:"",
  bcdPct:"", swsPct:"", igstPct:"", addPct:"", aidcPct:"",
};

const INIT_LC = {
  freightCurrency:"INR", freightValue:"", freightRate:"",
  cfcAai:"", customsClearance:"", transportation:"",
  dgCharges:"", ccFee:"", deliveryOrder:"",
  additionalCharges:[],
};

// ─── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("duty");
  const [f,   setF]   = useState(INIT_DUTY);
  const [lc,  setLc]  = useState(INIT_LC);

  const sf  = useCallback((k, v) => setF(p  => ({ ...p, [k]: v })), []);
  const slc = useCallback((k, v) => setLc(p => ({ ...p, [k]: v })), []);

  const pickCur = (curKey, rateKey, newCur) => {
    sf(curKey, newCur);
    sf(rateKey, "");
  };

  // ── Rate resolution ────────────────────────────────────────────────────
  const invoiceRateNum = num(f.invoiceRate);
  const resolveRate = (cur, own) =>
    cur === "INR" ? 1 : cur === f.invoiceCurrency ? invoiceRateNum : num(own);

  const freightRate = resolveRate(f.freightCurrency, f.freightRate);
  const insRate     = resolveRate(f.insCurrency,     f.insRate);
  const miscRate    = resolveRate(f.miscCurrency,    f.miscRate);

  // ── Core maths ─────────────────────────────────────────────────────────
  const invoiceINR = toINR(f.invoiceValue, f.invoiceCurrency, invoiceRateNum);

  const miscINR = toINR(f.miscValue, f.miscCurrency, miscRate);

  // Freight
  const freightRawINR = f.freightMode === "pct"
    ? invoiceINR * (num(f.freightPct) / 100)
    : toINR(f.freightValue, f.freightCurrency, freightRate);
  const freightCap    = invoiceINR * 0.2;
  const freightCapped = freightRawINR > freightCap && invoiceINR > 0;
  const freightINR    = freightCapped ? freightCap : freightRawINR;
  const freightPctAct = invoiceINR > 0 ? (freightINR / invoiceINR) * 100 : 0;

  // Insurance base = Invoice + Misc
  const insBase = invoiceINR + miscINR;
  const insINR  = f.insMode === "pct"
    ? insBase * (num(f.insPct) / 100)
    : toINR(f.insValue, f.insCurrency, insRate);

  const av = invoiceINR + freightINR + insINR + miscINR;

  // Duties
  const bcdPct  = num(f.bcdPct),  bcdVal  = av * (bcdPct / 100);
  const swsPct  = num(f.swsPct),  swsVal  = bcdVal * (swsPct / 100);
  const addPct  = num(f.addPct),  addVal  = av * (addPct / 100);
  const aidcPct = num(f.aidcPct), aidcVal = av * (aidcPct / 100);
  const igstPct = num(f.igstPct), igstBase = av + bcdVal + swsVal + addVal + aidcVal;
  const igstVal = igstBase * (igstPct / 100);

  const dutyExGst = bcdVal + swsVal + addVal + aidcVal;
  const totalDuty = dutyExGst + igstVal;
  const effPct    = av > 0 ? (totalDuty / av) * 100 : 0;

  // ── Landed maths ───────────────────────────────────────────────────────
  const lcFreightRate = lc.freightCurrency === "INR"             ? 1
                      : lc.freightCurrency === f.invoiceCurrency ? invoiceRateNum
                      : num(lc.freightRate);
  const lcFreight       = toINR(lc.freightValue, lc.freightCurrency, lcFreightRate);
  const lcCfcAai        = num(lc.cfcAai);
  const lcCustClearance = num(lc.customsClearance);
  const lcTransport     = num(lc.transportation);
  const lcDG            = num(lc.dgCharges);
  const lcCCFee         = num(lc.ccFee);
  const lcDeliveryOrder = num(lc.deliveryOrder);
  const lcExtra         = lc.additionalCharges.reduce((s, c) => s + num(c.amount), 0);

  const lcAutoBase      = invoiceINR + insINR + miscINR + dutyExGst;
  const lcLocalSubtotal = lcFreight + lcCfcAai + lcCustClearance + lcTransport + lcDG + lcCCFee + lcDeliveryOrder + lcExtra;
  const lcTotal         = lcAutoBase + lcLocalSubtotal;

  const addExtra = () => setLc(p => ({ ...p, additionalCharges: [...p.additionalCharges, { id:Date.now(), label:"", amount:"" }] }));
  const updExtra = (id,k,v) => setLc(p => ({ ...p, additionalCharges: p.additionalCharges.map(c => c.id===id?{...c,[k]:v}:c) }));
  const delExtra = (id) => setLc(p => ({ ...p, additionalCharges: p.additionalCharges.filter(c => c.id!==id) }));

  const multiCurrency = [...new Set([f.freightCurrency, f.insCurrency, f.miscCurrency].filter(c => c !== "INR" && c !== f.invoiceCurrency))].length > 0;

  // Duty label builder
  const dutyLabel = ["BCD","SWS", addVal>0?"ADD":"", aidcVal>0?"AIDC":""].filter(Boolean).join("+");

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">

        {/* Header */}
        <div className="header">
          <div className="header-icon">🛃</div>
          <div>
            <h1>India Customs Duty Calculator</h1>
            <p>CIF-based · BCD · SWS · IGST · ADD · AIDC · Landed Cost · Per-field exchange rates</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab==="duty"?"active":""}`}   onClick={() => setTab("duty")}>Duty Calculator</button>
          <button className={`tab ${tab==="landed"?"active":""}`} onClick={() => setTab("landed")}>Landed Cost</button>
        </div>

        {/* ══════════════ DUTY TAB ══════════════ */}
        {tab === "duty" && <>

          {multiCurrency && (
            <div className="info-box">
              <div className="info-box-title">💡 Multiple currencies detected</div>
              <p>
                Fields in the <strong>same currency as invoice ({f.invoiceCurrency})</strong> automatically inherit the invoice exchange rate.
                Fields in a <strong>different currency</strong> show their own rate row — enter the specific rate for that charge.
                All values are converted to INR individually before computing the assessable value.
              </p>
            </div>
          )}

          {/* Invoice */}
          <div className="card">
            <div className="section-header">
              <div className="card-title">Invoice Details</div>
              <button className="btn-reset" onClick={() => setF(INIT_DUTY)}>Reset</button>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Invoice Value</label>
                <CxField
                  currency={f.invoiceCurrency} value={f.invoiceValue}
                  onCurrencyChange={e => pickCur("invoiceCurrency","invoiceRate",e.target.value)}
                  onValueChange={e => sf("invoiceValue",e.target.value)}
                />
                <PerFieldRate
                  currency={f.invoiceCurrency} invoiceCur={f.invoiceCurrency}
                  invoiceRateStr={f.invoiceRate} rate={f.invoiceRate}
                  onRateChange={e => sf("invoiceRate",e.target.value)}
                  fieldValue={f.invoiceValue} isSource
                />
              </div>
              <div style={{ display:"flex", flexDirection:"column", justifyContent:"center" }}>
                {invoiceINR > 0
                  ? <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:9, padding:"14px 16px" }}>
                      <div style={{ fontSize:10, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:1, marginBottom:6, fontWeight:700 }}>Invoice in INR</div>
                      <div style={{ fontSize:22, fontWeight:800, color:"var(--lime)" }}>₹{fmt(invoiceINR)}</div>
                    </div>
                  : <div style={{ fontSize:12, color:"var(--text-3)", fontStyle:"italic", padding:"8px 0" }}>
                      Enter invoice value and exchange rate to see INR equivalent.
                    </div>
                }
              </div>
            </div>
          </div>

          {/* Freight / Insurance / Misc */}
          <div className="card">
            <div className="card-title">Freight, Insurance & Misc Charges</div>

            {/* Freight */}
            <div style={{ marginBottom:22 }}>
              <div className="field-head">
                <span className="field-head-label">
                  Freight
                  {freightCapped && <span style={{ marginLeft:8, fontSize:9, background:"rgba(247,223,30,.15)", border:"1px solid rgba(247,223,30,.3)", color:"var(--yellow)", padding:"2px 8px", borderRadius:20, fontWeight:800, textTransform:"uppercase" }}>Capped 20%</span>}
                </span>
                <VPToggle mode={f.freightMode} onChange={v => sf("freightMode",v)} />
              </div>
              {f.freightMode === "value" ? (
                <>
                  <CxField currency={f.freightCurrency} value={f.freightValue}
                    onCurrencyChange={e => pickCur("freightCurrency","freightRate",e.target.value)}
                    onValueChange={e => sf("freightValue",e.target.value)} />
                  <PerFieldRate currency={f.freightCurrency} invoiceCur={f.invoiceCurrency}
                    invoiceRateStr={f.invoiceRate} rate={f.freightRate}
                    onRateChange={e => sf("freightRate",e.target.value)} fieldValue={f.freightValue} />
                </>
              ) : (
                <>
                  <PctField value={f.freightPct} onChange={e => sf("freightPct",e.target.value)} placeholder="e.g. 10" />
                  {invoiceINR > 0 && num(f.freightPct) > 0 &&
                    <div className="hint">{f.freightPct}% of invoice = ₹{fmt(invoiceINR * num(f.freightPct) / 100)}</div>}
                </>
              )}
              {freightCapped && (
                <div className="warning">
                  <span>⚠</span>
                  <span>Freight (₹{fmt(freightRawINR)}) exceeds 20% of invoice — capped at <strong>₹{fmt(freightCap)}</strong> for AV.</span>
                </div>
              )}
              {!freightCapped && invoiceINR > 0 && freightINR > 0 &&
                <div className="hint">= ₹{fmt(freightINR)} ({fmt(freightPctAct)}% of invoice)</div>}
            </div>

            {/* Insurance */}
            <div style={{ marginBottom:22 }}>
              <div className="field-head">
                <span className="field-head-label">Insurance</span>
                <VPToggle mode={f.insMode} onChange={v => { sf("insMode",v); sf("insValue",""); sf("insPct",""); }} />
              </div>
              {f.insMode === "value" ? (
                <>
                  <CxField currency={f.insCurrency} value={f.insValue}
                    onCurrencyChange={e => { pickCur("insCurrency","insRate",e.target.value); sf("insPct",""); }}
                    onValueChange={e => { sf("insValue",e.target.value); sf("insPct",""); }} />
                  <PerFieldRate currency={f.insCurrency} invoiceCur={f.invoiceCurrency}
                    invoiceRateStr={f.invoiceRate} rate={f.insRate}
                    onRateChange={e => sf("insRate",e.target.value)} fieldValue={f.insValue} />
                </>
              ) : (
                <>
                  <PctField value={f.insPct} onChange={e => sf("insPct",e.target.value)} placeholder="e.g. 1.125" />
                  {insBase > 0 && num(f.insPct) > 0 &&
                    <div className="hint">{f.insPct}% of (Invoice{miscINR>0?" + Misc":""}) = ₹{fmt(insINR)}</div>}
                </>
              )}
            </div>

            {/* Misc */}
            <div>
              <div className="field-head">
                <span className="field-head-label">Miscellaneous / EX Works</span>
              </div>
              <CxField currency={f.miscCurrency} value={f.miscValue}
                onCurrencyChange={e => pickCur("miscCurrency","miscRate",e.target.value)}
                onValueChange={e => sf("miscValue",e.target.value)} />
              <PerFieldRate currency={f.miscCurrency} invoiceCur={f.invoiceCurrency}
                invoiceRateStr={f.invoiceRate} rate={f.miscRate}
                onRateChange={e => sf("miscRate",e.target.value)} fieldValue={f.miscValue} />
            </div>
          </div>

          {/* Duty Rates */}
          <div className="card">
            <div className="card-title">Duty Rates</div>
            <div className="grid-2">
              <div className="field">
                <label>BCD %</label>
                <PctField value={f.bcdPct} onChange={e => sf("bcdPct",e.target.value)} placeholder="e.g. 10" />
              </div>
              <div className="field">
                <label>SWS % <span style={{ color:"var(--text-3)", fontWeight:400, textTransform:"none", fontSize:10 }}>(on BCD)</span></label>
                <PctField value={f.swsPct} onChange={e => sf("swsPct",e.target.value)} placeholder="e.g. 10" />
              </div>
              <div className="field">
                <label>ADD % <span style={{ color:"var(--text-3)", fontWeight:400, textTransform:"none", fontSize:10 }}>(Anti-Dumping, on AV)</span></label>
                <PctField value={f.addPct} onChange={e => sf("addPct",e.target.value)} placeholder="e.g. 5" />
              </div>
              <div className="field">
                <label>AIDC % <span style={{ color:"var(--text-3)", fontWeight:400, textTransform:"none", fontSize:10 }}>(Agriculture Infra, on AV)</span></label>
                <PctField value={f.aidcPct} onChange={e => sf("aidcPct",e.target.value)} placeholder="e.g. 5" />
              </div>
              <div className="field">
                <label>IGST % <span style={{ color:"var(--text-3)", fontWeight:400, textTransform:"none", fontSize:10 }}>(on AV+BCD+SWS+ADD+AIDC)</span></label>
                <PctField value={f.igstPct} onChange={e => sf("igstPct",e.target.value)} placeholder="e.g. 18" />
              </div>
            </div>
          </div>

          {/* Computation Breakup */}
          <div className="card">
            <div className="card-title">Computation Breakup</div>
            <div className="tape" />

            <div className="block-label">Assessable Value (CIF)</div>
            <div className="sub-result">
              <RR label="Invoice Value" value={invoiceINR} />
              <RR label={`Freight${freightCapped?" (capped at 20%)":""}`} value={freightINR} />
              <RR label="Insurance" value={insINR} />
              <RR label="Misc / EX Works" value={miscINR} />
              <RR label="Assessable Value" value={av} cls="rv-lime" bold sep />
            </div>

            <div className="block-label">Customs Duty (excl. IGST)</div>
            <div className="sub-result">
              <RR label={`BCD @ ${bcdPct}% on AV`} value={bcdVal} cls="rv-lime" />
              <RR label={`SWS @ ${swsPct}% on BCD`} value={swsVal} cls="rv-lime" />
              {addVal  > 0 && <RR label={`ADD @ ${addPct}% on AV`}  value={addVal}  cls="rv-lav" />}
              {aidcVal > 0 && <RR label={`AIDC @ ${aidcPct}% on AV`} value={aidcVal} cls="rv-lav" />}
              <RR label="Total Duty excl. IGST" value={dutyExGst} cls="rv-lime" bold sep />
            </div>

            <div className="block-label">IGST</div>
            <div className="sub-result">
              <RR label={`IGST Base (AV + BCD + SWS${addVal>0?" + ADD":""}${aidcVal>0?" + AIDC":""})`} value={igstBase} cls="rv-dim" />
              <RR label={`IGST @ ${igstPct}%`} value={igstVal} cls="rv-green" />
            </div>

            <div className="summary-block">
              <RR label={`Duty excl. IGST (${dutyLabel})`} value={dutyExGst} cls="rv-lime" />
              <RR label="IGST" value={igstVal} cls="rv-green" />
              <RR label="Total Duty Payable" value={totalDuty} cls="rv-lime rv-big" bold sep />
              <div className="result-row">
                <span className="result-label">Effective Duty Rate on AV</span>
                <span className="result-value rv-dim">{fmt(effPct)}%</span>
              </div>
            </div>

            <div className="total-card">
              <div>
                <div className="total-label">Total Duty Payable</div>
                <div className="total-sub">{dutyLabel} + IGST</div>
              </div>
              <div className="total-value">₹{fmt(totalDuty)}</div>
            </div>
          </div>
        </>}

        {/* ══════════════ LANDED COST TAB ══════════════ */}
        {tab === "landed" && <>
          <div className="card">
            <div className="section-header">
              <div className="card-title">Landed Cost Inputs</div>
              <button className="btn-reset" onClick={() => setLc(INIT_LC)}>Reset</button>
            </div>

            {/* Auto-filled */}
            <div className="auto-group">
              <div className="auto-group-title">Auto-filled from Duty Calculator</div>
              <div className="grid-2">
                <ReadonlyField label="Invoice Value (INR)" value={invoiceINR} />
                <ReadonlyField label="Insurance (INR)" value={insINR} />
                <ReadonlyField label={`Duties excl. IGST (${dutyLabel})`} value={dutyExGst} color="var(--lime)" />
                <ReadonlyField label="Misc / EX Works (INR)" value={miscINR} />
              </div>
              {av === 0 && (
                <div className="warning" style={{ marginTop:14 }}>
                  <span>ℹ</span>
                  <span>Fill in the <strong>Duty Calculator</strong> tab first — values auto-populate here.</span>
                </div>
              )}
            </div>

            <div className="divider" />

            {/* Freight */}
            <div style={{ marginBottom:20 }}>
              <div className="group-label">Freight</div>
              <CxField currency={lc.freightCurrency} value={lc.freightValue}
                onCurrencyChange={e => { slc("freightCurrency",e.target.value); slc("freightRate",""); }}
                onValueChange={e => slc("freightValue",e.target.value)} />
              <PerFieldRate currency={lc.freightCurrency} invoiceCur={f.invoiceCurrency}
                invoiceRateStr={f.invoiceRate} rate={lc.freightRate}
                onRateChange={e => slc("freightRate",e.target.value)} fieldValue={lc.freightValue} />
            </div>

            <div className="divider" />

            {/* Fixed local charges */}
            <div className="group-label">Local Charges</div>
            <div className="grid-2" style={{ marginBottom:14 }}>
              {[
                ["CFS / AAI Charges (INR)",       "cfcAai"],
                ["Customs Clearance Charges (INR)","customsClearance"],
                ["Transportation Charges (INR)",   "transportation"],
                ["DG Charges (INR)",               "dgCharges"],
                ["CC Fee (INR)",                   "ccFee"],
                ["Delivery Order Charges (INR)",   "deliveryOrder"],
              ].map(([lbl, key]) => (
                <div className="field" key={key}>
                  <label>{lbl}</label>
                  <input className="input" type="number" placeholder="0.00"
                    value={lc[key]} onChange={e => slc(key, e.target.value)} />
                </div>
              ))}
            </div>

            {/* Dynamic additional charges */}
            {lc.additionalCharges.length > 0 && (
              <div style={{ marginBottom:8 }}>
                {lc.additionalCharges.map(c => (
                  <div key={c.id} className="lc-item">
                    <input className="input" type="text" placeholder="Description"
                      value={c.label} onChange={e => updExtra(c.id,"label",e.target.value)} />
                    <input className="input" type="number" placeholder="Amount (INR)"
                      value={c.amount} onChange={e => updExtra(c.id,"amount",e.target.value)} />
                    <button className="lc-del" onClick={() => delExtra(c.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <button className="lc-add-btn" onClick={addExtra}>+ Add additional charge</button>
          </div>

          {/* LC Results */}
          <div className="card">
            <div className="card-title">Landed Cost Breakup</div>
            <div className="tape" />

            <div className="block-label">Import Cost (ex-India)</div>
            <div className="sub-result">
              <RR label="Invoice Value" value={invoiceINR} />
              <RR label="Insurance" value={insINR} />
              <RR label="Misc / EX Works" value={miscINR} />
              <RR label={`Duties excl. IGST (${dutyLabel})`} value={dutyExGst} cls="rv-lime" />
              <RR label="Import Sub-total" value={lcAutoBase} cls="rv-lime" bold sep />
            </div>

            <div className="block-label">Freight & Local Charges (India)</div>
            <div className="sub-result">
              {lcFreight       > 0 && <RR label="Freight" value={lcFreight} />}
              {lcCfcAai        > 0 && <RR label="CFS / AAI Charges" value={lcCfcAai} />}
              {lcCustClearance > 0 && <RR label="Customs Clearance Charges" value={lcCustClearance} />}
              {lcTransport     > 0 && <RR label="Transportation Charges" value={lcTransport} />}
              {lcDG            > 0 && <RR label="DG Charges" value={lcDG} />}
              {lcCCFee         > 0 && <RR label="CC Fee" value={lcCCFee} />}
              {lcDeliveryOrder > 0 && <RR label="Delivery Order Charges" value={lcDeliveryOrder} />}
              {lc.additionalCharges.map(c => num(c.amount)>0 && (
                <RR key={c.id} label={c.label||"Additional Charge"} value={num(c.amount)} />
              ))}
              {lcLocalSubtotal === 0
                ? <div className="result-row"><span className="result-label" style={{ color:"var(--text-3)", fontStyle:"italic" }}>No local charges entered</span><span /></div>
                : <RR label="Local Charges Sub-total" value={lcLocalSubtotal} cls="rv-yel" bold sep />
              }
            </div>

            <div className="summary-block">
              <RR label="Import Sub-total" value={lcAutoBase} cls="rv-lime" />
              <RR label="Local Charges" value={lcLocalSubtotal} cls="rv-yel" />
              <RR label="Total Landed Cost" value={lcTotal} cls="rv-green rv-big" bold sep />
            </div>

            <div className="total-card-green">
              <div>
                <div className="total-label">Total Landed Cost</div>
                <div className="total-sub">Invoice + Insurance + Misc + Duties excl. IGST + Freight + Local Charges</div>
              </div>
              <div className="total-value">₹{fmt(lcTotal)}</div>
            </div>

            {lcTotal > 0 && invoiceINR > 0 && (
              <div className="stat-row">
                <div className="stat-box">
                  <div className="stat-label">Invoice → Landed</div>
                  <div className="stat-value" style={{ color:"var(--lime)" }}>+{fmt(((lcTotal/invoiceINR)-1)*100)}%</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Duty Share</div>
                  <div className="stat-value" style={{ color:"var(--lavender)" }}>{fmt((dutyExGst/lcTotal)*100)}%</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Local Charges</div>
                  <div className="stat-value" style={{ color:"var(--yellow)" }}>₹{fmt(lcLocalSubtotal)}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Add-ons over Invoice</div>
                  <div className="stat-value" style={{ color:"var(--green)" }}>₹{fmt(lcTotal-invoiceINR)}</div>
                </div>
              </div>
            )}
          </div>
        </>}

        <div style={{ textAlign:"center", fontSize:11, color:"var(--text-3)", marginTop:12 }}>
          For guidance only · Verify with your CHA or customs broker · Rates subject to change
        </div>
      </div>
    </>
  );
}