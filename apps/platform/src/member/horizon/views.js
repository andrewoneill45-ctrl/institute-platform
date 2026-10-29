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
/* a section whose method is folded under the headline, not spread above the charts */
const sec = (label, head, how, body) => section(label, head, "", (how ? `<details class="pz-how"><summary>How it's modelled</summary><p>${how}</p></details>` : "") + body);
const range = (vals, pad, step) => { const v = vals.filter((x) => x != null); const lo = Math.min(...v), hi = Math.max(...v); return { min: Math.max(0, Math.floor((lo - pad) / step) * step), max: Math.ceil((hi + pad) / step) * step }; };

/* ── forecasts ── */
export function forecastsHtml({ label, PRI, rolls, demand, results }) {
  const out = [];
  if (rolls && rolls.hist.length) {
    const pts = [...rolls.hist.map((h) => ({ t: shortYL(h.y), v: h.roll, nat: h.cap })), ...rolls.fc.slice(1).map((f) => ({ t: shortYL(f.y) + "*", v: f.roll, nat: f.cap }))];
    const rg = range(pts.flatMap((p) => [p.v, p.nat]), 0, 500);
    const last = rolls.last;
    out.push(sec("Rolls to " + (last ? YL(last.y) : "the horizon"),
      `${esc(label)}: ${n0(rolls.now.roll)} pupils today${last ? `, ${n0(last.roll)} by ${YL(last.y)}; ${f1((100 * rolls.spareLast) / last.cap)}% of places spare` : ""}.`,
      `History from every capacity return; years marked * carry each school's roll forward by its planning area's forecast change (DfE, school capacity 2024/25), with capacity held at today's. If places are removed or added, the gap closes or widens accordingly.`,
      dualTrendSvg(pts, { ...rg, dp: 0, a: "Pupils", b: "Places" })));
  }
  if (demand && demand.tot.length) {
    const pts = [...demand.tot.map((t) => ({ t: shortYL(t.y), v: t.ratio == null ? null : +t.ratio.toFixed(2) })), ...demand.proj.map((p) => ({ t: shortYL(p.y) + "*", v: p.ratio == null ? null : +p.ratio.toFixed(2) }))];
    const rg = range(pts.map((p) => p.v), 0.1, 0.1);
    const lastP = demand.proj[demand.proj.length - 1];
    out.push(sec("Demand, carried forward",
      `First preferences per place ${demand.slope > 0.005 ? "rising" : demand.slope < -0.005 ? "falling" : "flat"}: ${lastP && lastP.ratio != null ? lastP.ratio.toFixed(2) : "–"} per place by September ${lastP ? lastP.y.slice(0, 4) : ""} if the trend held.`,
      "A straight line through the last five intakes (school-level applications and offers), extended three years. A trend, not a forecast of parental choice.",
      dualTrendSvg(pts.map((p) => ({ ...p, nat: null })), { ...rg, dp: 2, a: "Per place", b: "" })));
  }
  if (results && results.rows.length) {
    const rows = results.rows;
    const shown = capRows(rows.map((r) => ({ label: r.name, v: r.drift, urn: r.urn, tip: [r.name, `${results.measure} ${f1(r.now)} now, ${f1(r.next)} projected (${f1(r.lo)} to ${f1(r.hi)})`, `Its twins achieve ${f1(r.twins)}`] })), 40);
    out.push(sec("Results, one year on",
      `${esc(label)}'s mean ${esc(results.measure)}: ${f1(results.meanNow)} today, ${f1(results.meanNext)} one year on.`,
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
  const head = C
    ? `Closing ${C.closed} in ${esc(label)} leaves ${f1(C.sparePctAfter)}% of places spare by ${YL(sim.year)}; ${n0(C.moved)} pupils move, ${f1(C.avgKm)} km on average${C.unplaced ? `, ${n0(C.unplaced)} unplaced` : ""}.`
    : `${esc(label)} by ${YL(sim.year)}: ${n0(T.proj)} pupils, ${f1(T.sparePct)}% of places spare, ${sim.atRisk} school${sim.atRisk === 1 ? "" : "s"} at risk.`;
  const t = tiles([
    { n: f1(T.sparePct) + "<small>%</small>", p: `places spare by ${YL(sim.year)} if no capacity changes.`, c: `${n0(T.spare)} empty places` },
    { n: String(sim.atRisk), p: `schools projected below ${sim.minPer} a year group or under 70% full.`, c: `demand shift ${Math.round(sim.shift * 100)}%` },
    C ? { n: f1(C.sparePctAfter) + "<small>%</small>", p: `spare after closing ${C.closed} school${C.closed === 1 ? "" : "s"}.`, c: `${n0(C.moved)} pupils moved · ${f1(C.avgKm)} km on average` } : { n: n0(T.roll), p: `pupils on roll in ${YL(sim.fr.L)}, today's starting point.`, c: `${n0(T.cap)} places` },
  ]);
  const shown = capRows(sim.rows.map((r) => ({ label: r.name, v: r.fill, urn: r.urn, tipLines: [r.name, `${n0(r.roll)} now, ${n0(r.proj)} projected for ${n0(r.cap)} places`, `${n0(r.perYear)} a year group · first preferences ${sg(r.trend)}% a year`] })), 44);
  const cols = columnsSvg({ rows: shown.rows, min: 0, max: 120, unit: "%", dp: 0, refs: [{ v: 70, label: "70% full", color: "var(--red)" }, { v: 100, label: "Full", color: "var(--gold)" }] });
  const table = fold("Every school, today and projected", `${sim.rows.length} schools · tick to close in the controls`, ["School", "Places", "On roll now", "Projected", "Per year group", "Full", "First prefs per place", "Trend a year", C ? "After closures" : ""].filter(Boolean),
    sim.rows.map((r) => `<tr${hit([r.name], r.urn)}><td class="nm">${esc(r.name)}${r.risk ? ' <span style="color:var(--red);font-size:11px">at risk</span>' : ""}</td><td class="num">${n0(r.cap)}</td><td class="num">${n0(r.roll)}</td><td class="num"><b>${n0(r.proj)}</b></td><td class="num">${n0(r.perYear)}</td><td class="num">${f1(r.fill)}%</td><td class="num">${r.ratio == null ? "–" : r.ratio.toFixed(2)}</td><td class="num">${sg(r.trend)}%</td>${C ? `<td class="num">${r.after == null ? "closed" : `${n0(r.after)} (${f1(r.fillAfter)}%)`}</td>` : ""}</tr>`), true);
  return sec("Falling rolls and places", head,
    `Each school's roll is carried forward by its planning area's forecast; then, with the demand shift on, its share moves with the five-year trend in its first preferences (damped, and capped at half or one and a half times), keeping the area's total to the forecast. Closures send each closed school's projected pupils to the nearest open schools with room, as the crow flies. A model of pressure, not a plan: it knows nothing of sites, trusts, faith designation or travel.`,
    t + note("Projected fill, school by school.") + cols + table);
}

/* ── funding ── */
export function fundingHtml({ label, sim }) {
  if (!sim) return "";
  const P = sim.P;
  const A = sim.area;
  const by = [P.fsm && "disadvantage", P.senk && "SEN support", P.ehcp && "EHC plans", P.eal && "EAL", P.idaci && "area deprivation"].filter(Boolean).join(", ");
  const head = `${money(sim.pot)} ${P.neutral ? "redistributed" : "of new money"}: the most disadvantaged fifth gain ${money(sim.quintiles[4].pp)} a pupil, the least ${money(sim.quintiles[0].pp)}${A ? `; ${esc(label)} ${A.net >= 0 ? "gains" : "loses"} ${money(Math.abs(A.net))}` : ""}.`;
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
  return sec("Funding and premiums", head,
    `Each school's share is weighted by its counts of pupils: FSM × ${P.fsm}, SEN support × ${P.senk}, EHC plans × ${P.ehcp}, EAL × ${P.eal}${P.idaci ? `, plus an area deprivation factor × ${P.idaci}` : ""}. Counts are pupils × the published percentages (census January 2026); income is the 2024-25 accounts. The pot is shared across every state-funded ${sim.PRI ? "primary" : "secondary"} in England; the area chosen is shown as its share. ${P.neutral ? "Budget-neutral: the pot is first taken equally per pupil from every school." : "New money: no school loses."}`,
    t + note("A pupil, by fifth of free school meals.") + qbars + regions + (sim.mine && sim.mine.length <= 30 ? fold(`Every school in ${esc(label)}`, `${sim.mine.length}`, H, sim.mine.map(row), true) : fold(sim.mine ? `Largest gains in ${esc(label)}` : "Largest gains in England", "15", H, top.map(row)) + (P.neutral ? fold(sim.mine ? `Largest losses in ${esc(label)}` : "Largest losses in England", "15", H, bot.map(row)) : "")));
}

/* ── accountability ── */
export function accountabilityHtml({ label, sim }) {
  if (!sim) return "";
  const W = sim.weights.filter((w) => w.w > 0);
  const top = sim.fq[4], bot = sim.fq[0];
  const head = `Judged this way, the most disadvantaged fifth of schools move ${top.move >= 0 ? "up" : "down"} ${n0(Math.abs(top.move))} places and the least ${bot.move >= 0 ? "up" : "down"} ${n0(Math.abs(bot.move))}; ${sim.enterN} newly fall below the floor.`;
  const t = tiles([
    { n: sg(top.move, 0), p: "average change in rank for the fifth of schools with most free school meals.", c: `bottom tenth: ${top.inBottom10Base} today, ${top.inBottom10Comp} proposed` },
    { n: sg(bot.move, 0), p: "average change in rank for the fifth with fewest.", c: `bottom tenth: ${bot.inBottom10Base} today, ${bot.inBottom10Comp} proposed` },
    { n: sim.corr == null ? "–" : sim.corr.toFixed(2), p: `rank correlation with today's ${esc(sim.base)} league: 1 means nothing changes.`, c: `${n0(sim.N)} schools ranked` },
  ]);
  const fqBars = columnsSvg({ rows: sim.fq.map((q) => ({ label: `FSM fifth ${q.q}`, v: q.move, tipLines: [`FSM fifth ${q.q}`, `${sg(q.move, 0)} places on average`, `bottom tenth ${q.inBottom10Base} → ${q.inBottom10Comp}`] })), min: Math.min(0, ...sim.fq.map((q) => q.move)) - 40, max: Math.max(0, ...sim.fq.map((q) => q.move)) + 40, dp: 0 });
  const H = ["School", "Today's rank", "Proposed", "Move", "Today's measure", "FSM"];
  const row = (r) => `<tr${hit([r.name], r.urn)}><td class="nm">${esc(r.name)}<br><small style="color:var(--muted)">${esc(r.la || "")}</small></td><td class="num">${n0(r.rb)}</td><td class="num"><b>${n0(r.rc)}</b></td><td class="num" style="color:${r.move >= 0 ? "var(--purple)" : "var(--red)"};font-weight:600">${sg(r.move, 0)}</td><td class="num">${f1(r.base)}</td><td class="num">${f1(r.fsm)}%</td></tr>`;
  return sec("Accountability measures", head,
    `Judged by ${W.map((w) => `${esc(w.label)}${W.length > 1 ? ` (${w.w})` : ""}`).join(", ")} instead of ${esc(sim.base)} alone. Every state-funded ${sim.base === "Attainment 8" ? "secondary" : "primary"} in England ranked twice: by ${esc(sim.base)} as today, and by a composite of standardised measures with the weights shown. "Beating the odds" is each school's distance from its twenty statistical twins; inclusion is the share of pupils with EHC plans. Ranks among ${n0(sim.N)} schools; a school needs most of the measures published to be ranked. Scope for the named lists: ${esc(label)}.`,
    t + note("Average change in rank, by fifth of free school meals: positive is up the table.") + fqBars +
    fold("Rising most in scope", `${sim.risers.length}`, H, sim.risers.map(row), true) + fold("Falling most in scope", `${sim.fallers.length}`, H, sim.fallers.map(row)) +
    fold("Newly in England's bottom tenth", `${sim.enterN}`, H, sim.enter.map(row)) + fold("Leaving the bottom tenth", `${sim.leaveN}`, H, sim.leave.map(row)));
}

/* ── SEND ── */
export function sendHtml({ label, sim }) {
  if (!sim || !sim.rows.length) return section("SEND growth", "No authority data for this scope.", "", "");
  const T = sim.totals;
  const growthWord = sim.growth === "trend" ? "its own five-year growth rate" : sim.growth === "half" ? "half its five-year growth rate" : sim.growth === "flat" ? "no further growth" : `${sim.growth}% a year`;
  const head = `EHC plans in ${esc(label)}: ${n0(T.now)} today, ${n0(T.ehcp31)} by 2031; ${n0(T.gap31)} specialist places short.`;
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
  const top = capRows(sim.rows.slice(0, 24).map((r) => ({ label: r.la, v: r.gap31, tipLines: [r.la, `${n0(r.demand31)} specialist demand by 2031 for ${n0(r.places)} places`, `EHC plans ${n0(r.now)} → ${n0(r.ehcp31)} at ${f1(r.g)}% a year`] })), 40);
  return sec("SEND growth", head,
    `Growth carried on at ${growthWord}${sim.shift ? `, with ${f1(sim.shift)}% of new specialist demand met in mainstream` : ""}. EHC plans as at January each year (DfE, 2019 to 2026). Growth is each authority's compound rate over its last five years unless set otherwise. Specialist demand grows with plans at each authority's current ratio of special school pupils to plans; the inclusion lever keeps a share of that growth in mainstream. Places are special school capacity (2024/25). The last column is the authority's own forecast of pupils in specialist provision, published by the DfE, for comparison. Independent and non-maintained special schools are not in the capacity count, so true pressure on the public purse is greater than the gap shown.`,
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

/* ── in the round: six dials and the chain that moved them ── */
const fmtDial = (d, v) => {
  if (v == null) return "–";
  if (d.money) { const a = Math.abs(v), s = v < 0 ? "−" : ""; return a >= 1e9 ? `${s}£${(a / 1e9).toFixed(2)}bn` : a >= 1e6 ? `${s}£${(a / 1e6).toFixed(a < 1e7 ? 1 : 0)}m` : a >= 1e3 ? `${s}£${Math.round(a / 1e3)}k` : `${s}£${Math.round(a)}`; }
  return (d.dp ? v.toFixed(d.dp) : Math.round(v).toLocaleString("en-GB")) + (d.unit || "");
};
export function rippleHtml(R, title) {
  if (!R || !R.dials.length) return "";
  const ICON = {
    pupils: '<path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2 20c.8-3.6 3-5.5 6-5.5s5.2 1.9 6 5.5M13.5 15.2c2.6-.4 4.6.9 5.8 3.8"/>',
    places: '<path d="M3.5 10 12 5l8.5 5M5.5 11v7.5h13V11M10 18.5V14h4v4.5"/>',
    money: '<path d="M12 3v18M16.5 7.5c-.6-1.6-2.2-2.5-4.5-2.5-2.6 0-4.2 1.3-4.2 3.1 0 4.3 9 2 9 6.6 0 2-1.9 3.3-4.6 3.3-2.6 0-4.3-1.1-4.8-2.8"/>',
    outcomes: '<path d="M4 19 10 12l4 3 6-8M14 7h6v6"/>',
    inclusion: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
    workforce: '<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20c1.2-3.6 3.6-5.3 7-5.3s5.8 1.7 7 5.3"/>',
  };
  const tiles = R.dials.map((d) => {
    const moved = d.delta != null && Math.abs(d.delta) > (d.dp ? 0.049 : 0.5);
    const good = !moved ? null : d.lower ? d.delta < 0 : d.higherIsGood != null ? (d.delta > 0) === d.higherIsGood : d.k === "money" ? d.delta > 0 : d.k === "workforce" ? null : d.delta > 0;
    const col = !moved ? "var(--muted)" : good == null ? "var(--gold)" : good ? "#2F7A39" : "var(--red)";
    const deltaTxt = !moved ? "no change" : `${d.delta > 0 ? "+" : ""}${fmtDial(d, d.delta)}`;
    return `<div class="hz-dial${moved ? " moved" : ""}"><div class="hz-dial-h"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON[d.k] || ""}</svg><span>${esc(d.label)}</span></div>
      <div class="hz-dial-n">${fmtDial(d, d.after != null ? d.after : d.now)}</div>
      <div class="hz-dial-d" style="color:${col}">${deltaTxt}${moved && d.now != null && d.now !== 0 ? ` <small>from ${fmtDial(d, d.now)}</small>` : ""}</div>
      <div class="hz-dial-note">${esc(d.note || "")}</div></div>`;
  });
  /* the chain as a tree: the lever at the top, a spine down, each effect a branch */
  const W = 1000, rowH = 58, top = 54, spine = 26;
  const rows = R.chain.length, H = top + rows * rowH;
  const t = title.length > 34 ? title.slice(0, 33) + "…" : title;
  let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img">`;
  svg += `<rect x="0" y="0" width="${Math.min(W, t.length * 7.6 + 36)}" height="36" rx="18" fill="var(--purple)"/><text x="18" y="23" style="font:600 13px Inter,sans-serif;fill:#fff">${esc(t)}</text>`;
  svg += `<line x1="${spine}" x2="${spine}" y1="36" y2="${H - rowH / 2}" stroke="var(--hair)" stroke-width="2"/>`;
  R.chain.forEach((c, i) => {
    const y = top + i * rowH + 6, x0 = 60, pw = Math.max(90, c.from.length * 8 + 28), x1 = x0 + pw, x2 = x1 + 22;
    svg += `<line x1="${spine}" x2="${x0}" y1="${y}" y2="${y}" stroke="var(--hair)" stroke-width="2"/><circle cx="${spine}" cy="${y}" r="4" fill="var(--gold)"/>`;
    svg += `<rect x="${x0}" y="${y - 15}" width="${pw}" height="30" rx="15" fill="var(--lilac)"/><text x="${x0 + pw / 2}" y="${y + 4.5}" text-anchor="middle" style="font:600 12px Inter,sans-serif;fill:var(--purple-deep)">${esc(c.from)}</text>`;
    svg += `<line x1="${x1}" x2="${x2 + 6}" y1="${y}" y2="${y}" stroke="var(--grid)" stroke-width="1.4"/><path d="M${x2 + 2} ${y - 4} l6 4 -6 4" fill="none" stroke="var(--grid)" stroke-width="1.4"/>`;
    svg += `<text x="${x2 + 16}" y="${y + 4.5}" style="font:600 13.5px Inter,sans-serif;fill:var(--ink)">${esc(c.to)}</text>`;
    svg += `<text x="${x2 + 16}" y="${y + 21}" style="font:11px Inter,sans-serif;fill:var(--muted)">${esc(c.how)}</text>`;
  });
  svg += "</svg>";
  const moved = R.dials.filter((d) => d.delta != null && Math.abs(d.delta) > (d.dp ? 0.049 : 0.5));
  const NAMES = { pupils: "pupils", places: "places", money: "money", outcomes: "outcomes", inclusion: "inclusion", workforce: "workforce" };
  const WORDS = ["none", "one", "two", "three", "four", "five", "six"];
  const head = moved.length ? `This lever moves ${WORDS[moved.length]} of the six dials: ${moved.map((d) => NAMES[d.k]).join(", ").replace(/, ([^,]+)$/, " and $1")}.` : "This lever moves none of the six dials on its own.";
  return `<section class="pz-block hz-round"><div class="pz-kick"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M31.5 31.5 A 18.5 18.5 0 1 1 68.5 31.5 A 18.5 18.5 0 1 1 68.5 68.5 A 18.5 18.5 0 1 1 31.5 68.5 A 18.5 18.5 0 1 1 31.5 31.5 Z" fill="none" stroke="var(--gold)" stroke-width="7"/></svg><span>In the round</span></div><h2>${head}</h2>
    <div class="hz-dials">${tiles.join("")}</div>
    <p class="pz-note" style="margin:18px 0 6px">How it travels: each arrow is a mechanism, read from the data or set as an assumption in the levers.</p>${svg}
    <details class="pz-how"><summary>How the round is modelled</summary><p>Six dials, measured from today's baseline for the scope: pupils, places, money, outcomes (${esc(R.baseline.measure)}), inclusion (EHC plans in mainstream) and workforce. Income per pupil (£${Math.round(R.baseline.incomePP || 0).toLocaleString("en-GB")}) and the pupil-teacher ratio (${R.baseline.ptr ? R.baseline.ptr.toFixed(1) : "–"}) are the scope's own, pupil-weighted. Where results are moved, it is through either the twins (forecasts), the receiving schools' own results (closures), the association between EHC share and results observed across ${R.baseline.ehc.n.toLocaleString("en-GB")} schools once disadvantage is allowed for (SEND), or an elasticity you set (funding). Every assumption is shown and movable in the levers; the ripple is only as true as they are.</p></details></section>`;
}
