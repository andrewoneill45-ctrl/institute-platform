/* Lens S48 Understand — the reading stage for files the deterministic parser
   cannot shape. The AI transcribes measures over time from the sheet text;
   it never calculates. The client validates and the chart code stays dumb. */

export function validateSeries(raw) {
  if (!raw || !Array.isArray(raw.series)) return [];
  const out = [];
  for (const s of raw.series.slice(0, 4)) {
    if (!s || typeof s.label !== "string" || !Array.isArray(s.years) || !Array.isArray(s.vals)) continue;
    const years = s.years.map((y) => String(y).trim()).slice(0, 12);
    const vals = s.vals.map((v) => (typeof v === "number" && isFinite(v) ? v : parseFloat(String(v).replace(/[%\s]/g, "")))).slice(0, 12);
    if (years.length !== vals.length) continue;
    if (vals.filter((v) => isFinite(v)).length < 2) continue;
    out.push({ label: s.label.trim().slice(0, 80), years, vals: vals.map((v) => (isFinite(v) ? v : NaN)) });
  }
  return out;
}

const SYSTEM = `You are the reading stage of a school's private evidence vault. You receive the extracted text of a spreadsheet of school results. Identify up to 4 headline measures tracked over time (for example Grade 4+ %, Grade 5+ %, average point score, pass rate), with the academic years or years they belong to.

RULES, absolute:
- TRANSCRIBE numbers exactly as they appear in the text. Never calculate, derive, average, or estimate a figure. If a measure's value for a year is not present, use null.
- Prefer whole-cohort headline measures over subgroup rows. Prefer percentages and point scores over raw counts.
- Years may appear as sheet names, headers, or labels (2024, 2024/25, 2024_25). Normalise to the form they use.
- If the text does not contain results over time, return an empty series list.

Respond with ONLY a JSON object, no prose, no backticks:
{"series":[{"label":"Grade 4+ %","years":["2023/24","2024/25"],"vals":[61,66]}],"summary":"one plain sentence on what the file holds"}`;

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { headers: cors() });
  if (req.method !== "POST") return new Response("POST only", { status: 405, headers: cors() });
  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400, headers: cors() }); }
  const file = (body.file || "upload").toString().slice(0, 160);
  const sheets = Array.isArray(body.sheets) ? body.sheets.slice(0, 6) : [];
  const text = sheets.map((s) => `=== SHEET: ${String(s.name || "").slice(0, 80)} ===\n${String(s.csv || "").slice(0, 5000)}`).join("\n\n").slice(0, 24000);
  if (!text.trim()) return json({ series: [], summary: "No readable text arrived." });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
        max_tokens: 1200,
        system: SYSTEM,
        messages: [{ role: "user", content: `File name: ${file}\n\n${text}` }],
      }),
    });
    if (!res.ok) return json({ series: [], summary: "Reader unavailable." }, 200);
    const data = await res.json();
    const t = (data.content || []).map((c) => c.text || "").join("");
    const m = t.match(/\{[\s\S]*\}/);
    const raw = m ? JSON.parse(m[0]) : null;
    const series = validateSeries(raw);
    return json({ series, summary: (raw && typeof raw.summary === "string" ? raw.summary.slice(0, 300) : ""), ai: true });
  } catch (e) {
    return json({ series: [], summary: "Reader unavailable." }, 200);
  }
};

const cors = () => ({ "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" });
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors(), "Content-Type": "application/json" } });
