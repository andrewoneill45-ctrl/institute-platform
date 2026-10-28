/* Prizm's hand, second cut — the Westminster report's visual language,
   generalised. Pure string builders shared by the studio's live preview and
   the downloaded single-file report: wordmark cover, kick rows, stat tiles,
   column and dumbbell charts with reference lines and tooltips, computed
   narrative headlines, and collapsible tables for the full data. */

import { VINTAGE, VINTAGE_KS2, VINTAGE_P16, P16_LABEL, p16Band, scopeLabel, r1, RC_GRADES, RC_AREAS } from "./engine.js";

/* the renewed framework's five-point ramp: deep purple to red, gold for attention */
const RC_COLS = ["#3D0661", "#6A0CA0", "#B18FD0", "#C6A035", "#B4475A"];

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
const escA = (v) => esc(v).replace(/"/g, "&quot;");
/* interactive hit: hover shows the card, data-urn makes it click through to Atlas */
const hit = (lines, urn) => ` class="pz-hit" data-tip="${escA((lines || []).join("\n")).replace(/\n/g, "&#10;")}"${urn != null ? ` data-urn="${escA(String(urn))}"` : ""}`;

/* rotated labels need room proportional to the longest name drawn */
function labelSpace(rows, cw) {
  const chars = Math.max(8, ...rows.filter((r) => !r.gap).map((r) => short(r.label, cw > 20 ? 30 : 20).length));
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
    if (r.gap) { s += gapCol(x, cw, pt, ph, r.n); return; }
    if (r.v != null) {
      s += `<g${hit(r.tipLines, r.urn)}><rect x="${bx.toFixed(1)}" y="${y(r.v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(y(min) - y(r.v)).toFixed(1)}" fill="var(--purple)" opacity="${r.dim ? 0.35 : 0.9}"/></g>`;
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
    if (r.gap) { s += gapCol(pl + i * cw, cw, pt, ph, r.n); return; }
    if (r.a != null && r.b != null) {
      s += `<g opacity="${r.faint ? 0.38 : 1}"${hit(r.tipLines, r.urn)}>`;
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

/* if a cohort is too wide for legible columns, keep the two ends — unless a
   decile view is active, in which case show that slice of the ranking */
let SEG = null; /* {d: 0..9}, set by renderBlock for the block being drawn */
const SEG_NAMES = ["Top", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "Bottom"];
function capRows(rows, cap = 44) {
  if (SEG && SEG.d != null && rows.length > 10) {
    const n = rows.length, d = Math.max(0, Math.min(9, SEG.d));
    const lo = Math.floor((d * n) / 10), hi = Math.max(lo + 1, Math.floor(((d + 1) * n) / 10));
    let slice = rows.slice(lo, hi);
    let sampledFrom = 0;
    if (slice.length > cap) {
      sampledFrom = slice.length;
      const step = slice.length / cap;
      slice = Array.from({ length: cap }, (_, i) => slice[Math.floor(i * step)]);
    }
    return { rows: slice, capped: false, segNote: `${SEG_NAMES[d]} decile of this ranking: schools ${(lo + 1).toLocaleString("en-GB")} to ${hi.toLocaleString("en-GB")} of ${n.toLocaleString("en-GB")}${sampledFrom ? `, ${cap} drawn evenly from the ${sampledFrom.toLocaleString("en-GB")}` : ""}. ` };
  }
  if (rows.length <= cap) return { rows, capped: false };
  const half = Math.floor(cap / 2);
  /* the omitted middle is drawn, not hidden: a break column carries its count */
  return { rows: [...rows.slice(0, half), { gap: true, n: rows.length - 2 * half }, ...rows.slice(-half)], capped: rows.length - cap };
}

/* the break column: a quiet band naming the schools between the two ends */
function gapCol(x, cw, pt, ph, n) {
  const cx = x + cw / 2, my = pt + ph / 2;
  let g = `<rect x="${(x + Math.max(1, cw * 0.12)).toFixed(1)}" y="${pt}" width="${Math.max(3, cw * 0.76).toFixed(1)}" height="${ph}" fill="var(--lilac)" opacity="0.6"/>`;
  for (let i = -1; i <= 1; i++) g += `<circle cx="${cx.toFixed(1)}" cy="${(my + i * 13).toFixed(1)}" r="2.2" fill="var(--muted)"/>`;
  g += `<text class="lab" transform="translate(${(cx + 3).toFixed(1)},${pt + ph + 8}) rotate(-55)" text-anchor="end" style="fill:var(--muted);font-style:italic">${n.toLocaleString("en-GB")} schools between</text>`;
  return g;
}

const legend = (items) => `<div class="pz-legend">${items.map(([c, t]) => `<span><i style="background:${c}"></i>${esc(t)}</span>`).join("")}</div>`;

function section(label, headline, note, body) {
  return `<section class="pz-block">${kick(label)}<h2>${headline}</h2>${note ? `<p class="pz-note">${note}</p>` : ""}${body}</section>`;
}

/* ── blocks ────────────────────────────────────────────────────────────── */

/* two scopes, four measures, one stare-down */
function duelHeadlines(d, ctx) {
  const v = ctx.vs, L = ctx.labels || {};
  const KS2 = d.kind === "ks2";
  const rows = KS2 ? [
    ["RWM expected standard, scope mean", f0(d.rwmMean), f0(v.rwmMean), `England ${f0(d.bench.rwmMean)}`],
    ["Higher standard in all three", f0(d.highMean), f0(v.highMean), `England median ${f0(d.bench.highMed)}`],
    ["Schools at or above England's median", `${d.aboveNat}<small> of ${d.n}</small>`, `${v.aboveNat}<small> of ${v.n}</small>`, `median RWM ${f0(d.bench.rwmMed)}`],
    ["Whole-school FSM, the context", f1(d.fsmMean) + "<small>%</small>", f1(v.fsmMean) + "<small>%</small>", "KS2 2024/25 throughout"],
  ] : [
    ["Attainment 8, scope mean", f1(d.a8Mean), f1(v.a8Mean), `England ${f1(d.bench.a8Mean)}`],
    ["Grade 5+ in English and maths", f0(d.b95Mean), f0(v.b95Mean), `England median ${f0(d.bench.b95Med)}`],
    ["Schools at or above England's median", `${d.aboveNat}<small> of ${d.n}</small>`, `${v.aboveNat}<small> of ${v.n}</small>`, `median A8 ${f1(d.bench.a8Med)}`],
    ["Whole-school FSM, the context", f1(d.fsmMean) + "<small>%</small>", f1(v.fsmMean) + "<small>%</small>", "2025/26 provisional throughout"],
  ];
  const tiles = rows.map(([k, a, b, eng]) => `<div class="pz-tile pz-vs"><div class="vk">${esc(k)}</div><div class="pair"><div><div class="n">${a}</div><div class="who">${esc(L.a || "Scope")}</div></div><div class="sep"></div><div><div class="n">${b}</div><div class="who">${esc(L.b || "Comparison")}</div></div></div><div class="cmp">${esc(eng)}</div></div>`).join("");
  return section("Headlines", `${esc(L.a)}'s ${d.n} schools against ${esc(L.b)}'s ${v.n}.`, null, `<div class="pz-tiles">${tiles}</div>`);
}

function headlinesHtml(d, ctx) {
  if (ctx && ctx.vs) return duelHeadlines(d, ctx);
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

function cohortHtml(d, ctx) {
  if (d.kind === "ks2") return ks2CohortHtml(d, ctx);
  const ranked = d.rows.filter((r) => r.a8 != null).sort((a, b) => b.a8 - a.a8);
  if (!ranked.length) return "";
  /* versus: both cohorts on one shared scale, contrast up front */
  if (ctx && ctx.vs && ctx.vs.rows && ctx.vs.rows.length) {
    const L = ctx.labels || {};
    const vRanked = ctx.vs.rows.filter((r) => r.a8 != null).sort((a, b) => b.a8 - a.a8);
    const lo = Math.min(ranked[ranked.length - 1].a8, vRanked[vRanked.length - 1].a8);
    const hi = Math.max(ranked[0].a8, vRanked[0].a8);
    const min = Math.max(0, Math.floor((lo - 6) / 10) * 10), max = Math.min(90, Math.ceil((hi + 6) / 10) * 10);
    const mk = (rows) => capRows(rows.map((r) => ({ label: r.name, v: r.a8, urn: r.urn, tipLines: [r.name, `Attainment 8 ${f1(r.a8)} (${sign(r.d)} on 2024/25)`] }))).rows;
    const gapAB = r1(d.a8Mean - ctx.vs.a8Mean);
    const headline = `${esc(L.a)} averages ${f1(d.a8Mean)} against ${esc(L.b)}'s ${f1(ctx.vs.a8Mean)}: ${Math.abs(gapAB) < 0.05 ? "level pegging" : `${f1(Math.abs(gapAB))} points ${gapAB > 0 ? "ahead" : "behind"}`}, with England's median at ${f1(d.bench.a8Med)}.`;
    const strip = (name, mean, n) => `<div class="pz-vslabel"><span>${esc(name)}</span><span>${n} schools · mean ${f1(mean)}</span></div>`;
    return section("The cohort, side by side", headline,
      "Both charts share one scale; each shows its cohort's top and bottom ends when too wide to draw whole.",
      strip(L.a, d.a8Mean, ranked.length) + columnsSvg({ rows: mk(ranked), min, max, refs: [{ v: d.bench.a8Med, label: "England", color: "var(--nat)" }] })
      + strip(L.b, ctx.vs.a8Mean, vRanked.length) + columnsSvg({ rows: mk(vRanked), min, max, refs: [{ v: d.bench.a8Med, label: "England", color: "var(--nat)" }] }));
  }
  const { rows: shown, capped, segNote } = capRows(ranked.map((r) => ({
    label: r.name, v: r.a8, urn: r.urn,
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
    (segNote || "") + (capped ? `The chart shows the top and bottom ${Math.floor(shown.length / 2)} of ${ranked.length} schools. ` : "") + "Every school is in the folded table beneath. Arrows compare 2025/26 provisional with 2024/25.",
    chart + legend([["var(--purple)", "School"], ["var(--gold)", `Scope mean ${f1(d.a8Mean)}`], ["var(--nat)", `England median ${f1(d.bench.a8Med)}`]]) + details);
}

/* the primary cohort: RWM expected standard, ranked, grouped by authority */
function ks2CohortHtml(d, ctx) {
  const ranked = d.rows.filter((r) => r.rwm != null).sort((a, b) => b.rwm - a.rwm);
  if (!ranked.length) return "";
  if (ctx && ctx.vs && ctx.vs.rows && ctx.vs.rows.length) {
    const L = ctx.labels || {};
    const vRanked = ctx.vs.rows.filter((r) => r.rwm != null).sort((a, b) => b.rwm - a.rwm);
    const lo = Math.min(ranked[ranked.length - 1].rwm, vRanked[vRanked.length - 1].rwm);
    const min = Math.max(0, Math.floor((lo - 6) / 10) * 10), max = 100;
    const mk = (rows) => capRows(rows.map((r) => ({ label: r.name, v: r.rwm, urn: r.urn, tipLines: [r.name, `RWM expected ${f0(r.rwm)} (${sign(r.d, 0)} on 2023/24)`] }))).rows;
    const gapAB = r1(d.rwmMean - ctx.vs.rwmMean);
    const headline = `${esc(L.a)} averages ${f0(d.rwmMean)} at the expected standard against ${esc(L.b)}'s ${f0(ctx.vs.rwmMean)}: ${Math.abs(gapAB) < 0.5 ? "level pegging" : `${Math.round(Math.abs(gapAB))} points ${gapAB > 0 ? "ahead" : "behind"}`}, with England's median at ${f0(d.bench.rwmMed)}.`;
    const strip = (name, mean, n) => `<div class="pz-vslabel"><span>${esc(name)}</span><span>${n} schools · mean ${f0(mean)}</span></div>`;
    return section("The cohort, side by side", headline, "Both charts share one scale.",
      strip(L.a, d.rwmMean, ranked.length) + columnsSvg({ rows: mk(ranked), min, max, unit: "%", dp: 0, refs: [{ v: d.bench.rwmMed, label: "England", color: "var(--nat)" }] })
      + strip(L.b, ctx.vs.rwmMean, vRanked.length) + columnsSvg({ rows: mk(vRanked), min, max, unit: "%", dp: 0, refs: [{ v: d.bench.rwmMed, label: "England", color: "var(--nat)" }] }));
  }
  const { rows: shown, capped, segNote } = capRows(ranked.map((r) => ({
    label: r.name, v: r.rwm, urn: r.urn,
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
    (segNote || "") + (capped ? `The chart shows the top and bottom ${Math.floor(shown.length / 2)} of ${ranked.length} schools. ` : "") + "Every school is in the folded table beneath. Arrows compare KS2 2024/25 with 2023/24.",
    chart + legend([["var(--purple)", "School"], ["var(--gold)", `Scope mean ${f0(d.rwmMean)}`], ["var(--nat)", `England median ${f0(d.bench.rwmMed)}`]]) + details);
}

function movementHtml(d, ctx) {
  if (!d.rows.length) return "";
  const KS2 = d.kind === "ks2";
  const vsLine = ctx && ctx.vs && ctx.vs.scopeDrift != null ? ` ${esc((ctx.labels || {}).b || "The comparison")} drifted ${sign(ctx.vs.scopeDrift, KS2 ? 0 : 1)}.` : "";
  const { rows: shown, capped, segNote } = capRows(d.rows.map((r) => ({
    label: r.name, a: r.prev, b: r.now, urn: r.urn,
    tipLines: KS2
      ? [r.name, `2023/24 ${f0(r.prev)} → 2024/25 ${f0(r.now)} RWM`, `${sign(r.d, 0)} points`]
      : [r.name, `2024/25 ${f1(r.prev)} → 2025/26 ${f1(r.now)}`, `${sign(r.d)} points`],
  })), 40);
  const up = d.rows.filter((r) => r.d > 0.05).length, dn = d.rows.filter((r) => r.d < -0.05).length;
  const headline = `${up} school${up === 1 ? "" : "s"} rose and ${dn} fell: a scope drift of ${sign(d.scopeDrift)} against England's ${sign(d.natDrift)}.${vsLine}`;
  const lo = Math.min(...d.rows.map((r) => Math.min(r.prev, r.now))), hi = Math.max(...d.rows.map((r) => Math.max(r.prev, r.now)));
  const top = d.rows.slice(0, 4), bot = d.rows.slice(-4).reverse();
  const side = `<div class="pz-rank"><div><h4>Largest rises</h4><ol>${top.map((r) => `<li>${esc(short(r.name))} <span>${sign(r.d)}</span></li>`).join("")}</ol></div><div><h4>Largest falls</h4><ol>${bot.map((r) => `<li>${esc(short(r.name))} <span>${sign(r.d)}</span></li>`).join("")}</ol></div></div>`;
  return section("Movement", headline,
    (segNote || "") + (capped ? `Showing the ${Math.floor(shown.length / 2)} strongest rises and falls of ${d.rows.length} schools. ` : "") + (KS2 ? "Hollow circle 2023/24, filled circle 2024/25; RWM expected standard." : "Hollow circle 2024/25, filled circle 2025/26 provisional."),
    dumbbellsSvg({ rows: shown, min: Math.max(0, Math.floor((lo - 4) / 10) * 10), max: Math.min(KS2 ? 100 : 90, Math.ceil((hi + 4) / 10) * 10), unit: KS2 ? "%" : "" }) + side);
}

function gapHtml(d, ctx) {
  if (!d.rows.length) return "";
  const KS2 = d.kind === "ks2";
  const F = KS2 ? (v) => f0(v) : f1, U = KS2 ? "%" : "";
  if (ctx && ctx.vs && ctx.vs.rows && ctx.vs.rows.length) {
    const L = ctx.labels || {}, v = ctx.vs;
    const meanGap = (rows) => r1(rows.reduce((a, r) => a + r.gap, 0) / rows.length);
    const gA = meanGap(d.rows), gB = meanGap(v.rows);
    const lo = Math.min(...d.rows.map((r) => r.dis), ...v.rows.map((r) => r.dis), 20);
    const hi = Math.max(...d.rows.map((r) => r.non), ...v.rows.map((r) => r.non), 60);
    const min = Math.max(0, Math.floor((lo - 4) / 10) * 10), max = Math.min(KS2 ? 100 : 90, Math.ceil((hi + 4) / 10) * 10);
    const mk = (rows) => capRows(rows.map((r) => ({ label: r.name, a: r.dis, b: r.non, urn: r.urn, tipLines: [r.name, `Disadvantaged ${F(r.dis)} · others ${F(r.non)}`, `Gap ${KS2 ? Math.round(r.gap) : f1(r.gap)}`] })), 40).rows;
    const headline = `${esc(L.a)}'s disadvantaged pupils average ${F(d.scopeDisMean)} with a mean gap of ${F(gA)}; ${esc(L.b)}'s average ${F(v.scopeDisMean)} with a gap of ${F(gB)}.`;
    const strip = (name) => `<div class="pz-vslabel"><span>${esc(name)}</span><span>sorted narrowest gap first</span></div>`;
    return section("The disadvantage gap, side by side", headline, `England's disadvantaged pupils average ${F(d.natDisMean)}; its others ${F(d.natNonMean)}. One scale for both charts.`,
      strip(L.a) + dumbbellsSvg({ rows: mk(d.rows), mode: "gap", min, max, unit: U, refs: [{ v: d.natDisMean, label: "Eng. disadv.", color: "var(--nat)" }] })
      + strip(L.b) + dumbbellsSvg({ rows: mk(v.rows), mode: "gap", min, max, unit: U, refs: [{ v: d.natDisMean, label: "Eng. disadv.", color: "var(--nat)" }] })
      + legend([["var(--gold)", "Disadvantaged"], ["var(--purple)", "Other pupils"]]));
  }
  const { rows: shown, capped, segNote } = capRows(d.rows.map((r) => ({
    label: r.name, a: r.dis, b: r.non, urn: r.urn,
    tipLines: [r.name, `Disadvantaged ${F(r.dis)} · others ${F(r.non)}`, `Gap ${KS2 ? Math.round(r.gap) : f1(r.gap)} points`],
  })), 40);
  const headline = `Scope disadvantaged mean ${F(d.scopeDisMean)} against England's disadvantaged ${F(d.natDisMean)}; sorted narrowest gap first.`;
  const lo = Math.min(...d.rows.map((r) => r.dis), 20), hi = Math.max(...d.rows.map((r) => r.non), 60);
  return section("The disadvantage gap", headline,
    (segNote || "") + (capped ? `Showing the ${Math.floor(shown.length / 2)} narrowest and widest of ${d.rows.length} schools. ` : "") + `England's other pupils average ${F(d.natNonMean)}.` + (KS2 ? " RWM expected standard." : ""),
    dumbbellsSvg({ rows: shown, mode: "gap", min: Math.max(0, Math.floor((lo - 4) / 10) * 10), max: Math.min(KS2 ? 100 : 90, Math.ceil((hi + 4) / 10) * 10), unit: U, refs: [{ v: d.natDisMean, label: "Eng. disadv.", color: "var(--nat)" }] })
    + legend([["var(--gold)", "Disadvantaged"], ["var(--purple)", "Other pupils"]]));
}

function scatterHtml(d, ctx) {
  const KS2 = d.kind === "ks2";
  const LBL = (ctx && ctx.labels) || {};
  const vsMarks = ctx && ctx.vs ? ctx.vs.marks : null;
  const TOP = KS2 ? 100 : 80, MEASURE = KS2 ? "RWM expected standard" : "Attainment 8", PHASE = KS2 ? "primary" : "secondary";
  const W = 1000, H = 440, L = 54, B = 44;
  const x = (f) => L + (Math.max(0, Math.min(70, f)) / 70) * (W - L - 20);
  const y = (a) => (H - B) - (Math.max(0, Math.min(TOP, a)) / TOP) * (H - B - 20);
  const cloud = d.cloud.map(([f, a]) => `<circle cx="${x(f).toFixed(1)}" cy="${y(a).toFixed(1)}" r="2" fill="var(--slo)"/>`).join("");
  const dot = (m, color) => `<circle cx="${x(m.fsm).toFixed(1)}" cy="${y(m.a8).toFixed(1)}" r="5.2" fill="${color}" stroke="var(--paper)" stroke-width="1.4"${hit([m.name, KS2 ? `FSM ${f1(m.fsm)}% · RWM ${f0(m.a8)}` : `FSM ${f1(m.fsm)}% · A8 ${f1(m.a8)}`], m.urn)}/>`;
  const marks = (vsMarks ? vsMarks.map((m) => dot(m, "var(--gold)")).join("") : "") + d.marks.map((m) => dot(m, "var(--purple)")).join("");
  const yTicks = KS2 ? [25, 50, 75, 100] : [20, 40, 60, 80];
  const axes = `<line x1="${L}" y1="${H - B}" x2="${W - 20}" y2="${H - B}" stroke="var(--grid)"/><line x1="${L}" y1="20" x2="${L}" y2="${H - B}" stroke="var(--grid)"/>
    ${[0, 20, 40, 60].map((v) => `<text class="tick" x="${x(v)}" y="${H - B + 16}" text-anchor="middle">${v}%</text>`).join("")}
    ${yTicks.map((v) => `<text class="tick" x="${L - 8}" y="${y(v) + 3}" text-anchor="end">${v}${KS2 ? "%" : ""}</text>`).join("")}
    <text class="tick" x="${(W + L) / 2}" y="${H - 6}" text-anchor="middle">whole-school FSM</text>
    <text class="tick" x="16" y="${(H - B) / 2}" transform="rotate(-90 16 ${(H - B) / 2})" text-anchor="middle">${MEASURE}</text>`;
  return section("Context and outcomes", vsMarks ? `${esc(LBL.a)} and ${esc(LBL.b)} on one canvas, given their intakes.` : `Where the scope sits against every state-funded ${PHASE} in England, given its intake.`,
    "Association, not causation; the grey cloud is the rest of the country.",
    `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img">${axes}${cloud}${marks}</svg>` + legend(vsMarks
      ? [["var(--purple)", LBL.a || "Scope"], ["var(--gold)", LBL.b || "Comparison"], ["var(--slo)", `Every other state-funded ${PHASE}`]]
      : [["var(--purple)", "Scope school"], ["var(--slo)", `Every other state-funded ${PHASE}`]]));
}

function distributionHtml(d, ctx) {
  const KS2 = d.kind === "ks2";
  const L = (ctx && ctx.labels) || {};
  const vs = ctx && ctx.vs ? ctx.vs : null;
  const SPAN = KS2 ? 100 : 90, XT = KS2 ? [0, 25, 50, 75, 100] : [0, 30, 60, 90];
  const W = 1000, H = 250, B = 34;
  const maxN = Math.max(...d.bins.map((b) => b.n));
  const bw = (W - 60) / d.bins.length;
  /* a scope that IS most of the nation has no subset to mark: 3,300 gold
     strokes are a wall, not a chart. The nation gets its own shape instead. */
  const national = !vs && d.marks.length > d.total * 0.5;
  const bars = d.bins.map((b, i) => { const h = (b.n / maxN) * (H - B - 30); return `<rect x="${40 + i * bw + 1}" y="${H - B - h}" width="${bw - 2}" height="${h}" fill="${national ? "var(--gold)" : "var(--lilac)"}"${national ? ` ${hit([`${KS2 ? "RWM" : "A8"} ${b.lo} to ${b.hi}`, `${b.n} schools`])}` : ""}/>`; }).join("");
  const line = (m, color) => { const px = 40 + (Math.max(0, Math.min(SPAN - 0.1, m.a8)) / SPAN) * (W - 60); return `<line x1="${px.toFixed(1)}" y1="26" x2="${px.toFixed(1)}" y2="${H - B}" stroke="${color}" stroke-width="4" stroke-opacity="0.85"${hit([m.name, KS2 ? `RWM ${f0(m.a8)}` : `A8 ${f1(m.a8)}`], m.urn)}/>`; };
  const marks = national ? "" : (vs ? vs.marks.map((m) => line(m, "var(--purple)")).join("") : "") + d.marks.map((m) => line(m, "var(--gold)")).join("");
  const medX = 40 + (d.med / SPAN) * (W - 60);
  return section("Where they sit", vs
    ? `${esc(L.a)} in gold, ${esc(L.b)} in purple, set in the national distribution of ${d.total.toLocaleString("en-GB")} schools.`
    : national
    ? `The shape of the nation: ${d.total.toLocaleString("en-GB")} schools by ${KS2 ? "RWM expected standard" : "Attainment 8"}, half either side of the median.`
    : `Each gold line is a school in scope, set in the national distribution of ${d.total.toLocaleString("en-GB")} schools${KS2 ? " by RWM expected standard" : ""}.`, null,
    `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img">${bars}<line x1="${medX}" y1="26" x2="${medX}" y2="${H - B}" stroke="var(--nat)" stroke-dasharray="3 4"/><text class="tick" x="${medX}" y="18" text-anchor="middle">England median ${KS2 ? f0(d.med) : f1(d.med)}</text>${marks}${XT.map((v) => `<text class="tick" x="${40 + (v / SPAN) * (W - 60)}" y="${H - 14}" text-anchor="middle">${v}${KS2 ? "%" : ""}</text>`).join("")}</svg>`
    + (vs ? legend([["var(--gold)", L.a || "Scope"], ["var(--purple)", L.b || "Comparison"]]) : ""));
}

/* the report cards across a scope: one 100%-stacked strip per evaluation area,
   with England's strip beneath when the scope is narrower than England */
function cardStacksHtml(cards, natCards) {
  if (!cards || !cards.n) return "";
  const sameAsEngland = natCards && cards.n === natCards.n;
  const strip = (dist, thin) => {
    const total = dist.reduce((a, b) => a + b, 0);
    if (!total) return "";
    return `<div class="pz-stack${thin ? " pz-stack-thin" : ""}">${dist.map((v, i) => (v ? `<span style="width:${(v / total) * 100}%;background:${RC_COLS[i]}" title="${escA(RC_GRADES[i])}: ${v} school${v === 1 ? "" : "s"}"></span>` : "")).join("")}</div>`;
  };
  const rows = RC_AREAS.filter(([k]) => cards.areas[k]).map(([k, label]) => {
    const dist = cards.areas[k];
    const total = dist.reduce((a, b) => a + b, 0);
    const good = total ? Math.round(((dist[0] + dist[1] + dist[2]) / total) * 100) : 0;
    const natDist = natCards && natCards.areas[k];
    return `<div class="pz-rcarea"><span class="k">${esc(label)}</span><div class="s">${strip(dist)}${!sameAsEngland && natDist ? strip(natDist, true) : ""}</div><span class="v">${good}% at expected+</span></div>`;
  }).join("");
  const sgLine = cards.sgNot > 0 ? ` Safeguarding was not met in ${cards.sgNot} school${cards.sgNot === 1 ? "" : "s"}.` : " Safeguarding was met in every report-carded school in scope.";
  return `<p class="pz-note" style="margin:26px 0 8px"><strong>The report cards so far.</strong> ${cards.n.toLocaleString("en-GB")} school${cards.n === 1 ? " in scope has" : "s in scope have"} been inspected under the renewed framework; each strip is one evaluation area${!sameAsEngland ? ", with England's strip beneath it" : ""}.${sgLine}</p>
    <div class="pz-rcwrap">${rows}</div>` + legend(RC_GRADES.map((g, i) => [RC_COLS[i], g]));
}

function ofstedHtml(d, ctx) {
  const L = (ctx && ctx.labels) || {};
  const vs = ctx && ctx.vs ? ctx.vs : null;
  const ORDER = ["Outstanding", "Good", "Requires improvement", "Inadequate", "Not yet inspected"];
  const rows = ORDER.filter((k) => d.scope[k] || d.nat[k] || (vs && vs.scope[k])).map((k) => {
    const sn = d.scope[k] || 0, sp = d.n ? Math.round((sn / d.n) * 100) : 0;
    const np = d.natN ? Math.round(((d.nat[k] || 0) / d.natN) * 100) : 0;
    const vp = vs && vs.n ? Math.round(((vs.scope[k] || 0) / vs.n) * 100) : null;
    return `<tr><td class="nm">${esc(k)}</td><td class="num">${sn}</td><td><div class="pz-bar"><span style="width:${sp}%"></span></div></td><td class="num">${sp}%</td>${vs ? `<td class="num">${vp}%</td>` : ""}<td class="num" style="color:var(--muted)">${np}%</td></tr>`;
  }).join("");
  const out = d.scope["Outstanding"] || 0, good = d.scope["Good"] || 0;
  const headline = vs
    ? `${Math.round(((out + good) / (d.n || 1)) * 100)}% of ${esc(L.a)} holds Good or Outstanding against ${Math.round((((vs.scope["Outstanding"] || 0) + (vs.scope["Good"] || 0)) / (vs.n || 1)) * 100)}% of ${esc(L.b)}.`
    : `${out + good} of ${d.n} schools hold Good or Outstanding judgements.`;
  return section("Inspection profile", headline, "Legacy judgements from the previous framework against the national picture; single grades are no longer awarded, so these age in place as report cards replace them.",
    `<table class="pz-table"><thead><tr><th>Judgement</th><th>Schools</th><th></th><th>${vs ? esc(L.a || "Scope") : "Scope"}</th>${vs ? `<th>${esc(L.b || "Comparison")}</th>` : ""}<th>England</th></tr></thead><tbody>${rows}</tbody></table>`
    + cardStacksHtml(d.cards, d.natCards));
}

function attendanceHtml(d, ctx) {
  if (!d.rows.length) return "";
  const vsLine = ctx && ctx.vs && ctx.vs.absMean != null ? ` ${esc((ctx.labels || {}).b || "The comparison")} averages ${f1(ctx.vs.absMean)}%.` : "";
  const better = d.rows.filter((r) => r.abs <= d.bench.absMed).length;
  const { rows: shown, capped, segNote } = capRows(d.rows.map((r) => ({
    label: r.name, v: r.abs, urn: r.urn,
    tipLines: [r.name, `Overall absence ${f1(r.abs)}%`, `Persistent ${f1(r.pa)}% · severe ${f1(r.sev)}%`],
  })));
  const hi = Math.max(...d.rows.map((r) => r.abs));
  const headline = `Scope absence averages ${f1(d.absMean)}% against England's median ${f1(d.bench.absMed)}%; ${better} of ${d.rows.length} schools sit at or better than the national median.${vsLine}`;
  const tbl = `<details class="pz-fold"><summary>Every school's attendance<span>${d.rows.length} schools</span></summary><table class="pz-table"><thead><tr><th>School</th><th>Overall absence</th><th>Persistent (10%+)</th><th>Severe (50%+)</th></tr></thead><tbody>${d.rows.map((r) => `<tr><td class="nm">${esc(r.name)}</td><td class="num">${f1(r.abs)}%</td><td class="num">${f1(r.pa)}%</td><td class="num">${f1(r.sev)}%</td></tr>`).join("")}</tbody></table></details>`;
  return section("Attendance", headline,
    (segNote || "") + (capped ? `Showing the best and worst ${Math.floor(shown.length / 2)} of ${d.rows.length}. ` : "") + "Sorted lowest absence first; persistent and severe absence in the tooltips and the table.",
    columnsSvg({ rows: shown, min: 0, max: Math.min(30, Math.ceil((hi + 2) / 5) * 5), unit: "%", refs: [{ v: d.bench.absMed, label: "England", color: "var(--nat)" }, { v: d.absMean, label: "Scope", color: "var(--gold)" }] }) + tbl);
}

/* ── the cohort flow: eleven Januaries, each cohort walked stage by stage ── */
const FLOWC = ["#3D0661", "#6A0CA0", "#8F5BB8", "#B18FD0", "#C6A035", "#8a6d1c", "#B4475A"];
function flowHtml(d) {
  if (!d || d.mode !== "flow") return "";
  const YL = (tp) => tp.slice(2, 4) + "/" + tp.slice(4);
  const ST = (g) => (g === 0 ? "R" : "Y" + g);
  const sign = (v) => (v > 0 ? "+" : "") + v;
  const stages = [];
  for (let g = d.entry; g <= d.last; g++) stages.push(g);

  /* 1: the years, stacked by stage */
  const colTotals = d.years.map((tp, yi) => stages.reduce((a, g) => a + (d.totals[yi][g] || 0), 0));
  const maxT = Math.max(...colTotals, 1);
  const W = 760, H = 250, pl = 10, pb = 34, pt = 24, cw = (W - 2 * pl) / d.years.length;
  let stacked = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:760px;height:auto" role="img">`;
  d.years.forEach((tp, yi) => {
    let y = H - pb;
    const x = pl + yi * cw + cw * 0.14, bw = cw * 0.72;
    stages.forEach((g, gi) => {
      const v = d.totals[yi][g] || 0;
      if (!v) return;
      const h = ((H - pb - pt) * v) / maxT;
      y -= h;
      stacked += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0.5, h).toFixed(1)}" fill="${FLOWC[gi % FLOWC.length]}"><title>${YL(tp)} · ${ST(g)}: ${v}</title></rect>`;
    });
    if (colTotals[yi]) stacked += `<text class="val" x="${(x + bw / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" style="font-size:10.5px;fill:var(--ink)">${colTotals[yi]}</text>`;
    stacked += `<text class="tick" x="${(x + bw / 2).toFixed(1)}" y="${H - 12}" text-anchor="middle">${YL(tp)}</text>`;
  });
  stacked += "</svg>" + legend(stages.map((g, gi) => [FLOWC[gi % FLOWC.length], ST(g)]));

  /* 2: the cohorts, walked diagonally */
  const starts = d.cohorts.map((c) => c.start);
  const allV = d.cohorts.flatMap((c) => c.pts.map((p) => p.v)).filter((v) => v > 0);
  const lo = Math.min(...allV), hi = Math.max(...allV, 1);
  const CW = 700, CH = 240, cpl = 44, cpr = 120, cpt = 16, cpb = 32;
  const cx = (k) => cpl + (k / Math.max(1, stages.length - 1)) * (CW - cpl - cpr);
  const cy = (v) => cpt + (CH - cpt - cpb) * (1 - (v - lo * 0.92) / (hi * 1.04 - lo * 0.92));
  let lines = `<svg viewBox="0 0 ${CW} ${CH}" style="width:100%;max-width:700px;height:auto" role="img">`;
  stages.forEach((g, k) => { lines += `<text class="tick" x="${cx(k)}" y="${CH - 10}" text-anchor="middle">${ST(g)}</text>`; });
  const ends = [];
  d.cohorts.forEach((c, ci) => {
    const col = FLOWC[ci % FLOWC.length];
    const pts = c.pts.filter((p) => p.v > 0);
    if (pts.length < 2) return;
    lines += `<polyline points="${pts.map((p) => `${cx(p.g - d.entry).toFixed(1)},${cy(p.v).toFixed(1)}`).join(" ")}" fill="none" stroke="${col}" stroke-width="${c.full ? 2.4 : 1.6}"${c.full ? "" : ' stroke-dasharray="4 4"'} opacity="0.9"/>`;
    pts.forEach((p) => { lines += `<circle cx="${cx(p.g - d.entry).toFixed(1)}" cy="${cy(p.v).toFixed(1)}" r="3" fill="${col}"><title>${ST(p.g)} in ${YL(d.years[p.yi])}: ${p.v}</title></circle>`; });
    const lastP = pts[pts.length - 1];
    ends.push({ y: cy(lastP.v), x: cx(lastP.g - d.entry), col, label: `${YL(d.years[c.y0])} intake · ${sign(lastP.v - c.start)}` });
  });
  ends.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
  ends.forEach((e) => { lines += `<text x="${(e.x + 8).toFixed(1)}" y="${(e.y + 3.5).toFixed(1)}" style="font-size:10.5px;font-weight:600;fill:${e.col}">${esc(e.label)}</text>`; });
  lines += "</svg>";

  /* 3: shrinkage, named */
  const shr = d.shrinks.length ? `<details class="pz-fold"><summary>Where cohorts shrank, school by school<span>${d.shrinkN} falls of 8 or more</span></summary><table class="pz-table"><thead><tr><th>School</th><th>Stage</th><th>By January</th><th>From</th><th>To</th><th>Change</th></tr></thead><tbody>${d.shrinks.map((s) => `<tr><td class="nm">${esc(s.name)}</td><td class="num">into ${ST(s.g)}</td><td class="num">${YL(s.year)}</td><td class="num">${s.from}</td><td class="num">${s.to}</td><td class="num" style="color:var(--red);font-weight:600">${s.d}</td></tr>`).join("")}</tbody></table></details>` : "";

  /* 4: exclusions beside the flow */
  const exTrend = d.excl.length > 2 ? trendSvg(d.excl.map((e) => ({ t: YL(e.tp), v: e.rate })), null, { min: 0, max: Math.max(10, Math.ceil(Math.max(...d.excl.map((e) => e.rate)) / 5) * 5), unit: "", dp: 1 }) : "";
  const peTotal = d.excl.reduce((a, e) => a + (e.pe > 0 ? e.pe : 0), 0);

  const first = d.intake[0], lastIn = d.intake[d.intake.length - 1];
  const doneCohorts = d.cohorts.filter((c) => c.full);
  const worst = doneCohorts.slice().sort((a, b) => (a.end - a.start) - (b.end - b.start))[0];
  const headline = `${d.n} of ${d.of} scope school${d.of === 1 ? "" : "s"} carry census history. The ${ST(d.entry)} intake ran from ${first ? first.v : "–"} in ${YL(d.years[first ? first.yi : 0])} to ${lastIn ? lastIn.v : "–"} in ${YL(d.years[lastIn ? lastIn.yi : 0])}${worst ? `; the ${YL(d.years[worst.y0])} cohort changed most on its way through, ${sign(worst.end - worst.start)} between ${ST(d.entry)} and ${ST(d.last)}` : ""}.`;
  const NOTE = `January school censuses, 2015/16 to 2025/26. A cohort is read diagonally: one January's ${ST(d.entry)} is the next January's ${ST(d.entry + 1)}, so a fall between stages is net movement out of these schools, not absence. Dashed cohorts are still travelling.${d.chainedN ? ` ${d.chainedN} school${d.chainedN === 1 ? "" : "s"} changed URN mid-series (academisation): histories stitched into one line.` : ""} Suspension rate is suspensions per 100 pupils across the scope; small counts the DfE suppresses are left out.`;

  return section("Cohort flow", headline,
    NOTE,
    `<p class="pz-note" style="margin:4px 0 6px">The years, stacked ${ST(d.entry)} to ${ST(d.last)}; every column a January.</p>` + stacked +
    `<p class="pz-note" style="margin:18px 0 6px">Each line one cohort, followed ${ST(d.entry)} to ${ST(d.last)}; falling lines are children leaving these schools.</p>` + lines + shr +
    (exTrend ? `<p class="pz-note" style="margin:18px 0 6px">Suspensions per 100 pupils across the scope, year by year${peTotal ? `; ${peTotal} permanent exclusions over the period` : ""}.</p>` + exTrend : ""));
}

/* ── post-16 ─────────────────────────────────────────────────────────── */
const f2 = (v) => (v == null ? "–" : (v > 0 ? "+" : "") + v.toFixed(2));
const BANDC = { "-2": "#B4475A", "-1": "#D98C9A", 0: "#B18FD0", 1: "#8F5BB8", 2: "#3D0661" };

/* two lines through the published years: the scope, and England dashed */
function dualTrendSvg(points, { min, max, unit = "", dp = 1, a = "Scope", b = "England" }) {
  const pts = points.filter((p) => p.v != null || p.nat != null);
  if (pts.length < 2) return "";
  const W = 660, H = 210, pl = 46, pr = 86, pt = 22, pb = 34;
  const x = (i) => pl + (i / (points.length - 1)) * (W - pl - pr);
  const y = (v) => pt + (H - pt - pb) * (1 - (v - min) / (max - min));
  const F = (v) => (dp === 0 ? String(Math.round(v)) : v.toFixed(dp));
  let s = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:660px;height:auto" role="img">`;
  niceTicks(min, max, 4).forEach((t) => { s += `<line class="gridl" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/><text class="tick" x="${pl - 6}" y="${y(t) + 3.5}" text-anchor="end">${t}${unit}</text>`; });
  const line = (k, col, dash) => {
    const seg = points.map((p, i) => (p[k] == null ? null : `${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`)).filter(Boolean);
    if (seg.length < 2) return "";
    return `<polyline points="${seg.join(" ")}" fill="none" stroke="${col}" stroke-width="${dash ? 1.6 : 2.6}"${dash ? ' stroke-dasharray="5 4"' : ""}/>`;
  };
  s += line("nat", "var(--nat)", true) + line("v", "var(--purple)", false);
  points.forEach((p, i) => {
    if (p.nat != null) s += `<circle cx="${x(i)}" cy="${y(p.nat)}" r="3" fill="var(--nat)"/>`;
    if (p.v != null) s += `<circle cx="${x(i)}" cy="${y(p.v)}" r="4.6" fill="var(--purple)" stroke="var(--paper)" stroke-width="1.6"/><text class="val" x="${x(i)}" y="${y(p.v) - 9}" text-anchor="middle" style="font-size:11px;fill:var(--ink)">${F(p.v)}${unit}</text>`;
    s += `<text class="tick" x="${x(i)}" y="${H - 10}" text-anchor="middle">${esc(p.t)}</text>`;
  });
  const last = [...points].reverse().find((p) => p.v != null), lastN = [...points].reverse().find((p) => p.nat != null);
  if (last) s += `<text class="reftxt" x="${W - pr + 8}" y="${y(last.v) + 4}" style="fill:var(--purple);font-weight:600">${esc(a)}</text>`;
  if (lastN) s += `<text class="reftxt" x="${W - pr + 8}" y="${y(lastN.nat) + (last && Math.abs(y(last.v) - y(lastN.nat)) < 12 ? 16 : 4)}" style="fill:var(--nat)">${esc(b)}</text>`;
  return s + "</svg>";
}

/* the forest: each row a dot with its 95% confidence interval; a whisker
   clear of zero is the only honest "above" or "below" */
function forestSvg(rows, { label = "School", note = "" } = {}) {
  if (!rows.length) return "";
  const lo = Math.min(-0.6, ...rows.map((r) => (r.lo != null ? r.lo : r.v) - 0.05));
  const hi = Math.max(0.6, ...rows.map((r) => (r.hi != null ? r.hi : r.v) + 0.05));
  const W = 760, rh = 22, pl = 230, pr = 64, pt = 26, H = pt + rows.length * rh + 26;
  const x = (v) => pl + ((v - lo) / (hi - lo)) * (W - pl - pr);
  let s = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:760px;height:auto" role="img">`;
  niceTicks(lo, hi, 6).forEach((t) => { s += `<line class="gridl" x1="${x(t)}" x2="${x(t)}" y1="${pt - 6}" y2="${H - 22}"/><text class="tick" x="${x(t)}" y="${H - 8}" text-anchor="middle">${t > 0 ? "+" : ""}${t}</text>`; });
  s += `<line x1="${x(0)}" x2="${x(0)}" y1="${pt - 10}" y2="${H - 22}" stroke="var(--ink)" stroke-width="1.2"/><text class="reftxt" x="${x(0)}" y="${pt - 13}" text-anchor="middle">England's expected progress</text>`;
  rows.forEach((r, i) => {
    const cy = pt + i * rh + rh / 2;
    const col = r.sig === 1 ? "var(--purple)" : r.sig === -1 ? "var(--red)" : "var(--muted)";
    const tip = [r.label, `Value added ${f2(r.v)}${r.lo != null ? ` (95% interval ${f2(r.lo)} to ${f2(r.hi)})` : ""}`, ...(r.tip || [])];
    s += `<g${hit(tip, r.urn)}><rect x="0" y="${cy - rh / 2}" width="${W}" height="${rh}" fill="transparent"/>`;
    s += `<text class="lab" x="${pl - 10}" y="${cy + 4}" text-anchor="end" style="font-size:11.5px;fill:var(--ink)">${esc(short(r.label, 34))}</text>`;
    if (r.lo != null && r.hi != null) s += `<line x1="${x(r.lo)}" x2="${x(r.hi)}" y1="${cy}" y2="${cy}" stroke="${col}" stroke-width="2" opacity="0.55"/>`;
    s += `<circle cx="${x(r.v)}" cy="${cy}" r="5" fill="${col}"/><text class="val" x="${W - pr + 8}" y="${cy + 4}" style="font-size:11px;fill:${col};font-weight:600">${f2(r.v)}</text></g>`;
  });
  return s + "</svg>";
}

function post16Html(d, ctx) {
  if (!d || d.mode !== "post16") return "";
  const L = ctx && ctx.labels ? ctx.labels.a : null;
  if (d.empty) return section("Sixth form", `None of the ${d.of} schools in scope publishes 16 to 18 results.`, "The 16 to 19 performance tables cover school sixth forms, sixth form colleges and FE colleges; a scope of 11 to 16 schools has none.", "");
  const single = d.n === 1 && d.rows.length === 1;
  const one = single ? d.rows[0] : null;
  const gap = d.daD != null && d.daO != null ? r1(d.daO - d.daD) : null, natGap = d.daNatD != null && d.daNatO != null ? r1(d.daNatO - d.daNatD) : null;
  const bandWord = (b) => (p16Band(b) || "").toLowerCase();
  const headline = single
    ? `${esc(one.name)}: ${one.aN} A level students averaging ${f1(one.aps)} points per entry (${esc(one.grade || "–")}) in 2024/25, against England's ${f1(d.apsNat)}; value added ${f2(one.va)}, ${bandWord(one.band) || "not banded"}.`
    : `${d.withA} of ${d.of} schools in scope ran A level cohorts in 2024/25: ${d.students.toLocaleString("en-GB")} students averaging ${f1(d.apsNow)} points per entry against England's ${f1(d.apsNat)}, with value added of ${f2(d.vaNow)} (England ${f2(d.vaNat)}). ${d.sigUp} ${d.sigUp === 1 ? "sixth form sits" : "sixth forms sit"} clearly above expected progress, ${d.sigDown} clearly below.`;
  const tiles = [
    { n: f1(single ? one.aps : d.apsNow), p: `A level points per entry in 2024/25${single ? `, grade ${esc(one.grade || "–")}` : ", student-weighted"}, against England's ${f1(d.apsNat)} (${esc(d.gradeNat || "")}).`, c: `${P16_LABEL("202324")}: ${f1(single ? one.apsPrev : d.aps[2].v)} · ${P16_LABEL("202122")}: ${f1(single ? one.apsSeries[0] : d.aps[0].v)}` },
    { n: f2(single ? one.va : d.vaNow), p: `A level value added: grades against those of students nationally with the same GCSE results. England's state sector ${f2(d.vaNat)}.`, c: single ? (one.lo != null ? `95% interval ${f2(one.lo)} to ${f2(one.hi)} · ${P16_LABEL("202324")}: ${f2(one.vaPrev)}` : "") : `${P16_LABEL("202324")}: ${f2(d.va[0] && d.va[0].v)}` },
    { n: (single ? one.aab : d.aab) != null ? f1(single ? one.aab : d.aab) + "<small>%</small>" : "–", p: `achieved AAB or better, two in facilitating subjects, against England's ${f1(d.aabNat)}%.`, c: `best three A levels ${f1(single ? one.b3 : d.b3)} (${esc(single ? one.b3g || "–" : "")}${single ? "" : "England " + f1(d.b3Nat)})` },
    { n: (single ? one.ret : d.ret) != null ? f1(single ? one.ret : d.ret) + "<small>%</small>" : "–", p: `of A level students retained to the end of their main programme, against England's ${f1(d.retNat)}%.`, c: gap != null ? `disadvantaged ${f1(single ? one.daD : d.daD)} vs others ${f1(single ? one.daO : d.daO)} points per entry` : "" },
  ];
  const tileHtml = `<div class="pz-tiles">${tiles.map((t) => `<div class="pz-tile"><div class="n">${t.n}</div><p>${t.p}</p>${t.c ? `<div class="cmp">${t.c}</div>` : ""}</div>`).join("")}</div>`;

  /* four years of attainment, two of value added */
  const pts = d.aps.map((x) => ({ t: P16_LABEL(x.tp), v: single ? one.apsSeries[d.aps.indexOf(x)] : x.v, nat: x.nat }));
  const vals = pts.flatMap((p) => [p.v, p.nat]).filter((v) => v != null);
  const trend = dualTrendSvg(pts, { min: Math.floor((Math.min(...vals) - 3) / 5) * 5, max: Math.ceil((Math.max(...vals) + 3) / 5) * 5, a: single ? "This school" : L && L.length <= 14 ? L : "Scope" });

  const forest = single ? "" : forestSvg(d.rows.filter((r) => r.va != null).map((r) => ({
    label: r.name, urn: r.urn, v: r.va, lo: r.lo, hi: r.hi, sig: r.sig,
    tip: [`${r.aN} A level students · ${f1(r.aps)} points per entry (${r.grade || "–"})`, `${p16Band(r.band) || ""}${r.vaPrev != null ? ` · 2023/24 ${f2(r.vaPrev)}` : ""}`],
  })));
  const bandRow = single ? "" : legend([[BANDC[2], `Well above ${d.bands[2]}`], [BANDC[1], `Above ${d.bands[1]}`], [BANDC[0], `Average ${d.bands[0]}`], [BANDC[-1], `Below ${d.bands[-1]}`], [BANDC[-2], `Well below ${d.bands[-2]}`]]);

  const routes = [];
  const agN = single ? one.agN : d.rows.reduce((a, r) => a + (r.agN || 0), 0);
  if (agN) routes.push(`applied general (vocational) students ${agN.toLocaleString("en-GB")}, value added ${f2(single ? one.agVa : d.agVa.length ? d.agVa[d.agVa.length - 1].v : null)}`);
  const gapLine = gap != null ? ` Disadvantaged A level students average ${f1(single ? one.daD : d.daD)} points per entry against ${f1(single ? one.daO : d.daO)} for others${natGap != null ? `, a gap of ${f1(single ? r1(one.daO - one.daD) : gap)} against England's ${f1(natGap)}` : ""}.` : "";

  const tbl = single ? "" : `<details class="pz-fold"><summary>Every sixth form, measure by measure<span>${d.rows.length} schools</span></summary><table class="pz-table"><thead><tr><th>School</th><th>A level students</th><th>Points per entry</th><th>Value added</th><th>Band</th><th>2023/24 VA</th><th>AAB</th><th>Retained</th><th>Disadv. / others</th><th>Applied general VA</th></tr></thead><tbody>${d.rows.map((r) => `<tr><td class="nm">${esc(r.name)}</td><td class="num">${r.aN ?? "–"}</td><td class="num">${f1(r.aps)} ${esc(r.grade || "")}</td><td class="num" style="font-weight:600;color:${r.sig === 1 ? "var(--purple)" : r.sig === -1 ? "var(--red)" : "inherit"}">${f2(r.va)}</td><td class="num">${esc(p16Band(r.band) || "–")}</td><td class="num">${f2(r.vaPrev)}</td><td class="num">${r.aab != null ? f1(r.aab) + "%" : "–"}</td><td class="num">${r.ret != null ? f1(r.ret) + "%" : "–"}</td><td class="num">${f1(r.daD)} / ${f1(r.daO)}</td><td class="num">${f2(r.agVa)}</td></tr>`).join("")}</tbody></table></details>`;
  const coll = d.colleges && d.colleges.length ? `<details class="pz-fold"><summary>Colleges in the same area, outside this scope<span>${d.colleges.length}</span></summary><table class="pz-table"><thead><tr><th>College</th><th>Type</th><th>A level students</th><th>Points per entry</th><th>Value added</th><th>Academic VA</th></tr></thead><tbody>${d.colleges.map((c) => `<tr><td class="nm">${esc(c.name)}</td><td>${esc(c.type)}</td><td class="num">${c.a[0] ?? "–"}</td><td class="num">${f1(c.a[1])} ${esc(c.a[2] || "")}</td><td class="num">${f2(c.a[3])}</td><td class="num">${f2(c.ac ? c.ac[3] : null)}</td></tr>`).join("")}</tbody></table></details>` : "";

  const NOTE = `DfE 16 to 19 performance tables, final data. Points per entry: A* = 60, A = 50, B = 40, C = 30, D = 20, E = 10. Value added compares each student's grades with those of students nationally with similar GCSE results; 0 is expected progress, +0.5 is half a grade per entry above it. It was not published for 2021/22 or 2022/23, because those students' GCSEs were teacher-assessed, so the value added line has two points. A sixth form is clearly above or below only when its 95% interval clears zero.`;
  return section("Sixth form", headline, NOTE,
    tileHtml +
    (trend ? `<p class="pz-note" style="margin:16px 0 6px">A level points per entry, every published year${single ? "" : ", student-weighted across the scope"}; England's state sector dashed.</p>` + trend : "") +
    (forest ? `<p class="pz-note" style="margin:18px 0 6px">A level value added, 2024/25: each dot a sixth form, each line its 95% confidence interval. Purple clears zero above, red below.</p>` + forest + bandRow : "") +
    (routes.length || gapLine ? `<p class="pz-note" style="margin:14px 0 0">${routes.length ? "Beyond A level: " + esc(routes.join("; ")) + "." : ""}${gapLine}</p>` : "") +
    tbl + coll);
}

function subjectsHtml(d) {
  if (!d || d.mode !== "subjects") return "";
  if (d.empty) return section("A level subjects", "No A level subject results are published for this scope.", "", "");
  /* the headline names subjects with enough entries to mean something */
  const solid = d.rows.filter((r) => r.entries >= (d.single ? 10 : 30));
  const pool = solid.length >= 2 ? solid : d.rows;
  const top = pool[0], low = pool[pool.length - 1];
  const list = (rs) => rs.map((r) => `${esc(r.name)} (${f2(r.va)})`).join(rs.length > 2 ? ", " : " and ");
  const ups = d.rows.filter((r) => r.sig === 1), downs = d.rows.filter((r) => r.sig === -1);
  const headline = d.single
    ? (ups.length || downs.length
      ? `${esc(d.name)}, 2024/25: ${ups.length ? `clearly above expected progress in ${list(ups.slice(0, 3))}` : "no subject clearly above expected progress"}; ${downs.length ? `clearly below in ${list(downs.slice(0, 3))}` : "none clearly below"}.`
      : `${esc(d.name)}, 2024/25: no subject's interval clears zero. The strongest point estimate is ${esc(top.name)} (${f2(top.va)}), the weakest ${esc(low.name)} (${f2(low.va)}).`)
    : `Across ${d.n} sixth forms, ${esc(top.name)} added most in 2024/25 (${f2(top.va)} over ${top.entries.toLocaleString("en-GB")} entries) and ${esc(low.name)} least (${f2(low.va)}).`;
  const forest = forestSvg(d.rows.map((r) => ({
    label: r.name, v: r.va, lo: r.lo, hi: r.hi, sig: d.single ? r.sig : r.va >= 0.15 ? 1 : r.va <= -0.15 ? -1 : 0,
    tip: [`${r.entries} entries${d.single ? "" : ` across ${r.schools} school${r.schools === 1 ? "" : "s"}`}`, `A*-A ${r.aStarA != null ? f1(r.aStarA) + "%" : "–"} (England ${r.natA != null ? f1(r.natA) + "%" : "–"}) · A*-B ${r.aStarB != null ? f1(r.aStarB) + "%" : "–"} (England ${r.natB != null ? f1(r.natB) + "%" : "–"})`, r.vaPrev != null ? `2023/24 value added ${f2(r.vaPrev)}` : "", ...(!d.single && (r.up || r.down) ? [`${r.up} school${r.up === 1 ? "" : "s"} clearly above, ${r.down} clearly below`] : [])].filter(Boolean),
  })));
  const tbl = `<details class="pz-fold"${d.single ? " open" : ""}><summary>Subject by subject<span>${d.rows.length} subjects</span></summary><table class="pz-table"><thead><tr><th>Subject</th><th>Entries</th><th>Value added</th>${d.single ? "<th>95% interval</th>" : "<th>Schools</th>"}<th>2023/24</th><th>A*-A</th><th>England A*-A</th><th>A*-B</th><th>England A*-B</th></tr></thead><tbody>${d.rows.map((r) => `<tr><td class="nm">${esc(r.name)}</td><td class="num">${r.entries}</td><td class="num" style="font-weight:600;color:${r.sig === 1 ? "var(--purple)" : r.sig === -1 ? "var(--red)" : "inherit"}">${f2(r.va)}</td><td class="num">${d.single ? (r.lo != null ? `${f2(r.lo)} to ${f2(r.hi)}` : "–") : `${r.schools}${r.up || r.down ? ` (${r.up}↑ ${r.down}↓)` : ""}`}</td><td class="num">${f2(r.vaPrev)}</td><td class="num">${r.aStarA != null ? f1(r.aStarA) + "%" : "–"}</td><td class="num">${r.natA != null ? f1(r.natA) + "%" : "–"}</td><td class="num">${r.aStarB != null ? f1(r.aStarB) + "%" : "–"}</td><td class="num">${r.natB != null ? f1(r.natB) + "%" : "–"}</td></tr>`).join("")}</tbody></table></details>`;
  const NOTE = d.single
    ? "Subject value added, 2024/25: each subject's grades against those of students nationally with similar GCSE results; the line is its 95% confidence interval, so a small class's line is long. Purple clears zero above, red below. Grade shares from the same year's entries; small counts the DfE suppresses are left out."
    : "Subject value added, 2024/25, pooled across the scope's sixth forms and weighted by entries; subjects with fewer than 10 entries are left out. Purple marks +0.15 or better (an eighth of a grade per entry), red −0.15 or worse; the tooltips count the schools whose own interval clears zero. Grade shares from the same year.";
  return section("A level subjects", headline, NOTE, forest + tbl);
}

function behaviourHtml(d, ctx) {
  if (!d.rows.length) return "";
  const vsLine = ctx && ctx.vs && ctx.vs.suspMean != null ? ` ${esc((ctx.labels || {}).b || "The comparison")}: ${f1(ctx.vs.suspMean)} per 100, ${ctx.vs.pexZero} with none.` : "";
  const { rows: shown, capped, segNote } = capRows(d.rows.map((r) => ({
    label: r.name, v: r.susp, urn: r.urn,
    tipLines: [r.name, `Suspensions ${f1(r.susp)} per 100 pupils`, `${r.s1 == null ? "–" : f1(r.s1) + "% suspended at least once"} · permanent exclusions ${r.pex == null ? "–" : f1(r.pex)}`],
  })));
  const hi = Math.max(...d.rows.map((r) => r.susp));
  const headline = `Suspensions average ${f1(d.suspMean)} per 100 pupils against England's median ${f1(d.bench.suspMed)}, and ${d.pexZero} of ${d.rows.length} schools recorded no permanent exclusions.${vsLine}`;
  return section("Suspensions and exclusions", headline, (segNote || "") + (capped ? `Showing the two ends of ${d.rows.length} schools. ` : "") + "Sorted lowest suspension rate first.",
    columnsSvg({ rows: shown, min: 0, max: Math.ceil((hi + 3) / 10) * 10, refs: [{ v: d.bench.suspMed, label: "England", color: "var(--nat)" }] }));
}

function workforceHtml(d, ctx) {
  if (!d.rows.length) return "";
  const vsLine = ctx && ctx.vs && ctx.vs.turnMean != null ? ` ${esc((ctx.labels || {}).b || "The comparison")}'s turnover averages ${f1(ctx.vs.turnMean)}%.` : "";
  const { rows: shown, capped, segNote } = capRows(d.rows.filter((r) => r.turn != null).map((r) => ({
    label: r.name, v: r.turn, urn: r.urn,
    tipLines: [r.name, `Teacher turnover ${f1(r.turn)}%`, `PTR ${f1(r.ptr)} · vacancy rate ${f1(r.vac)}% · ${r.pay != null ? "mean pay £" + r.pay.toLocaleString("en-GB") : "pay withheld"}`],
  })));
  if (!shown.length) return "";
  const hi = Math.max(...d.rows.map((r) => r.turn ?? 0));
  const headline = `Teacher turnover averages ${f1(d.turnMean)}% against England's median ${f1(d.bench.turnMed)}%, and ${d.vacCount} of ${d.rows.length} schools carried unfilled posts in the November census.${vsLine}`;
  const tbl = `<details class="pz-fold"><summary>The workforce, school by school<span>${d.rows.length} schools</span></summary><table class="pz-table"><thead><tr><th>School</th><th>Turnover</th><th>PTR</th><th>Vacancy rate</th><th>Sick days / teacher</th><th>Mean pay</th></tr></thead><tbody>${d.rows.map((r) => `<tr><td class="nm">${esc(r.name)}</td><td class="num">${f1(r.turn)}%</td><td class="num">${f1(r.ptr)}</td><td class="num">${f1(r.vac)}%</td><td class="num">${f1(r.sick)}</td><td class="num">${r.pay != null ? "£" + r.pay.toLocaleString("en-GB") : "–"}</td></tr>`).join("")}</tbody></table></details>`;
  return section("The workforce", headline,
    (segNote || "") + (capped ? `Showing the two ends of ${d.rows.length} schools. ` : "") + "Sorted highest turnover first: the share of teachers who left their school between the last two censuses. Ratios, vacancies and pay in the tooltips and the table.",
    columnsSvg({ rows: shown, min: 0, max: Math.min(80, Math.ceil((hi + 4) / 10) * 10), unit: "%", refs: [{ v: d.bench.turnMed, label: "England", color: "var(--nat)" }, { v: d.turnMean, label: "Scope", color: "var(--gold)" }] }) + tbl);
}

/* the early years: GLD and phonics, authority by authority — the DfE
   publishes no school-level EYFSP or phonics, and the block says so */
function earlyHtml(d) {
  if (!d || !d.rows || !d.rows.length) return "";
  const NOTE = "Reception (EYFSP good level of development) and the Year 1 phonics check, 2025/26. Published at authority level only: the DfE releases no school-level early years figures, so the scope's authorities stand in for its schools.";
  const sign2 = (v) => (v == null ? null : (v >= 0 ? "+" : "") + (Math.round(v * 10) / 10));
  if (d.mode === "one") {
    const r = d.rows[0];
    const dGld = r.gldPrev != null && r.gld != null ? r.gld - r.gldPrev : null;
    const dPh = r.ph1Prev != null && r.ph1 != null ? r.ph1 - r.ph1Prev : null;
    const headline = `In ${esc(r.name)}, ${f1(r.gld)}% of children reached a good level of development${dGld != null ? ` (${sign2(dGld)} on last year)` : ""} and ${f0(r.ph1)} passed the Year 1 phonics check, against England's ${f1(d.nat ? d.nat.gld : null)}% and ${f0(d.nat ? d.nat.ph1 : null)}.`;
    const bars = `<div class="pz-mwrap"><div class="pz-mgroup"><h3>${esc(r.name)}, against England's marker</h3>
      ${mrow("Good level of development", r.gld, d.nat ? d.nat.gld : null, 100, "%")}
      ${mrow("Expected level, all early learning goals", r.allElg, d.nat ? d.nat.allElg : null, 100, "%")}
      ${mrow("Phonics expected standard, Year 1", r.ph1, d.nat ? d.nat.ph1 : null, 100, "%", 0)}
      ${mrow("Phonics by the end of Year 2", r.ph2, d.nat ? d.nat.ph2 : null, 100, "%", 0)}
      ${dPh != null ? `<p class="pz-note" style="margin-top:8px">Phonics ${sign2(dPh)} points on 2024/25; average early learning goals per child ${f1(r.elg)} against England's ${f1(d.nat ? d.nat.elg : null)}.</p>` : ""}
    </div></div>`;
    const tr = d.trend.filter((t) => t.gld != null).map((t) => ({ t: t.label, v: t.gld }));
    const trendSection = tr.length > 2 ? `<p class="pz-note" style="margin:20px 0 4px">England's good level of development, year on year; the national recovery this authority sits inside.</p>` + trendSvg(tr, null, { min: 50, max: 85, unit: "%", dp: 1 }) : "";
    return section("The early years", headline, NOTE, bars + trendSection);
  }
  const { rows: shown, capped, segNote } = capRows(d.rows.map((r) => ({
    label: r.name, v: r.gld, urn: null,
    tipLines: [r.name, `GLD ${f1(r.gld)}%${r.gldPrev != null ? ` (${sign2(r.gld - r.gldPrev)} on last year)` : ""} · avg ELGs ${f1(r.elg)}`, `Phonics Y1 ${f0(r.ph1)} · by end of Y2 ${f0(r.ph2)}`, `${r.n} school${r.n === 1 ? "" : "s"} in scope`],
  })));
  const lo = Math.min(...d.rows.map((r) => r.gld ?? 99));
  const headline = `${d.rows.length} authorit${d.rows.length === 1 ? "y" : "ies"} teach this scope's children: good level of development runs from ${f1(d.rows[d.rows.length - 1].gld)}% to ${f1(d.rows[0].gld)}% against England's ${f1(d.nat ? d.nat.gld : null)}%.`;
  const tbl = `<details class="pz-fold"><summary>The early years, authority by authority<span>${d.rows.length} authorities</span></summary><table class="pz-table"><thead><tr><th>Authority</th><th>GLD</th><th>On last year</th><th>Avg ELGs</th><th>Phonics Y1</th><th>By end of Y2</th><th>Scope schools</th></tr></thead><tbody>${d.rows.map((r) => `<tr><td class="nm">${esc(r.name)}</td><td class="num">${f1(r.gld)}%</td><td class="num">${r.gldPrev != null && r.gld != null ? sign2(r.gld - r.gldPrev) : "–"}</td><td class="num">${f1(r.elg)}</td><td class="num">${f0(r.ph1)}</td><td class="num">${f0(r.ph2)}</td><td class="num">${r.n}</td></tr>`).join("")}</tbody></table></details>`;
  return section("The early years", headline, (segNote || "") + (capped ? `Showing the two ends of ${d.rows.length} authorities. ` : "") + NOTE,
    columnsSvg({ rows: shown, min: Math.max(0, Math.floor((lo - 5) / 10) * 10), max: 90, unit: "%", dp: 1, refs: d.nat && d.nat.gld != null ? [{ v: d.nat.gld, label: "England", color: "var(--nat)" }] : [] }) + tbl);
}

function inclusionHtml(d, ctx) {
  if (!d.rows.length) return "";
  const KS2 = d.kind === "ks2";
  const LBL = (ctx && ctx.labels) || {};
  const vsLine = ctx && ctx.vs && ctx.vs.ehcpMean != null ? ` ${esc(LBL.b || "The comparison")} averages ${f1(ctx.vs.ehcpMean)}%.` : "";
  const { rows: shown, capped, segNote } = capRows(d.rows.filter((r) => r.ehcp != null).map((r) => ({
    label: r.name, v: r.ehcp, urn: r.urn,
    tipLines: [r.name, `EHC plans ${f1(r.ehcp)}% (${r.ehcpN ?? "–"} pupils) · SEN support ${f1(r.sup)}%`, r.top ? `Most common need: ${r.top}` : "", r.unit || r.rp ? [r.unit ? `SEN unit${r.unitN ? ` (${r.unitN} pupils)` : ""}` : "", r.rp ? `resourced provision${r.rpN ? ` (${r.rpN} pupils)` : ""}` : ""].filter(Boolean).join(" · ") : ""].filter(Boolean),
  })));
  if (!shown.length) return "";
  const hi = Math.max(...d.rows.map((r) => r.ehcp ?? 0));
  const headline = `EHC plans average ${f1(d.ehcpMean)}% of pupils against England's median ${f1(d.bench.ehcpMed)}%, with SEN support at ${f1(d.supMean)}%; ${d.units} school${d.units === 1 ? " runs" : "s run"} a SEN unit and ${d.rps} ${d.rps === 1 ? "has" : "have"} resourced provision.${vsLine}`;
  const cols = columnsSvg({ rows: shown, min: 0, max: Math.min(60, Math.ceil((hi + 2) / 5) * 5), unit: "%", dp: 1, refs: [{ v: d.bench.ehcpMed, label: "England", color: "var(--nat)" }, ...(d.ehcpMean != null ? [{ v: d.ehcpMean, label: "Scope", color: "var(--gold)" }] : [])] });

  const needsHtml = d.topNeeds && d.topNeeds.length ? `<p class="pz-note" style="margin:16px 0 0">The most common primary need, school by school: ${d.topNeeds.map((t) => `${esc(t.need)} in ${t.n}`).join("; ")}.</p>` : "";

  /* inclusion against outcomes: the question the system is arguing about */
  let scat = "";
  if (d.marks.length && d.cloud.length) {
    const TOP = KS2 ? 100 : 80, MEASURE = KS2 ? "RWM expected standard" : "Attainment 8", PHASE = KS2 ? "primary" : "secondary";
    const W = 1000, H = 420, L = 54, B = 44, XMAX = 15;
    const x = (v) => L + (Math.max(0, Math.min(XMAX, v)) / XMAX) * (W - L - 20);
    const y = (a) => (H - B) - (Math.max(0, Math.min(TOP, a)) / TOP) * (H - B - 20);
    const cloud = d.cloud.map(([e, a]) => `<circle cx="${x(e).toFixed(1)}" cy="${y(a).toFixed(1)}" r="2" fill="var(--slo)"/>`).join("");
    const vsMarks = ctx && ctx.vs ? ctx.vs.marks : null;
    const dot = (m, color) => `<circle cx="${x(m.ehcp).toFixed(1)}" cy="${y(m.y).toFixed(1)}" r="5.2" fill="${color}" stroke="var(--paper)" stroke-width="1.4"${hit([m.name, `EHC plans ${f1(m.ehcp)}% · ${KS2 ? "RWM " + f0(m.y) : "A8 " + f1(m.y)}`], m.urn)}/>`;
    const marks = (vsMarks ? vsMarks.map((m) => dot(m, "var(--gold)")).join("") : "") + d.marks.map((m) => dot(m, "var(--purple)")).join("");
    const yTicks = KS2 ? [25, 50, 75, 100] : [20, 40, 60, 80];
    const axes = `<line x1="${L}" y1="${H - B}" x2="${W - 20}" y2="${H - B}" stroke="var(--grid)"/><line x1="${L}" y1="20" x2="${L}" y2="${H - B}" stroke="var(--grid)"/>
      ${[0, 5, 10, 15].map((v) => `<text class="tick" x="${x(v)}" y="${H - B + 16}" text-anchor="middle">${v}%</text>`).join("")}
      ${yTicks.map((v) => `<text class="tick" x="${L - 8}" y="${y(v) + 3}" text-anchor="end">${v}${KS2 ? "%" : ""}</text>`).join("")}
      <text class="tick" x="${(W + L) / 2}" y="${H - 6}" text-anchor="middle">share of pupils with an EHC plan</text>
      <text class="tick" x="16" y="${(H - B) / 2}" transform="rotate(-90 16 ${(H - B) / 2})" text-anchor="middle">${MEASURE}</text>`;
    scat = `<p class="pz-note" style="margin:22px 0 4px">Inclusion and outcomes together: each mark is a scope school on the national cloud; association, not causation.</p>
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img">${axes}${cloud}${marks}</svg>` + legend(vsMarks
      ? [["var(--purple)", LBL.a || "Scope"], ["var(--gold)", LBL.b || "Comparison"], ["var(--slo)", `Every other state-funded ${PHASE}`]]
      : [["var(--purple)", "Scope school"], ["var(--slo)", `Every other state-funded ${PHASE}`]]);
  }

  const mark = (b) => (b ? "●" : "–");
  const tbl = `<details class="pz-fold"><summary>Inclusion, school by school<span>${d.rows.length} schools</span></summary><table class="pz-table"><thead><tr><th>School</th><th>SEN support</th><th>EHC plans</th><th>EHC pupils</th><th>Most common need</th><th>SEN unit</th><th>Resourced provision</th></tr></thead><tbody>${d.rows.map((r) => `<tr><td class="nm">${esc(r.name)}</td><td class="num">${f1(r.sup)}%</td><td class="num">${f1(r.ehcp)}%</td><td class="num">${r.ehcpN ?? "–"}</td><td>${esc(r.top || "–")}</td><td class="num">${mark(r.unit)}${r.unitN ? ` ${r.unitN}` : ""}</td><td class="num">${mark(r.rp)}${r.rpN ? ` ${r.rpN}` : ""}</td></tr>`).join("")}</tbody></table></details>`;
  return section("Inclusion", headline,
    (segNote || "") + (capped ? `Showing the two ends of ${d.rows.length} schools. ` : "") + "The January 2026 school census: pupils with an EHC plan and on SEN support, each school's most common primary need, and specialist places. Sorted highest EHC plan share first.",
    cols + needsHtml + scat + tbl);
}

function financeHtml(d, ctx) {
  if (!d.rows.length) return "";
  const KS2 = d.kind === "ks2";
  const LBL = (ctx && ctx.labels) || {};
  const money = (v) => (v == null ? "–" : (v < 0 ? "−£" + Math.abs(v).toLocaleString("en-GB") : "£" + v.toLocaleString("en-GB")));
  const vsLine = ctx && ctx.vs && ctx.vs.spendMean != null ? ` ${esc(LBL.b || "The comparison")} spends ${money(ctx.vs.spendMean)}.` : "";
  const { rows: shown, capped, segNote } = capRows(d.rows.filter((r) => r.spend != null).map((r) => ({
    label: r.name, v: r.spend / 1000, urn: r.urn,
    tipLines: [r.name, `Spend ${money(r.spend)} per pupil · income ${money(r.income)}`, `Staff ${f1(r.staffPct)}% of spend · energy ${money(r.energy)} per pupil`, `Revenue reserve ${money(r.reserve)} per pupil${r.reserve != null && r.reserve < 0 ? ": in deficit" : ""}`],
  })));
  if (!shown.length) return "";
  const spends = d.rows.map((r) => r.spend).filter((v) => v != null);
  const hi = Math.max(...spends) / 1000, lo = Math.min(...spends) / 1000;
  const headline = `Spend averages ${money(d.spendMean)} per pupil against England's median ${money(d.bench.spendMed)}, and ${d.deficitN} of ${d.rows.length} school${d.rows.length === 1 ? "" : "s"} ${d.deficitN === 1 ? "is" : "are"} carrying a negative revenue reserve.${vsLine}`;
  const cols = columnsSvg({ rows: shown, min: Math.max(0, Math.floor(lo - 1)), max: Math.ceil(hi + 1), unit: "k", dp: 1, refs: [{ v: d.bench.spendMed / 1000, label: "England", color: "var(--nat)" }, ...(d.spendMean != null ? [{ v: d.spendMean / 1000, label: "Scope", color: "var(--gold)" }] : [])] });

  /* spend against outcomes: each mark a scope school on England's cloud */
  let scat = "";
  if (d.marks.length && d.cloud.length) {
    const TOP = KS2 ? 100 : 80, MEASURE = KS2 ? "RWM expected standard" : "Attainment 8", PHASE = KS2 ? "primary" : "secondary";
    const W = 1000, H = 420, L = 54, B = 44, XMIN = 3000, XMAX = 16000;
    const x = (v) => L + ((Math.max(XMIN, Math.min(XMAX, v)) - XMIN) / (XMAX - XMIN)) * (W - L - 20);
    const y = (a) => (H - B) - (Math.max(0, Math.min(TOP, a)) / TOP) * (H - B - 20);
    const cloud = d.cloud.map(([sp, a]) => `<circle cx="${x(sp).toFixed(1)}" cy="${y(a).toFixed(1)}" r="2" fill="var(--slo)"/>`).join("");
    const vsMarks = ctx && ctx.vs ? ctx.vs.marks : null;
    const dot = (m, color) => `<circle cx="${x(m.spend).toFixed(1)}" cy="${y(m.y).toFixed(1)}" r="5.2" fill="${color}" stroke="var(--paper)" stroke-width="1.4"${hit([m.name, `Spend ${money(m.spend)} per pupil · ${KS2 ? "RWM " + f0(m.y) : "A8 " + f1(m.y)}`], m.urn)}/>`;
    const marks = (vsMarks ? vsMarks.map((m) => dot(m, "var(--gold)")).join("") : "") + d.marks.map((m) => dot(m, "var(--purple)")).join("");
    const yTicks = KS2 ? [25, 50, 75, 100] : [20, 40, 60, 80];
    const xTicks = [4000, 7000, 10000, 13000, 16000];
    const axes = `<line x1="${L}" y1="${H - B}" x2="${W - 20}" y2="${H - B}" stroke="var(--grid)"/><line x1="${L}" y1="20" x2="${L}" y2="${H - B}" stroke="var(--grid)"/>
      ${xTicks.map((v) => `<text class="tick" x="${x(v)}" y="${H - B + 16}" text-anchor="middle">£${v / 1000}k</text>`).join("")}
      ${yTicks.map((v) => `<text class="tick" x="${L - 8}" y="${y(v) + 3}" text-anchor="end">${v}${KS2 ? "%" : ""}</text>`).join("")}
      <text class="tick" x="${(W + L) / 2}" y="${H - 6}" text-anchor="middle">spend per pupil</text>
      <text class="tick" x="16" y="${(H - B) / 2}" transform="rotate(-90 16 ${(H - B) / 2})" text-anchor="middle">${MEASURE}</text>`;
    scat = `<p class="pz-note" style="margin:22px 0 4px">Does money buy ${MEASURE.toLowerCase()}? Each mark is a scope school set on the national cloud; association, not causation.</p>
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img">${axes}${cloud}${marks}</svg>` + legend(vsMarks
      ? [["var(--purple)", LBL.a || "Scope"], ["var(--gold)", LBL.b || "Comparison"], ["var(--slo)", `Every other state-funded ${PHASE}`]]
      : [["var(--purple)", "Scope school"], ["var(--slo)", `Every other state-funded ${PHASE}`]]);
  }

  const tbl = `<details class="pz-fold"><summary>The money, school by school<span>${d.rows.length} schools</span></summary><table class="pz-table"><thead><tr><th>School</th><th>Sector</th><th>Income / pupil</th><th>Spend / pupil</th><th>Teaching staff / pupil</th><th>Energy / pupil</th><th>Staff share</th><th>In-year balance / pupil</th><th>Reserve / pupil</th></tr></thead><tbody>${d.rows.map((r) => `<tr><td class="nm">${esc(r.name)}</td><td>${r.sector === "academy" ? "Academy" : "Maintained"}</td><td class="num">${money(r.income)}</td><td class="num">${money(r.spend)}</td><td class="num">${money(r.teach)}</td><td class="num">${money(r.energy)}</td><td class="num">${f1(r.staffPct)}%</td><td class="num" style="color:${r.balance != null && r.balance < 0 ? "var(--down)" : "inherit"}">${money(r.balance)}</td><td class="num" style="color:${r.reserve != null && r.reserve < 0 ? "var(--down)" : "inherit"}">${money(r.reserve)}</td></tr>`).join("")}</tbody></table></details>`;
  return section("The money", headline,
    (segNote || "") + (capped ? `Showing the two ends of ${d.rows.length} schools. ` : "") + "Total spend per pupil, 2024-25 financial year: consistent financial reporting for maintained schools, accounting returns for academies. Sorted highest spend first; income, staff share, energy and reserves in the tooltips and the table.",
    cols + scat + tbl);
}

function destinationsHtml(d, ctx) {
  if (!d.rows.length) return "";
  const vsLine = ctx && ctx.vs && ctx.vs.destMean != null ? ` ${esc((ctx.labels || {}).b || "The comparison")} sustains ${f1(ctx.vs.destMean)}%.` : "";
  const { rows: shown, capped, segNote } = capRows(d.rows.map((r) => ({
    label: r.name, v: r.dest, urn: r.urn,
    tipLines: [r.name, `Sustained destination ${f1(r.dest)}%`, `Education ${f1(r.edu)}% · apprenticeship ${f1(r.appren)}% · work ${f1(r.work)}%`, `Not sustained ${f1(r.notsust)}%`],
  })));
  const lo = Math.min(...d.rows.map((r) => r.dest));
  const headline = `${f1(d.destMean)}% of leavers sustained a destination, against England's median ${f1(d.bench.destMed)}%; in ${d.highNotsust} school${d.highNotsust === 1 ? "" : "s"}, one leaver in ten or more was not sustained.${vsLine}`;
  const tbl = `<details class="pz-fold"><summary>Every school's destinations<span>${d.rows.length} schools</span></summary><table class="pz-table"><thead><tr><th>School</th><th>Sustained</th><th>Education</th><th>Apprenticeship</th><th>Work</th><th>Not sustained</th></tr></thead><tbody>${d.rows.map((r) => `<tr><td class="nm">${esc(r.name)}</td><td class="num">${f1(r.dest)}%</td><td class="num">${f1(r.edu)}%</td><td class="num">${f1(r.appren)}%</td><td class="num">${f1(r.work)}%</td><td class="num" style="color:${r.notsust != null && r.notsust >= 10 ? "var(--down)" : "inherit"}">${f1(r.notsust)}%</td></tr>`).join("")}</tbody></table></details>`;
  return section("Destinations", headline, (segNote || "") + (capped ? `Showing the two ends of ${d.rows.length} schools. ` : "") + "Pupils sustaining education, apprenticeship or employment after key stage 4; the latest published destinations year.",
    columnsSvg({ rows: shown, min: Math.max(0, Math.floor((lo - 6) / 10) * 10), max: 100, unit: "%", refs: [{ v: d.bench.destMed, label: "England", color: "var(--nat)" }, { v: d.destMean, label: "Scope", color: "var(--gold)" }] }) + tbl);
}

/* ── the league: rank the system, not the schools ── */
function leagueHtml(d) {
  if (!d || !d.rows || !d.rows.length) return "";
  const KS2 = d.kind === "ks2";
  const F = KS2 ? f0 : f1;
  const BY = { la: "local authority", trust: "trust", region: "region" }[d.by] || d.by;
  const PL = { la: "authorities", trust: "trusts", region: "regions" }[d.by] || d.by + "s";
  const above = d.rows.filter((r) => r.m >= d.natM).length;
  const headline = `${d.rows[0].name} leads the ${BY} table on ${F(d.rows[0].m)}; ${above} of ${d.rows.length} ${PL} sit at or above England's median of ${F(d.natM)}.`;
  const maxM = d.rows[0].m || 1;
  const row = (r, i) => `<tr><td class="num" style="color:var(--muted)">${i + 1}</td><td class="nm">${esc(r.name)}</td><td class="num">${r.n}</td><td><div class="pz-bar"><span style="width:${Math.max(3, Math.round((r.m / maxM) * 100))}%"></span></div></td><td class="num">${F(r.m)}</td><td class="num" style="color:${r.gap != null && r.gap > d.natGap ? "var(--down)" : "inherit"}">${F(r.gap)}</td><td class="num">${f1(r.abs)}%</td><td class="num">${f1(r.susp)}</td></tr>`;
  const head = `<thead><tr><th></th><th>${esc(BY.charAt(0).toUpperCase() + BY.slice(1))}</th><th>Schools</th><th></th><th>${esc(d.measure)}</th><th>Gap</th><th>Absence</th><th>Susp.</th></tr></thead>`;
  const top = d.rows.slice(0, 15);
  const body = `<table class="pz-table">${head}<tbody>${top.map(row).join("")}</tbody></table>` +
    (d.rows.length > 15 ? `<details class="pz-fold"><summary>The full table<span>${d.rows.length} ${PL}</span></summary><table class="pz-table">${head}<tbody>${d.rows.map(row).join("")}</tbody></table></details>` : "");
  return section("The league", headline,
    `Averages of school-level figures; ${PL} need at least three schools in scope to qualify${d.small ? `, which set ${d.small} aside` : ""}. England: ${esc(d.measure)} median ${F(d.natM)} · gap ${F(d.natGap)} · absence median ${f1(d.natAbs)}%.`,
    body);
}

/* ── the hover card: one delegated listener turns every pz-hit into a live
   tooltip, and every data-urn into a door to the school's Atlas profile.
   Self-contained on purpose: its toString() ships inside the download. ── */
export function attachTipCard(doc, open) {
  var card = doc.createElement("div");
  card.className = "pz-tipcard";
  card.style.display = "none";
  doc.body.appendChild(card);
  function onMove(e) {
    var el = e.target && e.target.closest ? e.target.closest(".pz-hit") : null;
    if (!el) { card.style.display = "none"; return; }
    var lines = (el.getAttribute("data-tip") || "").split("\n");
    while (card.firstChild) card.removeChild(card.firstChild);
    var b = doc.createElement("b"); b.textContent = lines[0] || ""; card.appendChild(b);
    for (var i = 1; i < lines.length; i++) { var sp = doc.createElement("span"); sp.textContent = lines[i]; card.appendChild(sp); }
    if (el.getAttribute("data-urn")) { var a = doc.createElement("i"); a.textContent = "Click for the full picture"; card.appendChild(a); }
    card.style.display = "block";
    var w = card.offsetWidth, h = card.offsetHeight;
    var win = doc.defaultView || window;
    var nx = Math.min(e.clientX + 14, doc.documentElement.clientWidth - w - 10);
    var ny = e.clientY - h - 14; if (ny < 8) ny = e.clientY + 18;
    card.style.left = Math.max(8, nx) + "px";
    card.style.top = (ny + win.scrollY) + "px";
  }
  function onClick(e) {
    var el = e.target && e.target.closest ? e.target.closest(".pz-hit[data-urn]") : null;
    if (!el) return;
    var urn = el.getAttribute("data-urn");
    var win = doc.defaultView || window;
    if (open) open(urn);
    else win.location.href = (win.__PZ_OPEN__ || "/members/prizm") + "?school=" + encodeURIComponent(urn);
  }
  doc.addEventListener("mousemove", onMove);
  doc.addEventListener("click", onClick);
  return function () { doc.removeEventListener("mousemove", onMove); doc.removeEventListener("click", onClick); card.remove(); };
}
export const PZ_TIP_JS = "(" + attachTipCard.toString() + ")(document, null);";

/* ── the school dashboard: one school, the whole record, same hand ── */

/* a measure bar: the school's value as a bar, England's as a gold tick */
function mrow(label, v, eng, max, unit = "", dp = 1) {
  if (v == null) return "";
  const F = (x) => (x == null ? "–" : dp === 0 ? String(Math.round(x)) : (Math.round(x * 10) / 10).toFixed(1));
  const w = Math.max(1.5, Math.min(100, (v / max) * 100));
  const t = eng != null ? Math.max(0, Math.min(100, (eng / max) * 100)) : null;
  return `<div class="pz-mrow"><span class="k">${esc(label)}</span><div class="tr"><span class="fill" style="width:${w.toFixed(1)}%"></span>${t != null ? `<span class="tick" style="left:${t.toFixed(1)}%"></span>` : ""}</div><span class="v">${F(v)}${unit}</span><span class="e">${eng != null ? `England ${F(eng)}${unit}` : ""}</span></div>`;
}
const mgroup = (title, rows) => { const body = rows.filter(Boolean).join(""); return body ? `<div class="pz-mgroup"><h3>${esc(title)}</h3>${body}</div>` : ""; };

/* the trend: the published points we hold, England dashed through them */
function trendSvg(points, engRef, { min, max, unit = "", dp = 1 }) {
  const pts = points.filter((p) => p.v != null);
  if (pts.length < 2) return "";
  const W = 640, H = 190, pl = 46, pr = 18, pt = 22, pb = 34;
  const x = (i) => pl + (i / (points.length - 1)) * (W - pl - pr);
  const y = (v) => pt + (H - pt - pb) * (1 - (v - min) / (max - min));
  const F = (v) => (dp === 0 ? String(Math.round(v)) : v.toFixed(1));
  let s = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:640px;height:auto" role="img">`;
  niceTicks(min, max, 4).forEach((t) => { s += `<line class="gridl" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/><text class="tick" x="${pl - 6}" y="${y(t) + 3.5}" text-anchor="end">${t}${unit}</text>`; });
  if (engRef != null) s += `<line x1="${pl}" x2="${W - pr}" y1="${y(engRef)}" y2="${y(engRef)}" stroke="var(--nat)" stroke-width="1.4" stroke-dasharray="5 4"/><text class="reftxt" x="${W - pr}" y="${y(engRef) - 5}" text-anchor="end" style="fill:var(--nat)">England ${F(engRef)}${unit}</text>`;
  const path = points.map((p, i) => (p.v == null ? null : `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`)).filter(Boolean).join(" ");
  s += `<polyline points="${path}" fill="none" stroke="var(--purple)" stroke-width="2.4"/>`;
  points.forEach((p, i) => {
    if (p.v == null) return;
    s += `<circle cx="${x(i)}" cy="${y(p.v)}" r="4.6" fill="var(--purple)" stroke="var(--paper)" stroke-width="1.6"/><text class="val" x="${x(i)}" y="${y(p.v) - 9}" text-anchor="middle" style="font-size:11px;fill:var(--ink)">${F(p.v)}${unit}</text>`;
    s += `<text class="tick" x="${x(i)}" y="${H - 10}" text-anchor="middle">${esc(p.t)}</text>`;
  });
  return s + "</svg>";
}

/* where it stands: one row per measure, the school's national percentile on a
   track whose gold centre line is England's median. Direction is already
   resolved by the engine: right is always the better side. */
function standingHtml(st, pri) {
  if (!st) return "";
  const defs = pri ? [
    ["RWM expected standard", st.outcome], ["Higher standard", st.high], ["Disadvantaged pupils", st.disadv], ["Reading score", st.read],
    ["Attendance", st.abs], ["Persistent absence", st.pa], ["Suspensions", st.susp], ["Teacher retention", st.turnover], ["Financial reserves", st.reserve],
  ] : [
    ["Attainment 8", st.outcome], ["Grade 5+ in English and maths", st.basics], ["Disadvantaged pupils", st.disadv], ["Sustained destinations", st.dest],
    ["Attendance", st.abs], ["Persistent absence", st.pa], ["Suspensions", st.susp], ["Teacher retention", st.turnover], ["Financial reserves", st.reserve],
  ];
  const rows = defs.filter(([, p]) => p != null);
  if (!rows.length) return "";
  const above = rows.filter(([, p]) => p >= 50).length;
  const body = rows.map(([label, p]) => {
    const word = p >= 50 ? `top ${Math.max(1, 100 - p)}%` : `bottom ${Math.max(1, p)}%`;
    const col = p >= 75 ? "var(--up)" : p < 25 ? "var(--down)" : "var(--ink)";
    return `<div class="pz-prow"><span class="k">${esc(label)}</span><div class="tr"><em></em><i style="left:${Math.max(1.5, Math.min(98.5, p))}%;${p >= 75 ? "" : p < 25 ? "background:var(--down)" : ""}"></i></div><span class="v" style="color:${col}">${word}</span></div>`;
  }).join("");
  return section("Where it stands", `At or above England's median on ${above} of ${rows.length} measures.`,
    "Each dot is this school's national standing on one measure; the gold line is England's median, and right of it is always the better side: attendance, behaviour and turnover are already turned the right way round.",
    `<div class="pz-pwrap">${body}</div><div class="pz-plegend"><span>England's weakest</span><span>England's median</span><span>England's strongest</span></div>`);
}

/* the fair comparison: the similar-intake cohort, this school marked in it */
function similarHtml(sim, pri, name) {
  if (!sim) return "";
  const MEASURE = pri ? "RWM expected standard" : "Attainment 8";
  const SPAN = pri ? 100 : 90;
  const ord = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const W = 1000, H = 230, B = 34;
  const maxN = Math.max(...sim.bins.map((b) => b.n));
  const bw = (W - 60) / sim.bins.length;
  const bars = sim.bins.map((b, i) => { const h = maxN ? (b.n / maxN) * (H - B - 30) : 0; return `<rect x="${40 + i * bw + 1}" y="${H - B - h}" width="${bw - 2}" height="${h}" fill="var(--lilac)"/>`; }).join("");
  const px = (v) => 40 + (Math.max(0, Math.min(SPAN - 0.1, v)) / SPAN) * (W - 60);
  const medX = px(sim.med), youX = px(sim.v);
  const XT = pri ? [0, 25, 50, 75, 100] : [0, 30, 60, 90];
  return section("A similar intake", `Among the ${sim.n.toLocaleString("en-GB")} schools teaching an intake like this one's, it ranks ${ord(sim.rank)}: the top ${sim.topPct}%.`,
    `Every state-funded ${pri ? "primary" : "secondary"} whose whole-school FSM sits within five points of this school's ${f1(sim.fsm)}%, ranked by ${MEASURE}. The fair comparison: same hand, different schools.`,
    `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img">${bars}
      <line x1="${medX}" y1="26" x2="${medX}" y2="${H - B}" stroke="var(--nat)" stroke-dasharray="3 4"/><text class="tick" x="${medX}" y="18" text-anchor="middle">similar-intake median ${pri ? f0(sim.med) : f1(sim.med)}</text>
      <line x1="${youX}" y1="26" x2="${youX}" y2="${H - B}" stroke="var(--gold)" stroke-width="4" stroke-opacity="0.9"${hit([name, `${MEASURE} ${pri ? f0(sim.v) : f1(sim.v)}`, `${ord(sim.rank)} of ${sim.n} similar-intake schools`])}/>
      <text class="tick" x="${youX}" y="${H - 2}" text-anchor="middle" style="fill:var(--gold);font-weight:700">this school</text>
      ${XT.map((v) => `<text class="tick" x="${px(v)}" y="${H - 14}" text-anchor="middle">${v}${pri ? "%" : ""}</text>`).join("")}</svg>`);
}

/* the school's report card: each evaluation area on the five-step scale, the
   graded step filled in its colour; legacy-only schools get an honest line */
function reportCardHtml(s) {
  const c = s.ofstedCard;
  if (!c) {
    if (!s.ofstedGrade) return "";
    return section("The inspection", `${esc(s.ofstedGrade)}, under the previous framework.`,
      "Not yet inspected under the renewed framework; when the report card arrives it will replace this judgement here.", "");
  }
  const dt = c.d ? new Date(c.d + "T12:00:00") : null;
  const when = dt ? dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;
  const head = `<div class="pz-rcrow pz-rchead"><span class="k"></span><div class="steps">${RC_GRADES.map((g) => `<span class="h">${esc(g)}</span>`).join("")}</div><span class="v"></span></div>`;
  const rows = RC_AREAS.filter(([k]) => c[k]).map(([k, label]) => {
    const g = c[k];
    return `<div class="pz-rcrow"><span class="k">${esc(label)}</span><div class="steps">${RC_GRADES.map((_, i) => `<span class="c${i + 1 === g ? " on" : ""}"${i + 1 === g ? ` style="background:${RC_COLS[i]}"` : ""}></span>`).join("")}</div><span class="v" style="color:${RC_COLS[g - 1]}">${esc(RC_GRADES[g - 1])}</span></div>`;
  }).join("");
  const sg = c.sg != null ? `<span class="pz-rcpill" style="background:${c.sg === 1 ? "var(--lilac)" : "#F6E3E7"};color:${c.sg === 1 ? "var(--purple-deep)" : "var(--down)"}">Safeguarding ${c.sg === 1 ? "met" : "not met"}</span>` : "";
  const cc = c.cc ? `<span class="pz-rcpill" style="background:#F6E3E7;color:var(--down)">${esc(c.cc === "SM" ? "Special measures" : c.cc === "RSI" ? "Requires significant improvement" : c.cc)}</span>` : "";
  return section("The report card", `Inspected under the renewed framework${when ? `, ${when}` : ""}.`,
    "Each evaluation area on Ofsted's five-point scale; the previous framework's single judgement no longer applies.",
    `<div class="pz-rcwrap">${head}${rows}</div><div style="margin-top:12px">${sg}${cc}</div>`);
}

/* inclusion on the school dash: who this school teaches, and its specialist places */
function inclusionGroup(s, bench, n) {
  if (n(s.sen_ehcp_pct) == null) return "";
  const bits = [
    s.sen_top_need ? `Most common primary need: ${esc(s.sen_top_need)}.` : "",
    s.sen_unit ? `Runs a SEN unit${n(s.sen_unit_pupils) ? ` of ${s.sen_unit_pupils} pupils` : ""}.` : "",
    s.sen_rp ? `Has resourced provision${n(s.sen_rp_pupils) ? ` for ${s.sen_rp_pupils} pupils` : ""}.` : "",
  ].filter(Boolean).join(" ");
  const note = `<p class="pz-note" style="margin-top:8px">${bits || "No specialist SEN places recorded."} January 2026 census.</p>`;
  return mgroup("Inclusion", [
    mrow("Pupils with an EHC plan", n(s.sen_ehcp_pct), bench.ehcpMed, 25, "%"),
    mrow("Pupils on SEN support", n(s.sen_support_pct), bench.senSupMed, 40, "%"),
    note,
  ]);
}

/* the early-years context on a primary's dash: its authority's GLD and phonics,
   because the DfE publishes no school-level figures */
function earlyGroup(e) {
  if (!e || e.gld == null) return "";
  const note = `<p class="pz-note" style="margin-top:8px">${esc(e.la)}, 2025/26: no school-level EYFSP or phonics is published, so this is the authority its reception children grow up in. Phonics by the end of Year 2: ${e.ph2 != null ? Math.round(e.ph2) + "%" : "–"}.</p>`;
  return mgroup("The early years (authority)", [
    mrow("Good level of development", e.gld, e.nat ? e.nat.gld : null, 100, "%"),
    mrow("Phonics expected, Year 1", e.ph1, e.nat ? e.nat.ph1 : null, 100, "%", 0),
    note,
  ]);
}

/* the money on the school dash: per-pupil bars, reserve and balance spelt out */
function moneyGroup(s, bench, n) {
  if (n(s.fin_spend_pp) == null) return "";
  const money = (v) => (v == null ? "–" : (v < 0 ? "−£" + Math.abs(v).toLocaleString("en-GB") : "£" + v.toLocaleString("en-GB")));
  const res = n(s.fin_reserve_pp), bal = n(s.fin_balance_pp);
  const note = `<p class="pz-note" style="margin-top:8px">Revenue reserve ${money(res)} per pupil${res != null && res < 0 ? ", a deficit" : ""} (England median ${money(bench.reserveMed)}); in-year balance ${money(bal)} per pupil. ${s.fin_sector === "academy" ? "Academy accounting return" : "Consistent financial reporting"}, 2024-25.</p>`;
  return mgroup("The money", [
    mrow("Spend per pupil (£000)", n(s.fin_spend_pp) / 1000, bench.spendMed != null ? bench.spendMed / 1000 : null, 22),
    mrow("Income per pupil (£000)", n(s.fin_income_pp) != null ? n(s.fin_income_pp) / 1000 : null, bench.incomeMed != null ? bench.incomeMed / 1000 : null, 22),
    mrow("Teaching staff per pupil (£000)", n(s.fin_teach_pp) != null ? n(s.fin_teach_pp) / 1000 : null, bench.teachPpMed != null ? bench.teachPpMed / 1000 : null, 12),
    mrow("Energy per pupil (£)", n(s.fin_energy_pp), bench.energyPpMed, 500, "", 0),
    mrow("Staff share of spend", n(s.fin_staff_pct), bench.staffPctMed, 100, "%"),
    note,
  ]);
}

export function schoolDashHtml(d) {
  if (!d || !d.s) return "";
  const { s, pri, bench } = d;
  const n = (v) => (typeof v === "number" && Number.isFinite(v) ? v : (v != null && v !== "" && Number.isFinite(parseFloat(v)) ? parseFloat(v) : null));
  const drift = pri ? (n(s.ks2_rwm_exp) != null && n(s.ks2_rwm_prev) != null ? s.ks2_rwm_exp - s.ks2_rwm_prev : null)
    : (n(s.attainment8) != null && n(s.a8_prev) != null ? s.attainment8 - s.a8_prev : null);
  const meta = [s.la, s.pcon && s.pcon !== s.la ? s.pcon : null, s.region, s.type, s.idaci ? `IDACI quintile ${s.idaci} of 5${s.idaci === 5 ? " (most deprived)" : s.idaci === 1 ? " (least deprived)" : ""}` : null, s.religiousCharacter && !/does not apply|none/i.test(s.religiousCharacter) ? s.religiousCharacter : null,
    s.gender && s.gender !== "Mixed" ? s.gender : null, n(s.pupils) != null ? `${s.pupils} pupils` : null, s.ofstedGrade || null].filter(Boolean);

  const tiles = pri ? [
    { n: f0(n(s.ks2_rwm_exp)), p: `reached the expected standard in reading, writing and maths, against England's ${f0(bench.rwmMean)}.`, c: `${sign(r1(drift), 0)} on 2023/24` },
    { n: f0(n(s.ks2_rwm_high)), p: `reached the higher standard in all three; England's median is ${f0(bench.highMed)}.`, c: `reading score ${f1(n(s.ks2_read_avg))} · England median ${f1(bench.readMed)}` },
    { n: n(s.ks2_rwm_disadv) != null ? f0(n(s.ks2_rwm_disadv)) : "–", p: `of disadvantaged pupils at the expected standard; other pupils here reach ${f0(n(s.ks2_rwm_nondisadv))}.`, c: `England's disadvantaged average ${f0(bench.rwmDisMean)}` },
    { n: n(s.abs_overall_pct) != null ? f1(n(s.abs_overall_pct)) + "<small>%</small>" : "–", p: `overall absence, against a primary England median of ${f1(bench.absMed)}%.`, c: `persistent ${f1(n(s.abs_persistent_pct))}%` },
  ] : [
    { n: f1(n(s.attainment8)), p: `Attainment 8, against England's ${f1(bench.a8Mean)}.`, c: `${sign(r1(drift))} on 2024/25 · P8 (2024) ${n(s.p8_prev) != null ? (s.p8_prev > 0 ? "+" : "") + Number(s.p8_prev).toFixed(2) : "–"}` },
    { n: n(s.basics_95) != null ? f0(n(s.basics_95)) : "–", p: `of pupils at grade 5+ in English and maths; England's median is ${f0(bench.b95Med)}.`, c: `4+ in both: ${f0(n(s.basics_94))}` },
    { n: n(s.a8_disadv) != null ? f1(n(s.a8_disadv)) : "–", p: `Attainment 8 for disadvantaged pupils; others here reach ${f1(n(s.a8_nondisadv))}.`, c: `England's disadvantaged mean ${f1(bench.a8DisMean)}` },
    { n: n(s.abs_overall_pct) != null ? f1(n(s.abs_overall_pct)) + "<small>%</small>" : "–", p: `overall absence, against England's median ${f1(bench.absMed)}%.`, c: `persistent ${f1(n(s.abs_persistent_pct))}% · suspensions ${f1(n(s.susp_rate))} per 100` },
  ];
  const tileHtml = `<div class="pz-tiles">${tiles.map((t) => `<div class="pz-tile"><div class="n">${t.n}</div><p>${t.p}</p>${t.c ? `<div class="cmp">${t.c}</div>` : ""}</div>`).join("")}</div>`;

  /* the trend: every published point the dataset holds */
  const trend = pri
    ? trendSvg([{ t: "2023/24", v: n(s.ks2_rwm_prev) }, { t: "2024/25", v: n(s.ks2_rwm_exp) }], bench.rwmMean, { min: 0, max: 100, unit: "%", dp: 0 })
    : trendSvg([{ t: "2018/19", v: n(s.a8_2019) }, { t: "2024/25", v: n(s.a8_prev) }, { t: "2025/26", v: n(s.attainment8) }], bench.a8Mean, { min: Math.max(0, Math.floor((Math.min(n(s.a8_2019) ?? 99, n(s.a8_prev) ?? 99, n(s.attainment8) ?? 99) - 8) / 10) * 10), max: Math.min(90, Math.ceil((Math.max(n(s.a8_2019) ?? 0, n(s.a8_prev) ?? 0, n(s.attainment8) ?? 0) + 8) / 10) * 10) });
  const trendNote = pri ? "KS2 2025/26 publishes December 2026 and will extend this line." : "No school-level results were published for 2020-2024; the line joins what exists.";
  const trendSection = trend ? section("The trend", pri ? "The expected standard, year on year." : `Attainment 8 across every published year${drift != null ? `: ${sign(r1(drift), pri ? 0 : 1)} on last year` : ""}.`, trendNote, trend) : "";

  /* the record: every measure as a bar against England's marker */
  const record = pri ? [
    mgroup("Key stage 2", [
      mrow("RWM expected standard", n(s.ks2_rwm_exp), bench.rwmMed, 100, "%", 0),
      mrow("Higher standard", n(s.ks2_rwm_high), bench.highMed, 100, "%", 0),
      mrow("Reading expected", n(s.ks2_read_exp), null, 100, "%", 0),
      mrow("Maths expected", n(s.ks2_mat_exp), null, 100, "%", 0),
      mrow("Writing expected", n(s.ks2_writ_exp), null, 100, "%", 0),
      mrow("Grammar and spelling", n(s.ks2_gps_exp), null, 100, "%", 0),
    ]),
    mgroup("Disadvantage", [
      mrow("Disadvantaged, RWM", n(s.ks2_rwm_disadv), bench.rwmDisMean, 100, "%", 0),
      mrow("Other pupils, RWM", n(s.ks2_rwm_nondisadv), bench.rwmNonMean, 100, "%", 0),
      mrow("FSM in the KS2 cohort", n(s.ks2_fsm_pct), null, 100, "%"),
      mrow("EAL", n(s.ks2_eal_pct), null, 100, "%"),
      mrow("SEN support", n(s.ks2_sen_k_pct), null, 100, "%"),
    ]),
    mgroup("Attendance and behaviour", [
      mrow("Overall absence", n(s.abs_overall_pct), bench.absMed, 25, "%"),
      mrow("Persistent absence", n(s.abs_persistent_pct), bench.paMed, 60, "%"),
      mrow("Suspensions per 100", n(s.susp_rate), bench.suspMed, Math.max(25, (n(s.susp_rate) || 0) + 5), "", 1),
    ]),
    mgroup("The workforce", [
      mrow("Teacher turnover", n(s.wf_turnover_pct), bench.turnMed, 60, "%"),
      mrow("Pupil-teacher ratio", n(s.wf_ptr), bench.ptrMed, 35),
      mrow("Vacancy rate", n(s.wf_vac_rate), bench.vacMean, 10, "%"),
      mrow("Sick days per teacher", n(s.wf_sick_days), bench.sickDaysMed, 15),
    ]),
    inclusionGroup(s, bench, n),
    moneyGroup(s, bench, n),
    earlyGroup(d.early),
  ].join("") : [
    mgroup("Outcomes", [
      mrow("Attainment 8", n(s.attainment8), bench.a8Med, 90),
      mrow("Grade 5+ in English and maths", n(s.basics_95), bench.b95Med, 100, "%", 0),
      mrow("Grade 4+ in English and maths", n(s.basics_94), bench.b94Med, 100, "%", 0),
    ]),
    mgroup("Disadvantage", [
      mrow("Disadvantaged, Attainment 8", n(s.a8_disadv), bench.a8DisMean, 90),
      mrow("Other pupils, Attainment 8", n(s.a8_nondisadv), bench.a8NonMean, 90),
      mrow("Whole-school FSM", n(s.edu_fsm_pct), null, 100, "%"),
    ]),
    mgroup("Attendance and behaviour", [
      mrow("Overall absence", n(s.abs_overall_pct), bench.absMed, 25, "%"),
      mrow("Persistent absence", n(s.abs_persistent_pct), bench.paMed, 60, "%"),
      mrow("Severe absence", n(s.abs_severe_pct), null, 25, "%"),
      mrow("Suspensions per 100", n(s.susp_rate), bench.suspMed, Math.max(40, (n(s.susp_rate) || 0) + 5), "", 1),
      mrow("Permanent exclusion rate", n(s.permex_rate), bench.pexMean, 2, "", 1),
    ]),
    mgroup("The workforce", [
      mrow("Teacher turnover", n(s.wf_turnover_pct), bench.turnMed, 60, "%"),
      mrow("Pupil-teacher ratio", n(s.wf_ptr), bench.ptrMed, 30),
      mrow("Vacancy rate", n(s.wf_vac_rate), bench.vacMean, 10, "%"),
      mrow("Sick days per teacher", n(s.wf_sick_days), bench.sickDaysMed, 15),
      mrow("Mean teacher pay (£000)", n(s.wf_pay_mean) != null ? n(s.wf_pay_mean) / 1000 : null, bench.payMed != null ? bench.payMed / 1000 : null, 90),
    ]),
    inclusionGroup(s, bench, n),
    moneyGroup(s, bench, n),
  ].join("");

  /* destinations: one stacked bar of where the leavers went */
  let destHtml = "";
  if (!pri && n(s.dest_sustained) != null) {
    const segs = [["Education", n(s.dest_edu), "var(--purple)"], ["Apprenticeship", n(s.dest_appren), "#9A5BC4"], ["Employment", n(s.dest_work), "var(--gold)"], ["Not sustained", n(s.dest_notsust), "#B4475A"]].filter(([, v]) => v != null && v > 0);
    const bar = `<div class="pz-stack">${segs.map(([k, v, c]) => `<span style="width:${v}%;background:${c}" title="${esc(k)} ${f1(v)}%"></span>`).join("")}</div>`;
    destHtml = `<div class="pz-mgroup"><h3>Destinations</h3>${bar}${legend(segs.map(([k, v, c]) => [c, `${k} ${f1(v)}%`]))}<p class="pz-note" style="margin-top:8px">${f1(n(s.dest_sustained))}% sustained a destination against England's median ${f1(bench.destMed)}%.</p></div>`;
  }

  const recordSection = section("The record", "Every measure we hold, each against England's marker.", "The gold tick on each bar is England; for absence, suspensions and exclusions, left of the tick is the better side.", `<div class="pz-mwrap">${record}${destHtml}</div>`);

  return `${kick("The school, in brief")}<h1 style="font-size:38px">${esc(s.name)}</h1>
  <p class="pz-sub">${esc(meta.join(" · "))}</p>
  <div class="pz-vintage">${esc(pri ? VINTAGE_KS2 : VINTAGE)}</div>
  <section class="pz-block">${tileHtml}</section>
  ${reportCardHtml(s)}
  ${standingHtml(d.standing, pri)}
  ${similarHtml(d.similar, pri, s.name)}
  ${trendSection}
  ${recordSection}
  ${d.p16 ? `<div class="pz-vintage" style="margin-top:28px">${esc(VINTAGE_P16)}</div>` + post16Html(d.p16, {}) + subjectsHtml(d.subj) : ""}
  ${d.dist ? distributionHtml(d.dist, {}) : ""}`;
}


/* ── the foreword: the reader's prose, verified against the computed data ── */
export function forewordHtml(text) {
  if (!text) return "";
  const paras = esc(text).split(/\n{2,}|\n/).filter((p) => p.trim()).map((p) => `<p>${p}</p>`).join("");
  return `<section class="pz-block pz-foreword">${kick("Foreword")}<div class="fw">${paras}</div><div class="fw-note">Written by Prizm's reader; every figure verified against the computed data before it was allowed onto the page.</div></section>`;
}

const RENDERERS = { headlines: headlinesHtml, cohort: cohortHtml, movement: movementHtml, gap: gapHtml, attendance: attendanceHtml, behaviour: behaviourHtml, workforce: workforceHtml, inclusion: inclusionHtml, early: earlyHtml, flow: flowHtml, post16: post16Html, subjects: subjectsHtml, finance: financeHtml, destinations: destinationsHtml, scatter: scatterHtml, distribution: distributionHtml, ofsted: ofstedHtml, league: leagueHtml };

export function renderBlocks(computed) {
  const labels = computed.labels || {};
  return computed.blocks.map((b) => (RENDERERS[b.type] ? RENDERERS[b.type](b.data, { vs: b.vs, labels }) : "")).join("");
}
/* one block alone, so the studio can wrap each section with its own controls;
   seg = {d: 0..9} narrows every capped chart in the block to that decile */
export function renderBlock(b, computed, seg) {
  SEG = seg && seg.d != null ? seg : null;
  try {
    return RENDERERS[b.type] ? RENDERERS[b.type](b.data, { vs: b.vs, labels: computed.labels || {} }) : "";
  } finally {
    SEG = null;
  }
}

/* ── house style ───────────────────────────────────────────────────────── */
export const PZ_CSS = `
  .pz-report{--purple:#6A0CA0;--purple-deep:#4B0875;--gold:#C6A035;--gold-soft:#E4CE8B;--paper:#FBFAF7;--card:#fff;--lilac:#F4EEFA;--dark:#241238;--ink:#221233;--muted:#6F6580;--hair:rgba(106,12,160,.14);--grid:rgba(34,18,51,.2);--nat:#8A8296;--slo:#DCD6E2;--up:#6A0CA0;--down:#B4475A;--red:#B4475A;
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
  .pz-tile.pz-vs .vk{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-soft);font-weight:600}
  .pz-tile.pz-vs .pair{display:flex;gap:18px;align-items:flex-end;margin-top:10px}
  .pz-tile.pz-vs .pair .n{font-size:30px}
  .pz-tile.pz-vs .pair .n small{font-size:12px;color:rgba(255,255,255,.55)}
  .pz-tile.pz-vs .sep{width:1px;align-self:stretch;background:rgba(255,255,255,.18)}
  .pz-tile.pz-vs .who{font-size:9.5px;color:rgba(255,255,255,.6);margin-top:3px;max-width:14ch}
  .pz-vslabel{display:flex;justify-content:space-between;align-items:baseline;margin:16px 0 2px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--purple)}
  .pz-vslabel span:last-child{color:var(--muted);font-weight:500;letter-spacing:0;text-transform:none;font-size:11.5px}
  .pz-foreword .fw p{font-family:Fraunces,Georgia,serif;font-size:16.5px;line-height:1.62;color:var(--ink);max-width:72ch;margin:10px 0}
  .pz-foreword .fw-note{font-size:10.5px;color:var(--muted);margin-top:10px;padding-top:8px;border-top:1px solid var(--hair)}
  .pz-hit{cursor:default}
  .pz-hit[data-urn]{cursor:pointer}
  .pz-hit[data-urn]:hover rect,.pz-hit[data-urn]:hover circle,line.pz-hit[data-urn]:hover{opacity:1;filter:brightness(1.12)}
  .pz-tipcard{position:absolute;z-index:80;display:none;background:var(--dark,#241238);color:#fff;padding:10px 14px;border-radius:8px;max-width:300px;font-family:Inter,system-ui,sans-serif;font-size:12px;line-height:1.45;pointer-events:none;box-shadow:0 10px 30px rgba(34,18,51,.35)}
  .pz-tipcard b{display:block;font-size:12.5px;margin-bottom:3px}
  .pz-tipcard span{display:block;color:rgba(255,255,255,.78)}
  .pz-tipcard i{display:block;margin-top:7px;font-style:normal;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#E4CE8B}
  .pz-mwrap{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:10px 44px;margin-top:14px}
  .pz-mgroup h3{font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--purple);margin:14px 0 8px}
  .pz-mrow{display:grid;grid-template-columns:150px 1fr 44px;gap:3px 12px;align-items:center;padding:4px 0;font-size:12px}
  .pz-mrow .k{color:var(--ink);font-weight:500;line-height:1.25}
  .pz-mrow .tr{position:relative;height:12px;background:var(--lilac);border-radius:6px;overflow:visible}
  .pz-mrow .fill{position:absolute;left:0;top:0;height:100%;background:var(--purple);border-radius:6px;opacity:.88}
  .pz-mrow .tick{position:absolute;top:-3px;width:2.5px;height:18px;background:var(--gold);border-radius:1px}
  .pz-mrow .v{font-variant-numeric:tabular-nums;font-weight:600;text-align:right}
  .pz-mrow .e{grid-column:2/4;font-size:10.5px;color:var(--muted);margin-top:-2px}
  .pz-pwrap{margin-top:6px}
  .pz-prow{display:grid;grid-template-columns:minmax(150px,220px) 1fr 92px;gap:16px;align-items:center;margin:13px 0;font-family:Inter,system-ui,sans-serif}
  .pz-prow .k{font-size:12.5px;color:var(--muted)}
  .pz-prow .tr{position:relative;height:9px;background:var(--lilac);border-radius:99px}
  .pz-prow .tr em{position:absolute;top:-4px;bottom:-4px;left:50%;width:2.5px;background:var(--gold);border-radius:1px}
  .pz-prow .tr i{position:absolute;top:-3.5px;width:15px;height:15px;border-radius:50%;background:var(--purple);border:2.5px solid var(--paper);box-shadow:0 1px 5px rgba(34,18,51,.3);transform:translateX(-50%);box-sizing:border-box}
  .pz-prow .v{font-size:12.5px;font-weight:700;text-align:right;font-variant-numeric:tabular-nums}
  .pz-plegend{display:flex;justify-content:space-between;margin:4px 108px 0 236px;font-size:10.5px;color:var(--muted);font-family:Inter,system-ui,sans-serif}
  .pz-rcwrap{margin-top:10px;font-family:Inter,system-ui,sans-serif}
  .pz-rcrow{display:grid;grid-template-columns:minmax(150px,230px) 1fr 150px;gap:14px;align-items:center;margin:8px 0}
  .pz-rcrow .k{font-size:12.5px;color:var(--muted)}
  .pz-rcrow .steps{display:flex;gap:5px}
  .pz-rcrow .steps .c{flex:1;height:24px;background:var(--lilac);border-radius:5px;opacity:.55}
  .pz-rcrow .steps .c.on{opacity:1;box-shadow:0 2px 8px rgba(34,18,51,.22)}
  .pz-rcrow .v{font-size:12px;font-weight:700;text-align:left}
  .pz-rchead .steps .h{flex:1;font-size:9.5px;letter-spacing:.02em;color:var(--muted);text-align:center;line-height:1.15}
  .pz-rcpill{display:inline-block;border-radius:999px;padding:6px 13px;font-size:11.5px;font-weight:700;font-family:Inter,system-ui,sans-serif;margin-right:8px}
  .pz-rcarea{display:grid;grid-template-columns:minmax(150px,230px) 1fr 120px;gap:14px;align-items:center;margin:9px 0;font-family:Inter,system-ui,sans-serif}
  .pz-rcarea .k{font-size:12.5px;color:var(--muted)}
  .pz-rcarea .v{font-size:11.5px;font-weight:600;text-align:right;color:var(--ink)}
  .pz-rcarea .pz-stack{margin:0}
  .pz-rcarea .pz-stack-thin{height:5px;margin-top:3px;opacity:.55}
  .pz-stack{display:flex;height:22px;border-radius:6px;overflow:hidden;margin:4px 0 8px}
  .pz-stack span{display:block;height:100%}
  .pz-blockwrap{position:relative}
  .pz-blockctl{position:absolute;top:44px;right:-8px;z-index:30;display:flex;gap:4px;opacity:0;transform:translateY(-4px);transition:opacity .15s ease,transform .15s ease;pointer-events:none}
  .pz-blockwrap:hover .pz-blockctl,.pz-blockwrap:focus-within .pz-blockctl{opacity:1;transform:none;pointer-events:auto}
  .pz-blockctl button{width:26px;height:26px;border-radius:999px;border:1px solid var(--hair);background:var(--card);color:var(--muted);font-size:13px;line-height:1;cursor:pointer;font-family:Inter,system-ui,sans-serif;box-shadow:0 4px 14px rgba(34,18,51,.1)}
  .pz-blockctl button:hover{color:var(--purple);border-color:var(--purple)}
  @media (hover:none){.pz-blockctl{opacity:1;transform:none;pointer-events:auto}}
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
export function reportHtml(spec, computed, foreword, singleHtml) {
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(spec.title || "Prizm report")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>body{margin:0;background:#F2EFEA;padding:34px 14px}main{max-width:960px;margin:0 auto}${PZ_CSS}</style></head>
<body><main><div class="pz-report">${singleHtml ? forewordHtml(foreword) + singleHtml : coverHtml(spec, computed) + forewordHtml(foreword) + renderBlocks(computed)}
<div class="pz-foot"><span>Built with Prizm at institute.school · the AI arranges, the mathematics counts.</span><span>${esc(computed.phase === "primary" ? VINTAGE_KS2 : VINTAGE)}</span></div>
<script>window.__PZ_OPEN__="https://institute.school/members/prizm";${PZ_TIP_JS}</script>
</div></main></body></html>`;
}
