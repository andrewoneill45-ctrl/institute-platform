// Netlify Function: /.netlify/functions/prizm
// Prizm's reader. It turns a conversation into a report SPECIFICATION and
// nothing more: scope, blocks, title, plus one short reply. It never states
// figures — every number is computed deterministically in the browser from
// the published dataset. The API key lives only in the Netlify environment.

const SYSTEM = `You are Prizm, the report studio of The All Saints Institute (institute.school).
A member tells you what they want to understand about a group of English schools; you shape a report specification. You NEVER state statistics, figures or claims about any school — the platform computes every number itself from the published DfE dataset. Your job is scope, structure and a good title.

Respond ONLY with a JSON object, no markdown fences, of this shape:
{"reply": "<one or two warm, plain sentences to the member: what you've set up, and at most one sharp follow-up question>",
 "spec": {"title": "<editorial title for the report, UK English>",
   "scope": <one of:
     {"type":"trust","name":"<EXACT trust name as given in context or by the member, uppercase as DfE styles it>"} |
     {"type":"la","name":"<local authority name>"} |
     {"type":"catholicLa","las":["<LA name>", ...]} |
     {"type":"urns","urns":["<urn>", ...]}>,
   "blocks": [{"type":"<one of: cohort, movement, gap, scatter, distribution, ofsted>"}, ...]}}

Block meanings: cohort (headline table, every school), movement (this year vs last, school by school), gap (disadvantaged vs other pupils), scatter (FSM context vs Attainment 8 against England), distribution (where scope schools sit in the national A8 distribution), ofsted (current judgements vs England).
Choose and ORDER blocks to answer what the member actually asked; fewer, sharper blocks beat all six. If the member's aim mentions disadvantage, gap comes early. If they name no scope and none is in context, set "spec" to null and ask for the trust, local authority or schools in your reply.
If the context lists candidate entity names from the dataset, prefer those exact spellings. Keep "reply" under 50 words. Output raw JSON only.`;

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors() });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured." }), { status: 500, headers: cors("application/json") });

  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400, headers: cors() }); }
  const brief = (body.brief || "").toString().slice(0, 2000);
  if (!brief.trim()) return new Response("Empty brief", { status: 400, headers: cors() });
  const history = Array.isArray(body.history) ? body.history.slice(-6).filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map((m) => ({ role: m.role, content: m.content.slice(0, 3000) })) : [];
  const context = (body.context || "").toString().slice(0, 3000);

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
        max_tokens: 900,
        system: SYSTEM,
        messages: [...history, { role: "user", content: (context ? "CONTEXT (current spec and dataset candidates):\n" + context + "\n\n" : "") + "MEMBER: " + brief }],
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: `Claude API error ${resp.status}: ${t.slice(0, 200)}` }), { status: 502, headers: cors("application/json") });
    }
    const data = await resp.json();
    const text = (data.content || []).map((c) => c.text || "").join("");
    let out;
    try { out = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); }
    catch { out = { reply: text.slice(0, 300), spec: null }; }
    return new Response(JSON.stringify(out), { status: 200, headers: cors("application/json") });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Upstream error: " + e.message }), { status: 502, headers: cors("application/json") });
  }
};

function cors(type) {
  const h = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
  if (type) h["Content-Type"] = type;
  return h;
}
