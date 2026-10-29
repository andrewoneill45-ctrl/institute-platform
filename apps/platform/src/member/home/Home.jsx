/* Member home: the first room after sign-in, and the one that knows who is
   standing in it. A head sees their school through time and against England
   and its twins; a trust, an authority or a diocese sees its estate; a system
   leader sees England. Every figure is computed from the dataset the rooms
   share; the page arranges it and opens the doors. */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import { Rise, Thinking, ensureMotionCss } from "../../lib/motion.jsx";
import { getDataset, getPlaces, getIntake } from "../../lib/dataset.js";
import { listReports } from "../prizm/reports.js";
import { KIT, PZ_CSS, attachTipCard } from "../prizm/render.js";
import { RoomIcon, roomsFor } from "../RoomIcons.jsx";
import { schoolView, estateView, systemView } from "./compute.js";
import { RC_AREAS, RC_GRADES } from "../prizm/engine.js";
import { Rose, Gap, Bar } from "./charts.jsx";
import { INSTRUMENTS, Emblem } from "./tools.jsx";

const { dualTrendSvg, divergeSvg, columnsSvg } = KIT;
const INK = "#221233", MUTED = "#6F6580", PURPLE = "#6A0CA0", DEEP = "#4B0875", GOLD = "#C6A035", RED = "#B4475A", HAIR = "rgba(34,18,51,.12)";
const n0 = (v) => (v == null ? "–" : Math.round(v).toLocaleString("en-GB"));
const f1 = (v) => (v == null ? "–" : Number(v).toFixed(1));
const sg = (v, dp = 1) => (v == null ? "" : (v > 0 ? "+" : "") + Number(v).toFixed(dp));
const money = (v) => (v == null ? "–" : (v < 0 ? "−" : "") + "£" + Math.abs(Math.round(v)).toLocaleString("en-GB"));
const prizmLink = (scope, blocks) => `/members/prizm?spec=${encodeURIComponent(JSON.stringify({ scope, blocks }))}`;
const range = (vals, pad, step) => { const v = vals.filter((x) => x != null); if (!v.length) return { min: 0, max: 1 }; const lo = Math.min(...v), hi = Math.max(...v); return { min: Math.max(0, Math.floor((lo - pad) / step) * step), max: Math.ceil((hi + pad) / step) * step }; };

let sendPromise = null;
const getSend = () => (sendPromise = sendPromise || fetch("/data/send.json").then((r) => r.json()).catch(() => { sendPromise = null; return null; }));

/* a chart drawn by Prizm's kit, in a card of its own */
function Chart({ kick, title, note, html, children, delay = 0, wide }) {
  return (
    <section className={"pz-report hm-card asi-rise" + (wide ? " hm-wide" : "")} style={{ "--asi-d": `${delay}ms` }}>
      <div className="hm-wide-t">
        {kick && <div className="hm-kick">{kick}</div>}
        {title && <h3 className="hm-h3">{title}</h3>}
        {note && <p className="hm-note">{note}</p>}
      </div>
      {html ? <div className="hm-svg" dangerouslySetInnerHTML={{ __html: html }} /> : <div />}
      {children}
    </section>
  );
}
function Tile({ label, value, sub, delta, good, delay = 0, bar }) {
  const tone = delta == null ? MUTED : (good === false ? delta < 0 : delta > 0) ? "#2F7A39" : delta === 0 ? MUTED : "#8a6d1c";
  return (
    <div className="hm-tile asi-rise" style={{ "--asi-d": `${delay}ms` }}>
      <div className="hm-tile-n">{value}</div>
      <div className="hm-tile-l">{label}</div>
      {(delta != null || sub) && <div className="hm-tile-d" style={{ color: tone }}>{delta != null ? `${sg(delta, typeof delta === "number" && Math.abs(delta) >= 100 ? 0 : 1)} ` : ""}{sub}</div>}
      {bar && <Bar {...bar} />}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);      // { all, ofsted, places, intake, send }
  const [vault, setVault] = useState([]);
  const [tools, setTools] = useState(false);
  const system = user?.accountType === "system" || user?.accountType === "aepa";
  const estate = ["trust", "la", "diocese"].includes(user?.accountType || "");
  const dual = user?.accountType === "school" && (user.isAdmin || user.systemAccess);
  const [view, setView] = useState("school");
  const mode = system ? "system" : estate ? "estate" : dual && view === "system" ? "system" : "school";

  useEffect(ensureMotionCss, []);
  useEffect(() => attachTipCard(document, (u) => navigate(`/members/prizm?school=${encodeURIComponent(u)}`)), [navigate]);
  useEffect(() => { listReports(user?.urn).then((r) => setVault(r.slice(0, 4))).catch(() => {}); }, [user?.urn]);
  useEffect(() => {
    let live = true;
    Promise.all([getDataset(), getPlaces(), getIntake(), getSend()]).then(([d, places, intake, send]) => {
      if (live) setData({ all: d.raw, ofsted: d.ofsted, places, intake, send });
    }).catch(() => live && setData({ all: [], ofsted: {}, places: null, intake: null, send: null }));
    return () => { live = false; };
  }, []);

  const V = useMemo(() => {
    if (!data || !data.all.length) return null;
    const extras = { places: data.places, intake: data.intake, send: data.send, post16: null, early: null };
    try {
      if (mode === "system") return { kind: "system", v: systemView(data.all, data.ofsted, extras) };
      if (mode === "estate") return { kind: "estate", v: estateView(data.all, data.ofsted, user, extras) };
      const byUrn = user?.urn ? data.all.find((s) => Number(s.urn) === Number(user.urn)) : null;
      const byName = !byUrn && user?.school ? data.all.find((s) => (s.name || "").trim().toLowerCase() === user.school.trim().toLowerCase()) : null;
      const mine = byUrn || byName;
      return { kind: "school", v: mine ? schoolView(data.all, data.ofsted, mine.urn, extras) : null };
    } catch (e) { console.error(e); return { kind: mode, v: null, failed: true }; }
  }, [data, mode, user]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = (user?.fullName || "").trim().split(/\s+/)[0] || null;
  const rooms = roomsFor(user).filter((r) => r.key !== "home");

  return (
    <div className="hm-root">
      <style>{PZ_CSS}{HOME_CSS}</style>
      <div className="hm-in">
        <div className="hm-head">
          <Rise>
            <p className="hm-kicker">{mode === "system" ? "The system" : mode === "estate" ? "Your estate" : "The Fellowship"}</p>
            <h1 className="hm-h1">{greet}, {firstName || user?.school || "colleague"}.</h1>
            <p className="hm-sub">
              {[user?.roleTitle, user?.scopeName].filter(Boolean).join(" · ")}
              <Link to="/members/profile" className="hm-link">your profile</Link>
            </p>
          </Rise>
          <div className="hm-head-r">
            {dual && (
              <div className="hm-seg">
                {[["school", user?.school || "Your school"], ["system", "The system"]].map(([v, label]) => (
                  <button key={v} onClick={() => setView(v)} className={view === v ? "on" : ""}>{label}</button>
                ))}
              </div>
            )}
            <button className="hm-tools-btn" onClick={() => setTools(true)}>
              <RoomIcon room="ask" size={15} /> What do the tools do?
            </button>
          </div>
        </div>

        {/* the rooms, as one quiet strip */}
        <Rise delay={120}>
          <div className="hm-rooms">
            {rooms.map((r) => (
              <Link key={r.key} to={r.to} className="hm-room asi-lift">
                <span className="hm-room-i"><RoomIcon room={r.key} size={17} /></span>
                <span><b>{r.label}</b><small>{SHORT[r.key] || r.verb}</small></span>
              </Link>
            ))}
          </div>
        </Rise>

        {!data && <div className="hm-wait"><Thinking size={22} label="Reading England from the Institute dataset…" /></div>}
        {data && V && V.kind === "school" && (V.v ? <SchoolView V={V.v} user={user} /> : <Empty school />)}
        {data && V && V.kind === "estate" && (V.v ? <EstateView V={V.v} user={user} /> : <Empty estate user={user} />)}
        {data && V && V.kind === "system" && V.v && <SystemView V={V.v} user={user} />}

        {vault.length > 0 && (
          <Rise delay={900}>
            <div className="hm-kick" style={{ marginTop: 34 }}>Your vault</div>
            <div className="hm-vault">
              {vault.map((r) => (
                <Link key={r.id} to={`/members/prizm?vault=${encodeURIComponent(r.id)}`} className="hm-vault-c asi-lift">
                  <b>{r.title}</b>
                  <small>Kept {r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""} · recomputes on opening</small>
                </Link>
              ))}
            </div>
          </Rise>
        )}

        <div className="hm-foot asi-fade" style={{ "--asi-d": "1600ms" }}>
          <svg viewBox="0 0 100 100" width="16" height="16"><path d="M31.5 31.5 A 18.5 18.5 0 1 1 68.5 31.5 A 18.5 18.5 0 1 1 68.5 68.5 A 18.5 18.5 0 1 1 31.5 68.5 A 18.5 18.5 0 1 1 31.5 31.5 Z" fill="none" stroke={PURPLE} strokeWidth="8" /></svg>
          The covenant holds in every room: your data is never published, never ranked, never shared.
        </div>
      </div>

      {tools && <ToolsModal user={user} onClose={() => setTools(false)} />}
    </div>
  );
}

function Empty({ school, estate, user }) {
  return (
    <div className="hm-card asi-rise" style={{ marginTop: 26 }}>
      <div className="hm-kick">{school ? "Your school" : "Your estate"}</div>
      <p className="hm-note" style={{ fontSize: 14, maxWidth: 620 }}>
        {school ? "Your school's published data joins the dataset as the DfE releases it; the rooms are ready in the meantime."
          : `No schools in the dataset match ${user?.orgName ? `"${user.orgName}"` : "this account's organisation"} yet. The name must be spelt as the DfE styles it; an administrator can set it in Accounts.`}
      </p>
    </div>
  );
}

/* ── one school ─────────────────────────────────────────────────────── */
function SchoolView({ V, user }) {
  const { s, pri, results, rolls, demand, gap, fin, wf, abs, rc, rose, twins, dest, natDest } = V;
  const main = pri ? { v: s.ks2_rwm_exp, nat: V.N.rwm[1], label: "At the expected standard", unit: "%", dp: 0 } : { v: s.attainment8, nat: V.N.a8[2], label: "Attainment 8", unit: "", dp: 1 };
  const tw = twins && twins.outs && twins.outs[0];
  const rg = results.have >= 2 ? range([...results.mine, ...results.nat], pri ? 6 : 4, pri ? 5 : 5) : null;
  const resultsHtml = rg ? dualTrendSvg(results.points, { ...rg, dp: results.dp, unit: results.unit, a: "This school", b: "England" }) : "";
  const rollsHtml = rolls ? dualTrendSvg(rolls.points, { ...range(rolls.points.flatMap((p) => [p.v, p.nat]), 20, 50), dp: 0, a: "On roll", b: "Places" }) : "";
  const demandHtml = demand ? dualTrendSvg(demand.points, { ...range(demand.points.flatMap((p) => [p.v, p.nat]), 0.15, 0.25), dp: 2, a: "This school", b: "England" }) : "";
  const chips = [
    ["The full picture", `/members/prizm?school=${s.urn}`],
    ["Your statistical twins", `/members/prizm?school=${s.urn}`],
    [`Every school in ${s.la}`, prizmLink({ type: "la", name: s.la, phase: pri ? "primary" : undefined })],
    s.trust ? [`${s.trust}`, prizmLink({ type: "trust", name: s.trust, phase: pri ? "primary" : undefined })] : null,
    user?.isAdmin || user?.horizonAccess ? ["Where it is heading, in Horizon", `/members/horizon?scope=${encodeURIComponent(JSON.stringify({ type: "la", name: s.la, phase: pri ? "primary" : "secondary" }))}`] : null,
  ].filter(Boolean);

  return (
    <>
      <div className="hm-grid hm-grid-top">
        {/* who you are */}
        <section className="hm-card hm-hero asi-rise" style={{ "--asi-d": "240ms" }}>
          <div className="hm-kick">Your school</div>
          <h2 className="hm-h2">{s.name}</h2>
          <p className="hm-note">{[s.la, s.type, s.pupils ? `${n0(s.pupils)} pupils` : null, s.religiousCharacter && !/none|does not apply/i.test(s.religiousCharacter) ? s.religiousCharacter : null].filter(Boolean).join(" · ")}</p>
          <div className="hm-hero-n">
            <div><b>{main.v != null ? Number(main.v).toFixed(main.dp) + main.unit : "–"}</b><small>{main.label}</small>{main.nat != null && main.v != null && <em style={{ color: main.v >= main.nat ? "#2F7A39" : "#8a6d1c" }}>{sg(main.v - main.nat, main.dp)} against England's {Number(main.nat).toFixed(main.dp)}{main.unit}</em>}</div>
            {tw && tw.e != null && <div><b>{Number(tw.e).toFixed(main.dp)}{main.unit}</b><small>what your twenty twins achieve</small><em style={{ color: tw.gap >= 0 ? "#2F7A39" : RED }}>{tw.gap >= 0 ? "beating the odds by " : "behind by "}{Math.abs(tw.gap).toFixed(main.dp)}{twins.rank ? ` · ${twins.rank}${ord(twins.rank)} of ${twins.of}` : ""}</em></div>}
          </div>
          {rc && rc.rc && (
            <div style={{ marginTop: 16 }}>
              <div className="hm-kick" style={{ marginBottom: 6 }}>Report card · {new Date(rc.rc.d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
              <div className="hm-rc">
                {RC_AREAS.filter(([k]) => rc.rc[k] != null).map(([k, label]) => (
                  <span key={k} className="hm-rc-p" data-g={rc.rc[k]} title={RC_GRADES[rc.rc[k] - 1]}><i /> {label}<small>{RC_GRADES[rc.rc[k] - 1]}</small></span>
                ))}
              </div>
            </div>
          )}
          <div className="hm-kick" style={{ marginTop: 18, marginBottom: 6 }}>Who it teaches</div>
          <div className="hm-intake">
            {[["Free school meals", s.fsm_pct, "%"], ["EHC plans", s.sen_ehcp_pct, "%"], ["SEN support", s.sen_support_pct, "%"], ["English as an additional language", s.eal_pct, "%"]].filter((x) => x[1] != null).map(([l, v, u]) => (
              <div key={l}><b>{f1(v)}{u}</b><small>{l}</small></div>
            ))}
          </div>
          <div className="hm-chips">
            {chips.map(([l, to]) => <Link key={l} to={to} className="hm-chip">{l}</Link>)}
          </div>
        </section>

        {/* the rose: where it stands */}
        <section className="hm-card asi-rise" style={{ "--asi-d": "380ms" }}>
          <div className="hm-kick">Where it stands in England</div>
          <h3 className="hm-h3">Nine measures, one shape: each arm is the share of England's {pri ? "primaries" : "secondaries"} this school is ahead of.</h3>
          <div className="hm-rose-wrap"><Rose data={rose} /></div>
          <p className="hm-note" style={{ marginTop: 4 }}>The dashed ring is the middle of England. An arm outside it means the school is ahead of most {pri ? "primaries" : "secondaries"} on that measure; inside it, behind most. Attendance, absence, suspensions and retention are turned the right way up, so further out is always better.</p>
        </section>
      </div>

      <div className="hm-tiles">
        <Tile delay={420} label="Attendance" value={abs.mine != null ? f1(100 - abs.mine) + "%" : "–"} delta={abs.mine != null && abs.nat != null ? abs.nat - abs.mine : null} sub="vs England's median" />
        <Tile delay={480} label="Persistent absence" value={abs.pa != null ? f1(abs.pa) + "%" : "–"} sub={abs.severe != null ? `severe ${f1(abs.severe)}%` : null} />
        <Tile delay={540} label="Teacher retention" value={wf.turnover != null ? f1(100 - wf.turnover) + "%" : "–"} delta={wf.turnover != null && wf.natTurnover != null ? wf.natTurnover - wf.turnover : null} sub="vs England's median" />
        {!pri && <Tile delay={600} label="Sustained destinations" value={dest != null ? f1(dest) + "%" : "–"} delta={dest != null && natDest != null ? dest - natDest : null} sub="vs England's median" />}
        <Tile delay={660} label="Income per pupil" value={fin.income != null ? money(fin.income) : "–"} delta={fin.income != null && fin.natIncome != null ? fin.income - fin.natIncome : null} sub="vs England's median" />
        <Tile delay={720} label="Reserves per pupil" value={fin.reserve != null ? money(fin.reserve) : "–"} sub={fin.reserve != null ? (fin.reserve < 0 ? "in deficit" : fin.staff != null ? `staff ${Math.round(fin.staff)}% of spend` : null) : null} good={true} delta={null} />
      </div>

      <div className="hm-grid hm-grid-rows">
        <Chart delay={700} kick="Results through time" title={results.have >= 2 ? `${results.label}: ${results.points.filter((p) => p.v != null).map((p) => `${Number(p.v).toFixed(results.dp)}${results.unit} in ${p.t}`).join(", ")}.` : "Results arrive as the DfE publishes them."} html={resultsHtml} note={!pri ? "Three published points: 2019, last year and this year's provisional. England is the mean of every state secondary." : "The last two published years; England is the mean of every state primary."} />
        <Chart delay={800} kick="Roll and places" title={rolls ? `${n0(rolls.now.roll)} on roll for ${n0(rolls.now.cap)} places, ${f1(rolls.fill)}% full${rolls.fillLast != null ? `; ${f1(rolls.fillLast)}% by ${rolls.points[rolls.points.length - 1].t.replace("*", "")} on the area's forecast` : ""}.` : "No capacity return for this school yet."} html={rollsHtml} note="Ten years of capacity returns; years marked * follow the DfE's forecast for the planning area, with places held at today's." />
        <Chart delay={900} kick="Demand" title={demand ? `${demand.now.v.toFixed(2)} first preferences for every place this September${demand.now.nat != null ? `, against ${demand.now.nat.toFixed(2)} across England` : ""}.` : "No applications data for this school."} html={demandHtml} note="Families naming the school first, divided by the places it offered, each year since 2014/15." />
      </div>

      <div className="hm-grid hm-grid-2">
        <section className="hm-card asi-rise" style={{ "--asi-d": "1000ms" }}>
          <div className="hm-kick">The gap</div>
          <h3 className="hm-h3">{gap.mine != null && gap.other != null ? `Disadvantaged pupils ${gap.unit ? Math.round(gap.mine) + "%" : f1(gap.mine)}, the rest ${gap.unit ? Math.round(gap.other) + "%" : f1(gap.other)}: a gap of ${gap.unit ? Math.round(gap.other - gap.mine) + " points" : f1(gap.other - gap.mine)}${gap.natDis != null && gap.natNon != null ? `, against England's ${gap.unit ? Math.round(gap.natNon - gap.natDis) : f1(gap.natNon - gap.natDis)}` : ""}.` : "The disadvantage gap publishes with the school's results."}</h3>
          <Gap mine={gap.mine} other={gap.other} natDis={gap.natDis} natNon={gap.natNon} unit={gap.unit} dp={gap.dp} />
        </section>
        <section className="hm-card asi-rise" style={{ "--asi-d": "1100ms" }}>
          <div className="hm-kick">Staff and money</div>
          <div className="hm-facts">
            <div><b>{wf.teachers != null ? n0(wf.teachers) : "–"}</b><small>teachers (FTE)</small></div>
            <div><b>{wf.ptr != null ? f1(wf.ptr) : "–"}</b><small>pupils a teacher{wf.ptrPrev != null && wf.ptr != null ? `, ${sg(wf.ptr - wf.ptrPrev)} on last year` : ""}</small></div>
            <div><b>{wf.sick != null ? f1(wf.sick) : "–"}</b><small>sick days a teacher</small></div>
            <div><b>{fin.spend != null ? money(fin.spend) : "–"}</b><small>spend a pupil{fin.income != null && fin.spend != null ? `, ${fin.income >= fin.spend ? "within" : "above"} income by ${money(Math.abs(fin.income - fin.spend))}` : ""}</small></div>
          </div>
        </section>
      </div>
    </>
  );
}
const ord = (n) => (n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th");

/* ── an estate ───────────────────────────────────────────────────────── */
function EstateView({ V, user }) {
  const { n, pupils, sec, pri, a8, rwm, natA8, natRwm, abs, ehcp, deficits, cards, secRows, priRows, rolls, demand, ehc, watch } = V;
  const scope = user.accountType === "la" ? { type: "la", name: user.orgName } : user.accountType === "trust" ? { type: "trust", name: user.orgName } : null;
  const rollsHtml = rolls ? dualTrendSvg(rolls.points, { ...range(rolls.points.flatMap((p) => [p.v, p.nat]), 50, 100), dp: 0, a: "On roll", b: "Places" }) : "";
  const demandHtml = demand ? dualTrendSvg(demand.points, { ...range(demand.points.flatMap((p) => [p.v, p.nat]), 0.15, 0.25), dp: 2, a: "Your schools", b: "England" }) : "";
  const ehcHtml = ehc ? dualTrendSvg(ehc.points, { ...range(ehc.points.map((p) => p.v), 0, 100), dp: 0, a: "EHC plans", b: "" }) : "";
  const cap = (rows) => (rows.length > 30 ? [...rows.slice(0, 15), ...rows.slice(-15)] : rows);
  const chips = [
    scope ? ["The full picture in Prizm", prizmLink(scope)] : null,
    scope ? ["Every school against its twins", prizmLink(scope, ["headlines", "twins"])] : null,
    scope && deficits ? [`${deficits} in deficit`, prizmLink({ ...scope, deficit: true }, ["headlines", "finance"])] : null,
    scope && (user?.isAdmin || user?.horizonAccess) ? ["Where it is heading, in Horizon", `/members/horizon?scope=${encodeURIComponent(JSON.stringify({ ...scope, phase: pri > sec ? "primary" : "secondary" }))}`] : null,
  ].filter(Boolean);
  return (
    <>
      <section className="hm-card hm-hero asi-rise" style={{ "--asi-d": "240ms", marginTop: 26 }}>
        <div className="hm-kick">{user.accountType === "la" ? "Your authority" : user.accountType === "trust" ? "Your trust" : "Your diocese"}</div>
        <h2 className="hm-h2">{user.orgName}</h2>
        <p className="hm-note">{n} schools · {n0(pupils)} pupils{sec ? ` · ${sec} secondar${sec === 1 ? "y" : "ies"}` : ""}{pri ? ` · ${pri} primar${pri === 1 ? "y" : "ies"}` : ""}{cards ? ` · ${cards} report card${cards === 1 ? "" : "s"} so far` : ""}</p>
        <div className="hm-chips">{chips.map(([l, to]) => <Link key={l} to={to} className="hm-chip">{l}</Link>)}</div>
      </section>
      <div className="hm-tiles">
        {sec > 0 && <Tile delay={380} label="Attainment 8, mean" value={f1(a8)} delta={a8 != null && natA8 != null ? a8 - natA8 : null} sub="vs England's median" />}
        {pri > 0 && <Tile delay={440} label="At the expected standard" value={rwm != null ? Math.round(rwm) + "%" : "–"} delta={rwm != null && natRwm != null ? rwm - natRwm : null} sub="vs England's median" />}
        <Tile delay={500} label="Overall absence, median" value={abs != null ? f1(abs) + "%" : "–"} />
        <Tile delay={560} label="Pupils with an EHC plan" value={ehcp != null ? f1(ehcp) + "%" : "–"} />
        <Tile delay={620} label="Schools in deficit" value={String(deficits)} sub={deficits ? `of ${n}` : "none"} />
        {rolls && <Tile delay={680} label="Places filled" value={f1(rolls.fill) + "%"} sub={rolls.fillLast != null ? `${f1(rolls.fillLast)}% by ${rolls.points[rolls.points.length - 1].t.replace("*", "")} on the forecasts` : null} />}
      </div>
      <div className="hm-grid hm-grid-rows">
        <Chart delay={700} kick="Roll and places" title={rolls ? `${n0(rolls.now.roll)} pupils for ${n0(rolls.now.cap)} places today${rolls.last ? `; ${n0(rolls.last.roll)} by ${rolls.points[rolls.points.length - 1].t.replace("*", "")}` : ""}.` : "No capacity returns for this estate."} html={rollsHtml} note="Every school with a capacity return in all ten years, summed; years marked * follow the DfE's planning-area forecasts, with places held at today's." />
        <Chart delay={800} kick="Demand" title={demand ? `First preferences per place ${demand.slope > 0.005 ? "rising" : demand.slope < -0.005 ? "falling" : "flat"} across ${demand.n} ${demand.PRI ? "primaries" : "secondaries"}.` : "No applications data for this estate."} html={demandHtml} note="Families naming a school first, divided by the places offered, each year since 2014/15; years marked * run the five-year trend on." />
        {ehc ? <Chart delay={900} kick="EHC plans" title={`${n0(ehc.now)} plans in the authority, ${n0(ehc.now - ehc.first)} more than ${ehc.years} years ago.`} html={ehcHtml} note="Plans maintained by the authority each January (DfE, 2019 to 2026)." />
          : <Chart delay={900} kick="Inclusion" title={ehcp != null ? `${f1(ehcp)}% of pupils across the estate hold an EHC plan.` : "Inclusion data arrives with the census."} note="Pupil-weighted across every school in the estate, January 2026 census." />}
      </div>
      <div className="hm-grid hm-grid-2">
        {secRows.length > 0 && <Chart delay={1000} kick="Secondaries against England" title={`${secRows.filter((r) => r.v > 0).length} of ${secRows.length} above England's median Attainment 8 of ${f1(natA8)}.`} html={divergeSvg(cap(secRows), { dp: 1, zero: "England's median" })} note={secRows.length > 30 ? "The fifteen furthest above and the fifteen furthest below; every school is in Prizm." : null} />}
        {priRows.length > 0 && <Chart delay={1050} kick="Primaries against England" title={`${priRows.filter((r) => r.v > 0).length} of ${priRows.length} above England's median of ${natRwm}% at the expected standard.`} html={divergeSvg(cap(priRows), { dp: 0, unit: "", zero: "England's median" })} note={priRows.length > 30 ? "The fifteen furthest above and the fifteen furthest below; every school is in Prizm." : null} />}
      </div>
      {watch.length > 0 && (
        <section className="hm-card asi-rise" style={{ "--asi-d": "1150ms", marginTop: 18 }}>
          <div className="hm-kick">Worth a look this morning</div>
          <h3 className="hm-h3">{watch.length} school{watch.length === 1 ? "" : "s"} with something to read: deficits, empty places, absence or results well below England.</h3>
          <div className="hm-watch">
            {watch.slice(0, 12).map((w) => (
              <Link key={w.urn} to={`/members/prizm?school=${w.urn}`} className="hm-watch-r">
                <b>{w.name}</b><span>{w.why.join(" · ")}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ── the system ──────────────────────────────────────────────────────── */
function SystemView({ V, user }) {
  const { n, pupils, a8, a8Prev, rwm, rwmPrev, abs, absP, ehcp, deficits, cards, disS, nonS, rolls, ehc, demand, regionRows } = V;
  const rollsHtml = rolls ? dualTrendSvg(rolls.points, { ...range(rolls.points.flatMap((p) => [p.v, p.nat]), 100000, 250000), dp: 0, a: "On roll", b: "Places" }) : "";
  const ehcHtml = ehc ? dualTrendSvg(ehc.points, { ...range(ehc.points.map((p) => p.v), 0, 100000), dp: 0, a: "EHC plans", b: "" }) : "";
  const demandHtml = demand ? dualTrendSvg(demand.points, { ...range(demand.points.flatMap((p) => [p.v, p.nat]), 3, 5), dp: 1, unit: "%", a: "Secondary", b: "Primary" }) : "";
  const regHtml = regionRows.length ? columnsSvg({ rows: regionRows.map((r) => ({ label: r.label, v: r.v, tipLines: [r.label, `Attainment 8 ${f1(r.v)} across ${r.n} secondaries`, r.dis != null ? `disadvantaged pupils ${f1(r.dis)}` : "", r.rwm != null ? `primaries: ${Math.round(r.rwm)}% at the expected standard` : ""].filter(Boolean) })), min: Math.floor(Math.min(...regionRows.map((r) => r.v)) - 3), max: Math.ceil(Math.max(...regionRows.map((r) => r.v)) + 2), dp: 1, refs: a8 != null ? [{ v: a8, label: "England", color: "var(--nat)" }] : [] }) : "";
  const chips = [
    ["The report cards so far", prizmLink({ type: "england", hasCard: true }, ["headlines", "ofsted", "cohort"])],
    [`${deficits ? n0(deficits) + " schools" : "Schools"} in deficit`, prizmLink({ type: "england", deficit: true }, ["headlines", "finance", "cohort"])],
    ["Where the highest needs learn", prizmLink({ type: "england", minEhcp: 10 }, ["headlines", "inclusion", "scatter"])],
    ["The widest gaps, by authority", prizmLink({ type: "england" }, ["headlines", "league", "gap"])],
    user?.isAdmin || user?.horizonAccess ? ["Where it is heading, in Horizon", "/members/horizon"] : null,
  ].filter(Boolean);
  return (
    <>
      <section className="hm-card hm-hero asi-rise" style={{ "--asi-d": "240ms", marginTop: 26 }}>
        <div className="hm-kick">England today</div>
        <h2 className="hm-h2">{n0(n)} state-funded schools, {n0(pupils)} pupils.</h2>
        <p className="hm-note">Read live from the dataset every room shares: results, attendance, workforce, finance, inclusion, places and demand, with the report cards as they publish.</p>
        <div className="hm-chips">{chips.map(([l, to]) => <Link key={l} to={to} className="hm-chip">{l}</Link>)}</div>
      </section>
      <div className="hm-tiles">
        <Tile delay={380} label="Attainment 8, England" value={f1(a8)} delta={a8 != null && a8Prev != null ? a8 - a8Prev : null} sub="on last year" />
        <Tile delay={440} label="At the expected standard, KS2" value={rwm != null ? Math.round(rwm) + "%" : "–"} delta={rwm != null && rwmPrev != null ? rwm - rwmPrev : null} sub="on last year" />
        <Tile delay={500} label="Disadvantage gap, A8" value={disS != null && nonS != null ? f1(nonS - disS) : "–"} sub={disS != null ? `${f1(disS)} against ${f1(nonS)}` : null} />
        <Tile delay={560} label="Overall absence, median" value={abs != null ? f1(abs) + "%" : "–"} sub={absP != null ? `primaries ${f1(absP)}%` : null} />
        <Tile delay={620} label="Pupils with an EHC plan" value={ehcp != null ? f1(ehcp) + "%" : "–"} />
        <Tile delay={680} label="Schools in deficit" value={n0(deficits)} sub={cards ? `${n0(cards)} report cards so far` : null} />
      </div>
      <div className="hm-grid hm-grid-rows">
        <Chart delay={700} kick="Roll and places" title={rolls ? `${n0(rolls.now.roll)} pupils for ${n0(rolls.now.cap)} places; ${rolls.last ? `${n0(rolls.last.roll)} by ${rolls.points[rolls.points.length - 1].t.replace("*", "")}` : ""} on the authorities' forecasts.` : "No capacity data."} html={rollsHtml} note="Every state mainstream school with a capacity return in all ten years, summed; years marked * follow the planning-area forecasts, with places held at today's." />
        <Chart delay={800} kick="EHC plans" title={ehc ? `${n0(ehc.now)} plans in January 2026, ${Math.round((100 * (ehc.now - ehc.first)) / ehc.first)}% more than in 2019.` : "No SEND series."} html={ehcHtml} note="Plans maintained by every authority each January (DfE, 2019 to 2026)." />
        <Chart delay={900} kick="First choices" title={demand ? `${f1(demand.sec)}% of families got their first choice of secondary this September, ${f1(demand.pri)}% of primary.` : "No applications data."} html={demandHtml} note="First-preference offers as a share of first preferences, summed across every school, since 2014/15." />
      </div>
      <Chart delay={1000} kick="The regions" title="Attainment 8 by region, this year's provisional, against England." html={regHtml} note="Hover a region for its disadvantaged pupils' Attainment 8 and its primaries' expected-standard share." />
    </>
  );
}

/* ── what do the tools do? ───────────────────────────────────────────── */
function ToolsModal({ user, onClose }) {
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const list = INSTRUMENTS.filter((t) => t.to !== "horizon" || user?.isAdmin || user?.horizonAccess);
  return (
    <div className="hm-veil" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="hm-modal" role="dialog" aria-label="What the tools do">
        <div className="hm-modal-h">
          <div><div className="hm-kick">The rooms</div><h2 className="hm-h2" style={{ fontSize: 26 }}>What each tool does.</h2></div>
          <button className="hm-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="hm-modal-g">
          {list.map((t) => (
            <Link key={t.to} to={`/members/${t.to}`} onClick={onClose} className="hm-tool asi-lift">
              <span className="hm-tool-top" style={{ background: `linear-gradient(90deg,${t.accent},${GOLD})` }} />
              <div className="hm-tool-h">
                <div><div className="hm-kick" style={{ marginBottom: 4 }}>{t.verb}</div><div className="hm-tool-n">{t.name}</div></div>
                <Emblem kind={t.to} />
              </div>
              <p>{t.desc}</p>
              <span className="hm-tool-cta">{t.cta} →</span>
            </Link>
          ))}
        </div>
        <p className="hm-note" style={{ marginTop: 14 }}>The flow most members settle into: see it in Atlas, prove it in Prizm, then take the question into Horizon to try the policy. Lens, Orbit and Constellation are the school's own rooms.</p>
      </div>
    </div>
  );
}

const SHORT = { atlas: "The map", prizm: "The report studio", lens: "Inspection room", orbit: "Strategy in motion", constellation: "Every child in view", horizon: "The policy studio" };

const HOME_CSS = `
.hm-root{height:100%;overflow-y:auto;background:#FBFAF7;background-image:radial-gradient(900px 420px at 50% -80px,rgba(106,12,160,.08),transparent 70%),radial-gradient(600px 300px at 100% 10%,rgba(198,160,53,.07),transparent 70%)}
.hm-in{max-width:1180px;margin:0 auto;padding:5.5vh 28px 70px}
.hm-head{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;flex-wrap:wrap}
.hm-head-r{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.hm-kicker{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${GOLD};font-weight:700;margin:0 0 10px}
.hm-h1{font-family:Fraunces,serif;font-weight:600;font-size:clamp(26px,3.4vw,38px);letter-spacing:-.015em;color:${INK};margin:0;line-height:1.12}
.hm-sub{font-size:13.5px;color:${MUTED};margin:8px 0 0;font-weight:500}
.hm-link{margin-left:10px;font-size:12px;color:${DEEP}}
.hm-seg{display:inline-flex;gap:4px;background:#fff;border:1px solid ${HAIR};border-radius:999px;padding:4px;box-shadow:0 1px 2px rgba(34,18,51,.04),0 10px 30px rgba(34,18,51,.07)}
.hm-seg button{font-family:inherit;border:none;border-radius:999px;padding:7px 16px;font-size:12.5px;font-weight:700;cursor:pointer;background:transparent;color:${MUTED}}
.hm-seg button.on{background:${PURPLE};color:#fff}
.hm-tools-btn{display:inline-flex;align-items:center;gap:8px;font-family:inherit;font-size:12.5px;font-weight:700;color:${DEEP};background:#fff;border:1px solid rgba(106,12,160,.28);border-radius:999px;padding:9px 16px;cursor:pointer;box-shadow:0 1px 2px rgba(34,18,51,.04),0 10px 30px rgba(34,18,51,.07)}
.hm-tools-btn:hover{background:rgba(106,12,160,.06)}
.hm-rooms{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-top:22px}
.hm-room{display:flex;align-items:center;gap:9px;min-width:0;background:#fff;border:1px solid ${HAIR};border-radius:14px;padding:9px 12px 9px 10px;text-decoration:none;color:${INK};box-shadow:0 1px 2px rgba(34,18,51,.04),0 8px 24px rgba(34,18,51,.06)}
.hm-room-i{display:inline-flex;flex:none;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;background:rgba(106,12,160,.08);color:${PURPLE}}
.hm-room>span:last-child{min-width:0}
.hm-room b{display:block;font-size:13px;font-weight:700}.hm-room small{display:block;font-size:10.5px;color:${MUTED};margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hm-wait{display:flex;justify-content:center;padding:70px 0;color:${MUTED};font-size:13px}
.hm-card{background:#fff;border-radius:20px;box-shadow:0 1px 2px rgba(34,18,51,.04),0 18px 50px rgba(34,18,51,.09);padding:22px 24px;min-width:0}
.pz-report.hm-card{border:none;padding:22px 24px;box-shadow:0 1px 2px rgba(34,18,51,.04),0 18px 50px rgba(34,18,51,.09);background:#fff;border-radius:20px}
.hm-kick{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:${GOLD};font-weight:700;margin-bottom:8px}
.hm-h2{font-family:Fraunces,serif;font-weight:600;font-size:clamp(22px,2.6vw,30px);letter-spacing:-.015em;color:${INK};margin:0;line-height:1.15;text-wrap:balance}
.hm-h3{font-family:Fraunces,serif;font-weight:500;font-size:17px;line-height:1.3;color:${INK};margin:0 0 8px;text-wrap:balance}
.hm-note{font-size:12.5px;color:${MUTED};line-height:1.55;margin:6px 0 0}
.hm-grid{display:grid;gap:18px;margin-top:18px}
.hm-grid-top{grid-template-columns:1.2fr 1fr;margin-top:26px;align-items:stretch}
.hm-grid-top>.hm-card{display:flex;flex-direction:column}
.hm-grid-top .hm-hero .hm-chips{margin-top:auto;padding-top:22px}
.hm-grid-top .hm-rose-wrap{flex:1;display:flex;flex-direction:column;justify-content:center}
.hm-grid-rows{grid-template-columns:1fr}
.hm-grid-rows .hm-card{display:grid;grid-template-columns:minmax(240px,300px) minmax(0,1fr);gap:10px 34px;align-items:center}
.hm-grid-rows .hm-svg{margin-top:0}
.hm-grid-rows .hm-svg svg{max-width:none!important}
.hm-grid-2{grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch}
.hm-grid-2>.hm-card{display:flex;flex-direction:column}
.hm-grid-2 .hm-facts{flex:1;align-content:center}
.hm-svg{margin-top:10px}.hm-svg svg{display:block;width:100%;height:auto}
.hm-hero-n{display:flex;gap:34px;flex-wrap:wrap;margin-top:18px}
.hm-hero-n b{display:block;font-family:Fraunces,serif;font-weight:600;font-size:40px;letter-spacing:-.02em;color:${INK};line-height:1;font-variant-numeric:tabular-nums}
.hm-hero-n small{display:block;font-size:12px;color:${MUTED};margin-top:6px;font-weight:600}
.hm-hero-n em{display:block;font-style:normal;font-size:11.5px;margin-top:3px;font-weight:600}
.hm-rc{display:flex;flex-wrap:wrap;gap:6px}
.hm-rc-p{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:${INK};background:#FBFAF7;border:1px solid ${HAIR};border-radius:999px;padding:5px 10px 5px 8px}
.hm-rc-p small{color:${MUTED};font-weight:500}
.hm-rc-p i{width:9px;height:9px;border-radius:50%;display:inline-block;background:#8A8296}
.hm-rc-p[data-g="1"] i{background:#6A0CA0}.hm-rc-p[data-g="2"] i{background:#2F7A39}.hm-rc-p[data-g="3"] i{background:#C6A035}.hm-rc-p[data-g="4"] i{background:#D08A2E}.hm-rc-p[data-g="5"] i{background:#B4475A}
.hm-intake{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.hm-intake b{display:block;font-family:Fraunces,serif;font-weight:600;font-size:22px;color:${INK};letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums}
.hm-intake small{display:block;font-size:11px;color:${MUTED};margin-top:4px;line-height:1.3}
.hm-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
.hm-chip{font-size:12px;font-weight:600;color:${INK};background:#FBFAF7;border:1px solid ${HAIR};border-radius:999px;padding:7px 14px;text-decoration:none}
.hm-chip:hover{border-color:rgba(106,12,160,.4);color:${DEEP}}
.hm-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-top:18px}
.hm-tile{background:#fff;border-radius:16px;box-shadow:0 1px 2px rgba(34,18,51,.04),0 12px 34px rgba(34,18,51,.07);padding:16px 18px 14px;min-width:0}
.hm-tile-n{font-family:Fraunces,serif;font-weight:600;font-size:30px;letter-spacing:-.02em;color:${INK};font-variant-numeric:tabular-nums;line-height:1}
.hm-tile-l{font-size:12px;font-weight:700;color:${INK};margin-top:7px}
.hm-tile-d{font-size:11.5px;margin-top:3px;font-variant-numeric:tabular-nums}
.hm-facts{display:grid;grid-template-columns:repeat(2,1fr);gap:14px 18px;margin-top:8px}
.hm-facts b{display:block;font-family:Fraunces,serif;font-weight:600;font-size:26px;color:${INK};letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums}
.hm-facts small{display:block;font-size:11.5px;color:${MUTED};margin-top:5px;line-height:1.4}
.hm-watch{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px;margin-top:12px}
.hm-watch-r{display:block;text-decoration:none;background:#FBFAF7;border:1px solid ${HAIR};border-radius:12px;padding:10px 13px;color:${INK}}
.hm-watch-r:hover{border-color:rgba(106,12,160,.4)}
.hm-watch-r b{display:block;font-size:13px}.hm-watch-r span{display:block;font-size:11.5px;color:${RED};margin-top:3px}
.hm-vault{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:4px}
.hm-vault-c{display:block;text-decoration:none;background:#fff;border-radius:16px;box-shadow:0 1px 2px rgba(34,18,51,.04),0 12px 34px rgba(34,18,51,.07);padding:16px 18px}
.hm-vault-c b{display:block;font-family:Fraunces,serif;font-weight:600;font-size:15.5px;color:${INK};line-height:1.3}.hm-vault-c small{display:block;font-size:11.5px;color:${MUTED};margin-top:6px}
.hm-foot{display:flex;align-items:center;gap:10px;margin-top:40px;color:${MUTED};font-size:12.5px}
.hm-veil{position:fixed;inset:0;z-index:1000;background:rgba(34,18,51,.34);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding:7vh 16px 16px;overflow:auto;animation:hmFade .16s ease-out}
@keyframes hmFade{from{opacity:0}to{opacity:1}}
.hm-modal{background:#FBFAF7;border-radius:22px;max-width:1040px;width:100%;padding:26px 28px 24px;box-shadow:0 30px 90px rgba(34,18,51,.3);animation:hmUp .3s cubic-bezier(.22,.9,.28,1)}
@keyframes hmUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.hm-modal-h{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.hm-x{border:none;background:#fff;border-radius:999px;width:34px;height:34px;font-size:20px;color:${MUTED};cursor:pointer;box-shadow:0 1px 2px rgba(34,18,51,.08)}
.hm-modal-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-top:18px}
.hm-tool{position:relative;overflow:hidden;display:block;text-decoration:none;background:#fff;border-radius:18px;padding:20px 22px;box-shadow:0 1px 2px rgba(34,18,51,.04),0 14px 40px rgba(34,18,51,.08)}
.hm-tool-top{position:absolute;inset:0 0 auto 0;height:3px}
.hm-tool-h{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
.hm-tool-n{font-family:Fraunces,serif;font-weight:600;font-size:21px;color:${INK}}
.hm-tool p{font-size:13px;color:${MUTED};line-height:1.55;margin:0 0 14px}
.hm-tool-cta{font-size:12.5px;font-weight:600;color:${DEEP}}
@media (max-width:980px){.hm-grid-top,.hm-grid-2{grid-template-columns:1fr}.hm-grid-rows .hm-card{grid-template-columns:1fr}.hm-rooms{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:720px){.hm-in{padding:22px 16px 60px}.hm-intake{grid-template-columns:1fr 1fr}.hm-rooms{display:grid;grid-template-columns:1fr 1fr;gap:8px}.hm-room{padding:8px 10px}.hm-room small{display:none}.hm-tiles{grid-template-columns:1fr 1fr}.hm-tile-n{font-size:26px}.hm-card,.pz-report.hm-card{padding:18px 16px;border-radius:16px}.hm-hero-n b{font-size:32px}.hm-facts{grid-template-columns:1fr 1fr}}
`;
