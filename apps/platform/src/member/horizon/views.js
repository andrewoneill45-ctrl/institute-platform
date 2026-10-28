/* Horizon's views: each model's result as report sections, in Prizm's hand.
   Pure string builders, so the same HTML is shown on screen and downloaded
   for a position paper. */
import { KIT } from "../prizm/render.js";
import { YL, shortYL } from "./models.js";

const { section, legend, dualTrendSvg, divergeSvg, columnsSvg, hit, esc, f1, capRows } = KIT;
const n0 = (v) => (v == null ? "–" : Math.round(v).toLocaleString("en-GB"));
const sg = (v, dp = 1) => (v == null ? "–" : (v > 0 ? "+" : "") + Number(v).toFixed(dp));
const money = (v) => { if (v == null) return "–"; const a = Math.abs(v), s = v < 0 ? "−" : ""; return a >= 1e9 ? `${s}£${(a / 1e9).toFixed(2)}bn` : a >= 1e6 ? `${s}£${(a / 1e6).toFixed(1)}m` : a >= 1e3 ? `${s}£${Math.round(a / 1e3)}k` : `${s}£${Math.round(a)}`; };
const tiles = (ts) => `<div class="pz-tiles">${ts.filter(Boolean).map((t) => `<div class="pz-tile"><div class="n">${t.n}</div><p>${t.p}</p>${t.c ? `<div class="cmp">${t.c}</div>` : ""}</div>`).join("")}</div>`;
const fold = (title, count, head, rows, open) => `<details class="pz-fold"${open ? " open" : ""}><summary>${title}<span>${count}</span></summary><table class="pz-table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></details>`;
const note = (t) => `<p class="pz-note" style="margin:16px 0 6px">${t}</p>`;
const range = (vals, pad, step) => { const v = vals.filter((x) => x != null); const lo = Math.min(...v), hi = Math.max(...v); return { min: Math.max(0, Math.floor((lo - pad) / step) * step), max: Math.ceil((hi + pad) / step) * step }; };

/* ── forecasts ── */
export function forecastsHtml({ label, PRI, rolls, demand, results }) {
  const out = [];
  if (rolls && rolls.hist.length) {
    const pts = [...rolls.hist.map((h) => ({ t: shortYL(h.y), v: h.roll, nat: h.cap })), ...rolls.fc.slice(1).map((f) => ({ t: shortYL(f.y) + "*", v: f.roll, nat: f.cap }))];
    const rg = range(pts.flatMap((p) => [p.v, p.nat]), 0, 500);
    const last = rolls.last;
    out.push(section("Rolls to " + (last ? YL(last.y) : "the horizon"),
      `${esc(label)}: ${n0(rolls.now.roll)} ${PRI ? "primary" : "secondary"} pupils for ${n0(rolls.now.cap)} places in ${YL(rolls.L)}${last ? `, carried to ${n0(last.roll)} by ${YL(last.y)} on the authorities' own forecasts: ${n0(rolls.spareLast)} places spare, ${f1((100 * rolls.spareLast) / last.cap)}% of today's capacity` : ""}.`,
      `History from every capacity return; years marked * carry each school's roll forward by its planning area's forecast change (DfE, school capacity 2024/25), with capacity held at today's. If places are removed or added, the gap closes or widens accordingly.`,
      dualTrendSvg(pts, { ...rg, dp: 0, a: "Pupils", b: "Places" })));
  }
  if (demand && demand.tot.length) {
    const pts = [...demand.tot.map((t) => ({ t: shortYL(t.y), v: t.ratio == null ? null : +t.ratio.toFixed(2) })), ...demand.proj.map((p) => ({ t: shortYL(p.y) + "*", v: p.ratio == null ? null : +p.ratio.toFixed(2) }))];
    const rg = range(pts.map((p) => p.v), 0.1, 0.1);
    const lastP = demand.proj[demand.proj.length - 1];
    out.push(section("Demand, carried forward",
      `First preferences per place ${demand.slope > 0.005 ? "rising" : demand.slope < -0.005 ? "falling" : "flat"} at ${sg(demand.slope, 2)} a year over the last five intakes; if that held, ${lastP && lastP.ratio != null ? lastP.ratio.toFixed(2) : "–"} per place by September ${lastP ? lastP.y.slice(0, 4) : ""}.`,
      "A straight line through the last five intakes (school-level applications and offers), extended three years. A trend, not a forecast of parental choice.",
      dualTrendSvg(pts.map((p) => ({ ...p, nat: null })), { ...rg, dp: 2, a: "Per place", b: "" })));
  }
  if (results && results.rows.length) {
    const rows = results.rows;
    const shown = capRows(rows.map((r) => ({ label: r.name, v: r.drift, urn: r.urn, tip: [r.name, `${results.measure} ${f1(r.now)} now, ${f1(r.next)} projected (${f1(r.lo)} to ${f1(r.hi)})`, `Its twins achieve ${f1(r.twins)}`] })), 40);
    out.push(section("Results, one year on",
      `If schools hold ${Math.round(results.rho * 100)}% of their distance from their twins, as England's schools did between the last two years, ${esc(label)}'s mean ${esc(results.measure)} moves from ${f1(results.meanNow)} to ${f1(results.meanNext)}.`,
      `Persistence (ρ = ${results.rho}) measured across ${n0(results.n)} schools: each school's distance from its twenty statistical twins in one year against the next. Projection = what its twins achieve + ρ × today's distance; the 95% band is ±${f1(1.96 * results.sd)} points. Schools well above their twins tend to drift back a little, those below to recover a little: the regression every head knows, made explicit.`,
      divergeSvg(shown.rows.filter((r) => !r.gap), { dp: 1, zero: "no change on today" }) +
      fold("Every school, now and projected", `${rows.length} schools`, ["School", "Now", "Previous", "Its twins", "Projected", "95% band", "Change"],
        rows.map((r) => `<tr${hit([r.name], r.urn)}><td class="nm">${esc(r.name)}</td><td class="num">${f1(r.now)}</td><td class="num">${f1(r.prev)}</td><td class="num">${f1(r.twins)}</td><td class="num"><b>${f1(r.next)}</b></td><td class="num">${f1(r.lo)} to ${f1(r.hi)}</td><td class="num" style="color:${r.drift >= 0 ? "var(--purple)" : "var(--red)"}">${sg(r.drift)}</td></tr>`))));
  }
  return out.join("");
}

/* ── falling rolls and places ── */
export function placesSimHtml({ label, PRI, sim }) {
  if (!sim || !sim.rows.length) return section("Falling rolls", "No capacity returns for this scope.", "", "");
  const T = sim.totals, C = sim.closure;
  const head = `${esc(label)} by ${YL(sim.year)}: ${n0(T.proj)} pupils for ${n0(T.cap)} places, ${f1(T.sparePct)}% spare. ${sim.atRisk} school${sim.atRisk === 1 ? "" : "s"} fall below ${sim.minPer} pupils a year group or under 70% full.${C ? ` Closing ${C.closed} would leave ${f1(C.sparePctAfter)}% spare, moving ${n0(C.moved)} pupils an average ${f1(C.avgKm)} km${C.unplaced ? `, with ${n0(C.unplaced)} who could not be placed nearby` : ""}.` : ""}`;
  const t = tiles([
    { n: f1(T.sparePct) + "<small>%</small>", p: `places spare by ${YL(sim.year)} if no capacity changes.`, c: `${n0(T.spare)} empty places` },
    { n: String(sim.atRisk), p: `schools projected below ${sim.minPer} a year group or under 70% full.`, c: `demand shift ${Math.round(sim.shift * 100)}%` },
    C ? { n: f1(C.sparePctAfter) + "<small>%</small>", p: `spare after closing ${C.closed} school${C.closed === 1 ? "" : "s"}.`, c: `${n0(C.moved)} pupils moved · ${f1(C.avgKm)} km on average` } : { n: n0(T.roll), p: `pupils on roll in ${YL(sim.fr.L)}, today's starting point.`, c: `${n0(T.cap)} places` },
  ]);
  const shown = capRows(sim.rows.map((r) => ({ label: r.name, v: r.fill, urn: r.urn, tipLines: [r.name, `${n0(r.roll)} now, ${n0(r.proj)} projected for ${n0(r.cap)} places`, `${n0(r.perYear)} a year group · first preferences ${sg(r.trend)}% a year`] })), 44);
  const cols = columnsSvg({ rows: shown.rows, min: 0, max: 120, unit: "%", dp: 0, refs: [{ v: 70, label: "70% full", color: "var(--red)" }, { v: 100, label: "Full", color: "var(--gold)" }] });
  const table = fold("Every school, today and projected", `${sim.rows.length} schools · tick to close in the controls`, ["School", "Places", "On roll now", "Projected", "Per year group", "Full", "First prefs per place", "Trend a year", C ? "After closures" : ""].filter(Boolean),
    sim.rows.map((r) => `<tr${hit([r.name], r.urn)}><td class="nm">${esc(r.name)}${r.risk ? ' <span style="color:var(--red);font-size:11px">at risk</span>' : ""}</td><td class="num">${n0(r.cap)}</td><td class="num">${n0(r.roll)}</td><td class="num"><b>${n0(r.proj)}</b></td><td class="num">${n0(r.perYear)}</td><td class="num">${f1(r.fill)}%</td><td class="num">${r.ratio == null ? "–" : r.ratio.toFixed(2)}</td><td class="num">${sg(r.trend)}%</td>${C ? `<td class="num">${r.after == null ? "closed" : `${n0(r.after)} (${f1(r.fillAfter)}%)`}</td>` : ""}</tr>`), true);
  return section("Falling rolls and places", head,
    `Each school's roll is carried forward by its planning area's forecast; then, with the demand shift on, its share moves with the five-year trend in its first preferences (damped, and capped at half or one and a half times), keeping the area's total to the forecast. Closures send each closed school's projected pupils to the nearest open schools with room, as the crow flies. A model of pressure, not a plan: it knows nothing of sites, trusts, faith designation or travel.`,
    t + note("Projected fill, school by school.") + cols + table);
}

/* ── funding ── */
export function fundingHtml({ label, sim }) {
  if (!sim) return "";
  const P = sim.P;
  const A = sim.area;
  const by = [P.fsm && "disadvantage", P.senk && "SEN support", P.ehcp && "EHC plans", P.eal && "EAL", P.idaci && "area deprivation"].filter(Boolean).join(", ");
  const head = `${money(sim.pot)}${P.neutral ? ", found by top-slicing every school in England equally per pupil," : " of new money"} shared across England by ${by}: ${n0(sim.winners)} of ${n0(sim.n)} schools gain${P.neutral ? `, ${n0(sim.losers)} lose` : ""}. The most disadvantaged fifth gain ${money(sim.quintiles[4].pp)} a pupil; the least, ${money(sim.quintiles[0].pp)}.${A ? ` ${esc(label)}'s ${A.n} schools ${A.net >= 0 ? "gain" : "lose"} ${money(Math.abs(A.net))} between them: ${money(A.pp)} a pupil.` : ""}`;
  const t = tiles([
    { n: money(sim.quintiles[4].pp), p: `a pupil, on average, for the fifth of schools with most free school meals (${f1(sim.quintiles[4].fsmLo)}% to ${f1(sim.quintiles[4].fsmHi)}%).`, c: `least disadvantaged fifth: ${money(sim.quintiles[0].pp)}` },
    { n: f1(sim.bottomShare) + "<small>%</small>", p: "of the money gained goes to the quarter of schools whose disadvantaged pupils achieve least.", c: "an even spread would be 25%" },
    A ? { n: money(A.pp), p: `a pupil for ${esc(label)}'s ${A.n} schools, ${money(A.net)} in all.`, c: `${A.winners} gain${P.neutral ? ` · ${A.losers} lose` : ""} · England ${P.neutral ? "nets to zero" : money(sim.natPp) + " a pupil"}` }
      : { n: n0(sim.winners), p: `schools gain${P.neutral ? `; ${n0(sim.losers)} lose to fund it` : ""}.`, c: `median ${money(sim.median)} a pupil` },
  ]);
  const qbars = columnsSvg({ rows: sim.quintiles.map((q) => ({ label: `FSM ${f1(q.fsmLo)}–${f1(q.fsmHi)}%`.replace("–", " to "), v: q.pp, tipLines: [`Quintile ${q.q}`, `${money(q.pp)} a pupil`, `${q.n} schools`] })), min: Math.min(0, ...sim.quintiles.map((q) => q.pp)) - 10, max: Math.max(10, ...sim.quintiles.map((q) => q.pp)) + 10, dp: 0 });
  const regions = fold("By region", `${sim.regions.length} regions`, ["Region", "Schools", "Net change", "A pupil"], sim.regions.map((g) => `<tr><td class="nm">${esc(g.name)}</td><td class="num">${g.schools}</td><td class="num">${money(g.net)}</td><td class="num"><b>${money(g.pp)}</b></td></tr>`), true);
  const list = sim.mine || sim.rows;
  const top = list.slice(0, 15), bot = list.slice(-15).reverse();
  const row = (r) => `<tr${hit([r.name], r.urn)}><td class="nm">${esc(r.name)}<br><small style="color:var(--muted)">${esc(r.la || "")}</small></td><td class="num">${n0(r.n)}</td><td class="num">${f1(r.fsm)}%</td><td class="num">${f1(r.ehcp)}%</td><td class="num">${money(r.net)}</td><td class="num"><b>${money(r.pp)}</b></td><td class="num">${r.pctIncome == null ? "–" : sg(r.pctIncome) + "%"}</td></tr>`;
  const H = ["School", "Pupils", "FSM", "EHC plans", "Net", "A pupil", "Of income"];
  return section("Funding and premiums", head,
    `Each school's share is weighted by its counts of pupils: FSM × ${P.fsm}, SEN support × ${P.senk}, EHC plans × ${P.ehcp}, EAL × ${P.eal}${P.idaci ? `, plus an area deprivation factor × ${P.idaci}` : ""}. Counts are pupils × the published percentages (census January 2026); income is the 2024-25 accounts. The pot is shared across every state-funded ${sim.PRI ? "primary" : "secondary"} in England; the area chosen is shown as its share. ${P.neutral ? "Budget-neutral: the pot is first taken equally per pupil from every school." : "New money: no school loses."}`,
    t + note("A pupil, by fifth of free school meals.") + qbars + regions + (sim.mine && sim.mine.length <= 30 ? fold(`Every school in ${esc(label)}`, `${sim.mine.length}`, H, sim.mine.map(row), true) : fold(sim.mine ? `Largest gains in ${esc(label)}` : "Largest gains in England", "15", H, top.map(row)) + (P.neutral ? fold(sim.mine ? `Largest losses in ${esc(label)}` : "Largest losses in England", "15", H, bot.map(row)) : "")));
}

/* ── accountability ── */
export function accountabilityHtml({ label, sim }) {
  if (!sim) return "";
  const W = sim.weights.filter((w) => w.w > 0);
  const top = sim.fq[4], bot = sim.fq[0];
  const head = `Judged by ${W.map((w) => `${esc(/^(Attainment|Grade|RWM)/.test(w.label) ? w.label : w.label.charAt(0).toLowerCase() + w.label.slice(1))}${W.length > 1 ? ` (${w.w})` : ""}`).join(", ")} instead of ${esc(sim.base)} alone, the most disadvantaged fifth of schools move ${top.move >= 0 ? "up" : "down"} ${n0(Math.abs(top.move))} places on average and the least disadvantaged ${bot.move >= 0 ? "up" : "down"} ${n0(Math.abs(bot.move))}. ${sim.enterN} schools would newly fall into the bottom tenth; ${sim.leaveN} would leave it.`;
  const t = tiles([
    { n: sg(top.move, 0), p: "average change in rank for the fifth of schools with most free school meals.", c: `bottom tenth: ${top.inBottom10Base} today, ${top.inBottom10Comp} proposed` },
    { n: sg(bot.move, 0), p: "average change in rank for the fifth with fewest.", c: `bottom tenth: ${bot.inBottom10Base} today, ${bot.inBottom10Comp} proposed` },
    { n: sim.corr == null ? "–" : sim.corr.toFixed(2), p: `rank correlation with today's ${esc(sim.base)} league: 1 means nothing changes.`, c: `${n0(sim.N)} schools ranked` },
  ]);
  const fqBars = columnsSvg({ rows: sim.fq.map((q) => ({ label: `FSM fifth ${q.q}`, v: q.move, tipLines: [`FSM fifth ${q.q}`, `${sg(q.move, 0)} places on average`, `bottom tenth ${q.inBottom10Base} → ${q.inBottom10Comp}`] })), min: Math.min(0, ...sim.fq.map((q) => q.move)) - 40, max: Math.max(0, ...sim.fq.map((q) => q.move)) + 40, dp: 0 });
  const H = ["School", "Today's rank", "Proposed", "Move", "Today's measure", "FSM"];
  const row = (r) => `<tr${hit([r.name], r.urn)}><td class="nm">${esc(r.name)}<br><small style="color:var(--muted)">${esc(r.la || "")}</small></td><td class="num">${n0(r.rb)}</td><td class="num"><b>${n0(r.rc)}</b></td><td class="num" style="color:${r.move >= 0 ? "var(--purple)" : "var(--red)"};font-weight:600">${sg(r.move, 0)}</td><td class="num">${f1(r.base)}</td><td class="num">${f1(r.fsm)}%</td></tr>`;
  return section("Accountability measures", head,
    `Every state-funded ${sim.base === "Attainment 8" ? "secondary" : "primary"} in England ranked twice: by ${esc(sim.base)} as today, and by a composite of standardised measures with the weights shown. "Beating the odds" is each school's distance from its twenty statistical twins; inclusion is the share of pupils with EHC plans. Ranks among ${n0(sim.N)} schools; a school needs most of the measures published to be ranked. Scope for the named lists: ${esc(label)}.`,
    t + note("Average change in rank, by fifth of free school meals: positive is up the table.") + fqBars +
    fold("Rising most in scope", `${sim.risers.length}`, H, sim.risers.map(row), true) + fold("Falling most in scope", `${sim.fallers.length}`, H, sim.fallers.map(row)) +
    fold("Newly in England's bottom tenth", `${sim.enterN}`, H, sim.enter.map(row)) + fold("Leaving the bottom tenth", `${sim.leaveN}`, H, sim.leave.map(row)));
}

/* ── SEND ── */
export function sendHtml({ label, sim }) {
  if (!sim || !sim.rows.length) return section("SEND growth", "No authority data for this scope.", "", "");
  const T = sim.totals;
  const growthWord = sim.growth === "trend" ? "its own five-year growth rate" : sim.growth === "half" ? "half its five-year growth rate" : sim.growth === "flat" ? "no further growth" : `${sim.growth}% a year`;
  const head = `If every authority carried on at ${growthWord}, EHC plans in ${esc(label)} would go from ${n0(T.now)} to ${n0(T.ehcp31)} by January 2031. Specialist demand would reach ${n0(T.demand31)} against ${n0(T.places)} special school places: a shortfall of ${n0(T.gap31)}${sim.shift ? `, after ${f1(sim.shift)}% of new specialist demand is met in mainstream` : ""}.`;
  const t = tiles([
    { n: n0(T.ehcp31), p: "EHC plans by January 2031 on these assumptions.", c: `${n0(T.now)} in January ${sim.last.slice(0, 4).replace(/\d{4}/, (y) => +y + 1)}` },
    { n: n0(T.gap31), p: "specialist places short by 2031: projected demand less today's special school places.", c: `${n0(T.onRoll)} on roll for ${n0(T.places)} places today` },
    { n: f1(sim.shift) + "<small>%</small>", p: "of new specialist demand met in mainstream (the inclusion lever).", c: "set it in the controls" },
  ]);
  /* the scope's own series: England's, or the authorities' summed */
  const one = sim.rows.length < 150;
  const series = one ? sim.natSeries.map((p) => ({ y: p.y, v: sim.rows.reduce((a, r) => a + ((r.ehcp.find((e) => e.y === p.y) || {}).v || 0), 0) })) : sim.natSeries;
  const natPts = series.map((p) => ({ t: shortYL(p.y), v: p.v }));
  const mx = Math.max(...natPts.map((p) => p.v)), step = mx > 100000 ? 100000 : mx > 10000 ? 5000 : mx > 1000 ? 500 : 50;
  const nat = dualTrendSvg(natPts.map((p) => ({ ...p, nat: null })), { min: 0, max: Math.ceil((mx * 1.1) / step) * step, dp: 0, a: one ? esc(label).slice(0, 14) : "England", b: "" });
  const H = ["Authority", "EHC plans now", "Growth a year", "2031", "Special places", "On roll", "Demand 2031", "Gap", "Authority's own forecast"];
  const rows = sim.rows.map((r) => `<tr><td class="nm">${esc(r.la)}</td><td class="num">${n0(r.now)}</td><td class="num">${f1(r.g)}%</td><td class="num">${n0(r.ehcp31)}</td><td class="num">${n0(r.places)}</td><td class="num">${n0(r.onRoll)}</td><td class="num">${n0(r.demand31)}</td><td class="num" style="font-weight:600;color:${r.gap31 > 0 ? "var(--red)" : "var(--purple)"}">${sg(r.gap31, 0)}</td><td class="num">${r.laFc ? `${n0(r.laFc.v)} (${YL(r.laFc.y)})` : "–"}</td></tr>`);
  const top = capRows(sim.rows.slice(0, 40).map((r) => ({ label: r.la, v: r.gap31, tipLines: [r.la, `${n0(r.demand31)} specialist demand by 2031 for ${n0(r.places)} places`, `EHC plans ${n0(r.now)} → ${n0(r.ehcp31)} at ${f1(r.g)}% a year`] })), 40);
  return section("SEND growth", head,
    `EHC plans as at January each year (DfE, 2019 to 2026). Growth is each authority's compound rate over its last five years unless set otherwise. Specialist demand grows with plans at each authority's current ratio of special school pupils to plans; the inclusion lever keeps a share of that growth in mainstream. Places are special school capacity (2024/25). The last column is the authority's own forecast of pupils in specialist provision, published by the DfE, for comparison. Independent and non-maintained special schools are not in the capacity count, so true pressure on the public purse is greater than the gap shown.`,
    t + note(`EHC plans in ${one && sim.rows.length < 150 ? esc(label) : "England"}, every January since 2019.`) + nat +
    (sim.rows.length >= 3 ? note("Largest shortfalls of specialist places by 2031.") + columnsSvg({ rows: top.rows, min: Math.min(0, ...top.rows.map((r) => r.v || 0)), max: Math.max(10, ...top.rows.map((r) => r.v || 0)) * 1.1, dp: 0 }) : "") +
    fold("Every authority", `${sim.rows.length}`, H, rows));
}

export function horizonDoc(title, params, body, css) {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>body{margin:0;background:#F2EFEA;padding:34px 14px}main{max-width:960px;margin:0 auto}${css}</style></head><body><main><div class="pz-report">
<div class="pz-kick"><span>Horizon · the All Saints Institute · modelling</span></div><h1>${esc(title)}</h1><p class="pz-sub">${esc(params)}</p>
${body}<div class="pz-foot"><span>Modelled in Horizon at institute.school from the DfE's published data. Every figure is "if this held", not a prediction.</span></div></div></main></body></html>`;
}

/* ── two scenarios, side by side: the figures that matter, then the difference ── */
export function compareHtml(a, b, la = "A", lb = "B") {
  const F = (s, v) => (v == null ? "–" : s.money ? (v < 0 ? "−£" : "£") + Math.abs(Math.round(v)).toLocaleString("en-GB") : (s.sign && v > 0 ? "+" : "") + (s.dp === 0 ? Math.round(v).toLocaleString("en-GB") : v.toFixed(s.dp)) + (s.unit && s.unit !== "£" ? s.unit : ""));
  const keys = [...new Set([...(a.summary || []).map((s) => s.k), ...(b.summary || []).map((s) => s.k)])];
  const rows = keys.map((k) => {
    const sa = (a.summary || []).find((s) => s.k === k), sb = (b.summary || []).find((s) => s.k === k), s = sa || sb;
    const va = sa ? sa.v : null, vb = sb ? sb.v : null;
    const d = va != null && vb != null ? vb - va : null;
    const better = d == null || d === 0 ? null : (s.lower ? d < 0 : d > 0);
    return `<div class="pz-tile pz-vs"><div class="vk">${esc(s.label)}</div><div class="pair"><div><div class="n" style="font-size:26px;white-space:nowrap">${F(s, va)}</div><div class="who">${esc(la)}</div></div><div class="sep"></div><div><div class="n" style="font-size:26px;white-space:nowrap">${F(s, vb)}</div><div class="who">${esc(lb)}</div></div></div><div class="cmp" style="${better == null ? "" : better ? "color:#E4CE8B" : "color:#f0b4bf"}">${d == null ? "no change" : `${esc(lb)} is ${s.money ? F(s, Math.abs(d)) : (s.dp === 0 ? Math.abs(Math.round(d)).toLocaleString("en-GB") : Math.abs(d).toFixed(s.dp)) + (s.unit && s.unit !== "£" ? s.unit : "")} ${d > 0 ? "higher" : "lower"}${better == null ? "" : better ? ", the better side" : ", the worse side"}`}</div></div>`;
  });
  const same = a.lever === b.lever;
  const end = (t) => (/[.?!]$/.test(t) ? t : t + ".");
  return section("Side by side", `${esc(la)}: ${esc(end(a.title))} ${esc(lb)}: ${esc(end(b.title))}`,
    same ? `The same lever under two settings: each figure as ${esc(la)} then ${esc(lb)}, and which way ${esc(lb)} moves it. Below, both scenarios in full.` : "Two different levers: the figures sit side by side where they share a measure. Below, both scenarios in full.",
    `<div class="pz-tiles">${rows.join("")}</div>`);
}
