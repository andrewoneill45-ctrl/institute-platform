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
/* The rose, on its own stage. One arm per measure, the radius the share of
   England the school is ahead of. Hover an arm and the card beside it turns
   to that measure; click to pin it. */
const fmtV = (v, unit, dp) => (v == null ? "–" : unit === "£" ? (v < 0 ? "−" : "") + "£" + Math.abs(Math.round(v)).toLocaleString("en-GB") : Number(v).toFixed(dp) + unit);

export function Rose({ data, size = 560, pri, name }) {
  const on = useArrived();
  const [hover, setHover] = useState(null);
  const [pin, setPin] = useState(null);
  if (!data || data.length < 3) return <p style={{ color: MUTED, fontSize: 12.5 }}>Not enough published measures yet to draw the rose.</p>;
  const cur = data.find((d) => d.k === (hover || pin)) || null;
  const cx = size / 2, cy = size / 2 + 8, R = size / 2 - 112;
  const n = data.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const ring = (g) => data.map((_, i) => pt(i, (R * g) / 100).join(",")).join(" ");
  const poly = data.map((d, i) => pt(i, (R * (on ? d.v : 0)) / 100).join(",")).join(" ");
  const mid = Math.round(data.reduce((a, d) => a + d.v, 0) / n);
  const ahead = data.filter((d) => d.v >= 50).length;
  const T = RM ? "none" : "all 1400ms cubic-bezier(.22,.9,.28,1)";
  const active = cur ? cur.k : null;
  return (
    <div className="hm-stage">
      <div className="hm-stage-rose" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`-30 0 ${size + 60} ${size + 16}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Standing in England by measure">
          <defs>
            <radialGradient id="hmRoseG" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={GOLD} stopOpacity=".55" />
              <stop offset="100%" stopColor={PURPLE} stopOpacity=".3" />
            </radialGradient>
            <filter id="hmGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          {[25, 75, 100].map((g) => <polygon key={g} points={ring(g)} fill={g === 100 ? "rgba(106,12,160,.03)" : "none"} stroke="rgba(34,18,51,.09)" strokeWidth="1" />)}
          {data.map((d, i) => { const [x, y] = pt(i, R); const isA = d.k === active; return <line key={d.k} x1={cx} y1={cy} x2={x} y2={y} stroke={isA ? (d.v >= 50 ? PURPLE : RED) : "rgba(34,18,51,.08)"} strokeWidth={isA ? 2 : 1} style={{ transition: "stroke .25s" }} />; })}
          <polygon points={ring(50)} fill="none" stroke={INK} strokeWidth="1.3" strokeDasharray="5 4" opacity=".55" />
          <polygon points={poly} fill="url(#hmRoseG)" stroke={PURPLE} strokeWidth="2.6" strokeLinejoin="round" style={{ transition: T }} />
          {/* a sector highlight for the active arm */}
          {cur && (() => { const i = data.indexOf(cur); const [x, y] = pt(i, (R * cur.v) / 100); return <circle cx={x} cy={y} r="14" fill={cur.v >= 50 ? PURPLE : RED} opacity=".18" filter="url(#hmGlow)" />; })()}
          {data.map((d, i) => {
            const [x, y] = pt(i, (R * (on ? d.v : 0)) / 100);
            const isA = d.k === active;
            return <circle key={d.k} cx={x} cy={y} r={isA ? 7.5 : 5.5} fill={d.v >= 50 ? PURPLE : RED} stroke="#fff" strokeWidth="2.2" style={{ transition: T, cursor: "pointer" }} onMouseEnter={() => setHover(d.k)} onClick={() => setPin(pin === d.k ? null : d.k)} />;
          })}
          {data.map((d, i) => {
            const good = d.v >= 50, isA = d.k === active;
            const w = Math.max(86, d.label.length * 6.6 + 40), h = 40;
            const c = Math.cos(ang(i)), sn = Math.sin(ang(i));
            let [x, y] = pt(i, R + 58);
            if (Math.abs(sn) > 0.8 && Math.abs(c) > 0.05) x += Math.sign(c) * (w / 2 - 4);
            return (
              <g key={d.k} transform={`translate(${x - w / 2},${y - h / 2})`} style={{ cursor: "pointer" }} onMouseEnter={() => setHover(d.k)} onClick={() => setPin(pin === d.k ? null : d.k)}>
                <rect width={w} height={h} rx="12" fill={isA ? (good ? PURPLE : RED) : "#fff"} stroke={good ? "rgba(106,12,160,.3)" : "rgba(180,71,90,.34)"} strokeWidth="1" style={{ transition: "fill .2s" }} />
                <text x={w / 2} y="17" textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: isA ? "#fff" : good ? PURPLE : RED, fontFamily: "Inter, system-ui, sans-serif", transition: "fill .2s" }}>{d.v}%</text>
                <text x={w / 2} y="31" textAnchor="middle" style={{ fontSize: 10, fontWeight: 600, fill: isA ? "rgba(255,255,255,.9)" : INK, fontFamily: "Inter, system-ui, sans-serif", transition: "fill .2s" }}>{d.label}</text>
                {pin === d.k && <circle cx={w - 6} cy="6" r="4" fill={GOLD} stroke="#fff" strokeWidth="1.5" />}
              </g>
            );
          })}
          {(() => { const kk = Math.floor(n / 2); const [x, y] = pt(kk, R * 0.5); return <text x={x} y={y + 16} textAnchor="middle" style={{ fontSize: 10, fill: MUTED, fontWeight: 700, letterSpacing: ".1em", fontFamily: "Inter, system-ui, sans-serif" }}>MIDDLE OF ENGLAND</text>; })()}
        </svg>
      </div>
      <div className="hm-stage-card" key={cur ? cur.k : "all"}>
        {cur ? <ArmCard d={cur} pri={pri} name={name} pinned={pin === cur.k} onUnpin={() => setPin(null)} /> : (
          <div className="hm-flip">
            <div className="hm-kick">The shape, read whole</div>
            <div className="hm-big">{mid}%<small>ahead of England, on average across {n} measures</small></div>
            <div className="hm-tally"><span><i style={{ background: PURPLE }} />ahead of most {pri ? "primaries" : "secondaries"} on <b>{ahead}</b></span><span><i style={{ background: RED }} />behind most on <b>{n - ahead}</b></span></div>
            <div className="hm-ranklist">
              {[...data].sort((a, b) => b.v - a.v).map((d) => (
                <button key={d.k} onMouseEnter={() => setHover(d.k)} onClick={() => setPin(d.k)} className="hm-rank">
                  <span>{d.label}</span>
                  <i><b style={{ width: `${d.v}%`, background: d.v >= 50 ? PURPLE : RED }} /></i>
                  <em style={{ color: d.v >= 50 ? PURPLE : RED }}>{d.v}%</em>
                </button>
              ))}
            </div>
            <p className="hm-note" style={{ marginTop: 12 }}>Hover an arm, or a row here, to turn this card to that measure; click to keep it. The dashed ring is the middle of England; outside it the school is ahead of most, inside it behind most. Attendance, absence, suspensions and retention are turned the right way up, so further out is always better.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* one measure, told whole: the school's figure, England's, and where it sits */
function ArmCard({ d, pri, name, pinned, onUnpin }) {
  const good = d.v >= 50;
  const lo = Math.min(d.p10 ?? d.mine, d.mine), hi = Math.max(d.p90 ?? d.mine, d.mine);
  const span = hi - lo || 1;
  const xr = (v) => Math.max(0, Math.min(100, ((v - lo) / span) * 100));
  const x = (v) => (d.invert ? 100 - xr(v) : xr(v));
  const better = d.invert ? d.mine < d.med : d.mine > d.med;
  const diff = d.mine != null && d.med != null ? d.mine - d.med : null;
  const word = pri ? "primaries" : "secondaries";
  return (
    <div className="hm-flip" style={{ borderColor: good ? "rgba(106,12,160,.35)" : "rgba(180,71,90,.4)" }}>
      <div className="hm-kick" style={{ display: "flex", justifyContent: "space-between" }}>{d.label}{pinned && <button onClick={onUnpin} className="hm-unpin">pinned · release</button>}</div>
      <div className="hm-big" style={{ color: good ? PURPLE : RED }}>{d.v}%<small>of England's {word} are behind this school on {d.label.toLowerCase()}</small></div>
      <div className="hm-pair">
        <div><b>{fmtV(d.mine, d.unit, d.dp)}</b><small>{name ? "this school" : "the school"}</small></div>
        <div><b>{fmtV(d.med, d.unit, d.dp)}</b><small>England's median</small></div>
        <div><b style={{ color: better ? "#2F7A39" : RED }}>{diff == null ? "–" : (diff > 0 ? "+" : diff < 0 ? "−" : "") + fmtV(Math.abs(diff), d.unit, d.dp)}</b><small>{better ? "the better side" : "the worse side"}</small></div>
      </div>
      <div className="hm-strip">
        <div className="hm-strip-bar">
          {d.q1 != null && d.q3 != null && <span className="hm-strip-iqr" style={{ left: `${Math.min(x(d.q1), x(d.q3))}%`, width: `${Math.abs(x(d.q3) - x(d.q1))}%` }} />}
          {d.med != null && <span className="hm-strip-med" style={{ left: `${x(d.med)}%` }} />}
          {d.mine != null && <span className="hm-strip-me" style={{ left: `${x(d.mine)}%`, background: good ? PURPLE : RED }} />}
        </div>
        <div className="hm-strip-l"><span>{fmtV(d.invert ? hi : lo, d.unit, d.dp)}</span><span>middle half of England</span><span>{fmtV(d.invert ? lo : hi, d.unit, d.dp)}</span></div>
      </div>
      <p className="hm-note" style={{ marginTop: 10 }}>{d.what.replace(/^./, (c) => c.toUpperCase())}. Among {d.n.toLocaleString("en-GB")} {word} with a published figure, this school stands ahead of {d.v}%{good ? ", outside the middle of England on this arm." : ", inside the middle of England on this arm."}</p>
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
