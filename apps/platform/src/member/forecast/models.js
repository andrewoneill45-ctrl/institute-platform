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
  const out = { n: set.length, year, london, phase, sector: mine.src === "A" ? "academies" : "maintained schools", bench, deficitShare, rule: `${phase || "schools"} in the same sector, ${london ? "in London" : "outside London"}, with a roll and free school meals near this school's` };
  PEERS.set(key, out);
  return out;
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
export function project(me, places, A) {
  const L = me.last, roll = rollPath(me, places, A);
  const lines = LINES.map((l) => ({ ...l, v: L.lines[l.k] != null ? L.lines[l.k] : 0 }));
  const known = lines.reduce((a, l) => a + l.v, 0);
  const other = Math.max(0, L.exp - known);                 /* everything the nine lines do not cover */
  const staffLike = (k) => ["teach", "supply", "edsup", "admin"].includes(k);
  const yrs = [{ y: L.y, t: 0, pupils: L.pupils, inc: L.inc, hold: L.exp, follow: L.exp, balHold: L.bal, balFollow: L.bal, resHold: L.res, resFollow: L.res, teachersHold: L.teachers, teachersFollow: L.teachers }];
  let resH = L.res, resF = L.res;
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
    resH += inc - hold; resF += inc - follow;
    const landed = p.t > (A.leadTime || 0) - 1;
    yrs.push({ y: p.y, t: p.t, pupils: p.pupils, inc, hold, follow, balHold: inc - hold, balFollow: inc - follow, resHold: Math.round(resH), resFollow: Math.round(resF),
      teachersHold: L.teachers, teachersFollow: L.teachers != null ? r1(L.teachers * (0.15 + 0.85 * (landed ? g : 1))) : null });
  }
  const cliffHold = yrs.find((r) => r.t > 0 && r.resHold < 0), cliffFollow = yrs.find((r) => r.t > 0 && r.resFollow < 0);
  const end = yrs[yrs.length - 1];
  const gapEnd = end.inc - end.hold;                                     /* the structural gap at the horizon if nothing moves */
  const postsEnd = A.teacherCost ? r1((-gapEnd * 1000) / A.teacherCost) : null;
  /* the decision calendar: the posts that have to go by each September for the follow line, and the year to decide them */
  const decisions = yrs.filter((r) => r.t > 0 && r.teachersFollow != null && L.teachers != null).map((r) => { const d = nextY(r.y, -(A.leadTime || 1)); return { y: r.y, teachers: r1(L.teachers - r.teachersFollow), decideBy: d <= L.y ? "now" : d, pupils: r.pupils, lost: L.pupils - r.pupils }; });
  return { yrs, roll, cliffHold: cliffHold ? cliffHold.y : null, cliffFollow: cliffFollow ? cliffFollow.y : null, end, gapEnd, postsEnd, decisions, other, base: L };
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
