import { useEffect, useMemo, useRef, useState } from "react";
import { prepare, createEngine, QNAME } from "./engine.js";
import "./dynamic.css";

/* Dynamic Schools: the schools that are moving.
   Average Attainment 8 step change across the latest three results years (meta.years), against the latest Progress 8.
   Only Dynamic Schools are ever named; the other quadrants are unnamed dots and counts. */

/* the page opens on All Saints Catholic College; falls back to a strong example if it ever leaves the quadrant */
const HOME_URN = "100503";
const sign = (v, d = 1) => (v == null ? "n/a" : (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(d));
const fmt = (v, d = 1, suf = "") => (v == null ? "n/a" : v.toFixed(d) + suf);
const shortType = (t) => (t || "").replace(/ school| converter| sponsor led/gi, "").replace("Voluntary aided", "VA").replace("Voluntary controlled", "VC");
const ordinal = (n) => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");

function Trajectory({ s, med, years }) {
  const W = 300, H = 132, xs = [34, 148, 262];
  const vals = [s.a1, s.a2, s.a3], meds = [med.a1, med.a2, med.a3];
  const lo = Math.min(...vals, ...meds) - 3, hi = Math.max(...vals, ...meds) + 3;
  const y = (v) => 10 + (1 - (v - lo) / (hi - lo)) * (H - 34);
  const step = hi - lo > 16 ? 5 : 2, grid = [];
  for (let v = Math.ceil(lo / step) * step; v < hi; v += step) grid.push(v);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ds-traj" role="img" aria-label={`Attainment 8: ${vals.join(", ")} in ${years.join(", ")}`}>
      {grid.map((v) => <g key={v}><line x1="0" x2={W} y1={y(v)} y2={y(v)} stroke="rgba(106,12,160,.08)" /><text x="2" y={y(v) - 3} className="ax">{v}</text></g>)}
      <polyline points={xs.map((x, i) => `${x},${y(meds[i])}`).join(" ")} fill="none" stroke="#A79FB5" strokeWidth="1.3" strokeDasharray="4 3" />
      <line x1={xs[0]} y1={y(vals[0])} x2={xs[1]} y2={y(vals[1])} stroke={s.s1 >= 0 ? "#6A0CA0" : "#221233"} strokeWidth="2.4" />
      <line x1={xs[1]} y1={y(vals[1])} x2={xs[2]} y2={y(vals[2])} stroke={s.s2 >= 0 ? "#6A0CA0" : "#221233"} strokeWidth="2.4" />
      {vals.map((v, i) => <g key={i}><circle cx={xs[i]} cy={y(v)} r="3.6" fill={i === 2 ? "#C6A035" : "#221233"} />
        <text x={xs[i]} y={y(v) + (i === 1 && vals[1] > vals[2] ? 15 : -8)} textAnchor="middle" className="v">{v.toFixed(1)}</text></g>)}
      {years.map((t, i) => <text key={t} x={xs[i]} y={H - 4} textAnchor="middle" className="ax">{t}</text>)}
    </svg>
  );
}

function Distribution({ all, sel, M }) {
  const W = 300, H = 74, lo = -M.xmax, hi = M.xmax, bw = 0.5;
  const bins = useMemo(() => { const b = new Array(Math.round((hi - lo) / bw) + 1).fill(0); all.forEach((s) => b[Math.round((Math.max(lo, Math.min(hi, s.x)) - lo) / bw)]++); return b; }, [all]);
  const mx = Math.max(...bins), X = (v) => ((v - lo) / (hi - lo)) * (W - 2) + 1, Y = (c) => H - 14 - (c / mx) * (H - 22);
  const d = `M${X(lo)},${H - 14} ` + bins.map((c, i) => `L${X(lo + i * bw)},${Y(c)}`).join(" ") + ` L${X(hi)},${H - 14} Z`;
  const sv = Math.max(lo, Math.min(hi, sel.x));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ds-hist" role="img" aria-label="How every school's Attainment 8 moved, per step">
      <defs><clipPath id="dsRight"><rect x={X(0)} y="0" width={W} height={H} /></clipPath></defs>
      <path d={d} fill="rgba(167,159,181,.35)" stroke="#A79FB5" strokeWidth="1" />
      <path d={d} fill="rgba(106,12,160,.32)" clipPath="url(#dsRight)" />
      <line x1={X(0)} x2={X(0)} y1="2" y2={H - 14} stroke="#221233" />
      <line x1={X(sv)} x2={X(sv)} y1="0" y2={H - 14} stroke="#C6A035" strokeWidth="2" /><circle cx={X(sv)} cy="3" r="3" fill="#C6A035" />
      {[-6, -4, -2, 0, 2, 4, 6].filter((v) => v >= lo && v <= hi).map((v) => <text key={v} x={X(v)} y={H - 2} textAnchor="middle" className="ax">{v > 0 ? "+" + v : v === 0 ? "0" : "−" + Math.abs(v)}</text>)}
    </svg>
  );
}

export default function DynamicSchools() {
  const [data, setData] = useState(null);
  let [sel, setSel] = useState(null);
  const [mode, setMode] = useState(0);
  const [layers, setLayers] = useState({ R: true, S: true, I: true, D: true, relief: true, fsm: false });
  const [side, setSide] = useState(true);
  const [focus, setFocus] = useState(false);
  const [tip, setTip] = useState(null);
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All");
  const [shown, setShown] = useState(25);
  const canvasRef = useRef(null), engRef = useRef(null), shellRef = useRef(null);

  useEffect(() => { fetch("/data/dynamic.json" + (typeof __ASI_BUILD__ !== "undefined" ? "?v=" + __ASI_BUILD__ : "")).then((r) => r.json()).then((raw) => setData(prepare(raw))); }, []);

  const first = useMemo(() => data && (data.dyn.find((s) => s.urn === HOME_URN) || data.dyn.find((s) => (s.fsm || 0) >= 40 && (s.pupils || 0) >= 500 && s.x < data.M.xmax * 0.7 && s.y < data.M.ymax * 0.7) || data.dyn[0]), [data]);
  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const eng = createEngine(canvasRef.current, data, {
      onSelect: (s) => setSel(s),
      onHover: (s, x, y) => setTip(s ? { s, x, y } : null),
    });
    engRef.current = eng; eng.select(first);
    return () => eng.destroy();
  }, [data]);

  useEffect(() => { engRef.current?.setLayers(layers); }, [layers]);
  useEffect(() => { engRef.current?.setMode(mode); }, [mode]);
  useEffect(() => { const t = setTimeout(() => engRef.current?.resize(), 320); engRef.current?.resize(); return () => clearTimeout(t); }, [side, focus]);
  useEffect(() => {
    const k = (e) => {
      if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "Escape" && focus) setFocus(false);
      if (e.key === "f" || e.key === "F") setFocus((v) => !v);
      if (e.key === "m" || e.key === "M") setMode((v) => (v ? 0 : 1));
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { if (!shellRef.current || shellRef.current.getBoundingClientRect().bottom < 0) return; e.preventDefault(); engRef.current?.step(e.key === "ArrowRight" ? 1 : -1); }
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [focus]);
  useEffect(() => { document.body.style.overflow = focus ? "hidden" : ""; document.body.classList.toggle("ds-focus", focus); return () => { document.body.style.overflow = ""; document.body.classList.remove("ds-focus"); }; }, [focus]);

  const signals = useMemo(() => {
    if (!data) return [];
    const out = [], big = (s) => (s.pupils || 0) >= 500;
    for (const s of data.dyn) {
      if (s.s2 >= 6 && big(s)) out.push({ s, tag: "Surge", val: sign(s.s2), rank: s.s2, label: "Attainment 8 up in a single year" });
      if ((s.fsm || 0) >= 40 && s.y >= 0.5) out.push({ s, tag: "Against the odds", val: sign(s.y, 2), rank: s.y * 8, label: `Progress 8 at ${Math.round(s.fsm)}% disadvantage` });
      if (s.s1 < 0 && s.dTot >= 1 && big(s)) out.push({ s, tag: "Turned", val: sign(s.s2), rank: s.s2 * 0.8, label: `fell in ${data.M.years[1]}, now back above ${data.M.years[0]}` });
    }
    return out.sort((a, b) => b.rank - a.rank);
  }, [data]);

  const hits = useMemo(() => {
    if (!data || q.trim().length < 2) return [];
    const v = q.trim().toLowerCase();
    return data.dyn.filter((s) => s.name.toLowerCase().includes(v) || (s.la || "").toLowerCase().includes(v)).slice(0, 8);
  }, [q, data]);

  if (!data) return <div className="ds-loading">Reading the movement…</div>;
  const { M, dyn } = data;
  if (!sel) sel = first;
  const pick = (s) => { engRef.current?.select(s); setQ(""); };
  const regions = ["All", ...M.regs.map((r) => r[0])];
  const ranked = dyn.filter((s) => region === "All" || s.region === region);
  const gauge = Math.max(1, Math.round(sel.pct / 5));
  const C = M.counts, total = M.n;

  return (
    <>
      <div className="fieldwall ds-intro">
        <p className="fw-kick">Dynamic schools · three years of results</p>
        <h2 className="fw-h">The schools that are <em>moving.</em></h2>
        <p className="fw-sub">Every state secondary with Attainment 8 for {M.years[0]}, {M.years[1]} and {M.years[2]} (the last still provisional), placed by how its results have moved across those three years and by the progress its pupils make. The top right is where improvement and added value meet.</p>
        <div className="fw-marg ds-marg">
          <div><b>{C.R}</b><span>dynamic schools: rising results and positive progress</span></div>
          <div><b>{C.S}</b><span>strong and steady: positive progress, results flat or falling</span></div>
          <div><b>{C.I}</b><span>improving from low: results rising, progress still negative</span></div>
          <div><b>{C.D}</b><span>schools where both are below the line</span></div>
          <div><b>{total.toLocaleString("en-GB")}</b><span>secondaries with all three years and a published Progress 8</span></div>
        </div>
      </div>

      <div ref={shellRef} className={"ds-inst" + (focus ? " focus" : "") + (side ? "" : " side-off")}>
        <div className="ds-bar">
          <div className="ds-seg" role="tablist" aria-label="View">
            <button className={mode === 0 ? "on" : ""} onClick={() => setMode(0)}>Quadrant</button>
            <button className={mode === 1 ? "on" : ""} onClick={() => setMode(1)}>Map</button>
          </div>
          <div className="ds-chips" aria-label="Layers">
            {[["R", "Dynamic", "r"], ["S", "Steady", "s"], ["I", "Improving", "i"], ["D", "Declining", "d"], ["fsm", "Size by disadvantage", ""], ...(mode ? [["relief", "Relief", ""]] : [])].map(([k, t, c]) => (
              <button key={k} className={"chip " + c + (layers[k] ? " on" : "")} aria-pressed={layers[k]} onClick={() => setLayers((L) => ({ ...L, [k]: !L[k] }))}><i />{t}</button>
            ))}
          </div>
          <span className="ds-sp" />
          <div className="ds-search">
            <input id="ds-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a dynamic school" aria-label="Find a dynamic school"
              onKeyDown={(e) => { if (e.key === "Enter" && hits[0]) pick(hits[0]); if (e.key === "Escape") setQ(""); }} />
            {q.trim().length >= 2 && (
              <div className="ds-results">
                {hits.length ? hits.map((s) => <button key={s.urn} onClick={() => pick(s)}><b>{s.name}</b><span>{s.la}</span></button>)
                  : <p>No dynamic school matches. Only dynamic schools can be found by name.</p>}
              </div>
            )}
          </div>
          <button className="ds-btn" onClick={() => setFocus((v) => !v)} title="Focus (F)">{focus ? "Exit focus ✕" : "⤢ Focus"}</button>
        </div>

        <div className="ds-body">
          <div className="ds-stage">
            <canvas ref={canvasRef} aria-label="Dynamic Schools quadrant" />
            {tip && (
              <div className="ds-tip" style={{ left: Math.max(6, Math.min(tip.x + 14, (canvasRef.current?.clientWidth || 600) - 270)), top: Math.max(6, tip.y - 70) }}>
                <b>{tip.s.name}</b><span>{tip.s.la}</span>
                <em>Attainment 8 {sign(tip.s.x)} a step · Progress 8 {sign(tip.s.y, 2)}</em>
              </div>
            )}
            <button className="ds-sidetoggle" onClick={() => setSide((v) => !v)} aria-label={side ? "Hide the panel" : "Show the panel"} title={side ? "Hide the panel" : "Show the panel"}>
              <svg width="14" height="10" viewBox="0 0 18 12" aria-hidden="true"><path d={side ? "M0 0h12l6 6-6 6H0l5-6z" : "M18 0H6L0 6l6 6h12l-5-6z"} fill="currentColor" /></svg>
              {!side && <span>Panel</span>}
            </button>
          </div>

          <aside className="ds-side" aria-label="Selected school">
            <section className="ds-card">
              <p className="ds-k">Dynamic school · {sel.rank} of {C.R}</p>
              <h3>{sel.name}</h3>
              <p className="ds-sub">{sel.la}{sel.trust ? " · " + sel.trust : ""}</p>
              <div className="ds-gauge" aria-label={`Momentum: ${ordinal(sel.pct)} percentile nationally`}>{Array.from({ length: 20 }, (_, i) => <i key={i} className={i < gauge ? (i === gauge - 1 ? "f g" : "f") : ""} />)}</div>
              <p className="ds-gl"><span>Momentum</span><b>{ordinal(sel.pct)} percentile</b></p>
              <dl className="ds-kv">
                <dt>A8 a step</dt><dd className="p">{sign(sel.x)}</dd><dt>Progress 8</dt><dd className="p">{sign(sel.y, 2)}</dd>
                <dt>A8 {M.years[0]}</dt><dd>{fmt(sel.a1)}</dd><dt>A8 {M.years[2]}</dt><dd>{fmt(sel.a3)}</dd>
                <dt>FSM6</dt><dd>{fmt(sel.fsm, 1, "%")}</dd><dt>EHCP</dt><dd>{fmt(sel.ehcp, 1, "%")}</dd>
                <dt>4+ E&amp;M</dt><dd>{sel.b94 == null ? "n/a" : sel.b94 + "%"}</dd><dt>Absence</dt><dd>{fmt(sel.abs, 1, "%")}</dd>
                <dt>Type</dt><dd title={sel.type}>{shortType(sel.type)}</dd><dt>Ofsted</dt><dd title={sel.ofsted}>{sel.ofsted || "n/a"}</dd>
              </dl>
            </section>
            <section className="ds-card">
              <p className="ds-k">Trajectory <span>Attainment 8 · dashed: median school</span></p>
              <Trajectory s={sel} med={M.med} years={M.years} />
            </section>
            <section className="ds-card">
              <p className="ds-k">Where every school moved <span>A8 a step · gold: this school</span></p>
              <Distribution all={data.all} sel={sel} M={M} />
              <div className="ds-strip" aria-hidden="true">{["R", "S", "I", "D"].map((k) => <i key={k} className={k} style={{ flex: C[k] }} />)}</div>
              <div className="ds-counts">{["R", "S", "I", "D"].map((k) => <span key={k} className={k}><b>{C[k]}</b>{QNAME[k]}</span>)}</div>
            </section>
            <section className="ds-card ds-sig">
              <p className="ds-k">Signals <span>{signals.length} among the dynamic schools</span></p>
              <ul>
                {signals.slice(0, 40).map((x, i) => (
                  <li key={i}><button onClick={() => pick(x.s)} className={x.s === sel ? "on" : ""}>
                    <b>{x.val}</b><span><em>{x.tag}</em> {x.label}<small>{x.s.name}</small></span>
                  </button></li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
      <p className="ds-foot">Hover a dynamic school to name it · ← → to step through them · M for the map · F to focus</p>

      <div className="ins-grid ds-below">
        <div className="panel wide">
          <h3>The dynamic schools, in order of momentum</h3>
          <p className="finding">Momentum adds the two axes together, each measured against how much schools vary on it, so a school counts for rising fast, for adding value, and most of all for both.</p>
          <div className="ds-regions">{regions.map((r) => <button key={r} className={region === r ? "on" : ""} onClick={() => { setRegion(r); setShown(25); }}>{r === "Yorkshire and the Humber" ? "Yorkshire & Humber" : r}</button>)}</div>
          <div className="ds-tablewrap">
            <table className="ds-table">
              <thead><tr><th>#</th><th>School</th><th className="r">FSM6</th><th className="r">A8 a step</th><th className="r">Progress 8</th><th className="r">A8 {M.years[2]}</th></tr></thead>
              <tbody>{ranked.slice(0, shown).map((s, i) => (
                <tr key={s.urn} onClick={() => { pick(s); shellRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className={s === sel ? "on" : ""}>
                  <td className="n">{i + 1}</td><td><b>{s.name}</b><span>{s.la}</span></td><td className="r">{fmt(s.fsm, 0, "%")}</td>
                  <td className="r p">{sign(s.x)}</td><td className="r p">{sign(s.y, 2)}</td><td className="r">{fmt(s.a3)}</td></tr>
              ))}</tbody>
            </table>
          </div>
          {ranked.length > shown && <button className="btn line ds-more" onClick={() => setShown((n) => n + 50)}>Show more ({ranked.length - shown} to go)</button>}
          <p className="src">{ranked.length} dynamic schools{region !== "All" ? " in " + region : ""}. Select a row to place it on the chart.</p>
        </div>
        <div className="panel">
          <h3>Where the movement is</h3>
          <p className="finding">The share of each region's secondaries that are dynamic, against the share where results and progress are both below the line.</p>
          {M.regs.map(([name, n, dsh, dec]) => (
            <div className="ds-reg" key={name}>
              <span className="nm">{name}</span>
              <span className="bar"><i style={{ width: dsh * 100 + "%" }} /><i className="d" style={{ width: dec * 100 + "%" }} /></span>
              <span className="dv">{Math.round(dsh * 100)}%</span>
            </div>
          ))}
          <p className="src">Purple: dynamic. Grey: both below the line. n = secondaries with all three years of results in each region.</p>
        </div>
        <div className="panel">
          <h3>How to read it</h3>
          <p className="finding">Across: the average of the two steps in Attainment 8, {M.years[0]} to {M.years[1]} and {M.years[1]} to {M.years[2]}, three consecutive years of results with the latest still provisional. Up: Progress 8, the value a school adds from pupils' starting points; the most recent published figure is for {M.years[0]}, as none was published for the two years since.</p>
          <p className="ds-p">The median school moved {sign(M.med.x)} a step. The three other quadrants are drawn smaller and pressed toward the edges so the dynamic schools have room; every school still sits at its true value. Only dynamic schools are named, anywhere on this page. One year's movement can be a cohort effect, a school that started high has less room to climb, the latest year is provisional, and Progress 8 is older than two of the three results years: this shows where to look, not what you will find.</p>
          <p className="src">Institute analysis of DfE data: {M.vintage}.</p>
        </div>
      </div>
    </>
  );
}
