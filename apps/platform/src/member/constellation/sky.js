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
export function layoutMandala(pupils) {
  /* sectors must be real tutor groups: short names, a sane count, covering the year */
  const looksLikeForm = (s) => s.length <= 7 && !/^[A-Z]\d{11,12}[A-Z]?$/i.test(s);
  let regs = [...new Set(pupils.map((p) => (p.reg || "").trim()).filter(Boolean))].filter(looksLikeForm).sort();
  const covered = pupils.filter((p) => regs.includes((p.reg || "").trim())).length;
  if (regs.length < 2 || regs.length > 10 || covered < pupils.length * 0.85) regs = [];
  const sectors = regs.length >= 2 ? regs : [""];
  const span = (2 * Math.PI) / sectors.length, pad = Math.min(0.09, span * 0.14);
  const a0 = (si) => -Math.PI / 2 + si * span;
  const byU = {}, labels = [], sectorMeta = [];
  sectors.forEach((reg, si) => {
    const inS = pupils.filter((p) => (sectors.length === 1 ? true : (p.reg || "").trim() === reg) && p.concern != null);
    const calm = inS.filter((p) => p.band === 0), watch = inS.filter((p) => p.band === 1);
    const serious = inS.filter((p) => p.band === 2).sort((a, b) => a.concern - b.concern);
    calm.forEach((p) => {
      const ang = a0(si) + pad + h01(p.upn) * (span - 2 * pad);
      const rad = 26 + Math.sqrt(h01(p.upn + "r")) * (R_ON - 32);
      byU[p.upn] = { x: CX + rad * Math.cos(ang), y: CY + rad * Math.sin(ang), ang };
    });
    watch.forEach((p) => {
      const ang = a0(si) + pad + h01(p.upn) * (span - 2 * pad);
      const rad = R_ON + 22 + h01(p.upn + "r") * (R_WATCH - R_ON - 36);
      byU[p.upn] = { x: CX + rad * Math.cos(ang), y: CY + rad * Math.sin(ang), ang };
    });
    serious.forEach((p, k) => {
      const ang = a0(si) + (k + 1) / (serious.length + 1) * span;
      const rad = R_WATCH + 18 + h01(p.upn + "r") * (R_RIM - R_WATCH - 26);
      const x = CX + rad * Math.cos(ang), y = CY + rad * Math.sin(ang);
      byU[p.upn] = { x, y, ang };
      const right = Math.cos(ang) >= -0.02;
      labels.push({ upn: p.upn, name: p.name, why: reasonFor(p),
        x1: x + 7 * Math.cos(ang), y1: y + 7 * Math.sin(ang),
        x2: CX + (R_RIM + 14) * Math.cos(ang), y2: CY + (R_RIM + 14) * Math.sin(ang),
        tx: CX + (R_RIM + 20) * Math.cos(ang), ty: CY + (R_RIM + 20) * Math.sin(ang),
        anchor: right ? "start" : "end" });
    });
    if (sectors.length > 1) sectorMeta.push({ reg, a: a0(si),
      lx: CX + (R_RIM + 92) * Math.cos(a0(si) + span / 2), ly: CY + (R_RIM + 92) * Math.sin(a0(si) + span / 2),
      serious: serious.length });
  });
  /* a child whose form is unknown is still placed: full-circle fallback by band */
  pupils.forEach((p) => {
    if (p.concern == null || byU[p.upn]) return;
    const ang = -Math.PI / 2 + h01(p.upn) * 2 * Math.PI;
    const rad = p.band === 0 ? 26 + Math.sqrt(h01(p.upn + "r")) * (R_ON - 32)
      : p.band === 1 ? R_ON + 22 + h01(p.upn + "r") * (R_WATCH - R_ON - 36)
      : R_WATCH + 18 + h01(p.upn + "r") * (R_RIM - R_WATCH - 26);
    byU[p.upn] = { x: CX + rad * Math.cos(ang), y: CY + rad * Math.sin(ang), ang };
    if (p.band === 2) {
      const x = byU[p.upn].x, y = byU[p.upn].y, right = Math.cos(ang) >= -0.02;
      labels.push({ upn: p.upn, name: p.name, why: reasonFor(p),
        x1: x + 7 * Math.cos(ang), y1: y + 7 * Math.sin(ang),
        x2: CX + (R_RIM + 14) * Math.cos(ang), y2: CY + (R_RIM + 14) * Math.sin(ang),
        tx: CX + (R_RIM + 20) * Math.cos(ang), ty: CY + (R_RIM + 20) * Math.sin(ang),
        anchor: right ? "start" : "end" });
    }
  });
  /* sector labels stay on the page */
  sectorMeta.forEach((s) => { s.ly = Math.max(24, Math.min(SKY_H - 26, s.ly)); });
  /* label collision ease: nudge vertically within each side, order by ty */
  ["start", "end"].forEach((side) => {
    const ls = labels.filter((L) => L.anchor === side).sort((a, b) => a.ty - b.ty);
    for (let i = 1; i < ls.length; i++) if (ls[i].ty - ls[i - 1].ty < 26) ls[i].ty = ls[i - 1].ty + 26;
  });
  const fit = labels.filter((L) => L.ty >= 18 && L.ty <= SKY_H - 10);
  const hidden = labels.length - fit.length;
  return { byU, labels: fit, hidden, sectorMeta,
    counts: { n: pupils.filter((p) => p.concern != null).length,
      calm: pupils.filter((p) => p.band === 0).length,
      watch: pupils.filter((p) => p.band === 1).length,
      serious: pupils.filter((p) => p.band === 2).length } };
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
