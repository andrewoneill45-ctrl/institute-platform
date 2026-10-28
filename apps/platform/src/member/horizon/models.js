/* Horizon's models: forecasts and four policy levers, pure and node-testable.
   Every model runs on the published national data the platform already
   holds; every assumption is a named parameter the user can see and move.
   Nothing here is a prediction of what WILL happen: each is "if this held". */
import { resolveScope, secondaries, primaries, twinSpace, nearest, expectFrom } from "../prizm/engine.js";

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const mean = (xs) => (xs.length ? sum(xs) / xs.length : null);
export const YL = (tp) => tp.slice(0, 4) + "/" + tp.slice(4);
const shortYL = (tp) => tp.slice(2, 4) + "/" + tp.slice(4);

export function scopeSchools(all, scope) {
  return resolveScope(all, scope && scope.type ? scope : { type: "england", phase: scope && scope.phase });
}

/* ── 1. forecasts ─────────────────────────────────────────────────────── */
/* each school's roll carried forward by its planning area's forecast */
function paRatio(places, code, y0) {
  const a = places.pa && places.pa[code];
  if (!a || !a.f) return null;
  const ys = Object.keys(a.f).sort();
  const base = a.f[ys[0]] && a.f[ys[0]][0];
  if (!base) return null;
  return Object.fromEntries(ys.map((y) => [y, a.f[y][0] / base]));
}
export function forecastRolls(schools, places, PRI) {
  const C = places.capYears, L = C[C.length - 1];
  const hist = C.map((y) => ({ y, roll: 0, cap: 0 }));
  const fyears = new Set();
  const rows = [];
  for (const s of schools) {
    const r = places.s[String(s.urn)];
    if (!r || !r.c) continue;
    C.forEach((y, i) => { const v = r.c[y]; if (v && v[0] && v[1] != null) { hist[i].roll += v[1]; hist[i].cap += v[0]; } });
    const now = r.c[L];
    if (!now || !now[0] || now[1] == null) continue;
    const ratio = r.pa ? paRatio(places, r.pa, L) : null;
    if (ratio) Object.keys(ratio).forEach((y) => fyears.add(y));
    rows.push({ s, roll: now[1], cap: now[0], ratio, r });
  }
  const FY = [...fyears].sort();
  const fc = FY.map((y) => ({ y, roll: Math.round(sum(rows.map((x) => x.roll * (x.ratio && x.ratio[y] != null ? x.ratio[y] : 1)))), cap: sum(rows.map((x) => x.cap)) }));
  const last = fc[fc.length - 1] || null;
  return { hist, fc, rows, L, now: hist[hist.length - 1], last, spareNow: hist[hist.length - 1].cap - hist[hist.length - 1].roll, spareLast: last ? last.cap - last.roll : null };
}
/* first preferences per place: the last five intakes, carried forward three */
export function forecastDemand(schools, places, PRI) {
  const k = PRI ? "aP" : "aS", Y = places.appYears;
  const tot = Y.map((y) => { let pl = 0, f = 0; schools.forEach((s) => { const v = places.s[String(s.urn)] && places.s[String(s.urn)][k] && places.s[String(s.urn)][k][y]; if (v && v[0]) { pl += v[0]; f += v[2] || 0; } }); return { y, ratio: pl ? f / pl : null, first: f, places: pl }; });
  const last5 = tot.slice(-5).filter((t) => t.ratio != null);
  let slope = 0, icpt = last5.length ? last5[last5.length - 1].ratio : null;
  if (last5.length >= 3) {
    const xs = last5.map((_, i) => i), ys = last5.map((t) => t.ratio), mx = mean(xs), my = mean(ys);
    slope = sum(xs.map((x, i) => (x - mx) * (ys[i] - my))) / sum(xs.map((x) => (x - mx) ** 2));
    icpt = my + slope * (xs[xs.length - 1] - mx);
  }
  const lastY = Y[Y.length - 1];
  const nextY = (y, n) => String(+y.slice(0, 4) + n) + String(+y.slice(4) + n).padStart(2, "0");
  const proj = [1, 2, 3].map((n) => ({ y: nextY(lastY, n), ratio: icpt == null ? null : Math.max(0, icpt + slope * n) }));
  return { tot, proj, slope: r2(slope) };
}
/* results: each school's distance from its twins tends to persist, but only
   partly. The persistence (rho) is measured across England from the two most
   recent years; next year's projection is what the twins achieve plus rho
   times today's distance, with a band from the spread of what rho misses. */
const RHO = new WeakMap();
export function resultsModel(all, PRI, intake) {
  let byPh = RHO.get(all);
  if (!byPh) { byPh = {}; RHO.set(all, byPh); }
  const key = (PRI ? "P" : "S") + (intake ? "i" : "");
  if (byPh[key]) return byPh[key];
  const space = twinSpace(all, PRI, { intake });
  const cur = PRI ? "ks2_rwm_exp" : "attainment8", prev = PRI ? "ks2_rwm_prev" : "a8_prev";
  const per = new Map();
  const pairs = [];
  for (const p of space.pts) {
    const tw = nearest(space, p, 20);
    if (tw.length < 10) continue;
    const eNow = expectFrom(tw, cur), ePrev = expectFrom(tw, prev);
    const vNow = num(p.s[cur]), vPrev = num(p.s[prev]);
    if (eNow == null || vNow == null) continue;
    const resNow = vNow - eNow, resPrev = vPrev != null && ePrev != null ? vPrev - ePrev : null;
    per.set(String(p.s.urn), { eNow, resNow, resPrev, vNow, vPrev });
    if (resPrev != null) pairs.push([resPrev, resNow]);
  }
  const mx = mean(pairs.map((p) => p[0])), my = mean(pairs.map((p) => p[1]));
  const rho = sum(pairs.map(([a, b]) => (a - mx) * (b - my))) / sum(pairs.map(([a]) => (a - mx) ** 2));
  const resid = pairs.map(([a, b]) => b - (my + rho * (a - mx)));
  const sd = Math.sqrt(mean(resid.map((x) => x * x)));
  return (byPh[key] = { rho: r2(rho), sd: r1(sd), n: pairs.length, per, cur });
}
export function forecastResults(schools, all, PRI, intake) {
  const m = resultsModel(all, PRI, intake);
  const rows = schools.map((s) => {
    const p = m.per.get(String(s.urn));
    if (!p) return null;
    const next = p.eNow + m.rho * p.resNow;
    return { urn: s.urn, name: s.name, now: r1(p.vNow), prev: r1(p.vPrev), twins: r1(p.eNow), next: r1(next), lo: r1(next - 1.96 * m.sd), hi: r1(next + 1.96 * m.sd), drift: r1(next - p.vNow) };
  }).filter(Boolean);
  return { rho: m.rho, sd: m.sd, n: m.n, rows: rows.sort((a, b) => a.drift - b.drift), meanNow: r1(mean(rows.map((r) => r.now))), meanNext: r1(mean(rows.map((r) => r.next))), measure: PRI ? "RWM expected standard" : "Attainment 8" };
}

/* ── 2. falling rolls and places ──────────────────────────────────────── */
const km = (a, b) => { const R = 6371, t = Math.PI / 180, dLa = (b.lat - a.lat) * t, dLo = (b.lon - a.lon) * t; const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
/* params: { minPerYear, demandShift (0..1), close: [urn], year } */
export function placesSim(schools, places, PRI, params = {}) {
  const fr = forecastRolls(schools, places, PRI);
  const year = params.year && fr.fc.find((f) => f.y === params.year) ? params.year : fr.fc.length ? fr.fc[fr.fc.length - 1].y : null;
  const k = PRI ? "aP" : "aS", A = places.appYears, AL = A[A.length - 1], A5 = A[Math.max(0, A.length - 6)];
  const shift = params.demandShift == null ? 0.5 : params.demandShift;
  const yearsTo = year ? +year.slice(0, 4) - +fr.L.slice(0, 4) : 0;
  /* share of first preferences, its five-year trend carried forward and damped */
  let rows = fr.rows.map((x) => {
    const a = x.r[k] || {};
    const now = a[AL], then = a[A5];
    const trend = now && then && then[2] >= 20 ? (now[2] - then[2]) / then[2] / 5 : 0;
    const shareFactor = Math.max(0.5, Math.min(1.5, 1 + shift * trend * yearsTo));
    const areaRoll = x.roll * (x.ratio && year && x.ratio[year] != null ? x.ratio[year] : 1);
    return { urn: x.s.urn, name: x.s.name, la: x.s.la, sixth: /has a sixth form/i.test(x.s.sixth_form || ""), lat: num(x.s.latitude), lon: num(x.s.longitude), roll: x.roll, cap: x.cap, area: areaRoll, w: areaRoll * shareFactor, trend: r1(trend * 100), ratio: now && now[0] ? r2(now[2] / now[0]) : null };
  });
  /* keep the area's forecast total: a school gains only what another loses */
  const tArea = sum(rows.map((r) => r.area)), tW = sum(rows.map((r) => r.w)) || 1;
  rows.forEach((r) => { r.proj = Math.round((r.w * tArea) / tW); });
  const years = PRI ? 7 : 5;
  const minPer = params.minPerYear || (PRI ? 30 : 120);
  rows.forEach((r) => { r.perYear = Math.round(r.proj / (!PRI && r.sixth ? 7 : years)); r.fill = r.cap ? r1((100 * r.proj) / r.cap) : null; r.risk = r.perYear < minPer || (r.fill != null && r.fill < 70); });
  /* closures: each closed school's projected pupils go to the nearest open schools with room */
  const closeSet = new Set((params.close || []).map(String));
  let moved = 0, kmSum = 0, unplaced = 0;
  const open = rows.filter((r) => !closeSet.has(String(r.urn)));
  open.forEach((r) => { r.recv = 0; });
  rows.filter((r) => closeSet.has(String(r.urn))).forEach((c) => {
    let left = c.proj;
    const near = open.filter((o) => o.lat != null && c.lat != null).map((o) => ({ o, d: km({ lat: c.lat, lon: c.lon }, { lat: o.lat, lon: o.lon }) })).sort((a, b) => a.d - b.d);
    for (const { o, d } of near) {
      if (left <= 0) break;
      const room = Math.max(0, o.cap - o.proj - o.recv);
      const take = Math.min(room, left);
      if (take > 0) { o.recv += take; left -= take; moved += take; kmSum += take * d; }
    }
    unplaced += left;
  });
  open.forEach((r) => { r.after = r.proj + (r.recv || 0); r.fillAfter = r.cap ? r1((100 * r.after) / r.cap) : null; });
  const capAll = sum(rows.map((r) => r.cap)), capOpen = sum(open.map((r) => r.cap)), projAll = sum(rows.map((r) => r.proj));
  return {
    year, minPer, shift, rows: rows.sort((a, b) => (a.fill ?? 999) - (b.fill ?? 999)),
    totals: { cap: capAll, roll: sum(rows.map((r) => r.roll)), proj: projAll, spare: capAll - projAll, sparePct: capAll ? r1((100 * (capAll - projAll)) / capAll) : null },
    atRisk: rows.filter((r) => r.risk).length,
    closure: closeSet.size ? { closed: closeSet.size, moved, unplaced, avgKm: moved ? r1(kmSum / moved) : null, capAfter: capOpen, spareAfter: capOpen - projAll, sparePctAfter: capOpen ? r1((100 * (capOpen - projAll)) / capOpen) : null } : null,
    fr,
  };
}

/* ── 3. funding and premiums ──────────────────────────────────────────── */
export const FUND_PRESETS = {
  inclusion: { label: "An Inclusion Premium", fsm: 1, senk: 1.5, ehcp: 4, eal: 0.3, idaci: 0 },
  disadvantage: { label: "A disadvantage uplift", fsm: 1, senk: 0, ehcp: 0, eal: 0, idaci: 0 },
  place: { label: "A deprivation (place) factor", fsm: 0, senk: 0, ehcp: 0, eal: 0, idaci: 1 },
};
const IDACI_W = { 1: 0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1 };
/* params: { potM (£ millions), neutral (bool), fsm, senk, ehcp, eal, idaci } */
export function fundingSim(schools, params, scopeSet) {
  const P = { potM: 100, neutral: false, ...FUND_PRESETS.inclusion, ...params };
  const rows = schools.map((s) => {
    const n = num(s.pupils);
    if (!n) return null;
    const pct = (v) => (num(v) == null ? 0 : num(v) / 100);
    const units = n * (P.fsm * pct(s.edu_fsm_pct ?? s.fsm_pct) + P.senk * pct(s.sen_support_pct) + P.ehcp * pct(s.sen_ehcp_pct) + P.eal * pct(s.eal_pct)) + n * P.idaci * (IDACI_W[num(s.idaci)] || 0) * 0.3;
    return { s, n, units, income: num(s.fin_income_pp) != null ? num(s.fin_income_pp) * n : null };
  }).filter(Boolean);
  const pot = P.potM * 1e6, U = sum(rows.map((r) => r.units)) || 1, N = sum(rows.map((r) => r.n)) || 1;
  const out = rows.map((r) => {
    const gain = (pot * r.units) / U;
    const slice = P.neutral ? (pot * r.n) / N : 0;
    const net = gain - slice;
    return { urn: r.s.urn, name: r.s.name, la: r.s.la, region: r.s.region, type: r.s.type, n: r.n, net: Math.round(net), pp: Math.round(net / r.n), pctIncome: r.income ? r1((100 * net) / r.income) : null,
      fsm: num(r.s.edu_fsm_pct), dis: num(r.s.a8_disadv) ?? num(r.s.ks2_rwm_disadv), ehcp: num(r.s.sen_ehcp_pct) };
  });
  const winners = out.filter((r) => r.net > 0), losers = out.filter((r) => r.net < 0);
  /* where the money lands: by FSM quintile and by region */
  const fsmSorted = out.filter((r) => r.fsm != null).sort((a, b) => a.fsm - b.fsm);
  const q = [0, 1, 2, 3, 4].map((i) => { const sl = fsmSorted.slice(Math.floor((i * fsmSorted.length) / 5), Math.floor(((i + 1) * fsmSorted.length) / 5)); return { q: i + 1, n: sl.length, pp: Math.round(sum(sl.map((r) => r.net)) / (sum(sl.map((r) => r.n)) || 1)), fsmLo: sl.length ? r1(sl[0].fsm) : null, fsmHi: sl.length ? r1(sl[sl.length - 1].fsm) : null }; });
  const regions = {};
  out.forEach((r) => { const g = (regions[r.region || "Unknown"] = regions[r.region || "Unknown"] || { name: r.region || "Unknown", net: 0, n: 0, schools: 0 }); g.net += r.net; g.n += r.n; g.schools++; });
  /* does the money reach the schools whose disadvantaged pupils do least well? */
  const disSorted = out.filter((r) => r.dis != null).sort((a, b) => a.dis - b.dis);
  const bottom = disSorted.slice(0, Math.floor(disSorted.length / 4));
  const toBottom = sum(bottom.map((r) => Math.max(0, r.net))), toAll = sum(disSorted.map((r) => Math.max(0, r.net))) || 1;
  /* the pot is national: an area sees its own share of it */
  const mine = scopeSet ? out.filter((r) => scopeSet.has(String(r.urn))) : null;
  const area = mine ? { n: mine.length, pupils: sum(mine.map((r) => r.n)), net: sum(mine.map((r) => r.net)), winners: mine.filter((r) => r.net > 0).length, losers: mine.filter((r) => r.net < 0).length } : null;
  if (area) area.pp = area.pupils ? Math.round(area.net / area.pupils) : null;
  return {
    P, PRI: !!params.PRI, n: out.length, pupils: N, pot, winners: winners.length, losers: losers.length, area, natPp: Math.round((P.neutral ? 0 : pot) / N),
    mine: mine ? mine.sort((a, b) => b.pp - a.pp) : null,
    rows: out.sort((a, b) => b.pp - a.pp), quintiles: q,
    regions: Object.values(regions).map((g) => ({ ...g, pp: Math.round(g.net / (g.n || 1)) })).sort((a, b) => b.pp - a.pp),
    bottomShare: r1((100 * toBottom) / toAll),
    median: out.length ? out.map((r) => r.pp).sort((a, b) => a - b)[out.length >> 1] : null,
  };
}

/* ── 4. accountability measures ───────────────────────────────────────── */
export const ACC_MEASURES = {
  S: [
    { k: "a8", label: "Attainment 8", get: (s) => num(s.attainment8) },
    { k: "b95", label: "Grade 5+ English and maths", get: (s) => num(s.basics_95) },
    { k: "dis", label: "Disadvantaged pupils' Attainment 8", get: (s) => num(s.a8_disadv) },
    { k: "odds", label: "Beating the odds (against twins)", get: (s, ctx) => (ctx.res ? ctx.res(s) : null) },
    { k: "att", label: "Attendance", get: (s) => (num(s.abs_overall_pct) == null ? null : -num(s.abs_overall_pct)) },
    { k: "incl", label: "Inclusion (EHC plan share)", get: (s) => num(s.sen_ehcp_pct) },
    { k: "dest", label: "Sustained destinations", get: (s) => num(s.dest_sustained) },
  ],
  P: [
    { k: "rwm", label: "RWM expected standard", get: (s) => num(s.ks2_rwm_exp) },
    { k: "high", label: "Higher standard", get: (s) => num(s.ks2_rwm_high) },
    { k: "dis", label: "Disadvantaged pupils, RWM", get: (s) => num(s.ks2_rwm_disadv) },
    { k: "odds", label: "Beating the odds (against twins)", get: (s, ctx) => (ctx.res ? ctx.res(s) : null) },
    { k: "att", label: "Attendance", get: (s) => (num(s.abs_overall_pct) == null ? null : -num(s.abs_overall_pct)) },
    { k: "incl", label: "Inclusion (EHC plan share)", get: (s) => num(s.sen_ehcp_pct) },
  ],
};
/* compare today's headline (one measure) with a proposed composite (weights) */
export function accountabilitySim(all, PRI, intake, weights, scopeSchools) {
  const est = (PRI ? primaries(all) : secondaries(all));
  const M = ACC_MEASURES[PRI ? "P" : "S"];
  const rm = resultsModel(all, PRI, intake);
  const ctx = { res: (s) => { const p = rm.per.get(String(s.urn)); return p ? p.resNow : null; } };
  const base = M[0];
  const vals = M.map((m) => est.map((s) => m.get(s, ctx)));
  const stats = vals.map((xs) => { const v = xs.filter((x) => x != null); const m = mean(v); const sd = Math.sqrt(mean(v.map((x) => (x - m) ** 2))) || 1; return { m, sd }; });
  const W = M.map((m) => Math.max(0, num(weights[m.k]) || 0));
  const Wt = sum(W) || 1;
  const rows = est.map((s, i) => {
    if (vals[0][i] == null) return null;
    let t = 0, w = 0;
    M.forEach((m, j) => { const v = vals[j][i]; if (v == null || !W[j]) return; t += W[j] * ((v - stats[j].m) / stats[j].sd); w += W[j]; });
    if (w < Wt * 0.6) return null;
    return { s, base: vals[0][i], comp: t / w };
  }).filter(Boolean);
  const byBase = [...rows].sort((a, b) => b.base - a.base), byComp = [...rows].sort((a, b) => b.comp - a.comp);
  byBase.forEach((r, i) => { r.rb = i + 1; });
  byComp.forEach((r, i) => { r.rc = i + 1; });
  const N = rows.length, dec = (rank) => Math.min(10, 1 + Math.floor(((rank - 1) * 10) / N));
  rows.forEach((r) => { r.move = r.rb - r.rc; r.db = dec(r.rb); r.dc = dec(r.rc); });
  const inScope = scopeSchools ? new Set(scopeSchools.map((s) => String(s.urn))) : null;
  const pick = inScope ? rows.filter((r) => inScope.has(String(r.s.urn))) : rows;
  /* who moves, by disadvantage */
  const fsm = rows.filter((r) => num(r.s.edu_fsm_pct) != null).sort((a, b) => a.s.edu_fsm_pct - b.s.edu_fsm_pct);
  const fq = [0, 1, 2, 3, 4].map((i) => { const sl = fsm.slice(Math.floor((i * fsm.length) / 5), Math.floor(((i + 1) * fsm.length) / 5)); return { q: i + 1, move: Math.round(mean(sl.map((r) => r.move)) || 0), inBottom10Base: sl.filter((r) => r.db === 10).length, inBottom10Comp: sl.filter((r) => r.dc === 10).length }; });
  const enter = rows.filter((r) => r.dc === 10 && r.db !== 10), leave = rows.filter((r) => r.db === 10 && r.dc !== 10);
  const mapRow = (r) => ({ urn: r.s.urn, name: r.s.name, la: r.s.la, rb: r.rb, rc: r.rc, move: r.move, base: r1(r.base), fsm: r1(num(r.s.edu_fsm_pct)) });
  return {
    N, base: base.label, weights: M.map((m, j) => ({ k: m.k, label: m.label, w: W[j] })),
    fq, enterN: enter.length, leaveN: leave.length,
    enter: enter.sort((a, b) => a.rc - b.rc).slice(-12).map(mapRow), leave: leave.sort((a, b) => a.rb - b.rb).slice(-12).map(mapRow),
    risers: [...pick].sort((a, b) => b.move - a.move).slice(0, 12).map(mapRow), fallers: [...pick].sort((a, b) => a.move - b.move).slice(0, 12).map(mapRow),
    scope: pick.map(mapRow).sort((a, b) => a.rc - b.rc),
    corr: r2(spearman(rows.map((r) => r.rb), rows.map((r) => r.rc))),
  };
}
function spearman(a, b) { const n = a.length; if (n < 3) return null; const d2 = sum(a.map((x, i) => (x - b[i]) ** 2)); return 1 - (6 * d2) / (n * (n * n - 1)); }

/* ── 5. SEND growth ───────────────────────────────────────────────────── */
/* params: { growth: "trend" | "half" | "flat" | number (% a year), shift (% of new specialist demand met in mainstream) } */
export function sendSim(send, params = {}, laFilter) {
  const shift = (num(params.shift) || 0) / 100;
  const rows = [];
  const yearsOf = (o) => Object.keys(o || {}).sort();
  for (const [la, d] of Object.entries(send.las)) {
    if (laFilter && !laFilter.has(la)) continue;
    const ys = yearsOf(d.ehcp);
    if (ys.length < 4 || !d.special) continue;
    const last = ys[ys.length - 1], base = ys[Math.max(0, ys.length - 6)];
    const nYears = +last.slice(0, 4) - +base.slice(0, 4);
    const cagr = d.ehcp[base] ? Math.pow(d.ehcp[last] / d.ehcp[base], 1 / nYears) - 1 : 0;
    const g = params.growth === "half" ? cagr / 2 : params.growth === "flat" ? 0 : typeof params.growth === "number" ? params.growth / 100 : cagr;
    const ehcp31 = Math.round(d.ehcp[last] * Math.pow(1 + g, 5));
    const [places, onRoll] = d.special;
    /* specialist demand grows with plans; the shift keeps a share of the growth in mainstream */
    const share = d.ehcp[last] ? onRoll / d.ehcp[last] : 0;
    const growthPupils = Math.max(0, ehcp31 - d.ehcp[last]) * share;
    const demand31 = Math.round(onRoll + growthPupils * (1 - shift));
    const fcYears = yearsOf(d.specFc).filter((y) => d.specFc[y][2] != null);
    const laFc = fcYears.length ? { y: fcYears[fcYears.length - 1], v: d.specFc[fcYears[fcYears.length - 1]][2] } : null;
    rows.push({ la, ehcp: ys.map((y) => ({ y, v: d.ehcp[y] })), now: d.ehcp[last], cagr: r1(cagr * 100), g: r1(g * 100), ehcp31, places, onRoll, over: onRoll - places, demand31, gap31: demand31 - places, laFc });
  }
  const nat = send.nat;
  const T = (k) => sum(rows.map((r) => r[k] || 0));
  return {
    rows: rows.sort((a, b) => b.gap31 - a.gap31), last: yearsOf(nat.ehcp).slice(-1)[0],
    totals: { now: T("now"), ehcp31: T("ehcp31"), places: T("places"), onRoll: T("onRoll"), demand31: T("demand31"), gap31: T("gap31") },
    natSeries: yearsOf(nat.ehcp).map((y) => ({ y, v: nat.ehcp[y] })), natFc: nat.specFc,
    shift: shift * 100, growth: params.growth || "trend",
  };
}
export { shortYL };
