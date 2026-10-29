/* Forecast: the pages. Prizm's kit draws the charts; these functions decide
   what each account is shown and say it plainly. */
import { KIT } from "../prizm/render.js";
import { LINES, YL, shortYL } from "./models.js";

const { section, divergeSvg, columnsSvg, hit, esc, capRows, niceTicks } = KIT;
const n0 = (v) => (v == null ? "–" : Math.round(v).toLocaleString("en-GB"));
const f1 = (v) => (v == null ? "–" : Number(v).toFixed(1));
const k = (v) => (v == null ? "–" : Math.abs(v) >= 1000 ? (v < 0 ? "−" : "") + "£" + (Math.abs(v) / 1000).toFixed(Math.abs(v) >= 10000 ? 1 : 2) + "m" : (v < 0 ? "−" : "") + "£" + Math.abs(Math.round(v)).toLocaleString("en-GB") + "k");
const money = (v) => (v == null ? "–" : (v < 0 ? "−" : "") + "£" + Math.abs(Math.round(v)).toLocaleString("en-GB"));
const big = (vk) => (vk == null ? "–" : Math.abs(vk) >= 1000000 ? (vk < 0 ? "−" : "") + "£" + (Math.abs(vk) / 1000000).toFixed(2) + "bn" : Math.abs(vk) >= 1000 ? (vk < 0 ? "−" : "") + "£" + (Math.abs(vk) / 1000).toFixed(1) + "m" : k(vk));
const sg = (v, dp = 0) => (v == null ? "–" : (v > 0 ? "+" : "") + Number(v).toFixed(dp));
const tiles = (ts) => `<div class="pz-tiles">${ts.filter(Boolean).map((t) => `<div class="pz-tile"><div class="n">${t.n}</div><p>${t.p}</p>${t.c ? `<div class="cmp">${t.c}</div>` : ""}</div>`).join("")}</div>`;
const note = (t) => `<p class="pz-note" style="margin:16px 0 6px">${t}</p>`;
const how = (t) => `<details class="pz-how"><summary>How it is worked out</summary><p>${t}</p></details>`;
const fold = (title, count, heads, rows, open = false) => `<details class="pz-fold"${open ? " open" : ""}><summary>${esc(title)}<span>${esc(String(count))}</span></summary><div style="overflow-x:auto"><table class="pz-table"><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div></details>`;
const sec = (label, head, method, body) => section(label, head, "", (method ? how(method) : "") + body);

/* ── a chart of several lines through the years, with a zero line when needed ── */
export function linesSvg(series, { years, unit = "£k", zero = false, labelLast = true, fmt }) {
  const W = 760, H = 250, pr = 118, pt = 22, pb = 34;
  const all = series.flatMap((s) => s.v).filter((v) => v != null);
  if (!all.length) return "";
  let lo = Math.min(...all), hi = Math.max(...all);
  if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
  const F = fmt || ((v) => (unit === "£k" ? big(v) : Math.round(v).toLocaleString("en-GB")));
  const ticks = niceTicks(lo, hi, 4);
  const pl = 14 + 6.6 * Math.max(...ticks.map((t) => F(t).length), 3);
  const x = (i) => pl + (i / (years.length - 1)) * (W - pl - pr);
  const y = (v) => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo));
  let s = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:760px;height:auto" role="img">`;
  ticks.forEach((t) => { s += `<line class="gridl" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/><text class="tick" x="${pl - 6}" y="${y(t) + 3.5}" text-anchor="end">${F(t)}</text>`; });
  if (zero && lo < 0 && hi > 0) s += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" stroke="var(--ink)" stroke-width="1.2"/>`;
  const every = years.length > 10 ? 2 : 1;
  years.forEach((t, i) => { if (i % every === 0 || i === years.length - 1) s += `<text class="tick" x="${x(i)}" y="${H - 10}" text-anchor="middle">${esc(t)}</text>`; });
  const placed = [];
  series.forEach((sr) => {
    const pts = sr.v.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean);
    if (pts.length >= 2) s += `<polyline points="${pts.join(" ")}" fill="none" stroke="${sr.color}" stroke-width="${sr.width || 2.4}"${sr.dash ? ` stroke-dasharray="${sr.dash}"` : ""}/>`;
    sr.v.forEach((v, i) => { if (v == null) return; s += `<g${hit([years[i], `${sr.label}: ${F(v)}`])}><circle cx="${x(i)}" cy="${y(v)}" r="3.6" fill="${sr.color}" stroke="var(--paper)" stroke-width="1.4"/><circle cx="${x(i)}" cy="${y(v)}" r="11" fill="transparent"/></g>`; });
    if (labelLast) {
      const li = sr.v.map((v, i) => (v == null ? -1 : i)).filter((i) => i >= 0).pop();
      if (li != null) {
        let yy = y(sr.v[li]) + 4;
        while (placed.some((p) => Math.abs(p - yy) < 13)) yy += 13;
        placed.push(yy);
        s += `<text class="reftxt" x="${W - pr + 8}" y="${yy}" style="fill:${sr.color};font-weight:600">${esc(sr.label)}</text>`;
      }
    }
  });
  return s + "</svg>";
}

/* ── one school ─────────────────────────────────────────────────────── */
export function schoolHtml({ me, peers, saves, P, A, core }) {
  const L = me.last, out = [];
  const yrs = me.rows.map((r) => shortYL(r.y));
  const resShare = L.inc ? Math.round((100 * L.res) / L.inc) : null;
  const trendBal = me.rows.slice(-3).map((r) => r.bal);
  const story = L.bal < 0
    ? `${esc(me.name)} spent ${k(-L.bal)} more than it received in ${YL(L.y)}${L.res >= 0 ? `, leaving ${k(L.res)} in reserve (${resShare}% of income)` : `, and its reserve is ${k(L.res)}: a deficit`}.`
    : `${esc(me.name)} ended ${YL(L.y)} ${k(L.bal)} in surplus, with ${k(L.res)} in reserve (${resShare}% of a year's income).`;
  out.push(sec("The ledger", story,
    `Every full-year return the school has made since ${YL(me.first.y)}: ${me.rows.length} years, ${L.src === "A" ? "academies' accounting returns" : "consistent financial reporting"}. In-year balance is income less expenditure; the reserve is the revenue balance carried at the year end.`,
    tiles([
      { n: k(L.bal), p: `in-year balance, ${YL(L.y)}.`, c: trendBal.length === 3 ? `three years: ${trendBal.map(k).join(" · ")}` : null },
      { n: k(L.res), p: "revenue reserve carried forward.", c: resShare != null ? `${resShare}% of a year's income` : null },
      { n: money(L.incPP), p: "income for each pupil.", c: peers && peers.bench.inc.med ? `schools like yours: ${money(peers.bench.inc.med)}` : null },
      { n: n0(L.pupils), p: `pupils on the return, ${L.teachers != null ? `${f1(L.teachers)} teachers` : ""}.`, c: me.rows.length > 1 ? `${sg(L.pupils - me.first.pupils)} since ${YL(me.first.y)}` : null },
    ]) +
    note("Income and spending, every year on the books.") +
    linesSvg([{ label: "Income", v: me.rows.map((r) => r.inc), color: "var(--purple)" }, { label: "Spending", v: me.rows.map((r) => r.exp), color: "var(--red)", dash: "5 4" }], { years: yrs }) +
    note("The reserve at each year end: what the school has to fall back on.") +
    linesSvg([{ label: "Reserve", v: me.rows.map((r) => r.res), color: "var(--gold)", width: 2.8 }], { years: yrs, zero: true })));

  /* against the schools most like it */
  if (peers && peers.n >= 10) {
    const rows = LINES.map((l) => { const b = peers.bench[l.k]; const mine = L.linesPP[l.k]; if (!b || b.med == null || mine == null) return null; return { label: l.label, v: Math.round(mine - b.med), tip: [l.label, `This school ${money(mine)} a pupil; schools like it ${money(b.med)}`, `ahead of ${b.pct}% of them`] }; }).filter(Boolean);
    const over = rows.filter((r) => r.v > 0).length;
    out.push(sec("Against the schools most like yours",
      `Spending more than the middle of ${peers.n} comparable ${peers.sector} on ${over} of ${rows.length} lines; income per pupil ${L.incPP != null && peers.bench.inc.med != null ? `${money(L.incPP - peers.bench.inc.med).replace("£-", "−£")} ${L.incPP >= peers.bench.inc.med ? "above" : "below"} theirs` : "not compared"}.`,
      `The comparators are ${esc(peers.rule)}, read from the same year's returns (${YL(peers.year)}): ${peers.n} schools. Each line is £ per pupil, this school less the comparators' median; right of the line is more than most spend. ${peers.deficitShare != null ? `${peers.deficitShare}% of these schools are themselves in deficit.` : ""}`,
      note("£ per pupil, this school against the median of the schools most like it.") + divergeSvg(rows, { dp: 0, unit: "", zero: "the comparators' median" })));
  }

  /* where the money could go further */
  if (saves.length) {
    const atMed = saves.filter((s) => s.gap > 0).reduce((a, s) => a + s.gap, 0);
    const atQ1 = saves.filter((s) => s.gapQ1 != null && s.gapQ1 > 0).reduce((a, s) => a + s.gapQ1, 0);
    const rows = saves.map((s) => `<tr><td class="nm">${esc(s.label)}<br><small style="color:var(--muted)">${esc(s.how)}</small></td><td class="num">${money(s.mine)}</td><td class="num">${money(s.med)}</td><td class="num">${s.q1 != null ? money(s.q1) : "–"}</td><td class="num" style="font-weight:600;color:${s.gap > 0 ? "var(--red)" : "var(--purple)"}">${s.gap > 0 ? k(s.gap) : "nothing: below the median"}</td><td class="num">${s.gapQ1 != null && s.gapQ1 > 0 ? k(s.gapQ1) : "–"}</td><td class="num">${Math.round(s.fixed * 100)}%</td></tr>`);
    out.push(sec("Where the money could go further",
      atMed > 0 ? `Spending at the comparators' median on every line where this school spends more would free ${k(atMed)} a year; at the leaner quarter, ${k(atQ1)}.` : "This school spends below the median of its comparators on every line: there is little to take from benchmarking alone.",
      `For each line, the gap is this school's £ per pupil less the comparators' median (or the leaner quarter: the point a quarter of them spend below), times this school's pupils. A gap is a question, not an instruction: the fixed share says how much of a line is tied to the building and the office rather than the roll.`,
      fold("Line by line", `${saves.length} lines`, ["Line", "This school, a pupil", "Comparators' median", "Leaner quarter", "Gap to the median", "Gap to the leaner quarter", "Fixed share"], rows, true)));
  }

  /* the years ahead */
  const Y = P.yrs, ys = Y.map((r) => shortYL(r.y) + (r.t ? "*" : ""));
  const end = P.end, lost = P.base.pupils - end.pupils;
  const head = P.cliffHold
    ? `If staffing is held as it is, the reserve is gone in ${YL(P.cliffHold)}${P.cliffFollow ? `; even following the roll, it runs out in ${YL(P.cliffFollow)}` : "; staffing that follows the roll keeps the school in balance"}.`
    : end.balHold < 0 ? `By ${YL(end.y)} the school spends ${k(-end.balHold)} a year more than it receives if nothing moves; the reserve covers it, for now.`
    : `On these assumptions the school stays in surplus to ${YL(end.y)}, with ${k(end.resHold)} in reserve.`;
  out.push(sec(`The years ahead, to ${YL(end.y)}`, head,
    `Pupils follow ${esc(P.roll.source)}${P.roll.area ? ` (${esc(P.roll.area)})` : ""}: ${lost > 0 ? `${n0(lost)} fewer by ${YL(end.y)}` : lost < 0 ? `${n0(-lost)} more by ${YL(end.y)}` : "no change"}. Income moves with the roll and with funding per pupil (${sg(A.fund, 1)}% a year). "Held" keeps today's staffing and lets pay (${sg(A.pay, 1)}% a year) and prices (${sg(A.infl, 1)}% a year) run. "Following the roll" moves the variable part of each line with pupil numbers, after the ${A.leadTime} year${A.leadTime === 1 ? "" : "s"} a staffing decision takes to land. The reserve carries forward either way.`,
    tiles([
      { n: n0(end.pupils), p: `pupils by ${YL(end.y)}, ${n0(P.base.pupils)} today.`, c: P.roll.source },
      { n: k(P.gapEnd), p: `a year, the gap between income and spending by ${YL(end.y)} if nothing moves.`, c: P.postsEnd != null && P.gapEnd < 0 ? `${f1(P.postsEnd)} teaching posts at ${money(A.teacherCost)}` : null },
      { n: P.cliffHold ? YL(P.cliffHold) : "beyond " + YL(end.y), p: "the year the reserve runs out with staffing held.", c: P.cliffFollow ? `following the roll: ${YL(P.cliffFollow)}` : "following the roll: it holds" },
      { n: k(end.resFollow), p: `in reserve by ${YL(end.y)} if staffing follows the roll.`, c: `held: ${k(end.resHold)}` },
    ]) +
    note("Income against spending, held and following the roll. Years marked * are projected.") +
    linesSvg([{ label: "Income", v: Y.map((r) => r.inc), color: "var(--purple)" }, { label: "Spending, held", v: Y.map((r) => r.hold), color: "var(--red)", dash: "5 4" }, { label: "Following the roll", v: Y.map((r) => r.follow), color: "var(--gold)" }], { years: ys }) +
    note("The reserve, year by year: below the line is a deficit.") +
    linesSvg([{ label: "Held", v: Y.map((r) => r.resHold), color: "var(--red)", dash: "5 4" }, { label: "Following the roll", v: Y.map((r) => r.resFollow), color: "var(--gold)", width: 2.8 }], { years: ys, zero: true })));

  /* decisions by year */
  if (P.decisions.length) {
    const rows = P.decisions.map((d) => `<tr><td class="nm">${YL(d.y)}</td><td class="num">${n0(d.pupils)}</td><td class="num">${d.lost > 0 ? n0(d.lost) + " fewer" : d.lost < 0 ? n0(-d.lost) + " more" : "no change"}</td><td class="num" style="font-weight:600;color:${d.teachers > 0.4 ? "var(--red)" : "var(--ink)"}">${d.teachers > 0.4 ? f1(d.teachers) + " fewer" : d.teachers < -0.4 ? f1(-d.teachers) + " more" : "as today"}</td><td class="num"><b>${d.decideBy === "now" ? "now" : YL(d.decideBy)}</b></td></tr>`);
    const first = P.decisions.find((d) => d.teachers > 0.9);
    out.push(sec("Decisions, by the year they have to be taken",
      first ? (first.decideBy === "now" ? `The first staffing decision is already due: September ${first.y.slice(0, 4)} brings a roll ${n0(first.lost)} pupils smaller than today's, and the lead time has gone.` : `The first staffing decision falls in ${YL(first.decideBy)}, for a September ${first.y.slice(0, 4)} roll ${n0(first.lost)} pupils smaller than today's.`) : "On this roll path no staffing reduction is needed inside the horizon.",
      `For each September, the teaching posts the "following the roll" line implies (${Math.round(85)}% of teaching posts treated as moving with the roll, the rest as leadership and structure), and the year by which the decision has to be made for it to land in time: ${A.leadTime} year${A.leadTime === 1 ? "" : "s"} before. A school that waits for the September the pupils leave has already spent the year.`,
      fold("The calendar", `${P.decisions.length} years`, ["September", "Pupils", "Against today", "Teaching posts", "Decide by"], rows, true)));
  }
  return out.join("");
}

/* ── an estate, or England ──────────────────────────────────────────── */
export function estateHtml({ E, label, A, isSystem }) {
  if (!E || !E.n) return section("The ledger", "No finance returns for this scope yet.", "", "");
  const out = [];
  const yrs = E.series.map((s) => shortYL(s.y));
  const last = E.series[E.series.length - 1];
  const resShare = E.inc ? Math.round((100 * E.res) / E.inc) : null;
  out.push(sec("The ledger", `${esc(label)}: ${E.n} schools with returns, ${big(E.inc)} income and ${big(E.res)} in reserve (${resShare}% of a year's income); ${E.deficits} in deficit, ${E.inYearDeficits} spending more than they receive.`,
    `Each school's latest full-year return (${YL(E.latestYear)} for the most recent), summed. ${isSystem ? "England's academies report a year behind its maintained schools, so the latest year mixes 2024/25 academies with 2025/26 maintained schools." : ""} The series below shows only the years in which most of these schools made a return.`,
    tiles([
      { n: String(E.deficits), p: "schools whose reserve is below zero.", c: `${Math.round((100 * E.deficits) / E.n)}% of ${E.n}` },
      { n: String(E.inYearDeficits), p: "schools that spent more than they received in their latest year.", c: `${Math.round((100 * E.inYearDeficits) / E.n)}%` },
      { n: String(E.cliffsHold), p: `schools whose reserve runs out inside ${A.horizonYears} years if staffing is held.`, c: `following the roll: ${E.cliffsFollow}` },
      { n: n0(E.pupils), p: "pupils across the returns.", c: E.ahead.length ? `${n0(E.ahead[E.ahead.length - 1].pupils)} by ${YL(E.ahead[E.ahead.length - 1].y)} on the forecasts` : null },
    ]) +
    note("Schools in deficit, each year, among those with a return.") +
    columnsSvg({ rows: E.series.filter((s) => s.n >= Math.max(3, 0.3 * E.n)).map((s) => ({ label: shortYL(s.y), v: s.n ? Math.round((1000 * s.deficits) / s.n) / 10 : 0, tipLines: [YL(s.y), `${s.deficits} of ${s.n} schools in deficit`, `${s.inYearDeficits} spent more than they received`] })), min: 0, max: Math.max(10, ...E.series.map((s) => (s.n ? (100 * s.deficits) / s.n : 0))) * 1.15, unit: "%", dp: 1 })));

  /* the years ahead, summed */
  if (E.ahead.length) {
    const Y = [{ y: E.latestYear, inc: E.inc, hold: E.exp, follow: E.exp, resHold: E.res, resFollow: E.res, pupils: E.pupils }, ...E.ahead];
    const ys = Y.map((r, i) => shortYL(r.y) + (i ? "*" : ""));
    const end = Y[Y.length - 1];
    out.push(sec(`The years ahead, to ${YL(end.y)}`,
      `If every school held its staffing, ${E.cliffsHold} of ${E.n} would exhaust their reserve by ${YL(end.y)} and the deficits would total ${big(-end.deficitHold)}; following the roll, ${E.cliffsFollow} schools and ${big(-end.deficitFollow)}. Today: ${E.deficits} schools, ${big(-E.deficitSum)}.`,
      `Every school projected on the same assumptions (pay ${sg(A.pay, 1)}%, funding per pupil ${sg(A.fund, 1)}%, non-staff costs ${sg(A.infl, 1)}% a year; pupils on the planning-area forecasts), then summed. Deficits are added up on their own: a school's surplus does not cover another's deficit in practice, so the net reserve is not the measure.`,
      note("Income against spending, held and following the roll, summed across the estate.") +
      linesSvg([{ label: "Income", v: Y.map((r) => r.inc), color: "var(--purple)" }, { label: "Spending, held", v: Y.map((r) => r.hold), color: "var(--red)", dash: "5 4" }, { label: "Following the roll", v: Y.map((r) => r.follow), color: "var(--gold)" }], { years: ys }) +
      note("Schools whose reserve is below zero, year by year.") +
      columnsSvg({ rows: E.ahead.map((r) => ({ label: shortYL(r.y) + "*", v: r.cliffsHold, tipLines: [YL(r.y), `${r.cliffsHold} schools below zero with staffing held`, `${r.cliffsFollow} following the roll`] })), min: 0, max: Math.max(5, ...E.ahead.map((r) => r.cliffsHold)) * 1.15, dp: 0 })));
  }

  /* school by school */
  const items = [...E.items].sort((a, b) => (a.P.cliffHold || "9999") < (b.P.cliffHold || "9999") ? -1 : (a.P.cliffHold || "9999") > (b.P.cliffHold || "9999") ? 1 : (a.me.last.res / a.me.last.inc) - (b.me.last.res / b.me.last.inc));
  const shown = isSystem ? items.slice(0, 300) : items;
  const rows = shown.map(({ s, me, P }) => { const L = me.last; return `<tr${hit([me.name || s.name, `${YL(L.y)}: income ${k(L.inc)}, spending ${k(L.exp)}`, `reserve ${k(L.res)}`], s.urn)}><td class="nm">${esc(me.name || s.name)}<br><small style="color:var(--muted)">${esc(s.la || "")}</small></td><td class="num">${n0(L.pupils)}</td><td class="num">${money(L.incPP)}</td><td class="num" style="color:${L.bal < 0 ? "var(--red)" : "var(--ink)"}">${k(L.bal)}</td><td class="num" style="font-weight:600;color:${L.res < 0 ? "var(--red)" : "var(--ink)"}">${k(L.res)}</td><td class="num">${L.inc ? Math.round((100 * L.res) / L.inc) + "%" : "–"}</td><td class="num">${n0(P.end.pupils)}</td><td class="num" style="color:${P.cliffHold ? "var(--red)" : "var(--muted)"}">${P.cliffHold ? YL(P.cliffHold) : "holds"}</td><td class="num">${P.cliffFollow ? YL(P.cliffFollow) : "holds"}</td><td class="num">${P.postsEnd != null && P.gapEnd < 0 ? f1(P.postsEnd) : "–"}</td></tr>`; });
  out.push(sec("School by school", `${items.filter((i) => i.P.cliffHold).length} schools reach the cliff inside the horizon with staffing held; the soonest first.`,
    `Each school's own ledger and projection. Click a row for the school's full page. "Cliff" is the first year the reserve goes below zero; "posts" is the structural gap at the horizon turned into teaching posts at ${money(A.teacherCost)} each.${isSystem ? " The first 300 are shown here; every school is reachable through Prizm and Atlas." : ""}`,
    fold("Every school", `${shown.length}`, ["School", "Pupils", "Income a pupil", "In-year balance", "Reserve", "Of income", `Pupils ${E.ahead.length ? YL(E.ahead[E.ahead.length - 1].y) : ""}`, "Cliff, held", "Cliff, following", "Posts at the horizon"], rows, true)));
  return out.join("");
}

export function forecastDoc(title, params, body, css) {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>body{margin:0;background:#F2EFEA;padding:34px 14px}main{max-width:960px;margin:0 auto}${css}</style></head><body><main><div class="pz-report">
<div class="pz-kick"><span>Forecast · the All Saints Institute · the ledger and the years ahead</span></div><h1>${esc(title)}</h1><p class="pz-sub">${esc(params)}</p>
${body}<div class="pz-foot"><span>Modelled in Forecast at institute.school from the DfE's finance returns. Every projection is "if this held", not a prediction.</span></div></div></main></body></html>`;
}
