/* Constellation — every child in view. School View zooms from the whole school
   to the single pupil; Uploads is the intake with its ledger and review queue;
   Insights is the signal board. All of it on this device only. */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../lib/auth.jsx";
import { loadState, saveState, blankState, ingest, computeAll, findSignals, rowsToCsv, BANDS } from "./model.js";

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
            if (aoa.length > hRow + 1) s = ingest(s, f.name + (wb.SheetNames.length > 1 ? " \u00b7 " + sn : ""), rowsToCsv(aoa.slice(hRow)), { year: upYear });
          }
        } catch (e) {
          s = { ...s, ledger: [{ file: f.name, kind: "unreadable", matched: 0, of: 0, assumptions: ["could not open workbook: " + (e?.message || e)], date: new Date().toLocaleDateString("en-GB") }, ...s.ledger] };
        }
      } else s = ingest(s, f.name, await f.text(), { year: upYear });
    }
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 14px", flexWrap: "wrap" }}>
              <span style={kick}>Year group</span>
              <button onClick={() => setYear(null)} style={chip(year == null, DEEP)}>{"All"}</button>
              {years.map((y, i) => (
                <button key={y} onClick={() => setYear(year === y ? null : y)} style={chip(year === y, YEARC[i % YEARC.length])}>
                  <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: YEARC[i % YEARC.length], marginRight: 6 }} />Y{y}
                </button>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 11.5, color: MUTED }}>outline: <i style={dotk("#2F7A39")} />improving · <i style={dotk("#B3261E")} />declining</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: chosen ? "1.15fr 1fr" : "1fr", gap: 18 }}>
              <div style={{ ...card, padding: "26px 28px" }}>
                <div style={kick}>The school against its issues · a child sits where their sharpest concern lives</div>
                <ThemeSky pupils={pupils} years={years} yearFilter={year} pick={pick} onPick={setPick} />
                <p style={{ fontSize: 11.5, color: MUTED, margin: "8px 0 0" }}>The centre is on track. Each sector is an issue; distance is how serious it has become; colour is the year group, so one glance answers whether an issue belongs to a year or to the school. No child collapsing in a core measure can be averaged back to the middle.</p>
              </div>
              {chosen && <PupilPanel p={chosen} />}
            </div>
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
              <label style={{ display: "block", border: `1.5px dashed rgba(106,12,160,.35)`, borderRadius: 14, padding: "26px 18px", textAlign: "center", cursor: "pointer", margin: "8px 0 6px", background: LILAC, color: DEEP, fontWeight: 600, fontSize: 13.5 }}>
                Drop files or click to choose
                <input type="file" multiple accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={(e) => onFiles([...e.target.files])} />
              </label>
              <p style={{ fontSize: 11.5, color: MUTED }}>Read and scored entirely in your browser; nothing is transmitted. {state.ledger.length ? `Saved on this device: ${state.ledger.length} file${state.ledger.length > 1 ? "s" : ""} in the ledger.` : ""}</p>
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
                      <b>{l.file}</b> · read as <b style={{ color: DEEP }}>{l.kind}</b> · {l.matched}/{l.of} matched{l.held ? `, ${l.held} held` : ""} · {l.date}
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
                    {s.upns.slice(0, 10).map((u) => <button key={u} onClick={() => { setPick(u); setYear(null); setTab("view"); }} style={{ border: "none", cursor: "pointer", background: LILAC, color: DEEP, borderRadius: 999, padding: "4px 11px", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit" }}>{computed[u].name.split(",")[0]}</button>)}
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

const THEMES = [
  ["Attendance", (p) => p.attendance],
  ["Progress", (p) => p.progress],
  ["Engagement", (p) => p.engagement],
];
function place(p) {
  const scored = THEMES.map(([t, f], i) => [i, f(p)]).filter(([, v]) => v != null);
  if (!scored.length) return { centre: true, none: true };
  const [ti, v] = scored.reduce((a, b) => (b[1] < a[1] ? b : a));
  if (v >= 62) return { centre: true };
  return { ti, sev: (62 - v) / 62 };
}
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

function ThemeSky({ pupils, years, yearFilter, pick, onPick }) {
  const W = 680, H = 470, cx = W / 2, cy = H / 2 + 8;
  const GAP = 0.14, SPAN = (2 * Math.PI) / 3;
  const start = (i) => -Math.PI / 2 + i * SPAN + GAP / 2;
  const yc = (y) => YEARC[years.indexOf(y) % YEARC.length];
  const placed = pupils.map((p) => ({ p, at: place(p) }));
  const counts = THEMES.map(([t], i) => {
    const inS = placed.filter(({ at }) => at.ti === i);
    return { t, n: inS.length, up: inS.filter(({ p }) => p.dir === "improving").length, down: inS.filter(({ p }) => p.dir === "declining").length };
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="The school against its issues: sectors are themes, dots are children coloured by year group">
      {[70, 120, 170].map((r) => <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(106,12,160,.10)" strokeDasharray="1 6" strokeLinecap="round" />)}
      {[0, 1, 2].map((i) => {
        const a = -Math.PI / 2 + i * SPAN;
        return <line key={i} x1={cx + 46 * Math.cos(a - GAP / 2)} y1={cy + 46 * Math.sin(a - GAP / 2)} x2={cx + 186 * Math.cos(a - GAP / 2)} y2={cy + 186 * Math.sin(a - GAP / 2)} stroke="rgba(106,12,160,.14)" />;
      })}
      <circle cx={cx} cy={cy} r="42" fill="#F4EEFA" opacity=".6" />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize="10.5" fill="#6F6580">on track</text>
      {counts.map((c, i) => {
        const mid = -Math.PI / 2 + i * SPAN + SPAN / 2;
        const lx = cx + 208 * Math.cos(mid), ly = cy + 205 * Math.sin(mid);
        return (
          <g key={c.t} textAnchor="middle">
            <text x={lx} y={ly} fontFamily="Fraunces, serif" fontWeight="600" fontSize="15" fill="#221233">{c.t}</text>
            <text x={lx} y={ly + 15} fontSize="10.5" fill="#6F6580">{c.n} pupil{c.n === 1 ? "" : "s"}{c.n ? ` · ${c.up} improving, ${c.down} declining` : ""}</text>
          </g>
        );
      })}
      {placed.map(({ p, at }, i) => {
        if (at.none) return null;
        const dim = yearFilter != null && p.year !== yearFilter;
        let x, y;
        if (at.centre) { const a = (hash(p.upn) % 360) * Math.PI / 180, r = 6 + (hash(p.upn) % 30); x = cx + r * Math.cos(a); y = cy + r * Math.sin(a); }
        else { const a = start(at.ti) + (SPAN - GAP) * ((hash(p.upn) % 1000) / 1000); const r = 56 + at.sev * 122; x = cx + r * Math.cos(a); y = cy + r * Math.sin(a); }
        const on = pick === p.upn;
        const stroke = p.dir === "improving" ? "#2F7A39" : p.dir === "declining" ? "#B3261E" : "#fff";
        return (
          <g key={p.upn} onClick={() => !dim && onPick(p.upn)} style={{ cursor: dim ? "default" : "pointer" }} opacity={dim ? 0.09 : 1}>
            {on && <circle cx={x} cy={y} r="14" fill="rgba(198,160,53,.28)" />}
            <circle cx={x} cy={y} r={p.band === 2 ? 6.3 : 5} fill={yc(p.year)} stroke={stroke} strokeWidth="2" opacity={p.conf === "thin" ? 0.5 : 0.94} />
            {p.capped && <circle cx={x} cy={y} r="9.5" fill="none" stroke="#B3261E" strokeWidth="1.1" strokeDasharray="2 3" />}
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

let xlsxP = null;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve();
  if (xlsxP) return xlsxP;
  xlsxP = new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = "/lens/js/vendor-xlsx.js?v=7"; sc.onload = res; sc.onerror = () => rej(new Error("Excel reader failed to load")); document.head.appendChild(sc); });
  return xlsxP;
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
