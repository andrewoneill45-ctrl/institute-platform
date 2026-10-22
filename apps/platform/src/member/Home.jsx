/* Member home — the first room after sign-in. Greets the school by name,
   reads its own numbers from the Institute dataset, and opens the three instruments. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { Rise, ensureMotionCss } from "../lib/motion.jsx";
import { getDataset } from "../lib/dataset.js";
import { listReports } from "./prizm/reports.js";

/* a one-click road into Prizm with a composed scope */
const prizmLink = (scope, blocks) => `/members/prizm?spec=${encodeURIComponent(JSON.stringify({ scope, blocks }))}`;

const Q = "M31.5 31.5 A 18.5 18.5 0 1 1 68.5 31.5 A 18.5 18.5 0 1 1 68.5 68.5 A 18.5 18.5 0 1 1 31.5 68.5 A 18.5 18.5 0 1 1 31.5 31.5 Z";
const fmt = (v, d = 1) => (v == null ? "–" : Number(v).toFixed(d));

const shadow = "0 1px 2px rgba(34,18,51,.04), 0 18px 50px rgba(34,18,51,.09)";
const card = { background: "#fff", borderRadius: 20, boxShadow: shadow, padding: "24px 26px" };

const INSTRUMENTS = [
  { to: "atlas", verb: "See", name: "Atlas", accent: "#3E5F8A", desc: "Every school in England on one map: search it in plain English, compare and profile. And ask Prism a question to get a canvas of living evidence with a briefing PDF at the end.", cta: "Open Atlas" },
  { to: "prizm", verb: "Prove", name: "Prizm", accent: "#B3532A", desc: "The report studio: say what you need to understand about a trust, an authority or any set of schools, and Prizm composes the report before your eyes - every figure computed from the published data, downloadable as one beautiful file.", cta: "Open Prizm" },
  { to: "lens", verb: "Know", name: "Lens", accent: "#6A0CA0", desc: "Your inspection room: SEF, evidence vault, Ofsted and Section 48 frameworks, and Ask: a critical friend who knows both schedules and reads your own documents.", cta: "Open Lens" },
  { to: "orbit", verb: "Act", name: "Orbit", accent: "#C6A035", desc: "Strategy in motion: vision, objectives and strategies as one living plan, suggested from your Lens priorities and kept honest as the year turns.", cta: "Open Orbit" },
  { to: "constellation", verb: "Live", name: "Constellation", accent: "#4B0875", desc: "Every child in view: upload years of the data you already hold, keyed by UPN, and watch the whole school resolve into year groups, groups and single pupils, with the children nothing currently reaches flagged first.", cta: "Open Constellation" },
];

/* each instrument's emblem: a small mark that is quietly alive */
const RM = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function Emblem({ kind }) {
  const P = "#6A0CA0", D = "#4B0875", G = "#C6A035";
  if (kind === "atlas") {
    const dots = [[36,7],[31,11],[40,12],[35,16],[29,20],[38,21],[33,26],[41,28],[28,31],[36,33],[44,34],[31,38],[39,40],[47,42],[53,44],[35,45],[57,49],[43,48],[51,52],[39,52],[47,57],[55,57],[43,61],[35,60],[50,63],[29,64],[23,69],[17,73],[11,76],[39,66]];
    return (
      <svg viewBox="0 0 72 80" width="44" height="49" aria-hidden="true" style={{ display: "block" }}>
        {dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.1" fill={i % 5 === 2 ? "#3E5F8A" : i % 7 === 3 ? "#B3532A" : P} opacity="0.72" />)}
        <circle cx="47" cy="57" r="3.2" fill={G}>
          {!RM && <animate attributeName="r" values="2.6;3.8;2.6" dur="3.2s" repeatCount="indefinite" />}
        </circle>
      </svg>
    );
  }
  if (kind === "lens") return (
    <svg viewBox="0 0 80 80" width="46" height="46" aria-hidden="true" style={{ display: "block" }}>
      <circle cx="40" cy="40" r="29" fill="none" stroke={P} strokeWidth="2.5" opacity=".9" />
      <g style={!RM ? { transformOrigin: "40px 40px", animation: "asiSpin 26s linear infinite" } : undefined}>
        <circle cx="40" cy="40" r="19" fill="none" stroke={G} strokeWidth="2" strokeDasharray="6 7" />
      </g>
      <circle cx="40" cy="40" r="6.5" fill={D} />
    </svg>
  );
  if (kind === "orbit") return (
    <svg viewBox="0 0 80 80" width="46" height="46" aria-hidden="true" style={{ display: "block" }}>
      <ellipse cx="40" cy="40" rx="31" ry="14" fill="none" stroke={G} strokeWidth="2" transform="rotate(-18 40 40)" />
      <circle cx="40" cy="40" r="8" fill={P} />
      {!RM ? (
        <circle r="3.3" fill={D}>
          <animateMotion dur="9s" repeatCount="indefinite" path="M 10.5 49.6 a 31 14 -18 1 1 59 -19.2 a 31 14 -18 1 1 -59 19.2" />
        </circle>
      ) : <circle cx="69.5" cy="30.4" r="3.3" fill={D} />}
    </svg>
  );
  if (kind === "prizm") return (
    <svg viewBox="0 0 80 80" width="46" height="46" aria-hidden="true" style={{ display: "block" }}>
      <line x1="4" y1="40" x2="30" y2="40" stroke="rgba(34,18,51,.45)" strokeWidth="2" />
      <path d="M30 22 L30 58 L52 40 Z" fill="none" stroke={D} strokeWidth="2.4" strokeLinejoin="round" />
      {[["#3E5F8A", 22], ["#6A0CA0", 34], ["#C6A035", 46], ["#B3532A", 58]].map(([c, y], i) => (
        <line key={c} x1="48" y1="40" x2="76" y2={y} stroke={c} strokeWidth="2.2" strokeLinecap="round" opacity=".9">
          {!RM && <animate attributeName="opacity" values=".45;1;.45" dur={(3 + i * 0.7) + "s"} repeatCount="indefinite" />}
        </line>
      ))}
    </svg>
  );
  return (
    <svg viewBox="0 0 80 80" width="46" height="46" aria-hidden="true" style={{ display: "block" }}>
      <path d="M16 54 L30 40 L46 46 L62 26" stroke="rgba(106,12,160,.3)" strokeWidth="1" fill="none" />
      {[[16, 54, 2.6], [30, 40, 2.2], [46, 46, 2.8], [62, 26, 3.2], [54, 58, 2.2], [24, 22, 2.4]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i === 3 ? G : P}>
          {!RM && i % 2 === 0 && <animate attributeName="opacity" values={i === 0 ? "1;.35;1" : ".4;1;.4"} dur={(3.4 + i * 0.6) + "s"} repeatCount="indefinite" />}
        </circle>
      ))}
    </svg>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [me, setMe] = useState(undefined); // undefined = loading, null = not found
  const [nat, setNat] = useState(null);
  const [sys, setSys] = useState(null);
  const [patch, setPatch] = useState(null);
  const [vault, setVault] = useState([]);
  const system = user?.accountType && user.accountType !== "school";
  /* a school account granted the system view (administrators have it implicitly)
     stands in both rooms: a toggle chooses which one this page shows */
  const dual = user?.accountType === "school" && (user.isAdmin || user.systemAccess);
  const [view, setView] = useState("school");
  const showSystem = system || (dual && view === "system");
  useEffect(ensureMotionCss, []);
  useEffect(() => { listReports(user?.urn).then((r) => setVault(r.slice(0, 4))).catch(() => {}); }, [user?.urn]);

  useEffect(() => {
    let live = true;
    getDataset().then(({ raw: all, ofsted }) => {
      if (!live) return;
      if (system || dual) {
        /* the bird's eye: England itself is this account's school */
        const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
        const med = (xs) => { const v = [...xs].sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
        const state = all.filter((s) => !/independent/i.test(s.type || ""));
        const a8 = state.map((s) => s.attainment8).filter((x) => typeof x === "number");
        const rwm = state.map((s) => s.ks2_rwm_exp).filter((x) => typeof x === "number");
        const abs = state.map((s) => s.abs_overall_pct).filter((x) => typeof x === "number");
        /* pupil-weighted EHC plan share, deficits and report cards: today's layers */
        let ehcN = 0, ehcP = 0, deficits = 0;
        for (const s of state) {
          if (typeof s.sen_ehcp_n === "number" && typeof s.pupils === "number" && s.pupils > 0) { ehcN += s.sen_ehcp_n; ehcP += s.pupils; }
          if (typeof s.fin_reserve_pp === "number" && s.fin_reserve_pp < 0) deficits++;
        }
        const cards = ofsted ? Object.values(ofsted).filter((e) => e && e.rc).length : 0;
        setSys({ n: state.length, a8: mean(a8), secN: a8.length, rwm: mean(rwm), priN: rwm.length, abs: med(abs), ehcp: ehcP ? (ehcN / ehcP) * 100 : null, deficits, cards });
        /* the patch: an LA or trust account sees its own estate at a glance */
        const org = (user?.orgName || "").trim().toLowerCase();
        if (org && (user.accountType === "la" || user.accountType === "trust")) {
          const mineAll = state.filter((s) => ((user.accountType === "la" ? s.la : s.trust) || "").trim().toLowerCase() === org);
          if (mineAll.length) {
            const pa8 = mineAll.map((s) => s.attainment8).filter((x) => typeof x === "number");
            const prwm = mineAll.map((s) => s.ks2_rwm_exp).filter((x) => typeof x === "number");
            const pabs = mineAll.map((s) => s.abs_overall_pct).filter((x) => typeof x === "number");
            setPatch({ n: mineAll.length, a8: mean(pa8), rwm: mean(prwm), abs: med(pabs), scope: user.accountType === "la" ? { type: "la", name: user.orgName } : { type: "trust", name: user.orgName } });
          }
        }
        if (system) { setMe(null); return; }
        /* a dual account carries on: its school view needs the school too */
      }
      /* find the school by URN, or by exact name when the account carries no URN */
      const byUrn = user?.urn ? all.find((s) => Number(s.urn) === Number(user.urn)) : null;
      const byName = !byUrn && user?.school ? all.find((s) => (s.name || "").trim().toLowerCase() === user.school.trim().toLowerCase()) : null;
      const mine = byUrn || byName || null;
      setMe(mine || null);
      if (mine) {
        const peers = all.filter((s) => s.phase === mine.phase);
        const med = (f) => {
          const v = peers.map((s) => s[f]).filter((x) => typeof x === "number").sort((a, b) => a - b);
          return v.length ? v[Math.floor(v.length / 2)] : null;
        };
        const turnMed = med("wf_turnover_pct");
        setNat({ attainment8: med("attainment8"), abs: med("abs_overall_pct"), ret: turnMed != null ? 100 - turnMed : null, dest: med("dest_sustained") });
      }
    }).catch(() => live && setMe(null));
    return () => { live = false; };
  }, [user?.urn, system, dual]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = (user?.fullName || "").trim().split(/\s+/)[0] || null;

  const sysStats = sys && [
    ["State-funded schools", sys.n.toLocaleString("en-GB"), null],
    ["Attainment 8, England mean", fmt(sys.a8), null],
    ["KS2 expected standard, mean", sys.rwm != null ? Math.round(sys.rwm) + "%" : "–", null],
    ["Overall absence, median", sys.abs != null ? fmt(sys.abs) + "%" : "–", null],
    ["Pupils with an EHC plan", sys.ehcp != null ? fmt(sys.ehcp) + "%" : "–", null],
    ["Report cards published so far", sys.cards ? sys.cards.toLocaleString("en-GB") : "–", null],
  ].filter((s) => s[1] !== "–");

  /* one-click national questions for the bird's-eye account */
  const sysAsks = showSystem && sys && [
    ["The report cards so far", { type: "england", hasCard: true }, ["headlines", "ofsted", "cohort"]],
    [`${sys.deficits ? sys.deficits.toLocaleString("en-GB") + " schools" : "Schools"} in deficit`, { type: "england", deficit: true }, ["headlines", "finance", "cohort"]],
    ["Where the highest needs learn", { type: "england", minEhcp: 10 }, ["headlines", "inclusion", "scatter"]],
    ["Which authorities hold the widest gaps", { type: "england" }, ["headlines", "league", "gap"]],
  ];

  const stats = showSystem ? sysStats : me && [
    ["Attainment 8", fmt(me.attainment8), nat?.attainment8 != null && me.attainment8 != null ? me.attainment8 - nat.attainment8 : null],
    ["Attendance", me.abs_overall_pct != null ? fmt(100 - me.abs_overall_pct) + "%" : "–", nat?.abs != null && me.abs_overall_pct != null ? nat.abs - me.abs_overall_pct : null],
    ["Teacher retention", me.wf_turnover_pct != null ? fmt(100 - me.wf_turnover_pct) + "%" : "–", nat?.ret != null && me.wf_turnover_pct != null ? (100 - me.wf_turnover_pct) - nat.ret : null],
    ["Sustained destinations", me.dest_sustained != null ? fmt(me.dest_sustained) + "%" : "–", nat?.dest != null && me.dest_sustained != null ? me.dest_sustained - nat.dest : null],
  ].filter((s) => s[1] !== "–");

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#FBFAF7",
      backgroundImage: "radial-gradient(760px 400px at 50% -70px, rgba(106,12,160,.07), transparent 70%)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "6.5vh 28px 70px" }}>

        <Rise>
          <p style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#C6A035", fontWeight: 700, margin: "0 0 10px" }}>The Fellowship</p>
          <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(26px,3.6vw,38px)", letterSpacing: "-.015em", color: "#221233", margin: 0, lineHeight: 1.15 }}>
            {greet}, {firstName || user?.school || "colleague"}.
          </h1>
          {(user?.roleTitle || user?.scopeName) && (
            <p style={{ fontSize: 13.5, color: "#6F6580", margin: "8px 0 0", fontWeight: 500 }}>
              {[user?.roleTitle, user?.scopeName].filter(Boolean).join(" · ")}
              <Link to="/members/profile" style={{ marginLeft: 10, fontSize: 12, color: "#4B0875" }}>your profile</Link>
            </p>
          )}
        </Rise>
        <Rise delay={200}>
          <p style={{ color: "#6F6580", fontSize: 15, maxWidth: 560, margin: "12px 0 0", lineHeight: 1.55 }}>
            {showSystem ? (user?.orgName && (user.accountType === "la" || user.accountType === "trust")
              ? <>England first, {user.orgName} beneath it: both read live this {hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"} from the dataset every instrument shares.</>
              : <>The whole system is your scope: here is England this {hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}, read live from the dataset every instrument shares.</>)
              : me === undefined ? "Reading your school from the Institute dataset…"
              : me ? <>Here is {user?.school ? "your school" : "the picture"} at a glance{me.la ? <>, read live alongside every school in {me.la}</> : null}: joined, not judged.</>
              : "Your school's published data joins the dataset as the DfE releases it; the instruments are ready in the meantime."}
          </p>
        </Rise>

        {dual && (
          <Rise delay={300}>
            <div style={{ display: "inline-flex", gap: 4, marginTop: 18, background: "#fff", border: "1px solid rgba(34,18,51,.12)", borderRadius: 999, padding: 4, boxShadow: shadow }}>
              {[["school", user?.school || "Your school"], ["system", "The system"]].map(([v, label]) => (
                <button key={v} onClick={() => setView(v)}
                  style={{ fontFamily: "inherit", border: "none", borderRadius: 999, padding: "7px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", background: view === v ? "#6A0CA0" : "transparent", color: view === v ? "#fff" : "#6F6580" }}>
                  {label}
                </button>
              ))}
            </div>
          </Rise>
        )}

        {stats && stats.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, margin: "28px 0 8px" }}>
            {stats.map(([label, val, delta], i) => (
              <div key={label} className="asi-rise" style={{ ...card, padding: "18px 22px", "--asi-d": `${340 + i * 150}ms` }}>
                <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 34, letterSpacing: "-.02em", color: "#221233", fontVariantNumeric: "tabular-nums" }}>{val}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#221233", marginTop: 4 }}>{label}</div>
                {delta != null && (
                  <div style={{ fontSize: 11.5, marginTop: 3, color: delta >= 0 ? "#2F7A39" : "#8a6d1c", fontVariantNumeric: "tabular-nums" }}>
                    {delta >= 0 ? "+" : ""}{fmt(delta)} vs national median
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showSystem && patch && (
          <Rise delay={420}>
            <div style={{ ...card, marginTop: 18, display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
              <div style={{ minWidth: 200, flex: 1 }}>
                <div style={{ fontSize: 10.5, letterSpacing: ".13em", textTransform: "uppercase", color: "#C6A035", fontWeight: 700, marginBottom: 6 }}>Your patch</div>
                <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 19, color: "#221233" }}>{user?.orgName}</div>
                <div style={{ fontSize: 12.5, color: "#6F6580", marginTop: 4 }}>
                  {patch.n} school{patch.n === 1 ? "" : "s"}
                  {patch.a8 != null ? ` · A8 ${fmt(patch.a8)}` : ""}{patch.rwm != null ? ` · RWM ${Math.round(patch.rwm)}%` : ""}{patch.abs != null ? ` · absence ${fmt(patch.abs)}%` : ""}
                </div>
              </div>
              <Link to={prizmLink(patch.scope)} style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", background: "#6A0CA0", borderRadius: 999, padding: "10px 18px", textDecoration: "none", whiteSpace: "nowrap" }}>
                The full picture in Prizm
              </Link>
            </div>
          </Rise>
        )}

        {sysAsks && (
          <Rise delay={500}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
              <span style={{ fontSize: 10.5, letterSpacing: ".13em", textTransform: "uppercase", color: "#C6A035", fontWeight: 700, marginRight: 2 }}>Ask Prizm</span>
              {sysAsks.map(([label, scope, blocks]) => (
                <Link key={label} to={prizmLink(scope, blocks)}
                  style={{ fontSize: 12.5, fontWeight: 600, color: "#221233", background: "#fff", border: "1px solid rgba(34,18,51,.14)", borderRadius: 999, padding: "8px 15px", textDecoration: "none" }}>
                  {label}
                </Link>
              ))}
            </div>
          </Rise>
        )}

        {vault.length > 0 && (
          <Rise delay={560}>
            <div style={{ marginTop: 26 }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".13em", textTransform: "uppercase", color: "#C6A035", fontWeight: 700, marginBottom: 10 }}>Your vault</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
                {vault.map((r) => (
                  <Link key={r.id} to={`/members/prizm?vault=${encodeURIComponent(r.id)}`} className="asi-lift"
                    style={{ ...card, padding: "16px 18px", textDecoration: "none", display: "block" }}>
                    <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 15.5, color: "#221233", lineHeight: 1.3 }}>{r.title}</div>
                    <div style={{ fontSize: 11.5, color: "#6F6580", marginTop: 6 }}>
                      Kept {r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""} · recomputes on opening
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Rise>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginTop: 30 }}>
          {INSTRUMENTS.map((t, i) => (
            <Link key={t.to} to={t.to} className="asi-rise asi-lift" style={{ ...card, textDecoration: "none", display: "block", position: "relative", overflow: "hidden", "--asi-d": `${560 + i * 180}ms` }}>
              <span style={{ position: "absolute", inset: "0 0 auto 0", height: 3, background: `linear-gradient(90deg,${t.accent},#C6A035)` }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "#C6A035", fontWeight: 700, marginBottom: 8 }}>{t.verb}</div>
                  <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 21, color: "#221233" }}>{t.name}</div>
                </div>
                <Emblem kind={t.to} />
              </div>
              <p style={{ fontSize: 13.5, color: "#6F6580", lineHeight: 1.55, margin: "0 0 16px" }}>{t.desc}</p>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#4B0875" }}>{t.cta}</span>
            </Link>
          ))}
        </div>

        <div className="asi-fade" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 40, color: "#6F6580", fontSize: 12.5, "--asi-d": "1700ms" }}>
          <svg viewBox="0 0 100 100" width="16" height="16"><path d={Q} fill="none" stroke="#6A0CA0" strokeWidth="8" /></svg>
          The covenant holds in every room: your data is never published, never ranked, never shared.
        </div>
      </div>
    </div>
  );
}
