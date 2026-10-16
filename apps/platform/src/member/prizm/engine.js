/* Prizm's engine — the deterministic half of the report studio.
   The AI reads intent and arranges blocks; every figure on the page is
   computed here, from the same national dataset Atlas holds, and is
   traceable to its DfE vintage. Nothing in this file calls a network. */

export const VINTAGE = "DfE performance data 2025/26 provisional · arrows against 2024/25 · P8 is 2023/24, the last published";

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
export const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);

/* ── who counts: state-funded mainstream schools with KS4 results ──
   Independents are excluded (unregulated iGCSEs make their A8 an artefact,
   not a judgement) and so are special and alternative provision, exactly as
   the DfE's own school comparisons default. */
export function secondaries(all) {
  return all.filter((s) => num(s.attainment8) != null && !/independent|special|pupil referral|alternative|secure/i.test(s.type || ""));
}

/* ── scope resolution: which schools is this report about? ──
   scope = { type: "trust"|"la"|"urns"|"catholicLa", name?, urns?, las? } */
export function resolveScope(all, scope) {
  if (!scope || !scope.type) return [];
  const sec = secondaries(all);
  let out = [];
  if (scope.type === "trust" && scope.name) {
    const t = scope.name.trim().toLowerCase();
    out = sec.filter((s) => (s.trust || "").trim().toLowerCase() === t);
  } else if (scope.type === "la" && scope.name) {
    const l = scope.name.trim().toLowerCase();
    out = sec.filter((s) => (s.la || "").trim().toLowerCase() === l);
  } else if (scope.type === "region" && scope.name) {
    const r = scope.name.trim().toLowerCase();
    out = sec.filter((s) => (s.region || "").trim().toLowerCase() === r);
  } else if (scope.type === "urns" && Array.isArray(scope.urns)) {
    const set = new Set(scope.urns.map(String));
    out = sec.filter((s) => set.has(String(s.urn)));
  } else if (scope.type === "catholicLa" && Array.isArray(scope.las)) {
    const las = new Set(scope.las.map((x) => x.trim().toLowerCase()));
    out = sec.filter((s) => las.has((s.la || "").trim().toLowerCase()) && /catholic/i.test(s.religiousCharacter || ""));
  }
  return [...out].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export function scopeLabel(scope, n) {
  if (!scope) return "";
  const c = n != null ? ` · ${n} school${n === 1 ? "" : "s"}` : "";
  if (scope.type === "trust") return scope.name + c;
  if (scope.type === "la") return scope.name + c;
  if (scope.type === "region") return scope.name + c;
  if (scope.type === "catholicLa") return "Catholic schools · " + scope.las.join(", ") + c;
  if (scope.type === "urns") return "Selected schools" + c;
  return "";
}

/* ── the picker's search: understands sentences, not just substrings ──
   "Tell me about secondary schools in the North East of England" finds the
   region: furniture words are stripped and an entity matches when all of its
   own meaning-bearing tokens appear in the query (or the query appears in
   its name). Deterministic, instant, entirely on the device. */
const STOP = new Set(["tell", "me", "about", "the", "a", "an", "in", "of", "and", "or", "for", "on", "at", "to", "my", "our", "all", "show", "give", "want", "need", "with", "across", "report", "reports", "analysis", "analyse", "look", "looking", "compare", "schools", "school", "secondary", "secondaries", "england", "english", "please", "what", "how", "are", "doing", "i"]);
const toks = (s) => (s || "").toLowerCase().replace(/[^a-z0-9\s&']/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t));
function matches(name, needle, qTokens) {
  const n = (name || "").toLowerCase();
  if (n.includes(needle)) return true;
  const nt = toks(name);
  return nt.length > 0 && nt.every((t) => qTokens.includes(t));
}
export function searchEntities(all, q) {
  const needle = (q || "").trim().toLowerCase();
  if (needle.length < 2) return { trusts: [], las: [], regions: [], schools: [] };
  const qTokens = toks(needle);
  const sec = secondaries(all);
  const trusts = {}, las = {}, regions = {};
  const schools = [];
  for (const s of sec) {
    if (s.trust && s.trust !== "Not supported by a trust" && matches(s.trust, needle, qTokens)) trusts[s.trust] = (trusts[s.trust] || 0) + 1;
    if (s.la && matches(s.la, needle, qTokens)) las[s.la] = (las[s.la] || 0) + 1;
    if (s.region && matches(s.region, needle, qTokens)) regions[s.region] = (regions[s.region] || 0) + 1;
    if ((s.name || "").toLowerCase().includes(needle) && schools.length < 8) schools.push({ urn: s.urn, name: s.name, la: s.la });
  }
  const top = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, n]) => ({ name, n }));
  return { trusts: top(trusts), las: top(las), regions: top(regions), schools };
}

/* ── national benchmarks, computed once ── */
export function benchmarks(all) {
  const sec = secondaries(all);
  const take = (f) => sec.map(f).filter((v) => v != null);
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const med = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const a8 = take((s) => num(s.attainment8)), b94 = take((s) => num(s.basics_94)), b95 = take((s) => num(s.basics_95));
  const dis = take((s) => num(s.a8_disadv)), non = take((s) => num(s.a8_nondisadv));
  const prev = take((s) => num(s.a8_prev));
  return {
    n: sec.length,
    a8Mean: r1(mean(a8)), a8Med: r1(med(a8)),
    b94Med: r1(med(b94)), b95Med: r1(med(b95)),
    a8DisMean: r1(mean(dis)), a8NonMean: r1(mean(non)),
    a8PrevMean: r1(mean(prev)),
    drift: r1(mean(a8) - mean(prev)),
  };
}

/* ── the blocks: each returns pure data for the renderer ── */
export const BLOCK_TYPES = [
  { type: "cohort", name: "The cohort", desc: "every school in scope, headline by headline" },
  { type: "movement", name: "Movement", desc: "this year against last, school by school" },
  { type: "gap", name: "The disadvantage gap", desc: "disadvantaged and other pupils, side by side" },
  { type: "scatter", name: "Context and outcomes", desc: "FSM against Attainment 8, the scope against England" },
  { type: "distribution", name: "Where they sit", desc: "the national Attainment 8 distribution, scope schools marked" },
  { type: "ofsted", name: "Inspection profile", desc: "current Ofsted judgements across the scope" },
];

export function computeBlock(type, schools, all, bench) {
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const vals = (f) => schools.map(f).filter((v) => v != null);
  if (type === "cohort") {
    const rows = schools.map((s) => ({
      urn: s.urn, name: s.name, la: s.la, pupils: s.pupils ?? null, fsm: num(s.edu_fsm_pct),
      a8: num(s.attainment8), prev: num(s.a8_prev), d: num(s.attainment8) != null && num(s.a8_prev) != null ? r1(s.attainment8 - s.a8_prev) : null,
      b94: num(s.basics_94), b95: num(s.basics_95), p8prev: num(s.p8_prev), ofsted: s.ofsted || null,
    }));
    return { rows, a8Mean: r1(mean(vals((s) => num(s.attainment8)))), b95Mean: r1(mean(vals((s) => num(s.basics_95)))), fsmMean: r1(mean(vals((s) => num(s.edu_fsm_pct)))), bench };
  }
  if (type === "movement") {
    const rows = schools.filter((s) => num(s.attainment8) != null && num(s.a8_prev) != null)
      .map((s) => ({ name: s.name, prev: s.a8_prev, now: s.attainment8, d: r1(s.attainment8 - s.a8_prev) }))
      .sort((a, b) => b.d - a.d);
    return { rows, scopeDrift: r1(mean(rows.map((r) => r.d))), natDrift: bench.drift };
  }
  if (type === "gap") {
    const rows = schools.filter((s) => num(s.a8_disadv) != null && num(s.a8_nondisadv) != null)
      .map((s) => ({ name: s.name, dis: s.a8_disadv, non: s.a8_nondisadv, gap: r1(s.a8_nondisadv - s.a8_disadv) }))
      .sort((a, b) => a.gap - b.gap);
    return { rows, scopeDisMean: r1(mean(rows.map((r) => r.dis))), natDisMean: bench.a8DisMean, natNonMean: bench.a8NonMean };
  }
  if (type === "scatter") {
    const nat = secondaries(all).filter((s) => num(s.edu_fsm_pct) != null && num(s.attainment8) != null);
    const step = Math.max(1, Math.floor(nat.length / 1400));
    const cloud = nat.filter((_, i) => i % step === 0).map((s) => [r1(s.edu_fsm_pct), r1(s.attainment8)]);
    const marks = schools.filter((s) => num(s.edu_fsm_pct) != null && num(s.attainment8) != null)
      .map((s) => ({ name: s.name, fsm: r1(s.edu_fsm_pct), a8: r1(s.attainment8) }));
    return { cloud, marks };
  }
  if (type === "distribution") {
    const a8s = secondaries(all).map((s) => num(s.attainment8)).filter((v) => v != null);
    const bins = Array.from({ length: 18 }, (_, i) => ({ lo: i * 5, hi: i * 5 + 5, n: 0 }));
    a8s.forEach((v) => { const i = Math.max(0, Math.min(17, Math.floor(v / 5))); bins[i].n++; });
    const marks = schools.filter((s) => num(s.attainment8) != null).map((s) => ({ name: s.name, a8: s.attainment8 }));
    return { bins, total: a8s.length, marks, med: bench.a8Med };
  }
  if (type === "ofsted") {
    const count = (list) => { const m = {}; list.forEach((s) => { const k = s.ofsted && s.ofsted !== "Not inspected" ? s.ofsted : "Not yet inspected"; m[k] = (m[k] || 0) + 1; }); return m; };
    return { scope: count(schools), nat: count(secondaries(all)), n: schools.length, natN: secondaries(all).length };
  }
  return null;
}

export function computeReport(all, spec) {
  const schools = resolveScope(all, spec.scope);
  const bench = benchmarks(all);
  const blocks = (spec.blocks || []).map((b) => ({ type: b.type, data: computeBlock(b.type, schools, all, bench) })).filter((b) => b.data);
  return { schools, bench, blocks };
}
