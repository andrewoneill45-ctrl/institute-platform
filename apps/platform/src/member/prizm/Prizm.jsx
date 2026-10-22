import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDataset } from "../../lib/dataset.js";
import { ensureMotionCss, Loading } from "../../lib/motion.jsx";
import { useAuth } from "../../lib/auth.jsx";
import { BLOCK_TYPES, FAITHS, TYPES, searchEntities, computeReport, computeSchoolDash, scopeLabel, scopeShort, attachOfsted, verifyCommentary } from "./engine.js";
import { renderBlock, coverHtml, reportHtml, forewordHtml, schoolDashHtml, attachTipCard, PZ_CSS } from "./render.js";
import { listReports, saveReport, deleteReport } from "./reports.js";

/* Prizm — the report studio. One command bar over a living document: say what
   you need, take the scope apart token by token, and edit the report in the
   report. Every figure is computed on the device from the national dataset. */

const INK = "#221233", MUTED = "#6F6580", PAPER = "#FBFAF7", PURPLE = "#6A0CA0", GOLD = "#C6A035", HAIR = "rgba(34,18,51,.14)";
const DEFAULT_BLOCKS = ["headlines", "cohort", "movement", "gap", "scatter"];

/* what the same blocks mean when the scope is the primary estate */
const KS2_DESCS = {
  headlines: "the scope in four numbers, against England (KS2)",
  cohort: "every school ranked by RWM expected standard",
  movement: "KS2 2024/25 against 2023/24, school by school",
  gap: "disadvantaged and other pupils at the expected standard",
  attendance: "overall and persistent absence against primary England",
  behaviour: "suspension rates and permanent exclusions (primary)",
  workforce: "teacher turnover, ratios and unfilled posts in primaries",
  finance: "spend per pupil, reserves and deficits in primaries",
  destinations: "secondary only — KS4 leavers' destinations",
  scatter: "FSM against RWM, the scope against England's primaries",
  distribution: "the national RWM distribution, scope schools marked",
  ofsted: "current Ofsted judgements across the scope",
  league: "authorities or trusts ranked by what their primaries achieve",
};

/* worked briefs for the opening screen: each resolves instantly, no reader */
const EXAMPLES = [
  { t: "Catholic secondaries in the north east, set against London", sub: "a comparison, side by side", sc: { type: "region", name: "North East", faith: "catholic", versus: { type: "region", name: "London" } } },
  { t: "Which authorities have the widest disadvantage gaps?", sub: "the league, ranked with England's line through it", sc: { type: "england" }, blocks: ["headlines", "league", "gap"] },
  { t: "Schools where one leaver in ten doesn't sustain a destination", sub: "the NEET risk register", sc: { type: "england", minNotsust: 10 }, blocks: ["headlines", "cohort", "destinations", "scatter"] },
  { t: "The primary picture in the north west", sub: "KS2 2024/25, the latest published", sc: { type: "region", name: "North West", phase: "primary" } },
  { t: "London schools with no permanent exclusions", sub: "behaviour, composed in one breath", sc: { type: "region", name: "London", maxPex: 0 }, blocks: ["headlines", "cohort", "behaviour"] },
  { t: "Secondary schools in deficit — does money buy outcomes?", sub: "the 2024-25 accounts, spend set against attainment", sc: { type: "england", deficit: true }, blocks: ["headlines", "finance", "cohort"] },
];

/* the scope, taken apart: every piece removable on its own */
const TOKEN_DEFS = [
  ["phase", () => "primary"],
  ["faith", (sc) => (FAITHS[sc.faith] ? FAITHS[sc.faith].label : sc.faith)],
  ["gender", (sc) => (sc.gender === "Girls" ? "girls'" : "boys'")],
  ["ofsted", (sc) => sc.ofsted],
  ["schoolType", (sc) => (TYPES[sc.schoolType] ? TYPES[sc.schoolType].label : sc.schoolType)],
  ["sixthForm", (sc) => (sc.sixthForm ? "with sixth forms" : "11-16")],
  ["minPupils", (sc) => `${sc.minPupils}+ pupils`], ["maxPupils", (sc) => `under ${sc.maxPupils} pupils`],
  ["minFsm", (sc) => `FSM ${sc.minFsm}%+`], ["maxFsm", (sc) => `FSM under ${sc.maxFsm}%`],
  ["minA8", (sc) => `A8 ${sc.minA8}+`], ["maxA8", (sc) => `A8 under ${sc.maxA8}`],
  ["minDrift", () => "improving"], ["maxDrift", () => "declining"],
  ["minAbs", (sc) => `absence ${sc.minAbs}%+`], ["maxAbs", (sc) => `absence under ${sc.maxAbs}%`],
  ["minPA", (sc) => `persistent absence ${sc.minPA}%+`], ["maxPA", (sc) => `PA under ${sc.maxPA}%`],
  ["minSusp", (sc) => `suspensions ${sc.minSusp}+`], ["maxSusp", (sc) => `suspensions under ${sc.maxSusp}`],
  ["maxPex", (sc) => (sc.maxPex === 0 ? "no permanent exclusions" : `PEX under ${sc.maxPex}`)],
  ["minDest", (sc) => `destinations ${sc.minDest}%+`], ["maxDest", (sc) => `destinations under ${sc.maxDest}%`],
  ["minNotsust", (sc) => `not sustained ${sc.minNotsust}%+`],
  ["minRwm", (sc) => `RWM ${sc.minRwm}%+`], ["maxRwm", (sc) => `RWM under ${sc.maxRwm}%`],
  ["minRead", (sc) => `reading ${sc.minRead}+`], ["maxRead", (sc) => `reading under ${sc.maxRead}`],
  ["minTurnover", (sc) => `turnover ${sc.minTurnover}%+`], ["maxTurnover", (sc) => `turnover under ${sc.maxTurnover}%`],
  ["minPtr", (sc) => `PTR ${sc.minPtr}+`], ["maxPtr", (sc) => `PTR under ${sc.maxPtr}`],
  ["minVac", () => "with unfilled posts"], ["maxVac", () => "no unfilled posts"],
  ["minSpend", (sc) => `spend £${sc.minSpend.toLocaleString("en-GB")}+`], ["maxSpend", (sc) => `spend under £${sc.maxSpend.toLocaleString("en-GB")}`],
  ["deficit", () => "in deficit"],
  ["noGrammar", () => "grammars set aside"],
  ["order", (sc) => `top ${sc.order.limit || ""} by ${{ a8: "A8", rwm: "RWM", reading: "reading", improvement: "improvement", pupils: "size", fsm: "FSM", spend: "spend" }[sc.order.by] || sc.order.by}`],
  ["versus", (sc) => `vs ${scopeShort(sc.versus)}`],
];
function scopeTokens(sc) {
  if (!sc) return [];
  const t = [];
  const base = sc.type === "england" ? "England" : sc.type === "catholicLa" ? "Catholic authorities" : sc.type === "urns" ? `${(sc.urns || []).length} chosen school${(sc.urns || []).length === 1 ? "" : "s"}` : sc.name;
  t.push({ k: "base", label: base, fixed: sc.type === "england" });
  for (const [k, f] of TOKEN_DEFS) if (sc[k] != null && sc[k] !== false) t.push({ k, label: f(sc) });
  return t;
}
function removeScopeToken(sc, k) {
  const next = { ...sc };
  if (k === "base") { return { ...next, type: "england", name: undefined, urns: undefined, las: undefined }; }
  if (k === "phase") { delete next.phase; delete next.minRwm; delete next.maxRwm; delete next.minRead; delete next.maxRead; }
  else if (k === "noGrammar") { delete next.noGrammar; if (next.versus) next.versus = { ...next.versus, noGrammar: undefined }; }
  else delete next[k];
  return next;
}
/* switching phase drops the other phase's measures */
function withPhase(sc, phase) {
  const next = { ...sc, phase };
  for (const k of phase === "primary" ? ["minA8", "maxA8", "minDest", "maxDest", "minNotsust", "sixthForm"] : ["minRwm", "maxRwm", "minRead", "maxRead"]) delete next[k];
  if (phase !== "primary") delete next.phase;
  return next;
}

const barBtn = (solid) => ({
  border: solid ? "none" : `1px solid ${HAIR}`, background: solid ? PURPLE : "#fff", color: solid ? "#fff" : INK,
  borderRadius: 999, padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
});

export default function Prizm() {
  const { user } = useAuth() || {};
  const urn = user && user.urn ? Number(user.urn) : null;
  const navigate = useNavigate();
  const [all, setAll] = useState(null);
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState(null);
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [msgs, setMsgs] = useState([]);
  const [note, setNote] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [stage, setStage] = useState("");
  const [foreword, setForeword] = useState(null);
  const [fwBusy, setFwBusy] = useState(false);
  const [saved, setSaved] = useState([]);
  const [keeping, setKeeping] = useState(false);
  const [dashUrn, setDashUrn] = useState(null);
  const boxRef = useRef(null);

  useEffect(ensureMotionCss, []);
  useEffect(() => { getDataset().then(({ raw, ofsted }) => setAll(attachOfsted(raw, ofsted))); }, []);
  useEffect(() => attachTipCard(document, (u) => { setDashUrn(u); window.scrollTo({ top: 0, behavior: "smooth" }); }), []);
  useEffect(() => { listReports(urn).then(setSaved).catch(() => {}); }, [urn]);
  useEffect(() => { setForeword(null); }, [scope, blocks]);
  useEffect(() => {
    try { const want = new URLSearchParams(window.location.search).get("school"); if (want) setDashUrn(want); } catch { /* no params */ }
  }, []);
  /* "/" summons the box from anywhere */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
      e.preventDefault(); boxRef.current && boxRef.current.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hits = useMemo(() => (all && q.trim().length >= 2 ? searchEntities(all, q) : null), [all, q]);
  const chips = useMemo(() => {
    if (!hits) return [];
    const c = [];
    (hits.composed || []).forEach((x, i) => c.push({ k: "x" + i, group: x.sc.versus ? "Comparison" : "Composed", label: x.label.replace(/ · \d+ schools?$/, ""), tag: `${x.n} school${x.n === 1 ? "" : "s"}`, sc: x.sc }));
    (hits.regions || []).forEach((r) => c.push({ k: "r" + r.name, group: "Regions", label: r.name, tag: `${r.n} schools`, sc: { type: "region", name: r.name } }));
    hits.las.forEach((l) => c.push({ k: "l" + l.name, group: "Authorities", label: l.name, tag: `${l.n} schools`, sc: { type: "la", name: l.name } }));
    hits.trusts.forEach((t) => c.push({ k: "t" + t.name, group: "Trusts", label: t.name, tag: `${t.n} schools`, sc: { type: "trust", name: t.name } }));
    (hits.towns || []).forEach((t) => c.push({ k: "w" + t.name, group: "Towns", label: t.name, tag: `${t.n} schools`, sc: { type: "town", name: t.name } }));
    hits.schools.forEach((s) => c.push({ k: "s" + s.urn, group: "Schools", label: s.name, tag: s.la, sc: scope && scope.type === "urns" ? { type: "urns", urns: [...new Set([...scope.urns, String(s.urn)])] } : { type: "urns", urns: [String(s.urn)] } }));
    return c.slice(0, 8);
  }, [hits, scope]);
  useEffect(() => { setSel(0); }, [q]);

  const spec = useMemo(() => {
    const one = scope && scope.type === "urns" && Array.isArray(scope.urns) && scope.urns.length === 1 && all
      ? all.find((s) => String(s.urn) === String(scope.urns[0])) : null;
    return {
      title: title || (one ? `${one.name}: the full picture` : scope ? scopeLabel(scope).replace(/ · /g, ", ") + ": the picture" : "A Prizm report"),
      scope, blocks: blocks.map((type) => ({ type })),
    };
  }, [title, scope, blocks, all]);
  const computed = useMemo(() => (all && scope ? computeReport(all, spec) : null), [all, spec, scope]);
  const dash = useMemo(() => (all && dashUrn ? computeSchoolDash(all, dashUrn) : null), [all, dashUrn]);
  /* one school is not a cohort: a single-school scope pivots to the full picture */
  const singleDash = useMemo(() => (all && computed && computed.schools.length === 1 ? computeSchoolDash(all, computed.schools[0].urn) : null), [all, computed]);
  const tokens = useMemo(() => scopeTokens(scope), [scope]);
  const isPrimary = scope && scope.phase === "primary";

  /* ── intents ── */
  function applyImplied(sc, text) {
    const want = [];
    if (sc.minAbs != null || sc.maxAbs != null || sc.minPA != null || sc.maxPA != null) want.push("attendance");
    if (sc.minSusp != null || sc.maxSusp != null || sc.maxPex != null) want.push("behaviour");
    if (sc.minDest != null || sc.maxDest != null || sc.minNotsust != null) want.push("destinations");
    if (sc.minTurnover != null || sc.maxTurnover != null || sc.minPtr != null || sc.maxPtr != null || sc.minVac != null || sc.maxVac != null) want.push("workforce");
    if (sc.minSpend != null || sc.maxSpend != null || sc.deficit || (sc.order && sc.order.by === "spend") || /\b(spend|budget|deficit|reserves?|finance|money)\b/i.test(text || "")) want.push("finance");
    if (/\b(league|by (local )?authorit|by trust|which (la|authorit|trust))/i.test(text || "")) want.push("league");
    if (want.length) setBlocks((b) => [...b, ...want.filter((w) => !b.includes(w))]);
  }
  function pick(c) { setScope(c.sc); applyImplied(c.sc, q); setQ(""); }
  function openExample(ex) { setTitle(""); setBlocks(ex.blocks || DEFAULT_BLOCKS); setScope(ex.sc); }
  function addBlock(t) { setBlocks((b) => (b.includes(t) ? b : [...b, t])); }
  function removeBlock(t) { setBlocks((b) => b.filter((x) => x !== t)); }
  function moveBlock(t, dir) {
    setBlocks((b) => { const i = b.indexOf(t); const j = i + dir; if (i < 0 || j < 0 || j >= b.length) return b; const n = [...b]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  }

  async function send(given) {
    const text = (given ?? q).trim();
    if (!text || thinking) return;
    setQ(""); setThinking(true); setNote(null);
    const stages = ["Reading the brief…", "Shaping the scope…", "Computing every figure…"];
    let si = 0; setStage(stages[0]);
    const tick = setInterval(() => { si = Math.min(si + 1, stages.length - 1); setStage(stages[si]); }, 1300);
    const history = [...msgs, { role: "user", content: text }];
    setMsgs(history);
    try {
      const context = JSON.stringify({ currentSpec: { title: spec.title, scope, blocks }, candidates: all ? searchEntities(all, text) : null });
      const r = await fetch("/.netlify/functions/prizm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: text, history: msgs, context }),
      });
      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error || "no answer");
      if (data.spec) {
        if (data.spec.scope) { setScope(data.spec.scope); applyImplied(data.spec.scope, text); }
        if (data.spec.title) setTitle(data.spec.title);
        if (Array.isArray(data.spec.blocks) && data.spec.blocks.length) setBlocks(data.spec.blocks.map((b) => b.type).filter((t) => BLOCK_TYPES.some((k) => k.type === t)));
      }
      setMsgs((m) => [...m, { role: "assistant", content: data.reply || "Done." }]);
      setNote(data.reply || null);
    } catch {
      setNote("The reader is out of reach just now, but everything works by hand: type a place, a trust or a school and choose it.");
    }
    clearInterval(tick); setStage(""); setThinking(false);
  }

  function buildFindings() {
    if (!computed) return null;
    if (singleDash) {
      const { s, standing, similar: sim, pri } = singleDash;
      const n = (v) => (typeof v === "number" && Number.isFinite(v) ? v : (v != null && Number.isFinite(parseFloat(v)) ? parseFloat(v) : undefined));
      return {
        title: spec.title, school: s.name, la: s.la, region: s.region, phase: computed.phase,
        measures: pri
          ? { rwmExpected: n(s.ks2_rwm_exp), rwmPrev: n(s.ks2_rwm_prev), higherStandard: n(s.ks2_rwm_high), readingScore: n(s.ks2_read_avg), rwmDisadvantaged: n(s.ks2_rwm_disadv), fsmPct: n(s.edu_fsm_pct), absence: n(s.abs_overall_pct), persistentAbsence: n(s.abs_persistent_pct), suspensionsPer100: n(s.susp_rate), teacherTurnoverPct: n(s.wf_turnover_pct), spendPerPupil: n(s.fin_spend_pp), reservePerPupil: n(s.fin_reserve_pp) }
          : { attainment8: n(s.attainment8), a8Prev: n(s.a8_prev), basics95: n(s.basics_95), basics94: n(s.basics_94), a8Disadvantaged: n(s.a8_disadv), fsmPct: n(s.edu_fsm_pct), absence: n(s.abs_overall_pct), persistentAbsence: n(s.abs_persistent_pct), suspensionsPer100: n(s.susp_rate), sustainedDestinations: n(s.dest_sustained), teacherTurnoverPct: n(s.wf_turnover_pct), spendPerPupil: n(s.fin_spend_pp), reservePerPupil: n(s.fin_reserve_pp) },
        nationalStandingPercentBeaten: standing,
        similarIntake: sim ? { schools: sim.n, rank: sim.rank, topPercent: sim.topPct, cohortMedian: sim.med, fsmPct: sim.fsm } : undefined,
        england: (({ pri: _p, ...e }) => e)(computed.bench),
      };
    }
    const slim = (v, depth = 0) => {
      if (Array.isArray(v)) { if (!v.length || depth > 3) return undefined; const take = v.length > 6 ? [...v.slice(0, 3), ...v.slice(-3)] : v; return take.map((x) => slim(x, depth + 1)).filter((x) => x !== undefined); }
      if (v && typeof v === "object") { const o = {}; for (const [k, val] of Object.entries(v)) { if (["cloud", "bins", "marks", "bench"].includes(k)) continue; const s = slim(val, depth + 1); if (s !== undefined) o[k] = s; } return o; }
      return typeof v === "number" || typeof v === "string" || typeof v === "boolean" ? v : undefined;
    };
    const { pri, ...england } = computed.bench;
    return {
      title: spec.title, scope: scopeLabel(scope, computed.schools.length), labels: computed.labels, phase: computed.phase,
      schools: computed.schools.length, vsSchools: computed.vsSchools ? computed.vsSchools.length : undefined,
      england, blocks: computed.blocks.map((b) => ({ type: b.type, ...slim(b.data), versus: b.vs ? slim(b.vs) : undefined })),
    };
  }
  async function askForeword() {
    if (!computed || fwBusy) return;
    setFwBusy(true);
    const findings = buildFindings();
    try {
      const r = await fetch("/.netlify/functions/prizm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ foreword: true, findings }) });
      const data = await r.json();
      if (!r.ok || data.error || !data.foreword) throw new Error(data.error || "no foreword");
      const safe = verifyCommentary(data.foreword, findings);
      if (safe) setForeword(safe);
      else setNote("The reader's draft quoted a figure outside the computed findings, so it was set aside. Ask again.");
    } catch { setNote("The reader is out of reach just now; the report stands on its own."); }
    setFwBusy(false);
  }
  async function keep() {
    if (!computed || keeping) return;
    setKeeping(true);
    try {
      const r = await saveReport(urn, spec.title, { title: spec.title, scope, blocks: blocks.map((type) => ({ type })) });
      setSaved((s) => [r, ...s.filter((x) => x.id !== r.id)]);
      setNote(`Kept in the vault as "${spec.title}". It recomputes on the day it's opened.`);
    } catch { setNote("The vault didn't answer; the report wasn't kept. Try again in a moment."); }
    setKeeping(false);
  }
  function openSaved(r) {
    const s = r.spec || {};
    if (s.title) setTitle(s.title);
    if (Array.isArray(s.blocks) && s.blocks.length) setBlocks(s.blocks.map((b) => b.type).filter((t) => BLOCK_TYPES.some((k) => k.type === t)));
    if (s.scope) setScope(s.scope);
  }
  function download() {
    if (!computed) return;
    const blob = new Blob([reportHtml(spec, computed, foreword, singleDash ? schoolDashHtml(singleDash) : undefined)], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (spec.title || "prizm-report").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) + ".html";
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* the next question, always ready: three one-tap steps it hasn't taken yet */
  const nextSteps = useMemo(() => {
    if (!scope || !computed) return [];
    const out = [];
    if (singleDash) {
      const s = singleDash.s;
      if (s.la) out.push({ t: `All of ${s.la}`, f: () => setScope({ type: "la", name: s.la, phase: scope.phase }) });
      if (s.trust && s.trust !== "Not supported by a trust") out.push({ t: "Its trust, school by school", f: () => setScope({ type: "trust", name: s.trust, phase: scope.phase }) });
      if (!foreword && !fwBusy) out.push({ t: "Write the foreword", f: askForeword });
      out.push({ t: "Open on the Atlas map", f: () => navigate(`/members/atlas?urn=${s.urn}`) });
      return out.slice(0, 3);
    }
    if (!scope.versus && scope.type !== "england") out.push({ t: "Set it against England", f: () => setScope({ ...scope, versus: { type: "england" } }) });
    if (scope.versus) out.push({ t: "Drop the comparison", f: () => setScope(removeScopeToken(scope, "versus")) });
    if (!blocks.includes("league") && computed.schools.length > 20) out.push({ t: "Rank the authorities", f: () => addBlock("league") });
    if (!isPrimary) out.push({ t: "The primary phase", f: () => setScope(withPhase(scope, "primary")) });
    else out.push({ t: "The secondary phase", f: () => setScope(withPhase(scope, undefined)) });
    if (!foreword && !fwBusy) out.push({ t: "Write the foreword", f: askForeword });
    if (!blocks.includes("finance")) out.push({ t: "Follow the money", f: () => addBlock("finance") });
    if (!blocks.includes("attendance")) out.push({ t: "Add attendance", f: () => addBlock("attendance") });
    if (!blocks.includes("destinations") && !isPrimary) out.push({ t: "Add destinations", f: () => addBlock("destinations") });
    return out.slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, blocks, computed, foreword, fwBusy, isPrimary]);

  if (!all) return <Loading title="Prizm" label="the national dataset is arriving…" />;

  const chipPanel = chips.length > 0 && (
    <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 40, background: "#fff", border: `1px solid ${HAIR}`, borderRadius: 12, boxShadow: "0 18px 50px rgba(34,18,51,.14)", overflow: "hidden" }}>
      {chips.map((c, i) => (
        <button key={c.k} onClick={() => pick(c)} onMouseEnter={() => setSel(i)}
          style={{ display: "flex", alignItems: "baseline", gap: 10, width: "100%", textAlign: "left", border: "none", borderTop: i ? `1px solid rgba(34,18,51,.06)` : "none", background: i === sel ? "rgba(106,12,160,.07)" : "#fff", padding: "9px 14px", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: GOLD, fontWeight: 700, width: 86, flex: "none" }}>{c.group}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: INK, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</span>
          <span style={{ fontSize: 11, color: MUTED, flex: "none" }}>{c.tag}</span>
        </button>
      ))}
    </div>
  );

  const onBoxKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, chips.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { if (chips.length) pick(chips[Math.min(sel, chips.length - 1)]); else if (q.trim().length >= 8) send(); }
    else if (e.key === "Escape") { setQ(""); }
  };

  /* ── the opening: one box, worked briefs, the vault ── */
  if (!scope && !dash) {
    return (
      <div style={{ background: "#F2EFEA", minHeight: "100%", padding: "9vh 22px 60px" }}>
        <style>{PZ_CSS}</style>
        <div className="asi-rise" style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: ".22em", fontWeight: 700, color: "#8a6d1c" }}>PRIZM · THE REPORT STUDIO</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 500, fontSize: "clamp(30px,4.2vw,44px)", letterSpacing: "-.015em", margin: "10px 0 26px", color: INK }}>Say what you need to understand.</h1>
          <div style={{ position: "relative", textAlign: "left" }}>
            <input ref={boxRef} autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onBoxKey}
              placeholder="A place, a trust, a school, or a whole question…"
              style={{ width: "100%", boxSizing: "border-box", padding: "16px 18px", borderRadius: 14, border: `1.5px solid ${HAIR}`, fontSize: 16, background: "#fff", boxShadow: "0 10px 36px rgba(34,18,51,.08)" }} />
            {chipPanel}
          </div>
          <div style={{ fontSize: 11.5, color: MUTED, marginTop: 8 }}>Enter chooses the first suggestion · arrow keys to move · a full sentence goes to the reader</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 10, marginTop: 34, textAlign: "left" }}>
            {EXAMPLES.map((ex) => (
              <button key={ex.t} onClick={() => openExample(ex)} className="asi-lift"
                style={{ fontFamily: "inherit", textAlign: "left", background: "#fff", border: `1px solid ${HAIR}`, borderRadius: 14, padding: "15px 18px", cursor: "pointer" }}>
                <span style={{ display: "block", fontFamily: "Fraunces, serif", fontSize: 16.5, fontWeight: 500, color: INK, lineHeight: 1.3 }}>{ex.t}</span>
                <span style={{ display: "block", fontSize: 11.5, color: MUTED, marginTop: 5 }}>{ex.sub}</span>
              </button>
            ))}
          </div>

          {saved.length > 0 && (
            <div style={{ marginTop: 38, textAlign: "left" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".14em", fontWeight: 700, color: MUTED, marginBottom: 10 }}>THE VAULT&apos;S REPORTS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
                {saved.slice(0, 6).map((r) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "flex-start", background: "#fff", border: `1px solid ${HAIR}`, borderRadius: 12, overflow: "hidden" }}>
                    <button onClick={() => openSaved(r)} style={{ flex: 1, minWidth: 0, fontFamily: "inherit", textAlign: "left", border: "none", background: "transparent", padding: "12px 4px 12px 15px", cursor: "pointer" }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: INK, lineHeight: 1.3 }}>{r.title}</span>
                      <span style={{ display: "block", fontSize: 10.5, color: MUTED, marginTop: 4 }}>{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · recomputes on today&apos;s data</span>
                    </button>
                    <button onClick={() => { deleteReport(urn, r.id).then(() => setSaved((s) => s.filter((x) => x.id !== r.id))).catch(() => {}); }} title="Remove"
                      style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: 15, padding: "10px 10px 0 2px" }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── the studio: one bar over a living document ── */
  return (
    <div style={{ background: "#F2EFEA", minHeight: "100%", paddingBottom: 60 }}>
      <style>{PZ_CSS}</style>

      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(242,239,234,.92)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${HAIR}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 22px" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 300px", minWidth: 240 }}>
              <input ref={boxRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onBoxKey}
                placeholder={thinking ? stage || "Thinking…" : "Refine it, or ask for something new…  ( / )"}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: `1px solid ${HAIR}`, fontSize: 13.5, background: "#fff" }} />
              {chipPanel}
            </div>
            <button onClick={() => send()} disabled={thinking || q.trim().length < 2} style={{ ...barBtn(true), background: INK, opacity: thinking ? 0.55 : 1 }}>{thinking ? "Reading…" : "Ask"}</button>
            {computed && !dash && (
              <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
                <button onClick={askForeword} disabled={fwBusy} style={{ ...barBtn(false), color: "#4B0875", borderColor: "rgba(106,12,160,.3)", opacity: fwBusy ? 0.6 : 1 }}>{fwBusy ? "Writing…" : foreword ? "Rewrite foreword" : "Foreword"}</button>
                <button onClick={keep} disabled={keeping} style={barBtn(false)}>{keeping ? "Keeping…" : "Keep in the vault"}</button>
                <button onClick={download} style={barBtn(true)}>Download</button>
              </div>
            )}
          </div>

          {!dash && tokens.length > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
              {tokens.map((t) => (
                <span key={t.k} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: t.k === "base" ? "rgba(106,12,160,.09)" : "#fff", border: `1px solid ${t.k === "base" ? "rgba(106,12,160,.28)" : HAIR}`, borderRadius: 999, padding: "4px 6px 4px 12px", fontSize: 12, fontWeight: 600, color: INK }}>
                  {t.label}
                  {!t.fixed && (
                    <button onClick={() => setScope(removeScopeToken(scope, t.k))} title="Remove"
                      style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 5px" }}>×</button>
                  )}
                </span>
              ))}
              <span style={{ fontSize: 12, color: MUTED, fontWeight: 600, padding: "0 4px" }}>{computed ? `${computed.schools.length} school${computed.schools.length === 1 ? "" : "s"}` : ""}</span>
              <button onClick={() => { setScope(null); setTitle(""); setForeword(null); setNote(null); }} style={{ border: "none", background: "transparent", color: "#B3261E", cursor: "pointer", fontSize: 11.5, textDecoration: "underline", padding: 0, fontFamily: "inherit" }}>start again</button>
            </div>
          )}

          {(note || thinking) && !dash && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 8, background: "rgba(106,12,160,.06)", border: "1px solid rgba(106,12,160,.16)", borderRadius: 10, padding: "8px 12px" }}>
              <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: "#4B0875" }}>{thinking ? stage : note}</span>
              {!thinking && <button onClick={() => setNote(null)} style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: 14, padding: 0 }}>×</button>}
            </div>
          )}

          {!dash && nextSteps.length > 0 && !thinking && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
              <span style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: GOLD }}>NEXT</span>
              {nextSteps.map((sx) => (
                <button key={sx.t} onClick={sx.f} style={{ border: `1px solid rgba(198,160,53,.45)`, background: "#fff", color: INK, borderRadius: 999, padding: "4px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{sx.t}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 22px 0" }}>
        {dash ? (
          <div className="asi-rise">
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <button onClick={() => setDashUrn(null)} style={{ ...barBtn(true), background: INK }}>← Back to the report</button>
              <button onClick={() => navigate(`/members/atlas?urn=${dash.s.urn}`)} style={barBtn(false)}>Open on the Atlas map</button>
            </div>
            <div className="pz-report" style={{ borderRadius: 4 }} dangerouslySetInnerHTML={{ __html: schoolDashHtml(dash) }} />
          </div>
        ) : computed ? (
          <div className="asi-rise pz-report" style={{ borderRadius: 4 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={spec.title} aria-label="Report title"
              style={{ width: "100%", boxSizing: "border-box", border: "none", background: "transparent", fontFamily: "inherit", fontSize: 11.5, color: MUTED, padding: "0 0 10px", outline: "none", borderBottom: `1px dashed ${HAIR}`, marginBottom: 14 }} />
            {singleDash ? (
              <div dangerouslySetInnerHTML={{ __html: forewordHtml(foreword) + schoolDashHtml(singleDash) }} />
            ) : (<>
            <div dangerouslySetInnerHTML={{ __html: coverHtml(spec, computed) + forewordHtml(foreword) }} />
            {(() => {
              let togglePlaced = false;
              const grammarsIn = !isPrimary && !scope.noGrammar ? computed.schools.filter((s) => /grammar/i.test(s.name || "")).length : 0;
              const showToggle = !isPrimary && (scope.noGrammar || grammarsIn > 0);
              return computed.blocks.map((b) => {
                const ranked = ["cohort", "movement", "gap", "distribution", "league", "workforce", "finance"].includes(b.type);
                const withToggle = showToggle && ranked && !togglePlaced && (togglePlaced = true);
                return (
                  <div key={b.type} className="pz-blockwrap">
                    <div className="pz-blockctl">
                      <button onClick={() => moveBlock(b.type, -1)} title="Move up">↑</button>
                      <button onClick={() => moveBlock(b.type, 1)} title="Move down">↓</button>
                      <button onClick={() => removeBlock(b.type)} title="Remove this section">×</button>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: renderBlock(b, computed) }} />
                    {withToggle && (
                      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 12, color: MUTED, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                        <input type="checkbox" checked={!!scope.noGrammar} style={{ accentColor: PURPLE }}
                          onChange={(e) => {
                            const on = e.target.checked;
                            const next = { ...scope, noGrammar: on || undefined };
                            if (next.versus) next.versus = { ...next.versus, noGrammar: on || undefined };
                            setScope(next);
                          }} />
                        {scope.noGrammar ? "Grammar schools set aside; untick to return them." : `Set grammar schools aside (${grammarsIn} in scope).`}
                      </label>
                    )}
                  </div>
                );
              });
            })()}
            {BLOCK_TYPES.some((b) => !blocks.includes(b.type) && !(isPrimary && b.type === "destinations")) && (
              <div style={{ marginTop: 44, borderTop: `1px solid ${HAIR}`, paddingTop: 16 }}>
                <div style={{ fontSize: 10.5, letterSpacing: ".14em", fontWeight: 700, color: GOLD, marginBottom: 10 }}>ADD A SECTION</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {BLOCK_TYPES.filter((b) => !blocks.includes(b.type) && !(isPrimary && b.type === "destinations")).map((b) => (
                    <button key={b.type} onClick={() => addBlock(b.type)} title={isPrimary ? (KS2_DESCS[b.type] || b.desc) : b.desc}
                      style={{ fontFamily: "inherit", border: `1px solid ${HAIR}`, background: "#fff", color: INK, borderRadius: 999, padding: "7px 15px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      + {b.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            </>)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
