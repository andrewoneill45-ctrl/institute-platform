/* Prizm's hand — turns computed block data into the Institute's editorial
   HTML. Pure string builders, shared by the studio's live preview and the
   downloaded single-file report, so what you see is literally what you keep. */

import { VINTAGE, scopeLabel, r1 } from "./engine.js";

const INK = "#221233", MUTED = "#6F6580", PURPLE = "#6A0CA0", GOLD = "#C6A035", GREEN = "#2F7A39", RED = "#B3261E", LILAC = "#CBB8DF";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const f1 = (v) => (v == null ? "—" : (Math.round(v * 10) / 10).toFixed(1));
const f0 = (v) => (v == null ? "—" : Math.round(v) + "%");
const sign = (v) => (v == null ? "—" : (v > 0 ? "+" : "") + f1(v));
const dcol = (v) => (v == null ? MUTED : v >= 0.05 ? GREEN : v <= -0.05 ? RED : MUTED);

function section(title, note, body) {
  return `<section class="pz-block"><div class="pz-rule"></div><h2>${esc(title)}</h2>${note ? `<p class="pz-note">${esc(note)}</p>` : ""}${body}</section>`;
}

function cohortHtml(d) {
  const rows = d.rows.map((r) => `<tr>
    <td class="nm">${esc(r.name)}<span class="sub">${esc(r.la || "")}</span></td>
    <td>${r.fsm == null ? "—" : f1(r.fsm) + "%"}</td>
    <td class="num">${f1(r.a8)}</td>
    <td class="num" style="color:${dcol(r.d)}">${sign(r.d)}</td>
    <td class="num">${f0(r.b94)}</td>
    <td class="num">${f0(r.b95)}</td>
    <td class="num">${r.p8prev == null ? "—" : (r.p8prev > 0 ? "+" : "") + r.p8prev.toFixed(2)}</td>
  </tr>`).join("");
  const body = `<table class="pz-table"><thead><tr><th>School</th><th>FSM</th><th>A8</th><th>vs 24/25</th><th>4+ E&amp;M</th><th>5+ E&amp;M</th><th>P8 (2024)</th></tr></thead><tbody>${rows}</tbody>
  <tfoot><tr><td class="nm">Scope mean (unweighted)</td><td>${d.fsmMean == null ? "—" : f1(d.fsmMean) + "%"}</td><td class="num">${f1(d.a8Mean)}</td><td></td><td></td><td class="num">${f0(d.b95Mean)}</td><td></td></tr>
  <tr class="nat"><td class="nm">England (state-funded, median)</td><td></td><td class="num">${f1(d.bench.a8Med)}</td><td></td><td class="num">${f0(d.bench.b94Med)}</td><td class="num">${f0(d.bench.b95Med)}</td><td></td></tr></tfoot></table>`;
  return section("The cohort", "Every school in scope, headline by headline. Arrows compare 2025/26 provisional with 2024/25.", body);
}

function movementHtml(d) {
  if (!d.rows.length) return "";
  const W = 760, rowH = 26, H = d.rows.length * rowH + 40;
  const lo = Math.min(...d.rows.map((r) => Math.min(r.prev, r.now)), 30), hi = Math.max(...d.rows.map((r) => Math.max(r.prev, r.now)), 60);
  const x = (v) => 240 + ((v - lo) / (hi - lo)) * (W - 300);
  const lines = d.rows.map((r, i) => {
    const y = 30 + i * rowH;
    return `<text x="230" y="${y + 4}" text-anchor="end" font-size="11.5" fill="${INK}">${esc(r.name.length > 34 ? r.name.slice(0, 33) + "…" : r.name)}</text>
    <line x1="${x(r.prev)}" y1="${y}" x2="${x(r.now)}" y2="${y}" stroke="${dcol(r.d)}" stroke-width="2"/>
    <circle cx="${x(r.prev)}" cy="${y}" r="3" fill="${LILAC}"/><circle cx="${x(r.now)}" cy="${y}" r="4" fill="${dcol(r.d)}"/>
    <text x="${x(Math.max(r.prev, r.now)) + 8}" y="${y + 4}" font-size="11" fill="${dcol(r.d)}">${sign(r.d)}</text>`;
  }).join("");
  const body = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto"><text x="240" y="14" font-size="10.5" fill="${MUTED}">pale dot 2024/25 · solid dot 2025/26 provisional</text>${lines}</svg>
  <p class="pz-note">Scope drift ${sign(d.scopeDrift)} against a national drift of ${sign(d.natDrift)} (mean change in Attainment 8).</p>`;
  return section("Movement", null, body);
}

function gapHtml(d) {
  if (!d.rows.length) return "";
  const W = 760, rowH = 26, H = d.rows.length * rowH + 50;
  const x = (v) => 240 + (Math.max(0, Math.min(80, v)) / 80) * (W - 290);
  const lines = d.rows.map((r, i) => {
    const y = 30 + i * rowH;
    return `<text x="230" y="${y + 4}" text-anchor="end" font-size="11.5" fill="${INK}">${esc(r.name.length > 34 ? r.name.slice(0, 33) + "…" : r.name)}</text>
    <line x1="${x(r.dis)}" y1="${y}" x2="${x(r.non)}" y2="${y}" stroke="rgba(34,18,51,.25)" stroke-width="1.5"/>
    <circle cx="${x(r.dis)}" cy="${y}" r="4.5" fill="${PURPLE}"/><circle cx="${x(r.non)}" cy="${y}" r="4.5" fill="${GOLD}"/>
    <text x="${x(r.non) + 9}" y="${y + 4}" font-size="11" fill="${MUTED}">gap ${f1(r.gap)}</text>`;
  }).join("");
  const natX = x(d.natDisMean);
  const body = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">
    <text x="240" y="14" font-size="10.5" fill="${MUTED}"><tspan fill="${PURPLE}">●</tspan> disadvantaged A8 · <tspan fill="${GOLD}">●</tspan> other pupils</text>
    <line x1="${natX}" y1="22" x2="${natX}" y2="${H - 26}" stroke="${RED}" stroke-dasharray="3 4" stroke-width="1"/>
    <text x="${natX}" y="${H - 12}" text-anchor="middle" font-size="10" fill="${RED}">England disadvantaged mean ${f1(d.natDisMean)}</text>
    ${lines}</svg>
  <p class="pz-note">Scope disadvantaged mean ${f1(d.scopeDisMean)} against England's ${f1(d.natDisMean)}; England's other pupils average ${f1(d.natNonMean)}. Sorted smallest gap first.</p>`;
  return section("The disadvantage gap", null, body);
}

function scatterHtml(d) {
  const W = 760, H = 420, L = 54, B = 44;
  const x = (f) => L + (Math.max(0, Math.min(70, f)) / 70) * (W - L - 20);
  const y = (a) => (H - B) - (Math.max(0, Math.min(80, a)) / 80) * (H - B - 20);
  const cloud = d.cloud.map(([f, a]) => `<circle cx="${x(f).toFixed(1)}" cy="${y(a).toFixed(1)}" r="2" fill="rgba(34,18,51,.14)"/>`).join("");
  const marks = d.marks.map((m) => `<circle cx="${x(m.fsm).toFixed(1)}" cy="${y(m.a8).toFixed(1)}" r="5" fill="${PURPLE}" stroke="#fff" stroke-width="1.5"><title>${esc(m.name)} · FSM ${f1(m.fsm)}% · A8 ${f1(m.a8)}</title></circle>`).join("");
  const axes = `<line x1="${L}" y1="${H - B}" x2="${W - 20}" y2="${H - B}" stroke="rgba(34,18,51,.3)"/><line x1="${L}" y1="20" x2="${L}" y2="${H - B}" stroke="rgba(34,18,51,.3)"/>
    ${[0, 20, 40, 60].map((v) => `<text x="${x(v)}" y="${H - B + 16}" text-anchor="middle" font-size="10" fill="${MUTED}">${v}%</text>`).join("")}
    ${[20, 40, 60, 80].map((v) => `<text x="${L - 8}" y="${y(v) + 3}" text-anchor="end" font-size="10" fill="${MUTED}">${v}</text>`).join("")}
    <text x="${(W + L) / 2}" y="${H - 6}" text-anchor="middle" font-size="10.5" fill="${MUTED}">whole-school FSM</text>
    <text x="14" y="${(H - B) / 2}" font-size="10.5" fill="${MUTED}" transform="rotate(-90 14 ${(H - B) / 2})" text-anchor="middle">Attainment 8</text>`;
  return section("Context and outcomes", "Every state-funded secondary in England in grey; the scope in purple. Association, not causation.",
    `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${axes}${cloud}${marks}</svg>`);
}

function distributionHtml(d) {
  const W = 760, H = 240, B = 34;
  const maxN = Math.max(...d.bins.map((b) => b.n));
  const bw = (W - 60) / d.bins.length;
  const bars = d.bins.map((b, i) => {
    const h = (b.n / maxN) * (H - B - 30);
    return `<rect x="${40 + i * bw + 1}" y="${H - B - h}" width="${bw - 2}" height="${h}" fill="rgba(106,12,160,.18)"/>`;
  }).join("");
  const marks = d.marks.map((m) => {
    const px = 40 + (Math.max(0, Math.min(89.9, m.a8)) / 90) * (W - 60);
    return `<line x1="${px.toFixed(1)}" y1="26" x2="${px.toFixed(1)}" y2="${H - B}" stroke="${GOLD}" stroke-width="2"><title>${esc(m.name)} · ${f1(m.a8)}</title></line>`;
  }).join("");
  const medX = 40 + (d.med / 90) * (W - 60);
  const body = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${bars}
    <line x1="${medX}" y1="26" x2="${medX}" y2="${H - B}" stroke="rgba(34,18,51,.5)" stroke-dasharray="3 4"/>
    <text x="${medX}" y="18" text-anchor="middle" font-size="10" fill="${MUTED}">England median ${f1(d.med)}</text>
    ${marks}
    ${[0, 30, 60, 90].map((v) => `<text x="${40 + (v / 90) * (W - 60)}" y="${H - 14}" text-anchor="middle" font-size="10" fill="${MUTED}">${v}</text>`).join("")}</svg>
  <p class="pz-note">Attainment 8 across ${d.total.toLocaleString("en-GB")} schools; each gold line is a school in scope.</p>`;
  return section("Where they sit", null, body);
}

function ofstedHtml(d) {
  const ORDER = ["Outstanding", "Good", "Requires improvement", "Inadequate", "Not yet inspected"];
  const rows = ORDER.filter((k) => d.scope[k] || d.nat[k]).map((k) => {
    const sn = d.scope[k] || 0, sp = d.n ? Math.round((sn / d.n) * 100) : 0;
    const np = d.natN ? Math.round(((d.nat[k] || 0) / d.natN) * 100) : 0;
    return `<tr><td class="nm">${esc(k)}</td><td class="num">${sn}</td><td><div class="bar"><span style="width:${sp}%"></span></div></td><td class="num">${sp}%</td><td class="num nat">${np}%</td></tr>`;
  }).join("");
  return section("Inspection profile", "Current judgements across the scope, against the national picture.",
    `<table class="pz-table"><thead><tr><th>Judgement</th><th>Schools</th><th></th><th>Scope</th><th>England</th></tr></thead><tbody>${rows}</tbody></table>`);
}

const RENDERERS = { cohort: cohortHtml, movement: movementHtml, gap: gapHtml, scatter: scatterHtml, distribution: distributionHtml, ofsted: ofstedHtml };

export function renderBlocks(computed) {
  return computed.blocks.map((b) => RENDERERS[b.type] ? RENDERERS[b.type](b.data) : "").join("");
}

export const PZ_CSS = `
  .pz-report{background:#fff;color:${INK};font-family:Inter,system-ui,sans-serif;border:1px solid rgba(34,18,51,.1);border-radius:14px;padding:46px 52px;box-shadow:0 18px 60px rgba(34,18,51,.08)}
  .pz-report h1{font-family:Fraunces,serif;font-weight:600;font-size:40px;letter-spacing:-.02em;margin:10px 0 6px;line-height:1.08}
  .pz-report h2{font-family:Fraunces,serif;font-weight:600;font-size:23px;letter-spacing:-.01em;margin:0 0 4px}
  .pz-kick{font-size:11px;letter-spacing:.22em;font-weight:600;color:#8a6d1c}
  .pz-scope{color:${MUTED};font-size:14px;margin:0 0 6px}
  .pz-vintage{color:${MUTED};font-size:11px;opacity:.8}
  .pz-block{margin-top:40px}
  .pz-rule{height:1px;background:rgba(34,18,51,.12);margin-bottom:18px}
  .pz-note{color:${MUTED};font-size:12.5px;margin:4px 0 12px;line-height:1.5}
  .pz-table{width:100%;border-collapse:collapse;font-size:12.5px}
  .pz-table th{text-align:left;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};font-weight:600;padding:6px 8px;border-bottom:1px solid rgba(34,18,51,.2)}
  .pz-table td{padding:7px 8px;border-bottom:1px solid rgba(34,18,51,.07);vertical-align:top}
  .pz-table td.nm{font-weight:600}
  .pz-table td .sub{display:block;font-weight:400;color:${MUTED};font-size:10.5px}
  .pz-table td.num{font-variant-numeric:tabular-nums}
  .pz-table tfoot td{border-top:2px solid rgba(34,18,51,.25);font-weight:600;border-bottom:none}
  .pz-table tfoot tr.nat td{font-weight:400;color:${MUTED}}
  .pz-table .bar{background:rgba(34,18,51,.07);border-radius:6px;height:10px;min-width:120px;overflow:hidden}
  .pz-table .bar span{display:block;height:100%;background:${PURPLE};border-radius:6px}
  @media print{.pz-report{box-shadow:none;border:none;border-radius:0}}
`;

export function coverHtml(spec, computed) {
  const n = computed.schools.length;
  return `<div class="pz-kick">THE ALL SAINTS INSTITUTE · PRIZM</div>
  <h1>${esc(spec.title || "A report")}</h1>
  <p class="pz-scope">${esc(scopeLabel(spec.scope, n))} · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
  <p class="pz-vintage">${esc(VINTAGE)} · every figure computed from the published national dataset</p>`;
}

/* ── the deliverable: one self-contained HTML file ── */
export function reportHtml(spec, computed) {
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(spec.title || "Prizm report")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>body{margin:0;background:#FBFAF7;padding:34px 16px}main{max-width:880px;margin:0 auto}${PZ_CSS}
.pz-foot{color:${MUTED};font-size:11px;text-align:center;margin:26px 0 8px}</style></head>
<body><main><div class="pz-report">${coverHtml(spec, computed)}${renderBlocks(computed)}</div>
<p class="pz-foot">Built with Prizm at institute.school · the AI arranges, the mathematics counts · ${esc(VINTAGE)}</p></main></body></html>`;
}
