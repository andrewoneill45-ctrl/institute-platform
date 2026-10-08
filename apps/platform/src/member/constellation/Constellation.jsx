/* Constellation — every child in view. School View zooms from the whole school
   to the single pupil; Uploads is the intake with its ledger and review queue;
   Insights is the signal board. All of it on this device only. */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../lib/auth.jsx";
import { loadState, saveState, blankState, ingest, computeAll, findSignals, rowsToCsv, removeUpload, BANDS } from "./model.js";

const INK = "#221233", PURPLE = "#6A0CA0", DEEP = "#4B0875", GOLD = "#C6A035", MUTED = "#6F6580", LILAC = "#F4EEFA";
const DIR = { improving: "#2F7A39", steady: GOLD, declining: "#B3261E" };
const shadow = "0 1px 2px rgba(34,18,51,.04), 0 16px 44px rgba(34,18,51,.09)";
const card = { background: "#fff", borderRadius: 20, boxShadow: shadow, padding: "22px 24px" };
const kick = { fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: PURPLE, fontWeight: 600 };

export default function Constellation() {
  const { user } = useAuth();
  const sid = user?.urn || user?.school || "school";
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("view");
  const [year, setYear] = useState(null);
  const [pick, setPick] = useState(null);

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
  useEffect(() => { if (year == null && years.length) setYear(years[0]); }, [years.length]);

  const [upYear, setUpYear] = useState(null);
  const [upNote, setUpNote] = useState("");
  async function onFiles(list) {
    let s = state;
    for (const f of list) {
      if (/\.(xlsx|xls)$/i.test(f.name)) {
        await loadXLSX();
        try {
          const wb = window.XLSX.read(new Uint8Array(await f.arrayBuffer()), { type: "array" });
          for (const sn of wb.SheetNames) {
            const aoa = window.XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: "" });
            let hRow = 0;
            for (let i = 0; i < Math.min(5, aoa.length); i++) if (aoa[i].some((c) => /^upn$/i.test(String(c).trim()))) { hRow = i; break; }
            if (aoa.length > hRow + 1) s = ingest(s, f.name + (wb.SheetNames.length > 1 ? " \u00b7 " + sn : ""), rowsToCsv(aoa.slice(hRow)), { year: upYear, note: upNote });
          }
        } catch (e) {
          s = { ...s, ledger: [{ file: f.name, kind: "unreadable", matched: 0, of: 0, assumptions: ["could not open workbook: " + (e?.message || e)], date: new Date().toLocaleDateString("en-GB") }, ...s.ledger] };
        }
      } else s = ingest(s, f.name, await f.text(), { year: upYear, note: upNote });
    }
    setState({ ...s });
    setUpNote("");
  }
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
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "26px 28px 70px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 14 }}>
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
        {tab === "view" && (state.roll.length ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 6px", flexWrap: "wrap" }}>
              <span style={kick}>Year group</span>
              <button onClick={() => setYear(null)} style={chip(year == null, DEEP)}>{"All"}</button>
              {years.map((y, i) => (
                <button key={y} onClick={() => setYear(year === y ? null : y)} style={chip(year === y, YEARC[i % YEARC.length])}>
                  <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: YEARC[i % YEARC.length], marginRight: 6 }} />Y{y}
                </button>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 11.5, color: MUTED }}>outline: <i style={dotk("#2F7A39")} />improving · <i style={dotk("#B3261E")} />declining · dashed ring, held visible</span>
            </div>
            <SchoolLine pupils={pupils.filter((p) => year == null || p.year === year)} label={year == null ? "Whole school" : "Year " + year} />
            <div style={{ position: "relative", width: "100vw", left: "50%", transform: "translateX(-50%)", marginTop: 4 }}>
              <Field pupils={pupils} years={years} yearFilter={year} pick={pick} onPick={setPick} />
              {chosen && <PupilCard p={chosen} onClose={() => setPick(null)} />}
            </div>
            <p style={{ fontSize: 11.5, color: MUTED, margin: "2px 0 0", maxWidth: 740 }}>On-track children rest in the calm centre. A learning concern pulls a child to the right, an engagement concern to the left (attendance is its loudest evidence, not a separate issue), and a child weak in both sinks south, furthest of all. Distance is seriousness, colour is year group, and no child can be averaged back to the middle.</p>
          </>
        ) : <Empty onGo={() => setTab("up")} />)}

        {/* ═══ UPLOADS ═══ */}
        {tab === "up" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 20 }}>
            <div style={{ ...card }}>
              <div style={kick}>Upload anything</div>
              <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, margin: "4px 0 8px" }}>In-play: the children in the building now</h3>
              <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 6px" }}><b>This intake is for live pupils only.</b> Finished cohorts, historic results and inspection evidence belong in Lens's Section 48 vault; nothing moves between the two unless you move it.</p>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>Start with your MIS roll export (UPN, name, year, and ideally DOB, reg group, prior attainment, PPG, SEN). Then assessments, attendance, behaviour, trip registers and intervention logs, year after year: each file only ever points at a pupil who already exists. CSV and Excel in this release, including year-group trackers with termly columns; Word and scans follow.</p>
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
              <p style={{ fontSize: 11.5, color: MUTED }}><button onClick={() => { if (window.confirm("Clear everything Constellation holds on this device: roll, evidence, ledger? This cannot be undone.")) { indexedDB.deleteDatabase("asi-constellation-" + sid); setState(blankState()); } }} style={{ border: "none", cursor: "pointer", background: "transparent", color: "#B3261E", fontSize: 11.5, padding: 0, textDecoration: "underline", fontFamily: "inherit" }}>Start again on this device</button> · Read and scored entirely in your browser; nothing is transmitted. {state.ledger.length ? `Saved on this device: ${state.ledger.length} file${state.ledger.length > 1 ? "s" : ""} in the ledger.` : ""}</p>
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
        )}

        {/* ═══ INSIGHTS ═══ */}
        {tab === "ins" && (
          <div style={{ marginTop: 20 }}>
            <div style={{ ...card, marginBottom: 18 }}>
              <div style={kick}>The signal board</div>
              <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, margin: "4px 0 10px" }}>The groups an average would lose</h3>
              {signals.map((s, i) => (
                <div key={i} style={{ borderTop: "1px solid rgba(106,12,160,.12)", padding: "11px 0" }}>
                  <b style={{ fontSize: 14, color: s.tone === "bad" ? "#B3261E" : s.tone === "warn" ? "#8a6d1c" : "#2F7A39" }}>{s.title}</b>
                  <p style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 6px" }}>{s.detail}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {s.upns.slice(0, 10).map((u) => <button key={u} onClick={() => { setPick(u); setYear(null); setTab("view"); }} style={{ border: "none", cursor: "pointer", background: LILAC, color: DEEP, borderRadius: 999, padding: "4px 11px", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit" }}>{computed[u].name}</button>)}
                  </div>
                </div>
              ))}
            </div>
            {years.map((y) => <QuintileGrid key={y} year={y} pupils={pupils.filter((p) => p.year === y)} onPick={(u) => { setPick(u); setYear(null); setTab("view"); }} />)}
          </div>
        )}
      </div>
    </div>
  );
}

const YEARC = ["#6A0CA0", "#C6A035", "#2F7A39", "#B3532A", "#3E5F8A", "#A03E76", "#0B6E6A"];
const chip = (on, c) => ({ border: "none", cursor: "pointer", borderRadius: 999, padding: "6px 13px", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: on ? "#F4EEFA" : "#fff", color: on ? "#4B0875" : "#6F6580", boxShadow: "0 1px 2px rgba(34,18,51,.04), 0 8px 24px rgba(34,18,51,.06)", outline: on ? `1.5px solid ${c}` : "none" });
const dotk = (c) => ({ display: "inline-block", width: 8, height: 8, borderRadius: 4, border: `2px solid ${c}`, background: "#fff", margin: "0 4px 0 8px", verticalAlign: "-1px" });

function place2(p) {
  const l = p.progress, e = p.engagement;
  if (l == null && e == null) return { none: true };
  const ld = l == null ? 0 : Math.max(0, 62 - l) / 62;
  const ed = e == null ? 0 : Math.max(0, 62 - e) / 62;
  if (ld <= 0.02 && ed <= 0.02) return { centre: true };
  let vx = (ld - ed) * 0.866, vy = (ld + ed) * 0.5;
  let m = Math.hypot(vx, vy);
  const worst = Math.max(ld, ed);
  if (m < worst * 0.8) { const s = (worst * 0.8) / (m || 1); vx *= s; vy *= s; m = Math.hypot(vx, vy); } /* no compensation in the geometry */
  if (m > 1) { vx /= m; vy /= m; m = 1; }
  return { vx, vy, ld, ed, both: ld > 0.15 && ed > 0.15 };
}

function Field({ pupils, years, yearFilter, pick, onPick }) {
  const W = 1000, H = 600, cx = W / 2, cy = 252, R = 212;
  const yc = (y) => YEARC[years.indexOf(y) % YEARC.length];
  const placed = pupils.map((p) => ({ p, at: place2(p) })).filter(({ at }) => !at.none);
  const learnN = placed.filter(({ at }) => !at.centre && at.ld > at.ed + 0.08 && !at.both).length;
  const engN = placed.filter(({ at }) => !at.centre && at.ed > at.ld + 0.08 && !at.both).length;
  const bothN = placed.filter(({ at }) => at.both).length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", maxHeight: "72vh" }} role="img" aria-label="The school field: learning pulls right, engagement pulls left, both pull south">
      {[0.33, 0.66, 1].map((f) => <circle key={f} cx={cx} cy={cy} r={R * f} fill="none" stroke="rgba(106,12,160,.09)" strokeDasharray="1 7" strokeLinecap="round" />)}
      <circle cx={cx} cy={cy} r="54" fill="#F4EEFA" opacity=".55" />
      <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize="11" fill={MUTED_}>on track</text>
      <g textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="600" fill="#221233">
        <text x={cx + R * 0.93} y={cy + R * 0.56} fontSize="16">Learning</text>
        <text x={cx + R * 0.93} y={cy + R * 0.56 + 16} fontSize="10.5" fontFamily="Inter, sans-serif" fontWeight="400" fill={MUTED_}>{learnN} pupils</text>
        <text x={cx - R * 0.93} y={cy + R * 0.56} fontSize="16">Engagement</text>
        <text x={cx - R * 0.93} y={cy + R * 0.56 + 16} fontSize="10.5" fontFamily="Inter, sans-serif" fontWeight="400" fill={MUTED_}>{engN} pupils</text>
        <text x={cx} y={cy + R + 44} fontSize="16">Learning and engagement together</text>
        <text x={cx} y={cy + R + 60} fontSize="10.5" fontFamily="Inter, sans-serif" fontWeight="400" fill={MUTED_}>{bothN} pupils · the children carrying both weights sit furthest of all</text>
      </g>
      {placed.map(({ p, at }) => {
        const dim = yearFilter != null && p.year !== yearFilter;
        let x, y;
        if (at.centre) { const a = (hash(p.upn) % 360) * Math.PI / 180, r = 5 + (hash(p.upn) % 42); x = cx + r * Math.cos(a); y = cy + r * 0.78 * Math.sin(a); }
        else {
          const ja = ((hash(p.upn) % 100) / 100 - 0.5) * 0.16, jr = 0.93 + ((hash(p.upn + "r") % 100) / 100) * 0.14;
          const ang = Math.atan2(at.vy, at.vx) + ja, mag = Math.min(1, Math.hypot(at.vx, at.vy) * jr);
          x = cx + (60 + mag * (R - 60)) * Math.cos(ang); y = cy + (60 + mag * (R - 60)) * Math.sin(ang);
        }
        const on = pick === p.upn;
        const stroke = p.dir === "improving" ? "#2F7A39" : p.dir === "declining" ? "#B3261E" : "#fff";
        return (
          <g key={p.upn} onClick={() => !dim && onPick(p.upn)} style={{ cursor: dim ? "default" : "pointer" }} opacity={dim ? 0.07 : 1}>
            <title>{p.name} · Year {p.year}</title>
            {on && <circle cx={x} cy={y} r="10" fill="rgba(198,160,53,.3)" />}
            <circle cx={x} cy={y} r={p.band === 2 ? 4.1 : 3} fill={yc(p.year)} stroke={stroke} strokeWidth="1.1" opacity={p.conf === "thin" ? 0.5 : 0.92} />
            {p.capped && <circle cx={x} cy={y} r="6.6" fill="none" stroke="#B3261E" strokeWidth="1" strokeDasharray="2 2.5" />}
          </g>
        );
      })}
    </svg>
  );
}
const DIR_ = { improving: "#2F7A39", steady: "#C6A035", declining: "#B3261E" };
const MUTED_ = "#6F6580";

const WORD = (v) => (v == null ? null : v >= 75 ? "strong" : v >= 62 ? "secure" : v >= 40 ? "some concern" : "serious concern");
function Meter({ label, v, family, sub }) {
  return (
    <div style={{ marginBottom: sub ? 5 : 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: sub ? 11 : 12.5 }}>
        <span style={{ color: sub ? MUTED_ : "#221233", fontWeight: sub ? 400 : 600 }}>{label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums", color: sub ? MUTED_ : "#221233" }}>{v == null ? "no evidence yet" : <><b>{WORD(v)}</b> · {v} / 100</>}</span>
      </div>
      <div style={{ height: sub ? 5 : 7, borderRadius: 999, background: "#F4EEFA", marginTop: 3 }}>
        {v != null && <div style={{ height: "100%", width: `${v}%`, borderRadius: 999, background: family === "prov" ? "linear-gradient(90deg,#C6A035,#8a6d1c)" : v < 40 ? "linear-gradient(90deg,#B3261E,#8a1d17)" : "linear-gradient(90deg,#6A0CA0,#4B0875)" }} />}
      </div>
    </div>
  );
}

function PupilCard({ p, onClose }) {
  return (
    <div style={{ position: "absolute", top: 6, right: "max(16px, calc(50vw - 560px))", width: 350, maxHeight: "calc(72vh - 12px)", overflowY: "auto", background: "#fff", borderRadius: 20, boxShadow: "0 2px 6px rgba(34,18,51,.08), 0 24px 70px rgba(34,18,51,.18)", padding: "18px 20px" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 10, right: 12, border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: MUTED_ }}>&times;</button>
      <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "#6A0CA0", fontWeight: 600 }}>Year {p.year}{p.reg ? ` · ${p.reg}` : ""}{p.ppg ? " · PP" : ""}{p.sen ? " · SEN" : ""}</div>
      <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 19, margin: "2px 0 4px" }}>{p.name}</div>
      <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
        <b style={{ fontSize: 13.5 }}>{p.band != null ? BANDS[p.band] : "Awaiting evidence"}</b>
        <span style={{ fontSize: 11, fontWeight: 700, color: DIR_[p.dir] }}>{p.dir}</span>
        <span style={{ fontSize: 10.5, color: MUTED_, background: "#F4EEFA", borderRadius: 999, padding: "2px 9px" }}>evidence: {p.conf} ({p.evCount})</span>
      </div>
      {p.capped && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "0 0 6px" }}>Held visible by the no-compensation rule: strength elsewhere cannot average away the core concern.</p>}
      {p.priorQ && p.nowQ && <p style={{ fontSize: 12, color: MUTED_, margin: "0 0 8px" }}>Started in the {["", "bottom", "second", "middle", "fourth", "top"][p.priorQ]} fifth of the cohort; now performing in the {["", "bottom", "second", "middle", "fourth", "top"][p.nowQ]} fifth.</p>}
      <p style={{ fontSize: 10.5, color: MUTED_, margin: "0 0 8px" }}>Every score runs to 100; 62 and above reads as on track.</p>
      <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "#6A0CA0", fontWeight: 600, margin: "6px 0 5px" }}>How the pupil is doing</div>
      <Meter label="Learning" v={p.progress} />
      <Meter label="Engagement" v={p.engagement} />
      {p.engParts && (p.engParts.attendance != null || p.engParts.conduct != null || p.engParts.participation != null) && (
        <div style={{ margin: "-4px 0 8px 10px" }}>
          <Meter sub label={p.nowAtt != null ? `Attendance (${p.nowAtt}% against ${p.expected}% expected)` : "Attendance"} v={p.engParts.attendance} />
          <Meter sub label="Conduct and homework" v={p.engParts.conduct} />
          <Meter sub label="Taking part" v={p.engParts.participation} />
        </div>
      )}
      <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "#6A0CA0", fontWeight: 600, margin: "8px 0 5px" }}>What the school is doing</div>
      <Meter label="Enrichment" v={p.enrichment} family="prov" />
      <Meter label="Interventions" v={p.interventions} family="prov" />
      {p.subjects?.length > 1 && (
        <>
          <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "#6A0CA0", fontWeight: 600, margin: "8px 0 5px" }}>Subjects · strongest to weakest, percentile in the cohort</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
            {p.subjects.slice(0, 12).map((x) => (
              <span key={x.s} style={{ fontSize: 10.5, borderRadius: 999, padding: "3px 9px", background: x.pct >= 60 ? "#E7F3EB" : x.pct <= 25 ? "#F9E4E2" : "#F4EEFA" }}>{x.s} <b>{x.pct}</b></span>
            ))}
          </div>
        </>
      )}
      {p.wins?.length > 1 && (
        <>
          <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "#6A0CA0", fontWeight: 600, margin: "8px 0 2px" }}>Percentile across assessment windows</div>
          <svg viewBox="0 0 300 64" width="100%">
            <line x1="8" y1="56" x2="292" y2="56" stroke="rgba(106,12,160,.15)" />
            {p.perWin.map((v, i) => v != null && (
              <g key={i}>
                <circle cx={16 + (i * 270) / Math.max(1, p.perWin.length - 1)} cy={56 - v * 0.46} r="3.4" fill="#6A0CA0" />
                {i > 0 && p.perWin[i - 1] != null && <line x1={16 + ((i - 1) * 270) / Math.max(1, p.perWin.length - 1)} y1={56 - p.perWin[i - 1] * 0.46} x2={16 + (i * 270) / Math.max(1, p.perWin.length - 1)} y2={56 - v * 0.46} stroke="#6A0CA0" strokeWidth="2" />}
              </g>
            ))}
          </svg>
        </>
      )}
      {p.trips > 0 || p.ivs?.length ? <p style={{ fontSize: 11.5, color: MUTED_, margin: "4px 0 0" }}>{p.trips ? `${p.trips} enrichment event${p.trips > 1 ? "s" : ""} this year. ` : ""}{p.ivs?.length ? `In: ${p.ivs.join(", ")}.` : ""}</p> : null}
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

function SchoolLine({ pupils, label }) {
  const n = pupils.length;
  if (!n) return null;
  const onTrack = pupils.filter((p) => p.band === 0).length;
  const serious = pupils.filter((p) => p.band === 2).length;
  const dec = pupils.filter((p) => p.dir === "declining").length;
  const capped = pupils.filter((p) => p.capped).length;
  return (
    <p style={{ fontFamily: "Fraunces, serif", fontSize: 16.5, margin: "8px 0 2px", color: "#221233" }}>
      {label}: of <b>{n}</b> pupils with evidence, <b style={{ color: "#2F7A39" }}>{onTrack} on track</b>, <b style={{ color: "#8a6d1c" }}>{n - onTrack - serious} some concern</b>, <b style={{ color: "#B3261E" }}>{serious} serious</b> · {dec} moving the wrong way{capped ? ` · ${capped} held visible by the no-compensation rule` : ""}.
    </p>
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
