/* Prism planner — turns a question into a canvas plan (queries + prose), never numbers.
   The client computes every figure deterministically from the Institute dataset. */

const FIELDS = `attainment8 (Attainment 8 2025), a8_disadv, a8_nondisadv, a8_2019 (2019 baseline), a8_prev, p8_prev (Progress 8),
basics_94, basics_95, fsm_pct (FSM6 disadvantage %), eal_pct, sen_ehcp_ws_pct (EHCP %), sen_k_ws_pct (SEN support %),
abs_overall_pct, abs_persistent_pct (missing 10%+), abs_severe_pct (missing 50%+), susp_rate (suspensions per 100),
susp_one_plus_pct, permex_rate, ptr (pupils per teacher), teachers_fte, vac_rate, turn_retained_pct (teacher retention %),
dest_sustained, dest_edu, dest_appren, dest_work, dest_notsust, pupils, ks2_rwm_exp (primary KS2 RWM %)`;

const SYSTEM = `You are Prism, the insight planner inside the All Saints Institute's Atlas. You receive one question about England's schools and return ONLY a JSON object (no markdown, no prose outside JSON) describing a canvas of evidence. You choose and narrate; you NEVER compute numbers — the client computes everything from the dataset.

SCHEMA:
{"answer": "2-3 sentence written argument in UK English, Institute voice (rhetorical weight, no em dashes), WITHOUT specific numbers — the canvas carries the numbers",
 "blocks": [up to 4 of:
   {"kind":"scatter","metric":FIELD,"x":FIELD,"chart":"scatter","title":"...","highlight":"URN optional","filters":{...}}
   {"kind":"quartiles","metric":FIELD,"x":"fsm_pct","agg":"median","chart":"bars|dotplot|table","title":"..."}
   {"kind":"groupby","metric":FIELD,"x":"region|la|phase|religiousCharacter|gender|ofsted","agg":"median","chart":"bars|dotplot|table","dir":"desc|asc","limit":N,"title":"..."}
   {"kind":"stat","metric":FIELD,"agg":"median|mean|count","chart":"stat","title":"..."} or {"kind":"stat","pctWhere":{"field":FIELD,"op":"lt|gt|gte","value":N},"chart":"ring|stat","title":"..."}
   {"kind":"recovery","chart":"ring","title":"..."} (share of schools at/above their 2019 Attainment 8)
   {"kind":"rank","metric":FIELD,"dir":"desc|asc","limit":10,"chart":"table","title":"..."}],
 "followups": [3-4 short next questions]}

FIELDS: ${FIELDS}
filters (optional per block): {"phase":"Secondary|Primary","region":"...","la":"...","where":[{"field":F,"op":"lt|gt","value":N}]}

RULES:
- First block is the hero: the single most telling visual for the question.
- If the user stipulates a chart type ("as a scatter", "bar chart", "as a table", "ring"), you MUST honour it on the relevant block.
- Default phase filter Secondary unless the question implies primary or all schools.
- Destinations and A8 fields are secondary-only. abs/susp/workforce cover both phases.
- Titles are short and editorial, not database-ish. UK English. No em dashes anywhere.
- If the question names a school or "All Saints", set highlight to its URN if known (All Saints Catholic College = 100503) and mention it in the answer.
- Return ONLY the JSON object.`;

export default async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });
  let question = "";
  try { ({ question } = await req.json()); } catch { /* fall through */ }
  if (!question || question.length > 400) return Response.json({ error: "bad question" }, { status: 400 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "no key" }, { status: 503 });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1400,
      system: SYSTEM,
      messages: [{ role: "user", content: question }],
    }),
  });
  if (!r.ok) return Response.json({ error: "upstream" }, { status: 502 });
  const data = await r.json();
  const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
  try {
    const plan = JSON.parse(text.replace(/```json|```/g, "").trim());
    if (!Array.isArray(plan.blocks)) throw new Error("shape");
    plan.blocks = plan.blocks.slice(0, 4);
    return Response.json(plan);
  } catch {
    return Response.json({ error: "unparseable" }, { status: 502 });
  }
};
