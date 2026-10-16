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

/* ── attribute filters: faith and gender live on every scope ── */
export const FAITHS = {
  catholic: { re: /catholic/i, label: "Catholic" },
  "church-of-england": { re: /church of england/i, label: "Church of England" },
  jewish: { re: /jewish/i, label: "Jewish" },
  muslim: { re: /muslim/i, label: "Muslim" },
  christian: { re: /^christian$/i, label: "Christian" },
  faith: { re: /^(?!\s*$)(?!does not apply)(?!none).+/i, label: "Faith" },
};
function applyFilters(out, scope) {
  if (scope.faith && FAITHS[scope.faith]) out = out.filter((s) => FAITHS[scope.faith].re.test(s.religiousCharacter || ""));
  if (scope.gender) out = out.filter((s) => (s.gender || "") === scope.gender);
  return out;
}

/* ── scope resolution: which schools is this report about? ──
   scope = { type: "trust"|"la"|"region"|"england"|"urns"|"catholicLa",
             name?, urns?, las?, faith?, gender? } */
export function resolveScope(all, scope) {
  if (!scope || !scope.type) return [];
  const sec = secondaries(all);
  let out = [];
  if (scope.type === "england") {
    out = sec;
  } else if (scope.type === "trust" && scope.name) {
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
  return applyFilters([...out], scope).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export function scopeLabel(scope, n) {
  if (!scope) return "";
  const c = n != null ? ` · ${n} school${n === 1 ? "" : "s"}` : "";
  const pre = [scope.gender === "Girls" ? "Girls'" : scope.gender === "Boys" ? "Boys'" : null, scope.faith && FAITHS[scope.faith] ? FAITHS[scope.faith].label : null].filter(Boolean).join(" ");
  const wrap = (base) => (pre ? `${pre} schools · ${base}` : base) + c;
  if (scope.type === "trust") return wrap(scope.name);
  if (scope.type === "la") return wrap(scope.name);
  if (scope.type === "region") return wrap(scope.name);
  if (scope.type === "england") return wrap("England");
  if (scope.type === "catholicLa") return "Catholic schools · " + scope.las.join(", ") + c;
  if (scope.type === "urns") return pre ? wrap("selected schools") : "Selected schools" + c;
  return "";
}

/* ── the picker's search: understands sentences, not just substrings ──
   "Tell me about secondary schools in the North East of England" finds the
   region: furniture words are stripped and an entity matches when all of its
   own meaning-bearing tokens appear in the query (or the query appears in
   its name). Deterministic, instant, entirely on the device. */
const STOP = new Set(["tell", "me", "about", "the", "a", "an", "in", "of", "and", "or", "for", "on", "at", "to", "my", "our", "all", "show", "give", "want", "need", "with", "across", "report", "reports", "analysis", "analyse", "look", "looking", "compare", "schools", "school", "secondary", "secondaries", "england", "english", "please", "what", "how", "are", "doing", "i"]);
const toks = (s) => (s || "").toLowerCase().replace(/[^a-z0-9\s&']/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t));
/* 0 = no match; otherwise a score: how many of the candidate's own tokens
   the query contains (so "North East" outranks "East of England" when both
   match "north east"). A plain substring hit scores by full token count. */
function matchScore(name, needle, qTokens) {
  const n = (name || "").toLowerCase();
  const nt = toks(name);
  if (n.includes(needle)) return Math.max(nt.length, 1) + 0.5;
  return nt.length > 0 && nt.every((t) => qTokens.includes(t)) ? nt.length : 0;
}
/* pull faith and gender words out of the query, leaving the base */
function parseFilters(needle) {
  let rest = " " + needle + " ";
  const f = {};
  if (/\b(church of england|c of e|cofe|ce schools)\b/.test(rest)) { f.faith = "church-of-england"; rest = rest.replace(/\b(church of england|c of e|cofe)\b/g, " "); }
  for (const [key, word] of [["catholic", /\b(catholic|roman catholic|rc)\b/], ["jewish", /\bjewish\b/], ["muslim", /\b(muslim|islamic)\b/], ["christian", /\bchristian\b/], ["faith", /\bfaith\b/]]) {
    if (!f.faith && word.test(rest)) { f.faith = key; rest = rest.replace(word, " "); }
  }
  if (/\bgirls?('s)?\b/.test(rest)) { f.gender = "Girls"; rest = rest.replace(/\bgirls?('s)?\b/g, " "); }
  else if (/\bboys?('s)?\b/.test(rest)) { f.gender = "Boys"; rest = rest.replace(/\bboys?('s)?\b/g, " "); }
  return { filters: f, rest: rest.replace(/\s+/g, " ").trim() };
}

export function searchEntities(all, q) {
  const raw = (q || "").trim().toLowerCase();
  if (raw.length < 2) return { trusts: [], las: [], regions: [], schools: [], composed: [] };
  const { filters, rest } = parseFilters(raw);
  const hasF = !!(filters.faith || filters.gender);
  const sec = secondaries(all);
  const top = (m) => Object.entries(m).sort((a, b) => b[1].sc - a[1].sc || b[1].n - a[1].n).slice(0, 5).map(([name, e]) => ({ name, n: e.n }));
  const pass = (needle) => {
    const qTokens = toks(needle);
    const trusts = {}, las = {}, regions = {};
    const schools = [];
    const add = (m, name, sc) => { const e = m[name] || (m[name] = { n: 0, sc }); e.n++; };
    if (needle.length >= 2) for (const s of sec) {
      let sc;
      if (s.trust && s.trust !== "Not supported by a trust" && (sc = matchScore(s.trust, needle, qTokens))) add(trusts, s.trust, sc);
      if (s.la && (sc = matchScore(s.la, needle, qTokens))) add(las, s.la, sc);
      if (s.region && (sc = matchScore(s.region, needle, qTokens))) add(regions, s.region, sc);
      if ((s.name || "").toLowerCase().includes(needle) && schools.length < 8) schools.push({ urn: s.urn, name: s.name, la: s.la });
    }
    return { trusts: top(trusts), las: top(las), regions: top(regions), schools };
  };
  /* plain entities always match the query as typed - names may contain the
     filter words ("All Saints Catholic College") */
  const out = { ...pass(raw), composed: [] };
  if (hasF) {
    /* composition uses what remains once the filters are lifted out - or
       England when the query names no place at all */
    const base = pass(rest);
    const bases = [
      ...base.regions.slice(0, 2).map((r) => ({ type: "region", name: r.name })),
      ...base.las.slice(0, 2).map((l) => ({ type: "la", name: l.name })),
      ...base.trusts.slice(0, 1).map((t) => ({ type: "trust", name: t.name })),
    ];
    if (!bases.length) bases.push({ type: "england" });
    out.composed = bases.map((b) => {
      const sc = { ...b, ...filters };
      const n = resolveScope(all, sc).length;
      return n ? { label: scopeLabel(sc), n, sc } : null;
    }).filter(Boolean).slice(0, 4);
  }
  return out;
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
  { type: "headlines", name: "Headlines", desc: "the scope in four numbers, against England" },
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
  if (type === "headlines") {
    const a8s = vals((s) => num(s.attainment8));
    return {
      n: schools.length,
      las: new Set(schools.map((s) => s.la).filter(Boolean)).size,
      a8Mean: r1(mean(a8s)),
      b94Mean: r1(mean(vals((s) => num(s.basics_94)))),
      b95Mean: r1(mean(vals((s) => num(s.basics_95)))),
      fsmMean: r1(mean(vals((s) => num(s.edu_fsm_pct)))),
      aboveNat: a8s.filter((v) => v >= bench.a8Med).length,
      drift: r1(mean(schools.filter((s) => num(s.attainment8) != null && num(s.a8_prev) != null).map((s) => s.attainment8 - s.a8_prev))),
      bench,
    };
  }
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
