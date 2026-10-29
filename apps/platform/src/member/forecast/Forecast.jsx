/* Forecast: the ledger and the years ahead. A head sees their school's
   returns since 2016/17, its unit costs against the schools most like it,
   where the money could go further, and what the roll forecast does to the
   reserve year by year, with the staffing decisions dated by the year they
   have to be taken. A trust, an authority or a diocese sees its estate the
   same way, school by school; a system leader sees England. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import { Thinking, ensureMotionCss } from "../../lib/motion.jsx";
import { getDataset, getPlaces, getFinance } from "../../lib/dataset.js";
import { PZ_CSS, attachTipCard } from "../prizm/render.js";
import { HZ_CSS } from "../horizon/Horizon.jsx";
import { estateSchools } from "../home/compute.js";
import { ledgerOf, peersOf, savings, project, estateLedger, staffing, tornado, DEFAULTS, ASSUMPTIONS, PLAN0, YL } from "./models.js";
import { schoolHtml, estateHtml, forecastDoc } from "./views.js";

const INK = "#221233", MUTED = "#6F6580", PURPLE = "#6A0CA0", GOLD = "#C6A035", HAIR = "rgba(34,18,51,.14)";
const barBtn = (solid) => ({ border: solid ? "none" : `1px solid ${HAIR}`, background: solid ? PURPLE : "#fff", color: solid ? "#fff" : INK, borderRadius: 999, padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" });
const fld = { boxSizing: "border-box", padding: "8px 10px", borderRadius: 9, border: `1px solid ${HAIR}`, fontSize: 13, background: "#fff", fontFamily: "inherit", color: INK, width: "100%" };
const lab = { display: "grid", gap: 5, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", color: MUTED, textTransform: "uppercase" };
const isState = (s) => !/independent/i.test(s.type || "");

export default function Forecast() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [data, setData] = useState(null);
  const [A, setA] = useState({ ...DEFAULTS });
  const [controls, setControls] = useState(false);
  const [tab, setTab] = useState("assumptions");
  const [plan, setPlan] = useState({ ...PLAN0 });
  const canvasRef = useRef(null);
  const system = user?.accountType === "system" || user?.accountType === "aepa";
  const estate = ["trust", "la", "diocese"].includes(user?.accountType || "");
  const dual = user?.accountType === "school" && (user.isAdmin || user.systemAccess);
  const [view, setView] = useState("school");
  const askUrn = new URLSearchParams(loc.search).get("school");

  useEffect(ensureMotionCss, []);
  useEffect(() => attachTipCard(document, (u) => navigate(`/members/forecast?school=${encodeURIComponent(u)}`)), [navigate]);
  useEffect(() => {
    let live = true;
    Promise.all([getDataset(), getPlaces(), getFinance()]).then(([d, places, F]) => { if (live) setData({ all: d.raw, places, F }); }).catch(() => live && setData({ all: [], places: null, F: null }));
    return () => { live = false; };
  }, []);

  /* what this account is shown */
  const scope = useMemo(() => {
    if (!data || !data.all.length) return null;
    const { all } = data;
    if (askUrn) { const s = all.find((x) => String(x.urn) === String(askUrn)); if (s) return { kind: "school", s, from: estate ? "estate" : system || (dual && view === "system") ? "system" : null }; }
    if (system || (dual && view === "system")) return { kind: "system", schools: all.filter(isState) };
    if (estate) return { kind: "estate", schools: estateSchools(all, user) };
    const byUrn = user?.urn ? all.find((s) => Number(s.urn) === Number(user.urn)) : null;
    const byName = !byUrn && user?.school ? all.find((s) => (s.name || "").trim().toLowerCase() === user.school.trim().toLowerCase()) : null;
    const s = byUrn || byName;
    return s ? { kind: "school", s } : { kind: "none" };
  }, [data, user, askUrn, view, system, estate, dual]);

  const run = useMemo(() => {
    if (!data || !scope || !data.F) return null;
    const { all, places, F } = data;
    try {
      if (scope.kind === "school") {
        const me = ledgerOf(F, scope.s.urn);
        if (!me) return { html: "", empty: true, title: scope.s.name };
        const peers = peersOf(F, all, scope.s.urn, me.last.y);
        const saves = savings(me, peers);
        const st = staffing(me, scope.s, peers);
        const P = project(me, places, A, plan, st);
        const torn = tornado(me, places, A, st, peers);
        return { html: schoolHtml({ me, peers, saves, P, A, core: scope.s, st, torn, plan }), st, title: me.name || scope.s.name, sub: `${scope.s.la || ""} · ${me.rows.length} years of returns, ${YL(me.first.y)} to ${YL(me.last.y)} · ${me.last.src === "A" ? "academy" : "maintained"}`, me, P };
      }
      if (scope.kind === "estate" || scope.kind === "system") {
        const label = scope.kind === "system" ? "England" : user.orgName;
        const E = estateLedger(F, all, scope.schools, places, A);
        return { html: estateHtml({ E, label, A, isSystem: scope.kind === "system" }), title: scope.kind === "system" ? "England, every state school" : user.orgName, sub: `${E.n} schools with finance returns · latest ${YL(E.latestYear)}`, E };
      }
      return { html: "", empty: true, title: "Your school" };
    } catch (e) { console.error(e); return { html: "", error: String(e && e.message || e), title: "Forecast" }; }
  }, [data, scope, A, plan, user]);

  /* every table sorts on its headings */
  useEffect(() => {
    const root = canvasRef.current;
    if (!root) return;
    const onClick = (e) => {
      const th = e.target.closest ? e.target.closest("table.pz-table th") : null;
      if (!th || !root.contains(th)) return;
      const table = th.closest("table"), idx = [...th.parentNode.children].indexOf(th);
      const dir = th.getAttribute("data-dir") === "desc" ? "asc" : "desc";
      [...table.querySelectorAll("th")].forEach((h) => h.removeAttribute("data-dir"));
      th.setAttribute("data-dir", dir);
      const body = table.tBodies[0];
      const val = (tr) => { const t = (tr.children[idx] || {}).textContent || ""; const n = parseFloat(t.replace(/[^0-9.\-−]/g, "").replace("−", "-")); return Number.isFinite(n) && /\d/.test(t) ? n : t.trim().toLowerCase(); };
      const rows = [...body.rows].sort((a, b) => { const x = val(a), y = val(b); if (typeof x === "number" && typeof y === "number") return dir === "desc" ? y - x : x - y; return dir === "desc" ? String(y).localeCompare(String(x)) : String(x).localeCompare(String(y)); });
      rows.forEach((r) => body.appendChild(r));
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [run]);

  function download() {
    if (!run || !run.html) return;
    const doc = forecastDoc(run.title, `${run.sub || ""} · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · pay ${A.pay}%, funding ${A.fund}%, prices ${A.infl}% a year`, run.html, PZ_CSS + HZ_CSS + FC_CSS);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
    a.download = `forecast-${run.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}.html`;
    a.click();
  }

  return (
    <div style={{ background: "#F2EFEA", minHeight: "100%", paddingBottom: 60 }}>
      <style>{PZ_CSS}{HZ_CSS}{FC_CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(242,239,234,.92)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${HAIR}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 22px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10.5, letterSpacing: ".16em", fontWeight: 700, color: GOLD }}>FORECAST</span>
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: INK, flex: "1 1 220px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{run ? run.title : "The ledger and the years ahead"}</span>
          {scope && scope.from && <Link to="/members/forecast" style={{ ...barBtn(false), textDecoration: "none" }}>← {scope.from === "estate" ? "Back to the estate" : "Back to England"}</Link>}
          {dual && !askUrn && (
            <div style={{ display: "inline-flex", gap: 3, background: "#fff", border: `1px solid ${HAIR}`, borderRadius: 999, padding: 3 }}>
              {[["school", user?.school || "Your school"], ["system", "England"]].map(([v, l]) => <button key={v} onClick={() => setView(v)} style={{ fontFamily: "inherit", border: "none", borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", background: view === v ? INK : "transparent", color: view === v ? "#fff" : MUTED }}>{l}</button>)}
            </div>
          )}
          {run && run.st && <button onClick={() => { setTab("staffing"); setControls(true); }} style={{ ...barBtn(false), background: controls && tab === "staffing" ? "rgba(106,12,160,.08)" : "#fff", borderColor: plan.dTeachers || plan.dSupport || plan.ptrTarget ? "#2F7A39" : HAIR }}>Staffing{plan.dTeachers || plan.dSupport || plan.ptrTarget ? " · plan on" : ""}</button>}
          <button onClick={() => { setTab("assumptions"); setControls(true); }} style={{ ...barBtn(false), background: controls && tab === "assumptions" ? "rgba(106,12,160,.08)" : "#fff" }}>Assumptions</button>
          <button onClick={download} disabled={!run || !run.html} style={barBtn(true)}>Download</button>
        </div>
      </div>

      {controls && (
        <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 360, zIndex: 400, background: "#fff", boxShadow: "-6px 0 40px rgba(34,18,51,.14)", display: "grid", gridTemplateRows: "auto 1fr" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px 0", borderBottom: `1px solid ${HAIR}` }}>
            {[["staffing", "Staffing"], ["assumptions", "Assumptions"]].filter(([k]) => k !== "staffing" || (run && run.st)).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: tab === k ? INK : MUTED, background: "transparent", border: "none", borderBottom: tab === k ? `2px solid ${PURPLE}` : "2px solid transparent", padding: "4px 0 10px", cursor: "pointer" }}>{l}</button>
            ))}
            <button onClick={() => setControls(false)} style={{ marginLeft: "auto", border: "none", background: "transparent", fontSize: 18, color: MUTED, cursor: "pointer", paddingBottom: 10 }}>×</button>
          </div>
          {tab === "staffing" && run && run.st && (
            <div style={{ overflow: "auto", padding: "14px 18px 24px", display: "grid", gap: 14, alignContent: "start" }}>
              <p style={{ margin: 0, fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>Your plan: the staffing you would run. It lands after the lead time and draws as a third line on the years ahead; everything else is as held.</p>
              <div style={{ fontSize: 12.5, color: INK, background: "#F4EEFA", borderRadius: 10, padding: "10px 12px", lineHeight: 1.5 }}>
                Today: <b>{run.st.teachers != null ? run.st.teachers.toFixed(1) : "–"}</b> teachers{run.st.support != null ? <>, <b>{run.st.support.toFixed(1)}</b> support staff</> : null}, <b>{run.st.ptr != null ? run.st.ptr.toFixed(1) : "–"}</b> pupils per teacher{run.st.peers && run.st.peers.ptr ? <> (schools like yours: {run.st.peers.ptr.toFixed(1)})</> : null}.
              </div>
              <label style={lab}>Teachers, against today (FTE)
                <input style={fld} type="number" step="0.5" value={plan.dTeachers} onChange={(e) => setPlan({ ...plan, dTeachers: +e.target.value || 0, ptrTarget: null })} />
                <span style={{ fontSize: 11, color: MUTED, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>negative to run with fewer; the teaching line moves in proportion</span>
              </label>
              <label style={lab}>Support staff, against today (FTE)
                <input style={fld} type="number" step="0.5" value={plan.dSupport} onChange={(e) => setPlan({ ...plan, dSupport: +e.target.value || 0 })} />
              </label>
              <label style={lab}>Or hold a pupil-teacher ratio
                <input style={fld} type="number" step="0.1" min="8" max="30" placeholder={run.st.peers && run.st.peers.ptr ? `e.g. ${run.st.peers.ptr.toFixed(1)}, the comparators'` : "e.g. 16"} value={plan.ptrTarget ?? ""} onChange={(e) => setPlan({ ...plan, ptrTarget: e.target.value === "" ? null : +e.target.value, dTeachers: 0 })} />
                <span style={{ fontSize: 11, color: MUTED, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>teachers then follow the roll at this ratio, year by year</span>
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {run.st.peers && run.st.peers.ptr && <button onClick={() => setPlan({ dTeachers: 0, dSupport: 0, ptrTarget: Math.round(run.st.peers.ptr * 10) / 10 })} style={{ ...barBtn(false), padding: "6px 12px", fontSize: 12 }}>At the comparators' ratio</button>}
                <button onClick={() => setPlan({ ...PLAN0 })} style={{ ...barBtn(false), padding: "6px 12px", fontSize: 12 }}>No plan</button>
              </div>
            </div>
          )}
          {tab === "assumptions" && (
          <div style={{ overflow: "auto", padding: "14px 18px 24px", display: "grid", gap: 14, alignContent: "start" }}>
            <p style={{ margin: 0, fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>What the years ahead assume. Move any of them and every figure recomputes; the defaults are reasonable, not authoritative.</p>
            <label style={lab}>Pupils follow
              <select style={fld} value={A.rollMode} onChange={(e) => setA({ ...A, rollMode: e.target.value })}>
                <option value="forecast">The planning area's forecast (DfE)</option>
                <option value="own">The school's own trend</option>
                <option value="flat">A flat roll</option>
                <option value="custom">A rate I set</option>
              </select>
            </label>
            {A.rollMode === "custom" && <label style={lab}>% a year<input style={fld} type="number" step="0.5" value={A.rollPct} onChange={(e) => setA({ ...A, rollPct: +e.target.value || 0 })} /></label>}
            <label style={lab}>Years ahead
              <select style={fld} value={A.horizonYears} onChange={(e) => setA({ ...A, horizonYears: +e.target.value })}>{[3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}</select>
            </label>
            {ASSUMPTIONS.map((a) => (
              <label key={a.k} style={{ ...lab, letterSpacing: 0, textTransform: "none", fontSize: 12.5, color: INK, fontWeight: 600 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>{a.label}<b style={{ color: PURPLE, whiteSpace: "nowrap" }}>{a.unit === "£" ? "£" + A[a.k].toLocaleString("en-GB") : a.unit === "%" ? A[a.k] + "%" : `${A[a.k]}`}</b></span>
                <input type="range" min={a.min} max={a.max} step={a.step} value={A[a.k]} onChange={(e) => setA({ ...A, [a.k]: +e.target.value })} style={{ accentColor: PURPLE }} />
                <span style={{ fontSize: 11, color: MUTED, fontWeight: 400 }}>{a.note}</span>
              </label>
            ))}
            <button onClick={() => setA({ ...DEFAULTS })} style={{ ...barBtn(false), justifySelf: "start", padding: "6px 14px", fontSize: 12 }}>Back to the defaults</button>
          </div>
          )}
        </div>
      )}

      <div style={{ maxWidth: 1180, margin: "22px auto 0", padding: "0 22px" }}>
        {!data && <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}><Thinking size={24} label="Reading every school's ledger since 2016/17…" /></div>}
        {data && !data.F && <div className="pz-report hz-out" style={{ padding: "34px 40px" }}><h2>The ledger is not published on this deployment yet.</h2><p className="pz-note">finance.json is built by data/pipeline/finance-build.py from the DfE's CFR and AAR workbooks.</p></div>}
        {data && data.F && run && (
          <div ref={canvasRef} className="pz-report hz-out fc-out" style={{ padding: "34px 40px 40px" }}>
            <div className="pz-kick"><span>Forecast · the ledger and the years ahead</span></div>
            <h1 style={{ fontSize: 34 }}>{run.title}</h1>
            {run.sub && <p className="pz-sub" style={{ fontSize: 14 }}>{run.sub}</p>}
            {run.empty && <p className="pz-note" style={{ marginTop: 20, fontSize: 14 }}>No full-year finance return for this school in the DfE's workbooks yet. Academies report a year behind maintained schools; a school that joined a trust mid-year makes a part-year return, which is set aside.</p>}
            {run.error && <p className="pz-note" style={{ color: "#B4475A" }}>{run.error}</p>}
            <div dangerouslySetInnerHTML={{ __html: run.html }} />
          </div>
        )}
      </div>
    </div>
  );
}

const FC_CSS = `
.fc-out .pz-block{margin-top:38px}
.fc-out .pz-block:first-of-type{margin-top:26px}
.fc-out .pz-tiles{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.fc-out .pz-tile .n{font-size:26px}
.fc-out table.pz-table td small{font-weight:400}
.fc-out table.pz-table td.nm{min-width:220px}
`;
