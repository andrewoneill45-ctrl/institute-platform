/* Forecast: the arithmetic. Every school's ledger through time, its unit
   costs against the schools most like it, and the years ahead under the
   roll forecast and the assumptions a leader can move. Nothing here is
   typed; everything is computed from the DfE's returns. */

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const median = (xs) => { const v = xs.filter((x) => x != null).sort((a, b) => a - b); return v.length ? (v.length % 2 ? v[v.length >> 1] : (v[(v.length >> 1) - 1] + v[v.length >> 1]) / 2) : null; };
const pctile = (xs, v) => { const s = xs.filter((x) => x != null).sort((a, b) => a - b); if (!s.length || v == null) return null; let i = 0; while (i < s.length && s[i] < v) i++; return Math.round((100 * i) / s.length); };
export const YL = (tp) => tp.slice(0, 4) + "/" + tp.slice(4);
export const shortYL = (tp) => tp.slice(2, 4) + "/" + tp.slice(4);
export const nextY = (y, n) => String(+y.slice(0, 4) + n) + String(+y.slice(4) + n).padStart(2, "0");
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);

/* the lines of the ledger a leader can act on, with what each contains */
export const LINES = [
  { k: "teach", label: "Teaching staff", fixed: 0.15, how: "Teachers' pay and on-costs. Moves with the roll only when the timetable and staffing are reshaped." },
  { k: "supply", label: "Supply staff", fixed: 0, how: "Supply teachers, agency staff and supply insurance." },
  { k: "edsup", label: "Education support staff", fixed: 0.2, how: "Teaching assistants and other support staff." },
  { k: "admin", label: "Administration", fixed: 0.8, how: "Administrative and clerical staff. Mostly fixed: a school needs an office whatever its roll." },
  { k: "prem", label: "Premises", fixed: 0.9, how: "Premises staff, maintenance, cleaning and caretaking. Almost entirely fixed to the building." },
  { k: "energy", label: "Energy", fixed: 0.9, how: "Gas and electricity. Fixed to the building, not the roll." },
  { k: "cater", label: "Catering", fixed: 0.3, how: "Catering staff and supplies, net of the income they bring in where the return nets it." },
  { k: "edsupplies", label: "Educational supplies", fixed: 0.2, how: "Learning resources, ICT learning resources and exam fees." },
  { k: "prof", label: "Bought-in services", fixed: 0.5, how: "Professional services bought in, curriculum and other." },
];
export const DEFAULTS = { pay: 3.5, infl: 2.5, fund: 3.0, horizonYears: 6, rollMode: "forecast", rollPct: -2.0, teacherCost: 62000, leadTime: 2 };
export const ASSUMPTIONS = [
  { k: "pay", label: "Pay awards, a year", unit: "%", min: 0, max: 8, step: 0.5, note: "teachers' and support staff pay, on-costs included" },
  { k: "fund", label: "Funding per pupil, a year", unit: "%", min: -3, max: 8, step: 0.5, note: "the change in income for each pupil on roll" },
  { k: "infl", label: "Non-staff costs, a year", unit: "%", min: 0, max: 10, step: 0.5, note: "premises, energy, supplies and services" },
  { k: "teacherCost", label: "A teacher, a year", unit: "£", min: 40000, max: 90000, step: 1000, note: "pay and on-costs, for turning a gap into posts" },
  { k: "leadTime", label: "Years a staffing decision takes to land", unit: "", min: 1, max: 3, step: 1, note: "consultation, notice and the September it takes effect" },
];

/* ── reading the ledger ─────────────────────────────────────────────── */
export function ledgerOf(F, urn) {
  const s = F.s[String(urn)];
  if (!s) return null;
  const fi = Object.fromEntries(F.fields.map((k, i) => [k, i]));
  const years = Object.keys(s.y).sort();
  const rows = years.map((y) => {
    const r = s.y[y];
    const g = (k) => num(r[fi[k]]);
    const pupils = g("pupils");
    const pp = (k) => (pupils && g(k) != null ? Math.round((1000 * g(k)) / pupils) : null);
    return { y, src: r[fi.src], pupils, teachers: g("teachers"), fsm: g("fsm"), p16: g("p16"),
      inc: g("inc"), exp: g("exp"), bal: g("bal"), res: g("res"), staff: g("staff"), grant: g("grant"), self: g("self"),
      lines: Object.fromEntries(LINES.map((l) => [l.k, g(l.k)])),
      incPP: pp("inc"), expPP: pp("exp"), resPP: pp("res"), linesPP: Object.fromEntries(LINES.map((l) => [l.k, pp(l.k)])), staffPP: pp("staff") };
  }).filter((r) => r.inc > 0 && r.exp > 0 && r.pupils && r.exp > 0.2 * r.inc && r.inc > 0.2 * r.exp);
  if (!rows.length) return null;
  const last = rows[rows.length - 1];
  return { urn: String(urn), name: s.m.n, phase: s.m.ph, rows, last, first: rows[0], years: rows.map((r) => r.y) };
}

/* ── the schools most like this one, for one year ───────────────────── */
/* same phase, same sector (academy or maintained), London or not, a roll
   within range and free school meals within reach; the net loosens until
   there are enough to compare with honestly */
const PEERS = new Map();
export function peersOf(F, all, urn, year) {
  const key = `${urn}:${year}`;
  if (PEERS.has(key)) return PEERS.get(key);
  const me = ledgerOf(F, urn);
  const core = all.find((x) => String(x.urn) === String(urn));
  const mine = me && me.rows.find((r) => r.y === year);
  if (!me || !mine || !core) return null;
  const fi = Object.fromEntries(F.fields.map((k, i) => [k, i]));
  const london = (core.region || "") === "London";
  const phase = (core.phase || me.phase || "").toLowerCase();
  const byUrn = new Map(all.map((x) => [String(x.urn), x]));
  const cand = [];
  for (const [u, s] of Object.entries(F.s)) {
    if (u === String(urn)) continue;
    const r = s.y[year]; if (!r) continue;
    const c = byUrn.get(u); if (!c) continue;
    if (/independent/i.test(c.type || "")) continue;
    if ((c.phase || s.m.ph || "").toLowerCase() !== phase) continue;
    if (r[fi.src] !== mine.src) continue;
    const pupils = num(r[fi.pupils]); if (!pupils || pupils < 20) continue;
    const inc = num(r[fi.inc]), exp = num(r[fi.exp]); if (inc == null || exp == null) continue;
    cand.push({ u, c, r, pupils, fsm: num(r[fi.fsm]), london: (c.region || "") === "London" });
  }
  const steps = [[0.35, 8], [0.5, 12], [0.75, 18], [1.2, 30]];
  let set = [];
  for (const [rollTol, fsmTol] of steps) {
    set = cand.filter((p) => p.london === london && Math.abs(p.pupils - mine.pupils) <= rollTol * mine.pupils && (mine.fsm == null || p.fsm == null || Math.abs(p.fsm - mine.fsm) <= fsmTol));
    if (set.length >= 40) break;
  }
  if (set.length < 15) set = cand.filter((p) => Math.abs(p.pupils - mine.pupils) <= 1.5 * mine.pupils);
  const pp = (r, k) => { const p = num(r[fi.pupils]); const v = num(r[fi[k]]); return p && v != null ? (1000 * v) / p : null; };
  const bench = {};
  for (const k of ["inc", "exp", "res", "staff", ...LINES.map((l) => l.k)]) {
    const xs = set.map((p) => pp(p.r, k)).filter((x) => x != null);
    bench[k] = { med: median(xs), q1: median(xs.filter((x) => x <= median(xs))), q3: median(xs.filter((x) => x >= median(xs))), xs, pct: pctile(xs, mine.src ? (k === "inc" ? mine.incPP : k === "exp" ? mine.expPP : k === "res" ? mine.resPP : k === "staff" ? mine.staffPP : mine.linesPP[k]) : null) };
  }
  const deficitShare = set.length ? Math.round((100 * set.filter((p) => num(p.r[fi.res]) != null && p.r[fi.res] < 0).length) / set.length) : null;
  /* the workforce of the comparators: pupils per teacher, pay, the loaded cost of a teacher, support staff per hundred pupils */
  const wf = {
    ptr: median(set.map((p) => num(p.c.wf_ptr))),
    pay: median(set.map((p) => num(p.c.wf_pay_mean))),
    costPerTeacher: median(set.map((p) => { const t = num(p.r[fi.teachers]), v = num(p.r[fi.teach]); return t && v != null ? (1000 * v) / t : null; })),
    supportPer100: median(set.map((p) => { const t = num(p.c.wf_teachers_fte), w = num(p.c.wf_workforce_fte), pu = num(p.c.pupils); return t != null && w != null && pu ? (100 * (w - t)) / pu : null; })),
    leadership: median(set.map((p) => num(p.c.wf_leadership_pct))),
    staffShare: median(set.map((p) => { const st = num(p.r[fi.staff]), ex = num(p.r[fi.exp]); return st != null && ex ? (100 * st) / ex : null; })),
    ptrs: set.map((p) => num(p.c.wf_ptr)).filter((x) => x != null),
  };
  const out = { n: set.length, year, london, phase, sector: mine.src === "A" ? "academies" : "maintained schools", bench, wf, deficitShare, rule: `${phase || "schools"} in the same sector, ${london ? "in London" : "outside London"}, with a roll and free school meals near this school's` };
  PEERS.set(key, out);
  return out;
}

/* ── staff, the driver ──────────────────────────────────────────────── */
/* the workforce census joined to the finance return: how many, at what
   cost, against the schools most like this one */
export function staffing(me, core, peers) {
  if (!me || !core) return null;
  const L = me.last;
  const teachers = num(core.wf_teachers_fte) ?? L.teachers;
  const workforce = num(core.wf_workforce_fte);
  const support = teachers != null && workforce != null ? Math.max(0, workforce - teachers) : null;
  const ptr = num(core.wf_ptr) ?? (teachers ? r1(L.pupils / teachers) : null);
  const costPerTeacher = L.teachers && L.lines.teach != null ? Math.round((1000 * L.lines.teach) / L.teachers) : null;
  const costPerSupport = support && L.lines.edsup != null ? Math.round((1000 * L.lines.edsup) / support) : null;
  const staffShare = L.staff != null && L.exp ? r1((100 * L.staff) / L.exp) : null;
  const W = peers && peers.wf;
  const atPeersPtr = W && W.ptr && teachers != null ? r1(L.pupils / W.ptr) : null;
  const scissors = me.rows.map((r) => ({ y: r.y, staffPP: r.staffPP, incPP: r.incPP, teachers: r.teachers, pupils: r.pupils, ptr: r.teachers ? r1(r.pupils / r.teachers) : null }));
  return { teachers, workforce, support, ptr, costPerTeacher, costPerSupport, staffShare, pay: num(core.wf_pay_mean), leadership: num(core.wf_leadership_pct), turnover: num(core.wf_turnover_pct), vacancies: num(core.wf_vac_rate), sick: num(core.wf_sick_days),
    supportPer100: support != null && L.pupils ? r1((100 * support) / L.pupils) : null, peers: W, atPeersPtr, teachersOverPeers: atPeersPtr != null && teachers != null ? r1(teachers - atPeersPtr) : null, scissors };
}

/* ── where the money could go further ───────────────────────────────── */
export function savings(me, peers) {
  if (!me || !peers) return [];
  const r = me.last;
  return LINES.map((l) => {
    const mine = r.linesPP[l.k], med = peers.bench[l.k] && peers.bench[l.k].med, q1 = peers.bench[l.k] && peers.bench[l.k].q1;
    if (mine == null || med == null) return null;
    const gapPP = mine - med, gap = Math.round((gapPP * r.pupils) / 1000);          /* £k against the median */
    const gapQ1 = q1 != null ? Math.round(((mine - q1) * r.pupils) / 1000) : null;   /* £k against the leaner quarter */
    return { k: l.k, label: l.label, how: l.how, mine: Math.round(mine), med: Math.round(med), q1: q1 != null ? Math.round(q1) : null, pct: peers.bench[l.k].pct, gapPP: Math.round(gapPP), gap, gapQ1, fixed: l.fixed };
  }).filter(Boolean).sort((a, b) => b.gap - a.gap);
}

/* ── the roll path: the planning area's forecast, carried per school ─── */
function paRatios(places, urn) {
  const r = places && places.s && places.s[String(urn)];
  const a = r && r.pa && places.pa && places.pa[r.pa];
  if (!a || !a.f) return null;
  const ys = Object.keys(a.f).sort();
  const base = a.f[ys[0]] && a.f[ys[0]][0];
  if (!base) return null;
  return { years: ys, ratio: Object.fromEntries(ys.map((y) => [y, a.f[y][0] / base])), area: a.n };
}
export function rollPath(me, places, A, extra) {
  const y0 = me.last.y, p0 = me.last.pupils;
  const H = A.horizonYears || 6;
  const pa = paRatios(places, me.urn);
  const out = [];
  /* own trend: the compound change over the last three returns */
  const hist = me.rows.slice(-4);
  /* a school that opened or filled up recently has a trend that cannot continue: hold any trend to ±8% a year */
  const own = Math.max(-0.08, Math.min(0.08, hist.length >= 2 && hist[0].pupils > 0 ? Math.pow(hist[hist.length - 1].pupils / hist[0].pupils, 1 / (hist.length - 1)) - 1 : 0));
  for (let t = 1; t <= H; t++) {
    const y = nextY(y0, t);
    let f = 1;
    if (A.rollMode === "forecast" && pa) {
      /* the area's forecast ratios are indexed from its own first year; map by calendar year, holding the last */
      const ys = pa.years, last = ys[ys.length - 1];
      const key = ys.includes(y) ? y : y > last ? last : ys[0];
      const base = ys.includes(y0) ? y0 : ys[0];
      f = pa.ratio[base] > 0 ? pa.ratio[key] / pa.ratio[base] : 1;
      /* a planning area's forecast is for the area, not the school: clamp anything implausible for one school */
      if (!Number.isFinite(f) || f <= 0) f = 1;
      f = Math.max(0.6, Math.min(1.3, f));
    } else if (A.rollMode === "own") f = Math.pow(1 + own, t);
    else if (A.rollMode === "flat") f = 1;
    else if (A.rollMode === "custom") f = Math.pow(1 + (A.rollPct || 0) / 100, t);
    else if (A.rollMode === "forecast") f = Math.pow(1 + own, t);
    if (!Number.isFinite(f) || f <= 0) f = 1;
    f = Math.max(0.6, Math.min(1.3, f));
    out.push({ y, pupils: Math.round(p0 * f), t });
  }
  return { path: out, area: pa && pa.area, ownRate: r1(own * 100), source: A.rollMode === "forecast" ? (pa ? "the planning area's forecast" : "the school's own trend (no planning-area forecast)") : A.rollMode === "own" ? "the school's own trend" : A.rollMode === "flat" ? "a flat roll" : `${A.rollPct}% a year` };
}

/* ── the years ahead ─────────────────────────────────────────────────── */
/* Two futures from one ledger. "Hold": staffing stays as it is, costs rise
   with pay and prices, income follows the roll. "Follow": the variable part
   of each line moves with the roll, after the lead time a decision takes.
   The reserve is carried forward either way; the cliff is the year it is gone. */
export const PLAN0 = { dTeachers: 0, dSupport: 0, ptrTarget: null };
export function project(me, places, A, plan = PLAN0, st = null) {
  const L = me.last, roll = rollPath(me, places, A);
  const hasPlan = plan && (plan.dTeachers || plan.dSupport || plan.ptrTarget);
  const T0 = (st && st.teachers) || L.teachers || null, S0 = st && st.support ? st.support : null;
  const lines = LINES.map((l) => ({ ...l, v: L.lines[l.k] != null ? L.lines[l.k] : 0 }));
  const known = lines.reduce((a, l) => a + l.v, 0);
  const other = Math.max(0, L.exp - known);                 /* everything the nine lines do not cover */
  const staffLike = (k) => ["teach", "supply", "edsup", "admin"].includes(k);
  const yrs = [{ y: L.y, t: 0, pupils: L.pupils, inc: L.inc, hold: L.exp, follow: L.exp, plan: L.exp, balHold: L.bal, balFollow: L.bal, balPlan: L.bal, resHold: L.res, resFollow: L.res, resPlan: L.res, teachersHold: L.teachers, teachersFollow: L.teachers, teachersPlan: T0 }];
  let resH = L.res, resF = L.res, resP = L.res;
  for (const p of roll.path) {
    const g = p.pupils / L.pupils;
    const payF = Math.pow(1 + A.pay / 100, p.t), inflF = Math.pow(1 + A.infl / 100, p.t), fundF = Math.pow(1 + A.fund / 100, p.t);
    const inc = Math.round(L.inc * g * fundF);
    let hold = 0, follow = 0;
    for (const l of lines) {
      const f = staffLike(l.k) ? payF : inflF;
      /* held: a falling roll saves nothing until someone acts, but a rising one has to be staffed */
      hold += l.v * f * (l.fixed + (1 - l.fixed) * Math.max(1, g));
      /* the variable share follows the roll once the lead time has passed; before that it is held */
      const landed = p.t > (A.leadTime || 0) - 1;
      const gEff = landed ? g : 1;
      follow += l.v * f * (l.fixed + (1 - l.fixed) * gEff);
    }
    hold += other * inflF * (0.5 + 0.5 * Math.max(1, g)); follow += other * inflF * (0.5 + 0.5 * g);
    hold = Math.round(hold); follow = Math.round(follow);
    const landed = p.t > (A.leadTime || 0) - 1;
    /* the plan: the leader's own staffing, landing after the lead time; everything else as held */
    let planCost = hold, teachersPlan = T0;
    if (hasPlan && T0) {
      const tPlan = plan.ptrTarget ? Math.max(T0 * 0.5, p.pupils / plan.ptrTarget) : T0 + (plan.dTeachers || 0);
      teachersPlan = landed ? r1(tPlan) : T0;
      const tf = teachersPlan / T0;
      const sf = S0 && plan.dSupport ? Math.max(0.3, (S0 + (landed ? plan.dSupport : 0)) / S0) : 1;
      planCost = 0;
      for (const l of lines) {
        const f = staffLike(l.k) ? payF : inflF;
        if (l.k === "teach") planCost += l.v * f * tf;
        else if (l.k === "edsup") planCost += l.v * f * sf;
        else planCost += l.v * f * (l.fixed + (1 - l.fixed) * Math.max(1, g));
      }
      planCost += other * inflF * (0.5 + 0.5 * Math.max(1, g));
      planCost = Math.round(planCost);
    }
    resH += inc - hold; resF += inc - follow; resP += inc - planCost;
    yrs.push({ y: p.y, t: p.t, pupils: p.pupils, inc, hold, follow, plan: planCost, balHold: inc - hold, balFollow: inc - follow, balPlan: inc - planCost, resHold: Math.round(resH), resFollow: Math.round(resF), resPlan: Math.round(resP),
      teachersHold: L.teachers, teachersFollow: L.teachers != null ? r1(L.teachers * (0.15 + 0.85 * (landed ? g : 1))) : null, teachersPlan });
  }
  const cliffPlan = yrs.find((r) => r.t > 0 && r.resPlan < 0);
  const cliffHold = yrs.find((r) => r.t > 0 && r.resHold < 0), cliffFollow = yrs.find((r) => r.t > 0 && r.resFollow < 0);
  const end = yrs[yrs.length - 1];
  const gapEnd = end.inc - end.hold;                                     /* the structural gap at the horizon if nothing moves */
  const postsEnd = A.teacherCost ? r1((-gapEnd * 1000) / A.teacherCost) : null;
  /* the decision calendar: the posts that have to go by each September for the follow line, and the year to decide them */
  const decisions = yrs.filter((r) => r.t > 0 && r.teachersFollow != null && L.teachers != null).map((r) => { const d = nextY(r.y, -(A.leadTime || 1)); return { y: r.y, teachers: r1(L.teachers - r.teachersFollow), decideBy: d <= L.y ? "now" : d, pupils: r.pupils, lost: L.pupils - r.pupils }; });
  return { yrs, roll, cliffHold: cliffHold ? cliffHold.y : null, cliffFollow: cliffFollow ? cliffFollow.y : null, cliffPlan: hasPlan ? (cliffPlan ? cliffPlan.y : null) : undefined, hasPlan: !!hasPlan, end, gapEnd, postsEnd, decisions, other, base: L };
}

/* ── relative impact: what one unit of each lever does to the balance at the horizon ── */
/* Each lever is applied on its own to the held future; the swing is the
   change in the horizon year's balance, £k a year. One scale for every
   decision a leader could take. */
export function tornado(me, places, A, st, peers) {
  const base = project(me, places, A).end;
  const L = me.last;
  const clone = (patch) => ({ ...me, last: { ...L, ...patch, lines: { ...L.lines, ...(patch.lines || {}) } }, rows: me.rows.map((r, i) => (i === me.rows.length - 1 ? { ...r, ...patch, lines: { ...r.lines, ...(patch.lines || {}) } } : r)) });
  const swing = (m2, A2 = A, plan2 = PLAN0) => project(m2, places, A2, plan2, st).end;
  const items = [];
  const T = st && st.teachers, S = st && st.support;
  if (T && L.lines.teach) items.push({ k: "teacher", label: "One teacher fewer", unit: "FTE", v: swing(me, A, { dTeachers: -1 }).balPlan - base.balHold, how: `one teaching post at today's loaded cost of ${Math.round((1000 * L.lines.teach) / (L.teachers || T)).toLocaleString("en-GB")}` });
  if (S && L.lines.edsup) items.push({ k: "support", label: "One support post fewer", unit: "FTE", v: swing(me, A, { dSupport: -1 }).balPlan - base.balHold, how: "one education support post at today's average cost" });
  items.push({ k: "pay", label: "Pay awards one point lower", unit: "%", v: swing(me, { ...A, pay: A.pay - 1 }).balHold - base.balHold, how: `${A.pay - 1}% a year instead of ${A.pay}%, compounding to the horizon` });
  items.push({ k: "fund", label: "Funding per pupil one point higher", unit: "%", v: swing(me, { ...A, fund: A.fund + 1 }).balHold - base.balHold, how: `${A.fund + 1}% a year instead of ${A.fund}%` });
  if (st && st.ptr && T) items.push({ k: "ptr", label: "One more pupil per teacher", unit: "PTR", v: swing(me, A, { dTeachers: -(T - L.pupils / (st.ptr + 1)) }).balPlan - base.balHold, how: `${(st.ptr + 1).toFixed(1)} pupils per teacher instead of ${st.ptr.toFixed(1)} on today's roll: ${(T - L.pupils / (st.ptr + 1)).toFixed(1)} fewer teachers` });
  items.push({ k: "pupils", label: "Ten more pupils on roll", unit: "pupils", v: swing(clone({ pupils: L.pupils + 10, inc: Math.round(L.inc * (L.pupils + 10) / L.pupils) })).balHold - base.balHold, how: "ten pupils at today's income per pupil, with staffing held" });
  if (L.lines.energy) items.push({ k: "energy", label: "Energy down a tenth", unit: "%", v: swing(clone({ lines: { energy: L.lines.energy * 0.9 } })).balHold - base.balHold, how: "a 10% saving on gas and electricity, held to the horizon" });
  if (L.lines.supply) items.push({ k: "supply", label: "Supply down a third", unit: "%", v: swing(clone({ lines: { supply: L.lines.supply * (2 / 3) } })).balHold - base.balHold, how: "a third less on supply and agency cover" });
  if (peers && peers.bench.prem && peers.bench.prem.med != null && L.linesPP.prem > peers.bench.prem.med) items.push({ k: "prem", label: "Premises at the comparators' median", unit: "£", v: swing(clone({ lines: { prem: (peers.bench.prem.med * L.pupils) / 1000 } })).balHold - base.balHold, how: `from ${Math.round(L.linesPP.prem)} to ${Math.round(peers.bench.prem.med)} a pupil` });
  if (peers && peers.bench.cater && peers.bench.cater.med != null && L.linesPP.cater > peers.bench.cater.med) items.push({ k: "cater", label: "Catering at the comparators' median", unit: "£", v: swing(clone({ lines: { cater: (peers.bench.cater.med * L.pupils) / 1000 } })).balHold - base.balHold, how: `from ${Math.round(L.linesPP.cater)} to ${Math.round(peers.bench.cater.med)} a pupil` });
  return { base: base.balHold, year: base.y, items: items.map((i) => ({ ...i, v: Math.round(i.v) })).sort((a, b) => Math.abs(b.v) - Math.abs(a.v)) };
}

/* ── an estate or the system: many ledgers at once ───────────────────── */
export function estateLedger(F, all, schools, places, A) {
  let items = [];
  for (const s of schools) {
    const me = ledgerOf(F, s.urn);
    if (!me) continue;
    items.push({ s, me });
  }
  /* a school whose last return is more than a year behind the newest has closed, converted or moved: it is not part of the estate's future */
  const newest = items.map((i) => i.me.last.y).sort().slice(-1)[0];
  items = items.filter((i) => newest && i.me.last.y >= nextY(newest, -1)).map((i) => ({ ...i, P: project(i.me, places, A) }));
  const years = [...new Set(items.flatMap((i) => i.me.years))].sort();
  const series = years.map((y) => {
    const rs = items.map((i) => i.me.rows.find((r) => r.y === y)).filter(Boolean);
    return { y, n: rs.length, inc: rs.reduce((a, r) => a + r.inc, 0), exp: rs.reduce((a, r) => a + r.exp, 0), res: rs.reduce((a, r) => a + (r.res || 0), 0), pupils: rs.reduce((a, r) => a + r.pupils, 0), deficits: rs.filter((r) => r.res != null && r.res < 0).length, inYearDeficits: rs.filter((r) => r.bal != null && r.bal < 0).length };
  });
  const H = (items[0] && items[0].P.yrs.length) || 0;
  const ahead = [];
  for (let t = 1; t < H; t++) {
    const rs = items.map((i) => i.P.yrs[t]).filter(Boolean);
    ahead.push({ y: rs[0] && rs[0].y, t, pupils: rs.reduce((a, r) => a + r.pupils, 0), inc: rs.reduce((a, r) => a + r.inc, 0), hold: rs.reduce((a, r) => a + r.hold, 0), follow: rs.reduce((a, r) => a + r.follow, 0), resHold: rs.reduce((a, r) => a + r.resHold, 0), resFollow: rs.reduce((a, r) => a + r.resFollow, 0), cliffsHold: rs.filter((r) => r.resHold < 0).length, cliffsFollow: rs.filter((r) => r.resFollow < 0).length, deficitHold: rs.reduce((a, r) => a + Math.min(0, r.resHold), 0), deficitFollow: rs.reduce((a, r) => a + Math.min(0, r.resFollow), 0) });
  }
  const now = items.map((i) => i.me.last);
  const latestYear = now.map((r) => r.y).sort().slice(-1)[0];
  return { items, years, series, ahead, latestYear, n: items.length,
    pupils: now.reduce((a, r) => a + r.pupils, 0), inc: now.reduce((a, r) => a + r.inc, 0), exp: now.reduce((a, r) => a + r.exp, 0), res: now.reduce((a, r) => a + (r.res || 0), 0),
    deficits: now.filter((r) => r.res != null && r.res < 0).length, deficitSum: now.reduce((a, r) => a + Math.min(0, r.res || 0), 0), inYearDeficits: now.filter((r) => r.bal != null && r.bal < 0).length,
    cliffsHold: items.filter((i) => i.P.cliffHold).length, cliffsFollow: items.filter((i) => i.P.cliffFollow).length };
}
