/* Constellation — every child in view. School View zooms from the whole school
   to the single pupil; Uploads is the intake with its ledger and review queue;
   Insights is the signal board. All of it on this device only. */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../lib/auth.jsx";
import { loadState, saveState, blankState, computeAll, findSignals, rowsToCsv, removeUpload, BANDS, inspect, reinspect, commitSlip, KIND_LABELS, KIND_CHOICES, FIELD_LABELS, yearStats } from "./model.js";
import { SKY_W, SKY_H, CX, CY, R_ON, R_WATCH, R_RIM, layoutShoal, layoutMandala, layoutGradeMandala, gradesOf, coilPoint, easeInOut, pullOf } from "./sky.js";
import { ensureMotionCss } from "../../lib/motion.jsx";

const INK = "#221233", PURPLE = "#6A0CA0", DEEP = "#4B0875", GOLD = "#C6A035", MUTED = "#6F6580", LILAC = "#F4EEFA";
const DIR = { improving: "#2F7A39", steady: GOLD, declining: "#B3261E" };
const shadow = "0 1px 2px rgba(34,18,51,.04), 0 16px 44px rgba(34,18,51,.09)";
const card = { background: "#fff", borderRadius: 20, boxShadow: shadow, padding: "22px 24px" };
const kick = { fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: PURPLE, fontWeight: 600 };

class Boundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) return (
      <div style={{ padding: "40px 28px", fontFamily: "Inter, sans-serif", color: "#221233" }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600 }}>Constellation hit an error</h2>
        <p style={{ fontSize: 13.5, color: "#6F6580" }}>Nothing is lost: your data is still on this device. Send this line to get it fixed:</p>
        <code style={{ fontSize: 12, background: "#F4EEFA", borderRadius: 8, padding: "8px 12px", display: "inline-block" }}>{String(this.state.err && this.state.err.message || this.state.err)}</code>
      </div>
    );
    return this.props.children;
  }
}

export default function ConstellationGuarded() { return <Boundary><Constellation /></Boundary>; }

function Constellation() {
  const { user } = useAuth();
  const sid = user?.urn || user?.school || "school";
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("view");
  const [year, setYear] = useState(null);
  const [pick, setPick] = useState(null);
  const [group, setGroup] = useState(null);
  const [lens, setLens] = useState(null); /* the grade lens: null, 4, 5 or 7 */
  useEffect(() => { setLens(null); }, [year]);

  useEffect(ensureMotionCss, []);
  const loadedFor = useRef(null);
  useEffect(() => {
    if (!user) return;
    loadedFor.current = null;
    loadState(sid).then((s) => { setState(s || blankState()); loadedFor.current = sid; });
  }, [sid, !!user]);
  useEffect(() => { if (state && loadedFor.current === sid) saveState(sid, state); }, [state, sid]);

  const computed = useMemo(() => (state ? computeAll(state) : {}), [state]);
  const pupils = Object.values(computed);
  const years = [...new Set(pupils.map((p) => p.year).filter(Boolean))].sort((a, b) => a - b);
  const signals = useMemo(() => findSignals(computed), [computed]);

  const [upYear, setUpYear] = useState(null);
  const [upNote, setUpNote] = useState("");
  const [slips, setSlips] = useState([]);
  async function onFiles(list) {
    const add = [];
    const errSlip = (fname, msg) => ({ id: "s" + Math.random().toString(36).slice(2, 9), fileName: fname, text: "", opts: {}, headers: [], autoMap: {}, autoKind: "unreadable", kind: "unreadable", fields: {}, fixes: {}, stats: { matched: 0, of: 0, held: 0, blank: 0, years: [] }, assumptions: [msg], remembered: null, replaces: false, fingerprint: null });
    for (const f of list) {
      if (/\.(xlsx|xls)$/i.test(f.name)) {
        await loadXLSX();
        try {
          const wb = window.XLSX.read(new Uint8Array(await f.arrayBuffer()), { type: "array" });
          for (const sn of wb.SheetNames) {
            const aoa = window.XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: "" });
            let hRow = 0;
            for (let i = 0; i < Math.min(5, aoa.length); i++) if (aoa[i].some((c) => /^upn$/i.test(String(c).trim()))) { hRow = i; break; }
            if (aoa.length > hRow + 1) add.push(inspect(state, f.name + (wb.SheetNames.length > 1 ? " \u00b7 " + sn : ""), rowsToCsv(aoa.slice(hRow)), { year: upYear, note: upNote }));
          }
        } catch (e) {
          add.push(errSlip(f.name, "could not open workbook: " + (e?.message || e)));
        }
      } else add.push(inspect(state, f.name, await f.text(), { year: upYear, note: upNote }));
    }
    setSlips((cur) => [...cur, ...add]);
    setUpNote("");
    setUpYear(null);
  }
  const fixSlip = (slip, fixes) => setSlips((cur) => cur.map((s) => (s.id === slip.id ? reinspect(state, s, fixes) : s)));
  const commitOne = (slip) => {
    const next = commitSlip(state, slip);
    setState(next);
    setSlips((cur) => cur.filter((s) => s.id !== slip.id).map((s) => (s.kind === "unreadable" ? s : reinspect(next, s, s.fixes))));
  };
  const discardOne = (slip) => setSlips((cur) => cur.filter((s) => s.id !== slip.id));
  const commitAll = () => {
    let st = state;
    const ordered = [...slips].filter((s) => s.kind !== "unreadable").sort((a, b) => (a.kind === "roll" ? 0 : 1) - (b.kind === "roll" ? 0 : 1));
    for (const sl of ordered) st = commitSlip(st, sl);
    setState(st);
    setSlips((cur) => cur.filter((s) => s.kind === "unreadable"));
  };
  const resolve = (item, upn) => {
    const s = { ...state, review: state.review.filter((r) => r !== item) };
    if (upn) {
      s.aliases = { ...s.aliases, [item.name.toLowerCase().replace(/[^a-z]/g, "")]: upn };
      s.evidence = [...s.evidence]; // re-ingest the held row via alias
      const fake = "x\n"; void fake;
      s.evidence.push({ upn, file: item.file, conf: "resolved", date: new Date().toLocaleDateString("en-GB"), t: item.kind === "attendance" ? "attendance" : item.kind === "assessment" ? "assessment" : item.kind, ...(item.kind === "enrichment" ? { what: item.file } : {}) });
    }
    setState(s);
  };

  if (!state) return null;
  const chosen = pick ? computed[pick] : null;

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#FBFAF7", color: INK, backgroundImage: "radial-gradient(760px 400px at 50% -70px, rgba(106,12,160,.07), transparent 70%)" }}>
      <div style={{ maxWidth: tab === "view" ? "none" : 1160, margin: "0 auto", padding: "26px 34px 70px" }}>
        <div className="asi-rise" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 30, letterSpacing: "-.015em", margin: 0 }}>Constellation</h1>
            <p style={{ color: MUTED, fontSize: 13.5, margin: "4px 0 0" }}>Every child in view · {state.roll.length ? `${state.roll.length} pupils on roll` : "awaiting the roll"} · held on this device only, nothing leaves the browser</p>
          </div>
          <div style={{ display: "flex", gap: 6, background: "#fff", borderRadius: 999, padding: 5, boxShadow: shadow }}>
            {[["view", "School View"], ["up", "Uploads"], ["ins", "Insights"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "8px 16px", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", background: tab === k ? `linear-gradient(135deg,${PURPLE},${DEEP})` : "transparent", color: tab === k ? "#fff" : DEEP }}>{l}</button>
            ))}
          </div>
        </div>

        {/* ═══ SCHOOL VIEW ═══ */}
        {tab === "view" && (state.roll.length ? (() => {
          const hasPP = state.roll.some((x) => x.ppg), hasFSM = state.roll.some((x) => x.fsm), hasEAL = state.roll.some((x) => x.eal), hasSEN = state.roll.some((x) => x.sen), hasG = state.roll.some((x) => x.gender);
          const inGroup = (q) => group == null || (group === "pp" ? q.ppg : group === "fsm" ? q.fsm : group === "eal" ? q.eal : group === "sen" ? q.sen : group === "m" ? q.gender === "M" : q.gender === "F");
          const scopePupils = pupils.filter((q) => (year == null || q.year === year) && inGroup(q));
          return (
          <>
            <div className="asi-rise" style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 10px", flexWrap: "wrap", "--asi-d": "140ms" }}>
              {year != null && (
                <button onClick={() => { setYear(null); setPick(null); }} style={{ ...chip(true, DEEP), display: "inline-flex", alignItems: "center", gap: 6 }}>&#8249; Back to the school</button>
              )}
              {[["pp", "Pupil Premium", hasPP], ["fsm", "FSM", hasFSM], ["sen", "SEN", hasSEN], ["eal", "EAL", hasEAL], ["m", "Boys", hasG], ["f", "Girls", hasG]].map(([k, l, show]) => show && (
                <button key={k} onClick={() => setGroup(group === k ? null : k)} style={chip(group === k, GOLD)}>{l}</button>
              ))}
              {year != null && (() => {
                const yst = yearStats(pupils.filter((q) => q.year === year && inGroup(q)));
                return yst.basicsN > 0 ? (
                  <>
                    <span style={{ fontSize: 11, color: MUTED, marginLeft: 10 }}>grade lens</span>
                    {[4, 5, 7].map((b) => <button key={b} onClick={() => setLens(lens === b ? null : b)} style={chip(lens === b, GOLD)}>{b}+ En&amp;Ma</button>)}
                  </>
                ) : null;
              })()}
              <span style={{ marginLeft: "auto", fontSize: 11.5, color: MUTED }}>
                {year == null
                  ? <>dot: steady · <b style={{ color: "#2F7A39" }}>improving</b> · <b style={{ color: "#B3261E" }}>declining</b> · click a year to coil it</>
                  : lens
                  ? <>the {lens}+ bar: <i style={swatch("#2F7A39")} />secure above · <i style={swatch("#C6A035")} />at it · <i style={swatch("#B3261E")} />below · dimmed, no En+Ma prediction yet</>
                  : <>pulled by: <i style={swatch("#6A0CA0")} />learning · <i style={swatch("#C6A035")} />engagement · <i style={swatch("#B3261E")} />both · <i style={swatch("#CBB8DF")} />on track</>}
              </span>
            </div>
            <Metrics pupils={scopePupils} label={(year == null ? "Whole school" : "Year " + year) + (group ? " · " + { pp: "Pupil Premium", fsm: "FSM", eal: "EAL", sen: "SEN", m: "boys", f: "girls" }[group] : "")} />
            <div className="asi-rise" style={{ position: "relative", "--asi-d": "320ms" }}>
              <Sky pupils={pupils} years={years} year={year} lens={lens} onOpenYear={(y) => { setYear(y); setPick(null); }} onBack={() => { setYear(null); setPick(null); }} inGroup={inGroup} pick={pick} onPick={setPick} />
              {chosen && <PupilCard key={chosen.upn} p={chosen} onClose={() => setPick(null)} />}
            </div>
            <p style={{ fontSize: 11.5, color: MUTED, margin: "0 auto", maxWidth: 680, textAlign: "center" }}>
              {year == null
                ? "Each strip is a year group, each dot a child placed by how they are doing. A healthy year leans left. Click a year and its strip coils into a circle; “stats ›” flips a strip over to the year’s own numbers, lined up so flipped years read as one table."
                : "The heart holds the year's on-track children, evenly spread; the rim carries every serious child's name and reason, and colour is what pulls each child. The grade lens re-reads the same circle against a bar in English and maths: secure above it at the heart, the margin ringed, below it named. Back, and the circle unrolls."}
            </p>
          </>
          );
        })() : <Empty onGo={() => setTab("up")} />)}

        {/* ═══ UPLOADS ═══ */}
        {tab === "up" && (
          <>
          {slips.length > 0 && (
            <div className="asi-rise" style={{ marginTop: 20, "--asi-d": "100ms" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={kick}>The reading slip &middot; nothing lands until you say so</div>
                  <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, margin: "4px 0 0" }}>{slips.length === 1 ? "One file waiting on your word" : `${slips.length} files waiting on your word`}</h3>
                </div>
                {slips.filter((s) => s.kind !== "unreadable").length > 1 && (
                  <button onClick={commitAll} style={{ border: "none", cursor: "pointer", background: "linear-gradient(135deg,#6A0CA0,#4B0875)", color: "#fff", borderRadius: 999, padding: "10px 20px", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit" }}>Read all {slips.filter((s) => s.kind !== "unreadable").length} in</button>
                )}
              </div>
              {slips.map((sl) => <Slip key={sl.id} slip={sl} years={years} onFix={(fx) => fixSlip(sl, fx)} onCommit={() => commitOne(sl)} onDiscard={() => discardOne(sl)} />)}
            </div>
          )}
          <div className="asi-rise" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 20, "--asi-d": "280ms" }}>
            <div style={{ ...card }}>
              <div style={kick}>Upload anything</div>
              <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, margin: "4px 0 8px" }}>In-play: the children in the building now</h3>
              <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 6px" }}><b>This intake is for live pupils only.</b> Finished cohorts, historic results and inspection evidence belong in Lens's Section 48 vault; nothing moves between the two unless you move it.</p>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>Start with your MIS roll export (UPN, name, year, and ideally DOB, reg group, prior attainment, PPG, SEN). Then assessments, attendance, behaviour, trip registers and intervention logs, year after year. Every file is read back to you first as a <b>reading slip</b> &mdash; what the reader believes it is, which column means what, how many rows will land &mdash; and nothing is written until you say so. Correct a slip once and this device remembers the shape for next time. CSV and Excel in this release; Word and scans follow.</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", margin: "12px 0 2px" }}>
                <span style={{ ...kick, marginRight: 4 }}>These files cover</span>
                <button onClick={() => setUpYear(null)} style={chip(upYear == null, DEEP)}>Whole school</button>
                {(years.length ? years : [7, 8, 9, 10, 11]).map((y) => (
                  <button key={y} onClick={() => setUpYear(upYear === y ? null : y)} style={chip(upYear === y, DEEP)}>Y{y}</button>
                ))}
              </div>
              <input value={upNote} onChange={(e) => setUpNote(e.target.value)} placeholder="Describe these files, so the analysis knows what it is reading: e.g. Y10 end of year grades, all subjects, Summer 2026" style={{ width: "100%", boxSizing: "border-box", border: "1px solid rgba(106,12,160,.22)", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, fontFamily: "inherit", margin: "8px 0 2px", background: "#fff" }} />
              <label style={{ display: "block", border: `1.5px dashed rgba(106,12,160,.35)`, borderRadius: 14, padding: "26px 18px", textAlign: "center", cursor: "pointer", margin: "8px 0 6px", background: LILAC, color: DEEP, fontWeight: 600, fontSize: 13.5 }}>
                Drop files or click to choose
                <input type="file" multiple accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={(e) => onFiles([...e.target.files])} />
              </label>
              <p style={{ fontSize: 11.5, color: MUTED }}><button onClick={() => { if (window.confirm("Clear everything Constellation holds on this device: roll, evidence, ledger? This cannot be undone. (What the reader has learned about your file shapes is kept - header names only, never pupil data.)")) { const d = state.dialects || {}; indexedDB.deleteDatabase("asi-constellation-" + sid); setState({ ...blankState(), dialects: d }); setSlips([]); } }} style={{ border: "none", cursor: "pointer", background: "transparent", color: "#B3261E", fontSize: 11.5, padding: 0, textDecoration: "underline", fontFamily: "inherit" }}>Start again on this device</button> · Read and scored entirely in your browser; nothing is transmitted. {state.ledger.length ? `Saved on this device: ${state.ledger.length} file${state.ledger.length > 1 ? "s" : ""} in the ledger.` : ""}</p>
              {state.review.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={kick}>Held for review · never guessed</div>
                  {state.review.slice(0, 5).map((r, i) => (
                    <div key={i} style={{ borderTop: "1px solid rgba(106,12,160,.12)", padding: "10px 0", fontSize: 12.5 }}>
                      <b>{r.name}</b> in {r.file}: which pupil?
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                        {r.candidates.map((c) => <button key={c.upn} onClick={() => resolve(r, c.upn)} style={{ border: "none", cursor: "pointer", background: LILAC, color: DEEP, borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit" }}>{c.name} · {c.reg}</button>)}
                        <button onClick={() => resolve(r, null)} style={{ border: "none", cursor: "pointer", background: "#fff", color: MUTED, borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontFamily: "inherit", boxShadow: shadow }}>Discard row</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ ...card }}>
              <div style={kick}>The evidence ledger</div>
              <p style={{ fontSize: 12.5, color: MUTED, margin: "6px 0 10px" }}>Every number on the map walks back to a named file, a date and the assumptions made. Under a minute, in front of anyone.</p>
              {state.ledger.length ? groupLedger(state.ledger).map(([label, entries]) => (
                <div key={label} style={{ marginBottom: 6 }}>
                  <div style={{ ...kick, marginTop: 12 }}>{label}</div>
                  {entries.slice(0, 8).map((l, i) => (
                    <div key={i} style={{ borderTop: "1px solid rgba(106,12,160,.12)", padding: "9px 0", fontSize: 12.5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span><b>{l.file}</b> · read as <b style={{ color: DEEP }}>{l.kind}</b> · {l.matched}/{l.of} matched{l.held ? `, ${l.held} held` : ""} · {l.date}</span>
                        <button onClick={() => { const roll = l.kind === "roll"; if (window.confirm(roll ? "Remove the roll? This clears every pupil from the spine; evidence files remain but nothing can attach until a roll is uploaded again." : "Remove this file and all the evidence it brought in?")) setState(removeUpload(state, l)); }} style={{ border: "none", cursor: "pointer", background: "transparent", color: "#B3261E", fontSize: 14, padding: 0, lineHeight: 1 }}>&times;</button>
                      </div>
                      {l.note && <div style={{ color: DEEP, fontSize: 11.5, marginTop: 2, fontStyle: "italic" }}>&ldquo;{l.note}&rdquo;</div>}
                      {l.assumptions?.length > 0 && <div style={{ color: MUTED, fontSize: 11.5, marginTop: 2 }}>{l.assumptions.join("; ")}</div>}
                    </div>
                  ))}
                </div>
              )) : <p style={{ fontSize: 12.5, color: MUTED }}>Nothing yet. The ledger begins with your first file.</p>}
            </div>
          </div>
          </>
        )}

        {/* ═══ INSIGHTS ═══ */}
        {tab === "ins" && (
          <div style={{ marginTop: 20 }}>
            <div className="asi-rise" style={{ ...card, marginBottom: 18, "--asi-d": "100ms" }}>
              <div style={kick}>The signal board</div>
              <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, margin: "4px 0 10px" }}>The groups an average would lose</h3>
              {signals.map((s, i) => (
                <div key={i} style={{ borderTop: "1px solid rgba(106,12,160,.12)", padding: "11px 0" }}>
                  <b style={{ fontSize: 14, color: s.tone === "bad" ? "#B3261E" : s.tone === "warn" ? "#8a6d1c" : "#2F7A39" }}>{s.title}</b>
                  <p style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 6px" }}>{s.detail}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {s.upns.slice(0, 10).map((u) => <button key={u} onClick={() => { setPick(u); setYear(computed[u].year ?? null); setTab("view"); }} style={{ border: "none", cursor: "pointer", background: LILAC, color: DEEP, borderRadius: 999, padding: "4px 11px", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit" }}>{computed[u].name}</button>)}
                  </div>
                </div>
              ))}
            </div>
            {years.map((y, i) => <div key={y} className="asi-rise" style={{ "--asi-d": `${260 + i * 150}ms` }}><QuintileGrid year={y} pupils={pupils.filter((p) => p.year === y)} onPick={(u) => { setPick(u); setYear(computed[u]?.year ?? null); setTab("view"); }} /></div>)}
          </div>
        )}
      </div>
    </div>
  );
}

const YEARC = ["#6A0CA0", "#C6A035", "#2F7A39", "#B3532A", "#3E5F8A", "#A03E76", "#0B6E6A"];
const chip = (on, c) => ({ border: "none", cursor: "pointer", borderRadius: 999, padding: "6px 13px", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: on ? "#F4EEFA" : "#fff", color: on ? "#4B0875" : "#6F6580", boxShadow: "0 1px 2px rgba(34,18,51,.04), 0 8px 24px rgba(34,18,51,.06)", outline: on ? `1.5px solid ${c}` : "none" });
const dotk = (c) => ({ display: "inline-block", width: 8, height: 8, borderRadius: 4, border: `2px solid ${c}`, background: "#fff", margin: "0 4px 0 8px", verticalAlign: "-1px" });

const SHOALC = { steady: "#6A0CA0", improving: "#2F7A39", declining: "#B3261E" };
const PULLC = { learning: "#6A0CA0", engagement: "#C6A035", both: "#B3261E" };
const swatch = (c) => ({ display: "inline-block", width: 9, height: 9, borderRadius: 5, background: c, margin: "0 4px 0 8px", verticalAlign: "-1px" });

function Sky({ pupils, years, year, lens, onOpenYear, onBack, inGroup, pick, onPick }) {
  const shoal = useMemo(() => layoutShoal(pupils, years), [pupils, years]);
  /* each strip can flip to its year's own numbers: squash, swap, settle */
  const [flip, setFlip] = useState({});
  const flipT = useRef({});
  const toggleFlip = (y) => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setFlip((f) => ({ ...f, [y]: { shown: !(f[y] && f[y].shown), squash: false } })); return; }
    clearTimeout(flipT.current[y]);
    setFlip((f) => ({ ...f, [y]: { shown: !!(f[y] && f[y].shown), squash: true } }));
    flipT.current[y] = setTimeout(() => setFlip((f) => ({ ...f, [y]: { shown: !(f[y] && f[y].shown), squash: false } })), 560);
  };
  const mands = useMemo(() => {
    const m = {};
    years.forEach((y) => { m[y] = layoutMandala(pupils.filter((p) => p.year === y)); });
    return m;
  }, [pupils, years]);
  const gmands = useMemo(() => {
    if (!lens) return {};
    const m = {};
    years.forEach((y) => { m[y] = layoutGradeMandala(pupils.filter((p) => p.year === y && p.concern != null), lens); });
    return m;
  }, [pupils, years, lens]);

  /* scene lags the prop while the coil runs */
  const [scene, setScene] = useState(year == null ? { mode: "school" } : { mode: "year", year });
  const [t, setT] = useState(1);
  const animRef = useRef(null);
  useEffect(() => {
    const want = year == null ? { mode: "school" } : { mode: "year", year };
    if (want.mode === scene.mode && want.year === scene.year) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setScene(want); setT(1); return; }
    const coilYear = want.mode === "year" ? want.year : scene.year;
    const dirIn = want.mode === "year";
    if (animRef.current) cancelAnimationFrame(animRef.current.raf);
    const t0 = performance.now(), DUR = 1550;
    const anim = { coilYear, dirIn, raf: 0 };
    animRef.current = anim;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / DUR);
      setT(dirIn ? k : 1 - k);
      setScene({ mode: "coil", year: coilYear, dirIn });
      if (k < 1) anim.raf = requestAnimationFrame(step);
      else { animRef.current = null; setScene(want); setT(1); }
    };
    anim.raf = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current.raf); };
  }, [year]);

  /* the lens morph: every dot drifts to its new seat and settles, one motion */
  const posRef = useRef(null);
  const morphRaf = useRef(0);
  const [, morphTick] = useState(0);
  useEffect(() => {
    if (scene.mode !== "year") { posRef.current = null; return; }
    const mandY = mands[scene.year];
    if (!mandY) return;
    const gmY = lens ? gmands[scene.year] : null;
    const tg = {};
    Object.keys(mandY.byU).forEach((u) => { tg[u] = (gmY && gmY.byU[u]) || mandY.byU[u]; });
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !posRef.current) { posRef.current = { ...tg }; morphTick((n) => n + 1); return; }
    cancelAnimationFrame(morphRaf.current);
    const step = () => {
      const cur = posRef.current;
      let moving = false;
      for (const u in tg) {
        const c = cur[u] || tg[u];
        const nx = c.x + (tg[u].x - c.x) * 0.072, ny = c.y + (tg[u].y - c.y) * 0.072;
        if (Math.abs(tg[u].x - nx) > 0.35 || Math.abs(tg[u].y - ny) > 0.35) moving = true;
        cur[u] = { x: nx, y: ny, ang: tg[u].ang };
      }
      morphTick((n) => n + 1);
      if (moving) morphRaf.current = requestAnimationFrame(step);
      else { posRef.current = { ...tg }; morphTick((n) => n + 1); }
    };
    morphRaf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(morphRaf.current);
  }, [lens, scene.mode, scene.year, mands, gmands]);

  const coiling = scene.mode === "coil";
  const yearShown = scene.mode === "year" ? scene.year : coiling ? scene.year : null;
  const mand = yearShown != null ? mands[yearShown] : null;
  const k = Math.max(0, Math.min(1, t)); /* linear clock; each dot takes its own ease */
  const e = easeInOut(k);
  const STAG = 0.34;
  const shoalA = coiling ? 1 - easeInOut(Math.min(1, k * 1.35)) : scene.mode === "school" ? 1 : 0;
  const mandA = coiling ? easeInOut(Math.max(0, (k - 0.5) / 0.5)) : scene.mode === "year" ? 1 : 0;

  const fillFor = (p, inYearWorld) => {
    if (!inYearWorld) return SHOALC[p.dir] || SHOALC.steady;
    if (lens) {
      const gg = gradesOf(p);
      if (!gg) return "#CBB8DF";
      return gg.g >= lens + 1 ? "#2F7A39" : gg.g >= lens ? "#C6A035" : "#B3261E";
    }
    const pu = pullOf(p);
    return pu ? PULLC[pu] : "#CBB8DF";
  };

  return (
    <svg viewBox={`0 0 ${SKY_W} ${SKY_H}`} width="100%" style={{ display: "block", maxHeight: "82vh", margin: "0 auto" }} role="img"
      aria-label={yearShown != null ? `Year ${yearShown}, coiled: rings are concern, slices are tutor groups` : "The school: one strip per year group, each dot a child"}>

      {/* shoal chrome */}
      {shoalA > 0.01 && (
        <g opacity={shoalA}>
          <text x={shoal.gutter} y={30} fontSize="11" fontWeight="600" fill="#2F7A39">On track</text>
          <text x={shoal.zones.watch} y={30} fontSize="11" fontWeight="600" fill="#8a6d1c">Some concern</text>
          <text x={shoal.zones.serious} y={30} fontSize="11" fontWeight="600" fill="#B3261E">Serious</text>
          {shoal.rows.map((r) => {
            const fl = flip[r.year] || {};
            return (
            <g key={r.year}>
              <text x={shoal.gutter - 18} y={r.mid - 8} textAnchor="end" fontFamily="Fraunces, serif" fontWeight="600" fontSize="19" fill="#221233">Y{r.year}</text>
              <text x={shoal.gutter - 18} y={r.mid + 8} textAnchor="end" fontSize="10.5" fill="#6F6580">{r.n} pupils</text>
              <text x={shoal.gutter - 18} y={r.mid + 25} textAnchor="end" fontSize="10.5" fontWeight="700" fill="#4B0875" style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); if (scene.mode === "school") toggleFlip(r.year); }}>
                <title>{fl.shown ? "Back to the children" : "Flip this year to its numbers"}</title>
                {fl.shown ? "‹ pupils" : "stats ›"}
              </text>
              <g style={{ transform: fl.squash ? "scaleY(0.04)" : "scaleY(1)", transition: "transform 540ms cubic-bezier(.45,0,.2,1)", transformBox: "fill-box", transformOrigin: "center" }}>
                {!fl.shown ? (
                  <g onClick={() => scene.mode === "school" && onOpenYear(r.year)} style={{ cursor: "pointer" }}>
                    <rect x={shoal.gutter - 4} y={r.y0} width={shoal.stripW + 8} height={r.h} rx="14" fill="#ffffff" />
                    <rect x={shoal.gutter - 4} y={r.y0} width={shoal.zones.watch - shoal.gutter + 4} height={r.h} rx="14" fill="#F2FBF4" />
                    <rect x={shoal.zones.watch} y={r.y0} width={shoal.zones.serious - shoal.zones.watch} height={r.h} fill="#FBF6E6" />
                    <rect x={shoal.zones.serious} y={r.y0} width={shoal.zones.right - shoal.zones.serious + 4} height={r.h} rx="14" fill="#FBEFED" />
                    <line x1={shoal.zones.watch} y1={r.y0 + 3} x2={shoal.zones.watch} y2={r.y0 + r.h - 3} stroke="rgba(106,12,160,.12)" />
                    <line x1={shoal.zones.serious} y1={r.y0 + 3} x2={shoal.zones.serious} y2={r.y0 + r.h - 3} stroke="rgba(106,12,160,.12)" />
                    <text x={shoal.zones.right + 12} y={r.mid - 2} fontSize="11" fill="#B3261E" fontWeight="600">{r.serious ? r.serious + " serious" : ""}</text>
                    <text x={shoal.zones.right + 12} y={r.mid + 13} fontSize="10.5" fill="#6F6580">{r.declining} declining</text>
                  </g>
                ) : (
                  <StatsRow r={r} shoal={shoal} st={yearStats(pupils.filter((p) => p.year === r.year && inGroup(p)))} />
                )}
              </g>
            </g>
            );
          })}
        </g>
      )}

      {/* mandala chrome */}
      {mand && mandA > 0.01 && (
        <g opacity={mandA}>
          <circle cx={CX} cy={CY} r={R_RIM} fill="#ffffff" />
          <circle cx={CX} cy={CY} r={R_RIM} fill="none" stroke="rgba(179,38,30,.3)" />
          <circle cx={CX} cy={CY} r={R_WATCH} fill="none" stroke="rgba(198,160,53,.45)" />
          <circle cx={CX} cy={CY} r={R_ON} fill="#F4EEFA" opacity=".4" />
          <circle cx={CX} cy={CY} r={R_ON} fill="none" stroke="rgba(106,12,160,.22)" />
          {(() => { const gm = lens ? gmands[yearShown] : null; return (
          <g fontSize="10.5" textAnchor="middle">
            <text x={CX} y={CY - R_ON - 8} fill="#2F7A39">{gm ? `secure above the bar · ${gm.counts.sec}` : `on track · ${mand.counts.calm}`}</text>
            <text x={CX} y={CY - R_WATCH - 8} fill="#8a6d1c">{gm ? `at ${lens} exactly · ${gm.counts.at}` : `some concern · ${mand.counts.watch}`}</text>
            <text x={CX} y={CY - R_RIM - 10} fill="#B3261E">{gm ? `below the bar · ${gm.counts.below}, named` : `serious · ${mand.counts.serious}, named`}</text>
            {gm && gm.counts.out > 0 && <text x={CX} y={SKY_H - 30} fill="#6F6580" fontSize="10">{gm.counts.out} without an En+Ma prediction keep their concern seats, dimmed</text>}
          </g> ); })()}
          <g onClick={onBack} style={{ cursor: "pointer" }}>
            <circle cx={CX} cy={CY} r="42" fill="#ffffff" opacity=".85" />
            <text x={CX} y={CY - 2} textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="600" fontSize="21" fill="#221233">Year {yearShown}</text>
            <text x={CX} y={CY + 15} textAnchor="middle" fontSize="10" fill="#6F6580">{lens ? `the ${lens}+ lens · En & Ma` : `${mand.counts.n} in view`}</text>
          </g>
          {(lens && gmands[yearShown] ? gmands[yearShown] : mand).hidden > 0 && <text x={CX} y={SKY_H - 14} textAnchor="middle" fontSize="10.5" fill="#6F6580">{(lens && gmands[yearShown] ? gmands[yearShown] : mand).hidden} more on the rim without room for a label: their dots and cards still open</text>}
          {(lens && gmands[yearShown] ? gmands[yearShown].labels : mand.labels).map((L) => (
            <g key={L.upn} onClick={() => onPick(L.upn)} style={{ cursor: "pointer" }}>
              <line x1={L.x1} y1={L.y1} x2={L.x2} y2={L.y2} stroke="rgba(34,18,51,.25)" strokeWidth="0.8" />
              <text x={L.tx} y={L.ty} textAnchor={L.anchor} fontSize="11.5" fontWeight="600" fill="#221233">{L.name}</text>
              <text x={L.tx} y={L.ty + 13} textAnchor={L.anchor} fontSize="9.5" fill="#6F6580">{L.why}</text>
            </g>
          ))}
        </g>
      )}

      {/* the children */}
      {pupils.map((p) => {
        if (p.concern == null) return null;
        const S = shoal.byU[p.upn];
        const inYear = yearShown != null && p.year === yearShown;
        const E = inYear && mand ? mand.byU[p.upn] : null;
        let x, y, inYearWorld = false, op = 1;
        if (scene.mode === "school") { if (!S) return null; const fy = flip[p.year]; if (fy && (fy.shown || fy.squash)) return null; ({ x, y } = S); }
        else if (scene.mode === "year") {
          if (!inYear || !E) return null;
          const P = (posRef.current && posRef.current[p.upn]) || E;
          x = P.x; y = P.y; inYearWorld = true;
        } else { /* coiling: a wave, the serious end peeling away first */
          if (inYear && S && E) {
            const along = Math.max(0, Math.min(1, (S.x - shoal.gutter) / shoal.stripW)); /* 1 = serious end */
            const delay = (1 - along) * STAG;
            const pe = easeInOut(Math.max(0, Math.min(1, (k - delay) / (1 - STAG))));
            ({ x, y } = coilPoint(S, E, pe)); inYearWorld = pe > 0.5;
          }
          else if (S) { ({ x, y } = S); op = 1 - easeInOut(Math.min(1, k * 1.5)); if (op <= 0.02) return null; }
          else return null;
        }
        const dim = !inGroup(p);
        const ghost = inYearWorld && lens && !gradesOf(p); /* no En+Ma prediction under the lens */
        const on = pick === p.upn;
        const serious = p.band === 2;
        const r = inYearWorld ? (serious ? 4.4 : 3.2) : (serious ? 3.6 : 2.7);
        return (
          <g key={p.upn} onClick={() => !dim && scene.mode !== "coil" && onPick(p.upn)} style={{ cursor: dim ? "default" : "pointer" }} opacity={dim ? 0.07 : ghost ? 0.15 : op}>
            <title>{p.name} · Year {p.year}</title>
            {on && <circle cx={x} cy={y} r={r + 6.5} fill="rgba(198,160,53,.32)" />}
            <circle cx={x} cy={y} r={r} fill={fillFor(p, inYearWorld)} stroke={inYearWorld && p.dir === "declining" ? "#B3261E" : inYearWorld && p.dir === "improving" ? "#2F7A39" : "#FBFAF7"} strokeWidth={inYearWorld && p.dir !== "steady" ? 1.1 : 0.7} opacity={p.conf === "thin" ? 0.55 : 0.95} />
            {p.capped && !coiling && <circle cx={x} cy={y} r={r + 3.2} fill="none" stroke="#B3261E" strokeWidth="0.9" strokeDasharray="2 2.4" />}
          </g>
        );
      })}
    </svg>
  );
}
const DIR_ = { improving: "#2F7A39", steady: "#C6A035", declining: "#B3261E" };
const MUTED_ = "#6F6580";

/* ── the strip's flip side: the year's own numbers on one shared grid,
      so flipped years read down the page as one table ── */
const SCOLS = [
  { k: "ehcp", cap: "EHCP", pct: true },
  { k: "pp", cap: "Pupil Premium", pct: true },
  { k: "ks2em", cap: "KS2 En+Ma" },
  { k: "ks2read", cap: "KS2 reading" },
  { k: "cats", cap: "CATs mean" },
  { k: "p4", cap: "4+ En & Ma", pct: true, perf: true },
  { k: "p5", cap: "5+ En & Ma", pct: true, perf: true },
  { k: "p7", cap: "7+ En & Ma", pct: true, perf: true },
];
function StatsRow({ r, shoal, st }) {
  const x0 = shoal.gutter - 4, x1 = SKY_W - 14;
  const cw = (x1 - x0) / SCOLS.length;
  const xd = x0 + 5 * cw; /* the line between context and performance */
  const fmt = (c) => { const v = st[c.k]; return v == null ? "–" : c.pct ? v + "%" : v % 1 ? v.toFixed(1) : String(v); };
  return (
    <g>
      <rect x={x0} y={r.y0} width={x1 - x0} height={r.h} rx="14" fill="#ffffff" />
      <rect x={x0} y={r.y0} width={xd - x0} height={r.h} rx="14" fill="#F4EEFA" opacity=".35" />
      <line x1={xd} y1={r.y0 + 6} x2={xd} y2={r.y0 + r.h - 6} stroke="rgba(106,12,160,.18)" />
      <text x={x0 + 12} y={r.y0 + 15} fontSize="9" fontWeight="700" letterSpacing="1.3" fill="#6A0CA0">CONTEXT</text>
      <text x={xd + 12} y={r.y0 + 15} fontSize="9" fontWeight="700" letterSpacing="1.3" fill="#8a6d1c">PERFORMANCE</text>
      {st.basicsN === 0 && (
        <text x={(xd + x1) / 2} y={r.mid + 5} textAnchor="middle" fontSize="11" fill={MUTED_} fontStyle="italic">predictions arrive with the first KS4 tracker</text>
      )}
      {SCOLS.map((c, i) => {
        if (c.perf && st.basicsN === 0) return null;
        const cx = x0 + (i + 0.5) * cw;
        return (
          <g key={c.k} className="asi-fade" style={{ "--asi-d": `${i * 70}ms` }}>
            <text x={cx} y={r.mid - 10} textAnchor="middle" fontSize="9.5" fill={MUTED_}>{c.cap}</text>
            <text x={cx} y={r.mid + 16} textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="600" fontSize="21" fill={st[c.k] == null ? "#CBB8DF" : c.perf ? "#4B0875" : "#221233"} style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(c)}</text>
          </g>
        );
      })}
      <text x={x1 - 10} y={r.y0 + r.h - 8} textAnchor="end" fontSize="8.5" fill={MUTED_} opacity=".8">{st.n} children in view{st.basicsN ? ` · basics from ${st.basicsN} with En+Ma predictions` : ""}</text>
    </g>
  );
}

const WORD = (v) => (v == null ? null : v >= 75 ? "strong" : v >= 62 ? "secure" : v >= 40 ? "some concern" : "serious concern");
const SLAB = { fontSize: 11, fontWeight: 600, color: "#4B0875", margin: "12px 0 6px" };
function Meter({ label, v, family, sub }) {
  return (
    <div style={{ marginBottom: sub ? 5 : 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: sub ? 11 : 12.5 }}>
        <span style={{ color: sub ? MUTED_ : "#221233", fontWeight: sub ? 400 : 600 }}>{label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums", color: sub ? MUTED_ : "#221233" }}>{v == null ? "no evidence yet" : <><b>{WORD(v)}</b> · {v} / 100</>}</span>
      </div>
      <div style={{ height: sub ? 4 : 6, borderRadius: 999, background: "#F4EEFA", marginTop: 3 }}>
        {v != null && <div style={{ height: "100%", width: `${v}%`, borderRadius: 999, background: family === "prov" ? "linear-gradient(90deg,#C6A035,#8a6d1c)" : v < 40 ? "linear-gradient(90deg,#B3261E,#8a1d17)" : "linear-gradient(90deg,#6A0CA0,#4B0875)" }} />}
      </div>
    </div>
  );
}

function GradeTable({ rows }) {
  const cell = { padding: "6px 2px", fontSize: 12.5, fontVariantNumeric: "tabular-nums" };
  return (
    <div>
      <div style={SLAB}>Grades at a glance · furthest behind target first</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ fontSize: 10.5, color: MUTED_ }}>
            <td style={{ ...cell, fontSize: 10.5 }}>Subject</td>
            <td style={{ ...cell, fontSize: 10.5, textAlign: "center" }}>Working at</td>
            <td style={{ ...cell, fontSize: 10.5, textAlign: "center" }}>Predicted</td>
            <td style={{ ...cell, fontSize: 10.5, textAlign: "center" }}>Target</td>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 12).map((r) => {
            const ok = r.pred != null && r.target != null ? (r.pred >= r.target ? 1 : -1) : 0;
            return (
              <tr key={r.s} style={{ borderTop: "1px solid rgba(106,12,160,.1)" }}>
                <td style={{ ...cell, fontWeight: 600 }}>{r.s}</td>
                <td style={{ ...cell, textAlign: "center", color: MUTED_ }}>{r.now ?? "–"}</td>
                <td style={{ ...cell, textAlign: "center", fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 15.5, color: ok > 0 ? "#2F7A39" : ok < 0 ? "#B3261E" : "#221233" }}>{r.pred ?? "–"}</td>
                <td style={{ ...cell, textAlign: "center", color: MUTED_ }}>{r.target ?? "–"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PupilCard({ p, onClose }) {
  const [out, setOut] = useState(false);
  const bandC = p.band === 0 ? "#2F7A39" : p.band === 1 ? "#8a6d1c" : p.band === 2 ? "#B3261E" : "#6F6580";
  const bandD = p.band === 0 ? "#1E5A28" : p.band === 1 ? "#6b540e" : p.band === 2 ? "#7e150f" : "#4a4456";
  const close = () => { if (out) return; setOut(true); setTimeout(onClose, 500); };
  return (
    <div style={{ position: "absolute", top: 14, right: 18, bottom: 14, width: 374, overflowY: "auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 6px rgba(34,18,51,.1), 0 32px 90px rgba(34,18,51,.28)", padding: "0 20px 18px", zIndex: 5,
      animation: out ? "asiCardOut 500ms cubic-bezier(.5,0,.6,1) forwards" : "asiCardIn 700ms cubic-bezier(.22,.9,.28,1) both" }}>
      <div style={{ margin: "0 -20px 12px", padding: "13px 18px 12px", background: `linear-gradient(135deg, ${bandC}, ${bandD})`, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 2 }}>
        <div>
          <div style={{ fontSize: 10.5, letterSpacing: ".14em", fontWeight: 700, opacity: 0.92 }}>{p.band != null ? BANDS[p.band].toUpperCase() : "AWAITING EVIDENCE"}</div>
          <div style={{ fontSize: 11.5, opacity: 0.92, marginTop: 2 }}>{p.dir === "steady" ? "holding steady" : p.dir}{p.capped ? " · held visible by the rule" : ""} &middot; evidence {p.conf} ({p.evCount})</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {p.concern != null && <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 29, lineHeight: 1 }}>{p.concern}<span style={{ fontSize: 11, opacity: 0.75 }}> /100</span></div>}
          <button onClick={close} aria-label="Close" style={{ border: "none", background: "rgba(255,255,255,.2)", color: "#fff", cursor: "pointer", fontSize: 14, borderRadius: 999, width: 26, height: 26, lineHeight: "24px", padding: 0, fontFamily: "inherit" }}>&times;</button>
        </div>
      </div>
      <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 20, lineHeight: 1.15 }}>{p.name}</div>
      <div style={{ fontSize: 11.5, color: MUTED_, margin: "3px 0 7px" }}>Year {p.year}{p.reg ? ` · ${p.reg}` : ""}{p.gender ? ` · ${p.gender === "M" ? "Boy" : "Girl"}` : ""}{p.ppg ? " · Pupil Premium" : ""}{p.fsm && !p.ppg ? " · FSM" : ""}{p.ehcp ? " · EHCP" : p.sen ? " · SEN" : ""}{p.eal ? " · EAL" : ""}</div>
      {p.capped && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "0 0 4px" }}>Held visible by the no-compensation rule: strength elsewhere cannot average away the core concern.</p>}
      {p.priorQ && p.nowQ && <p style={{ fontSize: 12, color: MUTED_, margin: "0 0 2px" }}>Started in the {["", "bottom", "second", "middle", "fourth", "top"][p.priorQ]} fifth of the cohort; now performing in the {["", "bottom", "second", "middle", "fourth", "top"][p.nowQ]} fifth.</p>}
      {p.ks4 ? <GradeTable rows={p.ks4} /> : p.subjects?.length > 1 && (
        <>
          <div style={SLAB}>Subjects · strongest to weakest, percentile in the cohort</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {p.subjects.slice(0, 12).map((x) => (
              <span key={x.s} style={{ fontSize: 10.5, borderRadius: 999, padding: "3px 9px", background: x.pct >= 60 ? "#E7F3EB" : x.pct <= 25 ? "#F9E4E2" : "#F4EEFA" }}>{x.s} <b>{x.pct}</b></span>
            ))}
          </div>
        </>
      )}
      <div style={SLAB}>How the pupil is doing</div>
      <Meter label="Learning" v={p.progress} />
      <Meter label="Engagement" v={p.engagement} />
      {p.engParts && (p.engParts.attendance != null || p.engParts.conduct != null || p.engParts.participation != null) && (
        <div style={{ margin: "-3px 0 6px 10px" }}>
          <Meter sub label={p.nowAtt != null ? `Attendance (${p.nowAtt}% against ${p.expected}% expected)` : "Attendance"} v={p.engParts.attendance} />
          <Meter sub label="Conduct and homework" v={p.engParts.conduct} />
          <Meter sub label="Taking part" v={p.engParts.participation} />
        </div>
      )}
      <div style={SLAB}>What the school is doing</div>
      <Meter label="Enrichment" v={p.enrichment} family="prov" />
      <Meter label="Interventions" v={p.interventions} family="prov" />
      {p.wins?.length > 1 && (
        <>
          <div style={SLAB}>Percentile across assessment windows</div>
          <svg viewBox="0 0 300 62" width="100%">
            <line x1="8" y1="54" x2="292" y2="54" stroke="rgba(106,12,160,.15)" />
            {p.perWin.map((v, i) => v != null && (
              <g key={i}>
                <circle cx={16 + (i * 270) / Math.max(1, p.perWin.length - 1)} cy={54 - v * 0.44} r="3.2" fill="#6A0CA0" />
                {i > 0 && p.perWin[i - 1] != null && <line x1={16 + ((i - 1) * 270) / Math.max(1, p.perWin.length - 1)} y1={54 - p.perWin[i - 1] * 0.44} x2={16 + (i * 270) / Math.max(1, p.perWin.length - 1)} y2={54 - v * 0.44} stroke="#6A0CA0" strokeWidth="2" />}
              </g>
            ))}
          </svg>
        </>
      )}
      {(p.trips > 0 || p.ivs?.length > 0) && <p style={{ fontSize: 11.5, color: MUTED_, margin: "4px 0 0" }}>{p.trips ? `${p.trips} enrichment event${p.trips > 1 ? "s" : ""} this year. ` : ""}{p.ivs?.length ? `In: ${p.ivs.join(", ")}.` : ""}</p>}
      <p style={{ fontSize: 10, color: MUTED_, margin: "8px 0 0" }}>Every score runs to 100; 62 and above reads as on track.</p>
    </div>
  );
}

function QuintileGrid({ year, pupils, onPick }) {
  const cells = {};
  pupils.forEach((p) => { if (p.priorQ && p.nowQ) (cells[`${p.priorQ}-${p.nowQ}`] = cells[`${p.priorQ}-${p.nowQ}`] || []).push(p); });
  if (!Object.keys(cells).length) return null;
  return (
    <div style={{ ...card, marginBottom: 18 }}>
      <div style={kick}>Year {year} · started against now, in fifths of the cohort</div>
      <div style={{ display: "grid", gridTemplateColumns: "auto repeat(5, 1fr)", gap: 5, marginTop: 12, fontSize: 11 }}>
        <div />{[1, 2, 3, 4, 5].map((q) => <div key={q} style={{ textAlign: "center", color: MUTED_ }}>now Q{q}</div>)}
        {[5, 4, 3, 2, 1].map((pr) => (
          <React.Fragment key={pr}>
            <div style={{ color: MUTED_, alignSelf: "center" }}>start Q{pr}</div>
            {[1, 2, 3, 4, 5].map((now) => {
              const ps = cells[`${pr}-${now}`] || [];
              const off = now - pr;
              const bg = !ps.length ? "#FBFAF7" : off <= -2 ? "#F9E4E2" : off < 0 ? "#FBF1E0" : off === 0 ? "#F4EEFA" : "#E7F3EB";
              return (
                <div key={now} style={{ background: bg, borderRadius: 8, minHeight: 40, padding: 5, display: "flex", flexWrap: "wrap", gap: 3, alignContent: "flex-start" }}>
                  {ps.map((p) => <button key={p.upn} title={p.name} onClick={() => onPick(p.upn)} style={{ border: "none", cursor: "pointer", width: 9, height: 9, borderRadius: 5, background: DIR_[p.dir], padding: 0 }} />)}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: MUTED_, marginTop: 8 }}>On the diagonal, performing in line with your start; below it, fallen behind; above it, exceeding. Quintiles for humans, percentiles for the maths.</p>
    </div>
  );
}

let xlsxP = null;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve();
  if (xlsxP) return xlsxP;
  xlsxP = new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = "/lens/js/vendor-xlsx.js?v=7"; sc.onload = res; sc.onerror = () => rej(new Error("Excel reader failed to load")); document.head.appendChild(sc); });
  return xlsxP;
}

function Fig({ v, l, c }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 7 }}>
      <b style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 21, color: c || "#221233", fontVariantNumeric: "tabular-nums" }}>{v}</b>
      <span style={{ fontSize: 11, color: "#6F6580" }}>{l}</span>
    </span>
  );
}
function Metrics({ pupils: all, label }) {
  const pupils = all.filter((q) => q.concern != null);
  const n = pupils.length;
  if (!n) return <p style={{ fontSize: 12.5, color: "#6F6580", margin: "4px 0 0" }}>{label}: no pupils with evidence yet in this view.</p>;
  const med = (f) => { const v = pupils.map(f).filter((x) => x != null).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : "–"; };
  return (
    <div style={{ display: "flex", gap: 26, alignItems: "baseline", flexWrap: "wrap", borderTop: "1px solid rgba(106,12,160,.14)", borderBottom: "1px solid rgba(106,12,160,.14)", padding: "10px 2px", margin: "0 0 2px" }}>
      <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 14.5, marginRight: 2 }}>{label}</span>
      <Fig v={n} l="pupils with evidence" />
      <Fig v={pupils.filter((q) => q.band === 0).length} l="on track" c="#2F7A39" />
      <Fig v={pupils.filter((q) => q.band === 1).length} l="some concern" c="#8a6d1c" />
      <Fig v={pupils.filter((q) => q.band === 2).length} l="serious" c="#B3261E" />
      <Fig v={pupils.filter((q) => q.dir === "declining").length} l="moving the wrong way" />
      {med((q) => q.progress) !== "\u2013" && <Fig v={med((q) => q.progress)} l="median learning" />}
      {med((q) => q.engagement) !== "\u2013" && <Fig v={med((q) => q.engagement)} l="median engagement" />}
      {pupils.some((q) => q.capped) && <Fig v={pupils.filter((q) => q.capped).length} l="held visible" c="#B3261E" />}
    </div>
  );
}

/* ── the reading slip card: the file read back before it lands ── */
const sel = { border: "1px solid rgba(106,12,160,.25)", borderRadius: 8, padding: "5px 8px", fontSize: 12, fontFamily: "inherit", background: "#fff", color: "#221233", maxWidth: 260 };
function Slip({ slip, years, onFix, onCommit, onDiscard }) {
  const unread = slip.kind === "unreadable";
  const fx = slip.fixes || {};
  const yr = fx.year ?? null;
  const autoCol = (k) => (k === "att" ? (slip.autoMap.attPlus ?? slip.autoMap.att ?? null) : (slip.autoMap[k] ?? null));
  const corrected = (k) => fx.fields && fx.fields[k] !== undefined && fx.fields[k] !== autoCol(k);
  const chg = (k, v) => onFix({ ...fx, fields: { ...(fx.fields || {}), [k]: v } });
  return (
    <div style={{ ...card, marginTop: 12, padding: "18px 22px", borderLeft: `3px solid ${unread ? "#B3261E" : slip.remembered ? GOLD : PURPLE}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 600, fontSize: 14, wordBreak: "break-all" }}>{slip.fileName}</div>
        {!unread && (
          <div style={{ fontSize: 12.5, color: MUTED }}>
            <b style={{ color: INK, fontFamily: "Fraunces, serif", fontSize: 17 }}>{slip.stats.matched}</b> of {slip.stats.of} rows will land
            {slip.stats.blank ? ` · ${slip.stats.blank} blank set aside` : ""}{slip.stats.held ? ` · ${slip.stats.held} held` : ""}
          </div>
        )}
      </div>
      {slip.opts?.note && <div style={{ fontSize: 11.5, color: DEEP, fontStyle: "italic", margin: "4px 0 0" }}>&ldquo;{slip.opts.note}&rdquo;</div>}
      {slip.remembered && <div style={{ fontSize: 12, color: "#8a6d1c", margin: "6px 0 0" }}>This shape is remembered from <b>{slip.remembered.file}</b> &mdash; the correction is already applied below.</div>}
      {slip.replaces && <div style={{ fontSize: 12, color: MUTED, margin: "6px 0 0" }}>Replaces the earlier reading of this file. Nothing changes until you confirm.</div>}
      {!unread && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "10px 0 2px", fontSize: 13 }}>
          <span>The reader believes this is</span>
          <select value={slip.kind} onChange={(e) => onFix({ ...fx, kind: e.target.value })} style={sel}>
            {!KIND_CHOICES.includes(slip.kind) && <option value={slip.kind}>{KIND_LABELS[slip.kind] || slip.kind}</option>}
            {KIND_CHOICES.map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
          </select>
          <span>covering</span>
          <select value={yr == null ? "" : yr} onChange={(e) => onFix({ ...fx, year: e.target.value === "" ? null : +e.target.value })} style={sel}>
            <option value="">the whole school</option>
            {(years.length ? years : [7, 8, 9, 10, 11]).map((y) => <option key={y} value={y}>Year {y} only</option>)}
          </select>
        </div>
      )}
      {!unread && Object.keys(slip.fields).length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "5px 12px", alignItems: "center", margin: "10px 0 2px", maxWidth: 560 }}>
          {Object.entries(slip.fields).map(([k, v]) => (
            <React.Fragment key={k}>
              <span style={{ fontSize: 12, color: MUTED }}>{FIELD_LABELS[k] || k}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <select value={v == null ? "" : v} onChange={(e) => chg(k, e.target.value === "" ? null : +e.target.value)} style={{ ...sel, color: v == null ? MUTED : INK }}>
                  <option value="">&mdash; not in this file &mdash;</option>
                  {v === -1 && <option value={-1}>surname + forename</option>}
                  {slip.headers.map((h, i) => (h ? <option key={i} value={i}>{h}</option> : null))}
                </select>
                {corrected(k) && <span style={{ fontSize: 10, color: "#8a6d1c", fontWeight: 600, whiteSpace: "nowrap" }}>your word</span>}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      {slip.assumptions?.length > 0 && (
        <div style={{ fontSize: 11.5, color: MUTED, margin: "8px 0 0", maxWidth: 680 }}>
          {slip.assumptions.map((a, i) => <div key={i} style={{ margin: "2px 0" }}>&middot; {a}</div>)}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 13 }}>
        {!unread && <button onClick={onCommit} style={{ border: "none", cursor: "pointer", background: "linear-gradient(135deg,#6A0CA0,#4B0875)", color: "#fff", borderRadius: 999, padding: "9px 18px", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit" }}>Read it in</button>}
        <button onClick={onDiscard} style={{ border: "none", cursor: "pointer", background: "#fff", color: MUTED, borderRadius: 999, padding: "9px 16px", fontSize: 12, fontWeight: 600, fontFamily: "inherit", boxShadow: shadow }}>Don&rsquo;t read this file</button>
      </div>
    </div>
  );
}

function groupLedger(ledger) {
  const g = {};
  ledger.forEach((l) => {
    const label = l.kind === "roll" ? "The roll" : l.scope != null ? `Year ${l.scope}` : l.years?.length === 1 ? `Year ${l.years[0]}` : l.years?.length > 1 ? "Several year groups" : "Unplaced";
    (g[label] = g[label] || []).push(l);
  });
  const order = (k) => (k === "The roll" ? -1 : k === "Several year groups" ? 98 : k === "Unplaced" ? 99 : parseInt(k.replace(/\D/g, "")) || 50);
  return Object.entries(g).sort((a, b) => order(a[0]) - order(b[0]));
}

function Empty({ onGo }) {
  return (
    <div style={{ ...card, marginTop: 20, textAlign: "center", padding: "52px 28px" }}>
      <svg viewBox="0 0 100 100" width="40" height="40" style={{ marginBottom: 14 }}><path d="M31.5 31.5 A 18.5 18.5 0 1 1 68.5 31.5 A 18.5 18.5 0 1 1 68.5 68.5 A 18.5 18.5 0 1 1 31.5 68.5 A 18.5 18.5 0 1 1 31.5 31.5 Z" fill="none" stroke="#6A0CA0" strokeWidth="7" /></svg>
      <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 20, margin: "0 0 6px" }}>The sky is waiting for its stars</h3>
      <p style={{ color: MUTED_, fontSize: 13.5, maxWidth: 440, margin: "0 auto 18px" }}>Upload the MIS roll first: it is the spine every other document attaches to. Then years of assessments, attendance and registers, and every child takes their place.</p>
      <button onClick={onGo} style={{ border: "none", cursor: "pointer", background: "linear-gradient(135deg,#6A0CA0,#4B0875)", color: "#fff", borderRadius: 999, padding: "11px 22px", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Open Uploads</button>
    </div>
  );
}
