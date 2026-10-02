/* Constellation core — the Measurement Guide, executable.
   The AI reads, the maths counts: everything in this file is deterministic,
   every figure traceable to a source upload, and nothing leaves the browser. */

/* ── storage: IndexedDB, per school, on this device only ── */
const DB = (schoolId) => new Promise((res, rej) => {
  const r = indexedDB.open("asi-constellation-" + schoolId, 1);
  r.onupgradeneeded = () => r.result.createObjectStore("kv");
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
export async function loadState(schoolId) {
  try {
    const db = await DB(schoolId);
    return await new Promise((res) => {
      const t = db.transaction("kv").objectStore("kv").get("state");
      t.onsuccess = () => res(t.result || null); t.onerror = () => res(null);
    });
  } catch { return null; }
}
export async function saveState(schoolId, state) {
  try {
    const db = await DB(schoolId);
    db.transaction("kv", "readwrite").objectStore("kv").put(state, "state");
  } catch { /* best effort */ }
}
export const blankState = () => ({ roll: [], evidence: [], ledger: [], review: [], aliases: {} });

/* ── CSV: small, honest parser (quoted fields, CRLF) ── */
export function parseCSV(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (cell !== "" || row.length) { row.push(cell); rows.push(row); row = []; cell = ""; } }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

/* ── stage 2, offline edition: read the headers, log every assumption ── */
const HEADS = {
  upn: /^upn$|unique pupil/i, name: /pupil ?name|^name$|full ?name|surname.?forename|student/i,
  forename: /forename|first ?name/i, surname: /surname|last ?name/i,
  dob: /dob|date of birth|birth ?date/i, year: /year ?gro?u?p?$|^yr$|^year$|nc ?year/i,
  reg: /reg|form|tutor ?group|class$/i, prior: /ks2|prior|baseline|cat4?|sats/i,
  att: /attendance ?%|% ?att|attendance$/i, sessions: /sessions|possible/i, absent: /absen/i, unauth: /unauth/i,
  subject: /subject|course/i, score: /score|mark\b|grade|gcse|result/i,
  date: /date$|window|term|assessment ?(point|date)/i,
  praise: /praise|achievement ?points|positive/i, sanction: /sanction|behaviour ?points|negative|demerit/i,
  homework: /homework|completion/i, event: /trip|visit|event|club|activity|enrichment/i,
  intervention: /intervention|programme|tuition|support ?group/i, dosage: /attended|dosage|sessions ?attended/i,
  ppg: /ppg|pupil ?premium|disadvantag|fsm/i, sen: /sen|ehcp/i,
};
export function readHeaders(headerRow) {
  const map = {}, assumptions = [];
  headerRow.forEach((h, i) => {
    const hh = (h || "").trim();
    for (const [k, re] of Object.entries(HEADS)) if (re.test(hh) && map[k] == null) { map[k] = i; return; }
  });
  if (map.name == null && map.forename != null && map.surname != null) { map.name = -1; assumptions.push("name assembled from surname + forename"); }
  return { map, assumptions };
}
export function classify(map) {
  if (map.att != null || (map.sessions != null && map.absent != null)) return "attendance";
  if (map.score != null && (map.subject != null || map.date != null || map.name != null || map.upn != null)) return "assessment";
  if (map.praise != null || map.sanction != null || map.homework != null) return "engagement";
  if (map.intervention != null) return "intervention";
  if (map.event != null) return "enrichment";
  if (map.upn != null && (map.year != null || map.dob != null)) return "roll";
  return "unknown";
}
const cellName = (r, map) => map.name === -1 ? `${(r[map.surname] || "").trim()}, ${(r[map.forename] || "").trim()}` : (r[map.name] || "").trim();
const normName = (s) => (s || "").toLowerCase().replace(/[^a-z]/g, "");
const normDob = (s) => { const m = (s || "").match(/(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{1,4})/); if (!m) return ""; let [, a, b, c] = m; if (a.length === 4) return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`; return `${c.length === 2 ? "20" + c : c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`; };
export const validUPN = (u) => /^[A-Z]\d{12}$/i.test((u || "").trim());

/* ── stage 3: the matching ladder — strongest first, ask below threshold ── */
export function matchPupil(row, map, roll, aliases = {}, scopeYear = null) {
  const upn = map.upn != null ? (row[map.upn] || "").trim().toUpperCase() : "";
  if (upn) { const p = roll.find((x) => x.upn === upn); if (p) return { upn: p.upn, rule: 1, conf: "certain" }; }
  const nm = normName(cellName(row, map));
  if (!nm) return null;
  if (aliases[nm]) return { upn: aliases[nm], rule: 0, conf: "resolved" };
  const dob = map.dob != null ? normDob(row[map.dob]) : "";
  if (dob) { const hits = roll.filter((p) => p._nm === nm && p.dob === dob); if (hits.length === 1) return { upn: hits[0].upn, rule: 2, conf: "high" }; }
  const pool = scopeYear != null ? roll.filter((p) => p.year === scopeYear) : roll;
  const reg = map.reg != null ? (row[map.reg] || "").trim().toLowerCase() : "";
  if (reg) { const hits = pool.filter((p) => p._nm === nm && (p.reg || "").toLowerCase() === reg); if (hits.length === 1) return { upn: hits[0].upn, rule: 3, conf: "good" }; }
  const yr = map.year != null ? String(row[map.year] || "").replace(/\D/g, "") : "";
  const loose = pool.filter((p) => (p._nm === nm || p._nm.includes(nm) || nm.includes(p._nm)) && (!yr || String(p.year) === yr));
  if (loose.length === 1 && loose[0]._nm === nm) return { upn: loose[0].upn, rule: 3, conf: "good" };
  if (loose.length >= 1) return { review: true, name: cellName(row, map), candidates: loose.slice(0, 4).map((p) => ({ upn: p.upn, name: p.name, reg: p.reg })) };
  return null;
}

/* ── ingest: one file → roll rows or evidence facts + a ledger entry ── */
export function ingest(state, fileName, text, opts = {}) {
  const scopeYear = opts.year ?? null;
  const rows = parseCSV(text);
  if (rows.length < 2) return { ...state, ledger: [{ file: fileName, kind: "unreadable", matched: 0, of: 0, assumptions: ["no rows found"], date: today() }, ...state.ledger] };
  const { map, assumptions } = readHeaders(rows[0]);
  if (rows[0].some((c) => /gcse|final grade|results? 20\d\d/i.test(String(c)))) assumptions.push("contains final outcomes: if this is a finished cohort it is self-evaluation and belongs in Lens, not here");
  const kind = classify(map);
  const body = rows.slice(1);
  const led = { file: fileName, kind, matched: 0, of: body.length, assumptions, held: 0, date: today(), scope: scopeYear, years: [] };

  if (kind === "roll") {
    const roll = [...state.roll];
    body.forEach((r) => {
      const upn = (r[map.upn] || "").trim().toUpperCase();
      if (!validUPN(upn)) { led.held++; return; }
      const p = {
        upn, name: cellName(r, map) || upn, dob: map.dob != null ? normDob(r[map.dob]) : "",
        year: map.year != null ? Number(String(r[map.year]).replace(/\D/g, "")) || null : null,
        reg: map.reg != null ? (r[map.reg] || "").trim() : "",
        prior: map.prior != null ? num(r[map.prior]) : null,
        ppg: map.ppg != null ? /^(y|1|true|fsm|pp)/i.test((r[map.ppg] || "").trim()) : false,
        sen: map.sen != null ? /^(y|1|true|e|k|ehcp|sen)/i.test((r[map.sen] || "").trim()) : false,
      };
      p._nm = normName(p.name);
      const i = roll.findIndex((x) => x.upn === upn);
      if (i >= 0) roll[i] = { ...roll[i], ...p }; else roll.push(p);
      led.matched++;
    });
    if (led.held) led.assumptions = [...assumptions, `${led.held} rows held: UPN missing or malformed`];
    led.years = [...new Set(roll.map((p) => p.year).filter(Boolean))].sort((a, b) => a - b);
    return { ...state, roll, ledger: [led, ...state.ledger] };
  }

  if (kind === "unknown" || !state.roll.length) {
    led.assumptions = [...assumptions, !state.roll.length ? "no roll yet: upload the MIS roll first, it is the spine" : "could not classify the columns"];
    return { ...state, ledger: [led, ...state.ledger] };
  }

  const evidence = [...state.evidence]; const review = [...state.review];
  body.forEach((r) => {
    const m = matchPupil(r, map, state.roll, state.aliases, scopeYear);
    if (!m) { led.held++; return; }
    if (m.review) { led.held++; review.push({ file: fileName, kind, name: m.name, candidates: m.candidates, row: r, mapKeys: map }); return; }
    led.matched++;
    const base = { upn: m.upn, file: fileName, conf: m.conf, date: today() };
    if (kind === "assessment") evidence.push({ ...base, t: "assessment", subject: map.subject != null ? r[map.subject] : fileName.replace(/\.[^.]+$/, ""), score: num(r[map.score]), when: map.date != null ? (r[map.date] || "").trim() : fileName });
    if (kind === "attendance") evidence.push({ ...base, t: "attendance", pct: map.att != null ? num(r[map.att]) : pctFrom(r, map), unauth: map.unauth != null ? num(r[map.unauth]) : null, when: map.date != null ? (r[map.date] || "").trim() : "current" });
    if (kind === "engagement") evidence.push({ ...base, t: "engagement", praise: num(r[map.praise]), sanction: num(r[map.sanction]), homework: num(r[map.homework]) });
    if (kind === "enrichment") evidence.push({ ...base, t: "enrichment", what: map.event != null ? (r[map.event] || "").trim() : fileName, when: map.date != null ? (r[map.date] || "").trim() : "" });
    if (kind === "intervention") evidence.push({ ...base, t: "intervention", what: (r[map.intervention] || "").trim(), dosage: map.dosage != null ? num(r[map.dosage]) : null });
  });
  const touched = new Set(evidence.slice(state.evidence.length).map((e) => e.upn));
  led.years = [...new Set(state.roll.filter((p) => touched.has(p.upn)).map((p) => p.year).filter(Boolean))].sort((a, b) => a - b);
  return { ...state, evidence, review, ledger: [led, ...state.ledger] };
}
const num = (v) => { const n = parseFloat(String(v ?? "").replace(/[%\s]/g, "")); return isFinite(n) ? n : null; };
const pctFrom = (r, map) => { const s = num(r[map.sessions]), a = num(r[map.absent]); return s ? Math.round(1000 * (s - (a || 0)) / s) / 10 : null; };
const today = () => new Date().toLocaleDateString("en-GB");

/* ── the measures ── */
const pctile = (v, sorted) => { if (v == null || !sorted.length) return null; let i = 0; while (i < sorted.length && sorted[i] <= v) i++; return Math.round((100 * (i - 0.5)) / sorted.length); };
const quintile = (p) => (p == null ? null : Math.min(5, Math.floor(p / 20) + 1));
export const BANDS = ["On track", "Some concern", "Serious concern"];
const bandOf = (s) => (s == null ? null : s >= 62 ? 0 : s >= 40 ? 1 : 2);

export function computeAll(state) {
  const byYear = {};
  state.roll.forEach((p) => { (byYear[p.year] = byYear[p.year] || []).push(p); });
  const out = {};
  for (const [year, cohort] of Object.entries(byYear)) {
    const priorSorted = cohort.map((p) => p.prior).filter((v) => v != null).sort((a, b) => a - b);
    const small = cohort.length < 30;
    /* assessment windows: within-cohort percentile per (subject, when), averaged per pupil */
    const ev = state.evidence;
    const wins = [...new Set(ev.filter((e) => e.t === "assessment" && e.when !== "prior" && cohort.some((p) => p.upn === e.upn)).map((e) => e.when))].sort();
    const scoreSets = {};
    ev.forEach((e) => { if (e.t === "assessment" && e.score != null) { const k = e.subject + "|" + e.when; (scoreSets[k] = scoreSets[k] || []).push(e); } });
    for (const k in scoreSets) scoreSets[k].sorted = scoreSets[k].map((e) => e.score).sort((a, b) => a - b);
    for (const p of cohort) {
      const mine = ev.filter((e) => e.upn === p.upn);
      /* progress */
      const perWin = wins.map((w) => {
        const es = mine.filter((e) => e.t === "assessment" && e.when === w && e.score != null);
        const ps = es.map((e) => pctile(e.score, scoreSets[e.subject + "|" + w].sorted)).filter((x) => x != null);
        return ps.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ps.length) : null;
      });
      const curP = [...perWin].reverse().find((x) => x != null) ?? null;
      const priorP = pctile(p.prior, priorSorted);
      const lastTwo = perWin.filter((x) => x != null).slice(-2);
      const dirP = lastTwo.length === 2 ? lastTwo[1] - lastTwo[0] : 0; /* one point never makes a direction */
      const gap = curP != null && priorP != null ? curP - priorP : null;
      const progress = curP == null ? null : clamp(50 + 0.6 * (gap ?? 0) + 0.4 * dirP * (small ? 0.6 : 1));
      /* attendance: level vs own prior 50 / trend 30 / pattern 20 */
      const att = mine.filter((e) => e.t === "attendance" && e.pct != null);
      const cur = att.filter((e) => e.when !== "prior");
      const priorAtt = att.find((e) => e.when === "prior")?.pct ?? null;
      const nowAtt = cur.length ? cur[cur.length - 1].pct : null;
      const expected = priorAtt ?? 95;
      const trend = cur.length >= 2 ? cur[cur.length - 1].pct - cur[0].pct : 0;
      const unauthShare = cur.length && cur[cur.length - 1].unauth != null && nowAtt < 100 ? cur[cur.length - 1].unauth : 0;
      const attendance = nowAtt == null ? null : clamp(0.5 * (50 + 6 * (nowAtt - expected)) + 0.3 * (50 + 8 * trend) + 0.2 * (50 - 4 * unauthShare) + (nowAtt >= 96 ? 12 : 0));
      /* engagement: proxy, lower confidence */
      const eng = mine.filter((e) => e.t === "engagement");
      const praise = sum(eng, "praise"), sanction = sum(eng, "sanction"), hw = avg(eng, "homework");
      const ratio = praise != null || sanction != null ? (praise || 0) / Math.max(1, (praise || 0) + (sanction || 0)) : null;
      const engagement = ratio == null && hw == null ? null : clamp(0.55 * (ratio == null ? 50 : ratio * 100) + 0.45 * (hw == null ? 50 : hw));
      /* provision */
      const trips = mine.filter((e) => e.t === "enrichment").length;
      const enrichment = state.evidence.some((e) => e.t === "enrichment") ? (trips > 0 ? clamp(70 + Math.min(3, trips - 1) * 8) : 0) : null;
      const ivs = mine.filter((e) => e.t === "intervention");
      const needs = (progress != null && progress < 40) || (attendance != null && attendance < 40);
      const dosageOk = ivs.some((e) => e.dosage == null || e.dosage > 0);
      const interventions = needs ? (ivs.length ? (dosageOk ? 78 : 35) : 0) : (ivs.length ? 85 : null);
      /* concern: outcomes only, then the rule that refuses to lose children */
      const parts = [[progress, 0.4], [attendance, 0.4], [engagement, 0.2]].filter(([v]) => v != null);
      const wsum = parts.reduce((a, [, w]) => a + w, 0);
      let concern = parts.length ? Math.round(parts.reduce((a, [v, w]) => a + v * w, 0) / wsum) : null;
      let band = bandOf(concern);
      const worstCore = Math.max(bandOf(attendance) ?? 0, bandOf(progress) ?? 0);
      let capped = false;
      if (band != null && worstCore - band > 1) { band = worstCore - 1; capped = true; }
      const dir = (progress != null && dirP < -6) || trend < -1.5 ? "declining" : (dirP > 6 || trend > 1.5) ? "improving" : "steady";
      const evCount = mine.length;
      out[p.upn] = { ...p, year: Number(year), progress, attendance, engagement, enrichment, interventions,
        concern, band, capped, dir, priorQ: quintile(priorP), nowQ: quintile(curP), curP, priorP, perWin, wins,
        nowAtt, expected, trend, trips, ivs: ivs.map((e) => e.what), conf: evCount >= 6 ? "solid" : evCount >= 3 ? "forming" : "thin", evCount };
    }
  }
  return out;
}
const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
const sum = (es, k) => { const v = es.map((e) => e[k]).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) : null; };
const avg = (es, k) => { const v = es.map((e) => e[k]).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

/* ── insights: the groups the averages would lose ── */
export function findSignals(computed) {
  const ps = Object.values(computed);
  const sig = [];
  const unreached = ps.filter((p) => p.dir === "declining" && ((p.interventions ?? null) === 0 || (p.enrichment ?? null) === 0));
  if (unreached.length) sig.push({ title: `${unreached.length} pupils declining whom nothing currently reaches`, detail: "Falling outcomes with empty provision: the flag this instrument exists for.", upns: unreached.map((p) => p.upn), tone: "bad" });
  const capped = ps.filter((p) => p.capped);
  if (capped.length) sig.push({ title: `${capped.length} pupils held visible by the no-compensation rule`, detail: "Strong elsewhere, collapsing in one core measure: averages would have hidden them.", upns: capped.map((p) => p.upn), tone: "warn" });
  const fallen = ps.filter((p) => p.priorQ && p.nowQ && p.nowQ <= p.priorQ - 2);
  if (fallen.length) sig.push({ title: `${fallen.length} pupils two or more fifths below their start`, detail: "Started higher in their cohort than they now perform: the quintile grid names each one.", upns: fallen.map((p) => p.upn), tone: "warn" });
  const pp = ps.filter((p) => p.ppg), rest = ps.filter((p) => !p.ppg);
  const medC = (a) => { const v = a.map((p) => p.concern).filter((x) => x != null).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : null; };
  if (pp.length >= 5 && medC(pp) != null && medC(rest) != null && medC(rest) - medC(pp) >= 10)
    sig.push({ title: "Disadvantaged pupils sit meaningfully further out", detail: `Median concern ${medC(pp)} against ${medC(rest)} for the rest: the gap is in this room, not an abstraction.`, upns: pp.map((p) => p.upn), tone: "warn" });
  if (!sig.length && ps.length) sig.push({ title: "No group currently flagged", detail: "The signals watch for decline without provision, capped bands, and quintile falls. Keep the evidence coming.", upns: [], tone: "ok" });
  return sig;
}
