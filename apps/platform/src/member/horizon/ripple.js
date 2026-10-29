/* The ripple: what a scenario does in the round. Every lever moves six
   dials (pupils, places, money, outcomes, inclusion, workforce) through
   named transmission mechanisms. Each mechanism is either read from the
   data the platform holds (income per pupil, pupil-teacher ratios, how
   results vary with EHC share once disadvantage is allowed for, where moved
   pupils would land) or an ASSUMPTION the user can see and move. Nothing
   travels silently. */
import { scopeSchools } from "./models.js";
import { primaries, secondaries } from "../prizm/engine.js";

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const wmean = (rows, f, w) => { let t = 0, ww = 0; rows.forEach((s) => { const v = f(s), x = w(s); if (v != null && x) { t += v * x; ww += x; } }); return ww ? t / ww : null; };
const mean = (xs) => (xs.length ? sum(xs) / xs.length : null);

/* the assumptions: every one shown, every one movable */
export const ASSUMPTIONS = [
  { k: "costSpecial", label: "A special school place, a year", unit: "£", def: 24000, step: 1000, min: 10000, max: 60000, note: "what a state special school place costs the public purse each year" },
  { k: "topUp", label: "An EHC plan supported in mainstream, a year", unit: "£", def: 10000, step: 500, min: 2000, max: 30000, note: "the high-needs top-up above the school's notional £6,000" },
  { k: "elasticity", label: "Outcomes from money", unit: "A8 pts per £1,000 a pupil", def: 0.4, step: 0.1, min: 0, max: 1.5, note: "how much Attainment 8 moves for each £1,000 a pupil sustained over years; set to 0 to assume none" },
  { k: "ehcCarry", label: "How much of the EHC association to carry", unit: "%", def: 50, step: 10, min: 0, max: 100, note: "across England, schools with more EHC plans post lower results once disadvantage is allowed for; how much of that to treat as cause" },
  { k: "teacherCost", label: "A teacher, a year", unit: "£", def: 62000, step: 1000, min: 40000, max: 90000, note: "pay and on-costs together" },
  { k: "taPerEhcp", label: "Support staff per extra EHC pupil in mainstream", unit: "FTE", def: 0.25, step: 0.05, min: 0, max: 1, note: "a quarter of a teaching assistant each, on average" },
  { k: "fixedShare", label: "A closed school's running costs that are saved", unit: "%", def: 20, step: 5, min: 0, max: 60, note: "premises, leadership and overheads; the rest follows the pupils" },
  { k: "floorCost", label: "Intervening in a school below the floor, a year", unit: "£", def: 150000, step: 25000, min: 0, max: 1000000, note: "RISE-style support and improvement capacity" },
];
export const defaultAssumptions = () => Object.fromEntries(ASSUMPTIONS.map((a) => [a.k, a.def]));

/* how results vary with EHC share once disadvantage is allowed for: an
   observed association across England, never a cause; computed once */
const EHC_SLOPE = new WeakMap();
function ehcSlope(all, PRI) {
  let m = EHC_SLOPE.get(all);
  if (!m) { m = {}; EHC_SLOPE.set(all, m); }
  const key = PRI ? "P" : "S";
  if (m[key] != null) return m[key];
  const est = (PRI ? primaries(all) : secondaries(all)).filter((s) => num(s[PRI ? "ks2_rwm_exp" : "attainment8"]) != null && num(s.sen_ehcp_pct) != null && num(s.edu_fsm_pct) != null);
  /* two-variable least squares: outcome on EHC share and FSM share */
  const y = est.map((s) => s[PRI ? "ks2_rwm_exp" : "attainment8"]), x1 = est.map((s) => s.sen_ehcp_pct), x2 = est.map((s) => s.edu_fsm_pct);
  const my = mean(y), m1 = mean(x1), m2 = mean(x2);
  let s11 = 0, s22 = 0, s12 = 0, s1y = 0, s2y = 0;
  for (let i = 0; i < y.length; i++) { const a = x1[i] - m1, b = x2[i] - m2, c = y[i] - my; s11 += a * a; s22 += b * b; s12 += a * b; s1y += a * c; s2y += b * c; }
  const det = s11 * s22 - s12 * s12;
  const b1 = det ? (s1y * s22 - s2y * s12) / det : 0;
  return (m[key] = { slope: Math.round(b1 * 100) / 100, n: y.length });
}

/* the scope today: the baseline every dial is measured from */
export function baseline(all, spec) {
  const PRI = (spec.scope && spec.scope.phase) === "primary";
  const schools = scopeSchools(all, spec.scope || { type: "england" });
  const P = sum(schools.map((s) => num(s.pupils) || 0));
  const income = wmean(schools, (s) => num(s.fin_income_pp), (s) => num(s.pupils));
  const ptr = wmean(schools, (s) => num(s.wf_ptr), (s) => num(s.pupils));
  const teachers = sum(schools.map((s) => num(s.wf_teachers_fte) || (num(s.pupils) && ptr ? s.pupils / ptr : 0)));
  const key = PRI ? "ks2_rwm_exp" : "attainment8", dkey = PRI ? "ks2_rwm_disadv" : "a8_disadv";
  return {
    PRI, schools, n: schools.length, pupils: P,
    incomePP: income, spendPP: wmean(schools, (s) => num(s.fin_spend_pp), (s) => num(s.pupils)), ptr, teachers: Math.round(teachers),
    outcome: r1(mean(schools.map((s) => num(s[key])).filter((v) => v != null))), disadv: r1(mean(schools.map((s) => num(s[dkey])).filter((v) => v != null))),
    ehcShare: r1(wmean(schools, (s) => num(s.sen_ehcp_pct), (s) => num(s.pupils))),
    measure: PRI ? "RWM expected standard" : "Attainment 8", unit: PRI ? "%" : "",
    ehc: ehcSlope(all, PRI),
  };
}

const gbp = (v) => { const a = Math.abs(v), s = v < 0 ? "−" : ""; return a >= 1e9 ? `${s}£${(a / 1e9).toFixed(2)}bn` : a >= 1e6 ? `${s}£${Math.round(a / 1e6)}m` : `${s}£${Math.round(a / 1e3)}k`; };
const dial = (k, label, now, after, opts = {}) => ({ k, label, now, after, delta: now != null && after != null ? after - now : null, ...opts });

/* the ripple for a run scenario: six dials and the chain that moved them */
export function ripple(spec, run, D, A) {
  const B = baseline(D.all, spec);
  const F = run.findings || {};
  const money = (v) => ({ money: true, v });
  const dials = [], chain = [];
  const none = (k, label, now, fmt) => dial(k, label, now, now, { fmt, note: "not moved by this lever" });
  const incomeOf = (dp) => (dp == null ? B.incomePP : dp);

  if (spec.lever === "send" && F.totals) {
    const T = F.totals;
    const growth = T.ehcp31 - T.now;
    const specialistGrowth = T.demand31 - T.onRoll;
    const mainstreamNewAll = Math.max(0, growth - specialistGrowth);
    /* plans cover every age; this phase takes its share of the school-age pupils in these authorities */
    const las = spec.scope && spec.scope.type !== "england" ? new Set(B.schools.map((s) => s.la).filter(Boolean)) : null;
    const allP = sum(D.all.filter((s) => (!las || las.has(s.la)) && /primary|secondary|all-through|middle/i.test(s.phase || "") && num(s.pupils)).map((s) => s.pupils));
    const phaseShare = allP ? Math.min(1, B.pupils / allP) : 0.5;
    const mainstreamNew = Math.round(mainstreamNewAll * phaseShare);
    const newSpecialPlaces = Math.max(0, T.gap31);
    const costSpecial = newSpecialPlaces * A.costSpecial, costTopUp = mainstreamNewAll * A.topUp;
    /* the scope's mainstream pupils, and how its EHC share moves */
    const shareNow = B.ehcShare, shareAfter = B.pupils ? r1(((shareNow / 100) * B.pupils + mainstreamNew * (B.pupils / Math.max(B.pupils, 1))) / B.pupils * 100) : null;
    const deltaShare = shareAfter != null && shareNow != null ? shareAfter - shareNow : null;
    const dOut = deltaShare != null ? r1(B.ehc.slope * (A.ehcCarry / 100) * deltaShare) : null;
    const tas = Math.round(mainstreamNew * A.taPerEhcp);
    dials.push(dial("pupils", "Pupils", B.pupils, B.pupils, { note: "EHC plans change who needs what, not how many pupils there are" }));
    dials.push(dial("places", "Specialist places short", 0, newSpecialPlaces, { lower: true, note: `by 2031 against ${T.places.toLocaleString("en-GB")} special school places` }));
    dials.push(dial("money", "High-needs cost, a year by 2031", 0, costSpecial + costTopUp, { ...money(), lower: true, note: `${newSpecialPlaces.toLocaleString("en-GB")} special places at £${A.costSpecial.toLocaleString("en-GB")} + ${mainstreamNewAll.toLocaleString("en-GB")} mainstream plans at £${A.topUp.toLocaleString("en-GB")}` }));
    dials.push(dial("outcomes", B.measure, B.outcome, dOut != null ? r1(B.outcome + dOut) : null, { dp: 1, unit: B.unit, note: `EHC share in mainstream ${shareNow}% to ${shareAfter}%; the observed association is ${B.ehc.slope} per point across ${B.ehc.n.toLocaleString("en-GB")} schools, carried at ${A.ehcCarry}%` }));
    dials.push(dial("inclusion", "EHC plans in mainstream", shareNow, shareAfter, { dp: 1, unit: "%", higherIsGood: true, note: "share of pupils in the scope's mainstream schools with a plan" }));
    dials.push(dial("workforce", "Support staff needed", 0, tas, { unit: " FTE", note: `${A.taPerEhcp} FTE for each of the ${mainstreamNew.toLocaleString("en-GB")} extra plans in this phase's mainstream (assumption)` }));
    chain.push({ from: "EHC plans", to: `+${growth.toLocaleString("en-GB")} by 2031`, how: F.growthAssumption === "trend" ? "each authority's five-year trend" : `growth ${F.growthAssumption}` });
    chain.push({ from: "Plans", to: `${mainstreamNewAll.toLocaleString("en-GB")} more in mainstream, ${specialistGrowth.toLocaleString("en-GB")} more in special`, how: `${F.pctNewSpecialistDemandMetInMainstream}% of new specialist demand kept in mainstream` });
    chain.push({ from: "Special", to: `${newSpecialPlaces.toLocaleString("en-GB")} places short`, how: "against today's special school capacity" });
    chain.push({ from: "Money", to: `${gbp(costSpecial + costTopUp)} a year`, how: "places and top-ups, at the assumed costs" });
    chain.push({ from: "Mainstream", to: `${B.measure} ${dOut >= 0 ? "+" : ""}${dOut}`, how: `${mainstreamNew.toLocaleString("en-GB")} land in this phase; ${A.ehcCarry}% of the observed association` });
    chain.push({ from: "Staff", to: `${tas.toLocaleString("en-GB")} FTE`, how: "support staff per extra plan (assumption)" });
  } else if (spec.lever === "rolls" && F.totals) {
    const T = F.totals, C = F.closures;
    const dP = T.proj - T.roll;
    const lostIncome = dP * incomeOf(null);
    /* closures: the saved fixed costs, and where the moved pupils land */
    let saved = 0, dOutMoved = null, movedP = 0;
    const closed = (run.closable || []).filter((r) => (run.closedUrns || []).includes(String(r.urn)));
    if (C && closed.length) {
      const byUrn = new Map(B.schools.map((s) => [String(s.urn), s]));
      const cs = closed.map((r) => byUrn.get(String(r.urn))).filter(Boolean);
      saved = sum(cs.map((s) => (num(s.fin_spend_pp) || B.spendPP || 0) * (num(s.pupils) || 0))) * (A.fixedShare / 100);
      movedP = C.moved;
      const key = B.PRI ? "ks2_rwm_exp" : "attainment8";
      const closedOut = wmean(cs, (s) => num(s[key]), (s) => num(s.pupils));
      const open = B.schools.filter((s) => !closed.some((r) => String(r.urn) === String(s.urn)));
      const recvOut = wmean(open, (s) => num(s[key]), (s) => Math.max(0, (num(s.capacity) || num(s.pupils) || 0) - (num(s.pupils) || 0)));
      if (closedOut != null && recvOut != null) dOutMoved = r1(recvOut - closedOut);
    }
    const teachersNow = B.teachers, teachersAfter = B.ptr ? Math.round(B.teachers + dP / B.ptr) : null;
    const scopeOut = dOutMoved != null && B.pupils ? r1(B.outcome + (dOutMoved * movedP) / B.pupils) : B.outcome;
    dials.push(dial("pupils", "Pupils", T.roll, T.proj, { note: `on the planning areas' forecasts to ${F.year}` }));
    dials.push(dial("places", "Places spare", r1((100 * (T.cap - T.roll)) / T.cap), C ? C.sparePctAfter : T.sparePct, { dp: 1, unit: "%", lower: true, note: C ? `after closing ${C.closed}` : "capacity held at today's" }));
    dials.push(dial("money", "Income, a year", 0, lostIncome + saved, { ...money(), note: `${dP.toLocaleString("en-GB")} pupils at £${Math.round(incomeOf(null)).toLocaleString("en-GB")} each${saved ? `, ${A.fixedShare}% of closed schools' costs saved` : ""}` }));
    dials.push(dial("outcomes", B.measure, B.outcome, scopeOut, { dp: 1, unit: B.unit, note: dOutMoved != null ? `moved pupils land in schools averaging ${dOutMoved >= 0 ? "+" : ""}${dOutMoved} against the ones that closed` : "no pupils move, so nothing changes here" }));
    dials.push(dial("inclusion", "EHC plans in mainstream", B.ehcShare, B.ehcShare, { dp: 1, unit: "%", note: "not moved by this lever" }));
    dials.push(dial("workforce", "Teachers (FTE)", teachersNow, teachersAfter, { note: `pupils ÷ the scope's pupil-teacher ratio of ${r1(B.ptr)}` }));
    chain.push({ from: "Rolls", to: `${dP >= 0 ? "+" : ""}${dP.toLocaleString("en-GB")} pupils by ${F.year}`, how: "the planning areas' forecasts" });
    chain.push({ from: "Pupils", to: `${gbp(lostIncome)} a year`, how: `income follows pupils at £${Math.round(incomeOf(null)).toLocaleString("en-GB")} each` });
    chain.push({ from: "Pupils", to: `${teachersAfter != null ? (teachersAfter - teachersNow).toLocaleString("en-GB") : "–"} teacher posts`, how: "at today's pupil-teacher ratio" });
    if (C) { chain.push({ from: "Closures", to: `${movedP.toLocaleString("en-GB")} pupils move ${C.avgKm} km`, how: "to the nearest schools with room" }); chain.push({ from: "Moved", to: `${B.measure} ${dOutMoved >= 0 ? "+" : ""}${dOutMoved} for them`, how: "the receiving schools' results against the closed schools'" }); chain.push({ from: "Closures", to: `${gbp(saved)} saved a year`, how: `${A.fixedShare}% of running costs (assumption)` }); }
  } else if (spec.lever === "funding" && F.perPupilByFsmFifth) {
    const pp = F.area ? F.area.pp : (F.budgetNeutral ? 0 : Math.round((F.potMillions * 1e6) / Math.max(1, B.pupils)));
    const net = F.area ? F.area.net : (F.budgetNeutral ? 0 : F.potMillions * 1e6);
    const q = F.perPupilByFsmFifth;
    const dOut = r1((A.elasticity * pp) / 1000);
    const dGap = Math.round((A.elasticity * (q[4].perPupil - q[0].perPupil)) / 10) / 100;
    const teachers = Math.round(net / A.teacherCost);
    dials.push(none("pupils", "Pupils", B.pupils));
    dials.push(none("places", "Places spare", null));
    dials.push(dial("money", F.area ? `${F.scope}, a year` : "England, a year", 0, net, { ...money(), note: `${F.budgetNeutral ? "budget-neutral: the pot is top-sliced from every school" : "new money"}; £${pp.toLocaleString("en-GB")} a pupil on average` }));
    dials.push(dial("outcomes", B.measure, B.outcome, r1(B.outcome + dOut), { dp: 1, unit: B.unit, note: `${A.elasticity} points per £1,000 a pupil sustained (assumption); the disadvantage gap narrows ${dGap} as the most disadvantaged fifth gain £${q[4].perPupil} to the least's £${q[0].perPupil}` }));
    dials.push(dial("inclusion", "EHC plans in mainstream", B.ehcShare, B.ehcShare, { dp: 1, unit: "%", note: "not moved by this lever" }));
    dials.push(dial("workforce", "Teachers affordable", 0, teachers, { note: `at £${A.teacherCost.toLocaleString("en-GB")} a teacher (assumption)` }));
    chain.push({ from: "The pot", to: `£${pp.toLocaleString("en-GB")} a pupil`, how: F.budgetNeutral ? "top-sliced and reshared by the weights" : "shared by the weights" });
    chain.push({ from: "Money", to: `${B.measure} ${dOut >= 0 ? "+" : ""}${dOut}`, how: `${A.elasticity} per £1,000 a pupil (assumption)` });
    chain.push({ from: "Weights", to: `gap narrows ${dGap}`, how: "the most disadvantaged fifth gain most" });
    chain.push({ from: "Money", to: `${teachers.toLocaleString("en-GB")} teachers`, how: "if spent on staff, at the assumed cost" });
  } else if (spec.lever === "acc" && F.rankChangeByFsmFifth) {
    const named = F.newlyInBottomTenth || 0;
    dials.push(none("pupils", "Pupils", B.pupils));
    dials.push(none("places", "Places spare", null));
    dials.push(dial("money", "Intervention, a year", 0, named * A.floorCost, { ...money(), lower: true, note: `${named} schools newly below the floor at £${A.floorCost.toLocaleString("en-GB")} each (assumption)` }));
    dials.push(dial("outcomes", B.measure, B.outcome, B.outcome, { dp: 1, unit: B.unit, note: "a measure changes who is judged, not what pupils achieve; Horizon claims no effect" }));
    dials.push(dial("inclusion", "Schools newly below the floor", 0, named, { lower: true, note: `${F.leavingBottomTenth || 0} leave it; rank correlation ${F.rankCorrelation} with today's` }));
    dials.push(none("workforce", "Teachers (FTE)", B.teachers));
    chain.push({ from: "The measure", to: `${named} newly in the bottom tenth`, how: "re-ranked by the weights" });
    chain.push({ from: "Floor", to: `${gbp(named * A.floorCost)} a year`, how: "intervention per school (assumption)" });
    chain.push({ from: "Outcomes", to: "no change claimed", how: "incentives are not modelled" });
  } else if (spec.lever === "forecast" && F.rolls) {
    const now = F.rolls.now, h = F.rolls.horizon;
    const dP = h ? h.roll - now.roll : 0;
    const res = F.results && typeof F.results === "object" ? F.results : null;
    dials.push(dial("pupils", "Pupils", now.roll, h ? h.roll : null, { note: "on the planning areas' forecasts" }));
    dials.push(dial("places", "Places spare", r1((100 * F.rolls.spareNow) / now.cap), h ? r1((100 * F.rolls.spareAtHorizon) / h.cap) : null, { dp: 1, unit: "%", lower: true, note: "capacity held at today's" }));
    dials.push(dial("money", "Income, a year", 0, dP * incomeOf(null), { ...money(), note: `${dP.toLocaleString("en-GB")} pupils at £${Math.round(incomeOf(null)).toLocaleString("en-GB")} each` }));
    dials.push(dial("outcomes", res ? res.measure : B.measure, res ? res.meanNow : B.outcome, res ? res.meanNext : null, { dp: 1, unit: B.unit, note: res ? `one year on, holding ${Math.round(res.persistence * 100)}% of each school's distance from its twins` : "still computing" }));
    dials.push(dial("inclusion", "EHC plans in mainstream", B.ehcShare, B.ehcShare, { dp: 1, unit: "%", note: "see the SEND lever for where this goes" }));
    dials.push(dial("workforce", "Teachers (FTE)", B.teachers, B.ptr ? Math.round(B.teachers + dP / B.ptr) : null, { note: `at the scope's pupil-teacher ratio of ${r1(B.ptr)}` }));
    chain.push({ from: "Rolls", to: `${dP >= 0 ? "+" : ""}${dP.toLocaleString("en-GB")} pupils`, how: "the planning areas' forecasts" });
    chain.push({ from: "Pupils", to: `${gbp(dP * incomeOf(null))} a year`, how: "income follows pupils" });
    chain.push({ from: "Pupils", to: `${B.ptr ? Math.round(dP / B.ptr).toLocaleString("en-GB") : "–"} teacher posts`, how: "at today's pupil-teacher ratio" });
    if (res) chain.push({ from: "Results", to: `${res.meanNow} to ${res.meanNext}`, how: "distance from twins, partly held" });
  }
  return { dials, chain, baseline: B };
}
