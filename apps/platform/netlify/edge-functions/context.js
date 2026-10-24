// Netlify EDGE Function: /api/context
// An edge function, not a serverless one: web searches take 10 to 30 seconds
// of waiting, and edge functions count only CPU time (50 ms), with 40 s to
// reply, where serverless functions are cut off at 10 s.
// Prizm's context desk. Given a report's scope, it searches the web for what
// has been HAPPENING there (inspections, leadership, mergers, closures,
// local news, policy) and returns a handful of sourced items. It never
// supplies the report's figures: those are computed in the browser from the
// published dataset. Every link it returns is one its own searches actually
// found; a URL the model writes without having searched for it is dropped.

const SYSTEM = `You are the context desk of Prizm, the report studio of The All Saints Institute.
A member is reading a data report about a group of English schools. Prizm's own report already holds every performance figure, computed from the DfE's published data. Your job is the STORY around those figures: what has been happening there that numbers alone cannot show.

Search the web, then return the most useful 3 to 6 items from the last two years: Ofsted inspections and report cards, headteacher or CEO changes, trust mergers and transfers, school openings, closures and rebrokering, falling rolls or place-planning decisions, funding or deficit news, SEND provision changes, and notable local or national press. Prefer primary sources (gov.uk, Ofsted, the trust or local authority itself) and reputable press.

Rules:
- UK English. No em or en dashes: use commas, colons or semicolons.
- Do NOT restate attainment, attendance or other performance statistics; Prizm already shows them from official data. Describe events and decisions.
- Every item must come from a page your search returned. Never invent a source, headline or date.
- If the scope is vague or too broad (for example the whole of England), return national items that matter to school leaders.
- If you find nothing reliable, return an empty list and say so in the note.

After searching, respond with ONLY a JSON object, no markdown fences:
{"items":[{"headline":"<short, factual>","summary":"<one or two sentences>","url":"<the page>","source":"<publisher>","date":"<month and year, if known>"}],"note":"<one short sentence on what you found>"}`;

const cors = (type) => ({
  "Content-Type": type,
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
});

/* the links the searches actually returned: the only ones allowed through */
export function searchedUrls(content) {
  const urls = new Set();
  for (const b of content || []) {
    if (b && b.type === "web_search_tool_result" && Array.isArray(b.content)) {
      for (const r of b.content) if (r && r.url) urls.add(r.url);
    }
  }
  return urls;
}
const norm = (u) => String(u || "").replace(/^https?:\/\/(www\.)?/, "").replace(/[#?].*$/, "").replace(/\/$/, "").toLowerCase();

/* parse the model's final JSON and keep only items whose links were searched */
export function vetItems(content) {
  const allowed = searchedUrls(content);
  const allowedNorm = new Map([...allowed].map((u) => [norm(u), u]));
  const text = (content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { items: [], note: "The context desk returned nothing it could stand behind.", dropped: 0 };
  let parsed;
  try { parsed = JSON.parse(m[0]); } catch { return { items: [], note: "The context desk returned nothing it could stand behind.", dropped: 0 }; }
  const raw = Array.isArray(parsed.items) ? parsed.items : [];
  let dropped = 0;
  const clean = (s, n) => String(s || "").replace(/[–—]/g, ", ").replace(/\s+/g, " ").trim().slice(0, n);
  const items = [];
  for (const it of raw) {
    const url = allowed.has(it.url) ? it.url : allowedNorm.get(norm(it.url));
    if (!url || !it.headline) { dropped++; continue; }
    let source = clean(it.source, 60);
    if (!source) { try { source = new URL(url).hostname.replace(/^www\./, ""); } catch { source = ""; } }
    items.push({ headline: clean(it.headline, 140), summary: clean(it.summary, 320), url, source, date: clean(it.date, 30) });
    if (items.length >= 6) break;
  }
  return { items, note: clean(parsed.note, 200), dropped };
}

const env = (k) => {
  try { if (typeof Netlify !== "undefined" && Netlify.env) { const v = Netlify.env.get(k); if (v != null) return v; } } catch {}
  try { if (typeof Deno !== "undefined" && Deno.env) { const v = Deno.env.get(k); if (v != null) return v; } } catch {}
  return typeof process !== "undefined" && process.env ? process.env[k] : undefined;
};

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: cors("text/plain") });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: cors("application/json") });
  const apiKey = env("ANTHROPIC_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured." }), { status: 500, headers: cors("application/json") });

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "bad JSON" }), { status: 400, headers: cors("application/json") }); }
  const scope = String(body.scope || "").slice(0, 200).trim();
  const kind = String(body.kind || "").slice(0, 40);
  const schools = Array.isArray(body.schools) ? body.schools.slice(0, 8).map((s) => String(s).slice(0, 90)) : [];
  if (!scope) return new Response(JSON.stringify({ error: "no scope" }), { status: 400, headers: cors("application/json") });

  const brief = `The report's scope: ${scope}${kind ? ` (${kind})` : ""}.` +
    (schools.length ? ` Schools in it include: ${schools.join("; ")}.` : "") +
    ` Find what has been happening there.`;

  const messages = [{ role: "user", content: brief }];
  let content = [];
  /* the edge must start replying within 40 seconds: finish first, and say so
     plainly rather than be cut off */
  const started = Date.now();
  const DEADLINE = Number(env("CONTEXT_DEADLINE_MS") || 34000);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), Math.max(1000, DEADLINE - 200));
  try {
    /* a long search can pause mid-turn; continue it while time allows */
    for (let turn = 0; turn < 3; turn++) {
      if (turn && Date.now() - started > DEADLINE * 0.7) break;
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        signal: ctl.signal,
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: env("CLAUDE_MODEL") || "claude-sonnet-4-5",
          max_tokens: 1200,
          system: SYSTEM,
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3, user_location: { type: "approximate", country: "GB" } }],
          messages,
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        return new Response(JSON.stringify({ error: `Claude API error ${resp.status}: ${t.slice(0, 240)}` }), { status: 502, headers: cors("application/json") });
      }
      const data = await resp.json();
      content = content.concat(data.content || []);
      if (data.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: data.content });
    }
  } catch (e) {
    clearTimeout(timer);
    const slow = e && e.name === "AbortError";
    return new Response(JSON.stringify({ error: slow ? "the search took too long; try again" : "context desk unreachable: " + String(e).slice(0, 120), slow }), { status: slow ? 504 : 502, headers: cors("application/json") });
  }
  clearTimeout(timer);

  const out = vetItems(content);
  return new Response(JSON.stringify(out), { status: 200, headers: cors("application/json") });
};

export const config = { path: "/api/context" };
