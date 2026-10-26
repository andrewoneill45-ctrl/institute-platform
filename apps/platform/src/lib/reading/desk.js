/* The reading desk, stages two and three: prepare what may be sent, ask the
   interrogator, and turn its answer into something the member can check.
   Shared by Constellation (live pupil tables) and Lens (documents and
   evidence). Privacy is decided here, on the device, before anything moves:
   a pupil-level table travels as its structure only; a document travels as
   its words with UPNs, emails, phones and postcodes removed, and any
   pupil-level table inside it is withheld. */
import { profileTable, leaksFrom } from "./profile.js";

const UPN_G = /\b[A-Z]\d{11}[A-Z0-9]\b/gi;
export function scrubText(s) {
  return String(s || "")
    .replace(UPN_G, "[UPN]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/(?:\+44\s?|\b0)\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b/g, "[phone]")
    .replace(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/g, "[postcode]");
}

/* a table is pupil-level when it carries a child's identity */
export const isPupilLevel = (profile) => profile.columns.some((c) => ["upn", "name", "dob", "date-of-birth-like"].includes(c.identifier)) && profile.rows >= 5;

/* how strongly a passage of prose looks like it names children: many
   capitalised name pairs near words such as pupil, student, Year 9 */
export function namesPupils(text) {
  const t = String(text || "");
  const pairs = (t.match(/\b[A-Z][a-z]{1,15} [A-Z][a-z'’-]{1,20}\b/g) || []).length;
  const pupilWords = (t.match(/\b(pupil|student|learner|child|year \d{1,2}|y\d{1,2}\b|tutor group|ehcp|send|sen support)/gi) || []).length;
  const per1k = (pairs * 1000) / Math.max(1, t.length);
  return { pairs, pupilWords, likely: pairs >= 12 && pupilWords >= 6 && per1k > 1.2 };
}

/* the interrogator replies as a stream: spaces while it reads, then JSON */
export async function askDesk(payload, { signal } = {}) {
  let r;
  try {
    r = await fetch("/api/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal });
  } catch (e) {
    return { error: e && e.name === "AbortError" ? "stopped" : "the reading desk could not be reached" };
  }
  const text = (await r.text()).trim();
  try { return JSON.parse(text); } catch { return { error: r.ok ? "the reading desk's answer was cut short" : `the reading desk is unavailable (${r.status})` }; }
}

/* ── tables (Constellation) ── */
/* what leaves the device for a table, and a proof that no identifier is in it */
export function tablePayload(table, fileName, rules, extra = {}) {
  const profile = profileTable(table, { fileName });
  const leaks = leaksFrom(profile, table);
  if (leaks.length) return { blocked: true, leaks: leaks.length, profile };
  return { profile, payload: { mode: "table", profile, rules, ...extra } };
}

/* the rules' reading of a slip, in the shape the interrogator expects */
export function rulesOf(slip) {
  const fields = {};
  for (const [k, v] of Object.entries(slip.fields || {})) fields[k] = v == null ? null : { col: v, header: v === -1 ? "(forename + surname)" : slip.headers[v] };
  return { kind: slip.kind, fields, assumptions: (slip.assumptions || []).slice(0, 8) };
}

/* the interrogator's reading set against the rules'. Where the rules saw
   nothing and the AI sees a column, the AI's suggestion is applied (marked
   as the reader's suggestion). Where both saw something and they differ,
   it becomes a question: the member decides, never the machine. */
export function mergeTableReading(slip, ai) {
  const fixes = {};
  const applied = [];
  const questions = [];
  const head = (i) => (i === -1 ? "forename + surname together" : slip.headers[i] ?? `column ${i + 1}`);
  const mapped = new Set(Object.values(slip.fields || {}).filter((v) => v != null && v >= 0));
  const kindOk = ["roll", "attendance", "tracker", "assessment", "engagement", "enrichment", "intervention"].includes(ai.kind);
  if (kindOk && ai.kind !== slip.kind) {
    if ((slip.kind === "unknown" || slip.kind === "unreadable") && ai.confidence >= 0.7) { fixes.kind = ai.kind; applied.push(`read as ${ai.kind} on the reading desk's advice`); }
    else if (ai.confidence >= 0.5) questions.push({ id: "kind", text: `The rules read this as ${slip.kind}; the reading desk thinks it is ${ai.kind}. Which is it?`, about: "kind", options: [{ label: ai.kind, value: ai.kind }, { label: slip.kind, value: slip.kind }] });
  }
  const fieldFixes = {};
  for (const [k, v] of Object.entries(ai.fields || {})) {
    if (!(k in (slip.fields || {})) && !fixes.kind) continue; /* not a field of this kind */
    const cur = slip.fields ? slip.fields[k] : undefined;
    if (v == null || v === cur) continue;
    if (cur == null) {
      if (v >= 0 && mapped.has(v) && k !== "name") continue; /* already in use for something else */
      fieldFixes[k] = v; applied.push(`${k} read from “${head(v)}”`);
    } else questions.push({ id: "f-" + k, text: `Two readings of ${k}: “${head(cur)}” or “${head(v)}”?`, about: k, options: [{ label: head(v), value: v }, { label: head(cur), value: cur }] });
  }
  if (Object.keys(fieldFixes).length) fixes.fields = fieldFixes;
  if (ai.year && slip.opts && slip.opts.year == null && !(slip.fixes && slip.fixes.year != null)) questions.push({ id: "year", text: `This looks like Year ${ai.year} only. Read it as that?`, about: "year", options: [{ label: `Year ${ai.year} only`, value: ai.year }, { label: "The whole school", value: null }] });
  for (const q of ai.questions || []) if (!questions.some((x) => x.about === q.about)) questions.push(q);
  return { fixes, applied, questions: questions.slice(0, 4), summary: ai.summary, cautions: ai.cautions || [], confidence: ai.confidence, notPupil: ai.kind === "not-pupil-data" };
}

/* ── documents (Lens) ── */
/* what leaves the device for a document: its scrubbed words, minus any
   pupil-level table, plus the structure of the tables it does hold */
export function documentPayload(reading, { labels = [], areas = [], note = "" } = {}) {
  const withheld = [];
  const tableProfiles = [];
  let pages = (reading.pages || []).map((p) => ({ n: p.n, text: p.text }));
  for (const t of reading.tables || []) {
    const prof = profileTable(t, { fileName: reading.name });
    if (isPupilLevel(prof)) {
      withheld.push({ name: t.name, rows: prof.rows });
      /* take the table's rows out of the words */
      const lines = new Set(t.rows.map((r) => r.join(" | ")));
      pages = pages.map((p) => ({ n: p.n, text: p.text.split("\n").filter((l) => !lines.has(l)).join("\n") }));
      tableProfiles.push(prof);
    }
  }
  pages = pages.map((p) => ({ n: p.n, text: scrubText(p.text) }));
  const names = namesPupils(pages.map((p) => p.text).join("\n"));
  return {
    withheld, names, tableProfiles,
    payload: { mode: "document", name: reading.name, unit: reading.unit || "page", pages, labels, areas, note },
  };
}

/* a table that is not pupil-level (results by year, survey percentages) is
   evidence in its own right: sent as words, one "page" per sheet */
export function tableAsDocument(reading) {
  const pages = (reading.tables || []).map((t, i) => ({ n: i + 1, text: `${t.name}\n` + t.rows.slice(0, 400).map((r) => r.join(" | ")).join("\n") }));
  return { ...reading, kind: "document", pages, unit: "section", text: pages.map((p) => p.text).join("\n\n") };
}
