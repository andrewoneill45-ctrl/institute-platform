/* Constellation — every child in view. School View zooms from the whole school
   to the single pupil; Uploads is the intake with its ledger and review queue;
   Insights is the signal board. All of it on this device only. */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../lib/auth.jsx";
import { loadState, saveState, blankState, ingest, computeAll, findSignals, BANDS } from "./model.js";

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
  const [zoom, setZoom] = useState(0); // 0 whole school → 1 year → 2 pupil
  const [year, setYear] = useState(null);
  const [pick, setPick] = useState(null);

  useEffect(() => { loadState(sid).then((s) => setState(s || blankState())); }, [sid]);
  useEffect(() => { if (state) saveState(sid, state); }, [state, sid]);

  const computed = useMemo(() => (state ? computeAll(state) : {}), [state]);
  const pupils = Object.values(computed);
  const years = [...new Set(pupils.map((p) => p.year).filter(Boolean))].sort((a, b) => a - b);
  const signals = useMemo(() => findSignals(computed), [computed]);
  useEffect(() => { if (year == null && years.length) setYear(years[0]); }, [years.length]);

  async function onFiles(list) {
    let s = state;
    for (const f of list) s = ingest(s, f.name, await f.text());
    setState({ ...s });
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
            <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "20px 0 14px", flexWrap: "wrap" }}>
              <span style={kick}>Zoom</span>
              <input type="range" min="0" max="2" step="1" value={zoom} onChange={(e) => setZoom(+e.target.value)} style={{ width: 220, accentColor: PURPLE }} />
              <span style={{ fontSize: 12.5, color: MUTED }}>{["Whole school", `Year ${year ?? ""}`, chosen ? chosen.name : "Choose a pupil"][zoom]}</span>
              {zoom > 0 && <span style={{ display: "flex", gap: 6 }}>{years.map((y) => (
                <button key={y} onClick={() => { setYear(y); setZoom(Math.max(1, zoom)); }} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: year === y ? LILAC : "#fff", color: DEEP, boxShadow: shadow }}>Y{y}</button>
              ))}</span>}
              <span style={{ marginLeft: "auto", display: "flex", gap: 14, fontSize: 11.5, color: MUTED }}>
                {Object.entries(DIR).map(([k, c]) => <span key={k}><i style={{ display: "inline-block", width: 9, height: 9, borderRadius: 5, background: c, marginRight: 5 }} />{k}</span>)}
              </span>
            </div>

            {zoom === 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
                {years.map((y) => {
                  const ps = pupils.filter((p) => p.year === y);
                  const dec = ps.filter((p) => p.dir === "declining").length;
                  const worry = ps.filter((p) => p.band === 2).length;
                  return (
                    <button key={y} onClick={() => { setYear(y); setZoom(1); }} style={{ ...card, textAlign: "left", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      <div style={kick}>Year {y} · {ps.length} pupils</div>
                      <svg viewBox="0 0 200 74" width="100%" style={{ margin: "10px 0 6px" }}>
                        {ps.slice(0, 160).map((p, i) => {
                          const a = (i * 137.5 * Math.PI) / 180, r = 6 + Math.sqrt(i) * 7.2;
                          return <circle key={p.upn} cx={100 + r * Math.cos(a) * 1.9} cy={37 + r * Math.sin(a) * 0.62} r="3" fill={DIR[p.dir]} opacity=".8" />;
                        })}
                      </svg>
                      <div style={{ fontSize: 12.5, color: MUTED }}>{worry ? <b style={{ color: "#B3261E" }}>{worry} serious concern</b> : "none in serious concern"} · {dec} declining</div>
                    </button>
                  );
                })}
              </div>
            )}

            {zoom >= 1 && year != null && (
              <div style={{ display: "grid", gridTemplateColumns: zoom === 2 && chosen ? "1.1fr 1fr" : "1fr", gap: 18 }}>
                <div style={{ ...card, padding: "26px 28px" }}>
                  <div style={kick}>Year {year} · position is concern, colour is direction</div>
                  <Sky pupils={pupils.filter((p) => p.year === year)} pick={pick} onPick={(u) => { setPick(u); setZoom(2); }} />
                  <p style={{ fontSize: 11.5, color: MUTED, margin: "8px 0 0" }}>The centre is on track; distance is the blended concern of attendance, progress and engagement, and no child collapsing in a core measure can be averaged back to the middle.</p>
                </div>
                {zoom === 2 && chosen && <PupilPanel p={chosen} />}
              </div>
            )}
          </>
        ) : <Empty onGo={() => setTab("up")} />)}

        {/* ═══ UPLOADS ═══ */}
        {tab === "up" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 20 }}>
            <div style={{ ...card }}>
              <div style={kick}>Upload anything</div>
              <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, margin: "4px 0 8px" }}>The roll is the spine; everything else attaches to it</h3>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>Start with your MIS roll export (UPN, name, year, and ideally DOB, reg group, prior attainment, PPG, SEN). Then assessments, attendance, behaviour, trip registers and intervention logs, year after year: each file only ever points at a pupil who already exists. CSV in this release; Excel, Word and scans follow.</p>
              <label style={{ display: "block", border: `1.5px dashed rgba(106,12,160,.35)`, borderRadius: 14, padding: "26px 18px", textAlign: "center", cursor: "pointer", margin: "14px 0 6px", background: LILAC, color: DEEP, fontWeight: 600, fontSize: 13.5 }}>
                Drop files or click to choose
                <input type="file" multiple accept=".csv" style={{ display: "none" }} onChange={(e) => onFiles([...e.target.files])} />
              </label>
              <p style={{ fontSize: 11.5, color: MUTED }}>Read and scored entirely in your browser. Nothing is transmitted; the covenant needs no small print here.</p>
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
              {state.ledger.length ? state.ledger.slice(0, 12).map((l, i) => (
                <div key={i} style={{ borderTop: "1px solid rgba(106,12,160,.12)", padding: "9px 0", fontSize: 12.5 }}>
                  <b>{l.file}</b> · read as <b style={{ color: DEEP }}>{l.kind}</b> · {l.matched}/{l.of} matched{l.held ? `, ${l.held} held` : ""} · {l.date}
                  {l.assumptions?.length > 0 && <div style={{ color: MUTED, fontSize: 11.5, marginTop: 2 }}>{l.assumptions.join("; ")}</div>}
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
                    {s.upns.slice(0, 10).map((u) => <button key={u} onClick={() => { setPick(u); setYear(computed[u].year); setZoom(2); setTab("view"); }} style={{ border: "none", cursor: "pointer", background: LILAC, color: DEEP, borderRadius: 999, padding: "4px 11px", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit" }}>{computed[u].name.split(",")[0]}</button>)}
                  </div>
                </div>
              ))}
            </div>
            {years.map((y) => <QuintileGrid key={y} year={y} pupils={pupils.filter((p) => p.year === y)} onPick={(u) => { setPick(u); setYear(y); setZoom(2); setTab("view"); }} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Sky({ pupils, pick, onPick }) {
  const W = 640, H = 420, cx = W / 2, cy = H / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Year constellation: each point a pupil, distance from centre is concern">
      {[54, 108, 162].map((r, i) => <ellipse key={r} cx={cx} cy={cy} rx={r * 1.55} ry={r} fill="none" stroke="rgba(106,12,160,.10)" strokeDasharray="1 6" strokeLinecap="round" />)}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill={MUTED_}>on track</text>
      {pupils.map((p, i) => {
        const c = p.concern ?? 50;
        const r = 30 + (100 - c) * 1.55; /* further out = more concern */
        const a = (i * 137.508 * Math.PI) / 180;
        const x = cx + r * 1.55 * Math.cos(a), y = cy + r * Math.sin(a);
        const on = pick === p.upn;
        return (
          <g key={p.upn} onClick={() => onPick(p.upn)} style={{ cursor: "pointer" }}>
            {on && <circle cx={x} cy={y} r="15" fill="rgba(198,160,53,.25)" />}
            <circle cx={x} cy={y} r={p.band === 2 ? 6.5 : 5} fill={DIR_[p.dir]} stroke="#fff" strokeWidth="1.6" opacity={p.conf === "thin" ? 0.45 : 0.92} />
            {p.capped && <circle cx={x} cy={y} r="9.5" fill="none" stroke={DIR_.declining} strokeWidth="1.2" strokeDasharray="2 3" />}
          </g>
        );
      })}
    </svg>
  );
}
const DIR_ = { improving: "#2F7A39", steady: "#C6A035", declining: "#B3261E" };
const MUTED_ = "#6F6580";

function Bar({ label, v, family }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}><span>{label}</span><b style={{ fontVariantNumeric: "tabular-nums" }}>{v == null ? "no evidence yet" : v}</b></div>
      <div style={{ height: 7, borderRadius: 999, background: "#F4EEFA", marginTop: 3 }}>
        {v != null && <div style={{ height: "100%", width: `${v}%`, borderRadius: 999, background: family === "prov" ? "linear-gradient(90deg,#C6A035,#8a6d1c)" : "linear-gradient(90deg,#6A0CA0,#4B0875)" }} />}
      </div>
    </div>
  );
}

function PupilPanel({ p }) {
  return (
    <div style={{ ...card, alignSelf: "start" }}>
      <div style={kick}>{p.name} · Year {p.year}{p.reg ? ` · ${p.reg}` : ""}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0 4px", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 21 }}>{p.band != null ? BANDS[p.band] : "Awaiting evidence"}</span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: DIR_[p.dir] }}>{p.dir}</span>
        <span style={{ fontSize: 11, color: MUTED_, background: "#F4EEFA", borderRadius: 999, padding: "3px 10px" }}>evidence: {p.conf} ({p.evCount})</span>
      </div>
      {p.capped && <p style={{ fontSize: 12, color: "#B3261E", margin: "2px 0 8px" }}>Held visible by the no-compensation rule: strength elsewhere cannot average away the core concern.</p>}
      {p.priorQ && p.nowQ && <p style={{ fontSize: 12.5, color: MUTED_, margin: "2px 0 10px" }}>Started in the {["", "bottom", "second", "middle", "fourth", "top"][p.priorQ]} fifth of the cohort; now performing in the {["", "bottom", "second", "middle", "fourth", "top"][p.nowQ]} fifth.</p>}
      <div style={{ ...kick, marginTop: 8 }}>How the pupil is doing</div>
      <Bar label="Progress" v={p.progress} /><Bar label="Attendance" v={p.attendance} /><Bar label="Engagement" v={p.engagement} />
      <div style={{ ...kick, marginTop: 10 }}>What the school is doing</div>
      <Bar label="Enrichment" v={p.enrichment} family="prov" /><Bar label="Interventions" v={p.interventions} family="prov" />
      {p.wins?.length > 1 && (
        <>
          <div style={{ ...kick, marginTop: 10 }}>Percentile across assessment windows</div>
          <svg viewBox="0 0 300 70" width="100%">
            <line x1="8" y1="60" x2="292" y2="60" stroke="rgba(106,12,160,.15)" />
            {p.perWin.map((v, i) => v != null && (
              <g key={i}>
                <circle cx={16 + (i * 270) / Math.max(1, p.perWin.length - 1)} cy={60 - v * 0.5} r="4" fill="#6A0CA0" />
                {i > 0 && p.perWin[i - 1] != null && <line x1={16 + ((i - 1) * 270) / Math.max(1, p.perWin.length - 1)} y1={60 - p.perWin[i - 1] * 0.5} x2={16 + (i * 270) / Math.max(1, p.perWin.length - 1)} y2={60 - v * 0.5} stroke="#6A0CA0" strokeWidth="2" />}
              </g>
            ))}
          </svg>
        </>
      )}
      {p.nowAtt != null && <p style={{ fontSize: 12, color: MUTED_, margin: "6px 0 0" }}>Attendance {p.nowAtt}% against an expectation of {p.expected}%{p.trend ? `, moving ${p.trend > 0 ? "+" : ""}${Math.round(p.trend * 10) / 10} points` : ""}.{p.trips ? ` ${p.trips} enrichment event${p.trips > 1 ? "s" : ""} this year.` : ""}{p.ivs?.length ? ` In: ${p.ivs.join(", ")}.` : ""}</p>}
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
