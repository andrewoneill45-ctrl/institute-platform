/* sky.js — the geometry of the School View.
   Two layouts in one 1200×780 space: the shoal (year strips) and the mandala
   (one year, coiled). Pure functions, so the coil between them is just
   interpolation and the batteries can hold every position to account. */

export const SKY_W = 1200, SKY_H = 780;
export const CX = 600, CY = 396, R_ON = 136, R_WATCH = 252, R_RIM = 318;

const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const h01 = (s) => (hash(s) % 1000) / 1000;

/* which force pulls a child: null = on track */
export function pullOf(p) {
  const ld = p.progress == null ? 0 : Math.max(0, 62 - p.progress) / 62;
  const ed = p.engagement == null ? 0 : Math.max(0, 62 - p.engagement) / 62;
  if (ld <= 0.02 && ed <= 0.02) return null;
  if (ld > 0.15 && ed > 0.15) return "both";
  return ld >= ed ? "learning" : "engagement";
}

/* one honest line for a serious child's rim label */
export function reasonFor(p) {
  if (p.capped) return "held visible by the rule";
  const pu = pullOf(p);
  if (pu === "both") return "learning and engagement";
  if (pu === "engagement" && p.nowAtt != null) return `attendance ${p.nowAtt}%`;
  if (p.ks4 && p.ks4.length) {
    const worst = p.ks4[0];
    if (worst.pred != null && worst.target != null && worst.pred < worst.target) return `predicted ${worst.target - worst.pred} behind in ${worst.s}`;
  }
  if (p.priorQ && p.nowQ && p.nowQ < p.priorQ) return `fell from Q${p.priorQ} to Q${p.nowQ}`;
  if (pu === "engagement") return "engagement";
  return "learning";
}

/* ── the shoal: one strip per year, beeswarm by concern ── */
export function layoutShoal(pupils, years) {
  const rows = [], byU = {};
  const topPad = 46, gutter = 118, stripW = SKY_W - gutter - 96;
  const rowH = Math.min(126, (SKY_H - topPad - 20) / Math.max(1, years.length));
  const zx = (c) => gutter + (100 - c) / 100 * stripW; /* concern 100 → left */
  years.forEach((y, yi) => {
    const ps = pupils.filter((p) => p.year === y && p.concern != null);
    const y0 = topPad + yi * rowH, mid = y0 + (rowH - 10) / 2;
    const cols = {};
    const sorted = [...ps].sort((a, b) => b.concern - a.concern);
    sorted.forEach((p) => {
      const x = zx(p.concern) + (h01(p.upn) - 0.5) * 5;
      const col = Math.round(x / 6.5);
      const k = (cols[col] = (cols[col] || 0) + 1);
      const off = Math.ceil((k - 1) / 2) * 6.6 * ((k % 2) ? 1 : -1);
      const lim = (rowH - 24) / 2;
      byU[p.upn] = { x, y: mid + Math.max(-lim, Math.min(lim, off)) };
    });
    rows.push({ year: y, y0, h: rowH - 10, mid, n: ps.length,
      serious: ps.filter((p) => p.band === 2).length,
      declining: ps.filter((p) => p.dir === "declining").length });
  });
  return { rows, byU, gutter, stripW,
    zones: { watch: zx(62), serious: zx(40), right: gutter + stripW } };
}

/* ── the mandala: one year coiled — rings are the zones, slices the forms ── */
/* ── the mandala: the year ranked by performance and wound into a circle.
      Strongest at twelve o'clock, clockwise in rank order; radius is the
      concern zone, so the spiral drifts outward as the year weakens and the
      furthest-behind child is the last point before the circle closes. ── */
/* ── the mandala: the year ranked by performance, wound into an equal-area
      spiral. Strongest at twelve o'clock, clockwise in rank order; radius
      grows with rank so the circle's area belongs to the children, and the
      zone rings are drawn where this year's own bands fall. ── */
/* ── the mandala: fixed zone rings, ordered by performance. Each band owns
      the full circle: within every ring the children sweep clockwise from
      strongest to furthest behind, so serious names spread around the rim. ── */
const GA = Math.PI * (3 - Math.sqrt(5)); /* the golden angle: an even field, no spokes */
/* only the furthest behind are named on the rim itself: a wall of names reads as
   noise, so the budget keeps the circle legible and the register carries the rest */
const LABEL_BUDGET = 26;
const budget = (labels) => [...labels].sort((a, b) => (a.c ?? 0) - (b.c ?? 0)).slice(0, LABEL_BUDGET);
function mkLabel(p, x, y, ang, why, c) {
  const right = Math.cos(ang) >= -0.02;
  return { upn: p.upn, name: p.name, why, c: c ?? p.concern ?? 0,
    x1: x + 7 * Math.cos(ang), y1: y + 7 * Math.sin(ang),
    x2: CX + (R_RIM + 14) * Math.cos(ang), y2: CY + (R_RIM + 14) * Math.sin(ang),
    tx: CX + (R_RIM + 20) * Math.cos(ang), ty: CY + (R_RIM + 20) * Math.sin(ang),
    anchor: right ? "start" : "end" };
}
function settleRim(labels) {
  ["start", "end"].forEach((side) => {
    const ls = labels.filter((L) => L.anchor === side).sort((a, b) => a.ty - b.ty);
    for (let i = 1; i < ls.length; i++) if (ls[i].ty - ls[i - 1].ty < 26) ls[i].ty = ls[i - 1].ty + 26;
  });
  const fit = labels.filter((L) => L.ty >= 18 && L.ty <= SKY_H - 10);
  return { fit, hidden: labels.length - fit.length };
}
/* the on-track heart: a sunflower fill of the whole inner disc, strongest at the
   very centre, every dot clear of its neighbours and easy to click */
const heart = (byU, ps) => {
  const nb = Math.max(1, ps.length);
  ps.forEach((p, i) => {
    const ang = -Math.PI / 2 + i * GA;
    const rad = 46 + (R_ON - 60) * Math.sqrt((i + 0.5) / nb); /* a calm core stays clear for the year's name */
    byU[p.upn] = { x: CX + rad * Math.cos(ang), y: CY + rad * Math.sin(ang), ang };
  });
};
export function layoutMandala(pupils) {
  const byU = {}, labels = [];
  const bands = [0, 1, 2].map((b) => pupils.filter((p) => p.concern != null && p.band === b)
    .sort((x, y) => y.concern - x.concern || (x.upn < y.upn ? -1 : 1)));
  const rOf = (b, c) => b === 1 ? R_ON + 16 + (62 - c) / 22 * (R_WATCH - R_ON - 30)
    : R_WATCH + 16 + (40 - Math.max(0, c)) / 40 * (R_RIM - R_WATCH - 28);
  heart(byU, bands[0]);
  bands.forEach((ps, b) => {
    if (b === 0) return;
    const nb = Math.max(1, ps.length);
    ps.forEach((p, i) => {
      const ang = -Math.PI / 2 + ((i + 0.5) / nb) * 2 * Math.PI;
      const rad = rOf(b, p.concern) + (h01(p.upn) - 0.5) * 8;
      const x = CX + rad * Math.cos(ang), y = CY + rad * Math.sin(ang);
      byU[p.upn] = { x, y, ang };
      if (b === 2) labels.push(mkLabel(p, x, y, ang, reasonFor(p)));
    });
  });
  const { fit } = settleRim(budget(labels));
  const hidden = labels.length - fit.length;
  return { byU, labels: fit, hidden, rings: [], sectorMeta: [],
    counts: { n: bands[0].length + bands[1].length + bands[2].length,
      calm: bands[0].length, watch: bands[1].length, serious: bands[2].length } };
}

/* ── the grade lens: the same circle, re-read against a grade bar ──
   Secure above the bar fills the heart; at the bar rings the middle; below the
   bar drifts out, the furthest behind named on the rim. Children without an
   English + maths prediction keep their concern seat, dimmed, and are counted. */
export function gradesOf(p) {
  if (!p.ks4 || !p.ks4.length) return null;
  const en = p.ks4.find((r) => /engl|^en\b/i.test(r.s)), ma = p.ks4.find((r) => /math|^ma\b/i.test(r.s));
  const ge = en ? en.pred ?? en.now : null, gm = ma ? ma.pred ?? ma.now : null;
  if (ge == null || gm == null) return null;
  return { g: Math.min(ge, gm), en: ge, ma: gm };
}
export function layoutGradeMandala(pupils, bar) {
  /* the grade lens is a venn: English at the bar on the left, maths on the
     right, both in the intersection (the basics measure, literally drawn),
     and the children with neither gathered beneath, every dot still a child */
  const byU = {};
  const G = new Map();
  pupils.forEach((p) => G.set(p.upn, gradesOf(p)));
  const withG = pupils.filter((p) => G.get(p.upn));
  const both = [], en = [], ma = [], none = [];
  withG.forEach((p) => { const g = G.get(p.upn); (g.en >= bar && g.ma >= bar ? both : g.en >= bar ? en : g.ma >= bar ? ma : none).push(p); });
  const strongest = (a) => a.sort((x, y) => (G.get(y.upn).en + G.get(y.upn).ma) - (G.get(x.upn).en + G.get(x.upn).ma) || (x.upn < y.upn ? -1 : 1));
  [both, en, ma, none].forEach(strongest);
  const R = 200, dx = 116, vy = CY - 42, cxL = CX - dx, cxR = CX + dx;
  const inL = (x, y) => (x - cxL) ** 2 + (y - vy) ** 2 <= (R - 12) ** 2;
  const inR = (x, y) => (x - cxR) ** 2 + (y - vy) ** 2 <= (R - 12) ** 2;
  const fill = (ps, cx0, cy0, test) => {
    let placed = 0;
    for (let i = 0; placed < ps.length && i < 12000; i++) {
      const ang = i * GA, rad = 9 * Math.sqrt(i + 0.5);
      const x = cx0 + rad * Math.cos(ang), y = cy0 + rad * Math.sin(ang);
      if (!test(x, y)) continue;
      byU[ps[placed].upn] = { x, y, ang: Math.atan2(y - CY, x - CX) };
      placed++;
    }
    for (; placed < ps.length; placed++) { const a2 = placed * GA; byU[ps[placed].upn] = { x: cx0 + 24 * Math.cos(a2), y: cy0 + 24 * Math.sin(a2), ang: 0 }; }
  };
  fill(both, CX, vy, (x, y) => inL(x, y) && inR(x, y));
  fill(en, cxL - 48, vy, (x, y) => inL(x, y) && !inR(x, y));
  fill(ma, cxR + 48, vy, (x, y) => inR(x, y) && !inL(x, y));
  none.forEach((p, i) => {
    const perRow = 30, row = Math.floor(i / perRow), k = i % perRow, n2 = Math.min(none.length - row * perRow, perRow);
    byU[p.upn] = { x: CX + (k - (n2 - 1) / 2) * 15, y: vy + R + 74 + row * 15, ang: Math.PI / 2 };
  });
  return { byU, labels: [], hidden: 0,
    venn: { cxL, cxR, vy, R, bar, lensTop: vy - Math.sqrt(Math.max(0, R * R - dx * dx)) },
    counts: { n: pupils.length, both: both.length, en: en.length, ma: ma.length, none: none.length, out: pupils.length - withG.length,
      sec: both.length, at: en.length + ma.length, below: none.length } };
}

/* ── the coil: polar interpolation around the centre, every dot sweeping the
      same way, so the strip visibly winds into the ring and unwinds back ── */
export function coilPoint(S, E, t) {
  const aS = Math.atan2(S.y - CY, S.x - CX), rS = Math.hypot(S.x - CX, S.y - CY);
  let aE = E.ang != null ? E.ang : Math.atan2(E.y - CY, E.x - CX);
  const rE = Math.hypot(E.x - CX, E.y - CY);
  while (aE < aS - 0.2) aE += 2 * Math.PI; /* always wind clockwise into place */
  const a = aS + (aE - aS) * t, r = rS + (rE - rS) * t;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
