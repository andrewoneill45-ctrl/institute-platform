/* Member home — the first room after sign-in. Greets the school by name,
   reads its own numbers from the Institute dataset, and opens the three instruments. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { Rise, ensureMotionCss } from "../lib/motion.jsx";
import { getDataset } from "../lib/dataset.js";

const Q = "M31.5 31.5 A 18.5 18.5 0 1 1 68.5 31.5 A 18.5 18.5 0 1 1 68.5 68.5 A 18.5 18.5 0 1 1 31.5 68.5 A 18.5 18.5 0 1 1 31.5 31.5 Z";
const fmt = (v, d = 1) => (v == null ? "–" : Number(v).toFixed(d));

const shadow = "0 1px 2px rgba(34,18,51,.04), 0 18px 50px rgba(34,18,51,.09)";
const card = { background: "#fff", borderRadius: 20, boxShadow: shadow, padding: "24px 26px" };

const INSTRUMENTS = [
  { to: "atlas", verb: "See", name: "Atlas", accent: "#3E5F8A", desc: "Every school in England on one map: search it in plain English, compare and profile. And ask Prism a question to get a canvas of living evidence with a briefing PDF at the end.", cta: "Open Atlas" },
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
  useEffect(ensureMotionCss, []);

  useEffect(() => {
    let live = true;
    getDataset().then(({ raw: all }) => {
      if (!live) return;
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
        setNat({ attainment8: med("attainment8"), abs: med("abs_overall_pct"), ret: med("turn_retained_pct"), dest: med("dest_sustained") });
      }
    }).catch(() => live && setMe(null));
    return () => { live = false; };
  }, [user?.urn]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const stats = me && [
    ["Attainment 8", fmt(me.attainment8), nat?.attainment8 != null && me.attainment8 != null ? me.attainment8 - nat.attainment8 : null],
    ["Attendance", me.abs_overall_pct != null ? fmt(100 - me.abs_overall_pct) + "%" : "–", nat?.abs != null && me.abs_overall_pct != null ? nat.abs - me.abs_overall_pct : null],
    ["Teacher retention", me.turn_retained_pct != null ? fmt(me.turn_retained_pct) + "%" : "–", nat?.ret != null && me.turn_retained_pct != null ? me.turn_retained_pct - nat.ret : null],
    ["Sustained destinations", me.dest_sustained != null ? fmt(me.dest_sustained) + "%" : "–", nat?.dest != null && me.dest_sustained != null ? me.dest_sustained - nat.dest : null],
  ].filter((s) => s[1] !== "–");

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#FBFAF7",
      backgroundImage: "radial-gradient(760px 400px at 50% -70px, rgba(106,12,160,.07), transparent 70%)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "6.5vh 28px 70px" }}>

        <Rise>
          <p style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#C6A035", fontWeight: 700, margin: "0 0 10px" }}>The Fellowship</p>
          <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(26px,3.6vw,38px)", letterSpacing: "-.015em", color: "#221233", margin: 0, lineHeight: 1.15 }}>
            {greet}, {user?.school || "colleague"}.
          </h1>
        </Rise>
        <Rise delay={200}>
          <p style={{ color: "#6F6580", fontSize: 15, maxWidth: 560, margin: "12px 0 0", lineHeight: 1.55 }}>
            {me === undefined ? "Reading your school from the Institute dataset…"
              : me ? <>Your numbers below are read live from the same dataset every instrument shares{me.la ? <>, alongside every school in {me.la}</> : null}: joined, not judged.</>
              : "Your school's published data joins the dataset as the DfE releases it; the instruments are ready in the meantime."}
          </p>
        </Rise>

        {me && stats?.length > 0 && (
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
