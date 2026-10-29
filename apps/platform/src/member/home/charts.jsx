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
export function Rose({ data, size = 300 }) {
  const on = useArrived();
  if (!data || data.length < 3) return <p style={{ color: MUTED, fontSize: 12.5 }}>Not enough published measures yet to draw the rose.</p>;
  const cx = size / 2, cy = size / 2, R = size / 2 - 62;
  const n = data.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const poly = data.map((d, i) => pt(i, (R * (on ? d.v : 0)) / 100).join(",")).join(" ");
  const mid = data.reduce((a, d) => a + d.v, 0) / n;
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: 360, height: "auto", overflow: "visible" }} role="img" aria-label="Standing in England by measure">
        <defs>
          <radialGradient id="hmRose" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={GOLD} stopOpacity=".55" />
            <stop offset="100%" stopColor={PURPLE} stopOpacity=".35" />
          </radialGradient>
        </defs>
        {[25, 50, 75, 100].map((g) => (
          <polygon key={g} points={data.map((_, i) => pt(i, (R * g) / 100).join(",")).join(" ")} fill={g === 50 ? "rgba(106,12,160,.03)" : "none"} stroke={g === 50 ? "rgba(34,18,51,.28)" : "rgba(34,18,51,.1)"} strokeWidth={g === 50 ? 1.2 : 1} strokeDasharray={g === 50 ? "4 3" : undefined} />
        ))}
        {data.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(34,18,51,.1)" strokeWidth="1" />; })}
        <polygon points={poly} fill="url(#hmRose)" stroke={PURPLE} strokeWidth="2.2" strokeLinejoin="round" style={{ transition: RM ? "none" : "all 1400ms cubic-bezier(.22,.9,.28,1)" }} />
        {data.map((d, i) => {
          const [x, y] = pt(i, (R * (on ? d.v : 0)) / 100);
          return <circle key={d.k} cx={x} cy={y} r="4.2" fill={d.v >= 50 ? PURPLE : RED} stroke="#fff" strokeWidth="1.6" style={{ transition: RM ? "none" : "all 1400ms cubic-bezier(.22,.9,.28,1)" }}><title>{d.label}: ahead of {d.v}% of England</title></circle>;
        })}
        {data.map((d, i) => {
          const [x, y] = pt(i, R + 20);
          const c = Math.cos(ang(i));
          const anchor = Math.abs(c) < 0.2 ? "middle" : c > 0 ? "start" : "end";
          return (
            <text key={d.k} x={x} y={y} textAnchor={anchor} style={{ fontSize: 10.5, fill: INK, fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}>
              {d.label}
              <tspan x={x} dy="12" style={{ fontSize: 10, fontWeight: 700, fill: d.v >= 50 ? PURPLE : RED }}>{d.v}%</tspan>
            </text>
          );
        })}
        <text x={cx} y={cy + 4} textAnchor="middle" style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, fill: INK }}>{Math.round(mid)}%</text>
        <text x={cx} y={cy + 18} textAnchor="middle" style={{ fontSize: 9.5, fill: MUTED, letterSpacing: ".08em", fontWeight: 700 }}>ON AVERAGE</text>
      </svg>
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
