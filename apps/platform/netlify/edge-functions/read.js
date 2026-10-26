// Netlify EDGE Function: /api/read
// The reading desk's interrogator. The member's browser has already opened
// the file and, for pupil-level tables, reduced it to its STRUCTURE: column
// headings, kinds, fill, and only safe low-variety samples (grades, flags,
// subject names). No name, UPN or birthdate reaches this function. Documents
// (a SEF, a policy, an IDSR, a survey report) arrive as their words, with
// UPNs, emails, phone numbers and postcodes already removed on the device.
//
// Two modes:
//   table:    what is this file, which column holds what, what should the
//             member be asked before it is read in?
//   document: what is this, when, who for; what does it say (findings that
//             cite their pages); which figures does it state (transcribed,
//             each checked against its cited page); where should it be filed?
//
// It replies as a stream: a space every few seconds while the model reads,
// then one JSON object. Edge functions must START replying within 40 s;
// streaming keeps a long document from being cut off. Nothing is stored.

const TABLE_SYSTEM = `You are the reading desk of The All Saints Institute, a platform for English secondary schools. A school leader has given you a spreadsheet. You see only its STRUCTURE: each column's heading, its kind, how full it is, how varied, and a few safe sample values. Columns marked "identifier" hold names, UPNs, birthdates or similar; you see their heading and kind only, never a value.

The rules-based reader has already made a first reading. Your job is to check it and improve it, and to ask the member about anything genuinely uncertain.

The file is going into Constellation, which holds LIVE pupil data, one row or more per child, matched to the school roll by UPN or name. Kinds of file it takes:
- roll: the school roll from the MIS (one row per child: UPN, name, year, reg group, characteristics such as PP, FSM, SEN, EAL, prior attainment)
- attendance: attendance percentages per child
- tracker: a wide tracker, one row per child with a column per subject or measure (predictions, working-at grades, targets)
- assessment: long-format results, one row per child per subject (and often per window or result type such as Prediction, Mock, Target)
- engagement: praise, sanctions, behaviour points, homework
- enrichment: clubs, trips, participation
- intervention: who is receiving which intervention

Fields per kind (map each to a column index, or null if absent):
roll: upn, name, forename, surname, year, reg, dob, prior, ks2em, ks2read, cats, gender, ppg, fsm, eal, sen, ehcp
attendance: upn, name, att, unauth
tracker: upn, name, year, prior
assessment: upn, name, subject, score, date, rtype
engagement: upn, name, praise, sanction, homework
enrichment / intervention: upn, name
Use name = -1 when the name must be assembled from separate forename and surname columns.

Rules:
- UK English. No em or en dashes: use commas, colons or semicolons.
- Only map a field to a column whose heading and kind genuinely support it. Never invent a column index.
- Keep the rules-based reading where it is right. Change it only with a reason.
- Ask at most three questions, and only when the answer changes how the file is read (for example: are these predictions or final results; which column is the reported grade when there are several; is this one year group or the whole school). Each question offers 2 to 4 concrete options.
- Cautions: anything the member should know before reading it in (for example: "Two columns could be the KS2 score: KS2 Avg and KS2 Scaled. I used KS2 Scaled.").
- If the file is not live pupil data at all (aggregate results by year, a staff list, a timetable), say so: kind "not-pupil-data".

Respond with ONLY a JSON object, no markdown fences:
{"kind":"<kind>","confidence":<0 to 1>,"summary":"<one sentence: what this file is>","year":<year group number or null>,"fields":{"<field>":<column index or null>},"measures":[<column indices of subject or measure columns in a wide tracker>],"questions":[{"id":"q1","text":"<question>","about":"kind|year|<field>","options":[{"label":"<short answer>","value":<column index, kind name, or year number>}]}],"cautions":["<sentence>"]}`;

const DOC_SYSTEM = `You are the reading desk of The All Saints Institute, a platform for English secondary schools. A school leader has given you a document: perhaps a self-evaluation (SEF), an Ofsted report, an IDSR, a policy, a development plan, a survey report, governors' minutes, a results analysis, a Section 48 (Catholic schools) self-evaluation or report. Its words are below, split into numbered pages or sections.

Read it as an experienced inspector and school leader would. Then report what it is and what it says, so that it can be filed and used as evidence.

Rules:
- UK English. No em or en dashes: use commas, colons or semicolons.
- Every finding cites the page or section numbers it comes from. Never cite a page you did not read.
- Figures: transcribe only figures the document itself states, exactly as written (a percentage, a score, a count, a grade). Never calculate, round or infer a figure. Each figure cites the one page it appears on. If the document compares years, give a series.
- Do not name or describe individual pupils, even if the document does. Staff may be named only by role.
- Choose the filing label from the list given. Suggest framework areas from the list given, only where the document genuinely evidences them.
- Ask at most three questions, only where the answer matters for filing or use (for example: is this the current version or a draft; which academic year does it cover when the document does not say; is this the school's own or a trust document).
- Strengths and gaps: what an inspector would take from it, each citing pages. Be honest: a gap the document reveals is worth more than a compliment.
- If some pages were not supplied, say so in a caution.

Respond with ONLY a JSON object, no markdown fences:
{"title":"<the document's own title, or a plain description>","docType":"<what kind of document>","date":"<date or academic year it covers, if stated>","author":"<the body or role that wrote it, if stated>","summary":"<two or three sentences>","label":"<one label from the list>","areas":["<framework area>"],"findings":[{"text":"<one sentence>","cite":[<page numbers>]}],"strengths":[{"text":"<one sentence>","cite":[<page>]}],"gaps":[{"text":"<one sentence>","cite":[<page>]}],"figures":[{"label":"<what it measures>","value":"<exactly as written>","period":"<year or term, if stated>","cite":<page>}],"series":[{"label":"<measure>","years":["<year>"],"vals":[<numbers>],"cite":<page>}],"questions":[{"id":"q1","text":"<question>","options":["<answer>","<answer>"]}],"cautions":["<sentence>"]}`;

const cors = (type) => ({
  "Content-Type": type,
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
});
const env = (k) => {
  try { if (typeof Netlify !== "undefined" && Netlify.env) { const v = Netlify.env.get(k); if (v != null) return v; } } catch {}
  try { if (typeof Deno !== "undefined" && Deno.env) { const v = Deno.env.get(k); if (v != null) return v; } } catch {}
  return typeof process !== "undefined" && process.env ? process.env[k] : undefined;
};
const clean = (s, n) => String(s ?? "").replace(/[–—]/g, ", ").replace(/\s+/g, " ").trim().slice(0, n);
const arr = (x) => (Array.isArray(x) ? x : []);

/* last line of defence on the server: no UPN, email, phone or postcode passes,
   whatever the browser sent */
export function scrub(s) {
  return String(s || "")
    .replace(/\b[A-Z]\d{11}[A-Z0-9]\b/gi, "[UPN]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/(?:\+44\s?|\b0)\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b/g, "[phone]")
    .replace(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/g, "[postcode]");
}

function parseJson(text) {
  const m = String(text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

const TABLE_FIELDS = ["upn", "name", "forename", "surname", "year", "reg", "dob", "prior", "ks2em", "ks2read", "cats", "gender", "ppg", "fsm", "eal", "sen", "ehcp", "att", "unauth", "subject", "score", "date", "rtype", "praise", "sanction", "homework"];
const KINDS = ["roll", "attendance", "tracker", "assessment", "engagement", "enrichment", "intervention", "not-pupil-data", "unknown"];

/* the table reading, held to the columns that exist */
export function vetTable(parsed, width) {
  if (!parsed || typeof parsed !== "object") return null;
  const okCol = (v) => v === null || (Number.isInteger(v) && v >= 0 && v < width);
  const fields = {};
  for (const [k, v] of Object.entries(parsed.fields || {})) {
    if (!TABLE_FIELDS.includes(k)) continue;
    if (k === "name" && v === -1) { fields.name = -1; continue; }
    if (okCol(v)) fields[k] = v;
  }
  const kind = KINDS.includes(parsed.kind) ? parsed.kind : "unknown";
  const questions = arr(parsed.questions).slice(0, 3).map((q, i) => {
    const about = clean(q.about, 20);
    const options = arr(q.options).slice(0, 4).map((o) => ({ label: clean(o.label, 80), value: o.value })).filter((o) => {
      if (!o.label) return false;
      if (about === "kind") return KINDS.includes(o.value);
      if (about === "year") return o.value === null || (Number.isInteger(o.value) && o.value >= 1 && o.value <= 14);
      if (TABLE_FIELDS.includes(about)) return okCol(o.value) || (about === "name" && o.value === -1);
      return false;
    });
    return { id: "q" + (i + 1), text: clean(q.text, 240), about, options };
  }).filter((q) => q.text && q.options.length >= 2);
  return {
    kind,
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    summary: clean(parsed.summary, 300),
    year: Number.isInteger(parsed.year) && parsed.year >= 1 && parsed.year <= 14 ? parsed.year : null,
    fields,
    measures: arr(parsed.measures).filter((v) => Number.isInteger(v) && v >= 0 && v < width).slice(0, 60),
    questions,
    cautions: arr(parsed.cautions).slice(0, 5).map((c) => clean(c, 260)).filter(Boolean),
  };
}

/* numbers as a page writes them: "62.4%", "0.69", "1,204" */
const numsIn = (s) => (String(s).match(/-?\d[\d,]*(?:\.\d+)?/g) || []).map((x) => x.replace(/,/g, ""));
/* the document reading: every citation must name a page that was read, and
   every figure must actually appear on the page it cites */
export function vetDocument(parsed, pages, { labels = [], areas = [] } = {}) {
  if (!parsed || typeof parsed !== "object") return null;
  const byN = new Map(pages.map((p) => [Number(p.n), String(p.text || "")]));
  const cites = (c) => [...new Set(arr(Array.isArray(c) ? c : [c]).map(Number).filter((n) => byN.has(n)))].slice(0, 6);
  let dropped = 0;
  const said = (list, n = 10) => arr(list).map((f) => ({ text: clean(f && f.text, 320), cite: cites(f && f.cite) }))
    .filter((f) => { const ok = f.text && f.cite.length; if (!ok) dropped++; return ok; }).slice(0, n);
  const figures = arr(parsed.figures).map((f) => {
    const cite = cites(f && f.cite)[0];
    const value = clean(f && f.value, 40);
    if (!cite || !value) { dropped++; return null; }
    const page = byN.get(cite).replace(/,/g, "");
    const ns = numsIn(value);
    /* a figure with numbers must find every one of them on its page */
    if (ns.length && !ns.every((x) => page.includes(x))) { dropped++; return null; }
    if (!ns.length && !page.toLowerCase().includes(value.toLowerCase())) { dropped++; return null; }
    return { label: clean(f.label, 120), value, period: clean(f.period, 30), cite };
  }).filter(Boolean).slice(0, 24);
  const series = arr(parsed.series).map((s) => {
    const cite = cites(s && s.cite)[0];
    const years = arr(s && s.years).map((y) => clean(y, 12));
    const vals = arr(s && s.vals).map(Number);
    if (!cite || years.length < 2 || years.length !== vals.length || vals.some((v) => !isFinite(v))) { dropped++; return null; }
    const page = byN.get(cite).replace(/,/g, "");
    if (!vals.every((v) => page.includes(String(v)))) { dropped++; return null; }
    return { label: clean(s.label, 100), years, vals, cite };
  }).filter(Boolean).slice(0, 6);
  const label = labels.includes(parsed.label) ? parsed.label : (labels.find((l) => /other/i.test(l)) || labels[0] || "");
  return {
    title: clean(parsed.title, 160),
    docType: clean(parsed.docType, 80),
    date: clean(parsed.date, 40),
    author: clean(parsed.author, 80),
    summary: clean(parsed.summary, 700),
    label,
    areas: arr(parsed.areas).map((a) => clean(a, 80)).filter((a) => !areas.length || areas.includes(a)).slice(0, 6),
    findings: said(parsed.findings, 10),
    strengths: said(parsed.strengths, 6),
    gaps: said(parsed.gaps, 6),
    figures,
    series,
    questions: arr(parsed.questions).slice(0, 3).map((q, i) => ({ id: "q" + (i + 1), text: clean(q && q.text, 240), options: arr(q && q.options).slice(0, 4).map((o) => clean(typeof o === "string" ? o : o && o.label, 80)).filter(Boolean) })).filter((q) => q.text && q.options.length >= 2),
    cautions: arr(parsed.cautions).slice(0, 5).map((c) => clean(c, 260)).filter(Boolean),
    dropped,
  };
}

/* a long document: send what fits, evenly from start to end, and say what was skipped */
export function fitPages(pages, budget = 90000) {
  const all = arr(pages).map((p) => ({ n: Number(p.n), text: scrub(String(p.text || "")).slice(0, 12000) })).filter((p) => p.text.trim());
  const total = all.reduce((a, p) => a + p.text.length, 0);
  if (total <= budget) return { sent: all, skipped: [] };
  /* the first pages (title, summary) and the last (conclusions) always go in,
     each up to 6,000 characters; the middle shares what is left evenly */
  const isEnd = (i) => i < 3 || i >= all.length - 2;
  const ends = all.reduce((a, p, i) => a + (isEnd(i) ? Math.min(6000, p.text.length) : 0), 0);
  const middle = all.filter((_, i) => !isEnd(i));
  const room = Math.max(0, budget - ends);
  const MIN = 900;
  /* if every middle page cannot have MIN, take an evenly spaced subset */
  const take = Math.min(middle.length, Math.floor(room / MIN));
  const keep = new Set();
  for (let k = 0; k < take; k++) keep.add(middle[Math.floor((k * middle.length) / take)].n);
  const per = take ? room / take : 0;
  const sent = [], skipped = [];
  all.forEach((p, i) => {
    if (isEnd(i)) sent.push({ n: p.n, text: p.text.slice(0, 6000) });
    else if (keep.has(p.n)) sent.push({ n: p.n, text: p.text.slice(0, Math.floor(per)) });
    else skipped.push(p.n);
  });
  return { sent, skipped };
}

async function callClaude(apiKey, system, user, maxTokens, signal) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    signal,
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: env("READER_MODEL") || env("CLAUDE_MODEL") || "claude-sonnet-4-5", max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  if (!resp.ok) throw new Error(`Claude API error ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const data = await resp.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
}

async function interrogate(body, apiKey, signal) {
  const mode = body.mode === "document" ? "document" : "table";
  if (mode === "table") {
    const prof = body.profile || {};
    const cols = arr(prof.columns).slice(0, 120);
    /* belt and braces: identifier columns travel as heading and kind only */
    const safeCols = cols.map((c) => c.identifier ? { i: c.i, header: scrub(c.header), identifier: c.identifier, fill: c.fill } : { ...c, header: scrub(c.header), samples: arr(c.samples).map((v) => scrub(v)).slice(0, 8) });
    const user = `File: ${scrub(prof.file)}${prof.sheet ? ` (sheet: ${scrub(prof.sheet)})` : ""}
Rows: ${prof.rows}${prof.titleRowsSkipped ? `; ${prof.titleRowsSkipped} title rows above the headings were skipped` : ""}
${body.note ? `The member's note on this file: "${clean(body.note, 200)}"\n` : ""}${body.yearGroups ? `Year groups on the school roll: ${arr(body.yearGroups).join(", ")}\n` : ""}
Columns:
${safeCols.map((c) => JSON.stringify(c)).join("\n")}

The rules-based reader's first reading:
${JSON.stringify(body.rules || {})}`;
    const text = await callClaude(apiKey, TABLE_SYSTEM, user, 1400, signal);
    const out = vetTable(parseJson(text), cols.length);
    return out ? { mode, reading: out } : { mode, error: "The reader's answer could not be understood." };
  }
  const { sent, skipped } = fitPages(body.pages);
  if (!sent.length) return { mode, error: "No readable words were sent." };
  const unit = ["page", "section", "slide"].includes(body.unit) ? body.unit : "page";
  const labels = arr(body.labels).map((l) => clean(l, 80)).slice(0, 30);
  const areas = arr(body.areas).map((l) => clean(l, 80)).slice(0, 30);
  const user = `File name: ${scrub(clean(body.name, 140))}
Filing labels to choose from: ${labels.join(" | ")}
Framework areas it may evidence: ${areas.join(" | ")}
${body.note ? `The member's note: "${clean(body.note, 200)}"\n` : ""}${skipped.length ? `Not supplied (too long to send in full): ${unit}s ${skipped.slice(0, 40).join(", ")}${skipped.length > 40 ? "…" : ""}\n` : ""}
${sent.map((p) => `=== ${unit} ${p.n} ===\n${p.text}`).join("\n\n")}`;
  const text = await callClaude(apiKey, DOC_SYSTEM, user, 3000, signal);
  const out = vetDocument(parseJson(text), sent, { labels, areas });
  if (!out) return { mode, error: "The reader's answer could not be understood." };
  if (skipped.length) out.cautions.unshift(`Too long to read in full: ${skipped.length} ${unit}${skipped.length === 1 ? "" : "s"} were skipped.`);
  out.read = sent.map((p) => p.n);
  return { mode, reading: out };
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: cors("text/plain") });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: cors("application/json") });
  const apiKey = env("ANTHROPIC_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured." }), { status: 500, headers: cors("application/json") });
  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "bad JSON" }), { status: 400, headers: cors("application/json") }); }

  const enc = new TextEncoder();
  const ctl = new AbortController();
  const LIMIT = Number(env("READER_DEADLINE_MS") || 120000);
  const stream = new ReadableStream({
    async start(controller) {
      const beat = setInterval(() => { try { controller.enqueue(enc.encode(" ")); } catch {} }, 4000);
      const timer = setTimeout(() => ctl.abort(), LIMIT);
      let out;
      try { out = await interrogate(body, apiKey, ctl.signal); }
      catch (e) { out = { error: e && e.name === "AbortError" ? "The reader took too long with this file." : String((e && e.message) || e).slice(0, 240) }; }
      clearInterval(beat); clearTimeout(timer);
      controller.enqueue(enc.encode(JSON.stringify(out)));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: cors("application/json") });
};

export const config = { path: "/api/read" };
