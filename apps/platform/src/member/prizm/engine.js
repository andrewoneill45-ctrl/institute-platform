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

/* ── Ofsted grades live in a sibling file keyed by URN; join them once ── */
const OE = { 1: "Outstanding", 2: "Good", 3: "Requires improvement", 4: "Inadequate" };
export function attachOfsted(all, ofstedMap) {
  if (!ofstedMap) return all;
  for (const s of all) if (s.ofstedGrade === undefined) {
    const e = ofstedMap[String(s.urn)];
    s.ofstedGrade = e && OE[e.oe] ? OE[e.oe] : null;
  }
  return all;
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
export const TYPES = {
  grammar: { test: (s) => /grammar/i.test(s.name || ""), label: "Grammar" },
  "voluntary-aided": { test: (s) => s.type === "Voluntary aided school", label: "Voluntary aided" },
  free: { test: (s) => s.type === "Free schools", label: "Free" },
  community: { test: (s) => s.type === "Community school", label: "Community" },
  utc: { test: (s) => s.type === "University technical college", label: "UTC" },
  studio: { test: (s) => s.type === "Studio schools", label: "Studio" },
  academy: { test: (s) => /academy/i.test(s.type || ""), label: "Academy" },
};
const drift = (s) => (num(s.attainment8) != null && num(s.a8_prev) != null ? s.attainment8 - s.a8_prev : null);
function applyFilters(out, scope) {
  if (scope.faith && FAITHS[scope.faith]) out = out.filter((s) => FAITHS[scope.faith].re.test(s.religiousCharacter || ""));
  if (scope.gender) out = out.filter((s) => (s.gender || "") === scope.gender);
  if (scope.ofsted) out = out.filter((s) => (s.ofstedGrade || null) === scope.ofsted);
  if (scope.schoolType && TYPES[scope.schoolType]) out = out.filter(TYPES[scope.schoolType].test);
  if (scope.sixthForm === true) out = out.filter((s) => s.sixth_form === "Has a sixth form");
  if (scope.sixthForm === false) out = out.filter((s) => s.sixth_form === "Does not have a sixth form");
  if (scope.minPupils != null) out = out.filter((s) => num(s.pupils) != null && s.pupils >= scope.minPupils);
  if (scope.maxPupils != null) out = out.filter((s) => num(s.pupils) != null && s.pupils <= scope.maxPupils);
  if (scope.minFsm != null) out = out.filter((s) => num(s.edu_fsm_pct) != null && s.edu_fsm_pct >= scope.minFsm);
  if (scope.maxFsm != null) out = out.filter((s) => num(s.edu_fsm_pct) != null && s.edu_fsm_pct <= scope.maxFsm);
  if (scope.minA8 != null) out = out.filter((s) => num(s.attainment8) != null && s.attainment8 >= scope.minA8);
  if (scope.maxA8 != null) out = out.filter((s) => num(s.attainment8) != null && s.attainment8 <= scope.maxA8);
  if (scope.minDrift != null) out = out.filter((s) => drift(s) != null && drift(s) >= scope.minDrift);
  if (scope.maxDrift != null) out = out.filter((s) => drift(s) != null && drift(s) <= scope.maxDrift);
  if (scope.minAbs != null) out = out.filter((s) => num(s.abs_overall_pct) != null && s.abs_overall_pct >= scope.minAbs);
  if (scope.maxAbs != null) out = out.filter((s) => num(s.abs_overall_pct) != null && s.abs_overall_pct <= scope.maxAbs);
  if (scope.minPA != null) out = out.filter((s) => num(s.abs_persistent_pct) != null && s.abs_persistent_pct >= scope.minPA);
  if (scope.maxPA != null) out = out.filter((s) => num(s.abs_persistent_pct) != null && s.abs_persistent_pct <= scope.maxPA);
  if (scope.minSusp != null) out = out.filter((s) => num(s.susp_rate) != null && s.susp_rate >= scope.minSusp);
  if (scope.maxSusp != null) out = out.filter((s) => num(s.susp_rate) != null && s.susp_rate <= scope.maxSusp);
  if (scope.maxPex != null) out = out.filter((s) => num(s.permex_rate) != null && s.permex_rate <= scope.maxPex);
  if (scope.minDest != null) out = out.filter((s) => num(s.dest_sustained) != null && s.dest_sustained >= scope.minDest);
  if (scope.maxDest != null) out = out.filter((s) => num(s.dest_sustained) != null && s.dest_sustained <= scope.maxDest);
  if (scope.minNotsust != null) out = out.filter((s) => num(s.dest_notsust) != null && s.dest_notsust >= scope.minNotsust);
  if (scope.order && scope.order.by) {
    const key = { a8: (s) => num(s.attainment8) ?? -99, improvement: (s) => drift(s) ?? -99, pupils: (s) => num(s.pupils) ?? -1, fsm: (s) => num(s.edu_fsm_pct) ?? -1 }[scope.order.by];
    if (key) {
      out = [...out].sort((a, b) => key(b) - key(a));
      if (scope.order.limit) out = out.slice(0, scope.order.limit);
    }
  }
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
  } else if (scope.type === "town" && scope.name) {
    const t = scope.name.trim().toLowerCase();
    out = sec.filter((s) => (s.town || "").trim().toLowerCase() === t);
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
  const bits = [
    scope.ofsted,
    scope.gender === "Girls" ? "Girls'" : scope.gender === "Boys" ? "Boys'" : null,
    scope.faith && FAITHS[scope.faith] ? FAITHS[scope.faith].label : null,
    scope.schoolType && TYPES[scope.schoolType] ? TYPES[scope.schoolType].label : null,
  ].filter(Boolean);
  const tail = [
    scope.sixthForm === true ? "with sixth forms" : scope.sixthForm === false ? "11-16" : null,
    scope.minPupils != null ? `${scope.minPupils}+ pupils` : null, scope.maxPupils != null ? `under ${scope.maxPupils} pupils` : null,
    scope.minFsm != null ? `FSM ${scope.minFsm}%+` : null, scope.maxFsm != null ? `FSM under ${scope.maxFsm}%` : null,
    scope.minA8 != null ? `A8 ${scope.minA8}+` : null, scope.maxA8 != null ? `A8 under ${scope.maxA8}` : null,
    scope.minDrift != null ? "improving" : null, scope.maxDrift != null ? "declining" : null,
    scope.minAbs != null ? `absence ${scope.minAbs}%+` : null, scope.maxAbs != null ? `absence under ${scope.maxAbs}%` : null,
    scope.minPA != null ? `persistent absence ${scope.minPA}%+` : null, scope.maxPA != null ? `PA under ${scope.maxPA}%` : null,
    scope.minSusp != null ? `suspensions ${scope.minSusp}+ per 100` : null, scope.maxSusp != null ? `suspensions under ${scope.maxSusp}` : null,
    scope.maxPex === 0 ? "no permanent exclusions" : scope.maxPex != null ? `PEX under ${scope.maxPex}` : null,
    scope.minDest != null ? `sustained destinations ${scope.minDest}%+` : null, scope.maxDest != null ? `sustained under ${scope.maxDest}%` : null,
    scope.minNotsust != null ? `not sustained ${scope.minNotsust}%+` : null,
  ].filter(Boolean);
  const ordName = scope.order ? { a8: "Attainment 8", improvement: "improvement", pupils: "size", fsm: "FSM" }[scope.order.by] : null;
  const ord = ordName && scope.order.limit ? `Top ${scope.order.limit} by ${ordName} · ` : "";
  const pre = bits.join(" ");
  const wrap = (base) => ord + (pre ? `${pre} schools · ${base}` : base) + (tail.length ? " · " + tail.join(" · ") : "") + c;
  if (scope.type === "trust") return wrap(scope.name);
  if (scope.type === "la") return wrap(scope.name);
  if (scope.type === "region") return wrap(scope.name);
  if (scope.type === "town") return wrap(scope.name);
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
/* ── the query grammar: every attribute the dataset holds, parsed out of
   the sentence so what remains is the place. Deterministic and instant. ── */
export function parseQuery(raw) {
  let rest = " " + raw.toLowerCase() + " ";
  const f = {}; let order = null;
  const eat = (re, fn) => { const m = rest.match(re); if (m) { fn(m); rest = rest.replace(new RegExp(re.source, "g"), " "); } };
  /* ofsted - phrases before single words */
  eat(/\brequires improvement\b/, () => { f.ofsted = "Requires improvement"; });
  eat(/\boutstanding\b/, () => { f.ofsted = f.ofsted || "Outstanding"; });
  eat(/\binadequate\b/, () => { f.ofsted = f.ofsted || "Inadequate"; });
  eat(/\bgood (schools?|secondaries|academies)\b/, () => { f.ofsted = f.ofsted || "Good"; });
  /* faith */
  eat(/\b(church of england|c of e|cofe)\b/, () => { f.faith = "church-of-england"; });
  eat(/\b(roman catholic|catholic|rc)\b/, () => { f.faith = f.faith || "catholic"; });
  eat(/\bjewish\b/, () => { f.faith = f.faith || "jewish"; });
  eat(/\b(muslim|islamic)\b/, () => { f.faith = f.faith || "muslim"; });
  eat(/\bchristian\b/, () => { f.faith = f.faith || "christian"; });
  eat(/\bfaith schools?\b/, () => { f.faith = f.faith || "faith"; });
  /* gender */
  eat(/\bgirls?('s)?\b/, () => { f.gender = "Girls"; });
  eat(/\bboys?('s)?\b/, () => { f.gender = f.gender || "Boys"; });
  /* type */
  eat(/\b(grammar schools?|grammars|selective schools?)\b/, () => { f.schoolType = "grammar"; });
  eat(/\b(voluntary aided|va schools?)\b/, () => { f.schoolType = f.schoolType || "voluntary-aided"; });
  eat(/\bfree schools?\b/, () => { f.schoolType = f.schoolType || "free"; });
  eat(/\bcommunity schools?\b/, () => { f.schoolType = f.schoolType || "community"; });
  eat(/\b(utcs?|university technical colleges?)\b/, () => { f.schoolType = f.schoolType || "utc"; });
  eat(/\bstudio schools?\b/, () => { f.schoolType = f.schoolType || "studio"; });
  eat(/\b(academies|academy schools?)\b/, () => { f.schoolType = f.schoolType || "academy"; });
  /* sixth form and age range */
  eat(/\bwithout (a )?sixth forms?\b/, () => { f.sixthForm = false; });
  eat(/\bwith (a )?sixth forms?\b/, () => { f.sixthForm = f.sixthForm ?? true; });
  eat(/\b11\s*(?:-|to)\s*16\b/, () => { f.sixthForm = false; });
  eat(/\b11\s*(?:-|to)\s*18\b/, () => { f.sixthForm = f.sixthForm ?? true; });
  /* size */
  eat(/\b(over|above|more than|at least) (\d{3,4}) pupils\b/, (m) => { f.minPupils = +m[2]; });
  eat(/\b(under|below|fewer than|less than) (\d{3,4}) pupils\b/, (m) => { f.maxPupils = +m[2]; });
  eat(/\b(large|big) (schools?|secondaries)\b/, () => { f.minPupils = f.minPupils ?? 1200; });
  eat(/\bsmall (schools?|secondaries)\b/, () => { f.maxPupils = f.maxPupils ?? 650; });
  /* context */
  eat(/\b(high[- ]fsm|deprived|disadvantaged (areas?|intakes?|communities))\b/, () => { f.minFsm = f.minFsm ?? 35; });
  eat(/\b(low[- ]fsm|affluent|leafy)\b/, () => { f.maxFsm = f.maxFsm ?? 15; });
  eat(/\bfsm (over|above|at least) (\d{1,2})\s*%?/, (m) => { f.minFsm = +m[2]; });
  eat(/\bfsm (under|below) (\d{1,2})\s*%?/, (m) => { f.maxFsm = +m[2]; });
  /* attainment thresholds */
  eat(/\b(a8|attainment 8) (over|above|at least) (\d{2}(?:\.\d)?)\b/, (m) => { f.minA8 = +m[3]; });
  eat(/\b(a8|attainment 8) (under|below) (\d{2}(?:\.\d)?)\b/, (m) => { f.maxA8 = +m[3]; });
  /* attendance */
  eat(/\babsence (over|above) (\d{1,2}(?:\.\d)?)\s*%?/, (m) => { f.minAbs = +m[2]; });
  eat(/\babsence (under|below) (\d{1,2}(?:\.\d)?)\s*%?/, (m) => { f.maxAbs = +m[2]; });
  eat(/\b(poor|weak|low) attendance\b/, () => { f.minAbs = f.minAbs ?? 8; });
  eat(/\b(strong|excellent|high) attendance\b/, () => { f.maxAbs = f.maxAbs ?? 5.5; });
  eat(/\bpersistent absence (over|above) (\d{1,2})\s*%?/, (m) => { f.minPA = +m[2]; });
  eat(/\bpersistent absence (under|below) (\d{1,2})\s*%?/, (m) => { f.maxPA = +m[2]; });
  eat(/\bhigh persistent absence\b/, () => { f.minPA = f.minPA ?? 30; });
  /* behaviour */
  eat(/\bhigh suspensions?\b/, () => { f.minSusp = f.minSusp ?? 15; });
  eat(/\blow suspensions?\b/, () => { f.maxSusp = f.maxSusp ?? 4; });
  eat(/\bsuspension rates? (over|above) (\d{1,2}(?:\.\d)?)/, (m) => { f.minSusp = +m[2]; });
  eat(/\bsuspension rates? (under|below) (\d{1,2}(?:\.\d)?)/, (m) => { f.maxSusp = +m[2]; });
  eat(/\b(no|zero) permanent exclusions\b/, () => { f.maxPex = 0; });
  /* destinations */
  eat(/\bsustained destinations? (over|above|at least) (\d{2})\s*%?/, (m) => { f.minDest = +m[2]; });
  eat(/\bsustained destinations? (under|below) (\d{2})\s*%?/, (m) => { f.maxDest = +m[2]; });
  eat(/\b(strong|good) destinations\b/, () => { f.minDest = f.minDest ?? 95; });
  eat(/\b(weak|poor) destinations\b/, () => { f.maxDest = f.maxDest ?? 88; });
  eat(/\b(high neet|neet risk|neet)\b/, () => { f.minNotsust = f.minNotsust ?? 10; });
  /* movement */
  eat(/\b(?:the )?(\d{1,3})? ?most improved\b/, (m) => { order = { by: "improvement", limit: m[1] ? +m[1] : 20 }; });
  eat(/\bimproving\b/, () => { f.minDrift = f.minDrift ?? 0.05; });
  eat(/\b(declining|falling)\b/, () => { f.maxDrift = f.maxDrift ?? -0.05; });
  /* ranking */
  eat(/\b(largest|biggest) (\d{1,3})\b/, (m) => { order = { by: "pupils", limit: +m[2] }; });
  eat(/\b(top|best) (\d{1,3})\b/, (m) => { order = order || { by: "a8", limit: +m[2] }; });
  if (order) f.order = order;
  return { filters: f, hasF: Object.keys(f).length > 0, rest: rest.replace(/\s+/g, " ").trim() };
}

/* small edit distance for typo-tolerant place names */
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
const PLACE_CACHE = new WeakMap();
function placeNames(all) {
  if (PLACE_CACHE.has(all)) return PLACE_CACHE.get(all);
  const sec = secondaries(all);
  const grab = (k) => { const m = {}; sec.forEach((s) => { if (s[k]) m[s[k]] = (m[s[k]] || 0) + 1; }); return m; };
  const v = { region: grab("region"), la: grab("la"), town: grab("town") };
  PLACE_CACHE.set(all, v);
  return v;
}
function fuzzyPlaces(all, rest) {
  const qt = toks(rest).filter((t) => t.length >= 4);
  if (!qt.length) return [];
  const names = placeNames(all);
  const out = [];
  for (const kind of ["region", "la", "town"]) {
    for (const [name, n] of Object.entries(names[kind])) {
      const nt = toks(name);
      if (!nt.length) continue;
      const okAll = nt.every((t) => qt.some((q) => lev(t, q) <= (t.length >= 6 ? 2 : 1)));
      if (okAll) out.push({ kind, name, n, score: nt.length });
    }
  }
  return out.sort((a, b) => b.score - a.score || b.n - a.n).slice(0, 3);
}

export function searchEntities(all, q) {
  const raw = (q || "").trim().toLowerCase();
  if (raw.length < 2) return { trusts: [], las: [], regions: [], schools: [], composed: [] };
  const { filters, hasF, rest } = parseQuery(raw);
  const sec = secondaries(all);
  const top = (m) => Object.entries(m).sort((a, b) => b[1].sc - a[1].sc || b[1].n - a[1].n).slice(0, 5).map(([name, e]) => ({ name, n: e.n }));
  const pass = (needle) => {
    const qTokens = toks(needle);
    const trusts = {}, las = {}, regions = {}, towns = {};
    const schools = [];
    const add = (m, name, sc) => { const e = m[name] || (m[name] = { n: 0, sc }); e.n++; };
    if (needle.length >= 2) for (const s of sec) {
      let sc;
      if (s.trust && s.trust !== "Not supported by a trust" && (sc = matchScore(s.trust, needle, qTokens))) add(trusts, s.trust, sc);
      if (s.la && (sc = matchScore(s.la, needle, qTokens))) add(las, s.la, sc);
      if (s.region && (sc = matchScore(s.region, needle, qTokens))) add(regions, s.region, sc);
      if (s.town && s.town !== s.la && (sc = matchScore(s.town, needle, qTokens))) add(towns, s.town, sc);
      if ((s.name || "").toLowerCase().includes(needle) && schools.length < 8) schools.push({ urn: s.urn, name: s.name, la: s.la });
    }
    return { trusts: top(trusts), las: top(las), regions: top(regions), towns: top(towns), schools };
  };
  /* plain entities always match the query as typed - names may contain the
     filter words ("All Saints Catholic College") */
  const out = { ...pass(raw), composed: [] };
  const baseHits = hasF ? pass(rest) : out;
  let bases = [
    ...baseHits.regions.slice(0, 2).map((r) => ({ type: "region", name: r.name })),
    ...baseHits.las.slice(0, 2).map((l) => ({ type: "la", name: l.name })),
    ...(baseHits.towns || []).slice(0, 1).map((t) => ({ type: "town", name: t.name })),
    ...baseHits.trusts.slice(0, 1).map((t) => ({ type: "trust", name: t.name })),
  ];
  /* typo tolerance: when nothing matches by name, try close spellings */
  if (!bases.length && !out.schools.length) {
    const fz = fuzzyPlaces(all, hasF ? rest : raw);
    bases = fz.map((p) => ({ type: p.kind, name: p.name }));
    if (!hasF) fz.forEach((p) => { const list = p.kind === "region" ? out.regions : p.kind === "la" ? out.las : out.towns; if (!list.some((x) => x.name === p.name)) list.push({ name: p.name, n: p.n }); });
  }
  if (hasF) {
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
    absMed: r1(med(take((s) => num(s.abs_overall_pct)))),
    paMed: r1(med(take((s) => num(s.abs_persistent_pct)))),
    suspMed: r1(med(take((s) => num(s.susp_rate)))),
    pexMean: r1(mean(take((s) => num(s.permex_rate)))),
    destMed: r1(med(take((s) => num(s.dest_sustained)))),
    notsustMed: r1(med(take((s) => num(s.dest_notsust)))),
  };
}

/* ── the blocks: each returns pure data for the renderer ── */
export const BLOCK_TYPES = [
  { type: "headlines", name: "Headlines", desc: "the scope in four numbers, against England" },
  { type: "cohort", name: "The cohort", desc: "every school in scope, headline by headline" },
  { type: "movement", name: "Movement", desc: "this year against last, school by school" },
  { type: "gap", name: "The disadvantage gap", desc: "disadvantaged and other pupils, side by side" },
  { type: "attendance", name: "Attendance", desc: "overall and persistent absence against England" },
  { type: "behaviour", name: "Suspensions and exclusions", desc: "suspension rates and permanent exclusions" },
  { type: "destinations", name: "Destinations", desc: "where leavers went, and who wasn't sustained" },
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
  if (type === "attendance") {
    const rows = schools.filter((s) => num(s.abs_overall_pct) != null)
      .map((s) => ({ name: s.name, abs: r1(s.abs_overall_pct), pa: r1(s.abs_persistent_pct), sev: r1(s.abs_severe_pct) }))
      .sort((a, b) => a.abs - b.abs);
    return { rows, absMean: r1(mean(rows.map((r) => r.abs))), paMean: r1(mean(rows.map((r) => r.pa).filter((v) => v != null))), bench };
  }
  if (type === "behaviour") {
    const rows = schools.filter((s) => num(s.susp_rate) != null)
      .map((s) => ({ name: s.name, susp: r1(s.susp_rate), s1: r1(s.susp_one_plus_pct), pex: num(s.permex_rate) }))
      .sort((a, b) => a.susp - b.susp);
    return { rows, suspMean: r1(mean(rows.map((r) => r.susp))), pexZero: rows.filter((r) => r.pex === 0).length, bench };
  }
  if (type === "destinations") {
    const rows = schools.filter((s) => num(s.dest_sustained) != null)
      .map((s) => ({ name: s.name, dest: r1(s.dest_sustained), edu: r1(s.dest_edu), appren: r1(s.dest_appren), work: r1(s.dest_work), notsust: r1(s.dest_notsust) }))
      .sort((a, b) => b.dest - a.dest);
    return { rows, destMean: r1(mean(rows.map((r) => r.dest))), highNotsust: rows.filter((r) => r.notsust != null && r.notsust >= 10).length, bench };
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
    const count = (list) => { const m = {}; list.forEach((s) => { const k = s.ofstedGrade || "Not yet inspected"; m[k] = (m[k] || 0) + 1; }); return m; };
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
