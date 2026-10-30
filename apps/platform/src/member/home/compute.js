/* The dashboard's arithmetic. Three readings of the same dataset:
     school  - one school, through time and against England and its twins
     estate  - a trust, an authority or a diocese: its schools as one estate
     system  - England itself
   Every figure here is computed, never typed; the page only arranges it. */
import { secondaries, primaries, computeSchoolDash, resolveScope } from "../prizm/engine.js";
import { forecastRolls, forecastDemand, YL } from "../horizon/models.js";

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const median = (xs) => { const v = xs.filter((x) => x != null).sort((a, b) => a - b); return v.length ? (v.length % 2 ? v[v.length >> 1] : (v[(v.length >> 1) - 1] + v[v.length >> 1]) / 2) : null; };
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const sum = (xs) => xs.reduce((a, b) => a + (b || 0), 0);
export const shortYL = (tp) => tp.slice(2, 4) + "/" + tp.slice(4);
const isState = (s) => !/independent/i.test(s.type || "");
const isMainstream = (s) => !/independent|special|pupil referral|alternative|secure/i.test(s.type || "");

/* the year labels of the three published Attainment 8 points */
export const A8_YEARS = ["2018/19", "2024/25", "2025/26"];
export const RWM_YEARS = ["2023/24", "2024/25"];

/* England's results line, once */
const NAT = new WeakMap();
function national(all) {
  let n = NAT.get(all);
  if (n) return n;
  const sec = secondaries(all), pri = primaries(all);
  n = {
    a8: [mean(sec.map((s) => num(s.a8_2019)).filter((x) => x != null)), mean(sec.map((s) => num(s.a8_prev)).filter((x) => x != null)), mean(sec.map((s) => num(s.attainment8)).filter((x) => x != null))].map(r1),
    rwm: [mean(pri.map((s) => num(s.ks2_rwm_prev)).filter((x) => x != null)), mean(pri.map((s) => num(s.ks2_rwm_exp)).filter((x) => x != null))].map(r1),
    a8Med: median(sec.map((s) => num(s.attainment8))),
    rwmMed: median(pri.map((s) => num(s.ks2_rwm_exp))),
    absMedS: median(sec.map((s) => num(s.abs_overall_pct))), absMedP: median(pri.map((s) => num(s.abs_overall_pct))),
    disS: r1(mean(sec.map((s) => num(s.a8_disadv)).filter((x) => x != null))), nonS: r1(mean(sec.map((s) => num(s.a8_nondisadv)).filter((x) => x != null))),
    disP: r1(mean(pri.map((s) => num(s.ks2_rwm_disadv)).filter((x) => x != null))), nonP: r1(mean(pri.map((s) => num(s.ks2_rwm_nondisadv)).filter((x) => x != null))),
    incS: median(sec.map((s) => num(s.fin_income_pp))), incP: median(pri.map((s) => num(s.fin_income_pp))),
    turnS: median(sec.map((s) => num(s.wf_turnover_pct))), turnP: median(pri.map((s) => num(s.wf_turnover_pct))),
    destS: median(sec.map((s) => num(s.dest_sustained))),
  };
  NAT.set(all, n);
  return n;
}

/* England's demand line per phase: first preferences per place, each year */
const DEM = new WeakMap();
function nationalDemand(places, PRI) {
  let m = DEM.get(places);
  if (!m) { m = {}; DEM.set(places, m); }
  const k = PRI ? "aP" : "aS";
  if (m[k]) return m[k];
  const tot = {};
  for (const r of Object.values(places.s)) {
    const a = r[k]; if (!a) continue;
    for (const [y, v] of Object.entries(a)) { if (!v || !v[0]) continue; const t = tot[y] || (tot[y] = { pl: 0, f: 0 }); t.pl += v[0]; t.f += v[2] || 0; }
  }
  m[k] = Object.fromEntries(places.appYears.map((y) => [y, tot[y] && tot[y].pl ? tot[y].f / tot[y].pl : null]));
  return m[k];
}

/* ── one school ─────────────────────────────────────────────────────── */
export function schoolView(all, ofsted, urn, extras) {
  const dash = computeSchoolDash(all, urn, extras);
  if (!dash) return null;
  const { s, pri, standing, twins, similar } = dash;
  const N = national(all);
  const places = extras && extras.places;

  /* results through time, school against England */
  const results = pri
    ? { label: "Reading, writing and maths at the expected standard", unit: "%", years: RWM_YEARS, mine: [num(s.ks2_rwm_prev), num(s.ks2_rwm_exp)], nat: N.rwm, dp: 0 }
    : { label: "Attainment 8", unit: "", years: A8_YEARS, mine: [num(s.a8_2019), num(s.a8_prev), num(s.attainment8)], nat: N.a8, dp: 1 };
  results.points = results.years.map((t, i) => ({ t, v: results.mine[i], nat: results.nat[i] }));
  results.have = results.mine.filter((x) => x != null).length;

  /* roll and places, ten years, then the planning area's forecast */
  let rolls = null;
  if (places && places.s && places.s[String(s.urn)] && places.s[String(s.urn)].c) {
    const f = forecastRolls([s], places, pri);
    const hist = f.hist.filter((h) => h.cap > 0).map((h) => ({ t: shortYL(h.y), v: h.roll, nat: h.cap }));
    const fc = f.fc.slice(1).map((x) => ({ t: shortYL(x.y) + "*", v: x.roll, nat: x.cap }));
    if (hist.length >= 2) rolls = { points: [...hist, ...fc], now: f.now, last: f.last, fill: f.now.cap ? r1((100 * f.now.roll) / f.now.cap) : null, fillLast: f.last && f.last.cap ? r1((100 * f.last.roll) / f.last.cap) : null };
  }

  /* first preferences per place, thirteen intakes, against England */
  let demand = null;
  if (places && places.s && places.s[String(s.urn)]) {
    const k = pri ? "aP" : "aS", a = places.s[String(s.urn)][k];
    if (a) {
      const nat = nationalDemand(places, pri);
      const pts = places.appYears.map((y) => { const v = a[y]; return { t: shortYL(y), v: v && v[0] ? Math.round((100 * (v[2] || 0)) / v[0]) / 100 : null, nat: nat[y] == null ? null : Math.round(nat[y] * 100) / 100 }; });
      const have = pts.filter((p) => p.v != null);
      if (have.length >= 3) demand = { points: pts, now: have[have.length - 1], first: a[places.appYears[places.appYears.length - 1]] };
    }
  }

  /* the gap, the money, the staff: the single figures a head reads first */
  const gap = pri
    ? { mine: num(s.ks2_rwm_disadv), other: num(s.ks2_rwm_nondisadv), natDis: N.disP, natNon: N.nonP, unit: "%", label: "disadvantaged pupils reaching the standard", dp: 0 }
    : { mine: num(s.a8_disadv), other: num(s.a8_nondisadv), natDis: N.disS, natNon: N.nonS, unit: "", label: "disadvantaged pupils' Attainment 8", dp: 1 };
  const fin = { income: num(s.fin_income_pp), spend: num(s.fin_spend_pp), reserve: num(s.fin_reserve_pp), natIncome: pri ? N.incP : N.incS, staff: num(s.fin_staff_pct) };
  const wf = { turnover: num(s.wf_turnover_pct), natTurnover: pri ? N.turnP : N.turnS, ptr: num(s.wf_ptr), ptrPrev: num(s.wf_ptr_prev), teachers: num(s.wf_teachers_fte), sick: num(s.wf_sick_days) };
  const abs = { mine: num(s.abs_overall_pct), nat: pri ? N.absMedP : N.absMedS, pa: num(s.abs_persistent_pct), severe: num(s.abs_severe_pct) };
  const rc = ofsted && ofsted[String(s.urn)] ? ofsted[String(s.urn)] : null;

  /* the rose: where the school stands in England, measure by measure */
  /* the rose: each arm a measure, with the school's own figure, England's
     median and the quartiles, so the stage can tell the whole story of an arm */
  const estate = (pri ? primaries(all) : secondaries(all));
  const ROSE = pri ? [
    ["outcome", "Expected standard", "ks2_rwm_exp", "%", 0, false, "pupils reaching the expected standard in reading, writing and maths"],
    ["high", "Higher standard", "ks2_rwm_high", "%", 0, false, "pupils reaching the higher standard in all three"],
    ["disadv", "Disadvantaged", "ks2_rwm_disadv", "%", 0, false, "disadvantaged pupils reaching the expected standard"],
    ["read", "Reading", "ks2_read_avg", "", 1, false, "average scaled score in reading"],
    ["abs", "Attendance", "abs_overall_pct", "%", 1, true, "overall absence; lower is better"],
    ["pa", "Persistent absence", "abs_persistent_pct", "%", 1, true, "pupils missing a tenth or more of sessions; lower is better"],
    ["susp", "Suspensions", "susp_rate", "", 1, true, "suspensions for every hundred pupils; lower is better"],
    ["turnover", "Retention", "wf_turnover_pct", "%", 1, true, "teachers who left in the year; lower is better"],
    ["reserve", "Reserves", "fin_reserve_pp", "£", 0, false, "revenue reserve for each pupil"],
  ] : [
    ["outcome", "Attainment 8", "attainment8", "", 1, false, "average Attainment 8 score"],
    ["basics", "English and maths 5+", "basics_95", "%", 1, false, "pupils with grade 5 or above in both English and maths"],
    ["disadv", "Disadvantaged", "a8_disadv", "", 1, false, "disadvantaged pupils' Attainment 8"],
    ["dest", "Destinations", "dest_sustained", "%", 1, false, "leavers in sustained education, employment or training"],
    ["abs", "Attendance", "abs_overall_pct", "%", 1, true, "overall absence; lower is better"],
    ["pa", "Persistent absence", "abs_persistent_pct", "%", 1, true, "pupils missing a tenth or more of sessions; lower is better"],
    ["susp", "Suspensions", "susp_rate", "", 1, true, "suspensions for every hundred pupils; lower is better"],
    ["turnover", "Retention", "wf_turnover_pct", "%", 1, true, "teachers who left in the year; lower is better"],
    ["reserve", "Reserves", "fin_reserve_pp", "£", 0, false, "revenue reserve for each pupil"],
  ];
  const q = (xs, p) => { const v = xs.filter((x) => x != null).sort((a, b) => a - b); if (!v.length) return null; return v[Math.min(v.length - 1, Math.floor(p * v.length))]; };
  const rose = ROSE.map(([k, label, field, unit, dp, invert, what]) => {
    if (standing[k] == null) return null;
    const xs = estate.map((x) => num(x[field])).filter((x) => x != null);
    return { k, label, v: standing[k], mine: num(s[field]), unit, dp, invert, what, med: q(xs, 0.5), q1: q(xs, 0.25), q3: q(xs, 0.75), p10: q(xs, 0.1), p90: q(xs, 0.9), n: xs.length };
  }).filter(Boolean);

  return { s, pri, N, results, rolls, demand, gap, fin, wf, abs, rc, rose, twins, similar, dest: num(s.dest_sustained), natDest: N.destS };
}

/* a consistent panel: only schools with a capacity return in every year, so
   the history is a trend in pupils, not in coverage */
function panel(schools, places) {
  const C = places.capYears;
  return schools.filter((s) => { const r = places.s[String(s.urn)]; return r && r.c && C.every((y) => r.c[y] && r.c[y][0] && r.c[y][1] != null); });
}
/* England's share of families offered their first choice, by phase and year */
function nationalFirstChoice(places, PRI) {
  const k = PRI ? "aP" : "aS", tot = {};
  for (const r of Object.values(places.s)) {
    const a = r[k]; if (!a) continue;
    for (const [y, v] of Object.entries(a)) { if (!v || !v[2]) continue; const t = tot[y] || (tot[y] = { f: 0, o: 0 }); t.f += v[2]; t.o += v[3] || 0; }
  }
  return Object.fromEntries(places.appYears.map((y) => [y, tot[y] && tot[y].f ? r1((100 * tot[y].o) / tot[y].f) : null]));
}

/* ── an estate: a trust, an authority, a diocese ───────────────────────── */
/* Dioceses are not in the DfE's files; the Institute keeps the authorities
   each one covers. Catholic schools in those authorities are the estate. */
export const DIOCESES = {
  westminster: ["Westminster", "Kensington and Chelsea", "Hammersmith and Fulham", "Camden", "Islington", "Hackney", "Tower Hamlets", "City of London", "Barnet", "Brent", "Ealing", "Enfield", "Haringey", "Harrow", "Hillingdon", "Hounslow", "Hertfordshire"],
  southwark: ["Southwark", "Lambeth", "Lewisham", "Greenwich", "Bexley", "Bromley", "Croydon", "Sutton", "Merton", "Wandsworth", "Richmond upon Thames", "Kingston upon Thames", "Kent", "Medway"],
  brentwood: ["Essex", "Southend-on-Sea", "Thurrock", "Havering", "Barking and Dagenham", "Redbridge", "Newham", "Waltham Forest"],
};
export function estateSchools(all, user) {
  const org = (user.orgName || "").trim();
  if (!org) return [];
  const o = org.toLowerCase();
  const state = all.filter(isState);
  if (user.accountType === "trust") return state.filter((s) => (s.trust || "").trim().toLowerCase() === o);
  if (user.accountType === "la") return state.filter((s) => (s.la || "").trim().toLowerCase() === o);
  if (user.accountType === "diocese") {
    const key = Object.keys(DIOCESES).find((k) => o.includes(k));
    const las = new Set((key ? DIOCESES[key] : []).map((x) => x.toLowerCase()));
    return state.filter((s) => /catholic/i.test(s.religiousCharacter || "") && (las.size ? las.has((s.la || "").trim().toLowerCase()) : false));
  }
  return [];
}

export function estateView(all, ofsted, user, extras) {
  const mine = estateSchools(all, user);
  if (!mine.length) return null;
  const N = national(all);
  const places = extras && extras.places, send = extras && extras.send;
  const sec = mine.filter((s) => num(s.attainment8) != null && isMainstream(s)), pri = mine.filter((s) => num(s.ks2_rwm_exp) != null && isMainstream(s));
  const pupils = sum(mine.map((s) => num(s.pupils)));
  const a8 = r1(mean(sec.map((s) => s.attainment8))), rwm = r1(mean(pri.map((s) => s.ks2_rwm_exp)));
  const absM = median(mine.map((s) => num(s.abs_overall_pct)));
  let ehcN = 0, ehcP = 0, deficits = 0, cards = 0;
  for (const s of mine) {
    if (num(s.sen_ehcp_n) != null && num(s.pupils)) { ehcN += s.sen_ehcp_n; ehcP += s.pupils; }
    if (num(s.fin_reserve_pp) != null && s.fin_reserve_pp < 0) deficits++;
    if (ofsted && ofsted[String(s.urn)] && ofsted[String(s.urn)].rc) cards++;
  }

  /* each school against England's median, the main measure */
  const secRows = sec.map((s) => ({ label: s.name, v: r1(s.attainment8 - N.a8Med), urn: s.urn, tip: [s.name, `Attainment 8 ${r1(s.attainment8)}; England's median ${r1(N.a8Med)}`] })).sort((a, b) => b.v - a.v);
  const priRows = pri.map((s) => ({ label: s.name, v: r1(s.ks2_rwm_exp - N.rwmMed), urn: s.urn, tip: [s.name, `${Math.round(s.ks2_rwm_exp)}% reach the standard; England's median ${Math.round(N.rwmMed)}%`] })).sort((a, b) => b.v - a.v);

  /* rolls and places, the estate together, then the forecast */
  let rolls = null;
  if (places && places.s) {
    const f = forecastRolls(panel(mine, places), places, false);
    const hist = f.hist.filter((h) => h.cap > 0).map((h) => ({ t: shortYL(h.y), v: h.roll, nat: h.cap }));
    const fc = f.fc.slice(1).map((x) => ({ t: shortYL(x.y) + "*", v: x.roll, nat: x.cap }));
    if (hist.length >= 2 && f.now.cap) rolls = { points: [...hist, ...fc], now: f.now, last: f.last, fill: r1((100 * f.now.roll) / f.now.cap), fillLast: f.last && f.last.cap ? r1((100 * f.last.roll) / f.last.cap) : null, rows: f.rows };
  }
  /* demand: the phase with more schools leads */
  let demand = null;
  if (places && places.s) {
    const PRI = pri.length > sec.length, set = PRI ? pri : sec;
    if (set.length) {
      const d = forecastDemand(set, places, PRI);
      const nat = nationalDemand(places, PRI);
      const pts = d.tot.map((t) => ({ t: shortYL(t.y), v: t.ratio == null ? null : Math.round(t.ratio * 100) / 100, nat: nat[t.y] == null ? null : Math.round(nat[t.y] * 100) / 100 }));
      if (pts.filter((p) => p.v != null).length >= 3) demand = { PRI, points: [...pts, ...d.proj.map((p) => ({ t: shortYL(p.y) + "*", v: p.ratio == null ? null : Math.round(p.ratio * 100) / 100, nat: null }))], slope: d.slope, n: set.length };
    }
  }
  /* EHC plans: an authority's own series */
  let ehc = null;
  if (user.accountType === "la" && send && send.las) {
    const key = Object.keys(send.las).find((k) => k.toLowerCase() === (user.orgName || "").trim().toLowerCase());
    const row = key && send.las[key];
    if (row && row.ehcp) {
      const ys = Object.keys(row.ehcp).sort();
      ehc = { points: ys.map((y) => ({ t: "Jan " + (+y.slice(0, 4) + 1), v: row.ehcp[y], nat: null })), now: row.ehcp[ys[ys.length - 1]], first: row.ehcp[ys[0]], years: ys.length - 1 };
    }
  }
  /* the watch list: what a system leader would want to know this morning */
  const watch = [];
  for (const s of mine) {
    const why = [];
    if (num(s.fin_reserve_pp) != null && s.fin_reserve_pp < 0) why.push(`in deficit: £${Math.abs(Math.round(s.fin_reserve_pp)).toLocaleString("en-GB")} a pupil`);
    const c = places && places.s && places.s[String(s.urn)] && places.s[String(s.urn)].c;
    if (c) { const L = places.capYears[places.capYears.length - 1], v = c[L]; if (v && v[0] && v[1] != null && v[1] / v[0] < 0.7) why.push(`${Math.round((100 * v[1]) / v[0])}% full`); }
    const absNat = num(s.attainment8) != null ? N.absMedS : N.absMedP;
    if (num(s.abs_persistent_pct) != null && s.abs_persistent_pct >= 30) why.push(`persistent absence ${Math.round(s.abs_persistent_pct)}%`);
    else if (num(s.abs_overall_pct) != null && absNat != null && s.abs_overall_pct >= absNat + 3) why.push(`absence ${r1(s.abs_overall_pct)}%`);
    if (isMainstream(s) && num(s.attainment8) != null && s.attainment8 < N.a8Med - 8) why.push(`Attainment 8 ${r1(s.attainment8)}`);
    if (isMainstream(s) && num(s.ks2_rwm_exp) != null && s.ks2_rwm_exp < N.rwmMed - 20) why.push(`${Math.round(s.ks2_rwm_exp)}% at the standard`);
    if (why.length) watch.push({ urn: s.urn, name: s.name, la: s.la, why });
  }
  watch.sort((a, b) => b.why.length - a.why.length);

  return { n: mine.length, pupils, sec: sec.length, pri: pri.length, a8, rwm, natA8: r1(N.a8Med), natRwm: Math.round(N.rwmMed), abs: r1(absM), ehcp: ehcP ? r1((100 * ehcN) / ehcP) : null, deficits, cards, secRows, priRows, rolls, demand, ehc, watch, mine };
}

/* ── the system ─────────────────────────────────────────────────────── */
export function systemView(all, ofsted, extras) {
  const N = national(all);
  const state = all.filter(isState);
  const sec = secondaries(all), pri = primaries(all);
  const places = extras && extras.places, send = extras && extras.send;
  let ehcN = 0, ehcP = 0, deficits = 0;
  for (const s of state) {
    if (num(s.sen_ehcp_n) != null && num(s.pupils)) { ehcN += s.sen_ehcp_n; ehcP += s.pupils; }
    if (num(s.fin_reserve_pp) != null && s.fin_reserve_pp < 0) deficits++;
  }
  const cards = ofsted ? Object.values(ofsted).filter((e) => e && e.rc).length : 0;
  const pupils = sum(state.map((s) => num(s.pupils)));

  /* results, England's line */
  const a8 = { years: A8_YEARS, points: A8_YEARS.map((t, i) => ({ t, v: N.a8[i], nat: null })) };
  /* rolls and places: every state mainstream school with a capacity return */
  let rolls = null;
  if (places && places.s) {
    const f = forecastRolls(panel(state.filter(isMainstream), places), places, false);
    const hist = f.hist.filter((h) => h.cap > 0).map((h) => ({ t: shortYL(h.y), v: h.roll, nat: h.cap }));
    const fc = f.fc.slice(1).map((x) => ({ t: shortYL(x.y) + "*", v: x.roll, nat: x.cap }));
    rolls = { points: [...hist, ...fc], now: f.now, last: f.last, fill: r1((100 * f.now.roll) / f.now.cap), fillLast: f.last && f.last.cap ? r1((100 * f.last.roll) / f.last.cap) : null };
  }
  /* EHC plans, England, since 2019, and the authorities' forecast of specialist pupils */
  let ehc = null;
  if (send && send.nat && send.nat.ehcp) {
    const ys = Object.keys(send.nat.ehcp).sort();
    ehc = { points: ys.map((y) => ({ t: "Jan " + (+y.slice(0, 4) + 1), v: send.nat.ehcp[y], nat: null })), now: send.nat.ehcp[ys[ys.length - 1]], first: send.nat.ehcp[ys[0]], years: ys.length - 1 };
  }
  /* first choices met, England, both phases */
  let demand = null;
  if (places && places.s) {
    const nS = nationalFirstChoice(places, false), nP = nationalFirstChoice(places, true);
    const pts = places.appYears.map((y) => ({ t: shortYL(y), v: nS[y], nat: nP[y] }));
    const last = pts[pts.length - 1];
    demand = { points: pts, sec: last.v, pri: last.nat };
  }
  /* the regions: Attainment 8 and the disadvantage gap */
  const regions = {};
  for (const s of sec) { if (!s.region) continue; const r = regions[s.region] || (regions[s.region] = { a8: [], dis: [], abs: [], rwm: [] }); r.a8.push(s.attainment8); if (num(s.a8_disadv) != null) r.dis.push(s.a8_disadv); if (num(s.abs_overall_pct) != null) r.abs.push(s.abs_overall_pct); }
  for (const s of pri) { if (!s.region) continue; const r = regions[s.region] || (regions[s.region] = { a8: [], dis: [], abs: [], rwm: [] }); r.rwm.push(s.ks2_rwm_exp); }
  const regionRows = Object.entries(regions).map(([name, r]) => ({ label: name, v: r1(mean(r.a8)), dis: r1(mean(r.dis)), rwm: r1(mean(r.rwm)), abs: r1(median(r.abs)), n: r.a8.length })).filter((r) => r.v != null).sort((a, b) => b.v - a.v);

  return { n: state.length, pupils, a8: N.a8[2], a8Prev: N.a8[1], rwm: N.rwm[1], rwmPrev: N.rwm[0], abs: r1(N.absMedS), absP: r1(N.absMedP), ehcp: ehcP ? r1((100 * ehcN) / ehcP) : null, deficits, cards, disS: N.disS, nonS: N.nonS, a8Line: a8, rolls, ehc, demand, regionRows, secN: sec.length, priN: pri.length };
}

export { YL, resolveScope };
