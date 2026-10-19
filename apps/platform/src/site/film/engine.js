/* The front page's field of light. One canvas of 900 points that re-forms
   itself scene by scene as the visitor scrolls: the quatrefoil, a school's
   pupils as a distribution, England, a report being built, the iris, the
   orbits, the shoal coiling into a mandala, and the loop that joins them.
   Scroll chooses the scene; each scene then plays at its own pace, and
   scrolling on through it hurries it along (lt = max(clock, progress)).
   Plain DOM and canvas, no React inside, so React never re-renders a frame. */

const IV = [243, 238, 248], LI = [196, 164, 232], PU = [150, 72, 210], GO = [222, 182, 96], LG = [236, 208, 146];

/* len: how many screens of scroll the scene holds; dur: its own clock, in seconds */
export const SCENES = [
  { id: "hero", name: "Welcome", len: 1.1, dur: 3, form: "qfhero", box: "hero" },
  { id: "universe", name: "Every school", len: 1, dur: 4, form: "field", box: "full" },
  { id: "hidden", name: "In plain sight", len: 1, dur: 5, form: "strip", box: "strip" },
  { id: "what", name: "What we do", len: 1.2, dur: 5.5, form: "qf4", box: "four" },
  { id: "atlas", name: "Atlas", len: 1.3, dur: 7, form: "england", box: "right" },
  { id: "prizm", name: "Prizm", len: 1.1, dur: 5, form: "bars", box: "right" },
  { id: "lens", name: "Lens", len: 1.2, dur: 6, form: "lens", box: "right" },
  { id: "orbit", name: "Orbit", len: 1.1, dur: 5, form: "orbit", box: "right" },
  { id: "constellation", name: "Constellation", len: 1.8, dur: 8, form: "shoal", box: "right" },
  { id: "publish", name: "Positions", len: 1.1, dur: 4, form: "faint", box: "right" },
  { id: "system", name: "One system", len: 1.1, dur: 4, form: "loop", box: "pipe" },
  { id: "join", name: "Join", len: 1.2, dur: 4, form: "end", box: "full" },
];
export const SCROLL_SCREENS = SCENES.reduce((a, s) => a + s.len, 0);

/* boxes as fractions of the stage: [x, y, w, h] */
const BOXES = {
  L: { full: [0, 0, 1, 1], hero: [0.53, 0.08, 0.41, 0.84], strip: [0.08, 0.5, 0.84, 0.36], four: [0.3, 0.3, 0.4, 0.64],
       right: [0.5, 0.08, 0.46, 0.84], pipe: [0.14, 0.3, 0.72, 0.62] },
  P: { full: [0, 0, 1, 1], hero: [0.2, 0.66, 0.6, 0.3], strip: [0.04, 0.52, 0.92, 0.36], four: [0.08, 0.44, 0.84, 0.5],
       right: [0.04, 0.5, 0.92, 0.46], pipe: [0.08, 0.36, 0.84, 0.58] },
};

const N = 900;
let seed = 20261016;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const rA = new Float32Array(N), rB = new Float32Array(N), rC = new Float32Array(N), rD = new Float32Array(N), score = new Float32Array(N), yr = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  rA[i] = rnd(); rB[i] = rnd(); rC[i] = rnd(); rD[i] = rnd(); yr[i] = i % 5;
  const u = Math.max(1e-6, rnd()), v = rnd(), z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  score[i] = Math.max(-2.6, Math.min(2.6, z));
}

/* England: an outline to sample inside, with weight on the cities */
const POLY = [[-2.03,55.77],[-1.6,55.6],[-1.55,55.25],[-1.4,54.95],[-1.15,54.6],[-0.6,54.48],[-0.2,54.15],[-0.15,53.95],[0.12,53.6],[0.35,53.2],[0.33,52.95],[0.6,52.97],[1.3,52.93],[1.75,52.6],[1.72,52.3],[1.4,51.95],[0.9,51.78],[0.8,51.55],[1.0,51.45],[1.42,51.38],[1.35,51.13],[0.95,50.95],[0.55,50.85],[-0.1,50.8],[-0.8,50.75],[-1.3,50.78],[-1.95,50.6],[-2.45,50.6],[-3.0,50.7],[-3.45,50.6],[-3.6,50.25],[-4.2,50.33],[-4.75,50.25],[-5.2,49.96],[-5.7,50.06],[-5.45,50.2],[-5.0,50.42],[-4.55,50.9],[-4.2,51.07],[-3.6,51.2],[-3.0,51.25],[-2.7,51.5],[-2.7,51.8],[-3.05,52.0],[-3.1,52.3],[-3.0,52.6],[-3.1,52.95],[-2.95,53.2],[-3.1,53.38],[-3.0,53.55],[-3.05,53.8],[-2.85,54.0],[-3.2,54.1],[-3.4,54.3],[-3.6,54.5],[-3.4,54.8],[-3.1,54.95],[-2.85,55.05],[-2.45,55.2],[-2.2,55.4]];
const inside = (x, y) => { let c = false; for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) { const [xi, yi] = POLY[i], [xj, yj] = POLY[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const CITY = [[-0.12,51.5,.3],[-1.9,52.48,.12],[-2.24,53.48,.12],[-1.55,53.8,.1],[-2.95,53.42,.07],[-1.6,54.97,.07],[-2.6,51.46,.06],[-1.47,53.38,.05],[-1.15,52.95,.05],[-1.4,50.92,.06]];
const XMIN = -5.7 * 0.6, WX = 7.45 * 0.6, YMAX = 55.85, HY = 5.89;
const eu = new Float32Array(N), ev = new Float32Array(N);
for (let i = 0; i < N; i++) {
  let lon = 0, lat = 0, ok = false, g = 0;
  while (!ok && g++ < 400) {
    if (rnd() < 0.5) {
      let r = rnd(), k = 0;
      for (; k < CITY.length - 1; k++) { r -= CITY[k][2] / 0.9; if (r < 0) break; }
      const a = rnd() * 6.283, d = Math.sqrt(-2 * Math.log(Math.max(1e-6, rnd()))) * 0.22;
      lon = CITY[k][0] + (Math.cos(a) * d) / 0.6; lat = CITY[k][1] + Math.sin(a) * d;
    } else { lon = -5.7 + rnd() * 7.45; lat = 49.96 + rnd() * 5.89; }
    ok = inside(lon, lat);
  }
  eu[i] = (lon * 0.6 - XMIN) / WX; ev[i] = (YMAX - lat) / HY;
}

/* Constellation: the Year 10 mandala's concern-zone rings, ordered by performance within each */
const zone = new Uint8Array(N), zrank = new Float32Array(N), zcount = [0, 0, 0];
{
  const L = [[], [], []];
  for (let i = 0; i < N; i++) { if (yr[i] !== 3) continue; const z = score[i] > -0.55 ? 0 : score[i] > -1.25 ? 1 : 2; zone[i] = z; L[z].push(i); }
  L.forEach((arr, z) => { arr.sort((a, b) => score[b] - score[a]); arr.forEach((i, k) => (zrank[i] = k)); zcount[z] = arr.length; });
}
export const CONSTELLATION_COUNTS = { serious: zcount[2], watch: zcount[1] };

const cl = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const mix = (a, b, p) => a + (b - a) * p;
const BARS = [0.38, 0.46, 0.52, 0.49, 0.63, 0.71, 0.78, 0.92];
const PRISM_Q = "Where are schools improving fastest?";

export function mountFilm({ root, run, stage, canvas, onScene }) {
  const ctx = canvas.getContext("2d");
  const scenes = [...stage.querySelectorAll("[data-scene]")];
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const q = (sel) => stage.querySelector(sel);
  const ptext = q('[data-role="ptext"]'), c1 = q('[data-role="c1"]'), c2 = q('[data-role="c2"]'),
    st1 = q('[data-role="st1"]'), st2 = q('[data-role="st2"]'), y10 = q('[data-role="y10"]');
  const yls = [...stage.querySelectorAll(".yl")];

  const px = new Float32Array(N), py = new Float32Array(N), pr = new Float32Array(N), pa = new Float32Array(N), pc = new Float32Array(N * 3);
  const tx = new Float32Array(N), ty = new Float32Array(N), tr = new Float32Array(N), ta = new Float32Array(N), tc = new Float32Array(N * 3), snap = new Uint8Array(N);
  let mode = "L", W = 1, H = 1, K = 1, dpr = 1;
  let first = true;

  const box = (name) => { const b = BOXES[mode][name]; return [b[0] * W, b[1] * H, b[2] * W, b[3] * H]; };
  const setT = (i, x, y, r, a, c) => { tx[i] = x; ty[i] = y; tr[i] = r * K; ta[i] = a; tc[i * 3] = c[0]; tc[i * 3 + 1] = c[1]; tc[i * 3 + 2] = c[2]; snap[i] = 0; };

  function field(B, T, m) {
    for (let i = 0; i < N; i++) {
      const x = B[0] + ((rA[i] + T * 0.0035 * (0.4 + rC[i])) % 1) * B[2], y = B[1] + rB[i] * B[3] + Math.sin(T * 0.25 + rC[i] * 6.28) * 5;
      const tw = 0.5 + 0.5 * Math.sin(T * (0.8 + rD[i] * 2) + rA[i] * 40);
      setT(i, x, y, 0.9 + rC[i] * 1.5, (0.18 + 0.55 * tw) * m, rD[i] < 0.07 ? GO : rC[i] < 0.5 ? IV : LI);
    }
  }
  const stripPos = (i, B) => { const d = Math.exp((-score[i] * score[i]) / 2); return [B[0] + B[2] * ((score[i] + 2.6) / 5.2), B[1] + B[3] * 0.5 + (rB[i] - 0.5) * B[3] * 0.9 * d]; };
  function qfPt(s, cx, cy, r, j) {
    const lobe = Math.floor(s * 4) % 4, u = s * 4 - Math.floor(s * 4), ph = (lobe * Math.PI) / 2, th = ph - Math.PI / 2 + u * Math.PI, rr = r + j;
    return [cx + r * Math.cos(ph) + rr * Math.cos(th), cy + r * Math.sin(ph) + rr * Math.sin(th)];
  }
  const qfGeom = (B, f) => ({ cx: B[0] + B[2] / 2, cy: B[1] + B[3] / 2, r: Math.min(B[2], B[3]) * f });
  const qf4f = () => (mode === "P" ? 0.13 : 0.2);
  function fitEng(B) { const s = Math.min(B[2] / WX, B[3] / HY) * 0.96; return { s, ox: B[0] + (B[2] - WX * s) / 2, oy: B[1] + (B[3] - HY * s) / 2 }; }
  const shoalY = (B, g) => B[1] + B[3] * (0.1 + g * 0.2);
  function shoalPos(i, B) { const d = Math.exp((-score[i] * score[i]) / 2); return [B[0] + B[2] * (0.14 + (0.86 * (score[i] + 2.6)) / 5.2), shoalY(B, yr[i]) + (rB[i] - 0.5) * B[3] * 0.12 * d]; }
  function mandalaPos(i, B) {
    const cx = B[0] + B[2] / 2, cy = B[1] + B[3] / 2, R = Math.min(B[2], B[3]) * 0.46, z = zone[i], k = zrank[i], n = zcount[z];
    let r, th;
    if (z === 0) { r = 0.5 * R * Math.sqrt((k + 0.5) / n); th = k * 2.39996; }
    else if (z === 1) { th = (k / n) * 6.2832 - 1.5708; r = R * (0.66 + (rB[i] - 0.5) * 0.06); }
    else { th = (k / n) * 6.2832 - 1.5708; r = R * 0.93; }
    return [cx + r * Math.cos(th), cy + r * Math.sin(th)];
  }
  function loopGeom(B) {
    const cx = B[0] + B[2] / 2, cy = B[1] + B[3] / 2, rx = B[2] * 0.4, ry = B[3] * 0.38, rn = Math.min(B[2], B[3]) * 0.075;
    return { cx, cy, rx, ry, rn, nodes: [[cx - rx, cy], [cx, cy - ry], [cx + rx, cy], [cx, cy + ry]] };
  }

  const F = {
    field(B, lt, T) { field(B, T, 1); },
    faint(B, lt, T) { field(box("full"), T, 0.32); },
    end(B, lt, T) { field(B, T, 0.5); },
    qfhero(B, lt, T) {
      const g = qfGeom(B, 0.23), p = ease(cl(lt / 2.4)), head = qfPt(p * 0.9999, g.cx, g.cy, g.r, 0), F2 = box("full");
      for (let i = 0; i < N; i++) {
        if (i % 4 === 0) {
          const tw = 0.5 + 0.5 * Math.sin(T * (0.8 + rD[i] * 2) + rA[i] * 40);
          setT(i, F2[0] + ((rA[i] + T * 0.003) % 1) * F2[2], F2[1] + rB[i] * F2[3], 0.9 + rC[i], 0.08 + 0.22 * tw, rD[i] < 0.12 ? GO : IV);
          continue;
        }
        const s = (rA[i] + T * 0.004) % 1;
        if (rA[i] > p) setT(i, head[0], head[1], 1.6, 0, LI);
        else { const [x, y] = qfPt(s, g.cx, g.cy, g.r, (rB[i] - 0.5) * 8 * K); setT(i, x, y, 1.6, 0.9, rC[i] < 0.08 ? GO : rC[i] < 0.2 ? IV : LI); }
      }
    },
    strip(B, lt, T) {
      const pulse = lt > 2.4 ? 0.5 + 0.5 * Math.sin(T * 3) : 0;
      for (let i = 0; i < N; i++) { const [x, y] = stripPos(i, B), tail = score[i] < -1.3; setT(i, x, y, tail ? 2.2 + pulse * 1.2 : 1.8, tail ? 0.95 : 0.62, tail ? GO : LI); }
    },
    qf4(B, lt) {
      const g = qfGeom(B, qf4f()), at = [2.1, 3.2, 4.3, 1.0];
      for (let i = 0; i < N; i++) {
        const lobe = Math.floor(rA[i] * 4) % 4, lit = lt >= at[lobe];
        const [x, y] = qfPt(rA[i], g.cx, g.cy, g.r, (rB[i] - 0.5) * 8 * K);
        setT(i, x, y, lit ? 2.1 : 1.5, lit ? 0.95 : 0.5, lit ? GO : LI);
      }
    },
    england(B, lt) {
      const f = fitEng(B);
      for (let i = 0; i < N; i++) { const dyn = lt > 3.2 && rC[i] < 0.09, x = f.ox + eu[i] * WX * f.s, y = f.oy + ev[i] * HY * f.s; setT(i, x, y, dyn ? 2.9 : 1.45, dyn ? 1 : 0.72, dyn ? GO : LI); }
    },
    lens(B, lt, T) {
      const cx = B[0] + B[2] / 2, cy = B[1] + B[3] / 2, R = Math.min(B[2], B[3]) * 0.46, f = ease(cl((lt - 1.4) / 1.6));
      for (let i = 0; i < N; i++) {
        const s = Math.sqrt(rA[i]), qq = Math.round(s * 6) / 6, rn = mix(0.12 + 0.88 * s, 0.12 + 0.88 * qq, f), r = rn * R;
        const th = rB[i] * 6.2832 + T * (0.5 - 0.34 * rn) * (Math.round(s * 6) % 2 ? 1 : -1) * (0.4 + 0.6 * f);
        setT(i, cx + r * Math.cos(th), cy + r * Math.sin(th), rn < 0.32 ? 2 : 1.4, 0.82, rn < 0.32 ? GO : rn > 0.85 ? IV : LI);
      }
    },
    orbit(B, lt, T) {
      const cx = B[0] + B[2] / 2, cy = B[1] + B[3] / 2, R = Math.min(B[2], B[3]) * 0.48, tl = -0.22, ct = Math.cos(tl), st = Math.sin(tl);
      const RX = [0.36, 0.66, 0.96], SP = [0.45, 0.28, 0.17], CO = [PU, LI, IV];
      for (let i = 0; i < N; i++) {
        if (i % 12 === 0) { const r = R * 0.09 * Math.sqrt(rB[i]), th = rA[i] * 6.28 + T; setT(i, cx + r * Math.cos(th), cy + r * Math.sin(th), 2.4, 1, GO); continue; }
        const k = i % 3, rx = R * RX[k], ry = rx * 0.4, th = rA[i] * 6.2832 + T * SP[k], lx = rx * Math.cos(th), ly = ry * Math.sin(th), dp = 0.5 + 0.5 * Math.sin(th);
        setT(i, cx + lx * ct - ly * st, cy + lx * st + ly * ct, 1.1 + dp * 1.3, 0.35 + 0.6 * dp, CO[k]);
      }
    },
    shoal(B, lt) {
      const c = [B[0] + B[2] / 2, B[1] + B[3] / 2];
      for (let i = 0; i < N; i++) {
        const [sx, sy] = shoalPos(i, B), z = score[i] < -1.25 ? 2 : score[i] < -0.55 ? 1 : 0, col = z === 2 ? GO : z === 1 ? LG : LI;
        if (yr[i] !== 3) { setT(i, sx, sy, z === 2 ? 2 : 1.5, lt > 4.2 ? 0.07 : z === 0 ? 0.6 : 0.9, col); continue; }
        const d = 0.7 * ((sx - B[0]) / B[2]), p = ease(cl((lt - 4.2 - d) / 1.5));
        if (p <= 0) { setT(i, sx, sy, z === 2 ? 2 : 1.5, z === 0 ? 0.75 : 0.95, col); continue; }
        const [mx, my] = mandalaPos(i, B), x0 = mix(sx, mx, p) - c[0], y0 = mix(sy, my, p) - c[1], a = Math.sin(p * Math.PI) * 1.3, ca = Math.cos(a), sa = Math.sin(a);
        setT(i, c[0] + x0 * ca - y0 * sa, c[1] + x0 * sa + y0 * ca, mix(1.6, z === 2 ? 3.4 : z === 1 ? 2.2 : 1.8, p), z === 0 ? 0.8 : 1, col);
        snap[i] = 1;
      }
    },
    bars(B, lt) {
      const g = ease(cl((lt - 0.6) / 2.4)), cx0 = B[0] + B[2] * 0.1, cw = B[2] * 0.8, base = B[1] + B[3] * 0.86, ch = B[3] * 0.62;
      const rowsMax = Math.floor(N / 8 / 3) / 0.92, s = Math.min(ch / rowsMax, (cw / 8) * 0.62 / 3), F2 = box("full");
      for (let i = 0; i < N; i++) {
        const b = i % 8, idx = Math.floor(i / 8), col = idx % 3, row = Math.floor(idx / 3), cap = Math.floor(BARS[b] * rowsMax), bx = cx0 + (cw * (b + 0.5)) / 8 - s;
        if (row >= cap) { setT(i, F2[0] + rA[i] * F2[2], F2[1] + rB[i] * F2[3], 1, 0.08, LI); continue; }
        const vis = row < cap * g;
        setT(i, bx + col * s, vis ? base - row * s : base, (s * 0.36) / K, vis ? (b === 7 ? 1 : 0.8) : 0, b === 7 ? GO : row > cap - 3 ? IV : LI);
      }
    },
    loop(B, lt, T) {
      const g = loopGeom(B), CO = [LI, IV, PU, GO];
      for (let i = 0; i < N; i++) {
        if (i % 9 < 5) { const k = i % 4, r = g.rn * Math.sqrt(rB[i]), th = rA[i] * 6.28 + T * 0.6, [nx, ny] = g.nodes[k]; setT(i, nx + r * Math.cos(th), ny + r * Math.sin(th), 1.7, 0.9, CO[k]); continue; }
        const th = rA[i] * 6.2832 + T * 0.32, j = (rB[i] - 0.5) * 12 * K;
        setT(i, g.cx + (g.rx + j) * Math.cos(th), g.cy + (g.ry + j) * Math.sin(th), 1.2, 0.5, LI);
      }
    },
  };

  /* labelled elements that sit on the drawing */
  function place(el, x, y) { if (el) { el.style.left = (x / W) * 100 + "%"; el.style.top = (y / H) * 100 + "%"; } }
  function layout() {
    const P = (k) => stage.querySelector('[data-place="' + k + '"]');
    { const g = qfGeom(box("four"), qf4f()), o = 2 * g.r + 20, os = mode === "P" ? 2 * g.r + 10 : o;
      place(P("q-top"), g.cx, g.cy - o); place(P("q-right"), g.cx + os, g.cy); place(P("q-bottom"), g.cx, g.cy + o); place(P("q-left"), g.cx - os, g.cy); }
    const R = box("right");
    for (let k = 0; k < 5; k++) place(P("y" + k), R[0], shoalY(R, k));
    { const f = P("frame"); if (f) { place(f, R[0] - R[2] * 0.02, R[1] + R[3] * 0.02); f.style.width = ((R[2] * 1.04) / W) * 100 + "%"; f.style.height = ((R[3] * 0.96) / H) * 100 + "%"; } }
    { const p = P("papers"); if (p) { place(p, R[0] + R[2] * 0.08, R[1]); p.style.width = ((R[2] * 0.92) / W) * 100 + "%"; p.style.height = (R[3] / H) * 100 + "%"; } }
    { const g = loopGeom(box("pipe")), d = g.rn + 14;
      place(P("n0"), g.nodes[0][0] + d, g.nodes[0][1]); place(P("n1"), g.nodes[1][0], g.nodes[1][1] + d);
      place(P("n2"), g.nodes[2][0] - d, g.nodes[2][1]); place(P("n3"), g.nodes[3][0], g.nodes[3][1] - d); }
  }

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    const nm = w / h < 0.95 || w < 760 ? "P" : "L";
    if (!first) { const sx = w / W, sy = h / H; for (let i = 0; i < N; i++) { px[i] *= sx; py[i] *= sy; } }
    else { for (let i = 0; i < N; i++) { px[i] = rA[i] * w; py[i] = rB[i] * h; pr[i] = 1; pa[i] = 0; pc[i * 3] = 243; pc[i * 3 + 1] = 238; pc[i * 3 + 2] = 248; } }
    first = false; W = w; H = h; mode = nm; stage.dataset.mode = nm; root.dataset.mode = nm;
    K = Math.max(0.7, Math.min(1.15, W / 1400));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    layout();
  }

  /* where the scroll has got to */
  const cum = []; { let a = 0; SCENES.forEach((s) => { cum.push(a); a += s.len; }); }
  let cur = -1, enterAt = 0, prog = 0;
  function readScroll() {
    const navH = parseFloat(getComputedStyle(root).getPropertyValue("--navh")) || 0;
    const runTop = run.getBoundingClientRect().top + window.scrollY;
    const stageH = stage.offsetHeight || 1, D = Math.max(1, run.offsetHeight - stageH);
    const s0 = window.scrollY - (runTop - navH), s = (Math.max(0, Math.min(D, s0)) / D) * SCROLL_SCREENS;
    let k = SCENES.length - 1;
    for (let j = 0; j < SCENES.length; j++) if (s < cum[j] + SCENES[j].len) { k = j; break; }
    prog = cl((s - cum[k]) / SCENES[k].len);
    if (k !== cur) {
      cur = k; enterAt = performance.now();
      scenes.forEach((el, j) => { el.classList.toggle("on", j === k); if (j !== k) el.querySelectorAll(".rv").forEach((e) => e.classList.remove("in")); });
      onScene && onScene(k);
    }
  }

  let raf = 0, last = performance.now(), visible = true, T0 = performance.now();
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const s = SCENES[cur], el = scenes[cur];
    const lt = reduce ? s.dur : Math.max((now - enterAt) / 1000, prog * s.dur);
    const T = reduce ? 0 : (now - T0) / 1000;
    F[s.form](box(s.box), lt, T);

    el.querySelectorAll(".rv").forEach((e) => { if (!e.classList.contains("in") && lt >= +(e.dataset.at || 0)) e.classList.add("in"); });
    if (s.id === "atlas" && ptext) { const n = Math.max(0, Math.min(PRISM_Q.length, Math.floor((lt - 1.2) * 26))); if (ptext.textContent.length !== n) ptext.textContent = PRISM_Q.slice(0, n); }
    if (s.id === "lens" && c1) { const adv = lt >= 3.8; c1.classList.toggle("on", !adv); c2.classList.toggle("on", adv); st1.classList.toggle("off", adv); st2.classList.toggle("off", !adv); }
    if (s.id === "constellation") { y10 && y10.classList.toggle("hot", lt >= 3.4); yls.forEach((e) => { if (e !== y10) e.classList.toggle("dim", lt >= 4.2); }); }

    for (let i = 0; i < N; i++) {
      if (snap[i] || reduce) { px[i] = tx[i]; py[i] = ty[i]; pr[i] = tr[i]; pa[i] = reduce ? ta[i] : mix(pa[i], ta[i], 1 - Math.exp(-dt * 6)); }
      else {
        const e = 1 - Math.exp(-dt * (2.2 + rD[i] * 2.2));
        px[i] += (tx[i] - px[i]) * e; py[i] += (ty[i] - py[i]) * e; pr[i] += (tr[i] - pr[i]) * e; pa[i] += (ta[i] - pa[i]) * Math.min(1, e * 1.6);
      }
      const ec = reduce ? 1 : 1 - Math.exp(-dt * 4);
      for (let c = 0; c < 3; c++) pc[i * 3 + c] += (tc[i * 3 + c] - pc[i * 3 + c]) * ec;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = 0; i < N; i++) {
      const a = pa[i]; if (a < 0.01) continue;
      ctx.fillStyle = "rgb(" + (pc[i * 3] | 0) + "," + (pc[i * 3 + 1] | 0) + "," + (pc[i * 3 + 2] | 0) + ")";
      if (pr[i] > 2.3) { ctx.globalAlpha = a * 0.13; ctx.beginPath(); ctx.arc(px[i], py[i], pr[i] * 3.2, 0, 6.2832); ctx.fill(); }
      ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(px[i], py[i], pr[i], 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (visible) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  const ro = new ResizeObserver(() => { resize(); readScroll(); kick(); });
  ro.observe(stage);
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; kick(); });
  io.observe(run);
  const onScroll = () => { readScroll(); kick(); };
  window.addEventListener("scroll", onScroll, { passive: true });
  resize(); readScroll(); kick();

  return {
    /* scroll to a scene; at = how far into it (0 to 1) */
    goTo(id, at = 0.02) {
      const k = SCENES.findIndex((s) => s.id === id); if (k < 0) return;
      const navH = parseFloat(getComputedStyle(root).getPropertyValue("--navh")) || 0;
      const runTop = run.getBoundingClientRect().top + window.scrollY, stageH = stage.offsetHeight, D = run.offsetHeight - stageH;
      const y = runTop - navH + ((cum[k] + SCENES[k].len * at) / SCROLL_SCREENS) * D;
      window.scrollTo({ top: Math.ceil(y), behavior: reduce ? "auto" : "smooth" });
    },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener("scroll", onScroll); },
  };
}
