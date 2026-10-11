/* The front page — the editorial cut. Paper and ink, Fraunces at scale,
   one dark moment, and the mandala as the hero: the product speaking for
   the institute. Sections arrive on scroll under the house motion law;
   nothing ever rests invisible without JavaScript. */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SiteNav } from "./SiteShell.jsx";

const INK = "#221233", MUTED = "#6F6580", GOLDK = "#8a6d1c", PAPER = "#FBFAF7";
const EASE = "cubic-bezier(.22,.9,.28,1)";

const CSS = `
.ed { color: ${INK}; background: ${PAPER}; font-family: Inter, sans-serif; }
.ed .wrap { max-width: 1220px; margin: 0 auto; padding: 0 28px; }
.ed .kick { font-size: 11.5px; letter-spacing: .22em; font-weight: 600; color: ${GOLDK}; }
.ed h1, .ed h2 { font-family: Fraunces, serif; font-weight: 600; letter-spacing: -.02em; margin: 0; }
.ed .dim { opacity: .42; }
.ed a.pill-solid { background: ${INK}; color: #fff; border-radius: 999px; padding: 14px 28px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block; }
.ed a.pill-line { border: 1px solid rgba(34,18,51,.22); color: ${INK}; border-radius: 999px; padding: 14px 28px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block; }
.ed a.quiet { color: #4B0875; text-decoration: none; font-weight: 600; }
.ed a.quiet:hover { color: #6A0CA0; }
.ed .tile { position: relative; border: 1px solid rgba(34,18,51,.1); border-radius: 22px; background: #fff;
  box-shadow: 0 2px 6px rgba(34,18,51,.04), 0 22px 60px rgba(34,18,51,.07); padding: 34px 38px; box-sizing: border-box; overflow: hidden; min-height: 290px; }
.ed .chipcard { position: absolute; background: #fff; border: 1px solid rgba(34,18,51,.1); border-radius: 12px; box-shadow: 0 14px 44px rgba(34,18,51,.12); padding: 12px 16px; }
.ed .grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.ed .grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.ed .grid4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
.ed .benttop { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
.ed .acc-row { display: flex; gap: 36px; align-items: baseline; width: 100%; text-align: left;
  background: none; border: none; font-family: inherit; color: inherit; cursor: pointer; padding: 24px 0; }
@media (max-width: 900px) {
  .ed .grid2, .ed .grid4, .ed .benttop { grid-template-columns: 1fr; }
  .ed .grid3 { grid-template-columns: 1fr; }
  .ed .grid3 > div { border-left: none !important; padding-left: 0 !important; padding-right: 0 !important; }
  .ed .chipcard { display: none; }
}
@media (prefers-reduced-motion: no-preference) {
  html.js .ed [data-reveal] { opacity: 0; transform: translateY(28px); transition: opacity 1.1s ${EASE}, transform 1.1s ${EASE}; }
  html.js .ed [data-reveal].in { opacity: 1; transform: none; }
  .ed .framein { animation: edframe 1.3s ${EASE}; }
  @keyframes edframe { from { transform: translateY(26px); } to { transform: none; } }
}
`;

/* ── the hero mandala: Constellation as the front door, cropped at the fold ── */
function HeroMandala() {
  const cx = 590, cy = 312;
  const GA = Math.PI * (3 - Math.sqrt(5));
  let seed = 29;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const dots = [];
  for (let i = 0; i < 118; i++) {
    const ang = -Math.PI / 2 + i * GA, rad = 38 + 56 * Math.sqrt((i + 0.5) / 118), c = rnd();
    dots.push({ x: cx + rad * Math.cos(ang), y: cy + rad * Math.sin(ang), r: 2.5,
      c: c < 0.82 ? "#CBB8DF" : c < 0.93 ? "#6A0CA0" : "#C6A035", o: 0.9, b: (1.1 + i * 0.008).toFixed(2) });
  }
  for (let j = 0; j < 47; j++) {
    const a2 = -Math.PI / 2 + ((j + 0.5) / 47) * Math.PI * 2, r2 = 118 + rnd() * 56, c2 = rnd();
    dots.push({ x: cx + r2 * Math.cos(a2), y: cy + r2 * Math.sin(a2), r: 2.7,
      c: c2 < 0.5 ? "#6A0CA0" : c2 < 0.86 ? "#C6A035" : "#B3261E", o: 0.9, b: (0.6 + j * 0.012).toFixed(2) });
  }
  const serious = [
    { deg: -162, name: "Daniel O.", why: "attendance 81% and falling" },
    { deg: -134, name: "Thanh N.", why: "predicted En 3 · Ma 4" },
    { deg: -107, name: "Grace B.", why: "learning and engagement" },
    { deg: -73, name: "Miguel C.", why: "fell two fifths since Y10" },
    { deg: -46, name: "Aisha K.", why: "predicted behind in 3 subjects" },
    { deg: -18, name: "Sean W.", why: "nothing reaching him yet" },
    { deg: 14 }, { deg: 52 }, { deg: 128 }, { deg: 158 }, { deg: 176 }, { deg: 102 }, { deg: 77 },
  ];
  const labels = [];
  serious.forEach((s, k) => {
    const a3 = (s.deg * Math.PI) / 180, r3 = 214 + rnd() * 18;
    const x = cx + r3 * Math.cos(a3), y = cy + r3 * Math.sin(a3);
    dots.push({ x, y, r: 3.6, c: "#B3261E", o: 0.95, b: (0.15 + k * 0.06).toFixed(2) });
    if (s.name) {
      const right = Math.cos(a3) >= 0, tx = cx + 268 * Math.cos(a3), ty = cy + 268 * Math.sin(a3);
      labels.push({ x1: x + 6 * Math.cos(a3), y1: y + 6 * Math.sin(a3), x2: cx + 252 * Math.cos(a3), y2: cy + 252 * Math.sin(a3),
        tx: tx + (right ? 5 : -5), ty: ty + 3, a: right ? "start" : "end", name: s.name, why: s.why });
    }
  });
  return (
    <svg viewBox="0 0 1180 400" width="100%" role="img" style={{ display: "block" }}
      aria-label="Constellation: a year group as a mandala, on track at the heart, serious children named on the rim">
      <circle cx={cx} cy={cy} r="236" fill="none" stroke="rgba(179,38,30,.3)" />
      <circle cx={cx} cy={cy} r="186" fill="none" stroke="rgba(198,160,53,.45)" />
      <circle cx={cx} cy={cy} r="101" fill="#F4EEFA" opacity=".45" />
      <circle cx={cx} cy={cy} r="101" fill="none" stroke="rgba(106,12,160,.22)" />
      <text x={cx} y="196" textAnchor="middle" fontSize="10.5" fill="#2F7A39">on track · 118</text>
      <text x={cx} y="112" textAnchor="middle" fontSize="10.5" fill="#8a6d1c">some concern · 47</text>
      <text x={cx} y="58" textAnchor="middle" fontSize="10.5" fill="#B3261E">serious · 13, named</text>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r} fill={d.c} opacity={d.o}>
          <animate attributeName="opacity" from="0" to={d.o} begin={d.b + "s"} dur="0.6s" fill="freeze" />
        </circle>
      ))}
      {labels.map((L) => (
        <g key={L.name}>
          <line x1={L.x1.toFixed(1)} y1={L.y1.toFixed(1)} x2={L.x2.toFixed(1)} y2={L.y2.toFixed(1)} stroke="rgba(34,18,51,.25)" strokeWidth="0.8" />
          <text x={L.tx.toFixed(1)} y={L.ty.toFixed(1)} textAnchor={L.a} fontSize="11.5" fontWeight="600" fill={INK}>{L.name}</text>
          <text x={L.tx.toFixed(1)} y={(L.ty + 13).toFixed(1)} textAnchor={L.a} fontSize="9.5" fill={MUTED}>{L.why}</text>
        </g>
      ))}
      <circle cx={cx} cy={cy} r="34" fill="#ffffff" opacity=".88" />
      <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="600" fontSize="17" fill={INK}>Year 11</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="9" fill={MUTED}>178 in view</text>
    </svg>
  );
}

/* England as regional masses, for the dark Atlas moment */
const REGIONS = [
  [5.1, 1.1, 0.9, 10], [3.9, 2.3, 0.85, 9], [5.9, 2.8, 1.05, 13], [4.4, 4.0, 0.8, 9],
  [6.4, 4.1, 1.15, 15], [4.3, 5.3, 0.75, 8], [5.4, 5.2, 0.85, 9], [6.3, 5.9, 1.05, 13],
  [5.0, 6.8, 0.95, 11], [7.3, 6.0, 0.8, 8], [8.2, 7.2, 1.05, 12], [6.1, 8.2, 1.05, 11],
  [7.35, 9.05, 0.7, 17], [8.5, 9.8, 0.75, 8], [6.9, 10.35, 0.85, 9], [5.4, 10.15, 0.95, 9],
  [4.2, 10.8, 0.75, 7], [3.2, 11.4, 0.65, 6], [2.15, 12.2, 0.55, 5],
];
/* ── the centrepiece: one field of light, four instruments ──
   180 dots play all four parts in a 24-second loop: England (Atlas), the iris
   (Lens), the orbits (Orbit), the mandala (Constellation), and home again.
   Pure SMIL, so it runs forever with no script; reduced motion gets the
   mandala, still. */
function InstrumentJourney() {
  const cx = 550, cyc = 258;
  const N = 180;
  let seed = 61;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const GA = Math.PI * (3 - Math.sqrt(5));
  const pt = (r, a) => ({ x: cx + r * Math.cos(a), y: cyc + r * Math.sin(a) });

  /* act one: England */
  const E = [], cE = [];
  REGIONS.forEach((rg) => {
    for (let i = 0; i < rg[3]; i++) {
      const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * rg[2], c = rnd();
      E.push({ x: (rg[0] + rr * Math.cos(a)) * 27 + 405, y: (rg[1] + rr * Math.sin(a) * 0.92) * 27 + 52 });
      cE.push(c < 0.78 ? "#CBB8DF" : c < 0.92 ? "#E3C65B" : "#FBFAF7");
    }
  });
  while (E.length > N) { E.pop(); cE.pop(); }

  /* act two: the iris — three rings, focused */
  const L = [], cL = [];
  [[64, 40, "#FBFAF7"], [126, 60, "#E3C65B"], [188, 80, "#CBB8DF"]].forEach(([r, n, col], ri) => {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2 + ri * 0.35;
      const p = pt(r + (rnd() - 0.5) * 7, a);
      L.push(p); cL.push(col);
    }
  });

  /* act three: the orbits — a core and two tilted ellipses in motion's shape */
  const O = [], cO = [];
  const rot = (-18 * Math.PI) / 180;
  const ell = (rx, ry, a) => ({ x: cx + rx * Math.cos(a) * Math.cos(rot) - ry * Math.sin(a) * Math.sin(rot), y: cyc + rx * Math.cos(a) * Math.sin(rot) + ry * Math.sin(a) * Math.cos(rot) });
  for (let i = 0; i < 20; i++) { const p = pt(6 + 22 * Math.sqrt((i + 0.5) / 20), -Math.PI / 2 + i * GA); O.push(p); cO.push("#FBFAF7"); }
  for (let i = 0; i < 70; i++) { O.push(ell(150, 46, (i / 70) * Math.PI * 2)); cO.push("#CBB8DF"); }
  for (let i = 0; i < 90; i++) { O.push(ell(238, 74, (i / 90) * Math.PI * 2)); cO.push("#E3C65B"); }

  /* act four: the mandala — heart, watch, rim */
  const M = [], cM = [];
  for (let i = 0; i < 70; i++) { M.push(pt(16 + 76 * Math.sqrt((i + 0.5) / 70), -Math.PI / 2 + i * GA)); cM.push("#CBB8DF"); }
  for (let i = 0; i < 70; i++) { M.push(pt(146 + (rnd() - 0.5) * 30, -Math.PI / 2 + ((i + 0.5) / 70) * Math.PI * 2)); cM.push("#E3C65B"); }
  for (let i = 0; i < 40; i++) { M.push(pt(210 + (rnd() - 0.5) * 14, -Math.PI / 2 + ((i + 0.5) / 40) * Math.PI * 2)); cM.push("#E0776F"); }

  const KT = "0;0.16;0.24;0.40;0.48;0.64;0.72;0.88;1";
  const KS = Array(8).fill(".4 0 .2 1").join(";");
  const DUR = "24s";
  const f = (v) => v.toFixed(1);
  const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const seq = (a, b, c, d) => [a, a, b, b, c, c, d, d, a].join(";");

  const phases = [
    { n: "Atlas", t: "every school in England", title: "Every school in England." },
    { n: "Lens", t: "focused on your school", title: "Then your school." },
    { n: "Orbit", t: "a plan in motion", title: "Then the plan." },
    { n: "Constellation", t: "resolved into children", title: "Then every child." },
  ];
  const labOp = (k) => ["1;1;.3;.3;.3;.3;.3;.3;1", ".3;.3;1;1;.3;.3;.3;.3;.3", ".3;.3;.3;.3;1;1;.3;.3;.3", ".3;.3;.3;.3;.3;.3;1;1;.3"][k];
  const titleOp = (k) => ["1;1;0;0;0;0;0;0;1", "0;0;1;1;0;0;0;0;0", "0;0;0;0;1;1;0;0;0", "0;0;0;0;0;0;1;1;0"][k];

  return (
    <svg viewBox="0 0 1100 656" width="100%" style={{ display: "block", maxWidth: 1100, margin: "0 auto" }} role="img"
      aria-label="One field of dots becomes each instrument in turn, the title narrating: every school in England, then your school, then the plan, then every child">
      {phases.map((p, k) => (
        <text key={"t" + p.n} x="550" y="62" textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="600" fontSize="54"
          letterSpacing="-1" fill="#FBFAF7" opacity={reduce ? (k === 3 ? 1 : 0) : 0}>
          {p.title}
          {!reduce && <animate attributeName="opacity" values={titleOp(k)} keyTimes={KT} dur={DUR} repeatCount="indefinite" />}
        </text>
      ))}
      <g transform="translate(0, 96)">
      {Array.from({ length: N }).map((_, i) => {
        const r = (1.9 + (i % 7) * 0.22).toFixed(1);
        if (reduce) return <circle key={i} cx={f(M[i].x)} cy={f(M[i].y)} r={r} fill={cM[i]} opacity="0.85" />;
        return (
          <circle key={i} cx={f(E[i].x)} cy={f(E[i].y)} r={r} fill={cE[i]} opacity="0.85">
            <animate attributeName="cx" values={seq(f(E[i].x), f(L[i].x), f(O[i].x), f(M[i].x))} keyTimes={KT} calcMode="spline" keySplines={KS} dur={DUR} repeatCount="indefinite" />
            <animate attributeName="cy" values={seq(f(E[i].y), f(L[i].y), f(O[i].y), f(M[i].y))} keyTimes={KT} calcMode="spline" keySplines={KS} dur={DUR} repeatCount="indefinite" />
            <animate attributeName="fill" values={seq(cE[i], cL[i], cO[i], cM[i])} keyTimes={KT} dur={DUR} repeatCount="indefinite" />
          </circle>
        );
      })}
      {phases.map((p, k) => {
        const x = 550 + (k - 1.5) * 190;
        return (
          <g key={p.n} opacity={reduce ? (k === 3 ? 1 : 0.3) : undefined}>
            <text x={x} y="528" textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="600" fontSize="16" fill="#E3C65B">
              {p.n}
              {!reduce && <animate attributeName="opacity" values={labOp(k)} keyTimes={KT} dur={DUR} repeatCount="indefinite" />}
            </text>
            <text x={x} y="546" textAnchor="middle" fontSize="10" fill="rgba(251,250,247,.55)">
              {p.t}
              {!reduce && <animate attributeName="opacity" values={labOp(k)} keyTimes={KT} dur={DUR} repeatCount="indefinite" />}
            </text>
          </g>
        );
      })}
      </g>
    </svg>
  );
}

const BELIEFS = [
  { t: "Disadvantage is the central fact of English schooling, and it is not destiny.",
    b: "The schools that prove this every day are the most important schools in the country." },
  { t: "Evidence should be read honestly and said plainly.",
    b: "If the data is uncomfortable, that is the data’s job." },
  { t: "Schools improve schools.",
    b: "The knowledge the system needs already exists inside it; the work is to find it, name it and move it." },
  { t: "Leadership can be built.",
    b: "The disciplines that produce champions in elite sport produce exceptional schools too." },
  { t: "Simplicity wins.",
    b: "A school that does a few things completely will beat a school that does everything partially." },
];

function Quatrefoil({ size = 40, stroke = "#6A0CA0", width = 7 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path d="M31.5 31.5 A 18.5 18.5 0 1 1 68.5 31.5 A 18.5 18.5 0 1 1 68.5 68.5 A 18.5 18.5 0 1 1 31.5 68.5 A 18.5 18.5 0 1 1 31.5 31.5 Z"
        fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const [open, setOpen] = useState(0);
  const [reg, setReg] = useState("idle"); /* idle | sending | done | failed */
  const emailRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add("js");
    const els = document.querySelectorAll(".ed [data-reveal]");
    const ob = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); ob.unobserve(e.target); } }), { threshold: 0.15 });
    els.forEach((el) => ob.observe(el));
    /* the glide down to Register: unhurried, on the house ease */
    const glide = (e) => {
      const a = e.target.closest && e.target.closest('a[href="#register"]');
      if (!a) return;
      const el = document.getElementById("register");
      if (!el) return;
      e.preventDefault();
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const y1 = el.getBoundingClientRect().top + window.scrollY - 24;
      if (reduce) { window.scrollTo(0, y1); return; }
      const y0 = window.scrollY, t0 = performance.now(), D = 1700;
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const step = (now) => {
        const k = Math.min(1, (now - t0) / D);
        window.scrollTo(0, y0 + (y1 - y0) * ease(k));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    document.addEventListener("click", glide);
    return () => { ob.disconnect(); document.removeEventListener("click", glide); };
  }, []);

  async function register(e) {
    e.preventDefault();
    const email = emailRef.current && emailRef.current.value.trim();
    if (!email) return;
    setReg("sending");
    try {
      const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ "form-name": "register-interest", email }).toString() });
      setReg(res.ok ? "done" : "failed");
    } catch { setReg("failed"); }
  }

  const tileKick = { fontSize: 10.5, letterSpacing: ".18em", fontWeight: 600, color: GOLDK };
  const tileName = { fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 34, marginTop: 6 };
  const tileCopy = { fontSize: 13.5, lineHeight: 1.6, color: MUTED, margin: "8px 0 0", maxWidth: 280 };
  const tileLink = { position: "absolute", left: 38, bottom: 28, fontSize: 13 };

  return (
    <div className="ed">
      <style>{CSS}</style>
      <SiteNav />

      {/* ── the hero: the mandala as the front door ── */}
      <header style={{ textAlign: "center", padding: "72px 28px 0", overflow: "hidden" }}>
        <div className="kick" style={{ marginBottom: 22 }}>THE ALL SAINTS INSTITUTE</div>
        <h1 style={{ fontSize: "clamp(44px, 6.4vw, 92px)", lineHeight: 1.02 }}>
          Where England&rsquo;s school<br />leaders <span className="dim">come to think.</span>
        </h1>
        <p style={{ margin: "24px auto 0", maxWidth: 620, fontSize: 17, lineHeight: 1.6, color: MUTED }}>
          A small and serious institute that convenes the system&rsquo;s most consequential leaders, reads the
          national evidence without fear or favour, and publishes what it finds.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 30, flexWrap: "wrap" }}>
          <a className="pill-solid" href="#register">Register interest</a>
          <Link className="pill-line" to="/insights">National insights</Link>
        </div>

        <div className="framein" style={{ position: "relative", margin: "48px auto 0", maxWidth: 1180 }}>
          <div style={{ border: "1px solid rgba(34,18,51,.12)", borderBottom: "none", borderRadius: "14px 14px 0 0", background: "#fff",
            boxShadow: "0 2px 6px rgba(34,18,51,.05), 0 36px 90px rgba(34,18,51,.12)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, height: 38, padding: "0 16px", borderBottom: "1px solid rgba(34,18,51,.08)", background: PAPER }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: "rgba(34,18,51,.14)" }} />
              <span style={{ width: 10, height: 10, borderRadius: 5, background: "rgba(34,18,51,.14)" }} />
              <span style={{ width: 10, height: 10, borderRadius: 5, background: "rgba(34,18,51,.14)" }} />
              <span style={{ margin: "0 auto", fontSize: 11.5, color: MUTED, background: "#fff", border: "1px solid rgba(34,18,51,.08)", borderRadius: 7, padding: "3px 46px" }}>institute.school/constellation</span>
            </div>
            <HeroMandala />
          </div>
          <div className="chipcard" style={{ top: 58, right: 30, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 9, height: 9, borderRadius: 5, background: "#B3261E" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>No child lost in an average</div>
              <div style={{ fontSize: 11, color: MUTED }}>the 13 who need you most, named on the rim</div>
            </div>
          </div>
          <div className="chipcard" style={{ top: 170, left: 30, textAlign: "left" }}>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 21, lineHeight: 1 }}>178</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>children, built from the data you already hold</div>
            <div style={{ fontSize: 9.5, color: MUTED, marginTop: 5, opacity: 0.75 }}>illustrative data</div>
          </div>
        </div>
      </header>

      {/* ── the only one of its kind ── */}
      <section style={{ padding: "110px 0 0" }}><div className="wrap">
        <div data-reveal>
          <div className="kick" style={{ marginBottom: 20 }}>A DIFFERENT KIND OF INSTITUTE</div>
          <h2 style={{ fontSize: "clamp(38px, 5.2vw, 76px)", lineHeight: 1.05, maxWidth: 1050 }}>
            The think tank that lives <span className="dim">inside a school.</span>
          </h2>
          <p style={{ margin: "28px 0 0", maxWidth: 1050, fontSize: 16.5, lineHeight: 1.65, color: MUTED }}>
            There are think tanks in Westminster that write about schools, and schools too busy to write.
            There is one institute that is both: run from inside an exceptional inner-city school, writing
            for the staffroom and the centre of government alike. No one else does this.
          </p>
        </div>
        <div className="grid3" data-reveal style={{ marginTop: 56, borderTop: "1px solid rgba(34,18,51,.1)" }}>
          <div style={{ padding: "30px 32px 30px 0" }}>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24 }}>Research</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: MUTED, margin: "8px 0 0" }}>Papers and positions published without fear or favour: read in staffrooms, quoted at the centre of government.</p>
          </div>
          <div style={{ padding: "30px 32px", borderLeft: "1px solid rgba(34,18,51,.1)" }}>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24 }}>Seminars</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: MUTED, margin: "8px 0 0" }}>Serving heads, elite sport, Whitehall and the wider system, convened around one table and asked to think.</p>
          </div>
          <div style={{ padding: "30px 0 30px 32px", borderLeft: "1px solid rgba(34,18,51,.1)" }}>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24 }}>Builds</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: MUTED, margin: "8px 0 0" }}>Not slides about the system but working instruments: Atlas, Lens, Orbit and Constellation, made here and used daily.</p>
          </div>
        </div>
        <div data-reveal style={{ marginTop: 54, border: "1px solid rgba(34,18,51,.1)", borderRadius: 16, background: "#fff",
          boxShadow: "0 2px 6px rgba(34,18,51,.04), 0 24px 64px rgba(34,18,51,.08)", padding: "36px 42px", display: "flex", gap: 36 }}>
          <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: "#C6A035", flex: "none" }} />
          <div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 30, letterSpacing: "-.015em", lineHeight: 1.3, maxWidth: 880 }}>
              From thought, <span className="dim">to tool, to improvement.</span>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: MUTED, margin: "12px 0 0", maxWidth: 820 }}>
              What begins here as a paper becomes an instrument: research built into working tools that schools use to improve now, not next year.
            </p>
            <div style={{ fontSize: 12.5, color: MUTED, marginTop: 16, fontStyle: "italic" }}>
              Founded and led by a serving headteacher; formerly adviser to the Secretary of State on the Schools White Paper and national SEND reform.
            </div>
          </div>
        </div>
      </div></section>

      {/* ── the centrepiece: one field of light, four instruments ── */}
      <section id="journey" style={{ marginTop: 110, background: "#1A1030", color: PAPER, padding: "88px 28px 44px", textAlign: "center" }}>
        <div data-reveal>
          <div className="kick" style={{ color: "#E3C65B", marginBottom: 10 }}>SEE &middot; KNOW &middot; ACT &middot; LIVE</div>
        </div>
        <InstrumentJourney />
        <div style={{ marginTop: 14, fontSize: 13.5, fontWeight: 600 }}>
          <a href="#register" style={{ color: "#E3C65B", textDecoration: "none" }}>Register interest &rarr;</a>
        </div>
      </section>

      {/* ── the instruments ── */}
      <section style={{ padding: "110px 0 0" }}><div className="wrap">
        <div data-reveal style={{ textAlign: "center" }}>
          <div className="kick" style={{ marginBottom: 16 }}>THE INSTRUMENTS</div>
          <h2 style={{ fontSize: "clamp(36px, 4.6vw, 64px)" }}>See. Know. Act. <span className="dim">Live.</span></h2>
        </div>
        <div className="grid2" style={{ marginTop: 48 }}>
          <div className="tile" data-reveal>
            <div style={tileKick}>SEE</div>
            <div style={tileName}>Atlas</div>
            <p style={tileCopy}>Every school in England, mapped and open to interrogation.</p>
            <Link className="quiet" style={tileLink} to="/signin">Open Atlas &rarr;</Link>
            <svg viewBox="0 0 100 150" width="160" height="240" aria-hidden="true" style={{ position: "absolute", right: 44, top: 24 }}>
              {(() => { let s = 41; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
                const out = [];
                REGIONS.forEach((rg, ri) => { for (let i = 0; i < Math.ceil(rg[3] * 0.62); i++) {
                  const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * rg[2], c = rnd();
                  out.push(<circle key={ri + "-" + i} cx={((rg[0] + rr * Math.cos(a)) * 9.8 - 8).toFixed(1)} cy={((rg[1] + rr * Math.sin(a) * 0.92) * 10.8 + 2).toFixed(1)}
                    r={(1.7 + rnd() * 1.1).toFixed(1)} fill={c < 0.82 ? "#6A0CA0" : "#3E5F8A"} opacity={(0.5 + rnd() * 0.35).toFixed(2)} />); } });
                return out; })()}
              <circle cx={(7.35 * 9.8 - 8).toFixed(1)} cy={(9.05 * 10.8 + 2).toFixed(1)} r="3.6" fill="#C6A035">
                <animate attributeName="r" values="3;4.4;3" dur="3.4s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <div className="tile" data-reveal style={{ background: "#F4EEFA", border: "1px solid rgba(106,12,160,.14)", boxShadow: "none" }}>
            <div style={tileKick}>KNOW</div>
            <div style={tileName}>Lens</div>
            <p style={tileCopy}>Your own school, examined properly. Private to you.</p>
            <Link className="quiet" style={tileLink} to="/signin">Open Lens &rarr;</Link>
            <svg viewBox="0 0 80 80" width="236" height="236" aria-hidden="true" style={{ position: "absolute", right: -34, top: 28 }}>
              <circle cx="40" cy="40" r="34" fill="none" stroke="#6A0CA0" strokeWidth="1.6" opacity=".85" />
              <g style={{ transformOrigin: "40px 40px", animation: "edspin 30s linear infinite" }}>
                <circle cx="40" cy="40" r="24" fill="none" stroke="#C6A035" strokeWidth="1.4" strokeDasharray="5 6" />
              </g>
              <circle cx="40" cy="40" r="13" fill="none" stroke="#6A0CA0" strokeWidth="1.2" opacity=".5" />
              <circle cx="40" cy="40" r="5.5" fill="#4B0875" />
              <style>{`@keyframes edspin { to { transform: rotate(360deg); } }`}</style>
            </svg>
          </div>
          <div className="tile" data-reveal>
            <div style={tileKick}>ACT</div>
            <div style={tileName}>Orbit</div>
            <p style={tileCopy}>The plan in motion, kept honest as the year turns.</p>
            <Link className="quiet" style={tileLink} to="/signin">Open Orbit &rarr;</Link>
            <svg viewBox="0 0 80 80" width="240" height="240" aria-hidden="true" style={{ position: "absolute", right: -16, top: 22 }}>
              <path d="M 69.5 32.4 A 31 13 -18 0 1 10.5 51.6" fill="none" stroke="rgba(198,160,53,.35)" strokeWidth="1.6" />
              <circle cx="40" cy="42" r="11" fill="#6A0CA0" />
              <path d="M 10.5 51.6 A 31 13 -18 0 1 69.5 32.4" fill="none" stroke="#C6A035" strokeWidth="1.9" />
              <circle r="3" fill="#4B0875">
                <animateMotion dur="10s" repeatCount="indefinite" path="M 10.5 51.6 a 31 13 -18 1 1 59 -19.2 a 31 13 -18 1 1 -59 19.2" />
              </circle>
            </svg>
          </div>
          <div className="tile" data-reveal>
            <div style={tileKick}>LIVE</div>
            <div style={tileName}>Constellation</div>
            <p style={tileCopy}>Every child in view, keyed by UPN, nothing leaving your hands.</p>
            <Link className="quiet" style={tileLink} to="/signin">Open Constellation &rarr;</Link>
            <svg viewBox="0 0 80 80" width="220" height="220" aria-hidden="true" style={{ position: "absolute", right: -6, top: 34 }}>
              <path d="M16 56 L30 42 L46 48 L62 28" stroke="rgba(106,12,160,.28)" strokeWidth="0.8" fill="none" />
              {[[16, 56, 2.4], [30, 42, 2], [46, 48, 2.6], [62, 28, 3], [54, 60, 2], [24, 24, 2.2], [66, 50, 1.7], [38, 16, 1.7]].map(([x, y, r], i) => (
                <circle key={i} cx={x} cy={y} r={r} fill={i === 3 ? "#C6A035" : "#6A0CA0"} opacity={r < 2 ? 0.6 : 1}>
                  {i % 3 === 0 && <animate attributeName="opacity" values="1;.3;1" dur={(4 + i * 0.5) + "s"} repeatCount="indefinite" />}
                </circle>
              ))}
            </svg>
          </div>
        </div>
      </div></section>

      {/* ── five things ── */}
      <section style={{ padding: "110px 0 0" }}><div className="wrap">
        <div data-reveal>
          <div className="kick" style={{ marginBottom: 18 }}>WHAT WE BELIEVE</div>
          <h2 style={{ fontSize: "clamp(34px, 4.2vw, 56px)", marginBottom: 38 }}>Five things we hold <span className="dim">to be true.</span></h2>
        </div>
        <div data-reveal style={{ borderTop: "1px solid rgba(34,18,51,.12)" }}>
          {BELIEFS.map((x, i) => (
            <div key={i} style={{ borderBottom: "1px solid rgba(34,18,51,.12)", opacity: open === i ? 1 : [1, 0.82, 0.68, 0.56, 0.46][Math.min(4, Math.abs(i - (open === i ? i : open)))] || 0.6 }}>
              <button className="acc-row" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 17, color: GOLDK, width: 44, flex: "none" }}>{"0" + (i + 1)}</span>
                <span style={{ flex: 1, fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: open === i ? "clamp(22px, 2.4vw, 33px)" : "clamp(19px, 2vw, 27px)", letterSpacing: "-.015em", lineHeight: 1.25 }}>{x.t}</span>
                <span aria-hidden="true" style={{ fontSize: 22, color: MUTED }}>{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
                <p style={{ margin: "0 0 26px 80px", maxWidth: 680, fontSize: 15, lineHeight: 1.65, color: MUTED }}>{x.b}</p>
              )}
            </div>
          ))}
        </div>
      </div></section>

      {/* ── how it works ── */}
      <section style={{ padding: "110px 0 0" }}><div className="wrap">
        <div data-reveal style={{ textAlign: "center", marginBottom: 44 }}>
          <div className="kick" style={{ marginBottom: 16 }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: "clamp(34px, 4.2vw, 56px)" }}>Powerful tools. <span className="dim">Simple rules.</span></h2>
        </div>
        <div className="benttop" data-reveal>
          <div style={{ position: "relative", borderRadius: 22, background: "#2A0F45", color: PAPER, padding: "36px 40px", overflow: "hidden", minHeight: 178 }}>
            <div style={{ position: "absolute", right: -70, top: -40, opacity: 0.14 }}><Quatrefoil size={300} stroke="#E3C65B" width={5} /></div>
            <div style={{ ...tileKick, color: "#E3C65B" }}>YOUR DATA</div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 32, lineHeight: 1.2, marginTop: 12, maxWidth: 520 }}>
              Your data stays yours. It never leaves your hands.
            </div>
            <div style={{ fontSize: 13, color: "rgba(251,250,247,.68)", marginTop: 12 }}>
              Never published. Never ranked. Never shared. That rule holds everywhere on this platform, for every school, without exception.
            </div>
          </div>
          <div className="tile" style={{ minHeight: 178 }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#6A0CA0" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M8 10.5h8" /></svg>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 23, marginTop: 14 }}>Catholic inspection, built in</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: MUTED, margin: "8px 0 0" }}>Section 48 sits beside Ofsted as an equal, not an afterthought.</p>
          </div>
        </div>
        <div className="grid4" data-reveal style={{ marginTop: 20 }}>
          {[
            { icon: <><path d="M5 4h14v16H5z" /><path d="M9 9h6M9 13h6M9 17h4" /></>, t: "Every number shows its source", b: "Ask where a figure came from and the answer is a named file and a date." },
            { icon: <><path d="M6 3h9l4 4v14H6z" /><path d="M9 14l2.2 2.2L16 11.5" /></>, t: "You approve every file", b: "Uploads are read back to you before anything is saved. Nothing lands without your say so." },
            { icon: <><path d="M12 3L21 19H3z" /><path d="M12 3v16" /></>, t: "Ask in plain English", b: "Put a question to your evidence and get an answer you can take to a meeting.", lilac: true },
            { icon: <path d="M5 20V10M12 20V4M19 20v-8" />, t: "Fair comparisons only", b: "Your school against schools like yours, never a crude national average." },
          ].map((c, i) => (
            <div key={i} className="tile" style={{ minHeight: 200, padding: "28px 30px", ...(c.lilac ? { background: "#F4EEFA", border: "1px solid rgba(106,12,160,.14)", boxShadow: "none" } : {}) }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#6A0CA0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{c.icon}</svg>
              <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 20, marginTop: 13 }}>{c.t}</div>
              <p style={{ fontSize: 12.5, lineHeight: 1.6, color: MUTED, margin: "7px 0 0" }}>{c.b}</p>
            </div>
          ))}
        </div>
      </div></section>

      {/* ── register interest ── */}
      <section id="register" style={{ padding: "130px 28px 110px", textAlign: "center" }}>
        <div data-reveal style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Quatrefoil size={40} /></div>
          <div className="kick" style={{ margin: "26px 0 18px" }}>MEMBERSHIP OPENS SOON</div>
          <h2 style={{ fontSize: "clamp(34px, 4.4vw, 58px)", lineHeight: 1.12 }}>
            The first group of schools <span className="dim">will be small.</span>
          </h2>
          <p style={{ margin: "22px auto 0", maxWidth: 580, fontSize: 15.5, lineHeight: 1.65, color: MUTED }}>
            Register your interest below. A founding group will be invited to join first, chosen for seriousness,
            not size, and they will shape what the Institute becomes.
          </p>
          {reg === "done" ? (
            <div style={{ marginTop: 34, fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, color: "#2F7A39" }}>
              You are on the list. One email when the door opens.
            </div>
          ) : (
            <form onSubmit={register} style={{ display: "flex", gap: 10, margin: "34px auto 0", maxWidth: 520, flexWrap: "wrap", justifyContent: "center" }}>
              <label htmlFor="reg-email" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your school email</label>
              <input id="reg-email" ref={emailRef} type="email" required placeholder="your school email"
                style={{ flex: "1 1 260px", border: "1px solid rgba(34,18,51,.22)", borderRadius: 999, padding: "14px 22px", fontSize: 14, fontFamily: "inherit", background: "#fff", color: INK, boxSizing: "border-box" }} />
              <button type="submit" disabled={reg === "sending"}
                style={{ background: INK, color: "#fff", border: "none", borderRadius: 999, padding: "14px 26px", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", opacity: reg === "sending" ? 0.6 : 1 }}>
                {reg === "sending" ? "One moment…" : "Register interest"}
              </button>
            </form>
          )}
          {reg === "failed" && <div style={{ marginTop: 12, fontSize: 12.5, color: "#B3261E" }}>That did not go through. Try again, or write to hello@institute.school.</div>}
          {reg !== "done" && <div style={{ fontSize: 12, color: MUTED, marginTop: 14 }}>One email when the door opens. Nothing else, no lists, no noise.</div>}
        </div>
      </section>

      {/* ── footer ── */}
      <footer style={{ borderTop: "1px solid rgba(34,18,51,.1)", padding: "26px 28px" }}>
        <div className="wrap" style={{ display: "flex", alignItems: "center", gap: 30, flexWrap: "wrap", padding: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Quatrefoil size={16} width={9} />
            <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 15 }}>inst&#305;tute</span>
          </div>
          <div style={{ display: "flex", gap: 22, fontSize: 12.5, flexWrap: "wrap" }}>
            <Link className="quiet" style={{ color: MUTED, fontWeight: 400 }} to="/insights">Insights</Link>
            <Link className="quiet" style={{ color: MUTED, fontWeight: 400 }} to="/signin">Member sign in</Link>
          </div>
          <span style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: MUTED }}>The All Saints Institute &middot; a trading subsidiary of All Saints Catholic College &middot; &copy; 2026</div>
        </div>
      </footer>
    </div>
  );
}
