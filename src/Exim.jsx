import { useState, useCallback } from "react";

// Default exchange rates (approximate mid-market vs INR)
const DEFAULT_RATES = { INR: 1, USD: 83.5, EUR: 91.2, GBP: 106.8, JPY: 0.56, AED: 22.73, CNY: 11.5 };
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AED", "CNY"];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --navy:    #0f1b2d; --navy-2:  #162236; --navy-3:  #1e3150;
    --slate:   #2a3f5f; --border:  #2e4a6e;
    --amber:   #f59e0b; --amber-l: #fbbf24; --amber-d: #d97706;
    --teal:    #0d9488; --teal-l:  #14b8a6;
    --red:     #ef4444; --red-l:   #fca5a5;
    --text-1:  #e2eaf5; --text-2:  #94a8c0; --text-3:  #5c7a99;
    --green:   #10b981; --green-l: #6ee7b7; --purple:  #8b5cf6;
  }
  body { background: var(--navy); color: var(--text-1); font-family: 'Inter', sans-serif; min-height: 100vh; }
  .app { max-width: 1100px; margin: 0 auto; padding: 24px 16px 64px; }

  /* Header */
  .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
  .header-icon { width: 48px; height: 48px; background: var(--amber); border-radius: 12px;
    display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .header h1 { font-size: 22px; font-weight: 700; color: var(--text-1); letter-spacing: -0.3px; }
  .header p  { font-size: 13px; color: var(--text-2); margin-top: 2px; }

  /* Tabs */
  .tabs { display: flex; gap: 4px; background: var(--navy-2); border-radius: 12px; padding: 4px;
    border: 1px solid var(--border); margin-bottom: 24px; width: fit-content; }
  .tab { padding: 8px 20px; border-radius: 9px; font-size: 13px; font-weight: 500;
    cursor: pointer; border: none; transition: all .2s; color: var(--text-2); background: transparent; }
  .tab.active { background: var(--amber); color: var(--navy); font-weight: 600; }
  .tab:hover:not(.active) { color: var(--text-1); background: var(--slate); }

  /* Card */
  .card { background: var(--navy-2); border: 1px solid var(--border); border-radius: 16px;
    padding: 24px; margin-bottom: 20px; }
  .card-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;
    color: var(--amber); margin-bottom: 18px; }
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }

  /* Grid */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media(max-width: 640px) { .grid-2 { grid-template-columns: 1fr; } }

  /* Field */
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-size: 11px; font-weight: 600; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.8px; }

  /* Remove number input arrows */
  input[type=number] { -moz-appearance: textfield; }
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

  /* Currency+Value combined input */
  .cx-wrap { display: flex; border: 1px solid var(--border); border-radius: 8px;
    overflow: hidden; background: var(--navy-3); transition: border-color .2s; }
  .cx-wrap:focus-within { border-color: var(--amber); }
  .cx-select { border: none; border-right: 1px solid var(--border); border-radius: 0;
    background: rgba(46,74,110,.4); color: var(--amber-l); font-size: 13px; font-weight: 600;
    padding: 9px 10px; width: 72px; flex-shrink: 0; cursor: pointer; outline: none;
    appearance: none; -webkit-appearance: none; text-align: center; }
  .cx-select option { background: var(--navy-3); color: var(--text-1); }
  .cx-input { border: none; background: transparent; color: var(--text-1); font-size: 14px;
    padding: 9px 12px; width: 100%; outline: none; font-family: 'Inter', sans-serif; }
  .cx-input::placeholder { color: var(--text-3); }
  .cx-converted { font-size: 11px; color: var(--text-3); margin-top: 5px; padding-left: 2px; }

  /* Plain input */
  .input { background: var(--navy-3); border: 1px solid var(--border); border-radius: 8px;
    color: var(--text-1); font-size: 14px; padding: 9px 12px; width: 100%;
    font-family: 'Inter', sans-serif; outline: none; transition: border-color .2s; }
  .input:focus { border-color: var(--amber); }
  .input.readonly { background: rgba(13,148,136,.07); border-color: rgba(13,148,136,.25);
    color: var(--teal-l); cursor: default; font-weight: 600; }

  /* Pct row */
  .pct-row { display: flex; gap: 8px; align-items: center; }
  .pct-row .cx-wrap { flex: 1; }
  .pct-box { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .pct-box span { font-size: 11px; color: var(--text-3); white-space: nowrap; }
  .pct-input { width: 72px; background: var(--navy-3); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text-1); font-size: 14px; padding: 9px 10px;
    outline: none; transition: border-color .2s; text-align: center; }
  .pct-input:focus { border-color: var(--amber); }

  /* Warning */
  .warning { background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.3);
    border-radius: 8px; padding: 10px 14px; font-size: 12px; color: var(--amber-l); margin-top: 8px;
    display: flex; align-items: flex-start; gap: 8px; }

  /* Tape */
  .tape { height: 3px; background: linear-gradient(90deg, var(--amber-d), var(--amber), var(--amber-l), var(--amber));
    border-radius: 2px; margin: 8px 0 20px; box-shadow: 0 0 12px rgba(245,158,11,.4); }

  /* Result rows */
  .result-row { display: flex; justify-content: space-between; align-items: center;
    padding: 9px 0; border-bottom: 1px solid rgba(46,74,110,.5); }
  .result-row:last-child { border-bottom: none; }
  .result-label { font-size: 13px; color: var(--text-2); }
  .result-value { font-size: 14px; font-weight: 600; color: var(--text-1); }
  .result-value.gl  { color: var(--green-l); }
  .result-value.teal{ color: var(--teal-l); }
  .result-value.amb { color: var(--amber-l); }
  .result-value.pur { color: var(--purple); }
  .result-value.dim { color: var(--text-2); font-weight: 500; }

  /* Sub-result blocks */
  .sub-result { background: var(--navy-3); border-radius: 10px; padding: 14px 16px; }
  .sub-result .result-row { padding: 7px 0; }
  .block-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
    color: var(--text-3); margin: 16px 0 6px; }
  .block-label:first-child { margin-top: 0; }

  /* Summary block */
  .summary-block { background: rgba(110,231,183,.06); border: 1px solid rgba(110,231,183,.15);
    border-radius: 10px; padding: 14px 16px; margin-top: 12px; }
  .summary-block .result-row { padding: 7px 0; }

  /* Total card */
  .total-card { background: linear-gradient(135deg, var(--amber-d) 0%, var(--amber) 100%);
    border-radius: 14px; padding: 20px 24px; display: flex; justify-content: space-between;
    align-items: center; margin-top: 20px; }
  .total-label { font-size: 13px; font-weight: 600; color: rgba(15,27,45,.8); }
  .total-value { font-size: 26px; font-weight: 700; color: var(--navy); }
  .total-sub   { font-size: 11px; color: rgba(15,27,45,.6); margin-top: 2px; }

  /* Buttons */
  .btn-reset { background: transparent; border: 1px solid var(--border); border-radius: 8px;
    color: var(--text-2); font-size: 13px; padding: 8px 20px; cursor: pointer; transition: all .2s; }
  .btn-reset:hover { border-color: var(--red-l); color: var(--red-l); }

  /* Auto badge */
  .auto-badge { display: inline-flex; align-items: center;
    background: rgba(13,148,136,.12); border: 1px solid rgba(13,148,136,.28);
    border-radius: 20px; font-size: 9px; color: var(--teal-l);
    padding: 2px 7px; font-weight: 700; margin-left: 6px; letter-spacing: 0.5px; }

  /* Auto group */
  .auto-group { background: rgba(13,148,136,.05); border: 1px solid rgba(13,148,136,.18);
    border-radius: 12px; padding: 18px; margin-bottom: 16px; }
  .auto-group-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;
    color: var(--teal-l); margin-bottom: 14px; }

  /* Divider */
  .divider { height: 1px; background: var(--border); margin: 18px 0; }

  /* LC additional charges */
  .lc-add-btn { background: transparent; border: 1px dashed var(--border); border-radius: 8px;
    color: var(--text-2); font-size: 13px; padding: 9px 16px; cursor: pointer; width: 100%;
    margin-top: 10px; transition: all .2s; }
  .lc-add-btn:hover { border-color: var(--amber); color: var(--amber); }
  .lc-item { display: grid; grid-template-columns: 1fr 160px auto; gap: 10px;
    align-items: center; margin-bottom: 10px; }
  .lc-del { background: transparent; border: none; color: var(--text-3); cursor: pointer;
    font-size: 16px; padding: 4px 8px; border-radius: 6px; transition: color .2s; }
  .lc-del:hover { color: var(--red); }

  /* Stat boxes */
  .stat-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
  .stat-box { flex: 1; min-width: 130px; background: var(--navy-3); border-radius: 10px; padding: 12px 16px; }
  .stat-label { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
  .stat-value { font-size: 18px; font-weight: 700; }
`;

const fmt = (n) =>
  isNaN(n) || n === undefined
    ? "—"
    : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

// Currency+Value combined field — auto-fills exchange rate hint
const CxField = ({ currency, value, onCurrencyChange, onValueChange, exRate, placeholder = "0.00" }) => {
  const converted = currency !== "INR" && num(value) > 0
    ? num(value) * (num(exRate) || DEFAULT_RATES[currency] || 1)
    : null;
  return (
    <div>
      <div className="cx-wrap">
        <select className="cx-select" value={currency} onChange={onCurrencyChange}>
          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="cx-input" type="number" placeholder={placeholder}
          value={value} onChange={onValueChange} />
      </div>
      {converted !== null && (
        <div className="cx-converted">= ₹{fmt(converted)}</div>
      )}
    </div>
  );
};

const ReadonlyField = ({ label, value, color }) => (
  <div className="field">
    <label>{label}<span className="auto-badge">AUTO</span></label>
    <input className="input readonly" readOnly
      value={value > 0 ? `₹ ${fmt(value)}` : "—"}
      style={color ? { color } : {}} />
  </div>
);

const INIT_DUTY = {
  invoiceValue: "", exchangeRate: "",
  freightValue: "", freightCurrency: "INR", freightPct: "",
  insuranceValue: "", insuranceCurrency: "INR", insurancePct: "",
  miscValue: "", miscCurrency: "INR",
  bcdPct: "", swsPct: "", igstPct: "", addPct: "",
};

const INIT_LC = {
  lcFreightValue: "", lcFreightCurrency: "INR",
  localTransport: "", handlingCharges: "", customsClearance: "", portCharges: "",
  additionalCharges: [],
};

export default function Exim() {
  const [tab, setTab] = useState("duty");
  const [f, setF]     = useState(INIT_DUTY);
  const [lc, setLc]   = useState(INIT_LC);

  const setField   = useCallback((k, v) => setF(p  => ({ ...p, [k]: v })), []);
  const setLcField = useCallback((k, v) => setLc(p => ({ ...p, [k]: v })), []);

  // When currency changes, auto-fill exchange rate if not manually set
  const handleCurrencyChange = (currencyKey, valueKey, newCur) => {
    setField(currencyKey, newCur);
    if (newCur !== "INR" && !num(f.exchangeRate)) {
      setField("exchangeRate", DEFAULT_RATES[newCur]?.toString() || "");
    }
  };

  // ── Duty calculations ──────────────────────────────────────────────────────
  const exRate     = num(f.exchangeRate) || 1;
  const invoiceINR = num(f.invoiceValue) * exRate;

  const freightRaw       = num(f.freightValue) * (f.freightCurrency === "INR" ? 1 : exRate);
  const freightCap       = invoiceINR * 0.2;
  const freightCapped    = freightRaw > freightCap && invoiceINR > 0;
  const freightINR       = freightCapped ? freightCap : freightRaw;
  const freightPctActual = invoiceINR > 0 ? (freightINR / invoiceINR) * 100 : 0;

  const insurancePctVal  = num(f.insurancePct);
  const insuranceFlatRaw = num(f.insuranceValue) * (f.insuranceCurrency === "INR" ? 1 : exRate);
  const insuranceINR     = insurancePctVal > 0
    ? (invoiceINR + freightINR) * (insurancePctVal / 100)
    : insuranceFlatRaw;

  const miscINR          = num(f.miscValue) * (f.miscCurrency === "INR" ? 1 : exRate);
  const assessableValue  = invoiceINR + freightINR + insuranceINR + miscINR;

  const bcdPct    = num(f.bcdPct);
  const bcdValue  = assessableValue * (bcdPct / 100);
  const swsPct    = num(f.swsPct);
  const swsValue  = bcdValue * (swsPct / 100);
  const igstBase  = assessableValue + bcdValue + swsValue;
  const igstPct   = num(f.igstPct);
  const igstValue = igstBase * (igstPct / 100);
  const addPct    = num(f.addPct);
  const addValue  = assessableValue * (addPct / 100);

  const dutyExGst        = bcdValue + swsValue + addValue;
  const totalDuty        = dutyExGst + igstValue;
  const effectiveDutyPct = assessableValue > 0 ? (totalDuty / assessableValue) * 100 : 0;

  // ── Landed cost ────────────────────────────────────────────────────────────
  const lcInvoiceINR   = invoiceINR;
  const lcInsuranceINR = insuranceINR;
  const lcDutyExGst    = dutyExGst;
  const lcMiscINR      = miscINR;

  const lcFreightINR     = num(lc.lcFreightValue) * (lc.lcFreightCurrency === "INR" ? 1 : exRate);
  const lcLocalTransport = num(lc.localTransport);
  const lcHandling       = num(lc.handlingCharges);
  const lcCustClearance  = num(lc.customsClearance);
  const lcPort           = num(lc.portCharges);
  const lcAddOther       = lc.additionalCharges.reduce((s, c) => s + num(c.amount), 0);

  // Landed = Invoice + Freight + Insurance + Misc + Duties(excl.IGST) + local charges
  const lcTotal = lcInvoiceINR + lcFreightINR + lcInsuranceINR + lcMiscINR
                + lcDutyExGst + lcLocalTransport + lcHandling + lcCustClearance + lcPort + lcAddOther;

  const addAdditional    = () => setLc(p => ({ ...p, additionalCharges: [...p.additionalCharges, { id: Date.now(), label: "", amount: "" }] }));
  const updateAdditional = (id, k, v) => setLc(p => ({ ...p, additionalCharges: p.additionalCharges.map(c => c.id === id ? { ...c, [k]: v } : c) }));
  const removeAdditional = (id) => setLc(p => ({ ...p, additionalCharges: p.additionalCharges.filter(c => c.id !== id) }));

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">

        <div className="header">
          <div className="header-icon">🛃</div>
          <div>
            <h1>India Customs Duty Calculator</h1>
            <p>CIF-based assessable value · BCD · SWS · IGST · ADD · Landed Cost</p>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === "duty" ? "active" : ""}`} onClick={() => setTab("duty")}>Duty Calculator</button>
          <button className={`tab ${tab === "landed" ? "active" : ""}`} onClick={() => setTab("landed")}>Landed Cost</button>
        </div>

        {/* ══════════════════════════ DUTY TAB ══════════════════════════════ */}
        {tab === "duty" && (
          <>
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
                    currency={f.freightCurrency === "INR" ? "INR" : f.freightCurrency}
                    value={f.invoiceValue}
                    exRate={f.exchangeRate}
                    onCurrencyChange={() => {}}
                    onValueChange={e => setField("invoiceValue", e.target.value)}
                    placeholder="0.00"
                  />
                  {/* Standalone currency selector for invoice */}
                  <div style={{ display: "none" }} />
                </div>
                <div className="field">
                  <label>Exchange Rate (1 Unit → INR)</label>
                  <input className="input" type="number" placeholder="e.g. 83.50"
                    value={f.exchangeRate} onChange={e => setField("exchangeRate", e.target.value)} />
                </div>
              </div>
              {invoiceINR > 0 && (
                <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-2)" }}>
                  Invoice in INR: <strong style={{ color: "var(--green-l)" }}>₹{fmt(invoiceINR)}</strong>
                </div>
              )}
            </div>

            {/* Freight / Insurance / Misc */}
            <div className="card">
              <div className="card-title">Freight, Insurance & Misc Charges</div>

              {/* Freight */}
              <div className="field" style={{ marginBottom: 16 }}>
                <label>
                  Freight
                  {freightCapped && <span className="auto-badge" style={{ background: "rgba(239,68,68,.12)", borderColor: "rgba(239,68,68,.3)", color: "var(--red-l)" }}>CAPPED 20%</span>}
                </label>
                <div className="pct-row">
                  <CxField
                    currency={f.freightCurrency}
                    value={f.freightValue}
                    exRate={f.exchangeRate}
                    onCurrencyChange={e => handleCurrencyChange("freightCurrency", "freightValue", e.target.value)}
                    onValueChange={e => setField("freightValue", e.target.value)}
                  />
                  <div className="pct-box">
                    <span>Add %</span>
                    <input className="pct-input" type="number" placeholder="%" value={f.freightPct}
                      onChange={e => setField("freightPct", e.target.value)} />
                  </div>
                </div>
                {freightCapped && (
                  <div className="warning">
                    <span>⚠</span>
                    <span>Freight (₹{fmt(freightRaw)}) exceeds 20% of invoice — capped at <strong>₹{fmt(freightCap)}</strong> for AV.</span>
                  </div>
                )}
                {invoiceINR > 0 && freightINR > 0 && (
                  <div className="cx-converted">Freight in AV: ₹{fmt(freightINR)} ({fmt(freightPctActual)}% of invoice)</div>
                )}
              </div>

              {/* Insurance */}
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Insurance</label>
                <div className="pct-row">
                  <CxField
                    currency={f.insuranceCurrency}
                    value={f.insuranceValue}
                    exRate={f.exchangeRate}
                    onCurrencyChange={e => { handleCurrencyChange("insuranceCurrency", "insuranceValue", e.target.value); setField("insurancePct", ""); }}
                    onValueChange={e => { setField("insuranceValue", e.target.value); setField("insurancePct", ""); }}
                    placeholder="Flat amount"
                  />
                  <div className="pct-box">
                    <span>OR %</span>
                    <input className="pct-input" type="number" placeholder="%" value={f.insurancePct}
                      onChange={e => { setField("insurancePct", e.target.value); setField("insuranceValue", ""); }} />
                  </div>
                </div>
                {insurancePctVal > 0 && (
                  <div className="cx-converted">= {insurancePctVal}% of (Invoice + Freight) = ₹{fmt(insuranceINR)}</div>
                )}
              </div>

              {/* Misc */}
              <div className="field">
                <label>Miscellaneous / EX Works Charges</label>
                <CxField
                  currency={f.miscCurrency}
                  value={f.miscValue}
                  exRate={f.exchangeRate}
                  onCurrencyChange={e => handleCurrencyChange("miscCurrency", "miscValue", e.target.value)}
                  onValueChange={e => setField("miscValue", e.target.value)}
                />
              </div>
            </div>

            {/* Duty Rates */}
            <div className="card">
              <div className="card-title">Duty Rates</div>
              <div className="grid-2">
                <div className="field">
                  <label>Basic Customs Duty (BCD) %</label>
                  <input className="input" type="number" placeholder="e.g. 10"
                    value={f.bcdPct} onChange={e => setField("bcdPct", e.target.value)} />
                </div>
                <div className="field">
                  <label>Social Welfare Surcharge (SWS) %</label>
                  <input className="input" type="number" placeholder="e.g. 10 (on BCD)"
                    value={f.swsPct} onChange={e => setField("swsPct", e.target.value)} />
                </div>
                <div className="field">
                  <label>IGST %</label>
                  <input className="input" type="number" placeholder="e.g. 18"
                    value={f.igstPct} onChange={e => setField("igstPct", e.target.value)} />
                </div>
                <div className="field">
                  <label>Anti-Dumping Duty (ADD) %</label>
                  <input className="input" type="number" placeholder="e.g. 5"
                    value={f.addPct} onChange={e => setField("addPct", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="card">
              <div className="card-title">Computation Breakup</div>
              <div className="tape" />

              {/* Assessable Value */}
              <div className="block-label">Assessable Value (CIF)</div>
              <div className="sub-result">
                <div className="result-row">
                  <span className="result-label">Invoice Value (INR)</span>
                  <span className="result-value">₹{fmt(invoiceINR)}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Freight{freightCapped ? " (capped at 20%)" : ""}</span>
                  <span className="result-value">₹{fmt(freightINR)}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Insurance</span>
                  <span className="result-value">₹{fmt(insuranceINR)}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Misc / EX Works</span>
                  <span className="result-value">₹{fmt(miscINR)}</span>
                </div>
                <div className="result-row" style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4 }}>
                  <span className="result-label" style={{ fontWeight: 600, color: "var(--text-1)" }}>Assessable Value</span>
                  <span className="result-value gl">₹{fmt(assessableValue)}</span>
                </div>
              </div>

              {/* Customs Duty excl. IGST */}
              <div className="block-label">Customs Duty (excl. IGST)</div>
              <div className="sub-result">
                <div className="result-row">
                  <span className="result-label">BCD @ {bcdPct}% on AV</span>
                  <span className="result-value gl">₹{fmt(bcdValue)}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">SWS @ {swsPct}% on BCD</span>
                  <span className="result-value gl">₹{fmt(swsValue)}</span>
                </div>
                {addValue > 0 && (
                  <div className="result-row">
                    <span className="result-label">ADD @ {addPct}% on AV</span>
                    <span className="result-value pur">₹{fmt(addValue)}</span>
                  </div>
                )}
                <div className="result-row" style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4 }}>
                  <span className="result-label" style={{ fontWeight: 600, color: "var(--text-1)" }}>
                    Total Duty excl. IGST
                  </span>
                  <span className="result-value gl">₹{fmt(dutyExGst)}</span>
                </div>
              </div>

              {/* IGST */}
              <div className="block-label">IGST</div>
              <div className="sub-result">
                <div className="result-row">
                  <span className="result-label">IGST Base (AV + BCD + SWS)</span>
                  <span className="result-value dim">₹{fmt(igstBase)}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">IGST @ {igstPct}%</span>
                  <span className="result-value teal">₹{fmt(igstValue)}</span>
                </div>
              </div>

              {/* Summary */}
              <div className="summary-block">
                <div className="result-row">
                  <span className="result-label">Duty excl. IGST (BCD + SWS{addValue > 0 ? " + ADD" : ""})</span>
                  <span className="result-value gl">₹{fmt(dutyExGst)}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">IGST</span>
                  <span className="result-value teal">₹{fmt(igstValue)}</span>
                </div>
                <div className="result-row" style={{ borderTop: "1px solid rgba(110,231,183,.2)", paddingTop: 10, marginTop: 4 }}>
                  <span className="result-label" style={{ fontWeight: 700, color: "var(--text-1)" }}>Total Duty Payable</span>
                  <span className="result-value gl" style={{ fontSize: 16 }}>₹{fmt(totalDuty)}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Effective Duty Rate on AV</span>
                  <span className="result-value dim">{fmt(effectiveDutyPct)}%</span>
                </div>
              </div>

              <div className="total-card">
                <div>
                  <div className="total-label">Total Duty Payable</div>
                  <div className="total-sub">BCD + SWS{addValue > 0 ? " + ADD" : ""} + IGST</div>
                </div>
                <div className="total-value">₹{fmt(totalDuty)}</div>
              </div>
            </div>
          </>
        )}

        {/* ═════════════════════════ LANDED COST TAB ════════════════════════ */}
        {tab === "landed" && (
          <>
            <div className="card">
              <div className="section-header">
                <div className="card-title">Landed Cost Inputs</div>
                <button className="btn-reset" onClick={() => setLc(INIT_LC)}>Reset</button>
              </div>

              {/* Auto-filled */}
              <div className="auto-group">
                <div className="auto-group-title">From Duty Calculator</div>
                <div className="grid-2">
                  <ReadonlyField label="Invoice Value (INR)" value={lcInvoiceINR} />
                  <ReadonlyField label="Insurance (INR)" value={lcInsuranceINR} />
                  <ReadonlyField label="Duties excl. IGST (BCD + SWS{addValue > 0 ? ' + ADD' : ''})" value={lcDutyExGst} color="var(--green-l)" />
                  <ReadonlyField label="Misc / EX Works (INR)" value={lcMiscINR} />
                </div>
                {assessableValue === 0 && (
                  <div className="warning" style={{ marginTop: 14 }}>
                    <span>ℹ</span>
                    <span>Fill in the <strong>Duty Calculator</strong> tab first — values will auto-populate here.</span>
                  </div>
                )}
              </div>

              <div className="divider" />

              {/* Freight — manual */}
              <div className="field" style={{ marginBottom: 18 }}>
                <label>Freight</label>
                <CxField
                  currency={lc.lcFreightCurrency}
                  value={lc.lcFreightValue}
                  exRate={f.exchangeRate}
                  onCurrencyChange={e => setLcField("lcFreightCurrency", e.target.value)}
                  onValueChange={e => setLcField("lcFreightValue", e.target.value)}
                />
              </div>

              <div className="divider" />

              {/* Local charges */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--amber)", marginBottom: 14 }}>
                  Local & Additional Charges
                </div>
                <div className="grid-2" style={{ marginBottom: 12 }}>
                  <div className="field">
                    <label>Local Transport (INR)</label>
                    <input className="input" type="number" placeholder="0.00"
                      value={lc.localTransport} onChange={e => setLcField("localTransport", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Handling Charges (INR)</label>
                    <input className="input" type="number" placeholder="0.00"
                      value={lc.handlingCharges} onChange={e => setLcField("handlingCharges", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Customs Clearance / CHA (INR)</label>
                    <input className="input" type="number" placeholder="0.00"
                      value={lc.customsClearance} onChange={e => setLcField("customsClearance", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Port / Demurrage (INR)</label>
                    <input className="input" type="number" placeholder="0.00"
                      value={lc.portCharges} onChange={e => setLcField("portCharges", e.target.value)} />
                  </div>
                </div>

                {lc.additionalCharges.map(c => (
                  <div key={c.id} className="lc-item">
                    <input className="input" type="text" placeholder="Description"
                      value={c.label} onChange={e => updateAdditional(c.id, "label", e.target.value)} />
                    <input className="input" type="number" placeholder="Amount (INR)"
                      value={c.amount} onChange={e => updateAdditional(c.id, "amount", e.target.value)} />
                    <button className="lc-del" onClick={() => removeAdditional(c.id)}>✕</button>
                  </div>
                ))}
                <button className="lc-add-btn" onClick={addAdditional}>+ Add charge</button>
              </div>
            </div>

            {/* LC Results */}
            <div className="card">
              <div className="card-title">Landed Cost Breakup</div>
              <div className="tape" />

              {/* Import cost components */}
              <div className="block-label">Import Cost Components</div>
              <div className="sub-result">
                <div className="result-row">
                  <span className="result-label">Invoice Value</span>
                  <span className="result-value">{lcInvoiceINR > 0 ? `₹${fmt(lcInvoiceINR)}` : "—"}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Freight</span>
                  <span className="result-value">{lcFreightINR > 0 ? `₹${fmt(lcFreightINR)}` : "—"}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Insurance</span>
                  <span className="result-value">{lcInsuranceINR > 0 ? `₹${fmt(lcInsuranceINR)}` : "—"}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Misc / EX Works</span>
                  <span className="result-value">{lcMiscINR > 0 ? `₹${fmt(lcMiscINR)}` : "—"}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Duties excl. IGST</span>
                  <span className="result-value gl">{lcDutyExGst > 0 ? `₹${fmt(lcDutyExGst)}` : "—"}</span>
                </div>
              </div>

              {/* Local charges */}
              <div className="block-label">Local Charges</div>
              <div className="sub-result">
                <div className="result-row">
                  <span className="result-label">Local Transport</span>
                  <span className="result-value">{lcLocalTransport > 0 ? `₹${fmt(lcLocalTransport)}` : "—"}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Handling Charges</span>
                  <span className="result-value">{lcHandling > 0 ? `₹${fmt(lcHandling)}` : "—"}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Customs Clearance / CHA</span>
                  <span className="result-value">{lcCustClearance > 0 ? `₹${fmt(lcCustClearance)}` : "—"}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Port / Demurrage</span>
                  <span className="result-value">{lcPort > 0 ? `₹${fmt(lcPort)}` : "—"}</span>
                </div>
                {lc.additionalCharges.map(c => (
                  <div className="result-row" key={c.id}>
                    <span className="result-label">{c.label || "Additional Charge"}</span>
                    <span className="result-value">{num(c.amount) > 0 ? `₹${fmt(num(c.amount))}` : "—"}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="total-card">
                <div>
                  <div className="total-label">Total Landed Cost</div>
                  <div className="total-sub">Invoice + Freight + Insurance + Misc + Duties (excl. IGST) + Local Charges</div>
                </div>
                <div className="total-value">₹{fmt(lcTotal)}</div>
              </div>

              {/* Stat boxes */}
              {lcTotal > 0 && lcInvoiceINR > 0 && (
                <div className="stat-row">
                  <div className="stat-box">
                    <div className="stat-label">Invoice → Landed</div>
                    <div className="stat-value" style={{ color: "var(--green-l)" }}>
                      +{fmt(((lcTotal / lcInvoiceINR) - 1) * 100)}%
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Duty Component</div>
                    <div className="stat-value" style={{ color: "var(--amber-l)" }}>
                      {lcTotal > 0 ? fmt((lcDutyExGst / lcTotal) * 100) : "—"}%
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Add-ons over Invoice</div>
                    <div className="stat-value" style={{ color: "var(--purple)" }}>
                      ₹{fmt(lcTotal - lcInvoiceINR)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
          For guidance only · Verify with your CHA or customs broker · Rates subject to change
        </div>
      </div>
    </>
  );
}