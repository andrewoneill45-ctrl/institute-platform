/* The dashboard's own marks: a rose of standing, a gap between two groups,
   and a small bar. Drawn in React so they can arrive with the page. */
import { useEffect, useState } from "react";

const INK = "#221233", MUTED = "#6F6580", PURPLE = "#6A0CA0", GOLD = "#C6A035", RED = "#B4475A", NAT = "#8A8296";
const RM = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* a mounted flag that flips after first paint, so transitions can run from 0 */
function useArrived() {
  const [on, setOn] = useState(RM);
  useEffect(() => { const t = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true))); return () => cancelAnimationFrame(t); }, []);
  return on;
}

/* The rose: one arm per measure, the radius the share of England the school
   is ahead of. A full rose is a school ahead of everyone on everything. */
export function Rose({ data, size = 420 }) {
  const on = useArrived();
  if (!data || data.length < 3) return <p style={{ color: MUTED, fontSize: 12.5 }}>Not enough published measures yet to draw the rose.</p>;
  const cx = size / 2, cy = size / 2 + 6, R = size / 2 - 92;
  const n = data.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const ring = (g) => data.map((_, i) => pt(i, (R * g) / 100).join(",")).join(" ");
  const poly = data.map((d, i) => pt(i, (R * (on ? d.v : 0)) / 100).join(",")).join(" ");
  const mid = Math.round(data.reduce((a, d) => a + d.v, 0) / n);
  const ahead = data.filter((d) => d.v >= 50).length;
  const T = RM ? "none" : "all 1400ms cubic-bezier(.22,.9,.28,1)";
  return (
    <div style={{ marginTop: 4 }}>
      <svg viewBox={`-26 0 ${size + 52} ${size + 10}`} style={{ width: "100%", maxWidth: 420, height: "auto", display: "block", margin: "0 auto" }} role="img" aria-label="Standing in England by measure">
        <defs>
          <radialGradient id="hmRose" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={GOLD} stopOpacity=".5" />
            <stop offset="100%" stopColor={PURPLE} stopOpacity=".32" />
          </radialGradient>
        </defs>
        {/* the field: faint rings at a quarter, three quarters and the edge; the middle of England dashed and named */}
        {[25, 75, 100].map((g) => <polygon key={g} points={ring(g)} fill={g === 100 ? "rgba(106,12,160,.025)" : "none"} stroke="rgba(34,18,51,.09)" strokeWidth="1" />)}
        {data.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(34,18,51,.08)" strokeWidth="1" />; })}
        <polygon points={ring(50)} fill="none" stroke={INK} strokeWidth="1.3" strokeDasharray="5 4" opacity=".55" />
        {/* the school */}
        <polygon points={poly} fill="url(#hmRose)" stroke={PURPLE} strokeWidth="2.4" strokeLinejoin="round" style={{ transition: T }} />
        {data.map((d, i) => {
          const [x, y] = pt(i, (R * (on ? d.v : 0)) / 100);
          return <circle key={d.k} cx={x} cy={y} r="5" fill={d.v >= 50 ? PURPLE : RED} stroke="#fff" strokeWidth="2" style={{ transition: T }}><title>{d.label}: ahead of {d.v}% of England</title></circle>;
        })}
        {/* the labels: a pill per arm, the figure first, placed clear of the field */}
        {data.map((d, i) => {
          const good = d.v >= 50;
          const w = Math.max(74, d.label.length * 6.1 + 36), h = 34;
          const c = Math.cos(ang(i)), sn = Math.sin(ang(i));
          let [x, y] = pt(i, R + 46);
          /* arms near the vertical would stack their pills: slide them sideways instead */
          if (Math.abs(sn) > 0.8 && Math.abs(c) > 0.05) x += Math.sign(c) * (w / 2 - 6);
          return (
            <g key={d.k} transform={`translate(${x - w / 2},${y - h / 2})`}>
              <rect width={w} height={h} rx="10" fill="#fff" stroke={good ? "rgba(106,12,160,.28)" : "rgba(180,71,90,.32)"} strokeWidth="1" />
              <text x={w / 2} y="14.5" textAnchor="middle" style={{ fontSize: 12.5, fontWeight: 700, fill: good ? PURPLE : RED, fontFamily: "Inter, system-ui, sans-serif" }}>{d.v}%</text>
              <text x={w / 2} y="27" textAnchor="middle" style={{ fontSize: 9.5, fontWeight: 600, fill: INK, fontFamily: "Inter, system-ui, sans-serif", letterSpacing: ".01em" }}>{d.label}</text>
            </g>
          );
        })}
        {/* the middle of England, named once on the ring */}
        {(() => { const k = Math.floor(n / 2); const [x, y] = pt(k, R * 0.5); return <text x={x} y={y + 14} textAnchor="middle" style={{ fontSize: 9.5, fill: MUTED, fontWeight: 700, letterSpacing: ".08em", fontFamily: "Inter, system-ui, sans-serif" }}>MIDDLE OF ENGLAND</text>; })()}
      </svg>
      <div style={{ display: "flex", gap: 18, alignItems: "baseline", justifyContent: "center", flexWrap: "wrap", marginTop: 2 }}>
        <span style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600, color: INK }}>{mid}%<small style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 11, color: MUTED, fontWeight: 600, marginLeft: 6 }}>ahead of, on average</small></span>
        <span style={{ fontSize: 11.5, color: MUTED, fontWeight: 600 }}><i style={{ display: "inline-block", width: 9, height: 9, borderRadius: 5, background: PURPLE, marginRight: 5 }} />ahead of most on {ahead}<i style={{ display: "inline-block", width: 9, height: 9, borderRadius: 5, background: RED, margin: "0 5px 0 12px" }} />behind most on {n - ahead}</span>
      </div>
    </div>
  );
}

/* Two groups on one line, the school's and England's, with the gap drawn */
export function Gap({ mine, other, natDis, natNon, unit = "", dp = 1 }) {
  const on = useArrived();
  if (mine == null || other == null) return null;
  const vals = [mine, other, natDis, natNon].filter((v) => v != null);
  const lo = Math.floor((Math.min(...vals) - 4) / 5) * 5, hi = Math.ceil((Math.max(...vals) + 4) / 5) * 5;
  const W = 520, pl = 16, pr = 16;
  const x = (v) => pl + ((v - lo) / (hi - lo)) * (W - pl - pr);
  const F = (v) => (unit === "%" ? Math.round(v) + "%" : v.toFixed(dp));
  const row = (y, a, b, label, col, bold) => (
    <g style={{ opacity: on ? 1 : 0, transition: RM ? "none" : "opacity 900ms ease 200ms" }}>
      <text x={pl} y={y - 14} style={{ fontSize: 10.5, fill: MUTED, fontWeight: 700, letterSpacing: ".08em" }}>{label.toUpperCase()}</text>
      <line x1={x(a)} x2={x(b)} y1={y} y2={y} stroke={col} strokeWidth={bold ? 6 : 4} strokeLinecap="round" opacity={bold ? 0.9 : 0.5} />
      <circle cx={x(a)} cy={y} r={bold ? 7 : 5.5} fill={RED} stroke="#fff" strokeWidth="1.6" />
      <circle cx={x(b)} cy={y} r={bold ? 7 : 5.5} fill={PURPLE} stroke="#fff" strokeWidth="1.6" />
      <text x={x(a)} y={y + 22} textAnchor="middle" style={{ fontSize: 11.5, fill: RED, fontWeight: 700 }}>{F(a)}</text>
      <text x={x(b)} y={y + 22} textAnchor="middle" style={{ fontSize: 11.5, fill: PURPLE, fontWeight: 700 }}>{F(b)}</text>
      <text x={(x(a) + x(b)) / 2} y={y - 2} textAnchor="middle" style={{ fontSize: 10.5, fill: INK, fontWeight: 700 }}>{unit === "%" ? Math.round(Math.abs(b - a)) + " pts" : Math.abs(b - a).toFixed(dp)}</text>
    </g>
  );
  return (
    <svg viewBox={`0 0 ${W} 132`} style={{ width: "100%", height: "auto", marginTop: 10, overflow: "visible" }} role="img">
      {row(44, mine, other, "This school", GOLD, true)}
      {natDis != null && natNon != null && row(104, natDis, natNon, "England", NAT, false)}
      <g style={{ fontSize: 10, fill: MUTED }}>
        <circle cx={W - 150} cy={126} r="4" fill={RED} /><text x={W - 142} y={129}>disadvantaged</text>
        <circle cx={W - 60} cy={126} r="4" fill={PURPLE} /><text x={W - 52} y={129}>the rest</text>
      </g>
    </svg>
  );
}

export function Bar({ v, max = 100, color = PURPLE }) {
  const on = useArrived();
  return (
    <div style={{ height: 4, borderRadius: 2, background: "rgba(34,18,51,.08)", marginTop: 10, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${on ? Math.max(0, Math.min(100, (100 * v) / max)) : 0}%`, background: color, transition: RM ? "none" : "width 1200ms cubic-bezier(.22,.9,.28,1)" }} />
    </div>
  );
}
