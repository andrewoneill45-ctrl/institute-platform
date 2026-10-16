/* Prizm's hand, second cut — the Westminster report's visual language,
   generalised. Pure string builders shared by the studio's live preview and
   the downloaded single-file report: wordmark cover, kick rows, stat tiles,
   column and dumbbell charts with reference lines and tooltips, computed
   narrative headlines, and collapsible tables for the full data. */

import { VINTAGE, scopeLabel, r1 } from "./engine.js";

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

/* ── the chart kit ─────────────────────────────────────────────────────── */

/* columns: rows [{label, v, tipLines}] sorted; refs [{v,label,color,dy}] */
function columnsSvg({ rows, refs = [], min, max, unit = "", dp = 1 }) {
  const W = 1152, pl = 60, pr = 104, pt = 16, lab = 104, ph = 330, H = pt + ph + lab;
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
  const W = 1152, pl = 60, pr = mode === "gap" ? 104 : 20, pt = 14, lab = 104, ph = 320, H = pt + ph + lab;
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
  const ranked = d.rows.filter((r) => r.a8 != null).sort((a, b) => b.a8 - a.a8);
  if (!ranked.length) return "";
  const { rows: shown, capped } = capRows(ranked.map((r) => ({
    label: r.name, v: r.a8,
    tipLines: [r.name, `Attainment 8 ${f1(r.a8)} (${sign(r.d)} on 2024/25)`, `4+ E&M ${f0(r.b94)} · 5+ ${f0(r.b95)} · FSM ${r.fsm == null ? "–" : f1(r.fsm) + "%"}`],
  })));
  const above = ranked.filter((r) => r.a8 >= d.bench.a8Med).length;
  const headline = `${above === ranked.length ? "Every one" : above} of ${ranked.length} schools ${above === 1 ? "sits" : "sit"} at or above England's median, from ${f1(ranked[ranked.length - 1].a8)} to ${f1(ranked[0].a8)}.`;
  const chart = columnsSvg({ rows: shown, min: Math.max(0, Math.floor((ranked[ranked.length - 1].a8 - 6) / 10) * 10), max: Math.min(90, Math.ceil((ranked[0].a8 + 6) / 10) * 10), refs: [{ v: d.a8Mean, label: "Scope", color: "var(--gold)" }, { v: d.bench.a8Med, label: "England", color: "var(--nat)" }] });
  /* the full data, grouped by LA, folded away */
  const by = {}; d.rows.forEach((r) => { (by[r.la || "Other"] = by[r.la || "Other"] || []).push(r); });
  const groups = Object.keys(by).sort();
  const tbl = (rows) => `<table class="pz-table"><thead><tr><th>School</th><th>FSM</th><th>A8</th><th>vs 24/25</th><th>4+ E&amp;M</th><th>5+ E&amp;M</th><th>P8 (2024)</th></tr></thead><tbody>${rows.map((r) => `<tr><td class="nm">${esc(r.name)}</td><td>${r.fsm == null ? "–" : f1(r.fsm) + "%"}</td><td class="num">${f1(r.a8)}</td><td class="num" style="color:${r.d == null ? "var(--muted)" : r.d >= 0.05 ? "var(--up)" : r.d <= -0.05 ? "var(--down)" : "var(--muted)"}">${sign(r.d)}</td><td class="num">${f0(r.b94)}</td><td class="num">${f0(r.b95)}</td><td class="num">${r.p8prev == null ? "–" : (r.p8prev > 0 ? "+" : "") + r.p8prev.toFixed(2)}</td></tr>`).join("")}</tbody></table>`;
  const details = groups.length > 1
    ? groups.map((g) => `<details class="pz-fold"${groups.length <= 3 ? " open" : ""}><summary>${esc(g)}<span>${by[g].length} school${by[g].length === 1 ? "" : "s"}</span></summary>${tbl(by[g].sort((a, b) => (b.a8 ?? -1) - (a.a8 ?? -1)))}</details>`).join("")
    : `<details class="pz-fold" open><summary>The full table<span>${d.rows.length} schools</span></summary>${tbl(ranked)}</details>`;
  return section("The cohort", headline,
    (capped ? `The chart shows the top and bottom ${shown.length / 2} of ${ranked.length} schools; ` : "") + "every school, with the full table folded beneath. Arrows compare 2025/26 provisional with 2024/25.",
    chart + legend([["var(--purple)", "School"], ["var(--gold)", `Scope mean ${f1(d.a8Mean)}`], ["var(--nat)", `England median ${f1(d.bench.a8Med)}`]]) + details);
}

function movementHtml(d) {
  if (!d.rows.length) return "";
  const { rows: shown, capped } = capRows(d.rows.map((r) => ({
    label: r.name, a: r.prev, b: r.now,
    tipLines: [r.name, `2024/25 ${f1(r.prev)} → 2025/26 ${f1(r.now)}`, `${sign(r.d)} points`],
  })), 40);
  const up = d.rows.filter((r) => r.d > 0.05).length, dn = d.rows.filter((r) => r.d < -0.05).length;
  const headline = `${up} school${up === 1 ? "" : "s"} rose and ${dn} fell: a scope drift of ${sign(d.scopeDrift)} against England's ${sign(d.natDrift)}.`;
  const lo = Math.min(...d.rows.map((r) => Math.min(r.prev, r.now))), hi = Math.max(...d.rows.map((r) => Math.max(r.prev, r.now)));
  const top = d.rows.slice(0, 4), bot = d.rows.slice(-4).reverse();
  const side = `<div class="pz-rank"><div><h4>Largest rises</h4><ol>${top.map((r) => `<li>${esc(short(r.name))} <span>${sign(r.d)}</span></li>`).join("")}</ol></div><div><h4>Largest falls</h4><ol>${bot.map((r) => `<li>${esc(short(r.name))} <span>${sign(r.d)}</span></li>`).join("")}</ol></div></div>`;
  return section("Movement", headline,
    (capped ? `Showing the ${shown.length / 2} strongest rises and falls of ${d.rows.length} schools. ` : "") + "Hollow circle 2024/25, filled circle 2025/26 provisional.",
    dumbbellsSvg({ rows: shown, min: Math.max(0, Math.floor((lo - 4) / 10) * 10), max: Math.min(90, Math.ceil((hi + 4) / 10) * 10) }) + side);
}

function gapHtml(d) {
  if (!d.rows.length) return "";
  const { rows: shown, capped } = capRows(d.rows.map((r) => ({
    label: r.name, a: r.dis, b: r.non,
    tipLines: [r.name, `Disadvantaged ${f1(r.dis)} · others ${f1(r.non)}`, `Gap ${f1(r.gap)} points`],
  })), 40);
  const beat = d.rows.filter((r) => r.dis >= d.natDisMean + (d.natNonMean - d.natDisMean)).length; /* dis >= England all-pupil-ish */
  const natAll = r1((d.natDisMean + d.natNonMean) / 2);
  const headline = `Scope disadvantaged mean ${f1(d.scopeDisMean)} against England's disadvantaged ${f1(d.natDisMean)}; sorted narrowest gap first.`;
  const lo = Math.min(...d.rows.map((r) => r.dis), 20), hi = Math.max(...d.rows.map((r) => r.non), 60);
  return section("The disadvantage gap", headline,
    (capped ? `Showing the ${shown.length / 2} narrowest and widest of ${d.rows.length} schools. ` : "") + `England's other pupils average ${f1(d.natNonMean)}.`,
    dumbbellsSvg({ rows: shown, mode: "gap", min: Math.max(0, Math.floor((lo - 4) / 10) * 10), max: Math.min(90, Math.ceil((hi + 4) / 10) * 10), refs: [{ v: d.natDisMean, label: "Eng. disadv.", color: "var(--nat)" }] })
    + legend([["var(--gold)", "Disadvantaged"], ["var(--purple)", "Other pupils"]]) + (void beat, void natAll, ""));
}

function scatterHtml(d) {
  const W = 1000, H = 440, L = 54, B = 44;
  const x = (f) => L + (Math.max(0, Math.min(70, f)) / 70) * (W - L - 20);
  const y = (a) => (H - B) - (Math.max(0, Math.min(80, a)) / 80) * (H - B - 20);
  const cloud = d.cloud.map(([f, a]) => `<circle cx="${x(f).toFixed(1)}" cy="${y(a).toFixed(1)}" r="2" fill="var(--slo)"/>`).join("");
  const marks = d.marks.map((m) => `<circle cx="${x(m.fsm).toFixed(1)}" cy="${y(m.a8).toFixed(1)}" r="5.2" fill="var(--purple)" stroke="var(--paper)" stroke-width="1.4">${tip([m.name, `FSM ${f1(m.fsm)}% · A8 ${f1(m.a8)}`])}</circle>`).join("");
  const axes = `<line x1="${L}" y1="${H - B}" x2="${W - 20}" y2="${H - B}" stroke="var(--grid)"/><line x1="${L}" y1="20" x2="${L}" y2="${H - B}" stroke="var(--grid)"/>
    ${[0, 20, 40, 60].map((v) => `<text class="tick" x="${x(v)}" y="${H - B + 16}" text-anchor="middle">${v}%</text>`).join("")}
    ${[20, 40, 60, 80].map((v) => `<text class="tick" x="${L - 8}" y="${y(v) + 3}" text-anchor="end">${v}</text>`).join("")}
    <text class="tick" x="${(W + L) / 2}" y="${H - 6}" text-anchor="middle">whole-school FSM</text>
    <text class="tick" x="16" y="${(H - B) / 2}" transform="rotate(-90 16 ${(H - B) / 2})" text-anchor="middle">Attainment 8</text>`;
  return section("Context and outcomes", "Where the scope sits against every state-funded secondary in England, given its intake.",
    "Association, not causation; the grey cloud is the rest of the country.",
    `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img">${axes}${cloud}${marks}</svg>` + legend([["var(--purple)", "Scope school"], ["var(--slo)", "Every other state-funded secondary"]]));
}

function distributionHtml(d) {
  const W = 1000, H = 250, B = 34;
  const maxN = Math.max(...d.bins.map((b) => b.n));
  const bw = (W - 60) / d.bins.length;
  const bars = d.bins.map((b, i) => { const h = (b.n / maxN) * (H - B - 30); return `<rect x="${40 + i * bw + 1}" y="${H - B - h}" width="${bw - 2}" height="${h}" fill="var(--lilac)"/>`; }).join("");
  const marks = d.marks.map((m) => { const px = 40 + (Math.max(0, Math.min(89.9, m.a8)) / 90) * (W - 60); return `<line x1="${px.toFixed(1)}" y1="26" x2="${px.toFixed(1)}" y2="${H - B}" stroke="var(--gold)" stroke-width="2">${tip([m.name, `A8 ${f1(m.a8)}`])}</line>`; }).join("");
  const medX = 40 + (d.med / 90) * (W - 60);
  return section("Where they sit", `Each gold line is a school in scope, set in the national distribution of ${d.total.toLocaleString("en-GB")} schools.`, null,
    `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img">${bars}<line x1="${medX}" y1="26" x2="${medX}" y2="${H - B}" stroke="var(--nat)" stroke-dasharray="3 4"/><text class="tick" x="${medX}" y="18" text-anchor="middle">England median ${f1(d.med)}</text>${marks}${[0, 30, 60, 90].map((v) => `<text class="tick" x="${40 + (v / 90) * (W - 60)}" y="${H - 14}" text-anchor="middle">${v}</text>`).join("")}</svg>`);
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

const RENDERERS = { headlines: headlinesHtml, cohort: cohortHtml, movement: movementHtml, gap: gapHtml, scatter: scatterHtml, distribution: distributionHtml, ofsted: ofstedHtml };

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
  .pz-fold summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;padding:11px 16px;font-size:12.5px;font-weight:600;color:var(--ink)}
  .pz-fold summary::-webkit-details-marker{display:none}
  .pz-fold summary span{color:var(--muted);font-weight:400;font-size:11.5px}
  .pz-fold summary::after{content:"+";font-family:Fraunces,Georgia,serif;color:var(--purple);font-size:17px;margin-left:12px}
  .pz-fold[open] summary::after{content:"\\2212"}
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
  const las = new Set(computed.schools.map((s) => s.la).filter(Boolean)).size;
  return `${WORDMARK}
  <div class="pz-for">A report by The All Saints Institute · Prizm</div>
  <h1>${esc(spec.title || "A report")}</h1>
  <p class="pz-sub">${esc(scopeLabel(spec.scope, null) || "")} · every figure computed from the DfE's published national dataset, traceable to its vintage.</p>
  <div class="pz-meta"><div><b>${n}</b>school${n === 1 ? "" : "s"}</div><div><b>${las}</b>local authorit${las === 1 ? "y" : "ies"}</div><div><b>2025/26</b>provisional results</div><div><b>${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</b>prepared</div></div>
  <div class="pz-vintage">${esc(VINTAGE)}</div>`;
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
<div class="pz-foot"><span>Built with Prizm at institute.school · the AI arranges, the mathematics counts.</span><span>${esc(VINTAGE)}</span></div>
</div></main></body></html>`;
}
