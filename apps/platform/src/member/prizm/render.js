/* Prizm's hand, second cut — the Westminster report's visual language,
   generalised. Pure string builders shared by the studio's live preview and
   the downloaded single-file report: wordmark cover, kick rows, stat tiles,
   column and dumbbell charts with reference lines and tooltips, computed
   narrative headlines, and collapsible tables for the full data. */

import { VINTAGE, VINTAGE_KS2, scopeLabel, r1 } from "./engine.js";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const f1 = (v) => (v == null ? "–" : (Math.round(v * 10) / 10).toFixed(1));
const f0 = (v) => (v == null ? "–" : Math.round(v) + "%");
const sign = (v, dp = 1) => (v == null ? "–" : (v > 0 ? "+" : "") + v.toFixed(dp));
const short = (s, n = 30) => { const t = String(s || "").replace(/\s*(Catholic|Church of England|CofE|C of E)?\s*(School|College|Academy|High School)$/i, "").trim() || s; return t.length > n ? t.slice(0, n - 1) + "…" : t; };

const QUAT = "M31.5 31.5 A 18.5 18.5 0 1 1 68.5 31.5 A 18.5 18.5 0 1 1 68.5 68.5 A 18.5 18.5 0 1 1 31.5 68.5 A 18.5 18.5 0 1 1 31.5 31.5 Z";
const quat = (stroke, w = 7) => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${QUAT}" fill="none" stroke="${stroke}" stroke-width="${w}"/></svg>`;
export const WORDMARK = `<span class="pz-wordmark">inst<span class="ti">&#305;${quat("var(--purple)", 11)}</span>tute</span>`;
const kick = (label) => `<div class="pz-kick">${quat("var(--gold)")}<span>${esc(label)}</span></div>`;

function niceTicks(min, max, n = 5) {
  const span = max - min || 1;
  const step = [0.5, 1, 2, 2.5, 5, 10, 20, 25, 50].find((s) => span / s <= n) || Math.ceil(span / n);
  const t = []; for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) t.push(+v.toFixed(2));
  return t;
}
const tip = (lines) => `<title>${esc(lines.join("\n"))}</title>`;

/* rotated labels need room proportional to the longest name drawn */
function labelSpace(rows, cw) {
  const chars = Math.max(8, ...rows.map((r) => short(r.label, cw > 20 ? 30 : 20).length));
  const px = chars * 5.8 + 10;
  return { lab: Math.min(172, Math.round(px * 0.82) + 12), padL: Math.max(0, Math.round(px * 0.58) - cw / 2) };
}

/* ── the chart kit ─────────────────────────────────────────────────────── */

/* columns: rows [{label, v, tipLines}] sorted; refs [{v,label,color,dy}] */
function columnsSvg({ rows, refs = [], min, max, unit = "", dp = 1 }) {
  const W = 1152, pr = 104, pt = 16, ph = 330;
  const cw0 = (W - 60 - pr) / rows.length;
  const { lab, padL } = labelSpace(rows, cw0);
  const pl = 60 + padL, H = pt + ph + lab;
  const cw = (W - pl - pr) / rows.length;
  const y = (v) => pt + ph * (1 - (v - min) / (max - min));
  let s = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img">`;
  niceTicks(min, max).forEach((t) => { s += `<line class="gridl" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/><text class="tick" x="${pl - 6}" y="${y(t) + 3.5}" text-anchor="end">${t}${unit}</text>`; });
  rows.forEach((r, i) => {
    const x = pl + i * cw, bw = Math.min(cw * 0.66, 26), bx = x + (cw - bw) / 2;
    if (r.v != null) {
      s += `<g>${tip(r.tipLines)}<rect x="${bx.toFixed(1)}" y="${y(r.v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(y(min) - y(r.v)).toFixed(1)}" fill="var(--purple)" opacity="${r.dim ? 0.35 : 0.9}"/></g>`;
      if (cw > 17) s += `<text class="val" x="${(x + cw / 2).toFixed(1)}" y="${(y(r.v) - 4).toFixed(1)}" text-anchor="middle">${r.v.toFixed(dp)}</text>`;
    }
    if (cw > 11) s += `<text class="lab" transform="translate(${(x + cw / 2 + 3).toFixed(1)},${pt + ph + 8}) rotate(-55)" text-anchor="end">${esc(short(r.label, cw > 20 ? 30 : 20))}</text>`;
  });
  /* spread reference labels */
  const rs = refs.slice().sort((a, b) => y(b.v) - y(a.v)); rs.forEach((rf, i) => { if (i > 0) { const gap = (y(rs[i - 1].v) + (rs[i - 1].dy || 0)) - (y(rf.v) + (rf.dy || 0)); if (gap < 13) rf.dy = (rf.dy || 0) - (13 - gap); } });
  refs.forEach((rf) => { const yy = y(rf.v); s += `<line x1="${pl}" x2="${W - pr + 6}" y1="${yy}" y2="${yy}" stroke="${rf.color}" stroke-width="1.6" stroke-dasharray="5 4"/><text class="reftxt" x="${W - pr + 10}" y="${yy + (rf.dy || 0) + 4}" style="fill:${rf.color}">${rf.label} ${rf.v.toFixed(1)}${unit}</text>`; });
  return s + "</svg>";
}

/* dumbbells: rows [{label, a, b, tipLines, faint}]; mode change (a→b) or gap (a=dis gold, b=non purple) */
function dumbbellsSvg({ rows, min, max, unit = "", mode = "change", refs = [] }) {
  const W = 1152, pr = mode === "gap" ? 104 : 20, pt = 14, ph = 320;
  const cw0 = (W - 60 - pr) / rows.length;
  const { lab, padL } = labelSpace(rows, cw0);
  const pl = 60 + padL, H = pt + ph + lab;
  const cw = (W - pl - pr) / rows.length;
  const y = (v) => pt + ph * (1 - (v - min) / (max - min));
  let s = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img">`;
  niceTicks(min, max).forEach((t) => { s += `<line class="gridl" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/><text class="tick" x="${pl - 6}" y="${y(t) + 3.5}" text-anchor="end">${t}${unit}</text>`; });
  refs.forEach((rf) => { const yy = y(rf.v); s += `<line x1="${pl}" x2="${W - pr + 6}" y1="${yy}" y2="${yy}" stroke="${rf.color}" stroke-width="1.4" stroke-dasharray="5 4"/><text class="reftxt" x="${W - pr + 10}" y="${yy + 4}" style="fill:${rf.color}">${rf.label} ${rf.v.toFixed(1)}${unit}</text>`; });
  rows.forEach((r, i) => {
    const cx = pl + i * cw + cw / 2;
    if (r.a != null && r.b != null) {
      s += `<g opacity="${r.faint ? 0.38 : 1}">${tip(r.tipLines)}`;
      if (mode === "change") {
        const c = r.b >= r.a ? "var(--up)" : "var(--down)";
        s += `<line x1="${cx}" x2="${cx}" y1="${y(r.a)}" y2="${y(r.b)}" stroke="${c}" stroke-width="2.4"/><circle cx="${cx}" cy="${y(r.a)}" r="3.4" fill="var(--paper)" stroke="${c}" stroke-width="1.6"/><circle cx="${cx}" cy="${y(r.b)}" r="4.2" fill="${c}"/>`;
      } else {
        s += `<line x1="${cx}" x2="${cx}" y1="${y(r.a)}" y2="${y(r.b)}" stroke="var(--muted)" stroke-opacity=".5" stroke-width="2"/><circle cx="${cx}" cy="${y(r.b)}" r="4.2" fill="var(--purple)"/><circle cx="${cx}" cy="${y(r.a)}" r="4.2" fill="var(--gold)"/>`;
      }
      s += "</g>";
    }
    if (cw > 11) s += `<text class="lab" transform="translate(${(cx + 3).toFixed(1)},${pt + ph + 8}) rotate(-55)" text-anchor="end">${esc(short(r.label, cw > 20 ? 30 : 20))}</text>`;
  });
  return s + "</svg>";
}

/* if a cohort is too wide for legible columns, keep the two ends */
function capRows(rows, cap = 44) {
  if (rows.length <= cap) return { rows, capped: false };
  const half = Math.floor(cap / 2);
  return { rows: [...rows.slice(0, half), ...rows.slice(-half)], capped: rows.length - cap };
}

const legend = (items) => `<div class="pz-legend">${items.map(([c, t]) => `<span><i style="background:${c}"></i>${esc(t)}</span>`).join("")}</div>`;

function section(label, headline, note, body) {
  return `<section class="pz-block">${kick(label)}<h2>${headline}</h2>${note ? `<p class="pz-note">${note}</p>` : ""}${body}</section>`;
}

/* ── blocks ────────────────────────────────────────────────────────────── */

function headlinesHtml(d) {
  if (d.kind === "ks2") {
    const vsNat = d.rwmMean != null && d.bench.rwmMean != null ? r1(d.rwmMean - d.bench.rwmMean) : null;
    const tiles = [
      { n: d.rwmMean != null ? Math.round(d.rwmMean) + "<small>%</small>" : "–", p: `of pupils reached the expected standard in reading, writing and maths, against ${f0(d.bench.rwmMean)} in England.`, c: vsNat != null ? `${sign(vsNat)} pts vs England · drift ${sign(d.drift)} on 2023/24` : "" },
      { n: d.highMean != null ? Math.round(d.highMean) + "<small>%</small>" : "–", p: `reached the higher standard in all three, against a national school median of ${f0(d.bench.highMed)}.`, c: `reading score mean ${f1(d.readMean)} · England median ${f1(d.bench.readMed)}` },
      { n: String(d.aboveNat), p: `of the ${d.n} schools sit at or above England's median RWM of ${f0(d.bench.rwmMed)}.`, c: d.las > 1 ? `${d.las} local authorities` : "one local authority" },
      { n: d.fsmMean != null ? f1(d.fsmMean) + "<small>%</small>" : "–", p: "mean whole-school FSM across the scope: the context the results were earned in.", c: "KS2 2024/25, the latest published" },
    ];
    return section("Headlines", "The scope in four numbers.", null,
      `<div class="pz-tiles">${tiles.map((t) => `<div class="pz-tile"><div class="n">${t.n}</div><p>${t.p}</p>${t.c ? `<div class="cmp">${t.c}</div>` : ""}</div>`).join("")}</div>`);
  }
  const vsNat = d.a8Mean != null && d.bench.a8Mean != null ? r1(d.a8Mean - d.bench.a8Mean) : null;
  const tiles = [
    { n: f1(d.a8Mean), p: `Attainment 8 across the scope (unweighted school mean), against ${f1(d.bench.a8Mean)} in England.`, c: vsNat != null ? `${sign(vsNat)} points vs England · drift ${sign(d.drift)} on 2024/25` : "" },
    { n: d.b95Mean != null ? Math.round(d.b95Mean) + "<small>%</small>" : "–", p: `of pupils at grade 5+ in English and maths, against a national school median of ${f0(d.bench.b95Med)}.`, c: `4+ mean ${f0(d.b94Mean)} · England median ${f0(d.bench.b94Med)}` },
    { n: String(d.aboveNat), p: `of the ${d.n} schools sit at or above England's median Attainment 8 of ${f1(d.bench.a8Med)}.`, c: d.las > 1 ? `${d.las} local authorities` : "one local authority" },
    { n: d.fsmMean != null ? f1(d.fsmMean) + "<small>%</small>" : "–", p: "mean whole-school FSM across the scope: the context the results were earned in.", c: "2025/26 provisional throughout" },
  ];
  return section("Headlines", "The scope in four numbers.", null,
    `<div class="pz-tiles">${tiles.map((t) => `<div class="pz-tile"><div class="n">${t.n}</div><p>${t.p}</p>${t.c ? `<div class="cmp">${t.c}</div>` : ""}</div>`).join("")}</div>`);
}

function cohortHtml(d) {
  if (d.kind === "ks2") return ks2CohortHtml(d);
  const ranked = d.rows.filter((r) => r.a8 != null).sort((a, b) => b.a8 - a.a8);
  if (!ranked.length) return "";
  const { rows: shown, capped } = capRows(ranked.map((r) => ({
    label: r.name, v: r.a8,
    tipLines: [r.name, `Attainment 8 ${f1(r.a8)} (${sign(r.d)} on 2024/25)`, `4+ E&M ${f0(r.b94)} · 5+ ${f0(r.b95)} · FSM ${r.fsm == null ? "–" : f1(r.fsm) + "%"}`],
  })));
  const above = ranked.filter((r) => r.a8 >= d.bench.a8Med).length;
  const headline = above === ranked.length
    ? `Every one of the ${ranked.length} schools sits at or above England's median, from ${f1(ranked[ranked.length - 1].a8)} to ${f1(ranked[0].a8)}.`
    : `${above} of ${ranked.length} schools ${above === 1 ? "sits" : "sit"} at or above England's median, from ${f1(ranked[ranked.length - 1].a8)} to ${f1(ranked[0].a8)}.`;
  const chart = columnsSvg({ rows: shown, min: Math.max(0, Math.floor((ranked[ranked.length - 1].a8 - 6) / 10) * 10), max: Math.min(90, Math.ceil((ranked[0].a8 + 6) / 10) * 10), refs: [{ v: d.a8Mean, label: "Scope", color: "var(--gold)" }, { v: d.bench.a8Med, label: "England", color: "var(--nat)" }] });
  /* the full data, grouped by LA, folded away */
  const by = {}; d.rows.forEach((r) => { (by[r.la || "Other"] = by[r.la || "Other"] || []).push(r); });
  const groups = Object.keys(by).sort();
  const tbl = (rows) => `<table class="pz-table"><thead><tr><th>School</th><th>FSM</th><th>A8</th><th>vs 24/25</th><th>4+ E&amp;M</th><th>5+ E&amp;M</th><th>P8 (2024)</th></tr></thead><tbody>${rows.map((r) => `<tr><td class="nm">${esc(r.name)}</td><td>${r.fsm == null ? "–" : f1(r.fsm) + "%"}</td><td class="num">${f1(r.a8)}</td><td class="num" style="color:${r.d == null ? "var(--muted)" : r.d >= 0.05 ? "var(--up)" : r.d <= -0.05 ? "var(--down)" : "var(--muted)"}">${sign(r.d)}</td><td class="num">${f0(r.b94)}</td><td class="num">${f0(r.b95)}</td><td class="num">${r.p8prev == null ? "–" : (r.p8prev > 0 ? "+" : "") + r.p8prev.toFixed(2)}</td></tr>`).join("")}</tbody></table>`;
  const inner = groups.length > 1
    ? groups.map((g) => `<details class="pz-fold"${groups.length <= 3 ? " open" : ""}><summary>${esc(g)}<span>${by[g].length} school${by[g].length === 1 ? "" : "s"}</span></summary>${tbl(by[g].sort((a, b) => (b.a8 ?? -1) - (a.a8 ?? -1)))}</details>`).join("")
    : `<details class="pz-fold"${d.rows.length <= 30 ? " open" : ""}><summary>The full table<span>${d.rows.length} schools</span></summary>${tbl(ranked)}</details>`;
  /* more than a handful of authorities: the whole list folds away behind one line */
  const details = groups.length > 3
    ? `<details class="pz-fold pz-master"><summary>Every school, authority by authority<span>${d.rows.length} schools · ${groups.length} authorities</span></summary><div class="pz-master-body">${inner}</div></details>`
    : inner;
  return section("The cohort", headline,
    (capped ? `The chart shows the top and bottom ${shown.length / 2} of ${ranked.length} schools; ` : "") + "every school, with the full table folded beneath. Arrows compare 2025/26 provisional with 2024/25.",
    chart + legend([["var(--purple)", "School"], ["var(--gold)", `Scope mean ${f1(d.a8Mean)}`], ["var(--nat)", `England median ${f1(d.bench.a8Med)}`]]) + details);
}

/* the primary cohort: RWM expected standard, ranked, grouped by authority */
function ks2CohortHtml(d) {
  const ranked = d.rows.filter((r) => r.rwm != null).sort((a, b) => b.rwm - a.rwm);
  if (!ranked.length) return "";
  const { rows: shown, capped } = capRows(ranked.map((r) => ({
    label: r.name, v: r.rwm,
    tipLines: [r.name, `RWM expected ${f0(r.rwm)} (${sign(r.d, 0)} on 2023/24)`, `Higher std ${f0(r.high)} · reading ${f1(r.read)} · FSM ${r.fsm == null ? "–" : f1(r.fsm) + "%"}`],
  })));
  const above = ranked.filter((r) => r.rwm >= d.bench.rwmMed).length;
  const headline = above === ranked.length
    ? `Every one of the ${ranked.length} schools sits at or above England's median, from ${f0(ranked[ranked.length - 1].rwm)} to ${f0(ranked[0].rwm)} reaching the expected standard.`
    : `${above} of ${ranked.length} schools ${above === 1 ? "sits" : "sit"} at or above England's median, from ${f0(ranked[ranked.length - 1].rwm)} to ${f0(ranked[0].rwm)} reaching the expected standard.`;
  const chart = columnsSvg({ rows: shown, min: Math.max(0, Math.floor((ranked[ranked.length - 1].rwm - 6) / 10) * 10), max: 100, unit: "%", dp: 0, refs: [{ v: d.rwmMean, label: "Scope", color: "var(--gold)" }, { v: d.bench.rwmMed, label: "England", color: "var(--nat)" }] });
  const by = {}; d.rows.forEach((r) => { (by[r.la || "Other"] = by[r.la || "Other"] || []).push(r); });
  const groups = Object.keys(by).sort();
  const tbl = (rows) => `<table class="pz-table"><thead><tr><th>School</th><th>FSM</th><th>RWM</th><th>vs 23/24</th><th>Higher</th><th>Reading</th><th>Maths</th><th>Writing</th></tr></thead><tbody>${rows.map((r) => `<tr><td class="nm">${esc(r.name)}</td><td>${r.fsm == null ? "–" : f1(r.fsm) + "%"}</td><td class="num">${f0(r.rwm)}</td><td class="num" style="color:${r.d == null ? "var(--muted)" : r.d >= 0.5 ? "var(--up)" : r.d <= -0.5 ? "var(--down)" : "var(--muted)"}">${sign(r.d, 0)}</td><td class="num">${f0(r.high)}</td><td class="num">${f1(r.read)}</td><td class="num">${f0(r.mat)}</td><td class="num">${f0(r.writ)}</td></tr>`).join("")}</tbody></table>`;
  const inner = groups.length > 1
    ? groups.map((g) => `<details class="pz-fold"${groups.length <= 3 ? " open" : ""}><summary>${esc(g)}<span>${by[g].length} school${by[g].length === 1 ? "" : "s"}</span></summary>${tbl(by[g].sort((a, b) => (b.rwm ?? -1) - (a.rwm ?? -1)))}</details>`).join("")
    : `<details class="pz-fold"${d.rows.length <= 30 ? " open" : ""}><summary>The full table<span>${d.rows.length} schools</span></summary>${tbl(ranked)}</details>`;
  const details = groups.length > 3
    ? `<details class="pz-fold pz-master"><summary>Every school, authority by authority<span>${d.rows.length} schools · ${groups.length} authorities</span></summary><div class="pz-master-body">${inner}</div></details>`
    : inner;
  return section("The cohort", headline,
    (capped ? `The chart shows the top and bottom ${shown.length / 2} of ${ranked.length} schools; ` : "") + "every school, with the full table folded beneath. Arrows compare KS2 2024/25 with 2023/24.",
    chart + legend([["var(--purple)", "School"], ["var(--gold)", `Scope mean ${f0(d.rwmMean)}`], ["var(--nat)", `England median ${f0(d.bench.rwmMed)}`]]) + details);
}

function movementHtml(d) {
  if (!d.rows.length) return "";
  const KS2 = d.kind === "ks2";
  const { rows: shown, capped } = capRows(d.rows.map((r) => ({
    label: r.name, a: r.prev, b: r.now,
    tipLines: KS2
      ? [r.name, `2023/24 ${f0(r.prev)} → 2024/25 ${f0(r.now)} RWM`, `${sign(r.d, 0)} points`]
      : [r.name, `2024/25 ${f1(r.prev)} → 2025/26 ${f1(r.now)}`, `${sign(r.d)} points`],
  })), 40);
  const up = d.rows.filter((r) => r.d > 0.05).length, dn = d.rows.filter((r) => r.d < -0.05).length;
  const headline = `${up} school${up === 1 ? "" : "s"} rose and ${dn} fell: a scope drift of ${sign(d.scopeDrift)} against England's ${sign(d.natDrift)}.`;
  const lo = Math.min(...d.rows.map((r) => Math.min(r.prev, r.now))), hi = Math.max(...d.rows.map((r) => Math.max(r.prev, r.now)));
  const top = d.rows.slice(0, 4), bot = d.rows.slice(-4).reverse();
  const side = `<div class="pz-rank"><div><h4>Largest rises</h4><ol>${top.map((r) => `<li>${esc(short(r.name))} <span>${sign(r.d)}</span></li>`).join("")}</ol></div><div><h4>Largest falls</h4><ol>${bot.map((r) => `<li>${esc(short(r.name))} <span>${sign(r.d)}</span></li>`).join("")}</ol></div></div>`;
  return section("Movement", headline,
    (capped ? `Showing the ${shown.length / 2} strongest rises and falls of ${d.rows.length} schools. ` : "") + (KS2 ? "Hollow circle 2023/24, filled circle 2024/25; RWM expected standard." : "Hollow circle 2024/25, filled circle 2025/26 provisional."),
    dumbbellsSvg({ rows: shown, min: Math.max(0, Math.floor((lo - 4) / 10) * 10), max: Math.min(KS2 ? 100 : 90, Math.ceil((hi + 4) / 10) * 10), unit: KS2 ? "%" : "" }) + side);
}

function gapHtml(d) {
  if (!d.rows.length) return "";
  const KS2 = d.kind === "ks2";
  const F = KS2 ? (v) => f0(v) : f1, U = KS2 ? "%" : "";
  const { rows: shown, capped } = capRows(d.rows.map((r) => ({
    label: r.name, a: r.dis, b: r.non,
    tipLines: [r.name, `Disadvantaged ${F(r.dis)} · others ${F(r.non)}`, `Gap ${KS2 ? Math.round(r.gap) : f1(r.gap)} points`],
  })), 40);
  const headline = `Scope disadvantaged mean ${F(d.scopeDisMean)} against England's disadvantaged ${F(d.natDisMean)}; sorted narrowest gap first.`;
  const lo = Math.min(...d.rows.map((r) => r.dis), 20), hi = Math.max(...d.rows.map((r) => r.non), 60);
  return section("The disadvantage gap", headline,
    (capped ? `Showing the ${shown.length / 2} narrowest and widest of ${d.rows.length} schools. ` : "") + `England's other pupils average ${F(d.natNonMean)}.` + (KS2 ? " RWM expected standard." : ""),
    dumbbellsSvg({ rows: shown, mode: "gap", min: Math.max(0, Math.floor((lo - 4) / 10) * 10), max: Math.min(KS2 ? 100 : 90, Math.ceil((hi + 4) / 10) * 10), unit: U, refs: [{ v: d.natDisMean, label: "Eng. disadv.", color: "var(--nat)" }] })
    + legend([["var(--gold)", "Disadvantaged"], ["var(--purple)", "Other pupils"]]));
}

function scatterHtml(d) {
  const KS2 = d.kind === "ks2";
  const TOP = KS2 ? 100 : 80, MEASURE = KS2 ? "RWM expected standard" : "Attainment 8", PHASE = KS2 ? "primary" : "secondary";
  const W = 1000, H = 440, L = 54, B = 44;
  const x = (f) => L + (Math.max(0, Math.min(70, f)) / 70) * (W - L - 20);
  const y = (a) => (H - B) - (Math.max(0, Math.min(TOP, a)) / TOP) * (H - B - 20);
  const cloud = d.cloud.map(([f, a]) => `<circle cx="${x(f).toFixed(1)}" cy="${y(a).toFixed(1)}" r="2" fill="var(--slo)"/>`).join("");
  const marks = d.marks.map((m) => `<circle cx="${x(m.fsm).toFixed(1)}" cy="${y(m.a8).toFixed(1)}" r="5.2" fill="var(--purple)" stroke="var(--paper)" stroke-width="1.4">${tip([m.name, KS2 ? `FSM ${f1(m.fsm)}% · RWM ${f0(m.a8)}` : `FSM ${f1(m.fsm)}% · A8 ${f1(m.a8)}`])}</circle>`).join("");
  const yTicks = KS2 ? [25, 50, 75, 100] : [20, 40, 60, 80];
  const axes = `<line x1="${L}" y1="${H - B}" x2="${W - 20}" y2="${H - B}" stroke="var(--grid)"/><line x1="${L}" y1="20" x2="${L}" y2="${H - B}" stroke="var(--grid)"/>
    ${[0, 20, 40, 60].map((v) => `<text class="tick" x="${x(v)}" y="${H - B + 16}" text-anchor="middle">${v}%</text>`).join("")}
    ${yTicks.map((v) => `<text class="tick" x="${L - 8}" y="${y(v) + 3}" text-anchor="end">${v}${KS2 ? "%" : ""}</text>`).join("")}
    <text class="tick" x="${(W + L) / 2}" y="${H - 6}" text-anchor="middle">whole-school FSM</text>
    <text class="tick" x="16" y="${(H - B) / 2}" transform="rotate(-90 16 ${(H - B) / 2})" text-anchor="middle">${MEASURE}</text>`;
  return section("Context and outcomes", `Where the scope sits against every state-funded ${PHASE} in England, given its intake.`,
    "Association, not causation; the grey cloud is the rest of the country.",
    `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img">${axes}${cloud}${marks}</svg>` + legend([["var(--purple)", "Scope school"], ["var(--slo)", `Every other state-funded ${PHASE}`]]));
}

function distributionHtml(d) {
  const KS2 = d.kind === "ks2";
  const SPAN = KS2 ? 100 : 90, XT = KS2 ? [0, 25, 50, 75, 100] : [0, 30, 60, 90];
  const W = 1000, H = 250, B = 34;
  const maxN = Math.max(...d.bins.map((b) => b.n));
  const bw = (W - 60) / d.bins.length;
  const bars = d.bins.map((b, i) => { const h = (b.n / maxN) * (H - B - 30); return `<rect x="${40 + i * bw + 1}" y="${H - B - h}" width="${bw - 2}" height="${h}" fill="var(--lilac)"/>`; }).join("");
  const marks = d.marks.map((m) => { const px = 40 + (Math.max(0, Math.min(SPAN - 0.1, m.a8)) / SPAN) * (W - 60); return `<line x1="${px.toFixed(1)}" y1="26" x2="${px.toFixed(1)}" y2="${H - B}" stroke="var(--gold)" stroke-width="2">${tip([m.name, KS2 ? `RWM ${f0(m.a8)}` : `A8 ${f1(m.a8)}`])}</line>`; }).join("");
  const medX = 40 + (d.med / SPAN) * (W - 60);
  return section("Where they sit", `Each gold line is a school in scope, set in the national distribution of ${d.total.toLocaleString("en-GB")} schools${KS2 ? " by RWM expected standard" : ""}.`, null,
    `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img">${bars}<line x1="${medX}" y1="26" x2="${medX}" y2="${H - B}" stroke="var(--nat)" stroke-dasharray="3 4"/><text class="tick" x="${medX}" y="18" text-anchor="middle">England median ${KS2 ? f0(d.med) : f1(d.med)}</text>${marks}${XT.map((v) => `<text class="tick" x="${40 + (v / SPAN) * (W - 60)}" y="${H - 14}" text-anchor="middle">${v}${KS2 ? "%" : ""}</text>`).join("")}</svg>`);
}

function ofstedHtml(d) {
  const ORDER = ["Outstanding", "Good", "Requires improvement", "Inadequate", "Not yet inspected"];
  const rows = ORDER.filter((k) => d.scope[k] || d.nat[k]).map((k) => {
    const sn = d.scope[k] || 0, sp = d.n ? Math.round((sn / d.n) * 100) : 0;
    const np = d.natN ? Math.round(((d.nat[k] || 0) / d.natN) * 100) : 0;
    return `<tr><td class="nm">${esc(k)}</td><td class="num">${sn}</td><td><div class="pz-bar"><span style="width:${sp}%"></span></div></td><td class="num">${sp}%</td><td class="num" style="color:var(--muted)">${np}%</td></tr>`;
  }).join("");
  const out = d.scope["Outstanding"] || 0, good = d.scope["Good"] || 0;
  return section("Inspection profile", `${out + good} of ${d.n} schools hold Good or Outstanding judgements.`, "Current Ofsted judgements against the national picture.",
    `<table class="pz-table"><thead><tr><th>Judgement</th><th>Schools</th><th></th><th>Scope</th><th>England</th></tr></thead><tbody>${rows}</tbody></table>`);
}

function attendanceHtml(d) {
  if (!d.rows.length) return "";
  const better = d.rows.filter((r) => r.abs <= d.bench.absMed).length;
  const { rows: shown, capped } = capRows(d.rows.map((r) => ({
    label: r.name, v: r.abs,
    tipLines: [r.name, `Overall absence ${f1(r.abs)}%`, `Persistent ${f1(r.pa)}% · severe ${f1(r.sev)}%`],
  })));
  const hi = Math.max(...d.rows.map((r) => r.abs));
  const headline = `Scope absence averages ${f1(d.absMean)}% against England's median ${f1(d.bench.absMed)}%; ${better} of ${d.rows.length} schools sit at or better than the national median.`;
  const tbl = `<details class="pz-fold"><summary>Every school's attendance<span>${d.rows.length} schools</span></summary><table class="pz-table"><thead><tr><th>School</th><th>Overall absence</th><th>Persistent (10%+)</th><th>Severe (50%+)</th></tr></thead><tbody>${d.rows.map((r) => `<tr><td class="nm">${esc(r.name)}</td><td class="num">${f1(r.abs)}%</td><td class="num">${f1(r.pa)}%</td><td class="num">${f1(r.sev)}%</td></tr>`).join("")}</tbody></table></details>`;
  return section("Attendance", headline,
    (capped ? `Showing the best and worst ${shown.length / 2} of ${d.rows.length}. ` : "") + "Sorted lowest absence first; persistent and severe absence in the tooltips and the table.",
    columnsSvg({ rows: shown, min: 0, max: Math.min(30, Math.ceil((hi + 2) / 5) * 5), unit: "%", refs: [{ v: d.bench.absMed, label: "England", color: "var(--nat)" }, { v: d.absMean, label: "Scope", color: "var(--gold)" }] }) + tbl);
}

function behaviourHtml(d) {
  if (!d.rows.length) return "";
  const { rows: shown, capped } = capRows(d.rows.map((r) => ({
    label: r.name, v: r.susp,
    tipLines: [r.name, `Suspensions ${f1(r.susp)} per 100 pupils`, `${r.s1 == null ? "–" : f1(r.s1) + "% suspended at least once"} · permanent exclusions ${r.pex == null ? "–" : f1(r.pex)}`],
  })));
  const hi = Math.max(...d.rows.map((r) => r.susp));
  const headline = `Suspensions average ${f1(d.suspMean)} per 100 pupils against England's median ${f1(d.bench.suspMed)}, and ${d.pexZero} of ${d.rows.length} schools recorded no permanent exclusions.`;
  return section("Suspensions and exclusions", headline, (capped ? `Showing the two ends of ${d.rows.length} schools. ` : "") + "Sorted lowest suspension rate first.",
    columnsSvg({ rows: shown, min: 0, max: Math.ceil((hi + 3) / 10) * 10, refs: [{ v: d.bench.suspMed, label: "England", color: "var(--nat)" }] }));
}

function destinationsHtml(d) {
  if (!d.rows.length) return "";
  const { rows: shown, capped } = capRows(d.rows.map((r) => ({
    label: r.name, v: r.dest,
    tipLines: [r.name, `Sustained destination ${f1(r.dest)}%`, `Education ${f1(r.edu)}% · apprenticeship ${f1(r.appren)}% · work ${f1(r.work)}%`, `Not sustained ${f1(r.notsust)}%`],
  })));
  const lo = Math.min(...d.rows.map((r) => r.dest));
  const headline = `${f1(d.destMean)}% of leavers sustained a destination, against England's median ${f1(d.bench.destMed)}%; in ${d.highNotsust} school${d.highNotsust === 1 ? "" : "s"}, one leaver in ten or more was not sustained.`;
  const tbl = `<details class="pz-fold"><summary>Every school's destinations<span>${d.rows.length} schools</span></summary><table class="pz-table"><thead><tr><th>School</th><th>Sustained</th><th>Education</th><th>Apprenticeship</th><th>Work</th><th>Not sustained</th></tr></thead><tbody>${d.rows.map((r) => `<tr><td class="nm">${esc(r.name)}</td><td class="num">${f1(r.dest)}%</td><td class="num">${f1(r.edu)}%</td><td class="num">${f1(r.appren)}%</td><td class="num">${f1(r.work)}%</td><td class="num" style="color:${r.notsust != null && r.notsust >= 10 ? "var(--down)" : "inherit"}">${f1(r.notsust)}%</td></tr>`).join("")}</tbody></table></details>`;
  return section("Destinations", headline, (capped ? `Showing the two ends of ${d.rows.length} schools. ` : "") + "Pupils sustaining education, apprenticeship or employment after key stage 4; the latest published destinations year.",
    columnsSvg({ rows: shown, min: Math.max(0, Math.floor((lo - 6) / 10) * 10), max: 100, unit: "%", refs: [{ v: d.bench.destMed, label: "England", color: "var(--nat)" }, { v: d.destMean, label: "Scope", color: "var(--gold)" }] }) + tbl);
}

const RENDERERS = { headlines: headlinesHtml, cohort: cohortHtml, movement: movementHtml, gap: gapHtml, attendance: attendanceHtml, behaviour: behaviourHtml, destinations: destinationsHtml, scatter: scatterHtml, distribution: distributionHtml, ofsted: ofstedHtml };

export function renderBlocks(computed) {
  return computed.blocks.map((b) => (RENDERERS[b.type] ? RENDERERS[b.type](b.data) : "")).join("");
}

/* ── house style ───────────────────────────────────────────────────────── */
export const PZ_CSS = `
  .pz-report{--purple:#6A0CA0;--purple-deep:#4B0875;--gold:#C6A035;--gold-soft:#E4CE8B;--paper:#FBFAF7;--card:#fff;--lilac:#F4EEFA;--dark:#241238;--ink:#221233;--muted:#6F6580;--hair:rgba(106,12,160,.14);--grid:rgba(34,18,51,.2);--nat:#8A8296;--slo:#DCD6E2;--up:#6A0CA0;--down:#B4475A;
    background:var(--paper);color:var(--ink);font-family:Inter,system-ui,sans-serif;border:1px solid var(--hair);padding:54px 60px;box-shadow:0 18px 50px rgba(34,18,51,.07)}
  .pz-report h1,.pz-report h2{font-family:Fraunces,Georgia,serif;font-weight:500;letter-spacing:-.012em;color:var(--ink);text-wrap:balance;margin:0}
  .pz-wordmark{font-family:Fraunces,Georgia,serif;font-weight:500;letter-spacing:-.012em;line-height:1;color:var(--ink);display:inline-block;font-size:44px}
  .pz-wordmark .ti{position:relative;display:inline-block}
  .pz-wordmark .ti svg{position:absolute;left:50%;transform:translateX(-50%);top:-.175em;width:.34em;height:.34em}
  .pz-for{margin-top:40px;font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:var(--gold)}
  .pz-report h1{font-size:46px;line-height:1.05;margin-top:12px;max-width:22ch}
  .pz-sub{font-family:Fraunces,Georgia,serif;font-size:17px;color:var(--muted);margin:14px 0 0;max-width:60ch;line-height:1.45}
  .pz-meta{margin-top:30px;display:flex;flex-wrap:wrap;gap:36px;font-size:12px;color:var(--muted)}
  .pz-meta b{display:block;font-family:Fraunces,Georgia,serif;font-weight:500;font-size:26px;color:var(--ink)}
  .pz-vintage{margin-top:22px;padding-top:12px;border-top:1px solid var(--hair);font-size:10.5px;color:var(--muted)}
  .pz-kick{display:flex;align-items:center;gap:9px;font-size:11.5px;font-weight:600;letter-spacing:.06em;color:var(--gold);text-transform:uppercase;margin-bottom:8px}
  .pz-kick svg{width:15px;height:15px;flex:none}
  .pz-block{margin-top:52px}
  .pz-block h2{font-size:25px;line-height:1.18;max-width:44ch}
  .pz-note{color:var(--muted);font-size:12.5px;margin:8px 0 14px;line-height:1.55;max-width:90ch}
  .pz-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:14px;margin-top:16px}
  .pz-tile{background:var(--dark);color:#fff;padding:18px 20px 16px;border-radius:2px}
  .pz-tile .n{font-family:Fraunces,Georgia,serif;font-size:40px;line-height:1;letter-spacing:-.01em}
  .pz-tile .n small{font-size:17px;color:var(--gold-soft)}
  .pz-tile p{font-size:12px;line-height:1.45;color:rgba(255,255,255,.72);margin:8px 0 0}
  .pz-tile .cmp{font-size:11px;color:var(--gold-soft);margin-top:6px;font-weight:500}
  .pz-report svg text{font-family:Inter,system-ui,sans-serif;fill:var(--muted)}
  .pz-report svg .lab{font-size:10.5px;fill:var(--ink)}
  .pz-report svg .val{font-size:9px;fill:var(--muted);font-variant-numeric:tabular-nums}
  .pz-report svg .tick{font-size:10px;font-variant-numeric:tabular-nums;fill:var(--muted)}
  .pz-report svg .reftxt{font-size:10.5px;font-weight:600}
  .pz-report svg .gridl{stroke:rgba(34,18,51,.08);stroke-width:1}
  .pz-legend{display:flex;flex-wrap:wrap;gap:16px;font-size:11.5px;color:var(--muted);margin-top:6px}
  .pz-legend span{display:inline-flex;align-items:center;gap:6px}
  .pz-legend i{width:13px;height:10px;border-radius:1px;display:inline-block}
  .pz-fold{margin-top:12px;border:1px solid var(--hair);background:var(--card)}
  .pz-fold summary{cursor:pointer;list-style:none;display:flex;justify-content:flex-start;align-items:center;gap:12px;padding:11px 16px;font-size:12.5px;font-weight:600;color:var(--ink)}
  .pz-fold summary span{margin-left:auto;text-align:right;white-space:nowrap}
  .pz-master-body{padding:2px 14px 14px}
  .pz-master-body .pz-fold{margin-top:8px}
  .pz-fold summary::-webkit-details-marker{display:none}
  .pz-fold summary span{color:var(--muted);font-weight:400;font-size:11.5px}
  .pz-fold > summary::after{content:"+";font-family:Fraunces,Georgia,serif;color:var(--purple);font-size:17px;margin-left:12px}
  .pz-fold[open] > summary::after{content:"\\2212"}
  .pz-fold > table{margin:0 16px 14px;width:calc(100% - 32px)}
  .pz-table{width:100%;border-collapse:collapse;font-size:12px}
  .pz-table th{text-align:left;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:600;padding:6px 8px;border-bottom:1px solid var(--grid)}
  .pz-table td{padding:6px 8px;border-bottom:1px solid var(--hair);vertical-align:top}
  .pz-table td.nm{font-weight:500}
  .pz-table td.num{font-variant-numeric:tabular-nums}
  .pz-bar{background:var(--lilac);border-radius:6px;height:10px;min-width:110px;overflow:hidden}
  .pz-bar span{display:block;height:100%;background:var(--purple);border-radius:6px}
  .pz-rank{display:grid;grid-template-columns:1fr 1fr;gap:12px 36px;margin-top:14px;font-size:12.5px}
  .pz-rank h4{font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--purple);margin:0 0 4px}
  .pz-rank ol{margin:0;padding-left:18px}
  .pz-rank li{margin-bottom:2px}
  .pz-rank li span{color:var(--muted);font-variant-numeric:tabular-nums}
  .pz-foot{margin-top:52px;padding-top:12px;border-top:1px solid var(--hair);display:flex;justify-content:space-between;gap:20px;font-size:10.5px;color:var(--muted)}
  @media (max-width:720px){.pz-report{padding:28px 18px}.pz-report h1{font-size:32px}.pz-rank{grid-template-columns:1fr}}
  @media print{.pz-report{box-shadow:none;border:none}.pz-fold{break-inside:avoid}}
`;

export function coverHtml(spec, computed) {
  const n = computed.schools.length;
  const KS2 = computed.phase === "primary";
  const las = new Set(computed.schools.map((s) => s.la).filter(Boolean)).size;
  return `${WORDMARK}
  <div class="pz-for">A report by The All Saints Institute · Prizm</div>
  <h1>${esc(spec.title || "A report")}</h1>
  <p class="pz-sub">${esc(scopeLabel(spec.scope, null) || "")} · every figure computed from the DfE's published national dataset, traceable to its vintage.</p>
  <div class="pz-meta"><div><b>${n}</b>school${n === 1 ? "" : "s"}</div><div><b>${las}</b>local authorit${las === 1 ? "y" : "ies"}</div><div><b>${KS2 ? "2024/25" : "2025/26"}</b>${KS2 ? "KS2 results" : "provisional results"}</div><div><b>${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</b>prepared</div></div>
  <div class="pz-vintage">${esc(KS2 ? VINTAGE_KS2 : VINTAGE)}</div>`;
}

/* ── the deliverable: one self-contained file ── */
export function reportHtml(spec, computed) {
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(spec.title || "Prizm report")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>body{margin:0;background:#F2EFEA;padding:34px 14px}main{max-width:960px;margin:0 auto}${PZ_CSS}</style></head>
<body><main><div class="pz-report">${coverHtml(spec, computed)}${renderBlocks(computed)}
<div class="pz-foot"><span>Built with Prizm at institute.school · the AI arranges, the mathematics counts.</span><span>${esc(computed.phase === "primary" ? VINTAGE_KS2 : VINTAGE)}</span></div>
</div></main></body></html>`;
}
