/* Member home — the first room after sign-in. Greets the school by name,
   reads its own numbers from the Institute dataset, and opens the three instruments. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

const Q = "M31.5 31.5 A 18.5 18.5 0 1 1 68.5 31.5 A 18.5 18.5 0 1 1 68.5 68.5 A 18.5 18.5 0 1 1 31.5 68.5 A 18.5 18.5 0 1 1 31.5 31.5 Z";
const fmt = (v, d = 1) => (v == null ? "–" : Number(v).toFixed(d));

const shadow = "0 1px 2px rgba(34,18,51,.04), 0 18px 50px rgba(34,18,51,.09)";
const card = { background: "#fff", borderRadius: 20, boxShadow: shadow, padding: "24px 26px" };

const INSTRUMENTS = [
  { to: "atlas", verb: "See", name: "Atlas", desc: "Every school in England on one map: search it in plain English, compare and profile. And ask Prism a question to get a canvas of living evidence with a briefing PDF at the end.", cta: "Open Atlas" },
  { to: "lens", verb: "Know", name: "Lens", desc: "Your inspection room: SEF, evidence vault, Ofsted and Section 48 frameworks, and Ask: a critical friend who knows both schedules and reads your own documents.", cta: "Open Lens" },
  { to: "orbit", verb: "Act", name: "Orbit", desc: "Strategy in motion: vision, objectives and strategies as one living plan, suggested from your Lens priorities and kept honest as the year turns.", cta: "Open Orbit" },
,
  { to: "constellation", verb: "Live", name: "Constellation", desc: "Every child in view: upload years of the data you already hold, keyed by UPN, and watch the whole school resolve into year groups, groups and single pupils, with the children nothing currently reaches flagged first.", cta: "Open Constellation" },
];

export default function Home() {
  const { user } = useAuth();
  const [me, setMe] = useState(undefined); // undefined = loading, null = not found
  const [nat, setNat] = useState(null);

  useEffect(() => {
    let live = true;
    fetch("/data/schools.json").then((r) => r.json()).then((all) => {
      if (!live) return;
      const mine = user?.urn ? all.find((s) => Number(s.urn) === Number(user.urn)) : null;
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

        <p style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#C6A035", fontWeight: 700, margin: "0 0 10px" }}>The Fellowship</p>
        <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(26px,3.6vw,38px)", letterSpacing: "-.015em", color: "#221233", margin: 0, lineHeight: 1.15 }}>
          {greet}, {user?.school || "colleague"}.
        </h1>
        <p style={{ color: "#6F6580", fontSize: 15, maxWidth: 560, margin: "12px 0 0", lineHeight: 1.55 }}>
          {me === undefined ? "Reading your school from the Institute dataset…"
            : me ? <>Your numbers below are read live from the same dataset every instrument shares{me.la ? <>, alongside every school in {me.la}</> : null}: joined, not judged.</>
            : "Your school's published data joins the dataset as the DfE releases it; the instruments are ready in the meantime."}
        </p>

        {me && stats?.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, margin: "28px 0 8px" }}>
            {stats.map(([label, val, delta]) => (
              <div key={label} style={{ ...card, padding: "18px 22px" }}>
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
          {INSTRUMENTS.map((t) => (
            <Link key={t.to} to={t.to} style={{ ...card, textDecoration: "none", display: "block", position: "relative", overflow: "hidden" }}>
              <span style={{ position: "absolute", inset: "0 0 auto 0", height: 3, background: "linear-gradient(90deg,#6A0CA0,#C6A035)" }} />
              <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "#C6A035", fontWeight: 700, marginBottom: 8 }}>{t.verb}</div>
              <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 21, color: "#221233", marginBottom: 8 }}>{t.name}</div>
              <p style={{ fontSize: 13.5, color: "#6F6580", lineHeight: 1.55, margin: "0 0 16px" }}>{t.desc}</p>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#4B0875" }}>{t.cta}</span>
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 40, color: "#6F6580", fontSize: 12.5 }}>
          <svg viewBox="0 0 100 100" width="16" height="16"><path d={Q} fill="none" stroke="#6A0CA0" strokeWidth="8" /></svg>
          The covenant holds in every room: your data is never published, never ranked, never shared.
        </div>
      </div>
    </div>
  );
}
