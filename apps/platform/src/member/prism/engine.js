/* Prism query engine — every number on a canvas is computed here, deterministically,
   from the same dataset Atlas carries. The model chooses and narrates; it never does arithmetic. */

export const FIELDS = {
  attainment8: ["Attainment 8", 1], a8_disadv: ["Disadvantaged Attainment 8", 1],
  a8_nondisadv: ["Non-disadvantaged Attainment 8", 1], a8_2019: ["Attainment 8 (2019)", 1],
  a8_prev: ["Attainment 8 (previous year)", 1], p8_prev: ["Progress 8 (last published)", 2],
  basics_94: ["Basics 9-4 En&Ma %", 1], basics_95: ["Basics 9-5 En&Ma %", 1],
  fsm_pct: ["FSM6 %", 1], eal_pct: ["EAL %", 1], sen_ehcp_ws_pct: ["EHCP %", 1], sen_k_ws_pct: ["SEN Support %", 1],
  abs_overall_pct: ["Overall absence %", 1], abs_persistent_pct: ["Persistent absence %", 1],
  abs_severe_pct: ["Severe absence %", 2], susp_rate: ["Suspensions per 100", 1],
  susp_one_plus_pct: ["Pupils suspended 1+ %", 1], permex_rate: ["Permanent exclusions per 100", 2],
  ptr: ["Pupils per teacher", 1], teachers_fte: ["Teachers (FTE)", 1],
  vac_rate: ["Teacher vacancy rate", 1], turn_retained_pct: ["Teacher retention %", 1],
  dest_sustained: ["Sustained destination %", 1], dest_edu: ["Sustained education %", 1],
  dest_appren: ["Apprenticeship %", 1], dest_work: ["Sustained employment %", 1],
  dest_notsust: ["Destination not sustained %", 1],
  pupils: ["Pupils on roll", 0], ks2_rwm_exp: ["KS2 RWM expected %", 1],
};
export const GROUPS = ["region", "la", "phase", "religiousCharacter", "gender", "type", "ofsted"];

const isNum = (v) => typeof v === "number" && isFinite(v);
const rnd = (v, d = 1) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);

export function applyPrismFilters(data, f = {}) {
  let out = data;
  if (f.phase) out = out.filter((s) => s.phase === f.phase);
  if (f.region) out = out.filter((s) => (s.region || "").toLowerCase().includes(f.region.toLowerCase()));
  if (f.regions) out = out.filter((s) => f.regions.some((r) => (s.region || "").toLowerCase().includes(r.toLowerCase())));
  if (f.la) out = out.filter((s) => (s.la || "").toLowerCase().includes(f.la.toLowerCase()));
  (f.where || []).forEach(({ field, op, value }) => {
    if (!FIELDS[field]) return;
    out = out.filter((s) => isNum(s[field]) && (op === "lt" ? s[field] < value : op === "gt" ? s[field] > value : s[field] === value));
  });
  return out;
}

export function median(vals) {
  const v = vals.filter(isNum).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}
export const mean = (vals) => { const v = vals.filter(isNum); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const AGG = { median, mean, count: (v) => v.filter(isNum).length, sum: (v) => v.filter(isNum).reduce((a, b) => a + b, 0) };

export function pearson(pairs) {
  const p = pairs.filter(([x, y]) => isNum(x) && isNum(y));
  if (p.length < 30) return null;
  const mx = mean(p.map((d) => d[0])), my = mean(p.map((d) => d[1]));
  let sxy = 0, sxx = 0, syy = 0;
  p.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; });
  return rnd(sxy / Math.sqrt(sxx * syy), 2);
}

function quartileBuckets(data, xField, metric) {
  const rows = data.filter((s) => isNum(s[xField]) && isNum(s[metric]));
  const xs = rows.map((s) => s[xField]).sort((a, b) => a - b);
  if (xs.length < 40) return null;
  const q = (i) => xs[Math.min(xs.length - 1, Math.floor((i * xs.length) / 4))];
  const bounds = [xs[0], q(1), q(2), q(3), xs[xs.length - 1] + 1e-9];
  return [0, 1, 2, 3].map((i) => rows.filter((s) => s[xField] >= bounds[i] && s[xField] < bounds[i + 1]));
}

/* Executes one plan block against the dataset → { rows|points|value, meta } */
export function runBlock(block, data) {
  const d = applyPrismFilters(data, block.filters);
  const dec = FIELDS[block.metric]?.[1] ?? 1;
  const agg = AGG[block.agg] || median;

  if (block.kind === "quartiles") {
    const xf = block.x || "fsm_pct";
    const buckets = quartileBuckets(d, xf, block.metric);
    if (!buckets) return { error: "not enough data" };
    const labels = ["Least deprived Q1", "Q2", "Q3", "Most deprived Q4"];
    return { rows: buckets.map((b, i) => ({ label: xf === "fsm_pct" ? labels[i] : `Q${i + 1}`, value: rnd(agg(b.map((s) => s[block.metric])), dec), n: b.length })), n: d.length };
  }
  if (block.kind === "groupby") {
    const gf = GROUPS.includes(block.x) ? block.x : "region";
    const m = new Map();
    d.forEach((s) => { const k = s[gf]; if (k && isNum(s[block.metric])) (m.get(k) || m.set(k, []).get(k)).push(s[block.metric]); });
    let rows = [...m.entries()].filter(([, v]) => v.length >= 5).map(([label, v]) => ({ label, value: rnd(agg(v), dec), n: v.length }));
    rows.sort((a, b) => (block.dir === "asc" ? a.value - b.value : b.value - a.value));
    return { rows: rows.slice(0, block.limit || 12), n: d.length };
  }
  if (block.kind === "scatter") {
    const xf = block.x || "fsm_pct", yf = block.metric;
    const rows = d.filter((s) => isNum(s[xf]) && isNum(s[yf]));
    const r = pearson(rows.map((s) => [s[xf], s[yf]]));
    const step = Math.max(1, Math.floor(rows.length / (block.sample || 160)));
    const points = rows.filter((_, i) => i % step === 0).map((s) => ({ x: s[xf], y: s[yf], urn: s.urn }));
    const hi = block.highlight ? rows.find((s) => String(s.urn) === String(block.highlight)) : null;
    return { points, r, n: rows.length, highlight: hi ? { x: hi[xf], y: hi[yf], name: hi.name } : null };
  }
  if (block.kind === "stat") {
    if (block.pctWhere) {
      const { field, op, value } = block.pctWhere;
      const base = d.filter((s) => isNum(s[field]));
      const hit = base.filter((s) => (op === "lt" ? s[field] < value : op === "gte" ? s[field] >= value : s[field] > value));
      return { value: rnd((100 * hit.length) / (base.length || 1), 1), unit: "%", n: base.length };
    }
    return { value: rnd(agg(d.map((s) => s[block.metric])), dec), n: d.filter((s) => isNum(s[block.metric])).length };
  }
  if (block.kind === "recovery") {
    const rows = d.filter((s) => isNum(s.attainment8) && isNum(s.a8_2019));
    const above = rows.filter((s) => s.attainment8 >= s.a8_2019).length;
    return { value: rnd((100 * above) / (rows.length || 1), 1), unit: "%", n: rows.length, delta: rnd(median(rows.map((s) => s.attainment8 - s.a8_2019)), 2) };
  }
  if (block.kind === "rank") {
    const rows = d.filter((s) => isNum(s[block.metric]))
      .sort((a, b) => (block.dir === "asc" ? a[block.metric] - b[block.metric] : b[block.metric] - a[block.metric]))
      .slice(0, block.limit || 10)
      .map((s) => ({ label: s.name, sub: s.la, value: rnd(s[block.metric], dec), urn: s.urn }));
    return { rows, n: d.length };
  }
  return { error: "unknown block kind" };
}


export const RELATED = {
  turn_retained_pct: ["vac_rate", "ptr"], vac_rate: ["turn_retained_pct", "ptr"], ptr: ["turn_retained_pct", "vac_rate"],
  abs_overall_pct: ["abs_persistent_pct", "susp_rate"], abs_persistent_pct: ["abs_severe_pct", "susp_rate"],
  abs_severe_pct: ["abs_persistent_pct", "susp_rate"], susp_rate: ["abs_persistent_pct", "susp_one_plus_pct"],
  attainment8: ["a8_disadv", "abs_persistent_pct"], basics_94: ["attainment8", "abs_persistent_pct"],
  dest_sustained: ["dest_notsust", "attainment8"], dest_notsust: ["dest_sustained", "abs_persistent_pct"],
  sen_k_ws_pct: ["sen_ehcp_ws_pct", "abs_persistent_pct"], eal_pct: ["fsm_pct", "attainment8"],
};

export function insightFor(block, res) {
  const lab = FIELDS[block.metric]?.[0] || block.metric || "";
  if (res.rows && res.rows.length > 1 && (block.kind === "groupby" || block.kind === "quartiles")) {
    const vals = res.rows.filter((r) => r.value != null);
    if (vals.length < 2) return null;
    const hi = vals.reduce((a, b) => (b.value > a.value ? b : a)), lo = vals.reduce((a, b) => (b.value < a.value ? b : a));
    return `${hi.label} leads at ${hi.value}; ${lo.label} sits lowest at ${lo.value}: a spread of ${Math.round((hi.value - lo.value) * 10) / 10}.`;
  }
  if (block.kind === "scatter" && res.r != null) {
    const s = Math.abs(res.r);
    return `${lab} ${res.r > 0 ? "rises" : "falls"} with ${FIELDS[block.x]?.[0] || block.x}: ${s >= 0.5 ? "a strong" : s >= 0.3 ? "a moderate" : "a weak"} relationship (r = ${res.r}) across ${res.n.toLocaleString("en-GB")} schools.`;
  }
  if (block.kind === "rank" && res.rows?.length) return `Top of the list: ${res.rows[0].label} (${res.rows[0].value}).`;
  return null;
}

export const CHART_ALTS = {
  quartiles: ["bars", "dotplot", "table"],
  groupby: ["bars", "dotplot", "table"],
  scatter: ["scatter", "table"],
  stat: ["stat", "ring"],
  recovery: ["ring", "stat"],
  rank: ["table", "bars"],
};
export function normaliseChart(block) {
  const alts = CHART_ALTS[block.kind] || ["stat"];
  return alts.includes(block.chart) ? block.chart : alts[0];
}

/* Offline planner — used when the serverless function is unreachable.
   Anchors to what was actually asked; disadvantage enters only when asked. */
export function localPlan(q) {
  const ql = q.toLowerCase();
  const stipRaw = (ql.match(/as a (scatter|bar|dot ?plot|dot|table|ring|line)/) || [])[1];
  const chart = stipRaw ? ({ bar: "bars", dot: "dotplot", "dot plot": "dotplot", dotplot: "dotplot", line: "bars" }[stipRaw] || stipRaw) : null;
  const hit = (k) => (k.trim().length <= 4 ? new RegExp("\\b" + k.trim() + "\\b").test(ql) : ql.includes(k));
  const pick = (pairs, dflt) => (pairs.find(([k]) => hit(k)) || [null, dflt])[1];
  const metric = pick([
    ["persistent", "abs_persistent_pct"], ["severe", "abs_severe_pct"], ["absen", "abs_overall_pct"], ["attend", "abs_overall_pct"],
    ["suspen", "susp_rate"], ["permanent exclu", "permex_rate"], ["exclu", "susp_rate"],
    ["retention", "turn_retained_pct"], ["retain", "turn_retained_pct"], ["turnover", "turn_retained_pct"],
    ["vacanc", "vac_rate"], ["pupil-teacher", "ptr"], ["pupils per teacher", "ptr"], ["staffing", "ptr"], ["teacher", "turn_retained_pct"],
    ["destination", "dest_sustained"], ["neet", "dest_notsust"], ["apprentice", "dest_appren"],
    ["basics", "basics_94"], ["progress", "p8_prev"], ["ehcp", "sen_ehcp_ws_pct"], ["send", "sen_k_ws_pct"], ["sen", "sen_k_ws_pct"], ["eal", "eal_pct"],
    ["attainment", "attainment8"], ["a8", "attainment8"],
  ], null);
  const MISSING = [["financ","school finance"],["fund","funding"],["budget","budgets"],["spend","spending"],["money","school finance"],["salar","pay"],[" pay","pay"],["admission","admissions"],["ehe","home education"],["home educ","home education"],["mobility","pupil movement"],["stability","pupil movement"]];
  const miss = MISSING.find(([k]) => ql.includes(k));
  if (!metric && !/recover|2019|pandemic/.test(ql)) {
    const topic = miss ? miss[1] : "that";
    return { source: "local", coverage: "miss",
      answer: `The Institute dataset does not yet carry ${topic}${miss && miss[1]==="school finance" ? " (the financial benchmarking layer is queued)" : ""}. It does hold attainment and progress, disadvantage and SEN, absence and suspensions, teacher numbers, retention and vacancies, and KS4 destinations, for 26,553 schools. Ask within those and Prism will answer with evidence rather than improvisation.`,
      blocks: [],
      followups: ["Teacher retention by region", "Who is actually in the room?", "Rank schools by severe absence", "How have schools recovered since 2019?"] };
  }
  const m2 = metric || "attainment8";
  const label = FIELDS[m2] ? FIELDS[m2][0] : m2;
  const phase = ql.includes("primar") ? "Primary" : "Secondary";
  const filters = { phase };
  const wantsGap = /disadvantag|fsm|poor|deprived|gap|pupil premium/.test(ql);
  const wantsRegion = /region|north|south|london|midlands|coast/.test(ql);
  const wantsRank = /rank|top |worst |best |highest|lowest|which (schools|las|local)/.test(ql);
  const asc = /lowest|worst absence|best attendance/.test(ql) ? "asc" : "desc";
  const followups = [`${label} by region`, `Rank schools by ${label.toLowerCase()}`, wantsGap ? `${label} against attainment` : `Does ${label.toLowerCase()} follow disadvantage?`];

  if (/recover|2019|pandemic/.test(ql))
    return { source: "local", answer: "Recovery, computed against each school's own 2019 baseline.", blocks: [
      { kind: "recovery", chart: "ring", title: "At or above their 2019 Attainment 8", filters },
      { kind: "groupby", metric: "attainment8", x: "region", chart: chart || "bars", title: "Attainment 8 by region", filters },
    ], followups };

  const REGION_NAMES = ["north east","north west","yorkshire","east midlands","west midlands","east of england","london","south east","south west"];
  const named = REGION_NAMES.filter((r) => ql.includes(r));
  if (named.length >= 2) {
    const regions = named.slice(0, 3);
    const nice = regions.map((r) => r.replace(/(^|\s)\w/g, (c) => c.toUpperCase())).join(" and ");
    const comp = (met, title) => ({ kind: "groupby", metric: met, x: "region", chart: "bars", title, filters: { ...filters, regions } });
    const rel = RELATED[m2] || [];
    return { source: "local",
      answer: `${label} in ${nice}, with what an analyst puts beside it: the measures that usually travel with it, and every region for scale.`,
      blocks: [
        comp(m2, `${label}: the comparison you asked for`),
        ...rel.slice(0, 2).map((r) => comp(r, `${FIELDS[r][0]} in the same places`)),
        { kind: "groupby", metric: m2, x: "region", chart: "dotplot", title: `${label} across every region`, filters },
      ],
      followups: [`Rank schools by ${label.toLowerCase()}`, rel[0] ? `${FIELDS[rel[0]][0]} by region` : "Who is actually in the room?", `Does ${label.toLowerCase()} follow disadvantage?`] };
  }
  const blocks = [];
  if (/against|versus| vs |correlat|scatter/.test(ql) || (wantsGap && !wantsRank))
    blocks.push({ kind: "scatter", metric: m2, x: "fsm_pct", chart: chart === "table" ? "table" : "scatter", title: `${label} against disadvantage`, highlight: "100503", filters });
  if (wantsRank)
    blocks.push({ kind: "rank", metric: m2, dir: asc, limit: 10, chart: chart || "table", title: `Schools by ${label.toLowerCase()}`, filters });
  if (wantsRegion || !blocks.length)
    blocks.push({ kind: "groupby", metric: m2, x: "region", chart: chart || "bars", title: `${label} by region`, filters });
  if (wantsGap)
    blocks.push({ kind: "quartiles", metric: m2, x: "fsm_pct", chart: chart || "bars", title: `${label} by disadvantage quartile`, filters });
  const rel0 = (RELATED[m2] || [])[0];
  if (rel0 && blocks.length < 3) blocks.push({ kind: "groupby", metric: rel0, x: "region", chart: "bars", title: `${FIELDS[rel0][0]}: the companion measure`, filters });
  blocks.push({ kind: "stat", metric: m2, agg: "median", chart: "stat", title: `National median · ${label}`, filters });

  return { source: "local", answer: `${label} across the ${phase.toLowerCase()} estate, read the way you asked.`, blocks: blocks.slice(0, 4), followups };
}
