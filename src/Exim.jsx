import { useState, useCallback } from "react";

const EXAMPLE_RATES = { USD:"83.50",EUR:"91.20",GBP:"106.80",JPY:"0.56",AED:"22.73",CNY:"11.50" };
const CURRENCIES = ["INR","USD","EUR","GBP","JPY","AED","CNY"];
const fmt = (n) => isNaN(n)||n===undefined ? "—" : n.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const num = (v) => { const n=parseFloat(v); return isNaN(n)?0:n; };
const toINR = (val,cur,rate) => num(val)*(cur==="INR"?1:num(rate));

/* ─────────────────────────────────────────────────────
   COLOUR PALETTE
   bg-0 : #05080F  deepest page bg
   bg-1 : #0C1120  card bg
   bg-2 : #111A2E  input / panel bg
   bg-3 : #1A2C48  elevated surface / hover

   ink-1: #E8EEF6  primary text
   ink-2: #7A8FA8  secondary text
   ink-3: #3C5068  muted / placeholders

   border: rgba(255,255,255,.07)
   border-hi: rgba(255,255,255,.14)

   Accent palette
   c-lime  : #BBFF00   primary CTA, tabs, key values
   c-cyan  : #00E5CC   auto-fill / readonly / landed
   c-violet: #A78BFA   ADD / AIDC
   c-amber : #FFB340   warnings, local charges
   c-sky   : #38BDF8   IGST / rates
   c-rose  : #F87171   danger / capped

   Mono font for numbers: JetBrains Mono
───────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  :root{
    --bg0:#05080F; --bg1:#0C1120; --bg2:#111A2E; --bg3:#1A2C48;
    --i1:#E8EEF6;  --i2:#7A8FA8; --i3:#3C5068;
    --bd:rgba(255,255,255,.07); --bdh:rgba(255,255,255,.14);
    --lime:#BBFF00;   --lime-d:#8FBF00; --lime-dim:rgba(187,255,0,.07);
    --cyan:#00E5CC;   --cyan-dim:rgba(0,229,204,.07);
    --violet:#A78BFA; --violet-dim:rgba(167,139,250,.07);
    --amber:#FFB340;  --amber-dim:rgba(255,179,64,.07);
    --sky:#38BDF8;    --sky-dim:rgba(56,189,248,.07);
    --rose:#F87171;   --rose-dim:rgba(248,113,113,.07);
    --mono:'JetBrains Mono',monospace;
  }

  body{background:var(--bg0);color:var(--i1);font-family:'Inter',sans-serif;min-height:100vh}
  .app{max-width:1080px;margin:0 auto;padding:24px 14px 80px}
  @media(min-width:600px){.app{padding:36px 18px 90px}}

  input[type=number]{-moz-appearance:textfield}
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}

  /* ── Header ── */
  .hdr{margin-bottom:28px}
  .hdr-tag{font-size:9px;font-weight:800;letter-spacing:3px;text-transform:uppercase;
    color:var(--lime);margin-bottom:8px;opacity:.8}
  .hdr h1{font-size:20px;font-weight:800;letter-spacing:-.4px;line-height:1.1;color:var(--i1)}
  @media(min-width:480px){.hdr h1{font-size:26px;letter-spacing:-.6px;line-height:1}}
  .hdr h1 em{font-style:normal;color:var(--lime)}
  .hdr-sub{font-size:11px;color:var(--i3);margin-top:8px;line-height:1.6}
  .hdr-line{height:1px;background:linear-gradient(90deg,var(--lime),transparent);margin-top:16px;opacity:.3}

  /* ── Tabs ── */
  .tabs{display:flex;gap:3px;background:var(--bg1);border-radius:10px;
    padding:4px;border:1px solid var(--bd);margin-bottom:20px;width:100%}
  @media(min-width:400px){.tabs{width:fit-content}}
  .tab{flex:1;padding:9px 16px;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;
    border:none;transition:all .15s;color:var(--i3);background:transparent;
    font-family:'Inter',sans-serif;text-align:center;white-space:nowrap}
  @media(min-width:400px){.tab{flex:none;padding:9px 26px}}
  .tab.active{background:var(--lime);color:var(--bg0);font-weight:800}
  .tab:hover:not(.active){color:var(--i1);background:var(--bg3)}

  /* ── Card ── */
  .card{background:var(--bg1);border:1px solid var(--bd);border-radius:14px;
    padding:16px;margin-bottom:14px}
  @media(min-width:480px){.card{padding:24px;margin-bottom:16px}}
  .ctitle{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2.5px;
    color:var(--lime);margin-bottom:16px;opacity:.9}
  .sec-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:10px}
  .g2{display:grid;grid-template-columns:1fr;gap:12px}
  @media(min-width:560px){.g2{grid-template-columns:1fr 1fr;gap:14px}}

  /* ── Field ── */
  .fld{display:flex;flex-direction:column;gap:6px}
  .fld label{font-size:10px;font-weight:700;color:var(--i3);text-transform:uppercase;letter-spacing:1px}
  .fh{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px;flex-wrap:wrap}
  .fh-l{font-size:10px;font-weight:700;color:var(--i3);text-transform:uppercase;
    letter-spacing:1px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}

  /* ── CX (currency+value) ── */
  .cx{display:flex;border:1px solid var(--bd);border-radius:9px;overflow:hidden;
    background:var(--bg2);transition:all .15s}
  .cx:focus-within{border-color:var(--lime);box-shadow:0 0 0 3px var(--lime-dim)}
  .cx-sel{border:none;border-right:1px solid var(--bd);background:rgba(26,44,72,.7);
    color:var(--lime);font-size:11px;font-weight:800;padding:10px 4px;width:60px;flex-shrink:0;
    cursor:pointer;outline:none;appearance:none;-webkit-appearance:none;text-align:center;
    font-family:'Inter',sans-serif}
  @media(min-width:400px){.cx-sel{width:64px}}
  .cx-sel option{background:var(--bg2);color:var(--i1);font-weight:400}
  .cx-in{border:none;background:transparent;color:var(--i1);font-size:14px;
    padding:10px 10px;width:100%;outline:none;font-family:var(--mono);min-width:0}
  @media(min-width:400px){.cx-in{padding:10px 12px}}
  .cx-in::placeholder{color:var(--i3);font-family:'Inter',sans-serif;font-size:13px}

  /* ── Plain input ── */
  .inp{background:var(--bg2);border:1px solid var(--bd);border-radius:9px;color:var(--i1);
    font-size:14px;padding:10px 12px;width:100%;font-family:var(--mono);outline:none;transition:all .15s}
  .inp:focus{border-color:var(--lime);box-shadow:0 0 0 3px var(--lime-dim)}
  .inp.ro{background:var(--cyan-dim);border-color:rgba(0,229,204,.18);
    color:var(--cyan);cursor:default;font-weight:700}

  /* ── % input ── */
  .pw{display:flex;border:1px solid var(--bd);border-radius:9px;overflow:hidden;
    background:var(--bg2);transition:all .15s}
  .pw:focus-within{border-color:var(--lime);box-shadow:0 0 0 3px var(--lime-dim)}
  .ps{display:flex;align-items:center;padding:10px 12px;background:rgba(26,44,72,.7);
    color:var(--lime);font-size:13px;font-weight:800;flex-shrink:0;border-left:1px solid var(--bd)}

  /* ── Toggle ── */
  .tog{display:flex;border:1px solid var(--bd);border-radius:7px;overflow:hidden;flex-shrink:0}
  .tog-b{padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;border:none;
    transition:all .13s;color:var(--i3);background:transparent;font-family:'Inter',sans-serif}
  @media(min-width:400px){.tog-b{padding:5px 12px}}
  .tog-b.on{background:var(--lime);color:var(--bg0)}
  .tog-b:not(.on):hover{color:var(--i1);background:var(--bg3)}

  /* ── Rate row ── */
  .rr{display:flex;align-items:center;gap:6px;margin-top:7px;
    background:rgba(26,44,72,.5);border:1px solid var(--bd);border-radius:8px;padding:7px 10px;
    flex-wrap:nowrap;overflow:hidden}
  .rr-inh{background:var(--lime-dim);border-color:rgba(187,255,0,.15)}
  .rr-l{font-size:11px;color:var(--i3);white-space:nowrap;flex-shrink:0}
  .rr-inp{flex:1;background:transparent;border:none;color:var(--lime);font-size:13px;
    font-weight:700;outline:none;font-family:var(--mono);min-width:0;width:100%}
  .rr-inp::placeholder{color:var(--i3);font-weight:400;font-style:italic;font-family:'Inter',sans-serif}
  .rr-conv{font-size:11px;color:var(--cyan);white-space:nowrap;flex-shrink:0;font-weight:700}
  .rr-tag{font-size:8px;font-weight:800;color:var(--bg0);background:var(--lime);
    border-radius:10px;padding:2px 7px;white-space:nowrap;flex-shrink:0;
    letter-spacing:.5px;text-transform:uppercase}

  /* ── Hint ── */
  .hint{font-size:11px;color:var(--i3);margin-top:5px;padding-left:2px;line-height:1.5}

  /* ── Warning ── */
  .warn{background:var(--amber-dim);border:1px solid rgba(255,179,64,.22);
    border-radius:9px;padding:10px 12px;font-size:12px;color:var(--amber);
    margin-top:8px;display:flex;gap:8px;align-items:flex-start;line-height:1.6}

  /* ── Info box ── */
  .info-b{background:var(--violet-dim);border:1px solid rgba(167,139,250,.18);
    border-radius:10px;padding:12px 14px;margin-bottom:16px}
  .info-t{font-size:9px;font-weight:800;color:var(--violet);text-transform:uppercase;
    letter-spacing:1.2px;margin-bottom:7px}
  .info-b p{font-size:12px;color:var(--i2);line-height:1.75}
  .info-b strong{color:var(--i1)}

  /* ── Tape ── */
  .tape{height:2px;background:linear-gradient(90deg,transparent,var(--lime),rgba(187,255,0,.4),var(--lime),transparent);
    margin:4px 0 20px;box-shadow:0 0 20px rgba(187,255,0,.5)}

  /* ── Result rows ── */
  .row{display:flex;justify-content:space-between;align-items:center;
    padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);gap:8px}
  .row:last-child{border-bottom:none}
  .row.sep{border-top:1px solid rgba(255,255,255,.1);padding-top:11px;margin-top:4px;border-bottom:none}
  .rl{font-size:12px;color:var(--i2);flex:1;min-width:0}
  @media(min-width:480px){.rl{font-size:13px}}
  .rl.b{color:var(--i1);font-weight:600}
  .rv{font-size:13px;font-weight:700;color:var(--i1);font-family:var(--mono);
    white-space:nowrap;flex-shrink:0;text-align:right}
  @media(min-width:480px){.rv{font-size:14px}}
  .rv.lime  {color:var(--lime)}
  .rv.cyan  {color:var(--cyan)}
  .rv.violet{color:var(--violet)}
  .rv.amber {color:var(--amber)}
  .rv.sky   {color:var(--sky)}
  .rv.dim   {color:var(--i3);font-weight:500;font-family:'Inter',sans-serif;font-size:12px}
  .rv.big   {font-size:15px}
  @media(min-width:480px){.rv.big{font-size:16px}}

  /* ── Sub result ── */
  .sub{background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:12px 14px}
  @media(min-width:480px){.sub{padding:14px 16px}}
  .sub .row{padding:7px 0}

  /* ── Block label ── */
  .blbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;
    color:var(--i3);margin:16px 0 8px;display:flex;align-items:center;gap:8px}
  .blbl::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.05)}

  /* ── Summary block ── */
  .smb{background:var(--cyan-dim);border:1px solid rgba(0,229,204,.12);
    border-radius:10px;padding:12px 14px;margin-top:14px}
  @media(min-width:480px){.smb{padding:14px 16px}}
  .smb .row{padding:7px 0}

  /* ── Total cards ── */
  .tot{border-radius:14px;padding:18px 16px;display:flex;justify-content:space-between;
    align-items:center;margin-top:16px;gap:12px;flex-wrap:wrap}
  @media(min-width:480px){.tot{padding:22px 24px}}
  .tot-lime{background:linear-gradient(135deg,#161f00,#202e00);
    border:1px solid rgba(187,255,0,.25);box-shadow:0 0 40px rgba(187,255,0,.08)}
  .tot-cyan{background:linear-gradient(135deg,#001f1a,#002e26);
    border:1px solid rgba(0,229,204,.25);box-shadow:0 0 40px rgba(0,229,204,.08)}
  .tot-lbl{font-size:12px;font-weight:600;color:var(--i2)}
  .tot-val{font-size:24px;font-weight:800;font-family:var(--mono)}
  @media(min-width:400px){.tot-val{font-size:28px}}
  .tot-sub{font-size:10px;color:var(--i3);margin-top:3px}
  .tot-lime .tot-val{color:var(--lime)}
  .tot-cyan .tot-val{color:var(--cyan)}

  /* ── Reset btn ── */
  .btn-r{background:transparent;border:1px solid var(--bd);border-radius:8px;
    color:var(--i3);font-size:12px;padding:7px 14px;cursor:pointer;transition:all .15s;
    font-family:'Inter',sans-serif;font-weight:600;white-space:nowrap}
  .btn-r:hover{border-color:rgba(248,113,113,.4);color:var(--rose)}

  /* ── Auto badge ── */
  .ab{display:inline-flex;align-items:center;background:var(--cyan-dim);
    border:1px solid rgba(0,229,204,.2);border-radius:20px;font-size:8px;
    color:var(--cyan);padding:2px 7px;font-weight:800;letter-spacing:.7px;text-transform:uppercase}

  /* ── Auto group ── */
  .ag{background:var(--cyan-dim);border:1px solid rgba(0,229,204,.12);
    border-radius:12px;padding:14px;margin-bottom:14px}
  @media(min-width:480px){.ag{padding:18px}}
  .ag-t{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;
    color:var(--cyan);margin-bottom:12px}

  /* ── Divider ── */
  .div{height:1px;background:var(--bd);margin:18px 0}

  /* ── Group label ── */
  .gl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;
    color:var(--lime);margin-bottom:12px;padding-bottom:7px;border-bottom:1px solid var(--bd);opacity:.8}

  /* ── LC dynamic rows ── */
  .lc-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-bottom:8px}
  @media(min-width:480px){.lc-row{grid-template-columns:1fr 160px auto}}
  .lc-row .lc-amt{display:none}
  @media(min-width:480px){.lc-row .lc-amt{display:block}}
  .lc-add{background:transparent;border:1px dashed rgba(255,255,255,.1);border-radius:9px;
    color:var(--i3);font-size:13px;padding:10px 16px;cursor:pointer;width:100%;
    margin-top:10px;transition:all .16s;font-family:'Inter',sans-serif}
  .lc-add:hover{border-color:var(--lime);color:var(--lime)}
  .lc-del{background:transparent;border:1px solid transparent;color:var(--i3);cursor:pointer;
    font-size:16px;padding:6px 8px;border-radius:7px;transition:all .15s;line-height:1}
  .lc-del:hover{color:var(--rose);border-color:var(--rose-dim);background:var(--rose-dim)}

  /* ── Composition table (desktop only — hidden on mobile) ── */
  .pit-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:10px}
  .pit{width:100%;border-collapse:collapse;min-width:380px}
  .pit th{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;
    color:var(--i3);padding:8px 12px;text-align:left;border-bottom:1px solid var(--bd)}
  .pit th:not(:first-child){text-align:right}
  .pit td{font-size:12px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.03);color:var(--i2)}
  .pit td:not(:first-child){text-align:right;font-family:var(--mono);font-size:12px;font-weight:500}
  .pit tr:last-child td{border-bottom:none}
  .pit tr.pit-sep td{border-top:1px solid rgba(255,255,255,.09);padding-top:11px;font-weight:700;color:var(--i1)}
  .pit td.lime{color:var(--lime);font-weight:700}
  .pit td.amber{color:var(--amber)}
  .pit td.dim{color:var(--i3);font-size:11px}

  /* pct bar */
  .pct-bar-wrap{flex:1;height:4px;background:rgba(255,255,255,.06);
    border-radius:3px;overflow:hidden;margin:0 8px;min-width:20px}
  .pct-bar{height:100%;border-radius:3px;transition:width .3s}

  /* ── Per-unit summary cards (2 cards only) ── */
  .pu-cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
  .pu-card{border-radius:12px;padding:16px}
  .pu-card-cyan{background:linear-gradient(135deg,#001f1a,#002e26);
    border:1px solid rgba(0,229,204,.2)}
  .pu-card-lime{background:linear-gradient(135deg,#161f00,#202e00);
    border:1px solid rgba(187,255,0,.2)}
  .pu-label{font-size:9px;font-weight:800;text-transform:uppercase;
    letter-spacing:1px;color:var(--i3);margin-bottom:8px}
  .pu-val{font-size:20px;font-weight:800;font-family:var(--mono)}
  @media(min-width:400px){.pu-val{font-size:24px}}
  .pu-cyan .pu-val{color:var(--cyan)} .pu-card-cyan .pu-val{color:var(--cyan)}
  .pu-card-lime .pu-val{color:var(--lime)}
  .pu-sub{font-size:10px;color:var(--i3);margin-top:4px}
  .pu-qty{font-size:11px;color:var(--i3);margin-top:6px;padding-top:6px;
    border-top:1px solid rgba(255,255,255,.06)}

  /* ── Qty input ── */
  .qty-wrap{background:var(--bg2);border:1px solid var(--bd);border-radius:10px;
    padding:14px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .qty-wrap .fld{flex:1;min-width:160px}

  /* ── Stats ── */
  .stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
  @media(min-width:560px){.stats{display:flex;gap:10px;flex-wrap:wrap}}
  .sbox{background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:11px 13px}
  @media(min-width:560px){.sbox{flex:1;min-width:110px;padding:12px 14px}}
  .s-l{font-size:9px;color:var(--i3);text-transform:uppercase;letter-spacing:.9px;
    margin-bottom:4px;font-weight:700}
  .s-v{font-size:16px;font-weight:800;font-family:var(--mono)}
  @media(min-width:480px){.s-v{font-size:17px}}

  /* ── INR preview box ── */
  .inr-box{background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:14px}
  @media(min-width:480px){.inr-box{padding:16px}}
  .inr-box-l{font-size:9px;color:var(--i3);text-transform:uppercase;
    letter-spacing:1px;font-weight:700;margin-bottom:6px}
  .inr-box-v{font-size:22px;font-weight:800;font-family:var(--mono);color:var(--lime)}
  @media(min-width:480px){.inr-box-v{font-size:24px}}
`;

/* ─── Small reusable components ─────────────────────────── */
const Toggle = ({ mode, onChange }) => (
  <div className="tog">
    <button className={`tog-b ${mode==="value"?"on":""}`} onClick={()=>onChange("value")}>Value</button>
    <button className={`tog-b ${mode==="pct"?"on":""}`}   onClick={()=>onChange("pct")}>%</button>
  </div>
);

const CxField = ({ currency, value, onCurChange, onValChange, placeholder="0.00" }) => (
  <div className="cx">
    <select className="cx-sel" value={currency} onChange={onCurChange}>
      {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
    </select>
    <input className="cx-in" type="number" placeholder={placeholder} value={value} onChange={onValChange}/>
  </div>
);

const PctField = ({ value, onChange, placeholder="0.00" }) => (
  <div className="pw">
    <input className="cx-in" type="number" placeholder={placeholder} value={value} onChange={onChange}/>
    <div className="ps">%</div>
  </div>
);

const RateRow = ({ currency, invoiceCur, invoiceRateStr, rate, onRateChange, fieldValue, isSource=false }) => {
  if (currency==="INR") return null;
  const eg=EXAMPLE_RATES[currency]??"—";
  const hasVal=num(fieldValue)>0;

  if (isSource) {
    const inr=hasVal&&num(rate)>0?num(fieldValue)*num(rate):0;
    return (
      <div className="rr">
        <span className="rr-l">1 {currency} =</span>
        <input className="rr-inp" type="number" placeholder={`e.g. ${eg}`} value={rate} onChange={onRateChange}/>
        <span className="rr-l">INR</span>
        {inr>0&&<span className="rr-conv">= ₹{fmt(inr)}</span>}
      </div>
    );
  }
  if (currency===invoiceCur) {
    const r=num(invoiceRateStr);
    const inr=hasVal&&r>0?num(fieldValue)*r:0;
    return (
      <div className="rr rr-inh">
        <span className="rr-l">1 {currency} =</span>
        <span style={{flex:1,fontSize:13,fontWeight:700,color:"var(--lime)",fontFamily:"var(--mono)"}}>
          {r>0?fmt(r):<em style={{color:"var(--i3)",fontWeight:400,fontSize:12,fontFamily:"Inter,sans-serif"}}>enter invoice rate above</em>}
        </span>
        <span className="rr-l">INR</span>
        <span className="rr-tag">From invoice</span>
        {inr>0&&<span className="rr-conv">= ₹{fmt(inr)}</span>}
      </div>
    );
  }
  const inr=hasVal&&num(rate)>0?num(fieldValue)*num(rate):0;
  return (
    <div className="rr">
      <span className="rr-l">1 {currency} =</span>
      <input className="rr-inp" type="number" placeholder={`e.g. ${eg}`} value={rate} onChange={onRateChange}/>
      <span className="rr-l">INR</span>
      {inr>0&&<span className="rr-conv">= ₹{fmt(inr)}</span>}
    </div>
  );
};

const ROField = ({ label, value, color }) => (
  <div className="fld">
    <label style={{display:"flex",alignItems:"center",gap:6}}>{label}<span className="ab">AUTO</span></label>
    <input className="inp ro" readOnly value={value>0?`₹ ${fmt(value)}`:"—"} style={color?{color}:{}}/>
  </div>
);

const RR = ({ label, value, cls="", bold=false, sep=false }) => (
  <div className={`row${sep?" sep":""}`}>
    <span className={`rl${bold?" b":""}`}>{label}</span>
    <span className={`rv ${cls}`}>{value>0?`₹${fmt(value)}`:"—"}</span>
  </div>
);

/* ─── State ─────────────────────────────────────────────── */
const INIT_D = {
  invCur:"USD", invVal:"", invRate:"",
  frtMode:"value", frtCur:"INR", frtVal:"", frtRate:"", frtPct:"",
  insMode:"value", insCur:"INR", insVal:"", insRate:"", insPct:"",
  mscCur:"INR", mscVal:"", mscRate:"",
  bcd:"", sws:"",
  addMode:"value", addCur:"INR", addVal:"", addRate:"", addPct:"",  // ADD: currency + value|pct toggle
  aidc:"",
  igst:"",
};

const INIT_LC = {
  frtCur:"INR", frtVal:"", frtRate:"",
  cfcAai:"", custClr:"", transport:"", dg:"", ccFee:"", delOrd:"",
  extra:[],
  qty:"",
};

/* ─── App ────────────────────────────────────────────────── */
export default function App() {
  const [tab, setTab]=useState("duty");
  const [d, setD]=useState(INIT_D);
  const [lc, setLc]=useState(INIT_LC);

  const sd  = useCallback((k,v)=>setD(p=>({...p,[k]:v})),[]);
  const slc = useCallback((k,v)=>setLc(p=>({...p,[k]:v})),[]);

  const pickCur=(ck,rk,nc)=>{ sd(ck,nc); sd(rk,""); };

  /* Rate resolution */
  const invRateNum=num(d.invRate);
  const resolve=(cur,own)=>cur==="INR"?1:cur===d.invCur?invRateNum:num(own);

  const frtRate=resolve(d.frtCur, d.frtRate);
  const insRate=resolve(d.insCur, d.insRate);
  const mscRate=resolve(d.mscCur, d.mscRate);
  const addRate=resolve(d.addCur, d.addRate);

  /* Core maths */
  const invINR = toINR(d.invVal, d.invCur, invRateNum);
  const mscINR = toINR(d.mscVal, d.mscCur, mscRate);

  const frtRaw    = d.frtMode==="pct" ? invINR*(num(d.frtPct)/100) : toINR(d.frtVal,d.frtCur,frtRate);
  const frtCap    = invINR*0.2;
  const frtCapped = frtRaw>frtCap&&invINR>0;
  const frtINR    = frtCapped?frtCap:frtRaw;
  const frtPctAct = invINR>0?(frtINR/invINR)*100:0;

  const insBase = invINR+mscINR;
  const insINR  = d.insMode==="pct" ? insBase*(num(d.insPct)/100) : toINR(d.insVal,d.insCur,insRate);

  const av = invINR+frtINR+insINR+mscINR;

  /* Duties */
  const bcdPct=num(d.bcd),   bcdV=av*(bcdPct/100);
  const swsPct=num(d.sws),   swsV=bcdV*(swsPct/100);

  /* ADD: toggle between currency value (converted to INR) and % on AV */
  const addV = d.addMode==="pct"
    ? av*(num(d.addPct)/100)
    : toINR(d.addVal, d.addCur, addRate);

  const aidcPct=num(d.aidc), aidcV=av*(aidcPct/100);

  const igstPct=num(d.igst), igstBase=av+bcdV+swsV+addV+aidcV, igstV=igstBase*(igstPct/100);

  const dutyExGst = bcdV+swsV+addV+aidcV;
  const totalDuty = dutyExGst+igstV;
  const effPct    = av>0?(totalDuty/av)*100:0;

  /* Duty label */
  const dutyLbl=["BCD","SWS",addV>0?"ADD":"",aidcV>0?"AIDC":""].filter(Boolean).join("+");

  /* Landed maths */
  const lcFrtRate = lc.frtCur==="INR"?1:lc.frtCur===d.invCur?invRateNum:num(lc.frtRate);
  const lcFrt  = toINR(lc.frtVal,lc.frtCur,lcFrtRate);
  const lcCfc  = num(lc.cfcAai);
  const lcCust = num(lc.custClr);
  const lcTr   = num(lc.transport);
  const lcDg   = num(lc.dg);
  const lcCC   = num(lc.ccFee);
  const lcDel  = num(lc.delOrd);
  const lcXtra = lc.extra.reduce((s,c)=>s+num(c.amount),0);

  const lcBase  = invINR+insINR+mscINR+dutyExGst;
  const lcLocal = lcFrt+lcCfc+lcCust+lcTr+lcDg+lcCC+lcDel+lcXtra;
  const lcTotal = lcBase+lcLocal;

  /* Per-item breakdown */
  const qty = num(lc.qty);
  const hasQty = qty > 0 && lcTotal > 0;

  // Components for % share table
  const lcComponents = [
    { label:"Invoice Value",              value: invINR,    cls:"" },
    { label:"Insurance",                  value: insINR,    cls:"" },
    { label:"Misc / EX Works",            value: mscINR,    cls:"" },
    { label:`Duties excl. IGST (${dutyLbl||"—"})`, value: dutyExGst, cls:"lime" },
    { label:"Freight",                    value: lcFrt,     cls:"" },
    { label:"CFS / AAI Charges",          value: lcCfc,     cls:"amber" },
    { label:"Customs Clearance",          value: lcCust,    cls:"amber" },
    { label:"Transportation",             value: lcTr,      cls:"amber" },
    { label:"DG Charges",                 value: lcDg,      cls:"amber" },
    { label:"CC Fee",                     value: lcCC,      cls:"amber" },
    { label:"Delivery Order Charges",     value: lcDel,     cls:"amber" },
    ...lc.extra.filter(c=>num(c.amount)>0).map(c=>({ label:c.label||"Additional Charge", value:num(c.amount), cls:"" })),
  ].filter(c => c.value > 0);

  const addX=()=>setLc(p=>({...p,extra:[...p.extra,{id:Date.now(),label:"",amount:""}]}));
  const updX=(id,k,v)=>setLc(p=>({...p,extra:p.extra.map(c=>c.id===id?{...c,[k]:v}:c)}));
  const delX=(id)=>setLc(p=>({...p,extra:p.extra.filter(c=>c.id!==id)}));

  const multiCur=[d.frtCur,d.insCur,d.mscCur].some(c=>c!=="INR"&&c!==d.invCur);

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">

        {/* ── Header ── */}
        <div className="hdr">
          <div className="hdr-tag">Customs · Duty · Landed Cost</div>
          <h1><em>Customs</em> Duty Calculator</h1>
          <div className="hdr-line"/>
        </div>

        {/* ── Tabs ── */}
        <div className="tabs">
          <button className={`tab ${tab==="duty"?"active":""}`}   onClick={()=>setTab("duty")}>Duty Calculator</button>
          <button className={`tab ${tab==="landed"?"active":""}`} onClick={()=>setTab("landed")}>Landed Cost</button>
        </div>

        {/* ══════════ DUTY TAB ══════════ */}
        {tab==="duty"&&<>

          {multiCur&&(
            <div className="info-b">
              <div className="info-t">💡 Multiple currencies detected</div>
              <p>Fields in the <strong>same currency as the invoice ({d.invCur})</strong> inherit the invoice exchange rate automatically. Fields in a <strong>different currency</strong> show their own rate row — enter the specific rate for that charge. All values convert to INR individually before computing the assessable value.</p>
            </div>
          )}

          {/* Invoice */}
          <div className="card">
            <div className="sec-hdr">
              <div className="ctitle">Invoice Details</div>
              <button className="btn-r" onClick={()=>setD(INIT_D)}>Reset all</button>
            </div>
            <div className="g2">
              <div className="fld">
                <label>Invoice Value</label>
                <CxField currency={d.invCur} value={d.invVal}
                  onCurChange={e=>pickCur("invCur","invRate",e.target.value)}
                  onValChange={e=>sd("invVal",e.target.value)} />
                <RateRow currency={d.invCur} invoiceCur={d.invCur} invoiceRateStr={d.invRate}
                  rate={d.invRate} onRateChange={e=>sd("invRate",e.target.value)}
                  fieldValue={d.invVal} isSource />
              </div>
              <div style={{display:"flex",flexDirection:"column",justifyContent:"center"}}>
                {invINR>0
                  ? <div className="inr-box">
                      <div className="inr-box-l">Invoice in INR</div>
                      <div className="inr-box-v">₹{fmt(invINR)}</div>
                    </div>
                  : <div className="hint" style={{padding:"12px 0"}}>Select currency and enter value + exchange rate to see INR equivalent.</div>
                }
              </div>
            </div>
          </div>

          {/* Freight / Insurance / Misc */}
          <div className="card">
            <div className="ctitle">Freight, Insurance & Misc</div>

            {/* Freight */}
            <div style={{marginBottom:22}}>
              <div className="fh">
                <div className="fh-l">
                  Freight
                  {frtCapped&&<span style={{fontSize:8,fontWeight:800,color:"var(--bg0)",background:"var(--rose)",borderRadius:10,padding:"2px 8px",textTransform:"uppercase",letterSpacing:".5px"}}>Capped 20%</span>}
                </div>
                <Toggle mode={d.frtMode} onChange={v=>sd("frtMode",v)} />
              </div>
              {d.frtMode==="value"?(
                <>
                  <CxField currency={d.frtCur} value={d.frtVal}
                    onCurChange={e=>pickCur("frtCur","frtRate",e.target.value)}
                    onValChange={e=>sd("frtVal",e.target.value)} />
                  <RateRow currency={d.frtCur} invoiceCur={d.invCur} invoiceRateStr={d.invRate}
                    rate={d.frtRate} onRateChange={e=>sd("frtRate",e.target.value)} fieldValue={d.frtVal} />
                </>
              ):(
                <>
                  <PctField value={d.frtPct} onChange={e=>sd("frtPct",e.target.value)} placeholder="e.g. 10" />
                  {invINR>0&&num(d.frtPct)>0&&<div className="hint">{d.frtPct}% of invoice = ₹{fmt(invINR*num(d.frtPct)/100)}</div>}
                </>
              )}
              {frtCapped&&<div className="warn"><span>⚠</span><span>Actual freight ₹{fmt(frtRaw)} exceeds 20% of invoice — capped at <strong>₹{fmt(frtCap)}</strong> for AV computation.</span></div>}
              {!frtCapped&&invINR>0&&frtINR>0&&<div className="hint">= ₹{fmt(frtINR)} ({fmt(frtPctAct)}% of invoice)</div>}
            </div>

            {/* Insurance */}
            <div style={{marginBottom:22}}>
              <div className="fh">
                <span className="fh-l">Insurance</span>
                <Toggle mode={d.insMode} onChange={v=>{sd("insMode",v);sd("insVal","");sd("insPct","");}} />
              </div>
              {d.insMode==="value"?(
                <>
                  <CxField currency={d.insCur} value={d.insVal}
                    onCurChange={e=>{pickCur("insCur","insRate",e.target.value);sd("insPct","");}}
                    onValChange={e=>{sd("insVal",e.target.value);sd("insPct","");}} />
                  <RateRow currency={d.insCur} invoiceCur={d.invCur} invoiceRateStr={d.invRate}
                    rate={d.insRate} onRateChange={e=>sd("insRate",e.target.value)} fieldValue={d.insVal} />
                </>
              ):(
                <>
                  <PctField value={d.insPct} onChange={e=>sd("insPct",e.target.value)} placeholder="e.g. 1.125" />
                  {insBase>0&&num(d.insPct)>0&&<div className="hint">{d.insPct}% of (Invoice{mscINR>0?" + Misc":""}) = ₹{fmt(insINR)}</div>}
                </>
              )}
            </div>

            {/* Misc */}
            <div>
              <div className="fh"><span className="fh-l">Miscellaneous / EX Works</span></div>
              <CxField currency={d.mscCur} value={d.mscVal}
                onCurChange={e=>pickCur("mscCur","mscRate",e.target.value)}
                onValChange={e=>sd("mscVal",e.target.value)} />
              <RateRow currency={d.mscCur} invoiceCur={d.invCur} invoiceRateStr={d.invRate}
                rate={d.mscRate} onRateChange={e=>sd("mscRate",e.target.value)} fieldValue={d.mscVal} />
            </div>
          </div>

          {/* Duty Rates */}
          <div className="card">
            <div className="ctitle">Duty Rates</div>
            <div className="g2">
              <div className="fld">
                <label>BCD %</label>
                <PctField value={d.bcd} onChange={e=>sd("bcd",e.target.value)} placeholder="e.g. 10" />
              </div>
              <div className="fld">
                <label>SWS % <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"var(--i3)",fontSize:10}}>(on BCD)</span></label>
                <PctField value={d.sws} onChange={e=>sd("sws",e.target.value)} placeholder="e.g. 10" />
              </div>

              {/* ADD — with value/% toggle */}
              <div className="fld">
                <div className="fh" style={{marginBottom:6}}>
                  <label style={{marginBottom:0}}>ADD <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"var(--i3)",fontSize:10}}>(Anti-Dumping)</span></label>
                  <Toggle mode={d.addMode} onChange={v=>{sd("addMode",v);sd("addPct","");sd("addVal","");sd("addRate","");}} />
                </div>
                {d.addMode==="pct"
                  ? <>
                      <PctField value={d.addPct} onChange={e=>sd("addPct",e.target.value)} placeholder="e.g. 5" />
                      {av>0&&num(d.addPct)>0&&<div className="hint">= ₹{fmt(addV)} on AV</div>}
                    </>
                  : <>
                      <CxField currency={d.addCur} value={d.addVal}
                        onCurChange={e=>{sd("addCur",e.target.value);sd("addRate","");}}
                        onValChange={e=>sd("addVal",e.target.value)}
                        placeholder="Duty value" />
                      <RateRow currency={d.addCur} invoiceCur={d.invCur} invoiceRateStr={d.invRate}
                        rate={d.addRate} onRateChange={e=>sd("addRate",e.target.value)} fieldValue={d.addVal} />
                    </>
                }
              </div>

              <div className="fld">
                <label>AIDC % <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"var(--i3)",fontSize:10}}>(Agri Infra, on AV)</span></label>
                <PctField value={d.aidc} onChange={e=>sd("aidc",e.target.value)} placeholder="e.g. 5" />
              </div>

              <div className="fld" style={{gridColumn:"1/-1"}}>
                <label>IGST % <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"var(--i3)",fontSize:10}}>(on AV + BCD + SWS{addV>0?" + ADD":""}{ aidcV>0?" + AIDC":""})</span></label>
                <PctField value={d.igst} onChange={e=>sd("igst",e.target.value)} placeholder="e.g. 18" />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="card">
            <div className="ctitle">Computation Breakup</div>
            <div className="tape" />

            <div className="blbl">Assessable Value (CIF)</div>
            <div className="sub">
              <RR label="Invoice Value" value={invINR} />
              <RR label={`Freight${frtCapped?" (capped at 20%)":""}`} value={frtINR} />
              <RR label="Insurance" value={insINR} />
              <RR label="Misc / EX Works" value={mscINR} />
              <RR label="Assessable Value" value={av} cls="lime" bold sep />
            </div>

            <div className="blbl">Customs Duty (excl. IGST)</div>
            <div className="sub">
              <RR label={`BCD @ ${bcdPct}% on AV`} value={bcdV} cls="lime" />
              <RR label={`SWS @ ${swsPct}% on BCD`} value={swsV} cls="lime" />
              {addV>0&&<RR label={`ADD${d.addMode==="pct"?` @ ${d.addPct}% on AV`:` (flat ₹${fmt(num(d.addVal))})`}`} value={addV} cls="violet" />}
              {aidcV>0&&<RR label={`AIDC @ ${d.aidc}% on AV`} value={aidcV} cls="violet" />}
              <RR label="Total Duty excl. IGST" value={dutyExGst} cls="lime" bold sep />
            </div>

            <div className="blbl">IGST</div>
            <div className="sub">
              <RR label={`IGST Base (AV + BCD + SWS${addV>0?" + ADD":""}${aidcV>0?" + AIDC":""})`} value={igstBase} cls="dim" />
              <RR label={`IGST @ ${igstPct}%`} value={igstV} cls="sky" />
            </div>

            <div className="smb">
              <RR label={`Duty excl. IGST (${dutyLbl||"—"})`} value={dutyExGst} cls="lime" />
              <RR label="IGST" value={igstV} cls="sky" />
              <RR label="Total Duty Payable" value={totalDuty} cls="lime big" bold sep />
              <div className="row">
                <span className="rl">Effective Duty Rate on AV</span>
                <span className="rv dim">{fmt(effPct)}%</span>
              </div>
            </div>

            <div className={`tot tot-lime`}>
              <div>
                <div className="tot-lbl">Total Duty Payable</div>
                <div className="tot-sub">{dutyLbl||"—"} + IGST</div>
              </div>
              <div className="tot-val">₹{fmt(totalDuty)}</div>
            </div>
          </div>
        </>}

        {/* ══════════ LANDED COST TAB ══════════ */}
        {tab==="landed"&&<>
          <div className="card">
            <div className="sec-hdr">
              <div className="ctitle">Landed Cost Inputs</div>
              <button className="btn-r" onClick={()=>setLc(INIT_LC)}>Reset</button>
            </div>

            <div className="ag">
              <div className="ag-t">Auto-filled from Duty Calculator</div>
              <div className="g2">
                <ROField label="Invoice Value (INR)" value={invINR} />
                <ROField label="Insurance (INR)" value={insINR} />
                <ROField label={`Duties excl. IGST (${dutyLbl||"—"})`} value={dutyExGst} color="var(--lime)" />
                <ROField label="Misc / EX Works (INR)" value={mscINR} />
              </div>
              {av===0&&(
                <div className="warn" style={{marginTop:14}}>
                  <span>ℹ</span><span>Fill in the <strong>Duty Calculator</strong> tab first — values auto-populate here.</span>
                </div>
              )}
            </div>

            <div className="div" />

            <div style={{marginBottom:20}}>
              <div className="gl">Freight</div>
              <CxField currency={lc.frtCur} value={lc.frtVal}
                onCurChange={e=>{slc("frtCur",e.target.value);slc("frtRate","");}}
                onValChange={e=>slc("frtVal",e.target.value)} />
              <RateRow currency={lc.frtCur} invoiceCur={d.invCur} invoiceRateStr={d.invRate}
                rate={lc.frtRate} onRateChange={e=>slc("frtRate",e.target.value)} fieldValue={lc.frtVal} />
            </div>

            <div className="div" />

            <div className="gl">Local Charges</div>
            <div className="g2" style={{marginBottom:14}}>
              {[
                ["CFS / AAI Charges","cfcAai"],
                ["Customs Clearance Charges","custClr"],
                ["Transportation Charges","transport"],
                ["DG Charges","dg"],
                ["CC Fee","ccFee"],
                ["Delivery Order Charges","delOrd"],
              ].map(([lbl,key])=>(
                <div className="fld" key={key}>
                  <label>{lbl} (INR)</label>
                  <input className="inp" type="number" placeholder="0.00"
                    value={lc[key]} onChange={e=>slc(key,e.target.value)} />
                </div>
              ))}
            </div>

            {lc.extra.length>0&&(
              <div style={{marginBottom:8}}>
                {lc.extra.map(c=>(
                  <div key={c.id} className="lc-row">
                    <input className="inp" type="text" placeholder="Description"
                      value={c.label} onChange={e=>updX(c.id,"label",e.target.value)} />
                    <input className="inp lc-amt" type="number" placeholder="Amount (INR)"
                      value={c.amount} onChange={e=>updX(c.id,"amount",e.target.value)} />
                    <button className="lc-del" onClick={()=>delX(c.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <button className="lc-add" onClick={addX}>+ Add additional charge</button>

            <div className="div" />
            <div className="gl">Per Unit Analysis</div>
            <div className="qty-wrap">
              <div className="fld">
                <label>Number of Units in Shipment</label>
                <div className="pw">
                  <input className="cx-in" type="number" placeholder="e.g. 100"
                    value={lc.qty} onChange={e=>slc("qty",e.target.value)} />
                  <div className="ps" style={{fontSize:12,letterSpacing:".5px",color:"var(--i2)"}}>QTY</div>
                </div>
              </div>
              {hasQty&&(
                <div style={{fontSize:12,color:"var(--i3)",lineHeight:1.6}}>
                  <div>Total shipment: <strong style={{color:"var(--i1)",fontFamily:"var(--mono)"}}>{fmt(qty)}</strong> units</div>
                  <div style={{marginTop:3}}>Per unit landed: <strong style={{color:"var(--cyan)",fontFamily:"var(--mono)"}}>₹{fmt(lcTotal/qty)}</strong></div>
                </div>
              )}
            </div>
          </div>

          {/* LC Results */}
          <div className="card">
            <div className="ctitle">Landed Cost Breakup</div>
            <div className="tape" />

            <div className="blbl">Import Cost (ex-India)</div>
            <div className="sub">
              <RR label="Invoice Value" value={invINR} />
              <RR label="Insurance" value={insINR} />
              <RR label="Misc / EX Works" value={mscINR} />
              <RR label={`Duties excl. IGST (${dutyLbl||"—"})`} value={dutyExGst} cls="lime" />
              <RR label="Import Sub-total" value={lcBase} cls="lime" bold sep />
            </div>

            <div className="blbl">Freight & Local Charges</div>
            <div className="sub">
              {lcFrt >0&&<RR label="Freight" value={lcFrt} />}
              {lcCfc >0&&<RR label="CFS / AAI Charges" value={lcCfc} />}
              {lcCust>0&&<RR label="Customs Clearance Charges" value={lcCust} />}
              {lcTr  >0&&<RR label="Transportation Charges" value={lcTr} />}
              {lcDg  >0&&<RR label="DG Charges" value={lcDg} />}
              {lcCC  >0&&<RR label="CC Fee" value={lcCC} />}
              {lcDel >0&&<RR label="Delivery Order Charges" value={lcDel} />}
              {lc.extra.map(c=>num(c.amount)>0&&(
                <RR key={c.id} label={c.label||"Additional Charge"} value={num(c.amount)} />
              ))}
              {lcLocal===0
                ?<div className="row"><span className="rl" style={{color:"var(--i3)",fontStyle:"italic"}}>No local charges entered</span><span/></div>
                :<RR label="Local Charges Sub-total" value={lcLocal} cls="amber" bold sep />
              }
            </div>

            <div className="smb">
              <RR label="Import Sub-total" value={lcBase} cls="lime" />
              <RR label="Local Charges" value={lcLocal} cls="amber" />
              <RR label="Total Landed Cost" value={lcTotal} cls="cyan big" bold sep />
            </div>

            <div className="tot tot-cyan">
              <div>
                <div className="tot-lbl">Total Landed Cost</div>
                <div className="tot-sub">Invoice + Insurance + Misc + Duties excl. IGST + Freight + Local Charges</div>
              </div>
              <div className="tot-val">₹{fmt(lcTotal)}</div>
            </div>

            {lcTotal>0&&invINR>0&&(
              <div className="stats">
                <div className="sbox">
                  <div className="s-l">Invoice → Landed</div>
                  <div className="s-v" style={{color:"var(--lime)"}}>+{fmt(((lcTotal/invINR)-1)*100)}%</div>
                </div>
                <div className="sbox">
                  <div className="s-l">Duty Share</div>
                  <div className="s-v" style={{color:"var(--violet)"}}>{fmt((dutyExGst/lcTotal)*100)}%</div>
                </div>
                <div className="sbox">
                  <div className="s-l">Local Charges</div>
                  <div className="s-v" style={{color:"var(--amber)"}}>₹{fmt(lcLocal)}</div>
                </div>
                <div className="sbox">
                  <div className="s-l">Over Invoice</div>
                  <div className="s-v" style={{color:"var(--cyan)"}}>₹{fmt(lcTotal-invINR)}</div>
                </div>
              </div>
            )}

            {/* Cost Composition Table */}
            {lcTotal>0&&(
              <>
                <div className="blbl" style={{marginTop:24}}>Cost Composition</div>
                <div className="pit-wrap">
                  <div className="sub" style={{padding:0,overflow:"hidden"}}>
                    <table className="pit">
                      <thead>
                        <tr>
                          <th>Component</th>
                          <th>Total (₹)</th>
                          <th>% of Landed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lcComponents.map((c,i)=>{
                          const pct=lcTotal>0?(c.value/lcTotal)*100:0;
                          const barColor=c.cls==="lime"?"var(--lime)":c.cls==="amber"?"var(--amber)":"var(--sky)";
                          return (
                            <tr key={i}>
                              <td>
                                <div style={{display:"flex",alignItems:"center",gap:0}}>
                                  <span style={{flex:"0 0 120px",minWidth:0,fontSize:12}}>{c.label}</span>
                                  <div className="pct-bar-wrap">
                                    <div className="pct-bar" style={{width:`${Math.max(pct,1)}%`,background:barColor,opacity:.7}}/>
                                  </div>
                                </div>
                              </td>
                              <td className={c.cls||""}>{fmt(c.value)}</td>
                              <td className="dim">{fmt(pct)}%</td>
                            </tr>
                          );
                        })}
                        <tr className="pit-sep">
                          <td>Total Landed Cost</td>
                          <td className="lime">{fmt(lcTotal)}</td>
                          <td className="dim">100.00%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Per-unit: only Landed Cost and Duty */}
                {hasQty&&(
                  <>
                    <div className="blbl" style={{marginTop:24}}>Per Unit — {fmt(qty)} units</div>
                    <div className="pu-cards">
                      <div className="pu-card pu-card-cyan">
                        <div className="pu-label">Landed Cost per Unit</div>
                        <div className="pu-val">₹{fmt(lcTotal/qty)}</div>
                        <div className="pu-sub">{fmt(lcTotal>0?100:0)}% of total</div>
                        <div className="pu-qty">Total shipment: ₹{fmt(lcTotal)}</div>
                      </div>
                      <div className="pu-card pu-card-lime">
                        <div className="pu-label">Duty per Unit (excl. IGST)</div>
                        <div className="pu-val">₹{fmt(dutyExGst/qty)}</div>
                        <div className="pu-sub">{fmt(lcTotal>0?(dutyExGst/lcTotal)*100:0)}% of landed</div>
                        <div className="pu-qty">Total duty: ₹{fmt(dutyExGst)}</div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </>}
      </div>
    </>
  );
}