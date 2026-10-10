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
export function rowsToCsv(aoa) {
  return aoa.map((r) => r.map((c) => '"' + String(c ?? "").replace(/"/g, '""') + '"').join(",")).join("\n");
}
export const blankState = () => ({ roll: [], evidence: [], ledger: [], review: [], aliases: {}, dialects: {} });

/* ── CSV: small, honest parser (quoted fields, CRLF) ── */
export function parseCSV(text) {
  text = String(text).replace(/^\uFEFF/, "");
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
const WINDOW_RE = /(michaelmas|lenten|trinity|autumn|spring|summer|advent|ap ?\d|term ?\d|assessment ?\d)/i;
const HEADS = {
  upn: /^(?!.*(former|previous|old))(.*\bupn\b|unique pupil.*)$/i, name: /^((legal|preferred|pupil|student) )?(full )?name$|pupil ?name|student ?name|surname.?forename/i,
  forename: /forename|first ?name/i, surname: /surname|last ?name/i,
  dob: /dob|date of birth|birth ?date/i, year: /year ?gro?u?p?$|^yr$|^year$|nc ?year/i,
  reg: /^reg(istration)? ?(group)?$|^form( group)?$|^tutor ?(group)?$|^class$/i,
  ks2read: /ks2.*read(ing)?|read(ing)?.*(ks2|scaled)/i,
  ks2em: /ks2.*(e ?& ?m|\bem\b|band|combined|eng?(lish)? ?(&|and|\+|\/) ?ma(ths)?)/i,
  cats: /\bcats? ?-? ?mean\b|cat4 ?mean|mean ?cats?\b/i,
  prior: /ks2|prior|baseline|cat4?|sats/i,
  attPlus: /% ?present ?\+ ?aea/i,
  att: /attendance ?%|% ?att(end)?|attendance$|percent(age)? ?attend|attend(ance)? ?pct|% ?present$/i, sessions: /sessions|possible/i, absent: /absen/i, unauth: /% ?unauth/i,
  subject: /subject|course/i, score: /score|mark\b|grade|gcse|result/i,
  date: /date$|window|term|assessment ?(point|date)/i,
  praise: /praise|achievement ?points|positive/i, sanction: /sanction|behaviour ?points|negative|demerit/i,
  homework: /homework|completion/i, event: /trip|visit|event|club|activity|enrichment/i,
  intervention: /intervention|programme|tuition|support ?group/i, dosage: /attended|dosage|sessions ?attended/i,
  ppg: /ppg|pupil ?premium|\bpp\b|disadvantag/i, fsm: /fsm/i, eal: /\beal\b|english as ?(an )?additional/i, ehcp: /\behcp\b/i, sen: /sen|ehcp/i, gender: /^(gender|sex)$/i,
};
export function readHeaders(headerRow, body) {
  const map = {}, assumptions = [];
  headerRow.forEach((h, i) => {
    const hh = (h || "").trim();
    for (const [k, re] of Object.entries(HEADS)) if (re.test(hh) && map[k] == null) { map[k] = i; return; }
  });
  if (map.name == null && map.forename != null && map.surname != null) { map.name = -1; assumptions.push("name assembled from surname + forename"); }
  /* a name column must actually vary: if it collapses, pick the name-ish column with most distinct values */
  if (body && body.length >= 8 && map.name != null && map.name >= 0) {
    const uniq = (i) => new Set(body.slice(0, 60).map((r) => (r[i] || "").trim())).size;
    if (uniq(map.name) < Math.min(body.length, 60) * 0.5) {
      let best = -1, bestU = 0;
      headerRow.forEach((hd, i) => { if (/name/i.test(String(hd)) && !/status|type|flag|file/i.test(String(hd))) { const u = uniq(i); if (u > bestU) { bestU = u; best = i; } } });
      if (best >= 0 && best !== map.name) { map.name = best; assumptions.push("name column re-chosen by distinctness"); }
      else if (map.forename != null && map.surname != null) { map.name = -1; assumptions.push("name assembled from surname + forename"); }
    }
  }
  return { map, assumptions };
}
export function classify(map) {
  if (map.att != null || map.attPlus != null || (map.sessions != null && map.absent != null)) return "attendance";
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
export const validUPN = (u) => /^[A-Z]\d{12}$/i.test((u || "").trim()) || /^[A-Z]\d{11}[A-Z]$/i.test((u || "").trim());

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

/* ── ingest: one file → roll rows or evidence facts + a ledger entry ──
   `forced` is the reading slip's word: {kind, map, notes} overrides what the
   reader would have decided, and the notes land in the ledger as provenance. */
export function ingest(state, fileName, text, opts = {}, forced = null) {
  const prev = state.ledger.find((l) => l.file === fileName);
  if (prev) state = prev.kind === "roll" ? { ...state, ledger: state.ledger.filter((l) => l !== prev) } : removeUpload(state, prev);
  const scopeYear = opts.year ?? null;
  const note = (opts.note || "").trim().slice(0, 240) || null;
  const rows = parseCSV(text);
  if (rows.length < 2) return { ...state, ledger: [{ file: fileName, kind: "unreadable", matched: 0, of: 0, assumptions: ["no rows found"], date: today() }, ...state.ledger] };
  const { map, assumptions } = readHeaders(rows[0], rows.slice(1));
  if (forced && forced.map) Object.assign(map, forced.map);
  if (forced && forced.notes && forced.notes.length) assumptions.push(...forced.notes);
  if (rows[0].some((c) => /gcse|final grade|results? 20\d\d/i.test(String(c)))) assumptions.push("contains final outcomes: if this is a finished cohort it is self-evaluation and belongs in Lens, not here");
  const idCols = new Set(Object.values(map));
  const numericish = (i) => rows.slice(1, 12).filter((r) => isFinite(parseFloat(String(r[i]).replace(/[%\s]/g, "")))).length >= 3;
  let windowCols = rows[0].map((hd, i) => ({ h: (hd || "").trim(), i })).filter((c) => WINDOW_RE.test(c.h) && numericish(c.i));
  /* wide single-point sheets: many subject columns, no term words (end-of-year grades) */
  if (windowCols.length < 2 && classify(map) !== "roll" && !/attend|behaviou?r|conduct/i.test(fileName)) {
    const wideId = new Set(Object.entries(map).filter(([k]) => k !== "score" && k !== "subject").map(([, i]) => i));
    const wide = rows[0].map((hd, i) => ({ h: (hd || "").trim(), i })).filter((c) => c.h && !wideId.has(c.i) && numericish(c.i) && !/ks2|cat|prior|baseline|admission|adno|upn|house|point/i.test(c.h));
    if (wide.length >= 3 && (map.upn != null || map.name != null)) windowCols = wide.map((c) => ({ ...c, single: true }));
  }
  let kind = (forced && forced.kind) || classify(map);
  if (!(forced && forced.kind) && kind !== "roll" && windowCols.length >= 2 && (map.upn != null || map.name != null)) kind = "tracker";
  if (!(forced && forced.kind) && /attend|behaviou?r|conduct/i.test(fileName) && (kind === "tracker" || kind === "assessment" || kind === "unknown")) {
    const canAtt = map.att != null || map.attPlus != null || (map.sessions != null && map.absent != null);
    if (kind !== "unknown") kind = canAtt ? "attendance" : "unknown";
    assumptions.push(kind === "attendance"
      ? "file named as attendance: read as attendance, never as assessments"
      : "file named as attendance, but no attendance % or sessions column was recognised: stored unread rather than inventing assessments. Tell Claude the column names and the reader will learn them");
  }
  const winOf = (hd) => { const m = String(hd).match(WINDOW_RE); if (!m) return null; const y = String(hd).match(/\by(?:ea)?r? ?(\d{1,2})\b/i); return (y ? "Y" + y[1] + " " : "") + m[0]; };
  const subjOf = (hd, fallback) => { const s = String(hd).replace(WINDOW_RE, "").replace(/\by(?:ea)?r? ?\d{1,2}\b/i, "").replace(/[%\s\u00b7:-]+/g, " ").trim(); return s || fallback; };
  const body = rows.slice(1);
  const led = { file: fileName, kind, matched: 0, of: body.length, assumptions, held: 0, date: today(), scope: scopeYear, years: [], note };

  if (kind === "roll") {
    const roll = [...state.roll];
    const priorCol = map.prior ?? map.ks2em ?? map.cats; /* a specific baseline still anchors the quintiles */
    body.forEach((r) => {
      const upn = (r[map.upn] || "").trim().toUpperCase();
      if (!validUPN(upn)) { led.held++; (led.heldNames = led.heldNames || []).push(cellName(r, map) || "(no name)"); return; }
      const p = {
        upn, name: cellName(r, map) || upn, dob: map.dob != null ? normDob(r[map.dob]) : "",
        year: map.year != null ? Number(String(r[map.year]).replace(/\D/g, "")) || null : null,
        reg: map.reg != null ? (r[map.reg] || "").trim() : "",
        prior: priorCol != null ? num(r[priorCol]) : null,
        ks2em: map.ks2em != null ? num(r[map.ks2em]) : null,
        ks2read: map.ks2read != null ? num(r[map.ks2read]) : null,
        cats: map.cats != null ? num(r[map.cats]) : null,
        ehcp: map.ehcp != null ? /^(y|t|1|e)/i.test((r[map.ehcp] || "").trim()) : map.sen != null ? /^e/i.test((r[map.sen] || "").trim()) : false,
        ppg: map.ppg != null ? /^(y|t|1)/i.test((r[map.ppg] || "").trim()) : false,
        fsm: map.fsm != null ? /^(y|t|1)/i.test((r[map.fsm] || "").trim()) : false,
        eal: map.eal != null ? /^(y|t|1)/i.test((r[map.eal] || "").trim()) : false,
        sen: map.sen != null ? /^(y|t|1|e|k)/i.test((r[map.sen] || "").trim()) : false,
        gender: map.gender != null ? (/^(m|b)/i.test((r[map.gender] || "").trim()) ? "M" : /^(f|g)/i.test((r[map.gender] || "").trim()) ? "F" : null) : null,
      };
      p._nm = normName(p.name);
      /* a column this file lacks, or a blank cell, can never erase what is known */
      [["dob", map.dob], ["reg", map.reg], ["prior", priorCol], ["gender", map.gender], ["year", map.year], ["ks2em", map.ks2em], ["ks2read", map.ks2read], ["cats", map.cats]].forEach(([k, col]) => {
        if (col == null || p[k] == null || p[k] === "") delete p[k];
      });
      [["ppg", map.ppg], ["fsm", map.fsm], ["eal", map.eal], ["sen", map.sen], ["ehcp", map.ehcp ?? map.sen]].forEach(([k, col]) => { if (col == null) delete p[k]; });
      const i = roll.findIndex((x) => x.upn === upn);
      if (i >= 0) roll[i] = { ...roll[i], ...p }; else roll.push(p);
      led.matched++;
    });
    if (led.held) led.assumptions = [...assumptions, `${led.held} rows held, UPN missing or malformed (temporary UPNs are accepted; blanks are not): ${(led.heldNames || []).slice(0, 10).join(", ")}${led.held > 10 ? "\u2026" : ""}`];
    led.years = [...new Set(roll.map((p) => p.year).filter(Boolean))].sort((a, b) => a - b);
    return { ...state, roll, ledger: [led, ...state.ledger] };
  }

  if (kind === "unknown" || !state.roll.length) {
    const heads = rows[0].map((c) => String(c).trim()).filter(Boolean);
    led.assumptions = [...assumptions, !state.roll.length ? "no roll yet: upload the MIS roll first, it is the spine" : "could not classify the columns", `columns seen: ${heads.slice(0, 14).join(", ")}${heads.length > 14 ? ` and ${heads.length - 14} more` : ""}`];
    return { ...state, ledger: [led, ...state.ledger] };
  }

  const evidence = [...state.evidence]; const review = [...state.review];
  if (kind === "tracker") {
    const subject = fileName.replace(/\.[^.]+$/, "").replace(/\s*\u00b7.*$/, "").replace(/(tracker|data|20\d\d([_\/-]\d\d)?)/gi, "").trim() || "Tracker";
    const roll = state.roll.map((p) => ({ ...p }));
    let priorFilled = 0;
    body.forEach((r) => {
      const m = matchPupil(r, map, roll, state.aliases, scopeYear);
      if (!m) { led.held++; return; }
      if (m.review) { led.held++; review.push({ file: fileName, kind, name: m.name, candidates: m.candidates, row: r, mapKeys: map }); return; }
      led.matched++;
      windowCols.forEach((wc) => {
        const v = parseFloat(String(r[wc.i] ?? "").replace(/[%\s]/g, ""));
        if (!isFinite(v)) return;
        const when = wc.single ? subject : (winOf(wc.h) || wc.h);
        const subj = wc.single ? subjOf(wc.h, subject) : subjOf(wc.h, subject);
        evidence.push({ upn: m.upn, file: fileName, conf: m.conf, date: today(), t: "assessment", subject: subj, score: v, when: when });
      });
      const priorCol = map.prior ?? map.ks2em ?? map.cats;
      if (priorCol != null) { const pr = num(r[priorCol]); if (pr != null) { evidence.push({ upn: m.upn, file: fileName, conf: m.conf, date: today(), t: "prior", score: pr }); const p = roll.find((x) => x.upn === m.upn); if (p && p.prior == null) { p.prior = pr; priorFilled++; } } }
    });
    const winSet = [...new Set(windowCols.map((wc) => wc.single ? subject : (winOf(wc.h) || wc.h)))];
    led.assumptions = [...led.assumptions, `read as a tracker: ${winSet.length} assessment window${winSet.length > 1 ? "s" : ""}, ${windowCols.length} graded columns (${winSet.slice(0, 4).join(", ")}${winSet.length > 4 ? "\u2026" : ""})`, ...(priorFilled ? [`prior attainment filled for ${priorFilled} pupils from the tracker`] : [])];
    const touched2 = new Set(evidence.slice(state.evidence.length).map((e) => e.upn));
    led.years = [...new Set(roll.filter((p) => touched2.has(p.upn)).map((p) => p.year).filter(Boolean))].sort((a, b) => a - b);
    return { ...state, roll, evidence, review, ledger: [led, ...state.ledger] };
  }
  body.forEach((r) => {
    const m = matchPupil(r, map, state.roll, state.aliases, scopeYear);
    if (!m) { led.held++; return; }
    if (m.review) { led.held++; review.push({ file: fileName, kind, name: m.name, candidates: m.candidates, row: r, mapKeys: map }); return; }
    led.matched++;
    const base = { upn: m.upn, file: fileName, conf: m.conf, date: today() };
    if (kind === "assessment") evidence.push({ ...base, t: "assessment", subject: map.subject != null ? r[map.subject] : fileName.replace(/\.[^.]+$/, ""), score: num(r[map.score]), when: map.date != null ? (r[map.date] || "").trim() : fileName });
    if (kind === "attendance") {
      const pcol = map.attPlus ?? map.att;
      const pv = pcol != null ? num(r[pcol]) : pctFrom(r, map);
      if (pv == null) { led.matched--; led.blank = (led.blank || 0) + 1; }
      else evidence.push({ ...base, t: "attendance", pct: pv, unauth: map.unauth != null ? num(r[map.unauth]) : null, when: map.date != null ? (r[map.date] || "").trim() : "current" });
    }
    if (kind === "engagement") evidence.push({ ...base, t: "engagement", praise: num(r[map.praise]), sanction: num(r[map.sanction]), homework: num(r[map.homework]) });
    if (kind === "enrichment") evidence.push({ ...base, t: "enrichment", what: map.event != null ? (r[map.event] || "").trim() : fileName, when: map.date != null ? (r[map.date] || "").trim() : "" });
    if (kind === "intervention") evidence.push({ ...base, t: "intervention", what: (r[map.intervention] || "").trim(), dosage: map.dosage != null ? num(r[map.dosage]) : null });
  });
  if (led.blank) led.assumptions = [...led.assumptions, `${led.blank} rows carried no attendance values and were skipped`];
  if (kind === "attendance" && led.held > 0) led.assumptions = [...led.assumptions, `${led.held} rows matched no pupil on the roll (leavers or other cohorts in the history): ignored`];
  if (scopeYear != null && led.held > led.matched) led.assumptions = [...led.assumptions, `most rows fell outside the Year ${scopeYear} scope chosen at upload: if this file covers the whole school, remove it and add it again with "Whole school" selected`];
  const touched = new Set(evidence.slice(state.evidence.length).map((e) => e.upn));
  led.years = [...new Set(state.roll.filter((p) => touched.has(p.upn)).map((p) => p.year).filter(Boolean))].sort((a, b) => a - b);
  return { ...state, evidence, review, ledger: [led, ...state.ledger] };
}
const num = (v) => { const n = parseFloat(String(v ?? "").replace(/[%\s]/g, "")); return isFinite(n) ? n : null; };
const pctFrom = (r, map) => { const s = num(r[map.sessions]), a = num(r[map.absent]); return s ? Math.round(1000 * (s - (a || 0)) / s) / 10 : null; };
const today = () => new Date().toLocaleDateString("en-GB");

/* an upload the user removes takes its evidence with it */
export function removeUpload(state, led) {
  const evidence = state.evidence.filter((e) => e.file !== led.file);
  const review = state.review.filter((r) => r.file !== led.file);
  const ledger = state.ledger.filter((l) => l !== led);
  const roll = led.kind === "roll" ? [] : state.roll;
  return { ...state, roll, evidence, review, ledger };
}

/* ── the reading slip: every file is read back before a single number lands ──
   inspect() runs the whole reader as a rehearsal — classification, column map,
   matching, counts, every assumption — against a throwaway copy of the state,
   and returns a slip instead of committing. The user corrects the slip;
   commitSlip() writes it in through the self-same ingest path; and a corrected
   shape is remembered on this device by its header fingerprint, so the next
   export in that dialect arrives already understood. */
export const KIND_LABELS = { roll: "the school roll", attendance: "attendance", tracker: "a tracker · termly assessments", assessment: "assessments", engagement: "conduct & homework", enrichment: "enrichment", intervention: "interventions", unknown: "not readable yet", unreadable: "unreadable" };
export const KIND_CHOICES = ["roll", "attendance", "tracker", "assessment", "engagement", "enrichment", "intervention"];
export const FIELD_LABELS = { upn: "the child (UPN)", name: "the child’s name", year: "year group", reg: "tutor group", dob: "date of birth", prior: "prior attainment", ks2em: "KS2 En+Ma band", ks2read: "KS2 reading", cats: "CATs mean", gender: "gender", ppg: "pupil premium", fsm: "free school meals", eal: "EAL", sen: "SEN", ehcp: "EHCP", att: "attendance %", unauth: "unauthorised %", subject: "subject", score: "the score", date: "the window", praise: "praise points", sanction: "sanctions", homework: "homework" };
export const FIELDS_BY_KIND = {
  roll: ["upn", "name", "year", "reg", "dob", "prior", "ks2em", "ks2read", "cats", "gender", "ppg", "fsm", "eal", "sen", "ehcp"],
  attendance: ["upn", "name", "att", "unauth"],
  tracker: ["upn", "name", "year", "prior"],
  assessment: ["upn", "name", "subject", "score", "date"],
  engagement: ["upn", "name", "praise", "sanction", "homework"],
  enrichment: ["upn", "name"], intervention: ["upn", "name"],
  unknown: ["upn", "name", "att", "unauth", "score"], unreadable: [],
};
export function fingerprintOf(headers) {
  const s = headers.map((h) => String(h || "").trim().toLowerCase().replace(/\s+/g, " ")).join("␟");
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return "d" + h.toString(36) + "-" + headers.length;
}
const displayCol = (map, k) => (k === "att" ? (map.attPlus ?? map.att ?? null) : (map[k] ?? null));
function forcedFrom(slip, fixes = {}) {
  const f = { notes: [] };
  if (fixes.kind && fixes.kind !== slip.autoKind) { f.kind = fixes.kind; f.notes.push(`read as ${KIND_LABELS[fixes.kind] || fixes.kind} on your word`); }
  const m = {};
  for (const [k, idx] of Object.entries(fixes.fields || {})) {
    if (idx === displayCol(slip.autoMap, k)) continue; /* back to what the reader saw: no force */
    if (k === "att") { m.att = idx; m.attPlus = idx; } else m[k] = idx;
    f.notes.push(idx == null ? `${FIELD_LABELS[k] || k}: set aside on your word` : `${FIELD_LABELS[k] || k} read from “${slip.headers[idx] ?? "column " + (idx + 1)}” on your word`);
  }
  if (Object.keys(m).length) f.map = m;
  if (slip.remembered && (f.map || f.kind)) f.notes.unshift(`this file’s shape was remembered from ${slip.remembered.file}`);
  return f.kind || f.map ? f : null;
}
export function reinspect(state, slip, fixes = {}) {
  const forced = forcedFrom(slip, fixes);
  const year = fixes.year !== undefined ? fixes.year : slip.opts.year ?? null;
  const dry = ingest(JSON.parse(JSON.stringify(state)), slip.fileName, slip.text, { ...slip.opts, year }, forced);
  const led = dry.ledger[0] || {};
  const kind = led.kind || "unreadable";
  const fields = {};
  (FIELDS_BY_KIND[kind] || FIELDS_BY_KIND.unknown).forEach((k) => {
    fields[k] = fixes.fields && fixes.fields[k] !== undefined ? fixes.fields[k] : displayCol(slip.autoMap, k);
  });
  return { ...slip, kind, fields, fixes: { ...fixes, year }, stats: { matched: led.matched || 0, of: led.of || 0, held: led.held || 0, blank: led.blank || 0, years: led.years || [] }, assumptions: led.assumptions || [] };
}
export function inspect(state, fileName, text, opts = {}) {
  const rows = parseCSV(text);
  const id = "s" + Math.random().toString(36).slice(2, 9);
  const headers = (rows[0] || []).map((h) => String(h || "").trim());
  if (rows.length < 2) return { id, fileName, text, opts, headers, autoMap: {}, autoKind: "unreadable", kind: "unreadable", fields: {}, fixes: {}, stats: { matched: 0, of: 0, held: 0, blank: 0, years: [] }, assumptions: ["no rows found"], remembered: null, replaces: false, fingerprint: null };
  const { map } = readHeaders(rows[0], rows.slice(1));
  const fp = fingerprintOf(headers);
  const mem = (state.dialects || {})[fp] || null;
  const slip0 = { id, fileName, text, opts, headers, autoMap: map, autoKind: null, fingerprint: fp,
    remembered: mem ? { file: mem.file, when: mem.when } : null,
    replaces: state.ledger.some((l) => l.file === fileName) };
  const auto = reinspect(state, slip0, {});
  auto.autoKind = auto.kind;
  if (!mem) return auto;
  const fixes = {};
  if (mem.kind && mem.kind !== auto.kind) fixes.kind = mem.kind;
  const ff = {};
  for (const [k, hname] of Object.entries(mem.fields || {})) {
    const i = headers.findIndex((h) => h.toLowerCase() === String(hname).toLowerCase());
    if (i >= 0 && i !== displayCol(map, k)) ff[k] = i;
  }
  if (Object.keys(ff).length) fixes.fields = ff;
  if (!fixes.kind && !fixes.fields) return auto;
  return { ...reinspect(state, { ...slip0, autoKind: auto.kind }, fixes), autoKind: auto.kind };
}
export function commitSlip(state, slip, fixes) {
  const fx = fixes || slip.fixes || {};
  const forced = forcedFrom(slip, fx);
  const year = fx.year !== undefined ? fx.year : slip.opts.year ?? null;
  const next = ingest(state, slip.fileName, slip.text, { ...slip.opts, year }, forced);
  const dialects = { ...(state.dialects || {}) };
  if (forced && slip.fingerprint) {
    const byName = {};
    for (const [k, idx] of Object.entries(fx.fields || {})) if (idx != null && idx >= 0 && idx !== displayCol(slip.autoMap, k)) byName[k] = slip.headers[idx];
    const old = (state.dialects || {})[slip.fingerprint];
    dialects[slip.fingerprint] = { kind: (next.ledger[0] && next.ledger[0].kind) || slip.kind, fields: { ...((old && old.fields) || {}), ...byName }, file: slip.fileName, when: today(), cols: slip.headers.length };
  }
  return { ...next, dialects };
}

/* ── the measures ── */
const pctile = (v, sorted) => { if (v == null || !sorted.length) return null; let i = 0; while (i < sorted.length && sorted[i] <= v) i++; return Math.round((100 * (i - 0.5)) / sorted.length); };
const quintile = (p) => (p == null ? null : Math.min(5, Math.floor(p / 20) + 1));
export const BANDS = ["On track", "Some concern", "Serious concern"];
const bandOf = (s) => (s == null ? null : s >= 62 ? 0 : s >= 40 ? 1 : 2);

export function computeAll(state) {
  const priorEv = {};
  state.evidence.forEach((e) => { if (e.t === "prior" && e.score != null) priorEv[e.upn] = e.score; });
  const priorOf = (p) => (p.prior != null ? p.prior : priorEv[p.upn] ?? p.ks2em ?? p.cats ?? p.ks2read ?? null);
  const byYear = {};
  state.roll.forEach((p) => { (byYear[p.year] = byYear[p.year] || []).push(p); });
  const out = {};
  for (const [year, cohort] of Object.entries(byYear)) {
    const priorSorted = cohort.map(priorOf).filter((v) => v != null).sort((a, b) => a - b);
    const small = cohort.length < 30;
    /* assessment windows: within-cohort percentile per (subject, when), averaged per pupil */
    const ev = state.evidence;
    const termRank = (w) => { const s = String(w).toLowerCase(); const m = s.match(/(20\d\d)/); const yr = m ? +m[1] * 10 : 0; if (/michaelmas|advent|autumn/.test(s)) return yr + 0; if (/lenten|lent|spring/.test(s)) return yr + 1; if (/trinity|summer/.test(s)) return yr + 2; const n = s.match(/(?:ap|term|assessment) ?(\d)/); if (n) return yr + (+n[1] - 1); return null; };
    const wins = [...new Set(ev.filter((e) => e.t === "assessment" && e.when !== "prior" && cohort.some((p) => p.upn === e.upn)).map((e) => e.when))].sort((a, b) => { const ra = termRank(a), rb = termRank(b); if (ra != null && rb != null && ra !== rb) return ra - rb; return String(a) < String(b) ? -1 : 1; });
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
      const priorP = pctile(priorOf(p), priorSorted);
      const lastTwo = perWin.filter((x) => x != null).slice(-2);
      const dirP = lastTwo.length === 2 ? lastTwo[1] - lastTwo[0] : 0; /* one point never makes a direction */
      const gap = curP != null && priorP != null ? curP - priorP : null;
      const progress = curP == null ? null : clamp(70 + 0.9 * (gap ?? 0) + 0.5 * dirP * (small ? 0.6 : 1));
      /* attendance: level vs own prior 50 / trend 30 / pattern 20 */
      const att = mine.filter((e) => e.t === "attendance" && e.pct != null);
      const cur = att.filter((e) => e.when !== "prior");
      const priorAtt = att.find((e) => e.when === "prior")?.pct ?? null;
      const nowAtt = cur.length ? cur[cur.length - 1].pct : null;
      const expected = priorAtt ?? 95;
      const trend = cur.length >= 2 ? cur[cur.length - 1].pct - cur[0].pct : 0;
      const unauthShare = cur.length && cur[cur.length - 1].unauth != null && nowAtt < 100 ? cur[cur.length - 1].unauth : 0;
      const attendance = nowAtt == null ? null : clamp(0.5 * (66 + 5 * (nowAtt - expected)) + 0.3 * (66 + 7 * trend) + 0.2 * (66 - 4 * unauthShare) + (nowAtt >= 96 ? 6 : 0));
      /* engagement: attendance is its loudest evidence; conduct and participation sit beside it */
      const eng = mine.filter((e) => e.t === "engagement");
      const praise = sum(eng, "praise"), sanction = sum(eng, "sanction"), hw = avg(eng, "homework");
      const ratio = praise != null || sanction != null ? (praise || 0) / Math.max(1, (praise || 0) + (sanction || 0)) : null;
      const conduct = ratio == null && hw == null ? null : clamp(0.55 * (ratio == null ? 50 : ratio * 100) + 0.45 * (hw == null ? 50 : hw));
      const anyEnrich = state.evidence.some((e) => e.t === "enrichment");
      const participation = mine.filter((e) => e.t === "enrichment").length > 0 ? clamp(60 + Math.min(3, mine.filter((e) => e.t === "enrichment").length) * 10) : anyEnrich ? 25 : null;
      const engFused = [[attendance, 0.6], [conduct, 0.25], [participation, 0.15]].filter(([v]) => v != null);
      const engW = engFused.reduce((a, [, w]) => a + w, 0);
      const engagement = engFused.length ? Math.round(engFused.reduce((a, [v, w]) => a + v * w, 0) / engW) : null;
      /* provision */
      const trips = mine.filter((e) => e.t === "enrichment").length;
      const enrichment = state.evidence.some((e) => e.t === "enrichment") ? (trips > 0 ? clamp(70 + Math.min(3, trips - 1) * 8) : 0) : null;
      const ivs = mine.filter((e) => e.t === "intervention");
      const needs = (progress != null && progress < 40) || (attendance != null && attendance < 40);
      const dosageOk = ivs.some((e) => e.dosage == null || e.dosage > 0);
      const interventions = needs ? (ivs.length ? (dosageOk ? 78 : 35) : 0) : (ivs.length ? 85 : null);
      /* concern: outcomes only, then the rule that refuses to lose children */
      const parts = [[progress, 0.5], [engagement, 0.5]].filter(([v]) => v != null);
      const wsum = parts.reduce((a, [, w]) => a + w, 0);
      let concern = parts.length ? Math.round(parts.reduce((a, [v, w]) => a + v * w, 0) / wsum) : null;
      let band = bandOf(concern);
      const worstCore = Math.max(bandOf(attendance ?? engagement) ?? 0, bandOf(progress) ?? 0);
      let capped = false;
      if (band != null && worstCore - band > 1) { band = worstCore - 1; capped = true; }
      const dir = (progress != null && dirP < -6) || trend < -1.5 ? "declining" : (dirP > 6 || trend > 1.5) ? "improving" : "steady";
      const lastWin = [...wins].reverse().find((w) => mine.some((e) => e.t === "assessment" && e.when === w && e.score != null));
      const latest = lastWin == null ? [] : mine.filter((e) => e.t === "assessment" && e.when === lastWin && e.score != null);
      const subjects = latest.map((e) => ({ s: e.subject, pct: pctile(e.score, scoreSets[e.subject + "|" + lastWin].sorted) }))
        .filter((x) => x.pct != null).sort((a, b) => b.pct - a.pct);
      /* KS4 at a glance: columns named Subject + MEG / Prediction / Grade split into a grade table */
      const MEAS = [[/\b(meg|target)\b/i, "target"], [/\bpredict(ion|ed)?\b/i, "pred"], [/\b(grade|current|working|wag)\b/i, "now"], [/\bqob\b/i, "qob"]];
      const baseOf = (s) => s.replace(/\b(meg|target|prediction|predicted|predict|grade|current|working|wag|qob)\b/gi, "").replace(/\b(20)?\d\d[\/_-]\d\d\b/g, "").replace(/\s+/g, " ").trim();
      const kmap = {};
      latest.forEach((e) => {
        if (!(e.score <= 9.5)) return; /* grade scale only: a 54% never reads as "predicted 54" */
        const m = MEAS.find(([re]) => re.test(e.subject)); if (!m) return;
        const b = baseOf(e.subject) || e.subject;
        (kmap[b] = kmap[b] || { s: b })[m[1]] = e.score;
      });
      let ks4 = Object.values(kmap).filter((x) => x.now != null || x.pred != null || x.target != null);
      ks4 = ks4.length >= 2 ? ks4.sort((a, b) => ((a.pred ?? a.now ?? 99) - (a.target ?? 0)) - ((b.pred ?? b.now ?? 99) - (b.target ?? 0))) : null;
      const evCount = mine.length;
      out[p.upn] = { ...p, year: Number(year), progress, attendance, engagement, engParts: { attendance, conduct, participation }, enrichment, interventions,
        concern, band, capped, dir, priorQ: quintile(priorP), nowQ: quintile(curP), curP, priorP, perWin, wins,
        nowAtt, expected, trend, trips, subjects, ks4, ivs: ivs.map((e) => e.what), conf: evCount >= 6 ? "solid" : evCount >= 3 ? "forming" : "thin", evCount };
    }
  }
  return out;
}
const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
const sum = (es, k) => { const v = es.map((e) => e[k]).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) : null; };
const avg = (es, k) => { const v = es.map((e) => e[k]).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

/* ── the year's own numbers: context and performance for the shoal's flip side ──
   Takes the computed pupils of one year (already filtered to any group in view).
   Percentages are of the children present; averages of the values held; the
   basics proportions use predicted grades (current grade where no prediction),
   and only children carrying BOTH an English and a maths grade count. */
export function yearStats(ps) {
  const n = ps.length;
  const pct = (k) => (n ? Math.round((100 * ps.filter((p) => p[k]).length) / n) : null);
  const avg = (k) => { const v = ps.map((p) => p[k]).filter((x) => x != null); return v.length ? Math.round(10 * (v.reduce((a, b) => a + b, 0) / v.length)) / 10 : null; };
  const enRe = /engl|^en\b/i, maRe = /math|^ma\b/i;
  const basics = [];
  ps.forEach((p) => {
    if (!p.ks4 || !p.ks4.length) return;
    const en = p.ks4.find((r) => enRe.test(r.s)), ma = p.ks4.find((r) => maRe.test(r.s));
    const ge = en ? en.pred ?? en.now : null, gm = ma ? ma.pred ?? ma.now : null;
    if (ge != null && gm != null) basics.push(Math.min(ge, gm));
  });
  const prop = (t) => (basics.length ? Math.round((100 * basics.filter((g) => g >= t).length) / basics.length) : null);
  return { n, ehcp: pct("ehcp"), pp: pct("ppg"), ks2em: avg("ks2em"), ks2read: avg("ks2read"), cats: avg("cats"),
    basicsN: basics.length, p4: prop(4), p5: prop(5), p7: prop(7) };
}

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
