// Netlify Function: /.netlify/functions/horizon
// Horizon's reader. Two modes, the same doctrine as Prizm: the AI arranges,
// the mathematics counts.
//   read: a policy idea in words (and the scenario already open, if any)
//         becomes a SCENARIO specification: which lever, what scope, which
//         settings. It never states a figure.
//   case: the computed FINDINGS of a scenario become a short argued case for
//         a position paper. Every number must already be in FINDINGS; the
//         browser verifies every number again before the text is shown.

const cors = (type = "text/plain") => ({
  "Content-Type": type,
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
});

const SYSTEM = `You are Horizon, the policy studio of The All Saints Institute: forecasts and policy levers for England's schools, by invitation. A system leader describes an idea, a question about the future, or a change to the scenario already open. You turn it into ONE scenario specification. You never state or estimate a figure; the platform computes every number from the DfE's published data.

Output ONLY a JSON object, no markdown fences:
{"scenario": <spec or null>, "reply": "<one or two sentences, under 45 words>", "clarify": [<up to four exact names from the context's candidates, only when a place or trust cannot be matched confidently>]}

A spec:
{"title": "<a short title for the scenario, as a paper would head it>",
 "lever": "forecast" | "rolls" | "funding" | "acc" | "send",
 "scope": {"type": "england" | "region" | "la" | "trust", "name": "<exact name from the context candidates, omitted for england>", "phase": "secondary" | "primary"},
 "params": {...}}

Levers and their params:
- forecast (where the system is heading: rolls to 2031/32 on the authorities' forecasts, demand trend, next year's results). params: {}.
- rolls (FALLING ROLLS AND PLACES: which schools fall below a viable year group or under 70% full; what closing named schools would do). params: {"minPerYear": <smallest viable year-group size, default 120 secondary / 30 primary>, "demandShift": 0 | 0.5 | 1 (how far schools' shares follow their first-preference trend; default 0.5), "close": [<school names exactly as the context lists them, to model closing>]}.
- funding (FUNDING AND PREMIUMS: a pot shared by weights per FSM pupil, SEN support pupil, EHC plan, EAL pupil and an area deprivation factor; winners and losers by disadvantage, region and school). params: {"potM": <£ millions, default 250>, "neutral": true|false (budget-neutral: top-sliced from every school; default false), "fsm": <weight>, "senk": <weight>, "ehcp": <weight>, "eal": <weight>, "idaci": <weight>}. Presets: an Inclusion Premium is fsm 1, senk 1.5, ehcp 4, eal 0.3; a pupil premium uplift is fsm 1 only; a place factor is idaci 1 only.
- acc (ACCOUNTABILITY: rank every school by a proposed composite instead of Attainment 8 / RWM alone; who rises and falls, by disadvantage). params: {"weights": {"a8": w, "b95": w, "dis": w, "odds": w, "att": w, "incl": w, "dest": w}} for secondary, keys a8 = Attainment 8, b95 = grade 5+ English and maths, dis = disadvantaged pupils' A8, odds = beating the odds against statistical twins, att = attendance, incl = EHC plan share, dest = sustained destinations; for primary {"rwm", "high", "dis", "odds", "att", "incl"}. Weights 0 to 2 in halves.
- send (SEND GROWTH: EHC plans projected to 2031 against special school places, authority by authority; how much of new specialist demand mainstream could absorb). params: {"growth": "trend" | "half" | "flat" | <number, % a year>, "shift": <0 to 100, % of new specialist demand met in mainstream>}.

Rules:
- UK English. No em or en dashes in the reply: commas, colons, semicolons.
- If a scenario is already open and the member refines it ("make it budget-neutral", "now primaries", "close the two emptiest", "halve the growth"), return the SAME lever and scope with only the named settings changed, unless they plainly ask for a different lever or place. To close "the emptiest" schools, pick from the context's list of schools in scope, which is ordered emptiest first.
- NEVER GUESS A PLACE. Match names to the context's candidates; if you cannot match confidently, set scenario to null and put up to four exact candidate names in "clarify", and ask which they meant in the reply.
- If the idea needs a lever Horizon does not have (teacher pay, curriculum, term dates, a measure the data lacks), set scenario to null and say so plainly in the reply: do not force it into a lever.
- Keep the reply short and specific: say what you set, not what the result will be.`;

const CASE = `You write the case for a position paper by The All Saints Institute, from a policy scenario modelled in Horizon. UK English; no em or en dashes (use commas, colons, semicolons); a confident, editorial register; 140 to 200 words in three short paragraphs; plain text only, no headings or markdown. You are given FINDINGS: the scenario's settings and computed figures. Every number you write MUST appear verbatim in FINDINGS (you may drop trailing ".0" or a thousands separator). Never compute, round differently, or estimate a figure of your own; if a point needs a number FINDINGS lacks, make the point without the number. Say what was assumed as plainly as what was found: these are "if this held" projections from published data, not predictions. Lead with the consequence that matters most to a minister or a system leader, weigh what cuts against it, and end with the decision it puts on the table. Output the text only.`;

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors() });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured." }), { status: 500, headers: cors("application/json") });
  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400, headers: cors() }); }
  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";
  const call = async (system, messages, max_tokens) => {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens, system, messages }),
    });
    if (!resp.ok) { const t = await resp.text(); throw new Error(`Claude API error ${resp.status}: ${t.slice(0, 200)}`); }
    const data = await resp.json();
    return (data.content || []).map((c) => c.text || "").join("").trim();
  };

  try {
    if (body.mode === "case" && body.findings) {
      const text = await call(CASE, [{ role: "user", content: "FINDINGS:\n" + JSON.stringify(body.findings).slice(0, 12000) }], 700);
      return new Response(JSON.stringify({ text }), { status: 200, headers: cors("application/json") });
    }
    const brief = String(body.brief || "").slice(0, 2000).trim();
    if (!brief) return new Response("Empty brief", { status: 400, headers: cors() });
    const context = String(body.context || "").slice(0, 6000);
    const current = body.current ? JSON.stringify(body.current).slice(0, 2000) : null;
    const user = `${context ? "CONTEXT (the dataset's own names; use these spellings):\n" + context + "\n\n" : ""}${current ? "SCENARIO ALREADY OPEN:\n" + current + "\n\n" : ""}THE MEMBER SAYS:\n${brief}`;
    const raw = await call(SYSTEM, [{ role: "user", content: user }], 900);
    const m = raw.match(/\{[\s\S]*\}/);
    let parsed = null;
    try { parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
    if (!parsed) return new Response(JSON.stringify({ scenario: null, reply: "The reader could not make a scenario of that; try saying which lever and which place.", clarify: [] }), { status: 200, headers: cors("application/json") });
    return new Response(JSON.stringify({ scenario: parsed.scenario || null, reply: String(parsed.reply || "").replace(/[–—]/g, ", ").slice(0, 400), clarify: Array.isArray(parsed.clarify) ? parsed.clarify.slice(0, 4).map(String) : [] }), { status: 200, headers: cors("application/json") });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Upstream error: " + e.message }), { status: 502, headers: cors("application/json") });
  }
};
