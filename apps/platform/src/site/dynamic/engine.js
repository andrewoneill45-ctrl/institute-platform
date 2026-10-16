/* Dynamic Schools: the canvas engine.
   Quadrant view: average Attainment 8 step change over the latest three results years across, Progress 8 up.
   The Dynamic Schools quadrant (top right) takes most of the canvas; the other three are
   compressed toward the edges. Map view: the same dots glide to their place in England.
   Only Dynamic Schools can be hovered or chosen; every other school stays an unnamed dot. */

export const QNAME = { R: "Dynamic schools", S: "Strong & steady", I: "Improving from low", D: "Declining" };
const INK = "#221233", MUTED = "#6F6580", PURPLE = "#6A0CA0", GOLD = "#C6A035", PAPER = "#FFFFFF";
const SERIF = '"Fraunces", Georgia, serif', SANS = '"Inter", -apple-system, "Segoe UI", sans-serif';
const sign = (v, d = 1) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(d);

export function prepare(raw) {
  const M = raw.meta, F = M.fields;
  const LON0 = -1.6, LAT0 = 52.6, KX = 111 * Math.cos(LAT0 * Math.PI / 180), KY = 111;
  const toX = (lon) => (lon - LON0) * KX, toY = (lat) => (lat - LAT0) * KY;
  const dyn = raw.D.map((r, i) => {
    const o = { q: "R", rank: i + 1 }; F.forEach((k, j) => (o[k] = r[j]));
    o.a = M.years.map((y) => o["a" + y]); const n = o.a.length;
    o.sLast = o.a[n - 1] - o.a[n - 2]; o.sPrev = o.a[n - 2] - o.a[n - 3]; o.dPre = o.a[n - 1] - o.a[0]; o.y = o.p8;
    o.X = toX(o.lon); o.Y = toY(o.lat); return o;
  });
  const others = raw.O.map(([q, x, y, lat, lon, fsm]) => ({ q, x, y, fsm, X: toX(lon), Y: toY(lat) }));
  const bg = []; for (let i = 0; i < raw.BG.length; i += 2) bg.push({ X: toX(raw.BG[i] / 1000 - 6), Y: toY(raw.BG[i + 1] / 1000 + 49.8) });
  // relief: elevation from local density of school sites
  const CELL = 5, gx0 = -420, gy0 = -360, GW = 170, GH = 190; let grid = new Float32Array(GW * GH);
  for (const p of bg) { const gi = Math.floor((p.X - gx0) / CELL), gj = Math.floor((p.Y - gy0) / CELL); if (gi >= 0 && gj >= 0 && gi < GW && gj < GH) grid[gj * GW + gi]++; }
  for (let pass = 0; pass < 3; pass++) { const g2 = new Float32Array(GW * GH);
    for (let j = 1; j < GH - 1; j++) for (let i = 1; i < GW - 1; i++) { let t = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) t += grid[(j + b) * GW + i + a] * ((a && b) ? 0.5 : (a || b) ? 1 : 2); g2[j * GW + i] = t / 8; }
    grid = g2; }
  let gmax = 0; for (const v of grid) gmax = Math.max(gmax, v);
  const elev = (X, Y) => { const gi = Math.floor((X - gx0) / CELL), gj = Math.floor((Y - gy0) / CELL); if (gi < 0 || gj < 0 || gi >= GW || gj >= GH) return 0; return Math.sqrt(grid[gj * GW + gi] / gmax) * 26; };
  for (const p of bg) { p.Z = elev(p.X, p.Y); p.t = p.Z / 26; }
  for (const s of dyn) s.Z0 = elev(s.X, s.Y);
  for (const s of others) s.Z0 = elev(s.X, s.Y);
  const all = [...others, ...dyn];
  const byQ = { R: dyn, S: [], I: [], D: [] }; others.forEach((s) => byQ[s.q].push(s));
  return { M, dyn, others, all, byQ, bg };
}

export function createEngine(canvas, data, { onSelect, onHover } = {}) {
  const { M, dyn, byQ, bg } = data;
  const XMAX = M.xmax, YMAX = M.ymax, SPLIT_X = 0.27, SPLIT_Y = 0.30;
  const g = canvas.getContext("2d");
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PITCH = 0.98, YAW = -0.10, DIST = 1100, cp = Math.cos(PITCH), sp = Math.sin(PITCH), cy = Math.cos(YAW), sy = Math.sin(YAW);
  let W = 0, H = 0, DPR = 1, fitS = 1, plot = { l: 0, r: 0, t: 0, b: 0 };
  const cam = { x: 0, y: -20, s: 1 }, tgt = { x: 0, y: -20, s: 1 };
  let mode = 0, modeT = 0, selected = dyn[0], hover = null, raf = 0, morphFrom = 0, morphStart = 0, dead = false;
  const L = { R: true, S: true, I: true, D: true, relief: true, fsm: false };

  const project = (X, Y, Z) => {
    const x = X - cam.x, y = Y - cam.y, xr = x * cy - y * sy, yr = x * sy + y * cy;
    const f = DIST / Math.max(DIST * 0.25, DIST + yr * sp);
    return [W / 2 + xr * cam.s * f, H * 0.56 - (yr * cp + Z) * cam.s * f, f];
  };
  const qx = (v) => { v = Math.max(-XMAX, Math.min(XMAX, v)); const w = plot.r - plot.l, o = plot.l + w * SPLIT_X; return v < 0 ? o + (v / XMAX) * w * SPLIT_X : o + (v / XMAX) * w * (1 - SPLIT_X); };
  const qy = (v) => { v = Math.max(-YMAX, Math.min(YMAX, v)); const h = plot.b - plot.t, o = plot.b - h * SPLIT_Y; return v < 0 ? o - (v / YMAX) * h * SPLIT_Y : o - (v / YMAX) * h * (1 - SPLIT_Y); };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect(); W = r.width; H = r.height;
    if (!W || !H) return;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    const narrow = W < 560;
    fitS = Math.min(W / 560, H / 360);
    plot = { l: narrow ? 50 : 76, r: W - (narrow ? 16 : 28), t: narrow ? 26 : 30, b: H - (narrow ? 46 : 52) };
    if (!resize.done) { cam.s = tgt.s = fitS; resize.done = true; }
    if (mode === 1 && modeT === 1 && tgt.s < fitS) tgt.s = cam.s = fitS;
    draw();
  }

  function draw() {
    if (!W) return;
    const t = ease(modeT); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    const zs = Math.max(0.8, Math.min(2.4, cam.s / fitS));
    if (t < 1) frame(1 - t);
    if (t > 0 && L.relief) {
      g.globalAlpha = t;
      for (const p of bg) { const q = project(p.X, p.Y, p.Z); if (q[0] < -4 || q[0] > W + 4 || q[1] < -4 || q[1] > H + 4) continue;
        const sz = (0.9 + 1.3 * p.t) * q[2] * zs;
        g.fillStyle = `rgba(${Math.round(150 - 80 * p.t)},${Math.round(136 - 90 * p.t)},${Math.round(170 - 70 * p.t)},${0.16 + 0.45 * p.t})`;
        g.fillRect(q[0] - sz / 2, q[1] - sz / 2, sz, sz); }
      g.globalAlpha = 1;
    }
    for (const k of ["D", "I", "S", "R"]) {
      for (const s of byQ[k]) {
        if (!L[k]) { s._p = null; continue; }
        let p = [qx(s.x), qy(s.y)];
        if (t > 0) { const m = project(s.X, s.Y, s.Z0); p = [p[0] + (m[0] - p[0]) * t, p[1] + (m[1] - p[1]) * t]; }
        s._p = p; if (p[0] < -10 || p[0] > W + 10 || p[1] < -10 || p[1] > H + 10) continue;
        const r = (L.fsm && s.fsm != null ? 1.2 + s.fsm / 14 : 2.3) * (t > 0 ? 1 + t * (zs - 1) * 0.5 : 1) * (k === "R" ? 1.3 : (1 - t) * 0.6 + t * 0.95);
        g.beginPath(); g.arc(p[0], p[1], k === "D" ? r * 0.85 : r, 0, 7);
        if (k === "R") { g.fillStyle = PURPLE; g.fill(); }
        else if (k === "S") { g.fillStyle = "rgba(34,18,51,.62)"; g.fill(); }
        else if (k === "I") { g.strokeStyle = "rgba(106,12,160,.75)"; g.lineWidth = 1; g.stroke(); }
        else { g.fillStyle = "rgba(167,159,181,.6)"; g.fill(); }
      }
    }
    if (hover && hover._p && hover !== selected) { g.strokeStyle = INK; g.lineWidth = 1.2; g.beginPath(); g.arc(hover._p[0], hover._p[1], 6.5, 0, 7); g.stroke(); }
    reticle(t);
  }

  function frame(a) {
    g.save(); g.globalAlpha = a;
    const ox = qx(0), oy = qy(0);
    g.fillStyle = "rgba(106,12,160,.045)"; g.fillRect(ox, plot.t, plot.r - ox, oy - plot.t);
    for (let x = plot.l; x <= plot.r; x += x < ox ? 7 : 12) for (let y = plot.t; y <= plot.b; y += y > oy ? 7 : 12) {
      const inDyn = x > ox && y < oy;
      g.fillStyle = inDyn ? "rgba(106,12,160,.16)" : "rgba(111,101,128,.13)"; g.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
    }
    g.strokeStyle = "rgba(34,18,51,.5)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(plot.l, oy); g.lineTo(plot.r, oy); g.moveTo(ox, plot.t); g.lineTo(ox, plot.b); g.stroke();
    const corner = (txt, n, x, y, al, col, big) => {
      g.textAlign = al; g.fillStyle = col; g.font = `${big ? "italic 500 20px" : "italic 500 14px"} ${SERIF}`; g.fillText(txt, x, y);
      g.fillStyle = MUTED; g.font = `500 10px ${SANS}`; g.fillText(n, x, y + (big ? 16 : 14)); };
    const c = M.counts;
    corner("Dynamic schools", `${c.R} SCHOOLS`, plot.r - 56, plot.t + 22, "right", PURPLE, true);
    corner("Strong & steady", `${c.S} SCHOOLS`, plot.l + 8, plot.t + 18, "left", INK);
    corner("Improving from low", `${c.I} SCHOOLS`, plot.r - 8, plot.b - 22, "right", INK);
    corner("Declining", `${c.D} SCHOOLS`, plot.l + 8, plot.b - 22, "left", MUTED);
    g.font = `500 10px ${SANS}`; g.fillStyle = INK; g.strokeStyle = "rgba(34,18,51,.55)";
    const lx = plot.l - 12; g.textAlign = "right";
    for (let i = -Math.round(YMAX * 4); i <= Math.round(YMAX * 4); i++) { if (i < 0 && i % 2) continue;
      const v = i / 4, y = qy(v), major = i % 2 === 0;
      g.beginPath(); g.moveTo(lx, y); g.lineTo(lx + (major ? 10 : 5), y); g.stroke();
      if (major) { g.fillStyle = i === 0 ? PURPLE : INK; g.fillText(i === 0 ? "0" : sign(v, 1), lx - 4, y + 3.5); } }
    g.save(); g.translate(16, (plot.t + plot.b) / 2); g.rotate(-Math.PI / 2); g.textAlign = "center"; g.fillStyle = MUTED; g.font = `600 9.5px ${SANS}`; g.fillText("PROGRESS 8 · 2024", 0, 0); g.restore();
    const by = plot.b + 8; g.textAlign = "center"; g.font = `500 10px ${SANS}`;
    const U = XMAX <= 3 ? 0.5 : 1, dp = U < 1 ? 1 : 0;  /* labelled every U, minor ticks every U/2 */
    for (let i = -Math.round(XMAX / U) * 2; i <= Math.round(XMAX / U) * 2; i++) { if (i < 0 && i % 2) continue;
      const v = (i * U) / 2, x = qx(v), major = i < 0 ? i % 4 === 0 : i % 2 === 0;
      g.beginPath(); g.moveTo(x, by); g.lineTo(x, by + (major ? 9 : 5)); g.stroke();
      if (major) { g.fillStyle = v === 0 ? PURPLE : INK; g.fillText(v === 0 ? "0" : sign(v, dp), x, by + 21); } }
    g.fillStyle = MUTED; g.font = `600 9.5px ${SANS}`; g.textAlign = "left"; g.fillText("ATTAINMENT 8 TREND, POINTS A YEAR · " + M.years[0] + " (PRE-PANDEMIC), " + M.years.slice(1).join(", "), plot.l, by + 37);
    g.textAlign = "right"; g.font = `9.5px ${SANS}`; g.fillText("scale compressed left of 0 and below 0", plot.r, by + 37);
    g.restore();
  }

  function reticle(t) {
    if (!selected || !selected._p) return;
    const [mx, my] = selected._p, R = 50, L2 = 14;
    g.strokeStyle = "rgba(34,18,51,.16)"; g.lineWidth = 1; g.beginPath();
    g.moveTo(0, my); g.lineTo(mx - R - 6, my); g.moveTo(mx + R + 6, my); g.lineTo(W, my); g.moveTo(mx, 0); g.lineTo(mx, my - R - 6); g.moveTo(mx, my + R + 6); g.lineTo(mx, H); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 1.3; g.beginPath();
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, c]) => { const x = mx + a * R, y = my + c * R; g.moveTo(x, y - c * L2); g.lineTo(x, y); g.lineTo(x - a * L2, y); }); g.stroke();
    g.setLineDash([3, 3]); g.strokeStyle = "rgba(34,18,51,.5)"; g.beginPath(); g.arc(mx, my, 20, 0, 7); g.stroke(); g.setLineDash([]);
    g.fillStyle = GOLD; g.beginPath(); g.arc(mx, my, 5, 0, 7); g.fill(); g.strokeStyle = PAPER; g.lineWidth = 1.6; g.stroke();
    if (t > 0.5) { g.font = `600 12px ${SANS}`; g.fillStyle = INK; g.textAlign = "center"; g.fillText("N", mx, my - R - 8); }
    g.font = `600 10.5px ${SANS}`; g.textAlign = "left";
    const tag = selected.name, tw = Math.min(g.measureText(tag).width, 260);
    let tx = mx + R + 10, ty = my - R + 8; if (tx + tw + 14 > W) tx = mx - R - tw - 24;
    g.fillStyle = PURPLE; g.beginPath(); g.roundRect ? g.roundRect(tx, ty - 11, tw + 14, 18, 9) : g.rect(tx, ty - 11, tw + 14, 18); g.fill();
    g.fillStyle = "#fff"; g.save(); g.beginPath(); g.rect(tx, ty - 12, tw + 10, 20); g.clip(); g.fillText(tag, tx + 7, ty + 2); g.restore();
  }

  function tick(now) {
    let moving = false;
    if (modeT !== mode) { const p = Math.min(1, (now - morphStart) / (reduce ? 1 : 1250)); modeT = morphFrom + (mode - morphFrom) * p; if (p < 1) moving = true; else modeT = mode; }
    const k = reduce ? 1 : 0.14;
    for (const p of ["x", "y", "s"]) { const d = tgt[p] - cam[p]; if (Math.abs(d) > (p === "s" ? 0.0005 : 0.05)) { cam[p] += d * k; moving = true; } else cam[p] = tgt[p]; }
    draw(); raf = moving && !dead ? requestAnimationFrame(tick) : 0;
  }
  const go = () => { if (!raf && !dead) raf = requestAnimationFrame(tick); };

  // interaction: only Dynamic Schools respond
  const nearest = (px, py, maxd) => { let best = null, bd = maxd; for (const s of dyn) { if (!s._p) continue; const d = Math.hypot(px - s._p[0], py - s._p[1]); if (d < bd) { bd = d; best = s; } } return best; };
  let drag = null;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const onDown = (e) => { drag = { x: e.clientX, y: e.clientY, cx: tgt.x, cy: tgt.y, moved: false }; canvas.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => {
    const [px, py] = pos(e);
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      if (drag.moved && mode === 1 && modeT === 1) { const xr = -dx / cam.s, yr = dy / (cam.s * cp); tgt.x = cam.x = drag.cx + xr * cy + yr * sy; tgt.y = cam.y = drag.cy - xr * sy + yr * cy; draw(); } return; }
    if (e.pointerType === "touch") return;
    const h = nearest(px, py, 9);
    if (h !== hover) { hover = h; canvas.style.cursor = h ? "pointer" : (mode === 1 ? "grab" : "default"); draw(); }
    onHover && onHover(h, px, py);
  };
  const onUp = (e) => { if (drag && !drag.moved) { const [px, py] = pos(e); const s = nearest(px, py, e.pointerType === "touch" ? 18 : 12); if (s) select(s, false); } drag = null; };
  const onLeave = () => { if (hover) { hover = null; draw(); } onHover && onHover(null); };
  const onWheel = (e) => { if (mode !== 1) return; e.preventDefault(); tgt.s = Math.max(fitS * 0.7, Math.min(fitS * 9, tgt.s * Math.exp(-e.deltaY * 0.0016))); go(); };
  canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp); canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  const ro = new ResizeObserver(() => resize()); ro.observe(canvas);

  function select(s, fly = true) {
    selected = s;
    if (mode === 1 && fly) { tgt.x = s.X; tgt.y = s.Y + 6; tgt.s = Math.max(tgt.s, fitS * 2.2); }
    go(); onSelect && onSelect(s);
  }
  function setMode(m) {
    if (m === mode) return; morphFrom = modeT; mode = m; morphStart = performance.now();
    if (m === 1) { tgt.x = cam.x = 0; tgt.y = cam.y = -20; tgt.s = cam.s = fitS; }
    canvas.style.cursor = m ? "grab" : "default"; go();
  }
  resize();
  return {
    select, setMode, resize,
    setLayers(o) { Object.assign(L, o); draw(); },
    step(dir) { let i = dyn.indexOf(selected); i = i < 0 ? 0 : (i + dir + dyn.length) % dyn.length; select(dyn[i]); },
    destroy() { dead = true; cancelAnimationFrame(raf); ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp); canvas.removeEventListener("pointerleave", onLeave); canvas.removeEventListener("wheel", onWheel); },
  };
}
