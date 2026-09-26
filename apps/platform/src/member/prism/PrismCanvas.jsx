/* Prism — the insight canvas inside Atlas. Summoned by a question; every block is a live
   query with a chart switcher; exports as an Institute-badged briefing via print. */
import React, { useEffect, useRef, useState } from "react";
import { runBlock, normaliseChart, CHART_ALTS, FIELDS, localPlan } from "./engine.js";
import { Bars, DotPlot, Scatter, Ring, Stat, DataTable } from "./charts.jsx";

const QUATREFOIL = "M31.5 31.5 A 18.5 18.5 0 1 1 68.5 31.5 A 18.5 18.5 0 1 1 68.5 68.5 A 18.5 18.5 0 1 1 31.5 68.5 A 18.5 18.5 0 1 1 31.5 31.5 Z";

const CSS = `
.prism-ov{position:fixed;inset:0;z-index:1200;background:#FBFAF7;overflow-y:auto;font-family:Inter,-apple-system,sans-serif;color:#221233}
.prism-ov::before{content:"";position:fixed;inset:0;background:radial-gradient(900px 480px at 50% -80px,rgba(106,12,160,.06),transparent 70%);pointer-events:none}
.pz-wrap{max-width:1120px;margin:0 auto;padding:26px 28px 60px;position:relative}
.pz-top{display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:20px}
.pz-asked{font-size:13px;color:#6F6580}.pz-asked b{color:#221233}
.pz-actions{display:flex;gap:10px;align-items:center}
.pz-btn{display:inline-flex;align-items:center;gap:8px;background:#fff;border:none;border-radius:999px;padding:10px 18px;font-size:12.5px;font-weight:600;color:#4B0875;box-shadow:0 1px 2px rgba(34,18,51,.04),0 8px 24px rgba(34,18,51,.06);cursor:pointer}
.pz-x{width:38px;height:38px;border-radius:50%;border:none;background:#fff;box-shadow:0 1px 2px rgba(34,18,51,.04),0 8px 24px rgba(34,18,51,.06);font-size:17px;color:#4B0875;cursor:pointer}
.pz-input{flex:1;min-width:280px;display:flex;gap:10px;background:#fff;border-radius:999px;padding:11px 12px 11px 18px;box-shadow:0 1px 2px rgba(34,18,51,.04),0 10px 30px rgba(106,12,160,.12)}
.pz-input input{flex:1;border:none;outline:none;font-size:14px;background:transparent;color:#221233;font-family:inherit}
.pz-go{background:linear-gradient(135deg,#6A0CA0,#4B0875);color:#fff;border:none;border-radius:999px;padding:8px 16px;font-size:12.5px;font-weight:600;cursor:pointer}
.pz-panel{background:#fff;border-radius:22px;box-shadow:0 1px 2px rgba(34,18,51,.04),0 18px 50px rgba(34,18,51,.09);padding:26px 28px;position:relative}
.pz-kick{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:#6A0CA0;font-weight:600;margin:0 0 4px}
.pz-panel h3{font-family:Fraunces,serif;font-weight:600;font-size:17px;margin:0 0 14px;letter-spacing:-.01em}
.pz-hero{margin-bottom:24px}
.pz-answer{font-family:Fraunces,serif;font-size:clamp(18px,2.1vw,23px);line-height:1.46;max-width:880px;margin:24px auto;color:#221233}
.pz-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:18px}
.pz-c6{grid-column:span 6}.pz-c4{grid-column:span 4}.pz-c12{grid-column:span 12}
.pz-alts{position:absolute;top:20px;right:20px;display:flex;gap:5px}
.pz-alt{border:none;background:#F4EEFA;color:#4B0875;border-radius:999px;padding:4px 11px;font-size:10.5px;font-weight:600;cursor:pointer}
.pz-alt.on{background:linear-gradient(135deg,#6A0CA0,#4B0875);color:#fff}
.pz-chips{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}
.pz-chip{border:none;background:#fff;border-radius:999px;padding:10px 16px;font-size:12.5px;color:#4B0875;box-shadow:0 1px 2px rgba(34,18,51,.04),0 8px 24px rgba(34,18,51,.06);cursor:pointer}
.pz-method{margin-top:16px;font-size:12px;color:#6F6580}
.pz-load{display:flex;flex-direction:column;align-items:center;gap:14px;padding:90px 0;color:#6F6580;font-size:13.5px}
.pz-mark{width:44px;height:44px;animation:pspin 2.6s linear infinite}
@keyframes pspin{to{transform:rotate(360deg)}}
.pz-launch{position:fixed;right:22px;bottom:22px;z-index:1100;display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#6A0CA0,#4B0875);color:#fff;border:none;border-radius:999px;padding:12px 20px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 8px 24px rgba(106,12,160,.4)}
.pz-print{display:none}
@media(max-width:900px){.pz-c6,.pz-c4{grid-column:span 12}}
@media print{
  body>*{display:none!important} .prism-ov,.prism-ov *{display:revert!important}
  .prism-ov{position:static;overflow:visible;background:#fff}
  .pz-actions,.pz-input,.pz-chips,.pz-alts,.pz-x{display:none!important}
  .pz-print{display:flex!important;align-items:center;justify-content:space-between;border-bottom:2px solid;border-image:linear-gradient(90deg,#6A0CA0,#C6A035) 1;padding-bottom:10px;margin-bottom:18px}
  .pz-panel{box-shadow:none;border:1px solid rgba(106,12,160,.16);break-inside:avoid}
}`;

function Block({ block, data }) {
  const [chart, setChart] = useState(normaliseChart(block));
  const res = React.useMemo(() => runBlock(block, data), [block, data]);
  if (res.error) return null;
  const alts = CHART_ALTS[block.kind] || [];
  const yLab = FIELDS[block.metric]?.[0] || "";
  const xLab = FIELDS[block.x]?.[0] || (block.x === "fsm_pct" ? "FSM6 %" : block.x || "");
  const body =
    chart === "bars" ? <Bars rows={res.rows} /> :
    chart === "dotplot" ? <DotPlot rows={res.rows} /> :
    chart === "table" ? <DataTable rows={res.rows || (res.points || []).slice(0, 12).map(p => ({ label: String(p.urn), value: p.y }))} /> :
    chart === "scatter" ? <Scatter points={res.points} r={res.r} highlight={res.highlight} xLabel={xLab} yLabel={yLab} /> :
    chart === "ring" ? <Ring value={res.value} label={block.title} sub={res.delta != null ? `median change ${res.delta > 0 ? "+" : ""}${res.delta}` : null} /> :
    <Stat value={res.value} unit={res.unit} label={block.title} sub={res.n ? `${res.n.toLocaleString("en-GB")} schools` : null} />;
  return (
    <div className={`pz-panel ${block.kind === "scatter" ? "pz-c12" : block.kind === "stat" || block.kind === "recovery" ? "pz-c4" : "pz-c6"}`}>
      {alts.length > 1 && (
        <div className="pz-alts">
          {alts.map((a) => <button key={a} className={`pz-alt ${a === chart ? "on" : ""}`} onClick={() => setChart(a)}>{a}</button>)}
        </div>
      )}
      {chart !== "ring" && chart !== "stat" && (<><p className="pz-kick">{res.n ? `${res.n.toLocaleString("en-GB")} schools` : "Computed live"}</p><h3>{block.title}</h3></>)}
      {body}
    </div>
  );
}

export default function PrismCanvas() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    const h = (e) => { setOpen(true); if (e.detail) ask(e.detail); };
    window.addEventListener("asi-prism", h);
    return () => window.removeEventListener("asi-prism", h);
  }, [data]);

  async function ensureData() {
    if (data) return data;
    const d = await fetch("/data/schools.json").then((r) => r.json());
    setData(d); return d;
  }

  async function ask(question) {
    setQ(question); setBusy(true); setPlan(null); setOpen(true);
    const d = await ensureData();
    let p;
    try {
      const res = await fetch("/.netlify/functions/prism", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error("offline");
      p = await res.json();
      if (!p.blocks) throw new Error("badplan");
      p.source = "live";
    } catch {
      p = localPlan(question);
    }
    setPlan(p); setBusy(false);
  }

  if (!open) return (
    <>
      <style>{CSS}</style>
      <button className="pz-launch" onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 60); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E4CE8B" strokeWidth="2"><path d="M12 3 3 19h18Z" /><path d="M12 3v16" opacity=".55" /></svg>
        Ask Prism
      </button>
    </>
  );

  const hero = plan?.blocks?.[0];
  const rest = plan?.blocks?.slice(1) || [];
  return (
    <div className="prism-ov">
      <style>{CSS}</style>
      <div className="pz-wrap">
        <div className="pz-print">
          <span style={{ fontFamily: "Fraunces", fontWeight: 500, fontSize: 18, letterSpacing: "-.012em" }}>
            inst<span style={{ position: "relative" }}>ı<svg viewBox="0 0 100 100" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: "-.175em", width: ".34em", height: ".34em" }}><path d={QUATREFOIL} fill="none" stroke="#6A0CA0" strokeWidth="11" /></svg></span>tute
          </span>
          <span style={{ fontSize: 10, color: "#6F6580" }}>Prism briefing · {new Date().toLocaleDateString("en-GB")} · institute.school</span>
        </div>

        <div className="pz-top">
          <div className="pz-input">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A0CA0" strokeWidth="2.4" style={{ alignSelf: "center" }}><path d="M12 3 3 19h18Z" /><path d="M12 3v16" opacity=".55" /></svg>
            <input ref={inputRef} defaultValue={q} placeholder="Ask the system anything…"
              onKeyDown={(e) => { if (e.key === "Enter" && e.target.value.trim()) ask(e.target.value.trim()); }} />
            <button className="pz-go" onClick={() => { const v = inputRef.current?.value?.trim(); if (v) ask(v); }}>Ask</button>
          </div>
          <div className="pz-actions">
            {plan && (
              <button className="pz-btn" onClick={() => window.print()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6A0CA0" strokeWidth="2.2"><path d="M12 4v11" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></svg>
                Briefing PDF
              </button>
            )}
            <button className="pz-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>
        </div>

        {q && <p className="pz-asked">You asked · <b>{q}</b></p>}

        {busy && (
          <div className="pz-load">
            <svg className="pz-mark" viewBox="0 0 100 100"><path d={QUATREFOIL} fill="none" stroke="#6A0CA0" strokeWidth="7" /></svg>
            Computing from 26,553 schools…
          </div>
        )}

        {plan && data && (
          <>
            {hero && <div className="pz-hero"><Block block={hero} data={data} /></div>}
            {plan.answer && <p className="pz-answer">{plan.answer}</p>}
            {rest.length > 0 && <div className="pz-grid">{rest.map((b, i) => <Block key={i} block={b} data={data} />)}</div>}
            <div className="pz-chips">
              {(plan.followups || []).map((f, i) => <button key={i} className="pz-chip" onClick={() => ask(f)}>{f}</button>)}
            </div>
            <p className="pz-method"><b>Method.</b> Every figure computed at query time from the Institute dataset (DfE published data joined by URN). Nothing is a black box.{plan.source === "local" ? " Planned offline: the live planner answers at institute.school." : " Planned live."}</p>
          </>
        )}
      </div>
    </div>
  );
}
