/* A scenario is a specification, never a result: lever, scope and settings.
   Running it against the data of the day gives the page, a handful of
   headline figures for comparison, and the findings a written case may
   quote. Saved scenarios recompute when reopened, as Prizm's reports do. */
import { scopeSchools, forecastRolls, forecastDemand, forecastResults, placesSim, fundingSim, FUND_PRESETS, accountabilitySim, ACC_MEASURES, sendSim, YL } from "./models.js";
import { forecastsHtml, placesSimHtml, fundingHtml, accountabilityHtml, sendHtml } from "./views.js";

export const LEVERS = {
  forecast: { label: "Forecasts", verb: "where the system is heading", kw: ["forecast", "project", "heading", "future", "ahead", "trajector", "next year", "2031", "where will", "run out", "run short", "picture"] },
  rolls: { label: "Falling rolls", verb: "places, viability and closures", kw: ["falling roll", "close", "closure", "closing", "reopen", "amalgamat", "merge", "viable", "viability", "emptiest", "spare places", "surplus", "capacity", "shrink", "year group"] },
  funding: { label: "Funding", verb: "who gains and who loses", kw: ["fund", "premium", "money", "pot of", "budget", "weight", "top slice", "redistribut", "grant", "per pupil", "million", "bn"] },
  acc: { label: "Accountability", verb: "who rises and falls under a new measure", kw: ["accountab", "league", "rank", "measure", "progress 8", "report card", "composite", "judge", "scor"] },
  send: { label: "SEND", verb: "EHC plans against specialist places", kw: ["send", "ehc", "special school", "specialist", "mainstream", "plans"] },
};
export const defaultParams = (lever, PRI) => ({
  forecast: {},
  rolls: { minPerYear: PRI ? 30 : 120, demandShift: 0.5, close: [] },
  funding: { preset: "inclusion", potM: 250, neutral: false, ...FUND_PRESETS.inclusion },
  acc: { weights: PRI ? { rwm: 1, high: 0, dis: 1, odds: 1, att: 0.5, incl: 0.5 } : { a8: 1, b95: 0, dis: 1, odds: 1, att: 0.5, incl: 0.5, dest: 0 } },
  send: { growth: "trend", shift: 0 },
}[lever] || {});

export const scopeLabel = (sc) => (!sc || sc.type === "england" ? "England" : sc.name || "…");
export const titleFor = (spec) => {
  const L = LEVERS[spec.lever] || LEVERS.forecast, where = scopeLabel(spec.scope);
  const p = spec.params || {};
  if (spec.lever === "rolls" && p.close && p.close.length) return `Closing ${p.close.length} school${p.close.length === 1 ? "" : "s"} in ${where}`;
  if (spec.lever === "funding") { const m = p.potM || 250; const pot = m >= 1000 ? `£${(m / 1000).toFixed(m % 1000 ? 1 : 0)}bn` : `£${m}m`; return `${p.neutral ? "Redistributing" : "A new"} ${pot}${p.preset && FUND_PRESETS[p.preset] ? ": " + FUND_PRESETS[p.preset].label.replace(/^(An?|The) /, "").toLowerCase() : ""}${spec.scope && spec.scope.type !== "england" ? ", seen from " + where : ""}`; }
  if (spec.lever === "send") return `SEND to 2031 in ${where}${p.shift ? `, ${p.shift}% met in mainstream` : ""}`;
  if (spec.lever === "acc") return `A new accountability measure, seen from ${where}`;
  if (spec.lever === "rolls") return `Falling rolls in ${where}`;
  return `${where}: ${L.verb}`;
};

/* a scenario, run: the page, the comparison figures and the findings */
export function runScenario(spec, D) {
  const { all, places, intake, send } = D;
  const PRI = (spec.scope && spec.scope.phase) === "primary";
  const schools = scopeSchools(all, spec.scope || { type: "england" });
  const label = scopeLabel(spec.scope);
  const p = { ...defaultParams(spec.lever, PRI), ...(spec.params || {}) };
  const out = { lever: spec.lever, label, PRI, n: schools.length, params: p };
  if (!schools.length) return { ...out, html: "", summary: [], findings: { note: "no schools in scope" } };
  if (spec.lever === "rolls") {
    if (!places) return { ...out, waiting: "the capacity returns" };
    let closeUrns = resolveClosures(p.close, schools);
    /* "the two emptiest": chosen from the projection without closures */
    if (p.closeEmptiest) { const probe = placesSim(schools, places, PRI, { minPerYear: p.minPerYear, demandShift: p.demandShift }); closeUrns = [...new Set([...closeUrns, ...probe.rows.slice(0, p.closeEmptiest).map((r) => String(r.urn))])]; }
    const sim = placesSim(schools, places, PRI, { minPerYear: p.minPerYear, demandShift: p.demandShift, close: closeUrns });
    const T = sim.totals, C = sim.closure;
    out.summary = [
      { k: "proj", label: `Pupils by ${YL(sim.year)}`, v: T.proj, dp: 0 },
      { k: "spare", label: "Places spare", v: C ? C.sparePctAfter : T.sparePct, unit: "%", dp: 1, lower: true },
      { k: "risk", label: "Schools at risk", v: sim.atRisk, dp: 0, lower: true },
      C ? { k: "moved", label: "Pupils moved", v: C.moved, dp: 0, lower: true } : { k: "cap", label: "Places", v: T.cap, dp: 0 },
      C ? { k: "km", label: "Average extra distance", v: C.avgKm, unit: " km", dp: 1, lower: true } : null,
    ].filter(Boolean);
    out.findings = { lever: "falling rolls and places", scope: label, phase: PRI ? "primary" : "secondary", year: YL(sim.year), smallestViableYearGroup: sim.minPer, demandShift: sim.shift, totals: T, schoolsAtRisk: sim.atRisk, closures: C, atRisk: sim.rows.filter((r) => r.risk).slice(0, 12).map((r) => ({ school: r.name, projected: r.proj, perYearGroup: r.perYear, pctFull: r.fill })) };
    out.html = placesSimHtml({ label, PRI, sim });
    out.closable = sim.rows.map((r) => ({ urn: String(r.urn), name: r.name, fill: r.fill, risk: r.risk }));
    out.closedUrns = closeUrns;
    return out;
  }
  if (spec.lever === "funding") {
    const eng = spec.scope && spec.scope.type !== "england" ? scopeSchools(all, { type: "england", phase: PRI ? "primary" : undefined }) : schools;
    const sim = fundingSim(eng, { ...p, PRI }, spec.scope && spec.scope.type !== "england" ? new Set(schools.map((s) => String(s.urn))) : null);
    const A = sim.area;
    out.summary = [
      { k: "q5", label: "Most disadvantaged fifth, a pupil", v: sim.quintiles[4].pp, unit: "£", dp: 0, money: true },
      { k: "q1", label: "Least disadvantaged fifth, a pupil", v: sim.quintiles[0].pp, unit: "£", dp: 0, money: true },
      { k: "bottom", label: "To the weakest quarter for disadvantaged pupils", v: sim.bottomShare, unit: "%", dp: 1 },
      A ? { k: "area", label: `${label}, a pupil`, v: A.pp, unit: "£", dp: 0, money: true } : { k: "winners", label: "Schools gaining", v: sim.winners, dp: 0 },
      { k: "losers", label: "Schools losing", v: sim.losers, dp: 0, lower: true },
    ];
    const potText = (p.potM || 250) >= 1000 ? `£${((p.potM || 250) / 1000).toFixed((p.potM || 250) % 1000 ? 1 : 0)}bn` : `£${p.potM || 250}m`;
    out.findings = { lever: "funding and premiums", scope: label, phase: PRI ? "primary" : "secondary", pot: potText, potMillions: p.potM, budgetNeutral: !!p.neutral, weights: { fsm: p.fsm, senSupport: p.senk, ehcp: p.ehcp, eal: p.eal, areaDeprivation: p.idaci }, schools: sim.n, winners: sim.winners, losers: sim.losers, perPupilByFsmFifth: sim.quintiles.map((q) => ({ fifth: q.q, perPupil: q.pp, fsmFrom: q.fsmLo, fsmTo: q.fsmHi })), shareToWeakestQuarterForDisadvantaged: sim.bottomShare, regions: sim.regions, area: A, largestGains: (sim.mine || sim.rows).slice(0, 6).map((r) => ({ school: r.name, perPupil: r.pp, net: r.net })) };
    out.html = fundingHtml({ label, sim });
    return out;
  }
  if (spec.lever === "acc") {
    const sim = accountabilitySim(all, PRI, intake, p.weights || {}, spec.scope && spec.scope.type !== "england" ? schools : null);
    out.summary = [
      { k: "top", label: "Most disadvantaged fifth, rank change", v: sim.fq[4].move, dp: 0, sign: true },
      { k: "bot", label: "Least disadvantaged fifth, rank change", v: sim.fq[0].move, dp: 0, sign: true },
      { k: "corr", label: "Agreement with today's league", v: sim.corr, dp: 2 },
      { k: "enter", label: "Newly in the bottom tenth", v: sim.enterN, dp: 0, lower: true },
    ];
    out.findings = { lever: "accountability measures", scope: label, phase: PRI ? "primary" : "secondary", todaysMeasure: sim.base, proposedWeights: sim.weights.filter((w) => w.w > 0), schoolsRanked: sim.N, rankChangeByFsmFifth: sim.fq, newlyInBottomTenth: sim.enterN, leavingBottomTenth: sim.leaveN, rankCorrelation: sim.corr, risersInScope: sim.risers.slice(0, 6), fallersInScope: sim.fallers.slice(0, 6) };
    out.html = accountabilityHtml({ label, sim });
    return out;
  }
  if (spec.lever === "send") {
    if (!send) return { ...out, waiting: "the EHC plan series" };
    const las = spec.scope && spec.scope.type !== "england" ? new Set(schools.map((s) => s.la).filter(Boolean)) : null;
    const sim = sendSim(send, { growth: p.growth, shift: p.shift }, las);
    const T = sim.totals;
    out.summary = [
      { k: "ehcp", label: "EHC plans by 2031", v: T.ehcp31, dp: 0, lower: true },
      { k: "demand", label: "Specialist demand by 2031", v: T.demand31, dp: 0, lower: true },
      { k: "gap", label: "Specialist places short", v: T.gap31, dp: 0, lower: true },
      { k: "places", label: "Special school places today", v: T.places, dp: 0 },
    ];
    out.findings = { lever: "SEND growth", scope: label, growthAssumption: sim.growth, pctNewSpecialistDemandMetInMainstream: sim.shift, totals: T, authoritiesWithLargestShortfall: sim.rows.slice(0, 8).map((r) => ({ authority: r.la, ehcPlansNow: r.now, growthPerYearPct: r.g, ehcPlans2031: r.ehcp31, specialPlaces: r.places, specialistDemand2031: r.demand31, shortfall2031: r.gap31, authorityOwnForecast: r.laFc })) };
    out.html = sendHtml({ label, sim });
    return out;
  }
  /* forecast */
  if (!places) return { ...out, waiting: "the capacity returns" };
  const rolls = forecastRolls(schools, places, PRI), demand = forecastDemand(schools, places, PRI);
  const results = D.heavy && D.heavy.key === heavyKey(spec) ? D.heavy.results : null;
  const lastP = demand.proj[demand.proj.length - 1];
  out.summary = [
    { k: "roll", label: `Pupils by ${rolls.last ? YL(rolls.last.y) : "the horizon"}`, v: rolls.last ? rolls.last.roll : null, dp: 0 },
    { k: "spare", label: "Places spare then", v: rolls.last ? Math.round((1000 * rolls.spareLast) / rolls.last.cap) / 10 : null, unit: "%", dp: 1, lower: true },
    { k: "demand", label: "First preferences per place, three years on", v: lastP && lastP.ratio != null ? Math.round(lastP.ratio * 100) / 100 : null, dp: 2 },
    results ? { k: "next", label: `${results.measure}, one year on`, v: results.meanNext, dp: 1 } : null,
  ].filter(Boolean);
  out.findings = { lever: "forecasts", scope: label, phase: PRI ? "primary" : "secondary", rolls: { now: rolls.now, horizon: rolls.last, spareNow: rolls.spareNow, spareAtHorizon: rolls.spareLast }, demand: { slopePerYear: demand.slope, projected: demand.proj.map((x) => ({ year: YL(x.y), perPlace: x.ratio == null ? null : Math.round(x.ratio * 100) / 100 })) }, results: results ? { measure: results.measure, persistence: results.rho, meanNow: results.meanNow, meanNext: results.meanNext, largestFalls: results.rows.slice(0, 5).map((r) => ({ school: r.name, now: r.now, projected: r.next })), largestRises: results.rows.slice(-5).reverse().map((r) => ({ school: r.name, now: r.now, projected: r.next })) } : "still computing" };
  out.html = forecastsHtml({ label, PRI, rolls, demand, results });
  out.needsHeavy = !results;
  return out;
}
export const heavyKey = (spec) => JSON.stringify([spec.lever, spec.scope]);
/* the slow part of a forecast: every school's twins */
export function runHeavy(spec, D) {
  const PRI = (spec.scope && spec.scope.phase) === "primary";
  const schools = scopeSchools(D.all, spec.scope || { type: "england" });
  return { key: heavyKey(spec), results: forecastResults(schools, D.all, PRI, D.intake) };
}

/* closures may be named (by the reader) or given as URNs (by the controls) */
function resolveClosures(close, schools) {
  const out = [];
  for (const c of close || []) {
    const s = String(c);
    if (/^\d{5,7}$/.test(s)) { out.push(s); continue; }
    const hit = schools.find((x) => (x.name || "").toLowerCase() === s.toLowerCase()) || schools.find((x) => (x.name || "").toLowerCase().includes(s.toLowerCase()));
    if (hit) out.push(String(hit.urn));
  }
  return [...new Set(out)];
}

/* ── the fallback reader: rules only, for when the reader is out of reach
   or the words are plain enough not to need it ── */
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
export function readLocally(text, current, names) {
  const t = " " + norm(text) + " ";
  /* the lever with most of its words in the text; a word matches at the start of a word ("fund" takes "funding") */
  let lever = null, best = 0;
  for (const [k, L] of Object.entries(LEVERS)) {
    const hits = L.kw.reduce((a, w) => { const nw = norm(w); return a + (nw && t.includes(" " + nw) ? 1 : 0); }, 0);
    if (hits > best) { best = hits; lever = k; }
  }
  const refine = !!current;
  let scope = current ? { ...current.scope } : { type: "england" };
  if (/\bprimar/.test(t)) scope.phase = "primary";
  else if (/\bsecondar/.test(t)) delete scope.phase;
  if (/\b(england|national|nationally|whole system|the country)\b/.test(t)) scope = { type: "england", phase: scope.phase };
  const find = (list, type) => { let best = null; for (const n of list) { const nn = norm(n); if (nn.length >= 4 && t.includes(" " + nn + " ") && (!best || nn.length > norm(best).length)) best = n; } return best ? { type, name: best } : null; };
  const hit = find(names.regions || [], "region") || find(names.las || [], "la") || find(names.trusts || [], "trust");
  if (hit) scope = { ...hit, phase: scope.phase };
  if (!lever && !refine) return null;
  if (!lever) lever = current.lever;
  const PRI = scope.phase === "primary";
  const params = { ...defaultParams(lever, PRI), ...(refine && current.lever === lever ? current.params : {}) };
  const num = (re) => { const m = t.match(re); return m ? parseFloat(m[1]) : null; };
  if (lever === "funding") {
    const pot = num(/(\d+(?:\.\d+)?)\s*(?:m\b|million|bn|billion)/); if (pot != null) params.potM = /bn|billion/.test(t) ? pot * 1000 : pot;
    if (/budget.?neutral|top.?slice|redistribut|cost.?neutral/.test(t)) params.neutral = true;
    if (/new money|additional|extra/.test(t)) params.neutral = false;
    if (/inclusion premium/.test(t)) Object.assign(params, FUND_PRESETS.inclusion, { preset: "inclusion" });
    if (/pupil premium|disadvantage uplift|fsm only/.test(t)) Object.assign(params, FUND_PRESETS.disadvantage, { preset: "disadvantage" });
    if (/place factor|deprivation factor|area deprivation/.test(t)) Object.assign(params, FUND_PRESETS.place, { preset: "place" });
    const w = num(/ehc[p]?\s*(?:plans?)?\s*(?:at|x|×|weighted)?\s*(\d+(?:\.\d+)?)/); if (w != null) { params.ehcp = w; params.preset = "custom"; }
  }
  if (lever === "send") {
    if (/halve|half/.test(t)) params.growth = "half";
    if (/flat|no (further )?growth|stop(s|ped)? growing|freeze/.test(t)) params.growth = "flat";
    const g = num(/(\d+(?:\.\d+)?)\s*%\s*(?:a|per)\s*year/); if (g != null) params.growth = g;
    const sh = num(/(\d+)\s*%?\s*(?:percent\s*)?(?:in|into|met in|absorbed|to|by|within)\s+(?:the\s+)?mainstream/) ?? num(/mainstream[^.]*?(\d+)\s*%/); if (sh != null) params.shift = sh;
  }
  if (lever === "rolls") {
    const m = num(/(\d+)\s*(?:a|per)\s*year group|year group(?:s)? of (\d+)/); if (m != null) params.minPerYear = m;
    if (/\bno demand shift|shares? fixed|every school shrinks/.test(t)) params.demandShift = 0;
    if (/full (demand )?shift|follow(s)? (the )?trend/.test(t)) params.demandShift = 1;
    const words = { two: 2, three: 3, four: 4, five: 5 };
    const mm = t.match(/clos(?:e|ing) the (\d+|two|three|four|five) emptiest/);
    const ce = mm ? (words[mm[1]] || parseInt(mm[1], 10)) : /clos(e|ing) the emptiest/.test(t) ? 1 : undefined;
    if (ce) params.closeEmptiest = ce;
    if (/reopen|undo (the )?closure|close nothing|no closures/.test(t)) params.close = [];
  }
  if (lever === "acc") {
    const W = params.weights = { ...params.weights };
    const set = (key, re) => { const m = t.match(re); if (m) W[key] = Math.max(0, Math.min(2, parseFloat(m[1]))); };
    set("odds", /beating the odds[^.]*?(\d(?:\.\d)?)/); set("att", /attendance[^.]*?(\d(?:\.\d)?)/); set("incl", /inclusion[^.]*?(\d(?:\.\d)?)/); set("dis", /disadvantage[^.]*?(\d(?:\.\d)?)/); set("dest", /destinations?[^.]*?(\d(?:\.\d)?)/);
    if (/only beating the odds|odds alone/.test(t)) Object.keys(W).forEach((k) => { W[k] = k === "odds" ? 1 : 0; });
  }
  const spec = { lever, scope, params };
  spec.title = titleFor(spec);
  return spec;
}

/* refinements worth offering next, lever by lever */
export function nextSteps(spec, run) {
  const p = spec.params || {}, where = scopeLabel(spec.scope);
  const out = [];
  if (spec.lever === "funding") { out.push(p.neutral ? { t: "As new money instead", patch: { neutral: false } } : { t: "Make it budget-neutral", patch: { neutral: true } }); out.push({ t: "Double the pot", patch: { potM: (p.potM || 250) * 2 } }); if ((p.ehcp || 0) < 6) out.push({ t: "Weight EHC plans six to one", patch: { ehcp: 6, preset: "custom" } }); }
  if (spec.lever === "rolls") { if (run && run.closable) { const risk = run.closable.filter((r) => r.risk && !(p.close || []).includes(r.urn)).slice(0, 2); if (risk.length) out.push({ t: `Close ${risk.length === 1 ? "the emptiest" : "the two emptiest"}`, patch: { close: [...(p.close || []), ...risk.map((r) => r.urn)] } }); } if (p.close && p.close.length) out.push({ t: "Reopen them", patch: { close: [] } }); out.push(p.demandShift ? { t: "No demand shift", patch: { demandShift: 0 } } : { t: "Let shares follow demand", patch: { demandShift: 0.5 } }); }
  if (spec.lever === "send") { out.push(p.growth === "half" ? { t: "Back to the trend", patch: { growth: "trend" } } : { t: "Halve the growth", patch: { growth: "half" } }); out.push({ t: `${(p.shift || 0) + 25 > 100 ? "All" : (p.shift || 0) + 25 + "%"} of new demand in mainstream`, patch: { shift: Math.min(100, (p.shift || 0) + 25) } }); }
  if (spec.lever === "acc") { const W = p.weights || {}; out.push({ t: "Beating the odds alone", patch: { weights: Object.fromEntries(Object.keys(W).map((k) => [k, k === "odds" ? 1 : 0])) } }); out.push({ t: "Add destinations", patch: { weights: { ...W, dest: 1 } } }); }
  if (spec.lever === "forecast") { out.push({ t: "What would closures do?", lever: "rolls" }); out.push({ t: "And SEND?", lever: "send" }); }
  if (spec.scope && spec.scope.type !== "england") out.push({ t: "Set it against England", compare: { type: "england", phase: spec.scope.phase } });
  if (!(spec.scope && spec.scope.phase === "primary")) out.push({ t: "Try primaries", scope: { ...(spec.scope || { type: "england" }), phase: "primary" } });
  else out.push({ t: "Back to secondaries", scope: { ...spec.scope, phase: undefined } });
  return out.slice(0, 5);
}
