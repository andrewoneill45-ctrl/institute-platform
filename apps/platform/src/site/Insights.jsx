import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wordmark, Kick } from "@asi/design-system";

/* System Insights: the national dashboard, ported from the platform prototype.
   Charts are built as SVG strings from the published-data files in /data. */

const C = { purple: "#6A0CA0", gold: "#C6A035", ink: "#221233", muted: "#6F6580" };

function nstrip(vals, o) {
  const W = 860, H = o.h || 64, pad = 12;
  const lo = o.lo ?? Math.min(...vals), hi = o.hi ?? Math.max(...vals);
  const X = (v) => pad + (Math.min(Math.max(v, lo), hi) - lo) / (hi - lo) * (W - 2 * pad);
  const s = [...vals].sort((a, b) => a - b), med = s[Math.floor(s.length / 2)];
  let d = "";
  vals.forEach((v, i) => {
    const jy = H * 0.24 + ((i * 2654435761) % 977) / 977 * H * 0.52;
    const g = o.gold && o.gold(v);
    d += `<circle cx="${X(v).toFixed(1)}" cy="${jy.toFixed(1)}" r="${g ? 2.6 : 2}" fill="${g ? C.gold : C.purple}" opacity="${g ? 0.9 : 0.28}"/>`;
  });
  if (o.zero != null) d += `<line x1="${X(o.zero)}" y1="4" x2="${X(o.zero)}" y2="${H - 4}" stroke="${C.gold}" stroke-width="2"/>`;
  d += `<line x1="${X(med)}" y1="3" x2="${X(med)}" y2="${H - 3}" stroke="${C.ink}" stroke-width="1.3" stroke-dasharray="4 3"/>`;
  d += `<text x="${X(med) + 6}" y="11" font-size="9.5" fill="${C.muted}">median ${o.fmt(med)}</text>`;
  d += `<text x="${pad}" y="${H - 2}" font-size="9" fill="#B7AFC4">${o.fmt(lo)}</text>`;
  d += `<text x="${W - pad}" y="${H - 2}" text-anchor="end" font-size="9" fill="#B7AFC4">${o.fmt(hi)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${d}</svg>`;
}

function scatter(pts, o) {
  const W = 760, H = o.h || 330, L = 46, R = 14, T = 12, B = 38;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const xmin = o.xmin ?? 0, xmax = o.xmax ?? Math.max(...xs) * 1.02;
  const ymin = o.ymin ?? Math.min(...ys), ymax = o.ymax ?? Math.max(...ys);
  const X = (v) => L + (v - xmin) / (xmax - xmin) * (W - L - R);
  const Y = (v) => T + (1 - (v - ymin) / (ymax - ymin)) * (H - T - B);
  const ax = o.dark ? "rgba(255,255,255,.45)" : "#8d84a0";
  const gl = o.dark ? "rgba(255,255,255,.1)" : "rgba(106,12,160,.09)";
  let s = "";
  for (let i = 0; i <= 4; i++) { const v = ymin + (ymax - ymin) * i / 4;
    s += `<line x1="${L}" y1="${Y(v)}" x2="${W - R}" y2="${Y(v)}" stroke="${gl}"/><text x="${L - 7}" y="${Y(v) + 3.5}" text-anchor="end" font-size="10" fill="${ax}">${Math.round(v)}</text>`; }
  for (let i = 0; i <= 5; i++) { const v = xmin + (xmax - xmin) * i / 5;
    s += `<text x="${X(v)}" y="${H - B + 16}" text-anchor="middle" font-size="10" fill="${ax}">${Math.round(v)}</text>`; }
  for (const p of pts) { const hi = o.hi && o.hi(p);
    s += `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${hi ? 2.4 : 1.7}" fill="${hi ? "#C6A035" : o.dark ? "#B584DE" : "#6A0CA0"}" opacity="${hi ? 0.95 : o.dark ? 0.5 : 0.32}"/>`; }
  if (o.line) { const [a, b] = o.line;
    s += `<line x1="${X(xmin)}" y1="${Y(a + b * xmin)}" x2="${X(xmax)}" y2="${Y(a + b * xmax)}" stroke="${o.dark ? "#E4CE8B" : "#C6A035"}" stroke-width="2.4"/>`; }
  if (o.guides) for (const g of o.guides)
    s += `<line x1="${g.x != null ? X(g.x) : L}" y1="${g.x != null ? T : Y(g.y)}" x2="${g.x != null ? X(g.x) : W - R}" y2="${g.x != null ? H - B : Y(g.y)}" stroke="${o.dark ? "rgba(255,255,255,.3)" : "rgba(106,12,160,.3)"}" stroke-dasharray="4 3"/>`;
  s += `<text x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle" font-size="10.5" fill="${ax}">${o.xlab}</text>`;
  s += `<text x="12" y="${(T + H - B) / 2}" text-anchor="middle" font-size="10.5" fill="${ax}" transform="rotate(-90 12 ${(T + H - B) / 2})">${o.ylab}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">${s}</svg>`;
}

export default function Insights() {
  const [d, setD] = useState(null);
  useEffect(() => {
    Promise.all([
      fetch("/data/index_data.json").then((r) => r.json()),
      fetch("/data/insights.json").then((r) => r.json()),
      fetch("/data/pri_pts.json").then((r) => r.json()),
    ]).then(([DATA, INS, PRI]) => setD({ DATA, INS, PRI }));
  }, []);

  if (!d) return <div className="container" style={{ padding: "80px 32px", color: "var(--muted)" }}>Reading the system…</div>;
  const { DATA, INS, PRI } = d;
  const S = INS.sec, P = INS.pri, Q = INS.quad;
  const html = (s) => ({ __html: s });

  return (
    <>
      <nav className="nav"><div className="container nav-in">
        <Link to="/" style={{ textDecoration: "none" }}><Wordmark size={24} /></Link>
        <span className="spacer" />
        <Link to="/insights">Insights</Link>
        <Link to="/signin" className="btn line" style={{ padding: "9px 20px", fontSize: 12.5 }}>Member sign in</Link>
      </div></nav>

      <div className="container" style={{ padding: "56px 32px 90px" }}>
        <Kick>System insights · published DfE data · 17,465 state schools</Kick>
        <h1 style={{ fontSize: 44, margin: "12px 0 8px" }}>What the whole system is saying</h1>

        <div className="fieldwall">
          <p className="fw-kick">England's state schools, in numbers</p>
          <h2 className="fw-h">Every school in England, <em>on one line.</em></h2>
          <p className="fw-sub">Each dot is one of the country's 3,237 state secondary schools. Read the first line before any other: it is the one that shapes all the rest.</p>

          {[
            { id: "fsm", t: "Disadvantage", s: "share of each school's whole roll eligible for free school meals", hero: true,
              svg: nstrip(DATA.filter((r) => r[20] != null).map((r) => r[20]), { lo: 0, hi: 80, h: 92, fmt: (v) => Math.round(v) + "%", gold: (v) => v > 50 }),
              n: "271", c: <>schools, in gold, where <em>most of the roll</em> is disadvantaged. In one school in ten, it is more than 48 per cent of every class.</> },
            { id: "a8", t: "Attainment 8", s: "where every school's results landed, 2024/25",
              svg: nstrip(DATA.filter((r) => r[14] != null).map((r) => r[14]), { lo: 25, hi: 80, fmt: (v) => v.toFixed(1) }),
              n: "21 pts", c: "separate a top-decile school (58.0) from a bottom-decile one (36.7): two grades per subject, per child" },
            { id: "gap", t: "The gap inside", s: "each school's Attainment 8 gap between disadvantaged pupils and the rest",
              svg: nstrip(DATA.filter((r) => r[15] != null && r[16] != null).map((r) => r[16] - r[15]), { lo: -5, hi: 30, fmt: (v) => v.toFixed(1) + " pts", zero: 0 }),
              n: "12.2 pts", c: "in the median school; in one in ten it exceeds 19. The gap lives inside schools, not just between them" },
            { id: "dot", t: "Since 2019", s: "each school against its own pre-COVID self, in Attainment 8 points",
              svg: nstrip(DATA.filter((r) => r[14] != null && r[25] != null).map((r) => r[14] - r[25]), { lo: -12, hi: 12, fmt: (v) => (v > 0 ? "+" : "") + v.toFixed(1), zero: 0 }),
              n: "55%", c: "of schools remain to the left of the gold line: still behind the school they were before the pandemic" },
            { id: "ehcp", t: "EHC plans", s: "share of each school's roll with a plan, January 2026",
              svg: nstrip(DATA.filter((r) => r[21] != null).map((r) => r[21]), { lo: 0, hi: 12, fmt: (v) => Math.round(v) + "%" }),
              n: "3.4%", c: "at the median, but the long tail is the story: some mainstream schools carry three times that share" },
          ].map((row) => (
            <div className={"nstrip" + (row.hero ? " hero" : "")} key={row.id}>
              <div className="ns-head"><b>{row.t}</b><span>{row.s}</span></div>
              <div className="ns-ch" dangerouslySetInnerHTML={html(row.svg)} />
              <div className="ns-stat"><b>{row.n}</b><span>{row.c}</span></div>
            </div>
          ))}

          <div className="fw-marg">
            <div><b>7,947,429</b><span>children on roll, primary and secondary</span></div>
            <div><b>2,073,645</b><span>eligible for free school meals: 1 in 4</span></div>
            <div><b>484,425</b><span>education, health and care plans</span></div>
            <div><b>152</b><span>local authorities</span></div>
            <div><b>1 of 9</b><span>regions above their pre-COVID results: London alone</span></div>
          </div>
          <p className="fw-src">Distributions: all 3,237 state secondary schools, published DfE data (results 2024/25 revised; rolls and plans January 2026). Dashed line marks the median school. Totals include England's 14,228 state primaries.</p>
        </div>

        <div className="patterns-head"><span className="p-line" /><span className="p-lab">THE PATTERNS BENEATH THE NUMBERS</span><span className="p-line" /></div>

        <div className="ins-hero">
          <h3>The gradient: disadvantage still writes the results</h3>
          <p className="finding">Across every state secondary in England, each additional 10 percentage points of free school meals is associated with {Math.abs(S.b * 10).toFixed(1)} fewer Attainment 8 points. Half a grade per subject, per step of disadvantage.</p>
          <div dangerouslySetInnerHTML={html(scatter(DATA.filter((r) => r[20] != null && r[14] != null).map((r) => [r[20], r[14]]), { dark: true, line: [S.a, S.b], xlab: "Free school meals, whole school (%)", ylab: "Attainment 8", xmax: 80, ymin: 20, ymax: 85 }))} />
          <p className="src">Whole-school FSM against Attainment 8, 2024/25 revised. n={S.n.toLocaleString("en-GB")}, r={S.r}. Gold line: least-squares fit. Association, not causation.</p>
        </div>

        <div className="ins-grid">
          <div className="panel">
            <h3>Formed by eleven</h3>
            <p className="finding">The same gradient is already visible at age eleven ({Math.abs(P.b * 10).toFixed(1)} points of reading, writing and maths per 10 points of FSM), and it steepens through secondary.</p>
            <div dangerouslySetInnerHTML={html(scatter(PRI, { line: [P.a, P.b], h: 300, xlab: "Free school meals, whole school (%)", ylab: "KS2 expected standard, RWM (%)", xmax: 70, ymin: 0, ymax: 100 }))} />
            <p className="src">Sample of 2,200 shown from n={P.n.toLocaleString("en-GB")}, r={P.r}.</p>
          </div>
          <div className="panel">
            <h3>The uneven recovery</h3>
            <p className="finding">Seven years on, only London's median secondary is ahead of its pre-COVID self.</p>
            {INS.reg.map(([name, delta]) => {
              const mx = Math.max(...INS.reg.map((r) => Math.abs(r[1]))) || 1;
              const w = 50 * Math.abs(delta) / mx, pos = delta >= 0;
              return (
                <div className="reg-row" key={name} style={name === "London" ? { fontWeight: 600 } : null}>
                  <span className="nm">{name}</span>
                  <span className="reg-bar"><span className="zero" /><span className="fl" style={{ [pos ? "left" : "right"]: "50%", width: w + "%", background: pos ? "#6A0CA0" : "#B03050", borderRadius: pos ? "0 6px 6px 0" : "6px 0 0 6px" }} /></span>
                  <span className="dv" style={{ color: pos ? "#6A0CA0" : "#B03050" }}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}</span>
                </div>
              );
            })}
            <p className="src">Median change in Attainment 8, 2018/19 to 2024/25, n=2,727 matched schools.</p>
          </div>
          <div className="panel wide">
            <h3>The trade the system still makes</h3>
            <p className="finding">Plot every secondary's Inclusion Index against its Performance Index and the system's bargain is visible: the association is negative (r = {Q.r}). But {Q.hh} schools sit in the gold corner, high on both, and they, not the gradient, are the finding.</p>
            <div dangerouslySetInnerHTML={html(scatter(DATA.filter((r) => r[26] != null && r[27] != null).map((r) => [r[26], r[27]]), { h: 380, xlab: "Inclusion Index (vs England)", ylab: "Performance Index (vs England)", xmin: 0, xmax: 100, ymin: 0, ymax: 100, guides: [{ x: 60 }, { y: 60 }], hi: (p) => p[0] >= 60 && p[1] >= 60 }))} />
            <p className="src">Each point is one school scored against all of England on the published weights. n={Q.n.toLocaleString("en-GB")}. Gold points: both 60 or above.</p>
          </div>
        </div>
      </div>
    </>
  );
}
