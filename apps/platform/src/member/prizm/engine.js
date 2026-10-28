/* Prizm's engine — the deterministic half of the report studio.
   The AI reads intent and arranges blocks; every figure on the page is
   computed here, from the same national dataset Atlas holds, and is
   traceable to its DfE vintage. Nothing in this file calls a network. */

export const VINTAGE = "DfE performance data 2025/26 provisional · arrows against 2024/25 · P8 is 2023/24, the last published";
export const VINTAGE_P16 = "DfE 16 to 19 performance, 2024/25 final (April 2026) · attainment 2021/22 to 2024/25 · L3 value added 2023/24 and 2024/25 only";
export const VINTAGE_PLACES = "DfE applications and offers 2026/27 (2014/15 to 2026/27) · school capacity 2024/25, planning-area forecasts to 2031/32";
export const VINTAGE_KS2 = "DfE KS2 data 2024/25, the latest published · arrows against 2023/24 · 2025/26 school-level KS2 publishes December 2026";

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
export const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);

/* ── who counts: state-funded mainstream schools with KS4 results ──
   Independents are excluded (unregulated iGCSEs make their A8 an artefact,
   not a judgement) and so are special and alternative provision, exactly as
   the DfE's own school comparisons default. */
export function secondaries(all) {
  return all.filter((s) => num(s.attainment8) != null && !/independent|special|pupil referral|alternative|secure/i.test(s.type || ""));
}
/* The primary estate: state-funded mainstream schools with published KS2. */
export function primaries(all) {
  return all.filter((s) => num(s.ks2_rwm_exp) != null && !/independent|special|pupil referral|alternative|secure/i.test(s.type || ""));
}
const baseFor = (all, scope) => (scope && scope.phase === "primary" ? primaries(all) : secondaries(all));

/* ── Ofsted grades live in a sibling file keyed by URN; join them once ── */
const OE = { 1: "Outstanding", 2: "Good", 3: "Requires improvement", 4: "Inadequate" };
export function attachOfsted(all, ofstedMap) {
  if (!ofstedMap) return all;
  for (const s of all) if (s.ofstedGrade === undefined) {
    const e = ofstedMap[String(s.urn)];
    s.ofstedGrade = e && OE[e.oe] ? OE[e.oe] : null;
    s.ofstedCard = e && e.rc ? e.rc : null;
  }
  return all;
}

/* the renewed framework's five-point scale and its evaluation areas */
export const RC_GRADES = ["Exceptional", "Strong standard", "Expected standard", "Needs attention", "Urgent improvement"];
export const RC_AREAS = [["inc", "Inclusion"], ["ct", "Curriculum and teaching"], ["ach", "Achievement"], ["ab", "Attendance and behaviour"], ["pdw", "Personal development and wellbeing"], ["ey", "Early years"], ["p16", "Post-16 provision"], ["lg", "Leadership and governance"]];

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
const pdrift = (s) => (num(s.ks2_rwm_exp) != null && num(s.ks2_rwm_prev) != null ? s.ks2_rwm_exp - s.ks2_rwm_prev : null);
const pdriftOk = (s) => num(s.ks2_rwm_exp) != null && num(s.ks2_rwm_prev) != null;
function applyFilters(out, scope) {
  const PRI = scope.phase === "primary";
  const dr = PRI ? pdrift : drift;
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
  if (scope.minDrift != null) out = out.filter((s) => dr(s) != null && dr(s) >= scope.minDrift);
  if (scope.maxDrift != null) out = out.filter((s) => dr(s) != null && dr(s) <= scope.maxDrift);
  if (scope.noGrammar) out = out.filter((s) => !TYPES.grammar.test(s));
  if (scope.minTurnover != null) out = out.filter((s) => num(s.wf_turnover_pct) != null && s.wf_turnover_pct >= scope.minTurnover);
  if (scope.maxTurnover != null) out = out.filter((s) => num(s.wf_turnover_pct) != null && s.wf_turnover_pct <= scope.maxTurnover);
  if (scope.minPtr != null) out = out.filter((s) => num(s.wf_ptr) != null && s.wf_ptr >= scope.minPtr);
  if (scope.maxPtr != null) out = out.filter((s) => num(s.wf_ptr) != null && s.wf_ptr <= scope.maxPtr);
  if (scope.minVac != null) out = out.filter((s) => num(s.wf_vac_rate) != null && s.wf_vac_rate >= scope.minVac);
  if (scope.maxVac != null) out = out.filter((s) => num(s.wf_vac_rate) != null && s.wf_vac_rate <= scope.maxVac);
  if (scope.minSpend != null) out = out.filter((s) => num(s.fin_spend_pp) != null && s.fin_spend_pp >= scope.minSpend);
  if (scope.maxSpend != null) out = out.filter((s) => num(s.fin_spend_pp) != null && s.fin_spend_pp <= scope.maxSpend);
  if (scope.deficit) out = out.filter((s) => num(s.fin_reserve_pp) != null && s.fin_reserve_pp < 0);
  if (scope.minEhcp != null) out = out.filter((s) => num(s.sen_ehcp_pct) != null && s.sen_ehcp_pct >= scope.minEhcp);
  if (scope.maxEhcp != null) out = out.filter((s) => num(s.sen_ehcp_pct) != null && s.sen_ehcp_pct <= scope.maxEhcp);
  if (scope.senUnit) out = out.filter((s) => s.sen_unit === true);
  if (scope.senRp) out = out.filter((s) => s.sen_rp === true);
  if (scope.hasCard) out = out.filter((s) => s.ofstedCard != null);
  if (scope.idaci != null) out = out.filter((s) => s.idaci === scope.idaci);
  if (scope.minRwm != null) out = out.filter((s) => num(s.ks2_rwm_exp) != null && s.ks2_rwm_exp >= scope.minRwm);
  if (scope.maxRwm != null) out = out.filter((s) => num(s.ks2_rwm_exp) != null && s.ks2_rwm_exp <= scope.maxRwm);
  if (scope.minRead != null) out = out.filter((s) => num(s.ks2_read_avg) != null && s.ks2_read_avg >= scope.minRead);
  if (scope.maxRead != null) out = out.filter((s) => num(s.ks2_read_avg) != null && s.ks2_read_avg <= scope.maxRead);
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
    const key = (PRI
      ? { a8: (s) => num(s.ks2_rwm_exp) ?? -99, rwm: (s) => num(s.ks2_rwm_exp) ?? -99, reading: (s) => num(s.ks2_read_avg) ?? -99, improvement: (s) => pdrift(s) ?? -99, pupils: (s) => num(s.pupils) ?? -1, fsm: (s) => num(s.edu_fsm_pct) ?? -1, spend: (s) => num(s.fin_spend_pp) ?? -1, ehcp: (s) => num(s.sen_ehcp_pct) ?? -1 }
      : { a8: (s) => num(s.attainment8) ?? -99, improvement: (s) => drift(s) ?? -99, pupils: (s) => num(s.pupils) ?? -1, fsm: (s) => num(s.edu_fsm_pct) ?? -1, spend: (s) => num(s.fin_spend_pp) ?? -1, ehcp: (s) => num(s.sen_ehcp_pct) ?? -1 })[scope.order.by];
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
  const sec = baseFor(all, scope);
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
  } else if (scope.type === "pcon" && scope.name) {
    const p = scope.name.trim().toLowerCase();
    out = sec.filter((s) => (s.pcon || "").trim().toLowerCase() === p);
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
    scope.phase === "primary" ? "primary" : null,
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
    scope.minRwm != null ? `RWM ${scope.minRwm}%+` : null, scope.maxRwm != null ? `RWM under ${scope.maxRwm}%` : null,
    scope.minRead != null ? `reading ${scope.minRead}+` : null, scope.maxRead != null ? `reading under ${scope.maxRead}` : null,
    scope.noGrammar ? "grammars set aside" : null,
    scope.minTurnover != null ? `turnover ${scope.minTurnover}%+` : null, scope.maxTurnover != null ? `turnover under ${scope.maxTurnover}%` : null,
    scope.minPtr != null ? `PTR ${scope.minPtr}+` : null, scope.maxPtr != null ? `PTR under ${scope.maxPtr}` : null,
    scope.minVac != null ? "with unfilled posts" : null, scope.maxVac === 0 ? "no unfilled posts" : null,
    scope.minSpend != null ? `spend £${scope.minSpend.toLocaleString("en-GB")}+ per pupil` : null, scope.maxSpend != null ? `spend under £${scope.maxSpend.toLocaleString("en-GB")}` : null,
    scope.deficit ? "in deficit" : null,
    scope.minEhcp != null ? `EHCP ${scope.minEhcp}%+` : null, scope.maxEhcp != null ? `EHCP under ${scope.maxEhcp}%` : null,
    scope.senUnit ? "with SEN units" : null, scope.senRp ? "with resourced provision" : null,
    scope.hasCard ? "with report cards" : null,
    scope.idaci != null ? (scope.idaci === 5 ? "most deprived fifth" : scope.idaci === 1 ? "least deprived fifth" : `IDACI quintile ${scope.idaci}`) : null,
  ].filter(Boolean);
  const ordName = scope.order ? { a8: scope.phase === "primary" ? "RWM" : "Attainment 8", rwm: "RWM", reading: "reading", improvement: "improvement", pupils: "size", fsm: "FSM", spend: "spend per pupil", ehcp: "EHC plan share" }[scope.order.by] : null;
  const ord = ordName && scope.order.limit ? `Top ${scope.order.limit} by ${ordName} · ` : "";
  const pre = bits.join(" ");
  const vs = scope.versus && scope.versus.type ? ` vs ${scopeShort(scope.versus)}` : "";
  const wrap = (base) => ord + (pre ? `${pre} schools · ${base}` : base) + vs + (tail.length ? " · " + tail.join(" · ") : "") + c;
  if (scope.type === "trust") return wrap(scope.name);
  if (scope.type === "la") return wrap(scope.name);
  if (scope.type === "region") return wrap(scope.name);
  if (scope.type === "town") return wrap(scope.name);
  if (scope.type === "pcon") return wrap(scope.name);
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
/* words that describe schools in general can never name one entity */
const GENERIC = new Set(["school", "schools", "secondary", "secondaries", "primary", "primaries", "academy", "academies", "trust", "trusts", "college", "colleges", "education", "pupils", "children", "the", "and", "with", "for", "in", "of"]);
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
  /* phase first: "primary/primaries" becomes the generic noun so every other
     pattern ("good primaries", "small primaries") still reads naturally */
  /* both phases named: neither is a filter (a report holds one phase; the
     caller says so plainly) */
  const bothPhases = /\b(primary|primaries)\b/.test(rest) && /\b(secondary|secondaries)\b/.test(rest);
  if (bothPhases) rest = rest.replace(/\b(both )?(primary|primaries)( (and|&|or) )?(secondary|secondaries)?\b/g, " schools ").replace(/\b(secondary|secondaries)\b/g, " schools ");
  if (!bothPhases && /\b(primary|primaries|ks2|key stage 2|sats|juniors?)\b/.test(rest)) {
    f.phase = "primary";
    rest = rest.replace(/\bprimar(y|ies)\b/g, "schools").replace(/\b(ks2|key stage 2|sats|juniors?)( (results|data|outcomes))?\b/g, " ").replace(/\s+/g, " ");
    if (!/^\s/.test(rest)) rest = " " + rest;
    if (!/\s$/.test(rest)) rest = rest + " ";
  }
  /* primary measures */
  eat(/\b(rwm|reading,? writing and maths|combined) (over|above|at least) (\d{1,2})\s*%?/, (m) => { f.minRwm = +m[3]; f.phase = "primary"; });
  eat(/\b(rwm|reading,? writing and maths|combined) (under|below) (\d{1,2})\s*%?/, (m) => { f.maxRwm = +m[3]; f.phase = "primary"; });
  eat(/\b(strong|high) (rwm|standards)\b/, () => { if (f.phase === "primary") f.minRwm = f.minRwm ?? 75; });
  eat(/\b(weak|low|poor) (rwm|standards)\b/, () => { if (f.phase === "primary") f.maxRwm = f.maxRwm ?? 50; });
  eat(/\breading (scores? )?(over|above|at least) (\d{2,3})\b/, (m) => { f.minRead = +m[3]; f.phase = "primary"; });
  eat(/\breading (scores? )?(under|below) (\d{2,3})\b/, (m) => { f.maxRead = +m[3]; f.phase = "primary"; });
  eat(/\b(strong|excellent) read(ing|ers)\b/, () => { f.minRead = f.minRead ?? 106; f.phase = "primary"; });
  eat(/\b(weak|poor|struggling) read(ing|ers)\b/, () => { f.maxRead = f.maxRead ?? 102; f.phase = "primary"; });
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
  eat(/\b(without|excluding|minus|no) (the )?grammars?( schools)?\b/, () => { f.noGrammar = true; });
  eat(/\bnon-?selective\b/, () => { f.noGrammar = true; });
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
  /* IDACI quintiles claim "deprived" first when a fifth or quintile is named */
  eat(/\b(in )?the most deprived (fifth|quintile|areas?)\b/, () => { f.idaci = 5; });
  eat(/\b(in )?the least deprived (fifth|quintile|areas?)\b/, () => { f.idaci = 1; });
  eat(/\bidaci (quintile )?([1-5])\b/, (m) => { f.idaci = +m[2]; });
  eat(/\b(highest|most|largest|biggest) (ehcp?|ehc[- ]plans?|send)( shares?| rates?| proportions?| levels?)?\b/, () => { order = { ...(order || { limit: 25 }), by: "ehcp" }; });
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
  /* workforce */
  eat(/\bturnover (over|above) (\d{1,2})\s*%?/, (m) => { f.minTurnover = +m[2]; });
  eat(/\bturnover (under|below) (\d{1,2})\s*%?/, (m) => { f.maxTurnover = +m[2]; });
  eat(/\bhigh (teacher )?turnover\b/, () => { f.minTurnover = f.minTurnover ?? 20; });
  eat(/\b(low (teacher )?turnover|stable staffing|stable staff)\b/, () => { f.maxTurnover = f.maxTurnover ?? 10; });
  eat(/\bptr (over|above) (\d{1,2})\b/, (m) => { f.minPtr = +m[2]; });
  eat(/\bptr (under|below) (\d{1,2})\b/, (m) => { f.maxPtr = +m[2]; });
  eat(/\b(with|carrying) (teacher )?vacanc(y|ies)\b/, () => { f.minVac = 0.01; });
  eat(/\b(no|without) (teacher )?vacanc(y|ies)\b/, () => { f.maxVac = 0; });
  /* inclusion */
  eat(/\behcp? (?:share |rate )?(over|above|at least) (\d{1,2}(?:\.\d)?)\s*%?/, (m) => { f.minEhcp = +m[2]; });
  eat(/\behcp? (?:share |rate )?(under|below) (\d{1,2}(?:\.\d)?)\s*%?/, (m) => { f.maxEhcp = +m[2]; });
  eat(/\b(high ehcp|high(est)? needs?)\b/, () => { f.minEhcp = f.minEhcp ?? 6; });
  eat(/\bwith (a |an )?sen units?\b/, () => { f.senUnit = true; });
  eat(/\bwith (a |an )?(resourced provisions?|rps?)\b/, () => { f.senRp = true; });
  eat(/\b(with (a )?report cards?|report[- ]carded|inspected under the (new|renewed) framework)\b/, () => { f.hasCard = true; });
  /* finance */
  eat(/\b(?:spend(?:ing)?|expenditure) (?:of )?(over|above|at least) £?([\d,]{4,7})(?: per pupil)?\b/, (m) => { f.minSpend = +m[2].replace(/,/g, ""); });
  eat(/\b(?:spend(?:ing)?|expenditure) (?:of )?(under|below) £?([\d,]{4,7})(?: per pupil)?\b/, (m) => { f.maxSpend = +m[2].replace(/,/g, ""); });
  eat(/\b(in deficit|carrying (a )?deficits?|with (a )?deficits?|deficit schools?)\b/, () => { f.deficit = true; });
  eat(/\bdeficits?\b/, () => { f.deficit = true; });
  /* movement */
  eat(/\b(?:the )?(\d{1,3})? ?most improved\b/, (m) => { order = { by: "improvement", limit: m[1] ? +m[1] : 20 }; });
  /* "falling rolls" is about pupil numbers, not attainment drift: consume it
     whole so the flow block (added from the words) answers it */
  eat(/\b(falling|shrinking|declining) rolls?\b/, () => {});
  eat(/\bimproving\b/, () => { f.minDrift = f.minDrift ?? 0.05; });
  eat(/\b(declining|falling)\b/, () => { f.maxDrift = f.maxDrift ?? -0.05; });
  /* ranking */
  eat(/\b(largest|biggest) (\d{1,3})\b/, (m) => { order = { by: "pupils", limit: +m[2] }; });
  eat(/\b(top|best) (\d{1,3})\b/, (m) => { order = order || { by: "a8", limit: +m[2] }; });
  eat(/\bby spend(?:ing)?\b/, () => { order = { ...(order || { limit: 25 }), by: "spend" }; });
  eat(/\b(highest|biggest) spend(?:ers|ing)?\b/, () => { order = { ...(order || { limit: 25 }), by: "spend" }; });
  if (order) f.order = order;
  return { filters: f, hasF: Object.keys(f).length > 0, rest: rest.replace(/\s+/g, " ").trim(), bothPhases };
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
  const v = { region: grab("region"), la: grab("la"), town: grab("town"), pcon: grab("pcon") };
  PLACE_CACHE.set(all, v);
  return v;
}
const COMMON = new Set(["both", "tell", "about", "education", "overall", "summary", "picture", "across", "whole", "country", "national", "nationally", "england", "english", "please", "could", "would", "should", "compare", "between", "against", "more", "most", "with", "from", "have", "what", "when", "where", "will", "over", "under", "about", "their", "there", "than", "that", "this", "then", "since", "best", "good", "high", "low", "very", "into", "near", "like", "some", "many", "much", "year", "years", "data", "results", "show", "give", "need", "want", "look", "looking"]);
function fuzzyPlaces(all, rest) {
  const qt = toks(rest).filter((t) => t.length >= 5 && !GENERIC.has(t) && !COMMON.has(t));
  if (!qt.length) return [];
  const names = placeNames(all);
  const out = [];
  for (const kind of ["region", "la", "town", "pcon"]) {
    for (const [name, n] of Object.entries(names[kind])) {
      const nt = toks(name);
      if (!nt.length) continue;
      const okAll = nt.every((t) => qt.some((q) => t === q || (t.length >= 5 && lev(t, q) <= (t.length >= 6 && q.length >= 6 ? 2 : 1))));
      if (okAll) out.push({ kind, name, n, score: nt.length });
    }
  }
  return out.sort((a, b) => b.score - a.score || b.n - a.n).slice(0, 3);
}

/* the best single scope a search result offers, for pairing two sides */
function bestScope(res) {
  if (res.composed && res.composed.length) return res.composed[0].sc;
  if (res.regions.length) return { type: "region", name: res.regions[0].name };
  if (res.las.length) return { type: "la", name: res.las[0].name };
  if (res.pcons && res.pcons.length) return { type: "pcon", name: res.pcons[0].name };
  if (res.towns && res.towns.length) return { type: "town", name: res.towns[0].name };
  if (res.trusts.length) return { type: "trust", name: res.trusts[0].name };
  return null;
}

export function searchEntities(all, q) {
  const raw = (q || "").trim().toLowerCase();
  if (raw.length < 2) return { trusts: [], las: [], regions: [], towns: [], pcons: [], schools: [], composed: [] };
  /* "A vs B", "A against B": two scopes, one report */
  const VS = /\s+(?:vs\.?|versus|against|compared (?:to|with))\s+/;
  if (VS.test(raw)) {
    const [qa, qb] = raw.split(VS, 2);
    const A = searchEntities(all, qa);
    const sa = bestScope(A);
    /* a bare "england" side means the national estate, not a region whose
       name happens to contain the word */
    const qbParsed = parseQuery(qb);
    let sb = /^\s*(?:the |whole of |all of |rest of )*england\s*$/.test(qbParsed.rest)
      ? { ...qbParsed.filters, type: "england" }
      : bestScope(searchEntities(all, qb));
    if (sa && sb) {
      const sc = { ...sa, versus: sb };
      const n = resolveScope(all, sc).length;
      if (n) A.composed = [{ label: scopeLabel(sc, n), n, sc }, ...A.composed.filter((c) => !c.sc.versus)].slice(0, 4);
    }
    return A;
  }
  const { filters, hasF, rest } = parseQuery(raw);
  const sec = filters.phase === "primary" ? primaries(all) : secondaries(all);
  const top = (m) => Object.entries(m).sort((a, b) => b[1].sc - a[1].sc || b[1].n - a[1].n).slice(0, 5).map(([name, e]) => ({ name, n: e.n }));
  const pass = (needle) => {
    const qTokens = toks(needle);
    /* a needle of generic words only ("schools") names nothing */
    if (!qTokens.length || qTokens.every((t) => GENERIC.has(t))) return { trusts: [], las: [], regions: [], towns: [], pcons: [], schools: [] };
    const trusts = {}, las = {}, regions = {}, towns = {}, pcons = {};
    const schools = [];
    const add = (m, name, sc) => { const e = m[name] || (m[name] = { n: 0, sc }); e.n++; };
    if (needle.length >= 2) for (const s of sec) {
      let sc;
      if (s.trust && s.trust !== "Not supported by a trust" && (sc = matchScore(s.trust, needle, qTokens))) add(trusts, s.trust, sc);
      if (s.la && (sc = matchScore(s.la, needle, qTokens))) add(las, s.la, sc);
      if (s.region && (sc = matchScore(s.region, needle, qTokens))) add(regions, s.region, sc);
      if (s.town && s.town !== s.la && (sc = matchScore(s.town, needle, qTokens))) add(towns, s.town, sc);
      if (s.pcon && s.pcon !== s.la && s.pcon !== s.town && (sc = matchScore(s.pcon, needle, qTokens))) add(pcons, s.pcon, sc);
      if ((s.name || "").toLowerCase().includes(needle) && schools.length < 8) schools.push({ urn: s.urn, name: s.name, la: s.la });
    }
    return { trusts: top(trusts), las: top(las), regions: top(regions), towns: top(towns), pcons: top(pcons), schools };
  };
  /* plain entities always match the query as typed - names may contain the
     filter words ("All Saints Catholic College") */
  const out = { ...pass(raw), composed: [] };
  const baseHits = hasF ? pass(rest) : out;
  let bases = [
    ...baseHits.regions.slice(0, 2).map((r) => ({ type: "region", name: r.name })),
    ...baseHits.las.slice(0, 2).map((l) => ({ type: "la", name: l.name })),
    ...(baseHits.pcons || []).slice(0, 1).map((p) => ({ type: "pcon", name: p.name })),
    ...(baseHits.towns || []).slice(0, 1).map((t) => ({ type: "town", name: t.name })),
    ...baseHits.trusts.slice(0, 1).map((t) => ({ type: "trust", name: t.name })),
  ];
  /* an entity the full query matched strongly beats every fallback: a filter
     word eaten out of its own name ("DELTA ACADEMIES TRUST" losing
     "academies") must not cost the entity the compose */
  if (hasF && !bases.length) {
    const rawT = toks(raw);
    for (const [type, list] of [["region", out.regions], ["la", out.las], ["pcon", out.pcons || []], ["town", out.towns || []], ["trust", out.trusts]]) {
      const e = (list || [])[0];
      if (e && toks(e.name).length >= 2 && toks(e.name).every((w) => rawT.includes(w))) {
        bases.push({ type, name: e.name });
        /* a filter word living inside the entity's own name was part of the
           name, not a request: drop the filter it spawned */
        const nm = e.name.toLowerCase();
        if (filters.schoolType && new RegExp(filters.schoolType === "academy" ? "academ" : filters.schoolType, "i").test(nm)) delete filters.schoolType;
        if (filters.faith && nm.includes(filters.faith === "church-of-england" ? "church" : filters.faith)) delete filters.faith;
        if (filters.gender && nm.includes(filters.gender.toLowerCase())) delete filters.gender;
        break;
      }
    }
  }
  /* region shorthand: the names people actually say */
  const needleStr = " " + (hasF ? rest : raw) + " ";
  if (!bases.some((b) => b.type === "region")) {
    for (const [k, nm] of [["yorkshire", "Yorkshire and the Humber"], ["humberside", "Yorkshire and the Humber"], ["east mids", "East Midlands"], ["west mids", "West Midlands"], ["the midlands", "West Midlands"]]) {
      if (needleStr.includes(" " + k + " ")) {
        bases.unshift({ type: "region", name: nm });
        if (!out.regions.some((r) => r.name === nm)) out.regions.unshift({ name: nm, n: resolveScope(all, { type: "region", name: nm }).length });
        break;
      }
    }
  }
  /* the plainest word wins: "England", "national", "the country" with no
     particular place named means the nation, never a fuzzy guess */
  const NATIONAL = /\b(england|national(ly)?|nationwide|the (whole )?country|across the country)\b/;
  if (!bases.length && NATIONAL.test(raw)) {
    bases = [{ type: "england" }];
    if (!hasF) { const n = resolveScope(all, { type: "england" }).length; out.composed = [{ label: scopeLabel({ type: "england" }), n, sc: { type: "england" } }]; }
  }
  /* typo tolerance, for short typed lookups only: a sentence never
     fuzzy-matches a place out of its stray words ("both" is not Bath) */
  const meat = toks(hasF ? rest : raw).filter((t) => !GENERIC.has(t));
  if (!bases.length && !out.schools.length && meat.length && toks(raw).length <= 3) {
    const fz = fuzzyPlaces(all, meat.join(" "));
    bases = fz.map((p) => ({ type: p.kind, name: p.name }));
    if (!hasF) fz.forEach((p) => { const list = p.kind === "region" ? out.regions : p.kind === "la" ? out.las : p.kind === "pcon" ? (out.pcons = out.pcons || []) : out.towns; if (!list.some((x) => x.name === p.name)) list.push({ name: p.name, n: p.n }); });
    /* trusts deserve the same forgiveness as places */
    if (!bases.length) {
      const rt = resolveEntity(all, "trust", meat.join(" "));
      const found = rt.ok ? [{ name: rt.name, n: rt.n }] : (rt.candidates || []).map((c) => ({ name: c.name, n: c.n }));
      if (rt.ok) bases = [{ type: "trust", name: rt.name }];
      if (!hasF) found.forEach((t) => { if (!out.trusts.some((x) => x.name === t.name)) out.trusts.push(t); });
    }
  }
  if (hasF) {
    if (!bases.length) bases.push({ type: "england" });
    out.composed = bases.map((b) => {
      const sc = { ...b, ...filters };
      const n = resolveScope(all, sc).length;
      return n ? { label: scopeLabel(sc), n, sc } : null;
    }).filter(Boolean).slice(0, 4);
    /* every base zeroed out by the filters: the national read is the honest one */
    if (!out.composed.length) {
      const sc = { type: "england", ...filters };
      const n = resolveScope(all, sc).length;
      if (n) out.composed = [{ label: scopeLabel(sc), n, sc }];
    }
  }
  return out;
}

/* ── the search's honesty layer ─────────────────────────────────────────────
   Three disciplines the box lives by: every name is resolved against the
   dataset's own spellings (resolveEntity); every scope anyone proposes, the
   reader included, is verified before a single chart renders (verifyScope);
   and a sentence composes a scope only at confidence, otherwise it returns
   candidates to ASK with, never a guess (composeFromText). */
function entityNames(all, type) {
  if (type === "trust") {
    const m = {};
    secondaries(all).concat(primaries(all)).forEach((s) => { if (s.trust && s.trust !== "Not supported by a trust") m[s.trust] = (m[s.trust] || 0) + 1; });
    return m;
  }
  return placeNames(all)[type === "la" ? "la" : type] || {};
}
export function resolveEntity(all, type, name) {
  const want = (name || "").trim().toLowerCase();
  if (!want) return { ok: false, candidates: [] };
  const names = entityNames(all, type);
  for (const n of Object.keys(names)) if (n.toLowerCase() === want) return { ok: true, name: n, n: names[n] };
  /* containment next: "United Learning" finds "UNITED LEARNING TRUST" */
  const contains = Object.keys(names).filter((n) => n.toLowerCase().includes(want) || want.includes(n.toLowerCase()));
  if (contains.length === 1) return { ok: true, name: contains[0], n: names[contains[0]], fixed: true };
  /* then forgiving: every token of the candidate close to a token of the ask */
  const qt = toks(want).filter((t) => t.length >= 3);
  const scored = [];
  for (const [n, count] of Object.entries(names)) {
    const nt = toks(n);
    if (!nt.length || !qt.length) continue;
    const hit = qt.filter((q) => nt.some((t) => t === q || (q.length >= 4 && lev(t, q) <= (t.length >= 6 ? 2 : 1)))).length;
    if (hit >= Math.max(1, qt.length - 1) && hit >= Math.ceil(nt.length / 2)) scored.push({ name: n, n: count, score: hit * 2 + (nt.length === qt.length ? 1 : 0) });
  }
  scored.sort((a, b) => b.score - a.score || b.n - a.n);
  if (scored.length && (scored.length === 1 || scored[0].score > (scored[1] ? scored[1].score : 0))) {
    const uniq = contains.length <= 1;
    if (uniq && scored[0].score >= qt.length * 2) return { ok: true, name: scored[0].name, n: scored[0].n, fixed: true };
  }
  const candidates = [...new Set([...contains, ...scored.map((s) => s.name)])].slice(0, 4).map((n) => ({ type, name: n, n: names[n] }));
  return { ok: false, candidates };
}
export function verifyScope(all, scope) {
  if (!scope || typeof scope !== "object") return { ok: false, candidates: [] };
  const sc = { ...scope };
  const KINDS = new Set(["trust", "la", "region", "town", "pcon"]);
  if (KINDS.has(sc.type)) {
    const r = resolveEntity(all, sc.type, sc.name);
    if (!r.ok) {
      /* the name may belong to another kind: look across all of them */
      const across = ["trust", "la", "region", "town", "pcon"].flatMap((k) => { const rr = resolveEntity(all, k, sc.name); return rr.ok ? [{ type: k, name: rr.name, n: rr.n }] : rr.candidates; });
      return { ok: false, candidates: [...new Map(across.map((c) => [c.type + c.name, c])).values()].slice(0, 5) };
    }
    sc.name = r.name;
  }
  if (sc.versus) {
    const v = verifyScope(all, { ...sc.versus });
    if (v.ok) sc.versus = v.scope; else delete sc.versus; /* a broken comparison never breaks the report */
  }
  const n = resolveScope(all, sc).length;
  if (!n) return { ok: false, candidates: [], empty: true, scope: sc };
  return { ok: true, scope: sc, n };
}
export function composeFromText(all, text) {
  const res = searchEntities(all, text);
  const both = parseQuery((text || "").toLowerCase()).bothPhases;
  const phaseNote = both ? "A Prizm report holds one phase at a time: this is the secondary picture, and \u201cThe primary phase\u201d gives you the other." : null;
  if (res.composed && res.composed.length) return { confidence: "sure", sc: res.composed[0].sc, label: res.composed[0].label, note: phaseNote };
  const { filters } = parseQuery((text || "").toLowerCase());
  const qt = toks(text);
  const hits = [];
  [["region", res.regions], ["la", res.las], ["pcon", res.pcons || []], ["town", res.towns || []], ["trust", res.trusts]].forEach(([type, list]) => {
    (list || []).forEach((e) => {
      const nt = toks(e.name);
      /* a one-word name inside a long sentence is a coincidence, not a request:
         "strong reading in primaries" must never become the borough of Reading */
      const strong = nt.length >= 2 ? nt.every((t) => qt.includes(t)) : qt.length <= 3 && qt.includes(nt[0]);
      hits.push({ type, name: e.name, n: e.n, strong });
    });
  });
  if (res.schools && res.schools.length === 1 && qt.length <= 6) hits.push({ type: "urns", urns: [res.schools[0].urn], name: res.schools[0].name, n: 1, strong: true });
  const strongs = hits.filter((h) => h.strong);
  const mk = (h) => (h.type === "urns" ? { type: "urns", urns: h.urns, ...filters } : { type: h.type, name: h.name, ...filters });
  if (strongs.length === 1) return { confidence: "sure", sc: mk(strongs[0]) };
  /* several strong reads of the same words, or only weak ones: ask, never guess */
  const candidates = [...new Map(hits.map((h) => [h.type + (h.name || ""), h])).values()].sort((a, b) => (b.strong ? 1 : 0) - (a.strong ? 1 : 0) || b.n - a.n).slice(0, 5);
  return { confidence: candidates.length ? "maybe" : "none", candidates, filters };
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
  /* the primary estate's own benchmarks; same key names as the secondary ones
     where the measure is shared, so a primary-phase report can overlay them */
  const pri = primaries(all);
  const ptake = (f) => pri.map(f).filter((v) => v != null);
  const r0 = (v) => (v == null ? null : Math.round(v));
  const defPct = (xs) => (xs.length ? r1((xs.filter((v) => v < 0).length / xs.length) * 100) : null);
  const resP = ptake((s) => num(s.fin_reserve_pp)), resS = take((s) => num(s.fin_reserve_pp));
  const rwm = ptake((s) => num(s.ks2_rwm_exp)), prwm = ptake((s) => num(s.ks2_rwm_prev));
  const priBench = {
    n: pri.length,
    rwmMean: r1(mean(rwm)), rwmMed: r1(med(rwm)),
    highMed: r1(med(ptake((s) => num(s.ks2_rwm_high)))),
    readMed: r1(med(ptake((s) => num(s.ks2_read_avg)))),
    rwmDisMean: r1(mean(ptake((s) => num(s.ks2_rwm_disadv)))),
    rwmNonMean: r1(mean(ptake((s) => num(s.ks2_rwm_nondisadv)))),
    drift: r1(mean(rwm) - mean(prwm)),
    absMed: r1(med(ptake((s) => num(s.abs_overall_pct)))),
    paMed: r1(med(ptake((s) => num(s.abs_persistent_pct)))),
    suspMed: r1(med(ptake((s) => num(s.susp_rate)))),
    pexMean: r1(mean(ptake((s) => num(s.permex_rate)))),
    ptrMed: r1(med(ptake((s) => num(s.wf_ptr)))),
    turnMed: r1(med(ptake((s) => num(s.wf_turnover_pct)))),
    vacMean: r1(mean(ptake((s) => num(s.wf_vac_rate)))),
    sickDaysMed: r1(med(ptake((s) => num(s.wf_sick_days)))),
    payMed: r1(med(ptake((s) => num(s.wf_pay_mean)))),
    ehcpMed: r1(med(ptake((s) => num(s.sen_ehcp_pct)))),
    senSupMed: r1(med(ptake((s) => num(s.sen_support_pct)))),
    spendMed: r0(med(ptake((s) => num(s.fin_spend_pp)))),
    incomeMed: r0(med(ptake((s) => num(s.fin_income_pp)))),
    teachPpMed: r0(med(ptake((s) => num(s.fin_teach_pp)))),
    energyPpMed: r0(med(ptake((s) => num(s.fin_energy_pp)))),
    reserveMed: r0(med(resP)),
    staffPctMed: r1(med(ptake((s) => num(s.fin_staff_pct)))),
    deficitPct: defPct(resP),
  };
  return {
    pri: priBench,
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
    ptrMed: r1(med(take((s) => num(s.wf_ptr)))),
    turnMed: r1(med(take((s) => num(s.wf_turnover_pct)))),
    vacMean: r1(mean(take((s) => num(s.wf_vac_rate)))),
    sickDaysMed: r1(med(take((s) => num(s.wf_sick_days)))),
    payMed: r1(med(take((s) => num(s.wf_pay_mean)))),
    ehcpMed: r1(med(take((s) => num(s.sen_ehcp_pct)))),
    senSupMed: r1(med(take((s) => num(s.sen_support_pct)))),
    spendMed: r0(med(take((s) => num(s.fin_spend_pp)))),
    incomeMed: r0(med(take((s) => num(s.fin_income_pp)))),
    teachPpMed: r0(med(take((s) => num(s.fin_teach_pp)))),
    energyPpMed: r0(med(take((s) => num(s.fin_energy_pp)))),
    reserveMed: r0(med(resS)),
    staffPctMed: r1(med(take((s) => num(s.fin_staff_pct)))),
    deficitPct: defPct(resS),
  };
}

/* ── the blocks: each returns pure data for the renderer ── */
export const BLOCK_TYPES = [
  { type: "headlines", name: "Headlines", desc: "the scope in four numbers, against England" },
  { type: "cohort", name: "The cohort", desc: "every school in scope, headline by headline" },
  { type: "movement", name: "Movement", desc: "this year against last, school by school" },
  { type: "gap", name: "The disadvantage gap", desc: "disadvantaged and other pupils, side by side" },
  { type: "inclusion", name: "Inclusion", desc: "SEN support, EHC plans, units and resourced provision against England" },
  { type: "early", name: "The early years", desc: "reception and phonics, authority by authority (school-level is not published)" },
  { type: "attendance", name: "Attendance", desc: "overall and persistent absence against England" },
  { type: "behaviour", name: "Suspensions and exclusions", desc: "suspension rates and permanent exclusions" },
  { type: "post16", name: "Sixth form", desc: "A level and vocational results since 2021/22, L3 value added with its confidence, school by school" },
  { type: "subjects", name: "A level subjects", desc: "value added and top grades subject by subject, against England" },
  { type: "demand", name: "Demand", desc: "who parents choose: first preferences per place since 2014/15, gainers and losers named" },
  { type: "capacity", name: "Places", desc: "places against pupils, the area's forecast to 2031/32, and where falling demand meets spare places" },
  { type: "flow", name: "Cohort flow", desc: "year-group rolls since 2015/16: each cohort tracked stage by stage, shrinkage named school by school, exclusions running beside" },
  { type: "workforce", name: "The workforce", desc: "teacher turnover, ratios and unfilled posts against England" },
  { type: "finance", name: "The money", desc: "spend per pupil, reserves and deficits against England" },
  { type: "destinations", name: "Destinations", desc: "where leavers went, and who wasn't sustained" },
  { type: "scatter", name: "Context and outcomes", desc: "FSM against Attainment 8, the scope against England" },
  { type: "distribution", name: "Where they sit", desc: "the national Attainment 8 distribution, scope schools marked" },
  { type: "ofsted", name: "Inspection profile", desc: "current Ofsted judgements across the scope" },
  { type: "league", name: "The league", desc: "authorities or trusts ranked by what their schools achieve" },
];

export function computeBlock(type, schools, all, bench, phase, blockSpec, extras) {
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const vals = (f) => schools.map(f).filter((v) => v != null);
  const PRI = phase === "primary";
  const estate = () => (PRI ? primaries(all) : secondaries(all));
  if (type === "league") {
    /* aggregate up a level: rank the SYSTEM, not the schools */
    const by = blockSpec && ["la", "trust", "region"].includes(blockSpec.by) ? blockSpec.by : "la";
    const key = (s) => (by === "trust" ? (s.trust && s.trust !== "Not supported by a trust" ? s.trust : null) : s[by]);
    const groups = {};
    for (const s of schools) { const k = key(s); if (k) (groups[k] = groups[k] || []).push(s); }
    const m = (list, f) => { const xs = list.map(f).filter((v) => v != null); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
    const rows = Object.entries(groups)
      .filter(([, list]) => list.length >= 3)
      .map(([name, list]) => (PRI
        ? { name, n: list.length, m: r1(m(list, (s) => num(s.ks2_rwm_exp))), gap: r1(m(list, (s) => (num(s.ks2_rwm_nondisadv) != null && num(s.ks2_rwm_disadv) != null ? s.ks2_rwm_nondisadv - s.ks2_rwm_disadv : null))), abs: r1(m(list, (s) => num(s.abs_overall_pct))), susp: r1(m(list, (s) => num(s.susp_rate))) }
        : { name, n: list.length, m: r1(m(list, (s) => num(s.attainment8))), gap: r1(m(list, (s) => (num(s.a8_nondisadv) != null && num(s.a8_disadv) != null ? s.a8_nondisadv - s.a8_disadv : null))), abs: r1(m(list, (s) => num(s.abs_overall_pct))), susp: r1(m(list, (s) => num(s.susp_rate))) }))
      .filter((r) => r.m != null)
      .sort((a, b) => b.m - a.m);
    const small = Object.values(groups).filter((l) => l.length < 3).length;
    return { kind: PRI ? "ks2" : "ks4", by, rows, small, measure: PRI ? "RWM expected" : "Attainment 8", natM: PRI ? bench.rwmMed : bench.a8Med, natGap: PRI ? r1(bench.rwmNonMean - bench.rwmDisMean) : r1(bench.a8NonMean - bench.a8DisMean), natAbs: bench.absMed, bench };
  }
  if (PRI && type === "headlines") {
    const rwms = vals((s) => num(s.ks2_rwm_exp));
    return {
      kind: "ks2", n: schools.length,
      las: new Set(schools.map((s) => s.la).filter(Boolean)).size,
      rwmMean: r1(mean(rwms)),
      highMean: r1(mean(vals((s) => num(s.ks2_rwm_high)))),
      readMean: r1(mean(vals((s) => num(s.ks2_read_avg)))),
      fsmMean: r1(mean(vals((s) => num(s.edu_fsm_pct)))),
      aboveNat: rwms.filter((v) => v >= bench.rwmMed).length,
      drift: r1(mean(schools.filter((s) => pdriftOk(s)).map((s) => s.ks2_rwm_exp - s.ks2_rwm_prev))),
      bench,
    };
  }
  if (PRI && type === "cohort") {
    const rows = schools.map((s) => ({
      urn: s.urn, name: s.name, la: s.la, pupils: s.pupils ?? null, fsm: num(s.edu_fsm_pct),
      rwm: num(s.ks2_rwm_exp), prev: num(s.ks2_rwm_prev), d: pdriftOk(s) ? r1(s.ks2_rwm_exp - s.ks2_rwm_prev) : null,
      high: num(s.ks2_rwm_high), read: num(s.ks2_read_avg), mat: num(s.ks2_mat_exp), writ: num(s.ks2_writ_exp),
    }));
    return { kind: "ks2", rows, rwmMean: r1(mean(vals((s) => num(s.ks2_rwm_exp)))), fsmMean: r1(mean(vals((s) => num(s.edu_fsm_pct)))), bench };
  }
  if (PRI && type === "movement") {
    const rows = schools.filter((s) => pdriftOk(s))
      .map((s) => ({ urn: s.urn, name: s.name, prev: s.ks2_rwm_prev, now: s.ks2_rwm_exp, d: r1(s.ks2_rwm_exp - s.ks2_rwm_prev) }))
      .sort((a, b) => b.d - a.d);
    return { kind: "ks2", rows, scopeDrift: r1(mean(rows.map((r) => r.d))), natDrift: bench.drift };
  }
  if (PRI && type === "gap") {
    const rows = schools.filter((s) => num(s.ks2_rwm_disadv) != null && num(s.ks2_rwm_nondisadv) != null)
      .map((s) => ({ urn: s.urn, name: s.name, dis: s.ks2_rwm_disadv, non: s.ks2_rwm_nondisadv, gap: r1(s.ks2_rwm_nondisadv - s.ks2_rwm_disadv) }))
      .sort((a, b) => a.gap - b.gap);
    return { kind: "ks2", rows, scopeDisMean: r1(mean(rows.map((r) => r.dis))), natDisMean: bench.rwmDisMean, natNonMean: bench.rwmNonMean };
  }
  if (PRI && type === "scatter") {
    const nat = primaries(all).filter((s) => num(s.edu_fsm_pct) != null && num(s.ks2_rwm_exp) != null);
    const step = Math.max(1, Math.floor(nat.length / 1400));
    const cloud = nat.filter((_, i) => i % step === 0).map((s) => [r1(s.edu_fsm_pct), r1(s.ks2_rwm_exp)]);
    const marks = schools.filter((s) => num(s.edu_fsm_pct) != null && num(s.ks2_rwm_exp) != null)
      .map((s) => ({ urn: s.urn, name: s.name, fsm: r1(s.edu_fsm_pct), a8: r1(s.ks2_rwm_exp) }));
    return { kind: "ks2", cloud, marks };
  }
  if (PRI && type === "distribution") {
    const rwms = primaries(all).map((s) => num(s.ks2_rwm_exp)).filter((v) => v != null);
    const bins = Array.from({ length: 20 }, (_, i) => ({ lo: i * 5, hi: i * 5 + 5, n: 0 }));
    rwms.forEach((v) => { const i = Math.max(0, Math.min(19, Math.floor(v / 5))); bins[i].n++; });
    const marks = schools.filter((s) => num(s.ks2_rwm_exp) != null).map((s) => ({ urn: s.urn, name: s.name, a8: s.ks2_rwm_exp }));
    return { kind: "ks2", bins, total: rwms.length, marks, med: bench.rwmMed };
  }
  if (PRI && type === "destinations") return { rows: [], destMean: null, highNotsust: 0, bench };
  if (type === "ofsted") {
    const count = (list) => { const m = {}; list.forEach((s) => { const k = s.ofstedGrade || "Not yet inspected"; m[k] = (m[k] || 0) + 1; }); return m; };
    /* the renewed framework: per-area grade distributions for report-carded schools */
    const tally = (list) => {
      const t = { n: 0, sgMet: 0, sgNot: 0, areas: {} };
      for (const s of list) {
        const c = s.ofstedCard;
        if (!c) continue;
        t.n++;
        if (c.sg === 1) t.sgMet++; else if (c.sg === 0) t.sgNot++;
        for (const [k] of RC_AREAS) if (c[k]) { (t.areas[k] = t.areas[k] || [0, 0, 0, 0, 0])[c[k] - 1]++; }
      }
      return t;
    };
    const est = estate();
    return { scope: count(schools), nat: count(est), n: schools.length, natN: est.length, cards: tally(schools), natCards: tally(est) };
  }
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
      .map((s) => ({ urn: s.urn, name: s.name, prev: s.a8_prev, now: s.attainment8, d: r1(s.attainment8 - s.a8_prev) }))
      .sort((a, b) => b.d - a.d);
    return { rows, scopeDrift: r1(mean(rows.map((r) => r.d))), natDrift: bench.drift };
  }
  if (type === "gap") {
    const rows = schools.filter((s) => num(s.a8_disadv) != null && num(s.a8_nondisadv) != null)
      .map((s) => ({ urn: s.urn, name: s.name, dis: s.a8_disadv, non: s.a8_nondisadv, gap: r1(s.a8_nondisadv - s.a8_disadv) }))
      .sort((a, b) => a.gap - b.gap);
    return { rows, scopeDisMean: r1(mean(rows.map((r) => r.dis))), natDisMean: bench.a8DisMean, natNonMean: bench.a8NonMean };
  }
  if (type === "attendance") {
    const rows = schools.filter((s) => num(s.abs_overall_pct) != null)
      .map((s) => ({ urn: s.urn, name: s.name, abs: r1(s.abs_overall_pct), pa: r1(s.abs_persistent_pct), sev: r1(s.abs_severe_pct) }))
      .sort((a, b) => a.abs - b.abs);
    return { rows, absMean: r1(mean(rows.map((r) => r.abs))), paMean: r1(mean(rows.map((r) => r.pa).filter((v) => v != null))), bench };
  }
  if (type === "behaviour") {
    const rows = schools.filter((s) => num(s.susp_rate) != null)
      .map((s) => ({ urn: s.urn, name: s.name, susp: r1(s.susp_rate), s1: r1(s.susp_one_plus_pct), pex: num(s.permex_rate) }))
      .sort((a, b) => a.susp - b.susp);
    return { rows, suspMean: r1(mean(rows.map((r) => r.susp))), pexZero: rows.filter((r) => r.pex === 0).length, bench };
  }
  if (type === "workforce") {
    const rows = schools.filter((s) => num(s.wf_turnover_pct) != null || num(s.wf_ptr) != null)
      .map((s) => ({ urn: s.urn, name: s.name, turn: r1(num(s.wf_turnover_pct)), ptr: r1(num(s.wf_ptr)), vac: r1(num(s.wf_vac_rate)), sick: r1(num(s.wf_sick_days)), pay: num(s.wf_pay_mean) != null ? Math.round(num(s.wf_pay_mean)) : null }))
      .sort((a, b) => (b.turn ?? -1) - (a.turn ?? -1));
    const withTurn = rows.filter((r) => r.turn != null);
    return {
      rows, turnMean: r1(mean(withTurn.map((r) => r.turn))),
      ptrMean: r1(mean(rows.map((r) => r.ptr).filter((v) => v != null))),
      vacCount: rows.filter((r) => r.vac != null && r.vac > 0).length,
      bench,
    };
  }
  if (type === "flow") {
    const fl = extras && extras.flows;
    if (!fl || !fl.schools) return null;
    const years = fl.years || [];
    const nY = years.length;
    /* lineage: follow URN chains backwards so a school academised mid-series keeps one line */
    const rev = {};
    for (const [oldU, newU] of Object.entries(fl.chains || {})) (rev[newU] = rev[newU] || []).push(oldU);
    const rowsOf = (urn) => {
      const y = {}, x = {};
      const stack = [String(urn)];
      let chained = false;
      while (stack.length) {
        const u = stack.pop();
        const r = fl.schools[u];
        if (r) {
          Object.entries(r.y || {}).forEach(([yi, c]) => { if (!y[yi]) y[yi] = c; });
          Object.entries(r.x || {}).forEach(([yi, v]) => { if (!x[yi]) x[yi] = v; });
        }
        (rev[u] || []).forEach((o) => { chained = true; stack.push(o); });
      }
      return { y, x, chained };
    };
    const members = schools.map((s) => ({ s, f: rowsOf(s.urn) })).filter((m) => Object.keys(m.f.y).length);
    if (!members.length) return null;
    const chainedN = members.filter((m) => m.f.chained).length;
    const totals = Array.from({ length: nY }, () => Array(15).fill(0));
    members.forEach(({ f }) => Object.entries(f.y).forEach(([yi, c]) => c.forEach((v, g) => { totals[+yi][g] += v; })));
    const bucketTotal = Array(15).fill(0);
    totals.forEach((row) => row.forEach((v, g) => { bucketTotal[g] += v; }));
    const secondaryN = bucketTotal.slice(7, 12).reduce((a, b) => a + b, 0);
    const primaryN = bucketTotal.slice(0, 7).reduce((a, b) => a + b, 0);
    const entry = secondaryN >= primaryN ? 7 : 0;
    const last = entry === 7 ? 11 : 6;
    /* each cohort walked diagonally from its entry year */
    const cohorts = [];
    for (let y0 = 0; y0 < nY; y0++) {
      const pts = [];
      for (let k = 0; entry + k <= last && y0 + k < nY; k++) pts.push({ yi: y0 + k, g: entry + k, v: totals[y0 + k][entry + k] });
      if (pts.length >= 2 && pts[0].v > 0) cohorts.push({ y0, pts, start: pts[0].v, end: pts[pts.length - 1].v, full: y0 + (last - entry) < nY });
    }
    /* shrinkage, named: a school's year group losing children between stages */
    const shrinks = [];
    members.forEach(({ s, f }) => {
      for (let yi = 0; yi < nY - 1; yi++) {
        const a = f.y[yi], b = f.y[yi + 1];
        if (!a || !b) continue;
        for (let g = entry; g < last; g++) {
          const d = (b[g + 1] || 0) - (a[g] || 0);
          if ((a[g] || 0) >= 25 && d <= -8) shrinks.push({ urn: s.urn, name: s.name, year: years[yi + 1], g: g + 1, from: a[g], to: b[g + 1] || 0, d });
        }
      }
    });
    shrinks.sort((p, q) => p.d - q.d);
    /* exclusions beside the flow */
    const excl = years.map((tp, yi) => {
      let hc = 0, su = 0, pe = 0, got = false;
      members.forEach(({ f }) => { const v = f.x[yi]; if (!v) return; got = true; if (v[0] > 0) hc += v[0]; if (v[1] > 0) su += v[1]; if (v[2] > 0) pe += v[2]; });
      return got && hc ? { yi, tp, hc, su, pe, rate: Math.round(1000 * su / hc) / 10 } : null;
    }).filter(Boolean);
    const intake = years.map((tp, yi) => ({ yi, v: totals[yi][entry] })).filter((p) => p.v > 0);
    return { mode: "flow", years, totals, entry, last, cohorts: cohorts.slice(-9), shrinks: shrinks.slice(0, 12), shrinkN: shrinks.length, excl, intake, n: members.length, of: schools.length, chainedN };
  }
  if (type === "post16") return post16Block(schools, extras);
  if (type === "demand") return demandBlock(schools, all, PRI, extras);
  if (type === "capacity") return capacityBlock(schools, all, PRI, extras);
  if (type === "subjects") return subjectsBlock(schools, extras);
  if (type === "early") {
    /* authority-level by necessity: the DfE publishes no school-level EYFSP
       or phonics. The scope's authorities stand in for its schools. */
    const early = extras && extras.early;
    if (!early || !early.las) return null;
    const nat = early.national && early.national["202526"] ? early.national["202526"] : null;
    const trend = early.national ? Object.entries(early.national).sort(([a], [b]) => a.localeCompare(b)).map(([tp, v]) => ({ tp, label: tp.slice(0, 4) + "/" + tp.slice(4), ...v })) : [];
    const laNames = [...new Set(schools.map((s) => s.la).filter(Boolean))];
    const rows = laNames.map((name) => ({ name, n: schools.filter((s) => s.la === name).length, ...(early.las[name] || {}) }))
      .filter((r) => r.gld != null || r.ph1 != null)
      .sort((a, b) => (b.gld ?? -1) - (a.gld ?? -1));
    const missing = laNames.length - rows.length;
    return { mode: rows.length === 1 ? "one" : "las", rows, missing, nat, trend };
  }
  if (type === "inclusion") {
    /* who teaches the children with the highest needs; both phases */
    const outcome = PRI ? (s) => num(s.ks2_rwm_exp) : (s) => num(s.attainment8);
    const rows = schools.filter((s) => num(s.sen_ehcp_pct) != null)
      .map((s) => ({ urn: s.urn, name: s.name, sup: num(s.sen_support_pct), ehcp: num(s.sen_ehcp_pct), ehcpN: num(s.sen_ehcp_n), top: s.sen_top_need || null, unit: s.sen_unit === true, rp: s.sen_rp === true, unitN: num(s.sen_unit_pupils), rpN: num(s.sen_rp_pupils) }))
      .sort((a, b) => (b.ehcp ?? -1) - (a.ehcp ?? -1));
    const needs = {};
    rows.forEach((r) => { if (r.top) needs[r.top] = (needs[r.top] || 0) + 1; });
    const topNeeds = Object.entries(needs).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([need, n]) => ({ need, n }));
    const nat = estate().filter((s) => num(s.sen_ehcp_pct) != null && outcome(s) != null);
    const step = Math.max(1, Math.floor(nat.length / 1400));
    const cloud = nat.filter((_, i) => i % step === 0).map((s) => [r1(s.sen_ehcp_pct), r1(outcome(s))]);
    const marks = schools.filter((s) => num(s.sen_ehcp_pct) != null && outcome(s) != null)
      .map((s) => ({ urn: s.urn, name: s.name, ehcp: r1(s.sen_ehcp_pct), y: r1(outcome(s)) }));
    return {
      kind: PRI ? "ks2" : "ks4", rows,
      ehcpMean: r1(mean(rows.map((r) => r.ehcp).filter((v) => v != null))),
      supMean: r1(mean(rows.map((r) => r.sup).filter((v) => v != null))),
      units: rows.filter((r) => r.unit).length, rps: rows.filter((r) => r.rp).length,
      topNeeds, cloud, marks, bench,
    };
  }
  if (type === "finance") {
    /* works for both phases: the money is the money; outcomes swap by phase */
    const outcome = PRI ? (s) => num(s.ks2_rwm_exp) : (s) => num(s.attainment8);
    const rows = schools.filter((s) => num(s.fin_spend_pp) != null)
      .map((s) => ({ urn: s.urn, name: s.name, sector: s.fin_sector || null, income: num(s.fin_income_pp), spend: num(s.fin_spend_pp), teach: num(s.fin_teach_pp), energy: num(s.fin_energy_pp), staffPct: num(s.fin_staff_pct), balance: num(s.fin_balance_pp), reserve: num(s.fin_reserve_pp) }))
      .sort((a, b) => (b.spend ?? -1) - (a.spend ?? -1));
    const nat = estate().filter((s) => num(s.fin_spend_pp) != null && outcome(s) != null);
    const step = Math.max(1, Math.floor(nat.length / 1400));
    const cloud = nat.filter((_, i) => i % step === 0).map((s) => [Math.round(s.fin_spend_pp), r1(outcome(s))]);
    const marks = schools.filter((s) => num(s.fin_spend_pp) != null && outcome(s) != null)
      .map((s) => ({ urn: s.urn, name: s.name, spend: Math.round(s.fin_spend_pp), y: r1(outcome(s)) }));
    const sm = mean(rows.map((r) => r.spend).filter((v) => v != null));
    return {
      kind: PRI ? "ks2" : "ks4", rows,
      spendMean: sm == null ? null : Math.round(sm),
      deficitN: rows.filter((r) => r.reserve != null && r.reserve < 0).length,
      cloud, marks, bench,
    };
  }
  if (type === "destinations") {
    const rows = schools.filter((s) => num(s.dest_sustained) != null)
      .map((s) => ({ urn: s.urn, name: s.name, dest: r1(s.dest_sustained), edu: r1(s.dest_edu), appren: r1(s.dest_appren), work: r1(s.dest_work), notsust: r1(s.dest_notsust) }))
      .sort((a, b) => b.dest - a.dest);
    return { rows, destMean: r1(mean(rows.map((r) => r.dest))), highNotsust: rows.filter((r) => r.notsust != null && r.notsust >= 10).length, bench };
  }
  if (type === "scatter") {
    const nat = secondaries(all).filter((s) => num(s.edu_fsm_pct) != null && num(s.attainment8) != null);
    const step = Math.max(1, Math.floor(nat.length / 1400));
    const cloud = nat.filter((_, i) => i % step === 0).map((s) => [r1(s.edu_fsm_pct), r1(s.attainment8)]);
    const marks = schools.filter((s) => num(s.edu_fsm_pct) != null && num(s.attainment8) != null)
      .map((s) => ({ urn: s.urn, name: s.name, fsm: r1(s.edu_fsm_pct), a8: r1(s.attainment8) }));
    return { cloud, marks };
  }
  if (type === "distribution") {
    const a8s = secondaries(all).map((s) => num(s.attainment8)).filter((v) => v != null);
    const bins = Array.from({ length: 18 }, (_, i) => ({ lo: i * 5, hi: i * 5 + 5, n: 0 }));
    a8s.forEach((v) => { const i = Math.max(0, Math.min(17, Math.floor(v / 5))); bins[i].n++; });
    const marks = schools.filter((s) => num(s.attainment8) != null).map((s) => ({ urn: s.urn, name: s.name, a8: s.attainment8 }));
    return { bins, total: a8s.length, marks, med: bench.a8Med };
  }
  return null;
}

/* a short name for a scope, for chart labels and contrast sentences */
/* ── post-16: the 16 to 18 performance tables ──
   p.s[urn].y[year][cohort] = [students, aps, apsGrade, va, vaLo, vaHi, band, retained, ...]
   A level rows add best-three APS, grade and AAB %; DA = [disadvAps, otherAps, disadvN, otherN].
   Value added was not published for 2021/22 or 2022/23 (teacher-assessed GCSE baselines). */
export const P16_YEARS = ["202122", "202223", "202324", "202425"];
export const P16_LABEL = (tp) => tp.slice(0, 4) + "/" + tp.slice(4);
const P16_BANDS = { "-2": "Well below average", "-1": "Below average", 0: "Average", 1: "Above average", 2: "Well above average" };
export const p16Band = (b) => (b == null ? null : P16_BANDS[b]);
/* the area's sixth form and FE colleges are named beside a place report, not
   counted in it: a place scope holds its schools, and colleges sit outside it */
function p16Colleges(p, schools, extras) {
  const sc = extras && extras.scope;
  if (!sc || !["la", "town", "pcon"].includes(sc.type)) return [];
  const las = new Set(schools.map((s) => s.la).filter(Boolean));
  const known = new Set(schools.map((s) => String(s.urn)));
  return Object.entries(p.s).filter(([u, r]) => las.has(r.la) && !known.has(u) && /college|16-19|sixth form centre/i.test(r.t || "") && r.y["202425"] && r.y["202425"].A)
    .map(([u, r]) => ({ urn: u, name: r.n, type: r.t || "College", a: r.y["202425"].A, ac: r.y["202425"].AC || null }));
}
function post16Block(schools, extras) {
  const p = extras && extras.post16;
  if (!p || !p.s) return null;
  const L = "202425";
  const members = schools.map((s) => ({ s, r: p.s[String(s.urn)] })).filter((m) => m.r && Object.keys(m.r.y || {}).length);
  const colleges = p16Colleges(p, schools, extras);
  if (!members.length && !colleges.length) return { mode: "post16", n: 0, of: schools.length, empty: true };
  /* student-weighted means: a sixth form of 300 counts for more than one of 30 */
  const wmean = (rows) => { let w = 0, t = 0; rows.forEach(([v, n]) => { if (v != null && n) { t += v * n; w += n; } }); return w ? Math.round((t / w) * 100) / 100 : null; };
  const series = (coh, idx) => P16_YEARS.map((tp) => ({
    tp, v: wmean(members.map(({ r }) => { const c = r.y[tp] && r.y[tp][coh]; return c ? [c[idx], c[0]] : [null, 0]; })),
    n: members.reduce((a, { r }) => a + ((r.y[tp] && r.y[tp][coh] && r.y[tp][coh][0]) || 0), 0),
    nat: p.nat[tp] && p.nat[tp][coh] ? p.nat[tp][coh][idx] : null,
  }));
  const aps = series("A", 1), va = series("A", 3).filter((x) => p.vaYears.includes(x.tp));
  const acVa = series("AC", 3).filter((x) => p.vaYears.includes(x.tp)), agVa = series("AG", 3).filter((x) => p.vaYears.includes(x.tp)), agAps = series("AG", 1);
  const rows = members.map(({ s, r }) => {
    const y = r.y[L] || {}, a = y.A, ac = y.AC, ag = y.AG, tl = y.TL, da = y.DA;
    const prevA = r.y["202324"] && r.y["202324"].A;
    return {
      urn: s.urn, name: s.name, la: s.la,
      aN: a ? a[0] : null, aps: a ? a[1] : null, grade: a ? a[2] : null, va: a ? a[3] : null, lo: a ? a[4] : null, hi: a ? a[5] : null, band: a ? a[6] : null,
      ret: a ? a[7] : null, b3: a ? a[8] : null, b3g: a ? a[9] : null, aab: a ? a[10] : null,
      vaPrev: prevA ? prevA[3] : null, apsPrev: prevA ? prevA[1] : null,
      apsSeries: P16_YEARS.map((tp) => (r.y[tp] && r.y[tp].A ? r.y[tp].A[1] : null)),
      acVa: ac ? ac[3] : null, acN: ac ? ac[0] : null,
      agN: ag ? ag[0] : null, agAps: ag ? ag[1] : null, agGrade: ag ? ag[2] : null, agVa: ag ? ag[3] : null,
      tlN: tl ? tl[0] : null, tlVa: tl ? tl[3] : null,
      daD: da ? da[0] : null, daO: da ? da[1] : null, daDn: da ? da[2] : null,
      sig: a && a[4] != null && a[4] > 0 ? 1 : a && a[5] != null && a[5] < 0 ? -1 : 0,
    };
  });
  const withA = rows.filter((r) => r.aN);
  const bands = { "-2": 0, "-1": 0, 0: 0, 1: 0, 2: 0 };
  withA.forEach((r) => { if (r.band != null) bands[r.band]++; });
  const daD = wmean(members.map(({ r }) => { const d = r.y[L] && r.y[L].DA; return d ? [d[0], d[2]] : [null, 0]; }));
  const daO = wmean(members.map(({ r }) => { const d = r.y[L] && r.y[L].DA; return d ? [d[1], d[3]] : [null, 0]; }));
  const nat = p.nat[L] || {};
  return {
    mode: "post16", n: members.length, of: schools.length, withA: withA.length,
    students: withA.reduce((a, r) => a + r.aN, 0),
    aps, va, acVa, agVa, agAps,
    apsNow: aps[aps.length - 1].v, apsNat: nat.A ? nat.A[1] : null, gradeNat: nat.A ? nat.A[2] : null,
    vaNow: va.length ? va[va.length - 1].v : null, vaNat: nat.A ? nat.A[3] : null,
    aab: wmean(withA.map((r) => [r.aab, r.aN])), aabNat: nat.A ? nat.A[10] : null,
    b3: wmean(withA.map((r) => [r.b3, r.aN])), b3Nat: nat.A ? nat.A[8] : null, b3gNat: nat.A ? nat.A[9] : null,
    ret: wmean(withA.map((r) => [r.ret, r.aN])), retNat: nat.A ? nat.A[7] : null,
    daD, daO, daNatD: nat.DA ? nat.DA[0] : null, daNatO: nat.DA ? nat.DA[1] : null,
    bands, sigUp: withA.filter((r) => r.sig === 1).length, sigDown: withA.filter((r) => r.sig === -1).length,
    rows: rows.sort((a, b) => (b.va ?? -9) - (a.va ?? -9)),
    colleges,
    vintage: p.vintage,
  };
}
/* ── demand and places ──
   places.s[urn] = { aS|aP: {year: [placesOffered, anyPref, firstPref, firstPrefOffers, fromAnotherLa]},
                     c: {year: [places, onRoll]}, sf: [places, onRoll], sp: [unit, rp], pa: planningArea } */
export const PL_LABEL = (tp) => tp.slice(0, 4) + "/" + tp.slice(4);
const PL_REV = new WeakMap();
function plHistory(p, urn) {
  let rev = PL_REV.get(p);
  if (!rev) { rev = {}; for (const [o, n] of Object.entries(p.chains || {})) (rev[n] = rev[n] || []).push(o); PL_REV.set(p, rev); }
  const out = { aS: {}, aP: {}, c: {}, chained: false, me: p.s[String(urn)] || null };
  const stack = [String(urn)];
  const seen = new Set();
  while (stack.length) {
    const u = stack.pop();
    if (seen.has(u)) continue;
    seen.add(u);
    const r = p.s[u];
    if (r) for (const k of ["aS", "aP", "c"]) Object.entries(r[k] || {}).forEach(([y, v]) => { if (!out[k][y]) out[k][y] = v; });
    (rev[u] || []).forEach((o) => { out.chained = true; stack.push(o); });
  }
  return out;
}
/* England's line, computed once per phase from every school in the file */
const PL_NAT = new WeakMap();
function plNational(p, all, PRI) {
  let m = PL_NAT.get(p);
  if (!m) { m = {}; PL_NAT.set(p, m); }
  const key = PRI ? "P" : "S";
  if (m[key]) return m[key];
  const k = "a" + key;
  const byYear = {};
  const ratios = [];
  const L = p.appYears[p.appYears.length - 1];
  for (const r of Object.values(p.s)) {
    for (const [y, v] of Object.entries(r[k] || {})) {
      const t = (byYear[y] = byYear[y] || [0, 0, 0]);
      if (v[0]) { t[0] += v[0]; t[1] += v[2] || 0; t[2] += v[1] || 0; }
    }
    const v = r[k] && r[k][L];
    if (v && v[0] >= 10 && v[2] != null) ratios.push(v[2] / v[0]);
  }
  ratios.sort((a, b) => a - b);
  const estate = new Set((PRI ? primaries(all) : secondaries(all)).map((s) => String(s.urn)));
  let cap = 0, roll = 0;
  const C = p.capYears[p.capYears.length - 1];
  for (const u of estate) { const c = p.s[u] && p.s[u].c && p.s[u].c[C]; if (c && c[0] && c[1] != null) { cap += c[0]; roll += c[1]; } }
  m[key] = {
    years: p.appYears.map((y) => ({ y, ratio: byYear[y] && byYear[y][0] ? Math.round((byYear[y][1] / byYear[y][0]) * 100) / 100 : null })),
    medRatio: ratios.length ? Math.round(ratios[ratios.length >> 1] * 100) / 100 : null,
    fill: cap ? Math.round((1000 * roll) / cap) / 10 : null,
  };
  return m[key];
}
function demandBlock(schools, all, PRI, extras) {
  const p = extras && extras.places;
  if (!p || !p.s) return null;
  const k = PRI ? "aP" : "aS";
  const Y = p.appYears, L = Y[Y.length - 1], B5 = Y[Math.max(0, Y.length - 6)];
  const nat = plNational(p, all, PRI);
  const members = schools.map((s) => ({ s, h: plHistory(p, s.urn) })).filter((m) => Object.keys(m.h[k]).length);
  if (!members.length) return { mode: "demand", n: 0, of: schools.length, empty: true, PRI };
  const tot = Y.map((y) => { let pl = 0, f = 0, a = 0; members.forEach(({ h }) => { const v = h[k][y]; if (v && v[0]) { pl += v[0]; f += v[2] || 0; a += v[1] || 0; } }); return { y, places: pl, first: f, any: a, ratio: pl ? Math.round((f / pl) * 100) / 100 : null }; });
  const rows = members.map(({ s, h }) => {
    const v = h[k][L], b = h[k][B5];
    const series = Y.map((y) => (h[k][y] ? h[k][y][2] : null));
    return {
      urn: s.urn, name: s.name, la: s.la,
      places: v ? v[0] : null, any: v ? v[1] : null, first: v ? v[2] : null, offers1: v ? v[3] : null, otherLa: v ? v[4] : null,
      ratio: v && v[0] ? Math.round((v[2] / v[0]) * 100) / 100 : null,
      got1: v && v[2] ? Math.round((100 * v[3]) / v[2]) : null,
      first5: b ? b[2] : null,
      ch5: v && b && b[2] >= 20 ? Math.round((100 * (v[2] - b[2])) / b[2]) : null,
      series, chained: h.chained,
    };
  }).filter((r) => r.places != null);
  const losing = rows.filter((r) => r.ch5 != null && r.ch5 <= -25).sort((a, b) => a.ch5 - b.ch5);
  const gaining = rows.filter((r) => r.ch5 != null && r.ch5 >= 25).sort((a, b) => b.ch5 - a.ch5);
  return {
    mode: "demand", PRI, n: rows.length, of: schools.length, years: Y, L, B5, tot, nat,
    ratioNow: tot[tot.length - 1].ratio, ratio5: (tot.find((t) => t.y === B5) || {}).ratio,
    under1: rows.filter((r) => r.ratio != null && r.ratio < 1).length,
    over2: rows.filter((r) => r.ratio != null && r.ratio >= 2).length,
    rows: rows.sort((a, b) => (b.ratio ?? -1) - (a.ratio ?? -1)),
    losing: losing.slice(0, 15), losingN: losing.length, gaining: gaining.slice(0, 15), gainingN: gaining.length,
    chainedN: rows.filter((r) => r.chained).length,
  };
}
function capacityBlock(schools, all, PRI, extras) {
  const p = extras && extras.places;
  if (!p || !p.s) return null;
  const C = p.capYears, L = C[C.length - 1];
  const k = PRI ? "aP" : "aS";
  const A = p.appYears, AL = A[A.length - 1], A5 = A[Math.max(0, A.length - 6)];
  const nat = plNational(p, all, PRI);
  const members = schools.map((s) => ({ s, h: plHistory(p, s.urn) })).filter((m) => Object.keys(m.h.c).length);
  if (!members.length) return { mode: "capacity", n: 0, of: schools.length, empty: true, PRI };
  const trend = C.map((y) => { let cap = 0, roll = 0; members.forEach(({ h }) => { const v = h.c[y]; if (v && v[0] && v[1] != null) { cap += v[0]; roll += v[1]; } }); return { y, cap, roll, fill: cap ? Math.round((1000 * roll) / cap) / 10 : null }; });
  const rows = members.map(({ s, h }) => {
    const v = h.c[L] || null, me = h.me || {};
    const d = h[k][AL], d5 = h[k][A5];
    const fill = v && v[0] ? Math.round((1000 * v[1]) / v[0]) / 10 : null;
    return {
      urn: s.urn, name: s.name, la: s.la, cap: v ? v[0] : null, roll: v ? v[1] : null, fill,
      spare: v && v[0] && v[1] != null ? Math.max(0, v[0] - v[1]) : null, over: v && v[0] && v[1] != null ? Math.max(0, v[1] - v[0]) : null,
      sf: me.sf || null, sp: me.sp || null, pa: me.pa || null,
      ratio: d && d[0] ? Math.round((d[2] / d[0]) * 100) / 100 : null,
      ch5: d && d5 && d5[2] >= 20 ? Math.round((100 * (d[2] - d5[2])) / d5[2]) : null,
    };
  }).filter((r) => r.cap != null);
  /* where the pressures meet: room to spare, fewer than one first preference
     per place, and first preferences falling over five years */
  const pressed = rows.filter((r) => r.fill != null && r.fill <= 85 && r.ratio != null && r.ratio < 1 && r.ch5 != null && r.ch5 < 0).sort((a, b) => a.fill - b.fill);
  /* the planning areas the scope sits in, with the DfE's forecast to 2031/32 */
  const ph = PRI ? "P" : "S";
  const pas = [...new Set(rows.map((r) => r.pa).filter(Boolean))].map((code) => ({ code, ...(p.pa[code] || {}) })).filter((a) => a.f && a.ph === ph).map((a) => {
    const ys = Object.keys(a.f).sort();
    const first = a.f[ys[0]], last = a.f[ys[ys.length - 1]];
    return { code: a.code, name: a.n, la: a.la, y0: ys[0], y1: ys[ys.length - 1], f0: first[0], f1: last[0], cap: last[1], spare1: last[1] != null && last[0] != null ? Math.round(last[1] - last[0]) : null,
      sparePct: last[1] ? Math.round((1000 * (last[1] - last[0])) / last[1]) / 10 : null, series: ys.map((y) => ({ y, f: a.f[y][0], cap: a.f[y][1] })) };
  }).sort((a, b) => (b.sparePct ?? -99) - (a.sparePct ?? -99));
  const capNow = trend[trend.length - 1];
  const sfRows = rows.filter((r) => r.sf && r.sf[0]);
  const spRows = rows.filter((r) => r.sp);
  return {
    mode: "capacity", PRI, n: rows.length, of: schools.length, L, trend, nat,
    fillNow: capNow.fill, spareNow: rows.reduce((a, r) => a + (r.spare || 0), 0), overN: rows.filter((r) => r.over > 0).length,
    under85: rows.filter((r) => r.fill != null && r.fill < 85).length,
    rows: rows.sort((a, b) => (a.fill ?? 999) - (b.fill ?? 999)), pressed, pas,
    sf: sfRows.length ? { n: sfRows.length, places: sfRows.reduce((a, r) => a + r.sf[0], 0), roll: sfRows.reduce((a, r) => a + (r.sf[1] || 0), 0) } : null,
    sp: spRows.length ? { n: spRows.length, unit: spRows.reduce((a, r) => a + r.sp[0], 0), rp: spRows.reduce((a, r) => a + r.sp[1], 0) } : null,
  };
}
function subjectsBlock(schools, extras) {
  const p = extras && extras.post16;
  if (!p || !p.s) return null;
  const L = "202425", P = "202324";
  const members = schools.map((s) => ({ s, r: p.s[String(s.urn)] })).filter((m) => m.r && (m.r.va || m.r.gr));
  if (!members.length) return { mode: "subjects", n: 0, empty: true };
  const single = members.length === 1;
  const natG = {};
  (p.natSub[L] || []).forEach(([si, n, a, b]) => { natG[si] = { n, a, b }; });
  const subs = {};
  const S = (si) => (subs[si] = subs[si] || { si, name: p.subjects[si], vaW: 0, vaN: 0, vaPW: 0, vaPN: 0, schools: 0, up: 0, down: 0, gN: 0, gA: 0, gB: 0, gEntries: 0, lo: null, hi: null, rows: [] });
  members.forEach(({ s, r }) => {
    (r.va && r.va[L] || []).forEach(([si, va, lo, hi, n]) => {
      const x = S(si);
      x.vaW += va * (n || 0); x.vaN += n || 0; x.schools++;
      if (lo != null && lo > 0) x.up++;
      if (hi != null && hi < 0) x.down++;
      if (single) { x.lo = lo; x.hi = hi; }
      x.rows.push({ urn: s.urn, name: s.name, va, lo, hi, n });
    });
    (r.va && r.va[P] || []).forEach(([si, va, , , n]) => { const x = S(si); x.vaPW += va * (n || 0); x.vaPN += n || 0; });
    (r.gr && r.gr[L] || []).forEach(([si, n, a, b]) => { const x = S(si); x.gEntries += n; if (a != null) { x.gN += n; x.gA += (a * n) / 100; x.gB += (b * n) / 100; } });
  });
  const rows = Object.values(subs).map((x) => ({
    name: x.name, entries: x.vaN || x.gEntries, schools: x.schools,
    va: x.vaN ? Math.round((x.vaW / x.vaN) * 100) / 100 : null,
    vaPrev: x.vaPN ? Math.round((x.vaPW / x.vaPN) * 100) / 100 : null,
    lo: x.lo, hi: x.hi, up: x.up, down: x.down,
    aStarA: x.gN ? Math.round((1000 * x.gA) / x.gN) / 10 : null, aStarB: x.gN ? Math.round((1000 * x.gB) / x.gN) / 10 : null,
    natA: natG[x.si] ? natG[x.si].a : null, natB: natG[x.si] ? natG[x.si].b : null,
    sig: x.lo != null && x.lo > 0 ? 1 : x.hi != null && x.hi < 0 ? -1 : 0,
    bySchool: x.rows.sort((a, b) => b.va - a.va),
  })).filter((x) => x.va != null && x.entries >= (single ? 1 : 10)).sort((a, b) => b.va - a.va);
  if (!rows.length) return { mode: "subjects", n: members.length, empty: true };
  return { mode: "subjects", n: members.length, single, name: single ? members[0].s.name : null, year: L, rows, vintage: p.vintage };
}

export function scopeShort(scope) {
  if (!scope) return "";
  const place = scope.type === "england" ? "England" : scope.name || (scope.type === "catholicLa" ? "Catholic authorities" : "selection");
  const bits = [
    scope.faith && FAITHS[scope.faith] ? FAITHS[scope.faith].label : null,
    scope.schoolType && TYPES[scope.schoolType] ? TYPES[scope.schoolType].label : null,
  ].filter(Boolean).join(" ");
  return bits ? `${bits} schools, ${place}` : place;
}

/* one school, everything the dataset holds on it — the in-report dashboard */
export function computeSchoolDash(all, urn, extras) {
  const s = all.find((x) => String(x.urn) === String(urn));
  if (!s) return null;
  /* the early-years context of the school's authority (no school-level exists) */
  const early = extras && extras.early && extras.early.las && s.la && extras.early.las[s.la]
    ? { la: s.la, ...extras.early.las[s.la], nat: extras.early.national && extras.early.national["202526"] } : null;
  const bench = benchmarks(all);
  const pri = num(s.attainment8) == null && num(s.ks2_rwm_exp) != null;
  const B = pri ? { ...bench, ...bench.pri } : bench;
  const dist = computeBlock("distribution", [s], all, B, pri ? "primary" : undefined);
  const estate = pri ? primaries(all) : secondaries(all);

  /* where it stands: the share of England this school beats, measure by
     measure. Higher is always better — absence, suspensions and turnover
     are inverted here so the renderer never has to think about direction. */
  const beat = (key, invert) => {
    const v = num(s[key]);
    if (v == null) return null;
    const xs = estate.map((x) => num(x[key])).filter((x) => x != null);
    if (xs.length < 50) return null;
    const better = invert ? xs.filter((x) => x > v).length : xs.filter((x) => x < v).length;
    return Math.round((better / xs.length) * 100);
  };
  const standing = pri ? {
    outcome: beat("ks2_rwm_exp"), high: beat("ks2_rwm_high"), disadv: beat("ks2_rwm_disadv"), read: beat("ks2_read_avg"),
    abs: beat("abs_overall_pct", true), pa: beat("abs_persistent_pct", true), susp: beat("susp_rate", true),
    turnover: beat("wf_turnover_pct", true), reserve: beat("fin_reserve_pp"),
  } : {
    outcome: beat("attainment8"), basics: beat("basics_95"), disadv: beat("a8_disadv"), dest: beat("dest_sustained"),
    abs: beat("abs_overall_pct", true), pa: beat("abs_persistent_pct", true), susp: beat("susp_rate", true),
    turnover: beat("wf_turnover_pct", true), reserve: beat("fin_reserve_pp"),
  };

  /* the fair comparison: every school teaching a similar intake, whole-school
     FSM within five points of this one's, ranked by the headline measure */
  const mKey = pri ? "ks2_rwm_exp" : "attainment8";
  const fsm = num(s.edu_fsm_pct);
  let similar = null;
  if (fsm != null && num(s[mKey]) != null) {
    const peers = estate.filter((x) => num(x.edu_fsm_pct) != null && Math.abs(x.edu_fsm_pct - fsm) <= 5 && num(x[mKey]) != null);
    if (peers.length >= 20) {
      const vals = peers.map((x) => num(x[mKey])).sort((a, b) => a - b);
      const mid = vals.length >> 1;
      const med = r1(vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2);
      const rank = peers.filter((x) => num(x[mKey]) > num(s[mKey])).length + 1;
      const bins = Array.from({ length: pri ? 20 : 18 }, (_, i) => ({ lo: i * 5, hi: i * 5 + 5, n: 0 }));
      vals.forEach((v) => { const i = Math.max(0, Math.min(bins.length - 1, Math.floor(v / 5))); bins[i].n++; });
      similar = { n: peers.length, rank, med, bins, fsm: r1(fsm), topPct: Math.max(1, Math.round((rank / peers.length) * 100)), v: r1(num(s[mKey])) };
    }
  }
  const p16 = extras && extras.post16 && extras.post16.s && extras.post16.s[String(s.urn)] ? post16Block([s], extras) : null;
  const subj = p16 ? subjectsBlock([s], extras) : null;
  const dem = extras && extras.places && extras.places.s ? demandBlock([s], all, pri, extras) : null;
  const cap = extras && extras.places && extras.places.s ? capacityBlock([s], all, pri, extras) : null;
  return { s, pri, bench: B, dist, standing, similar, early, p16: p16 && !p16.empty ? p16 : null, subj: subj && !subj.empty ? subj : null, dem: dem && !dem.empty ? dem : null, cap: cap && !cap.empty ? cap : null };
}

export function computeReport(all, spec, extras) {
  const schools = resolveScope(all, spec.scope);
  const bench = benchmarks(all);
  const phase = spec.scope && spec.scope.phase;
  /* a primary report sees the primary estate's benchmarks under the shared
     key names (absMed, suspMed, ...) plus its own (rwmMed, readMed, ...) */
  const B = phase === "primary" ? { ...bench, ...bench.pri } : bench;
  /* a versus scope rides on the main one: same phase, its own schools */
  let vsScope = null, vsSchools = null;
  if (spec.scope && spec.scope.versus && spec.scope.versus.type) {
    vsScope = { ...spec.scope.versus, phase };
    vsSchools = resolveScope(all, vsScope);
  }
  const blocks = (spec.blocks || []).map((b) => ({
    type: b.type,
    data: computeBlock(b.type, schools, all, B, phase, b, { ...(extras || {}), scope: spec.scope }),
    vs: vsSchools && b.type !== "league" && b.type !== "early" ? computeBlock(b.type, vsSchools, all, B, phase, b, { ...(extras || {}), scope: vsScope }) : null,
  })).filter((b) => b.data);
  return {
    schools, vsSchools, bench: B, blocks, phase: phase || "secondary",
    labels: { a: scopeShort(spec.scope), b: vsScope ? scopeShort(vsScope) : null },
  };
}

/* ── grounded commentary: the reader may write prose, but every figure in it
   must already exist in the computed findings. Pure and node-testable. ── */
export function allowedNumbers(findings) {
  const out = new Set(["2019", "2023", "2024", "2025", "2026", "2027"]);
  const walk = (v) => {
    if (typeof v === "number" && Number.isFinite(v)) {
      out.add(String(v));
      out.add(v.toFixed(1)); out.add(v.toFixed(0));
      out.add(String(Math.round(v * 10) / 10)); out.add(String(Math.abs(v)));
      out.add(Math.abs(v).toFixed(1)); out.add(Math.abs(v).toFixed(0));
    } else if (typeof v === "string") { (v.match(/\d+(?:\.\d+)?/g) || []).forEach((n) => out.add(n)); }
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(findings);
  return out;
}
export function verifyCommentary(text, findings) {
  if (!text) return null;
  const ok = allowedNumbers(findings);
  /* measure names and vintages are vocabulary, not claims */
  const scrubbed = String(text)
    .replace(/\b20\d{2}\/\d{2}\b/g, " ")
    .replace(/\b(attainment|progress)\s*8\b/gi, " ")
    .replace(/\b[AP]8\b/g, " ")
    .replace(/\bkey stage [1245]\b/gi, " ").replace(/\bKS[1245]\b/gi, " ")
    .replace(/\b(level|L) ?3\b/gi, " ").replace(/\b16 ?(to|-) ?1[89]\b/gi, " ").replace(/\bpost-?16\b/gi, " ")
    .replace(/\bbest (three|3)\b/gi, " ").replace(/\bA\*?-[A-E]\b/g, " ")
    .replace(/\bgrade [45]\+?\b/gi, " ").replace(/\b[45]\+ (?:in )?(?:english|E&M)\b/gi, " ")
    .replace(/\bper 100\b/gi, " ")
    .replace(/\byear \d{1,2}\b/gi, " ")
    .replace(/(\d),(\d)/g, "$1$2");
  const nums = scrubbed.match(/\d+(?:\.\d+)?/g) || [];
  return nums.every((n) => ok.has(n) || ok.has(String(+n))) ? String(text).trim() : null;
}
