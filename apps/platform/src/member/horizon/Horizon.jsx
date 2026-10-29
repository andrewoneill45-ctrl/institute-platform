/* Horizon — the policy studio, by invitation. Atlas shows the map, Prizm
   explains the figures; Horizon is where a system leader tries an idea.
   Say it in words; the reader makes a scenario of it (lever, scope,
   settings) and the mathematics runs it on the published data of the day.
   Keep scenarios side by side, refine them back and forth, write the case
   for a paper, and keep the ones worth returning to. The AI arranges, the
   mathematics counts: no figure on the page is ever the reader's. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import { getDataset, getPlaces, getIntake } from "../../lib/dataset.js";
import { Thinking, Loading, ensureMotionCss } from "../../lib/motion.jsx";
import { PZ_CSS, attachTipCard } from "../prizm/render.js";
import { verifyCommentary } from "../prizm/engine.js";
import { FUND_PRESETS, ACC_MEASURES } from "./models.js";
import { LEVERS, defaultParams, runScenario, runHeavy, heavyKey, readLocally, nextSteps, titleFor, scopeLabel } from "./scenario.js";
import { compareHtml, horizonDoc, rippleHtml } from "./views.js";
import { ripple, ASSUMPTIONS, defaultAssumptions } from "./ripple.js";
import { listScenarios, saveScenario, deleteScenario } from "./vault.js";

const INK = "#221233", PURPLE = "#6A0CA0", GOLD = "#C6A035", MUTED = "#6F6580", HAIR = "rgba(34,18,51,.14)";
const REGIONS = ["North East", "North West", "Yorkshire and the Humber", "East Midlands", "West Midlands", "East of England", "London", "South East", "South West"];
const barBtn = (solid) => ({ border: solid ? "none" : `1px solid ${HAIR}`, background: solid ? PURPLE : "#fff", color: solid ? "#fff" : INK, borderRadius: 999, padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" });
const fld = { boxSizing: "border-box", padding: "8px 10px", borderRadius: 9, border: `1px solid ${HAIR}`, fontSize: 13, background: "#fff", fontFamily: "inherit", color: INK, width: "100%" };
const lab = { display: "grid", gap: 5, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", color: MUTED, textTransform: "uppercase" };
let sendPromise = null;
const getSend = () => (sendPromise = sendPromise || fetch("/data/send.json").then((r) => r.json()).catch(() => { sendPromise = null; return null; }));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "s" + Math.random().toString(36).slice(2, 9));

const cmpKey = (v) => (v == null ? "" : String(v));
export function horizonAllowed(user) { return !!(user && (user.isAdmin || user.horizonAccess)); }

/* worked briefs: each resolves at once, no reader */
const EXAMPLES = [
  { t: "An Inclusion Premium of £500m: who gains, who pays?", sub: "weighted to EHC plans four to one, budget-neutral", spec: { lever: "funding", scope: { type: "england" }, params: { preset: "inclusion", potM: 500, neutral: true, ...FUND_PRESETS.inclusion } } },
  { t: "Which London boroughs run out of secondary pupils first?", sub: "rolls to 2031/32 on the authorities' own forecasts", spec: { lever: "forecast", scope: { type: "region", name: "London" }, params: {} } },
  { t: "If accountability rewarded beating the odds, who rises?", sub: "every secondary re-ranked, by disadvantage", spec: { lever: "acc", scope: { type: "england" }, params: { weights: { a8: 1, b95: 0, dis: 1, odds: 1.5, att: 0.5, incl: 0.5, dest: 0 } } } },
  { t: "Can mainstream absorb the EHC plan surge?", sub: "England to 2031, a third of new demand kept in mainstream", spec: { lever: "send", scope: { type: "england" }, params: { growth: "trend", shift: 35 } } },
  { t: "Closing Lambeth's two emptiest secondaries", sub: "where the pupils go, and how far", spec: { lever: "rolls", scope: { type: "la", name: "Lambeth" }, params: { closeEmptiest: 2 } } },
  { t: "The primary picture in the North East", sub: "rolls, demand and results, carried forward", spec: { lever: "forecast", scope: { type: "region", name: "North East", phase: "primary" }, params: {} } },
];

export default function Horizon() {
  const { user } = useAuth() || {};
  const navigate = useNavigate();
  const ok = horizonAllowed(user);
  useEffect(ensureMotionCss, []);
  const [all, setAll] = useState(null);
  const [places, setPlaces] = useState(null);
  const [intake, setIntake] = useState(null);
  const [send, setSend] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [active, setActive] = useState(0);
  const [compareWith, setCompareWith] = useState(null);
  const [heavy, setHeavy] = useState({});
  const [heavyBusy, setHeavyBusy] = useState(false);
  const [q, setQ] = useState("");
  const [thinking, setThinking] = useState(false);
  const [stage, setStage] = useState("");
  const [note, setNote] = useState(null);
  const [echo, setEcho] = useState(null);
  const [choices, setChoices] = useState(null);
  const [controls, setControls] = useState(false);
  const [drawerTab, setDrawerTab] = useState("levers");
  const [assum, setAssum] = useState(defaultAssumptions());
  const [focus, setFocus] = useState(false);
  const [thread, setThread] = useState([]);
  const [showThread, setShowThread] = useState(false);
  const canvasRef = useRef(null);
  const [caseText, setCaseText] = useState({});
  const [caseBusy, setCaseBusy] = useState(false);
  const [saved, setSaved] = useState([]);
  const [keeping, setKeeping] = useState(false);
  const undoRef = useRef(null);
  const boxRef = useRef(null);
  const pendingRef = useRef(null);
  const [loadingNote, setLoadingNote] = useState(null);

  useEffect(() => {
    if (!ok) return;
    getDataset().then((d) => setAll(d && d.raw ? d.raw : null)).catch(() => {});
    getPlaces().then((d) => d && setPlaces(d));
    getIntake().then((d) => d && setIntake(d));
    getSend().then((d) => d && setSend(d));
    listScenarios().then(setSaved).catch(() => {});
    try {
      const p = new URLSearchParams(window.location.search);
      const sc = p.get("scope"), sp = p.get("spec"), ask = p.get("ask");
      if (sp) pendingRef.current = { spec: JSON.parse(sp) };
      else if (sc) pendingRef.current = { spec: { lever: "forecast", scope: JSON.parse(sc), params: {} }, from: "Prizm" };
      else if (ask) pendingRef.current = { ask };
    } catch { /* a bad link opens the door */ }
  }, [ok]);
  useEffect(() => attachTipCard(document, (u) => navigate(`/members/prizm?school=${encodeURIComponent(u)}`)), [navigate]);
  /* a hand-off from Prizm or a saved scenario opens once the data is here */
  useEffect(() => {
    if (!all || !pendingRef.current) return;
    const p = pendingRef.current; pendingRef.current = null; setLoadingNote(null);
    if (p.spec) { openSpec(normalise(p.spec)); if (p.from) setNote(`Carried over from ${p.from}: the scope you were reading, now where it is heading.`); }
    else if (p.ask) { setQ(p.ask); setTimeout(() => ask(p.ask), 50); }
  }, [all]); // eslint-disable-line react-hooks/exhaustive-deps

  const D = useMemo(() => ({ all, places, intake, send }), [all, places, intake, send]);
  const cur = scenarios[active] || null;
  const names = useMemo(() => {
    if (!all) return { regions: REGIONS, las: [], trusts: [] };
    return { regions: REGIONS, las: [...new Set(all.map((s) => s.la).filter(Boolean))].sort(), trusts: [...new Set(all.map((s) => s.trust).filter((v) => v && v !== "Not supported by a trust"))].sort() };
  }, [all]);

  /* every scenario runs against the data of the day; the slow part (every
     school's twins) runs off the main beat and is cached by scope */
  const runs = useMemo(() => (all ? scenarios.map((s) => { try { return runScenario(s.spec, { ...D, heavy: heavy[heavyKey(s.spec)] }); } catch (e) { return { html: "", summary: [], error: String(e && e.message || e) }; } }) : []), [all, scenarios, D, heavy]);
  const run = runs[active] || null;
  const round = useMemo(() => { if (!all || !cur || !run || run.waiting || run.error) return null; try { return ripple(cur.spec, run, D, assum); } catch { return null; } }, [all, cur, run, D, assum]);
  const roundHtml = useMemo(() => (round ? rippleHtml(round, cur.spec.title) : ""), [round, cur]);
  /* every table in the canvas sorts on its headings */
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
  }, [run, cmpKey(compareWith)]);
  useEffect(() => {
    if (!all || !cur || cur.spec.lever !== "forecast") return;
    const k = heavyKey(cur.spec);
    if (heavy[k]) return;
    setHeavyBusy(true);
    const t = setTimeout(() => { try { const h = runHeavy(cur.spec, D); setHeavy((c) => ({ ...c, [k]: h })); } finally { setHeavyBusy(false); } }, 40);
    return () => clearTimeout(t);
  }, [all, cur, D, heavy]);

  function normalise(spec) {
    const s = { lever: LEVERS[spec.lever] ? spec.lever : "forecast", scope: spec.scope && spec.scope.type ? { ...spec.scope } : { type: "england" }, params: { ...(spec.params || {}) }, title: spec.title };
    if (s.scope.phase !== "primary") delete s.scope.phase;
    s.title = s.title || titleFor(s);
    return s;
  }
  /* "the two emptiest" becomes URNs once the schools are known */
  function settle(spec) {
    if (spec.lever === "rolls" && spec.params && spec.params.closeEmptiest && all && places) {
      const probe = runScenario({ ...spec, params: { ...spec.params, closeEmptiest: undefined, close: [] } }, D);
      const urns = (probe.closable || []).slice(0, spec.params.closeEmptiest).map((r) => r.urn);
      return { ...spec, params: { ...spec.params, closeEmptiest: undefined, close: [...new Set([...(spec.params.close || []), ...urns])] }, title: spec.title };
    }
    return spec;
  }
  function openSpec(spec, asNew = false) {
    const s = settle(normalise(spec));
    s.title = spec.title && spec.title !== titleFor(spec) ? spec.title : titleFor(s);
    setScenarios((cur0) => {
      if (!cur0.length || asNew) { const next = [...cur0, { id: uid(), spec: s }]; setActive(next.length - 1); return next; }
      return cur0.map((x, i) => (i === active ? { ...x, spec: s } : x));
    });
    setCompareWith(null); setChoices(null);
  }
  function patch(p) {
    if (!cur) return;
    undoRef.current = { scenarios, active };
    openSpec({ ...cur.spec, params: { ...cur.spec.params, ...p }, title: null });
  }
  function duplicate() { if (!cur) return; setScenarios((c) => [...c, { id: uid(), spec: { ...cur.spec } }]); setActive(scenarios.length); }
  function remove(i) { setScenarios((c) => c.filter((_, j) => j !== i)); setActive((a) => Math.max(0, a - (i <= a ? 1 : 0))); setCompareWith(null); }
  function undo() { if (!undoRef.current) return; setScenarios(undoRef.current.scenarios); setActive(undoRef.current.active); undoRef.current = null; setEcho(null); setNote(null); }

  /* the reader: words to scenario, with the dataset's own names as context */
  async function ask(given) {
    const text = (given ?? q).trim();
    if (!text || thinking) return;
    if (!all) { pendingRef.current = { ask: text }; setLoadingNote("Opening as soon as the national dataset has arrived…"); return; }
    setQ(""); setThinking(true); setNote(null); setChoices(null);
    setStage("Reading the idea…");
    const local = readLocally(text, cur ? cur.spec : null, names);
    const t = text.toLowerCase();
    const trusts = names.trusts.filter((n) => n.toLowerCase().split(/\s+/).some((w) => w.length >= 4 && t.includes(w))).slice(0, 25);
    const context = `Regions: ${REGIONS.join("; ")}\nLocal authorities: ${names.las.join("; ")}\n${trusts.length ? "Trusts matching the words: " + trusts.join("; ") + "\n" : ""}${run && run.closable ? "Schools in scope, emptiest first: " + run.closable.slice(0, 30).map((r) => `${r.name} (${r.fill}% full)`).join("; ") : ""}`;
    let spec = null, reply = null, clarify = null;
    try {
      const r = await fetch("/.netlify/functions/horizon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brief: text, current: cur ? cur.spec : null, context }), signal: AbortSignal.timeout(22000) });
      const data = await r.json();
      if (r.ok && !data.error) { spec = data.scenario; reply = data.reply; clarify = data.clarify; }
      else throw new Error(data.error || "no answer");
    } catch {
      spec = local; reply = local ? "The reader is out of reach; read by the rules instead." : "The reader is out of reach, and the rules could not place that idea. Name a lever (funding, falling rolls, accountability, SEND, forecast) and a place.";
    }
    setThinking(false);
    if (clarify && clarify.length && !spec) { setChoices({ brief: text, names: clarify }); setNote(reply); return; }
    if (!spec) { setNote(reply || "Horizon has no lever for that yet."); return; }
    undoRef.current = cur ? { scenarios, active } : null;
    const asNew = !cur || /\b(new scenario|as a new|another scenario|scenario b|keep (a|this) and)\b/i.test(text);
    openSpec(spec, asNew);
    const s = normalise(spec);
    const label = `${LEVERS[s.lever].label} · ${scopeLabel(s.scope)}${s.scope.phase === "primary" ? " · primary" : ""}`;
    setEcho({ brief: text, label });
    setNote(reply);
    setThread((t) => [...t, { brief: text, label, reply, spec: s, at: Date.now() }]);
    boxRef.current && boxRef.current.blur();
  }
  function chooseName(name) {
    const brief = choices.brief;
    setChoices(null);
    ask(`${brief} (meaning ${name})`);
  }

  /* the case: prose for a paper, every figure verified against the findings */
  async function writeCase() {
    if (!cur || !run || caseBusy) return;
    setCaseBusy(true);
    const findings = { title: cur.spec.title, ...run.findings, headlineFigures: run.summary, inTheRound: round ? round.dials.map((d) => ({ dial: d.label, today: d.now, scenario: d.after, change: d.delta, how: d.note })) : undefined, assumptions: assum };
    try {
      const r = await fetch("/.netlify/functions/horizon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "case", findings }), signal: AbortSignal.timeout(40000) });
      const data = await r.json();
      if (!r.ok || data.error || !data.text) throw new Error(data.error || "no text");
      const safe = verifyCommentary(data.text, findings);
      if (safe) setCaseText((c) => ({ ...c, [cur.id]: safe }));
      else setNote("The reader's draft quoted a figure outside the computed findings, so it was set aside. Ask again.");
    } catch { setNote("The reader is out of reach just now; the scenario stands on its own."); }
    setCaseBusy(false);
  }
  async function keep() {
    if (!cur || keeping) return;
    setKeeping(true);
    try { const r = await saveScenario(cur.spec.title, cur.spec); setSaved((s) => [r, ...s]); setNote("Kept. It recomputes on today's data whenever you reopen it."); }
    catch (e) { setNote("Could not keep it: " + (e.message || e)); }
    setKeeping(false);
  }
  function download() {
    if (!cur || !run) return;
    const cmp = compareWith != null && runs[compareWith] ? compareHtml({ ...run, title: cur.spec.title }, { ...runs[compareWith], title: scenarios[compareWith].spec.title }, String.fromCharCode(65 + active), String.fromCharCode(65 + compareWith)) : "";
    const prose = caseText[cur.id] ? `<section class="pz-block pz-foreword"><div class="pz-kick"><span>The case</span></div><div class="fw">${caseText[cur.id].split(/\n+/).map((p) => `<p>${p.replace(/</g, "&lt;")}</p>`).join("")}</div><div class="fw-note">Written by Horizon's reader; every figure verified against the computed findings before it reached the page.</div></section>` : "";
    const doc = horizonDoc(cur.spec.title, `${LEVERS[cur.spec.lever].label} · ${scopeLabel(cur.spec.scope)} · ${cur.spec.scope.phase === "primary" ? "primary" : "secondary"} · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, prose + roundHtml + cmp + run.html + (compareWith != null ? runs[compareWith].html : ""), PZ_CSS + HZ_CSS);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
    a.download = `horizon-${cur.spec.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}.html`;
    a.click();
  }
  function applyStep(sx) {
    undoRef.current = { scenarios, active };
    if (sx.patch) patch(sx.patch);
    else if (sx.lever) openSpec({ lever: sx.lever, scope: cur.spec.scope, params: {} });
    else if (sx.scope) openSpec({ ...cur.spec, scope: sx.scope, params: cur.spec.lever === "rolls" ? {} : cur.spec.params, title: null });
    else if (sx.compare) { const next = { id: uid(), spec: normalise({ ...cur.spec, scope: sx.compare, title: null }) }; setScenarios((c) => [...c, next]); setCompareWith(scenarios.length); }
  }
  const onBoxKey = (e) => { if (e.key === "Enter") { e.preventDefault(); ask(); } else if (e.key === "Escape") { setQ(""); boxRef.current && boxRef.current.blur(); } };

  if (!ok) {
    return (
      <div style={{ maxWidth: 560, margin: "80px auto", textAlign: "center", padding: "0 16px" }}>
        <div style={{ fontSize: 11, letterSpacing: ".22em", fontWeight: 700, color: "#8a6d1c" }}>HORIZON · THE POLICY STUDIO</div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 500, fontSize: 36, color: INK, margin: "10px 0 8px" }}>By invitation.</h1>
        <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.55 }}>Forecasts and policy levers for the whole system. Ask the Institute if you would like access.</p>
      </div>
    );
  }

  const tokens = cur ? scenarioTokens(cur.spec) : [];
  const steps = cur && run ? nextSteps(cur.spec, run) : [];
  const choicesBand = choices ? (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
      <span style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: "#B4475A" }}>WHICH?</span>
      {choices.names.map((n) => <button key={n} onClick={() => chooseName(n)} style={{ ...barBtn(false), padding: "5px 12px", fontSize: 12 }}>{n}</button>)}
    </div>
  ) : null;

  /* ── the opening: one box, worked briefs, the vault ── */
  if (!cur) {
    return (
      <div style={{ background: "#F2EFEA", minHeight: "100%", padding: "9vh 22px 60px" }}>
        <style>{PZ_CSS}</style>
        <div className="asi-rise" style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: ".22em", fontWeight: 700, color: "#8a6d1c" }}>HORIZON · THE POLICY STUDIO</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 500, fontSize: "clamp(30px,4.2vw,44px)", letterSpacing: "-.015em", margin: "10px 0 8px", color: INK }}>Say what you want to try.</h1>
          <p style={{ color: MUTED, fontSize: 14.5, margin: "0 auto 24px", maxWidth: 600, lineHeight: 1.5 }}>A premium, a closure, a new measure, a growth rate. Horizon turns the idea into a scenario and runs it on the DfE&rsquo;s published data; every figure is &ldquo;if this held&rdquo;, never a prediction.</p>
          <input ref={boxRef} autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onBoxKey}
            placeholder="What if an Inclusion Premium of £500m weighted EHC plans four to one?"
            style={{ width: "100%", boxSizing: "border-box", padding: "16px 18px", borderRadius: 14, border: `1.5px solid ${HAIR}`, fontSize: 16, background: "#fff", boxShadow: "0 10px 36px rgba(34,18,51,.08)", fontFamily: "inherit", color: INK, WebkitAppearance: "none", appearance: "none" }} />
          {thinking || (!all && loadingNote)
            ? <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}><Thinking size={24} label={thinking ? stage || "Thinking…" : loadingNote} /></div>
            : all
              ? <div style={{ fontSize: 11.5, color: MUTED, marginTop: 8 }}>Enter runs it · five levers: forecasts, falling rolls, funding, accountability, SEND</div>
              : <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 10, fontSize: 11.5, color: MUTED }}><Thinking size={16} label="Loading the national dataset (a few seconds)…" /></div>}
          {choicesBand}
          {!thinking && note && <div style={{ marginTop: 10, fontSize: 12.5, color: "#4B0875", background: "rgba(106,12,160,.06)", border: "1px solid rgba(106,12,160,.16)", borderRadius: 10, padding: "8px 12px", textAlign: "left" }}>{note}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 10, marginTop: 34, textAlign: "left" }}>
            {EXAMPLES.map((ex) => (
              <button key={ex.t} onClick={() => { if (!all) { pendingRef.current = { spec: { ...ex.spec, title: ex.t } }; setLoadingNote(`Opening "${ex.t}" as soon as the national dataset has arrived…`); return; } openSpec({ ...ex.spec, title: ex.t }, true); }} className="asi-lift"
                style={{ fontFamily: "inherit", textAlign: "left", background: "#fff", border: `1px solid ${HAIR}`, borderRadius: 14, padding: "15px 18px", cursor: all ? "pointer" : "progress", opacity: all ? 1 : 0.8 }}>
                <span style={{ display: "block", fontFamily: "Fraunces, serif", fontSize: 16.5, fontWeight: 500, color: INK, lineHeight: 1.3 }}>{ex.t}</span>
                <span style={{ display: "block", fontSize: 11.5, color: MUTED, marginTop: 5 }}>{ex.sub}</span>
              </button>
            ))}
          </div>
          {saved.length > 0 && (
            <div style={{ marginTop: 38, textAlign: "left" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".14em", fontWeight: 700, color: MUTED, marginBottom: 10 }}>KEPT SCENARIOS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
                {saved.slice(0, 8).map((r) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "flex-start", background: "#fff", border: `1px solid ${HAIR}`, borderRadius: 12, overflow: "hidden" }}>
                    <button onClick={() => { if (!all) { pendingRef.current = { spec: { ...r.spec, title: r.title } }; setLoadingNote(`Opening "${r.title}" as soon as the national dataset has arrived…`); return; } openSpec({ ...r.spec, title: r.title }, true); }} style={{ flex: 1, minWidth: 0, fontFamily: "inherit", textAlign: "left", border: "none", background: "transparent", padding: "12px 4px 12px 15px", cursor: "pointer" }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: INK, lineHeight: 1.3 }}>{r.title}</span>
                      <span style={{ display: "block", fontSize: 10.5, color: MUTED, marginTop: 4 }}>{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · recomputes on today&apos;s data</span>
                    </button>
                    <button onClick={() => deleteScenario(r.id).then(() => setSaved((s) => s.filter((x) => x.id !== r.id))).catch(() => {})} title="Remove" style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: 15, padding: "10px 10px 0 2px" }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── the studio: one bar over the scenarios ── */
  const cmpRun = compareWith != null ? runs[compareWith] : null;
  const waiting = run && run.waiting;
  return (
    <div style={{ background: "#F2EFEA", minHeight: "100%", paddingBottom: 60 }}>
      <style>{PZ_CSS}{HZ_CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(242,239,234,.92)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${HAIR}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: focus ? "7px 22px" : "10px 22px" }}>
          {focus ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "Fraunces, serif", fontSize: 15, color: INK, flex: "1 1 200px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><b style={{ color: "#8a6d1c", marginRight: 6 }}>{String.fromCharCode(65 + active)}</b>{cur.spec.title}</span>
              <button onClick={() => { setFocus(false); setTimeout(() => boxRef.current && boxRef.current.focus(), 30); }} style={{ ...barBtn(false), padding: "6px 14px", fontSize: 12 }}>Change it</button>
              <button onClick={() => setFocus(false)} title="Show the bar" style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>▾</button>
            </div>
          ) : (<>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px", minWidth: 240 }}>
              <input ref={boxRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onBoxKey}
                placeholder={thinking ? stage || "Thinking…" : "Change it, ask what if, or try another idea…"}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: `1px solid ${HAIR}`, fontSize: 13.5, background: "#fff", fontFamily: "inherit", color: INK, WebkitAppearance: "none", appearance: "none" }} />
            </div>
            <button onClick={() => ask()} disabled={thinking || q.trim().length < 2} style={{ ...barBtn(true), background: INK, opacity: thinking ? 0.55 : 1 }}>{thinking ? "Reading…" : "Try it"}</button>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
              {thread.length > 0 && <button onClick={() => setShowThread((v) => !v)} style={{ ...barBtn(false), background: showThread ? "rgba(106,12,160,.08)" : "#fff" }}>Thread · {thread.length}</button>}
              <button onClick={() => setControls((v) => !v)} style={{ ...barBtn(false), background: controls ? "rgba(106,12,160,.08)" : "#fff" }}>Levers and assumptions</button>
              <button onClick={writeCase} disabled={caseBusy || !run || !run.html} style={{ ...barBtn(false), color: "#4B0875", borderColor: "rgba(106,12,160,.3)", opacity: caseBusy ? 0.6 : 1 }}>{caseBusy ? "Writing…" : caseText[cur.id] ? "Rewrite the case" : "Write the case"}</button>
              <button onClick={keep} disabled={keeping} style={barBtn(false)}>{keeping ? "Keeping…" : "Keep it"}</button>
              <button onClick={download} disabled={!run || !run.html} style={barBtn(true)}>Download</button>
              <button onClick={() => setFocus(true)} title="Hide the bar and read" style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: 16, padding: "0 2px" }}>▴</button>
            </div>
          </div>

          {/* the scenarios, A B C, side by side */}
          <div className="hz-strip" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 9 }}>
            {scenarios.map((s, i) => (
              <span key={s.id} style={{ display: "inline-flex", alignItems: "center", background: i === active ? INK : "#fff", color: i === active ? "#fff" : INK, border: `1px solid ${i === active ? INK : HAIR}`, borderRadius: 999, overflow: "hidden" }}>
                <button onClick={() => { setActive(i); if (compareWith === i) setCompareWith(null); }} style={{ border: "none", background: "transparent", color: "inherit", padding: "5px 6px 5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <b style={{ color: i === active ? GOLD : "#8a6d1c", marginRight: 6 }}>{String.fromCharCode(65 + i)}</b>{s.spec.title}
                </button>
                {scenarios.length > 1 && <button onClick={() => remove(i)} title="Close this scenario" style={{ border: "none", background: "transparent", color: i === active ? "rgba(255,255,255,.7)" : MUTED, cursor: "pointer", fontSize: 13, padding: "0 9px 0 2px" }}>×</button>}
              </span>
            ))}
            <button onClick={duplicate} style={{ ...barBtn(false), padding: "5px 12px", fontSize: 11.5 }}>+ Copy as {String.fromCharCode(65 + scenarios.length)}</button>
            {scenarios.length > 1 && (
              <select value={compareWith == null ? "" : String(compareWith)} onChange={(e) => setCompareWith(e.target.value === "" ? null : +e.target.value)} style={{ ...fld, width: "auto", padding: "5px 10px", fontSize: 11.5, borderRadius: 999 }}>
                <option value="">Compare with…</option>
                {scenarios.map((s, i) => (i !== active ? <option key={s.id} value={i}>{String.fromCharCode(65 + i)}: {s.spec.title.slice(0, 40)}</option> : null))}
              </select>
            )}
            <button onClick={() => { setScenarios([]); setActive(0); setCompareWith(null); setNote(null); setEcho(null); setThread([]); }} style={{ border: "none", background: "transparent", color: "#B3261E", cursor: "pointer", fontSize: 11.5, textDecoration: "underline", padding: 0, marginLeft: 4 }}>start again</button>
          </div>

          {/* the scenario, taken apart */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
            {tokens.map((t) => (
              <span key={t.k} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: t.k === "lever" ? "rgba(198,160,53,.14)" : t.k === "scope" ? "rgba(106,12,160,.09)" : "#fff", border: `1px solid ${t.k === "lever" ? "rgba(198,160,53,.5)" : t.k === "scope" ? "rgba(106,12,160,.28)" : HAIR}`, borderRadius: 999, padding: "4px 6px 4px 12px", fontSize: 12, fontWeight: 600, color: INK }}>
                {t.label}
                {t.reset && <button onClick={() => { undoRef.current = { scenarios, active }; openSpec(t.reset(cur.spec)); }} title="Remove" style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 5px" }}>×</button>}
                {!t.reset && <span style={{ width: 4 }} />}
              </span>
            ))}
            {run && <span style={{ fontSize: 12, color: MUTED, fontWeight: 600, padding: "0 4px" }}>{run.n.toLocaleString("en-GB")} {cur.spec.scope.phase === "primary" ? "primar" : "secondar"}{run.n === 1 ? "y" : "ies"}</span>}
          </div>

          {(note || thinking || echo || heavyBusy) && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 8, background: "rgba(106,12,160,.06)", border: "1px solid rgba(106,12,160,.16)", borderRadius: 10, padding: "8px 12px" }}>
              {thinking ? <Thinking label={stage || "Thinking…"} style={{ flex: 1 }} />
                : heavyBusy && !note ? <Thinking label="Walking every school's twins across England for the results projection…" style={{ flex: 1 }} />
                : <div style={{ flex: 1, minWidth: 0 }}>
                    {echo && <div style={{ fontSize: 12, color: INK, marginBottom: note ? 3 : 0 }}><i>&ldquo;{echo.brief.slice(0, 90)}{echo.brief.length > 90 ? "…" : ""}&rdquo;</i> read as <b>{echo.label}</b>{undoRef.current && <> &middot; <button onClick={undo} style={{ border: "none", background: "transparent", color: "#B4475A", cursor: "pointer", fontSize: 12, textDecoration: "underline", padding: 0, fontFamily: "inherit" }}>not what I meant, undo</button></>}</div>}
                    {note && <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "#4B0875" }}>{note}</span>}
                  </div>}
              {!thinking && <button onClick={() => { setNote(null); setEcho(null); }} style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: 14, padding: 0 }}>×</button>}
            </div>
          )}
          {choicesBand}
          {steps.length > 0 && !thinking && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
              <span style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: GOLD }}>WHAT IF</span>
              {steps.map((sx) => <button key={sx.t} onClick={() => applyStep(sx)} style={{ border: "1px solid rgba(198,160,53,.45)", background: "#fff", color: INK, borderRadius: 999, padding: "4px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{sx.t}</button>)}
              <button onClick={() => boxRef.current && boxRef.current.focus()} style={{ border: "none", background: "transparent", color: "#4B0875", cursor: "pointer", fontSize: 11.5, textDecoration: "underline", padding: 0, fontFamily: "inherit" }}>or ask in your own words</button>
            </div>
          )}
          </>)}
        </div>
      </div>

      {/* the thread: what has been asked, and the way back to any point */}
      {showThread && thread.length > 0 && (
        <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 340, zIndex: 400, background: "#fff", boxShadow: "6px 0 40px rgba(34,18,51,.14)", padding: "18px 18px 24px", overflow: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><b style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: INK }}>The thread</b><button onClick={() => setShowThread(false)} style={{ border: "none", background: "transparent", fontSize: 18, color: MUTED, cursor: "pointer" }}>×</button></div>
          {thread.map((t, i) => (
            <div key={t.at} style={{ borderLeft: `2px solid ${GOLD}`, padding: "4px 0 4px 12px", margin: "0 0 14px" }}>
              <div style={{ fontSize: 13, color: INK, fontStyle: "italic" }}>&ldquo;{t.brief}&rdquo;</div>
              <div style={{ fontSize: 11.5, color: MUTED, margin: "3px 0" }}>read as <b style={{ color: INK }}>{t.label}</b></div>
              {t.reply && <div style={{ fontSize: 12, color: "#4B0875" }}>{t.reply}</div>}
              <button onClick={() => { openSpec(t.spec, true); setShowThread(false); }} style={{ border: "none", background: "transparent", color: PURPLE, cursor: "pointer", fontSize: 11.5, textDecoration: "underline", padding: 0, marginTop: 4, fontFamily: "inherit" }}>reopen as a new scenario</button>
            </div>
          ))}
        </div>
      )}

      {/* the levers and assumptions, in a drawer that leaves the page alone */}
      {controls && (
        <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 360, zIndex: 400, background: "#fff", boxShadow: "-6px 0 40px rgba(34,18,51,.14)", display: "grid", gridTemplateRows: "auto 1fr" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 16px 0" }}>
            {[["levers", "The levers"], ["assumptions", "Assumptions"]].map(([k, l]) => <button key={k} onClick={() => setDrawerTab(k)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: "6px 10px", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", color: drawerTab === k ? INK : MUTED, borderBottom: `2.5px solid ${drawerTab === k ? GOLD : "transparent"}` }}>{l}</button>)}
            <button onClick={() => setControls(false)} style={{ marginLeft: "auto", border: "none", background: "transparent", fontSize: 18, color: MUTED, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ overflow: "auto", padding: "12px 16px 24px" }}>
            {drawerTab === "levers"
              ? <Levers spec={cur.spec} run={run} onPatch={patch} onLever={(l) => { undoRef.current = { scenarios, active }; openSpec({ lever: l, scope: cur.spec.scope, params: {} }); }} onScope={(sc) => { undoRef.current = { scenarios, active }; openSpec({ ...cur.spec, scope: sc, params: cur.spec.lever === "rolls" ? {} : cur.spec.params, title: null }); }} names={names} />
              : <Assumptions value={assum} onChange={setAssum} />}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 22px 0" }}>
        <div style={{ minWidth: 0 }} ref={canvasRef}>
          {!all ? <Loading title="Horizon" label="the national dataset is arriving…" />
            : waiting ? <Loading title="Horizon" label={`${waiting} are arriving…`} />
            : run && run.error ? <div style={{ color: "#B3261E", padding: 20 }}>This scenario could not run: {run.error}</div>
            : (
              <div className="asi-rise pz-report hz-out" style={{ borderRadius: 4 }}>
                <input value={cur.spec.title} onChange={(e) => setScenarios((c) => c.map((x, i) => (i === active ? { ...x, spec: { ...x.spec, title: e.target.value } } : x)))} aria-label="Scenario title"
                  style={{ width: "100%", boxSizing: "border-box", border: "none", background: "transparent", fontFamily: "Fraunces, serif", fontSize: 22, color: INK, padding: "0 0 10px", outline: "none", borderBottom: `1px dashed ${HAIR}`, marginBottom: 18 }} />
                {caseText[cur.id] && <section className="pz-block pz-foreword"><div className="pz-kick"><span>The case</span></div><div className="fw">{caseText[cur.id].split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div><div className="fw-note">Written by Horizon&rsquo;s reader; every figure verified against the computed findings before it reached the page.</div></section>}
                {roundHtml && <div dangerouslySetInnerHTML={{ __html: roundHtml }} />}
                {cmpRun && <div dangerouslySetInnerHTML={{ __html: compareHtml({ ...run, title: cur.spec.title }, { ...cmpRun, title: scenarios[compareWith].spec.title }, String.fromCharCode(65 + active), String.fromCharCode(65 + compareWith)) }} />}
                <div dangerouslySetInnerHTML={{ __html: run ? run.html : "" }} />
                {cmpRun && <><div style={{ margin: "34px 0 14px", fontSize: 10.5, letterSpacing: ".14em", fontWeight: 700, color: MUTED }}>{String.fromCharCode(65 + compareWith)} · {scenarios[compareWith].spec.title.toUpperCase()}</div><div dangerouslySetInnerHTML={{ __html: cmpRun.html }} /></>}
                <div className="pz-foot"><span>Modelled in Horizon at institute.school from the DfE&rsquo;s published data. Every figure is &ldquo;if this held&rdquo;, not a prediction.</span></div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

/* the scenario as removable chips */
function scenarioTokens(spec) {
  const p = spec.params || {}, L = LEVERS[spec.lever];
  const t = [{ k: "lever", label: L.label }, { k: "scope", label: scopeLabel(spec.scope), reset: spec.scope.type !== "england" ? (s) => ({ ...s, scope: { type: "england", phase: s.scope.phase }, title: null }) : null }];
  if (spec.scope.phase === "primary") t.push({ k: "phase", label: "primary", reset: (s) => ({ ...s, scope: { ...s.scope, phase: undefined }, params: s.lever === "rolls" ? {} : s.params, title: null }) });
  const d = defaultParams(spec.lever, spec.scope.phase === "primary");
  const chip = (k, label, key) => { if (p[key] !== undefined && JSON.stringify(p[key]) !== JSON.stringify(d[key])) t.push({ k, label, reset: (s) => ({ ...s, params: { ...s.params, [key]: d[key] }, title: null }) }); };
  if (spec.lever === "funding") { chip("pot", `£${p.potM}m`, "potM"); if (p.neutral) chip("neutral", "budget-neutral", "neutral"); chip("ehcp", `EHC plans ×${p.ehcp}`, "ehcp"); chip("fsm", `FSM ×${p.fsm}`, "fsm"); chip("senk", `SEN support ×${p.senk}`, "senk"); chip("eal", `EAL ×${p.eal}`, "eal"); chip("idaci", `deprivation ×${p.idaci}`, "idaci"); }
  if (spec.lever === "rolls") { chip("min", `${p.minPerYear} a year group`, "minPerYear"); chip("shift", p.demandShift === 0 ? "no demand shift" : p.demandShift === 1 ? "full demand shift" : "half demand shift", "demandShift"); if (p.close && p.close.length) chip("close", `${p.close.length} closure${p.close.length === 1 ? "" : "s"}`, "close"); }
  if (spec.lever === "send") { chip("growth", typeof p.growth === "number" ? `${p.growth}% a year` : p.growth === "half" ? "half the trend" : p.growth === "flat" ? "no growth" : "the trend", "growth"); chip("shift", `${p.shift}% in mainstream`, "shift"); }
  if (spec.lever === "acc") { const W = p.weights || {}; Object.entries(W).filter(([, w]) => w > 0).forEach(([k, w]) => t.push({ k: "w" + k, label: `${ACC_LABEL[k] || k} ${w}`, reset: (s) => ({ ...s, params: { ...s.params, weights: { ...W, [k]: 0 } }, title: null }) })); }
  return t;
}
const ACC_LABEL = { a8: "Attainment 8", b95: "5+ E&M", dis: "disadvantaged", odds: "beating the odds", att: "attendance", incl: "inclusion", dest: "destinations", rwm: "RWM", high: "higher standard" };

/* the levers: every setting the reader can set, by hand */
function Levers({ spec, run, onPatch, onLever, onScope, names }) {
  const p = spec.params || {}, PRI = spec.scope.phase === "primary";
  const [scType, setScType] = useState(spec.scope.type);
  const [scName, setScName] = useState(spec.scope.name || "");
  useEffect(() => { setScType(spec.scope.type); setScName(spec.scope.name || ""); }, [spec.scope.type, spec.scope.name]);
  const list = scType === "la" ? names.las : scType === "trust" ? names.trusts : scType === "region" ? REGIONS : [];
  const commit = (type, name) => { if (type === "england") onScope({ type: "england", phase: spec.scope.phase }); else if (name && list.includes(name)) onScope({ type, name, phase: spec.scope.phase }); };
  return (
    <aside style={{ display: "grid", gap: 13 }}>
      <label style={lab}>Lever
        <select style={fld} value={spec.lever} onChange={(e) => onLever(e.target.value)}>{Object.entries(LEVERS).map(([k, L]) => <option key={k} value={k}>{L.label}: {L.verb}</option>)}</select>
      </label>
      <div style={{ display: "flex", background: "#F4EEFA", borderRadius: 999, padding: 3 }}>
        {[["secondary", "Secondary"], ["primary", "Primary"]].map(([k, l]) => (
          <button key={k} onClick={() => onScope({ ...spec.scope, phase: k === "primary" ? "primary" : undefined })} style={{ flex: 1, border: "none", cursor: "pointer", borderRadius: 999, padding: "6px 0", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: (PRI ? "primary" : "secondary") === k ? "#fff" : "transparent", color: (PRI ? "primary" : "secondary") === k ? "#4B0875" : MUTED, boxShadow: (PRI ? "primary" : "secondary") === k ? "0 1px 3px rgba(34,18,51,.12)" : "none" }}>{l}</button>
        ))}
      </div>
      <label style={lab}>Area
        <select style={fld} value={scType} onChange={(e) => { setScType(e.target.value); setScName(""); if (e.target.value === "england") commit("england"); }}>
          <option value="england">England</option><option value="region">A region</option><option value="la">A local authority</option><option value="trust">A trust</option>
        </select>
      </label>
      {scType !== "england" && (<>
        <input style={fld} list="hz-names" value={scName} onChange={(e) => { setScName(e.target.value); if (list.includes(e.target.value)) commit(scType, e.target.value); }} placeholder={scType === "la" ? "Start typing an authority" : scType === "trust" ? "Start typing a trust" : "A region"} />
        <datalist id="hz-names">{list.map((n) => <option key={n} value={n} />)}</datalist>
      </>)}
      <hr style={{ border: "none", borderTop: `1px solid ${HAIR}`, margin: "2px 0" }} />
      {spec.lever === "forecast" && <p style={{ margin: 0, fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>Rolls carried forward by the authorities&rsquo; planning-area forecasts; demand by its five-year trend; results by how far schools hold their distance from their twins. No settings: change the area or phase.</p>}
      {spec.lever === "rolls" && (<>
        <label style={lab}>Smallest viable year group<input style={fld} type="number" min="10" step="5" value={p.minPerYear ?? ""} onChange={(e) => onPatch({ minPerYear: +e.target.value || (PRI ? 30 : 120) })} /></label>
        <label style={lab}>Demand shift
          <select style={fld} value={p.demandShift ?? 0.5} onChange={(e) => onPatch({ demandShift: +e.target.value })}>
            <option value={0}>Off: every school shrinks with its area</option><option value={0.5}>Half: shares follow first preferences, damped</option><option value={1}>Full: shares follow the five-year trend</option>
          </select>
        </label>
        <div style={lab}>Close schools
          <div style={{ maxHeight: 280, overflow: "auto", display: "grid", gap: 4, fontWeight: 500, letterSpacing: 0, textTransform: "none", fontSize: 12.5, color: INK }}>
            {(run && run.closable || []).slice(0, 40).map((r) => (
              <label key={r.urn} style={{ display: "flex", gap: 7, alignItems: "flex-start", cursor: "pointer" }}>
                <input type="checkbox" checked={(p.close || []).includes(r.urn)} onChange={(e) => onPatch({ close: e.target.checked ? [...(p.close || []), r.urn] : (p.close || []).filter((x) => x !== r.urn) })} style={{ accentColor: PURPLE, marginTop: 2 }} />
                <span>{r.name} <span style={{ color: r.risk ? "#B4475A" : MUTED }}>{r.fill}%</span></span>
              </label>
            ))}
          </div>
        </div>
      </>)}
      {spec.lever === "funding" && (<>
        <label style={lab}>Model
          <select style={fld} value={p.preset || "custom"} onChange={(e) => onPatch({ preset: e.target.value, ...(FUND_PRESETS[e.target.value] || {}) })}>
            {Object.entries(FUND_PRESETS).map(([k, x]) => <option key={k} value={k}>{x.label}</option>)}<option value="custom">My own weights</option>
          </select>
        </label>
        <label style={lab}>Pot (£ millions)<input style={fld} type="number" min="1" step="10" value={p.potM ?? 250} onChange={(e) => onPatch({ potM: +e.target.value || 0 })} /></label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, color: INK, fontWeight: 600, cursor: "pointer" }}><input type="checkbox" checked={!!p.neutral} onChange={(e) => onPatch({ neutral: e.target.checked })} style={{ accentColor: PURPLE }} />Budget-neutral (top-slice every school)</label>
        {[["fsm", "Per FSM pupil"], ["senk", "Per SEN support pupil"], ["ehcp", "Per EHC plan"], ["eal", "Per EAL pupil"], ["idaci", "Area deprivation"]].map(([k, l]) => (
          <label key={k} style={{ ...lab, gridTemplateColumns: "1fr 70px", alignItems: "center" }}>{l}<input style={fld} type="number" min="0" step="0.5" value={p[k] ?? 0} onChange={(e) => onPatch({ preset: "custom", [k]: +e.target.value || 0 })} /></label>
        ))}
      </>)}
      {spec.lever === "acc" && ACC_MEASURES[PRI ? "P" : "S"].map((m) => (
        <label key={m.k} style={{ ...lab, letterSpacing: 0, textTransform: "none", fontSize: 12.5, color: INK, fontWeight: 600 }}>
          <span style={{ display: "flex", justifyContent: "space-between" }}>{m.label}<b style={{ color: PURPLE }}>{(p.weights || {})[m.k] ?? 0}</b></span>
          <input type="range" min="0" max="2" step="0.5" value={(p.weights || {})[m.k] ?? 0} onChange={(e) => onPatch({ weights: { ...(p.weights || {}), [m.k]: +e.target.value } })} style={{ accentColor: PURPLE }} />
        </label>
      ))}
      {spec.lever === "send" && (<>
        <label style={lab}>EHC plan growth
          <select style={fld} value={typeof p.growth === "number" ? "custom" : p.growth || "trend"} onChange={(e) => onPatch({ growth: e.target.value === "custom" ? 8 : e.target.value })}>
            <option value="trend">Each authority&rsquo;s five-year trend</option><option value="half">Half that trend</option><option value="flat">No further growth</option><option value="custom">A rate I set</option>
          </select>
        </label>
        {typeof p.growth === "number" && <label style={lab}>% a year<input style={fld} type="number" step="0.5" value={p.growth} onChange={(e) => onPatch({ growth: +e.target.value || 0 })} /></label>}
        <label style={{ ...lab, letterSpacing: 0, textTransform: "none", fontSize: 12.5, color: INK, fontWeight: 600 }}>
          <span style={{ display: "flex", justifyContent: "space-between" }}>New specialist demand met in mainstream<b style={{ color: PURPLE }}>{p.shift ?? 0}%</b></span>
          <input type="range" min="0" max="100" step="5" value={p.shift ?? 0} onChange={(e) => onPatch({ shift: +e.target.value })} style={{ accentColor: PURPLE }} />
        </label>
      </>)}
    </aside>
  );
}

/* the assumptions: every mechanism that is not read from the data, movable */
function Assumptions({ value, onChange }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>What the round assumes where the data cannot say. Move any of them and every dial recomputes; the defaults are reasonable, not authoritative.</p>
      {ASSUMPTIONS.map((a) => (
        <label key={a.k} style={{ ...lab, letterSpacing: 0, textTransform: "none", fontSize: 12.5, color: INK, fontWeight: 600 }}>
          <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>{a.label}<b style={{ color: PURPLE, whiteSpace: "nowrap" }}>{a.unit === "£" ? "£" + value[a.k].toLocaleString("en-GB") : a.unit === "%" ? value[a.k] + "%" : `${value[a.k]} ${a.unit}`}</b></span>
          <input type="range" min={a.min} max={a.max} step={a.step} value={value[a.k]} onChange={(e) => onChange({ ...value, [a.k]: +e.target.value })} style={{ accentColor: PURPLE }} />
          <span style={{ fontSize: 11, color: MUTED, fontWeight: 400 }}>{a.note}</span>
        </label>
      ))}
      <button onClick={() => onChange(defaultAssumptions())} style={{ ...barBtn(false), justifySelf: "start", padding: "6px 14px", fontSize: 12 }}>Back to the defaults</button>
    </div>
  );
}

const HZ_CSS = `
.hz-strip button{font-family:inherit}
.hz-out .pz-block{margin-top:0}.hz-out .pz-block+.pz-block{margin-top:38px}
.hz-out svg[style*="max-width"]{max-width:none!important}
.hz-out .pz-note{font-size:12.5px}
.pz-how{margin:2px 0 14px}.pz-how summary{cursor:pointer;font-size:12px;color:var(--purple);font-weight:600;list-style:none}.pz-how summary::-webkit-details-marker{display:none}.pz-how summary::before{content:"▸  ";font-size:10px}.pz-how[open] summary::before{content:"▾  "}.pz-how p{font-size:12.5px;color:var(--muted);line-height:1.6;margin:6px 0 0;max-width:820px}
.hz-out table.pz-table{border-collapse:separate;border-spacing:0;width:100%;font-size:12.5px}
.hz-out table.pz-table thead th{position:sticky;top:0;background:var(--paper);cursor:pointer;user-select:none;padding:9px 10px;border-bottom:1.5px solid var(--hair);white-space:nowrap}
.hz-out table.pz-table thead th:hover{color:var(--purple)}
.hz-out table.pz-table thead th[data-dir="desc"]::after{content:" ▾";color:var(--purple)}.hz-out table.pz-table thead th[data-dir="asc"]::after{content:" ▴";color:var(--purple)}
.hz-out table.pz-table tbody tr:nth-child(even) td{background:rgba(106,12,160,.025)}
.hz-out table.pz-table tbody tr:hover td{background:rgba(198,160,53,.1)}
.hz-out table.pz-table td{padding:8px 10px;border-bottom:1px solid rgba(34,18,51,.06);vertical-align:top}
.hz-out table.pz-table td.num{font-variant-numeric:tabular-nums;text-align:right}
.hz-out table.pz-table td.nm{font-weight:600}
.hz-out details.pz-fold{border:1px solid var(--hair);border-radius:10px;padding:0 14px;margin-top:16px;background:var(--card)}
.hz-out details.pz-fold summary{padding:12px 0;font-weight:600;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
.hz-round .hz-dials{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-top:14px}
@media(max-width:980px){.hz-round .hz-dials{grid-template-columns:repeat(3,1fr)}}@media(max-width:560px){.hz-round .hz-dials{grid-template-columns:repeat(2,1fr)}}
.hz-dial{background:var(--card);border:1px solid var(--hair);border-radius:12px;padding:12px 12px;min-width:0;transition:transform .15s,box-shadow .15s}
.hz-dial.moved{border-color:rgba(198,160,53,.6);box-shadow:0 8px 24px rgba(34,18,51,.07)}
.hz-dial-h{display:flex;align-items:center;gap:7px;font:700 10.5px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.hz-dial-h svg{color:var(--purple);flex:none}
.hz-dial-n{font-family:Fraunces,serif;font-size:24px;line-height:1.1;color:var(--ink);margin-top:8px;white-space:nowrap}
.hz-dial-d{font-size:12.5px;font-weight:700;margin-top:4px}.hz-dial-d small{font-weight:500;color:var(--muted)}
.hz-dial-note{font-size:11px;color:var(--muted);line-height:1.45;margin-top:6px}
`;
