/* Prism chart kit — the pass-three visual language, componentised.
   Every chart takes computed results from engine.js; none does arithmetic beyond scaling. */
import React from "react";

const PURPLE = "#6A0CA0", DEEP = "#4B0875", GOLD = "#C6A035", MUTED = "#6F6580", LILAC = "#F4EEFA";
const fmt = (v) => (v == null ? "–" : Number(v).toLocaleString("en-GB"));

export function Bars({ rows }) {
  if (!rows?.length) return null;
  const max = Math.max(...rows.map((r) => Math.abs(r.value ?? 0))) || 1;
  const H = rows.length * 46 + 8;
  return (
    <svg viewBox={`0 0 660 ${H}`} width="100%" role="img">
      <defs><linearGradient id="pgrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8E3DBE" /><stop offset="1" stopColor={DEEP} /></linearGradient></defs>
      {rows.map((r, i) => {
        const w = Math.max(6, (Math.abs(r.value) / max) * 420);
        const y = 14 + i * 46;
        return (
          <g key={i} fontSize="12">
            <text x="186" y={y + 12} textAnchor="end" fill="#221233">{r.label}</text>
            <rect x="198" y={y} width={w} height="16" rx="8" fill="url(#pgrad)" opacity={0.5 + 0.5 * ((i + 1) / rows.length)} />
            <text x={206 + w} y={y + 13} fontWeight="700" fill={i === rows.length - 1 ? DEEP : MUTED} style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(r.value)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function DotPlot({ rows }) {
  if (!rows?.length) return null;
  const vals = rows.map((r) => r.value).filter((v) => v != null);
  const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
  const X = (v) => 220 + ((v - lo) / span) * 700;
  const H = rows.length * 52 + 10;
  return (
    <svg viewBox={`0 0 1000 ${H}`} width="100%" role="img">
      <defs><radialGradient id="pglo" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={PURPLE} stopOpacity=".33" /><stop offset="1" stopColor={PURPLE} stopOpacity="0" /></radialGradient></defs>
      {rows.map((r, i) => {
        const y = 26 + i * 52;
        return (
          <g key={i}>
            <text x="14" y={y + 4} fontSize="13" fontWeight="600" fill="#221233">{r.label}</text>
            <line x1="220" y1={y} x2="920" y2={y} stroke="#EFEAF6" strokeWidth="6" strokeLinecap="round" />
            <circle cx={X(r.value)} cy={y} r="22" fill="url(#pglo)" />
            <circle cx={X(r.value)} cy={y} r="8" fill={PURPLE} stroke="#fff" strokeWidth="2.5" />
            <text x={X(r.value)} y={y - 16} textAnchor="middle" fontSize="12" fontWeight="700" fill={DEEP} style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(r.value)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Scatter({ points, r, highlight, xLabel, yLabel }) {
  if (!points?.length) return null;
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const X = (v) => 66 + ((v - x0) / ((x1 - x0) || 1)) * 968;
  const Y = (v) => 396 - ((v - y0) / ((y1 - y0) || 1)) * 340;
  // simple least-squares for the trend ribbon
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let sxy = 0, sxx = 0;
  points.forEach((p) => { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; });
  const b = sxy / (sxx || 1), a = my - b * mx;
  const yA = Y(a + b * x0), yB = Y(a + b * x1);
  return (
    <svg viewBox="0 0 1080 448" width="100%" role="img">
      <defs>
        <linearGradient id="rib" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={PURPLE} stopOpacity=".10" /><stop offset="1" stopColor={DEEP} stopOpacity=".14" /></linearGradient>
        <radialGradient id="ggl" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={GOLD} stopOpacity=".5" /><stop offset="1" stopColor={GOLD} stopOpacity="0" /></radialGradient>
        <linearGradient id="dfd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8E3DBE" /><stop offset="1" stopColor={DEEP} /></linearGradient>
      </defs>
      <g stroke="rgba(106,12,160,.10)" strokeDasharray="1 6" strokeLinecap="round">
        <line x1="66" y1="110" x2="1044" y2="110" /><line x1="66" y1="250" x2="1044" y2="250" /><line x1="66" y1="390" x2="1044" y2="390" />
      </g>
      <path d={`M66 ${yA - 18} L1044 ${yB - 18} L1044 ${yB + 18} L66 ${yA + 18} Z`} fill="url(#rib)" />
      <line x1="66" y1={yA} x2="1044" y2={yB} stroke={DEEP} strokeWidth="2.2" strokeLinecap="round" />
      <g fill="url(#dfd)">
        {points.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="4" opacity={Math.max(0.1, 0.32 - (p.x - x0) / ((x1 - x0) || 1) * 0.2)} />)}
      </g>
      {highlight && (<g>
        <circle cx={X(highlight.x)} cy={Y(highlight.y)} r="32" fill="url(#ggl)" />
        <circle cx={X(highlight.x)} cy={Y(highlight.y)} r="8" fill={GOLD} stroke="#fff" strokeWidth="2.5" />
        <text x={Math.min(780, X(highlight.x) + 18)} y={Math.max(26, Y(highlight.y) - 14)} fontSize="12" fontWeight="700" fill="#221233">{highlight.name}</text>
      </g>)}
      <g fontSize="11" fill={MUTED}>
        <text x="66" y="430">{xLabel}</text>
        <text x="1044" y="430" textAnchor="end">{yLabel}{r != null ? ` · r = ${r}` : ""}</text>
      </g>
    </svg>
  );
}

export function Ring({ value, label, sub }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const ang = Math.PI * (1 - pct / 100);
  const ex = 110 + 80 * Math.cos(ang), ey = 130 - 80 * Math.sin(ang);
  const large = pct > 50 ? 1 : 0;
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 220 152" width="100%" style={{ maxWidth: 240 }} role="img">
        <defs><linearGradient id="rng" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8E3DBE" /><stop offset="1" stopColor={DEEP} /></linearGradient></defs>
        <path d="M30 130 A 80 80 0 0 1 190 130" fill="none" stroke={LILAC} strokeWidth="16" strokeLinecap="round" />
        <path d={`M30 130 A 80 80 0 0 ${large} ${ex} ${ey}`} fill="none" stroke="url(#rng)" strokeWidth="16" strokeLinecap="round" />
        <circle cx={ex} cy={ey} r="5" fill={GOLD} stroke="#fff" strokeWidth="2" />
        <text x="110" y="112" textAnchor="middle" fontFamily="Fraunces" fontWeight="600" fontSize="40" fill="#221233" style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(value)}%</text>
        {label && <text x="110" y="136" textAnchor="middle" fontSize="11" fill={MUTED}>{label}</text>}
      </svg>
      {sub && <p style={{ fontSize: 12.5, color: MUTED, marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

export function Stat({ value, unit, label, sub }) {
  return (
    <div>
      <div style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: 52, lineHeight: 1, letterSpacing: "-.02em", background: `linear-gradient(120deg,${PURPLE},${DEEP})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", fontVariantNumeric: "tabular-nums" }}>
        {fmt(value)}{unit || ""}
      </div>
      {label && <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>{label}</div>}
      {sub && <p style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export function DataTable({ rows }) {
  if (!rows?.length) return null;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderTop: "1px solid rgba(106,12,160,.12)" }}>
            <td style={{ padding: "9px 4px" }}>{r.label}{r.sub ? <span style={{ color: MUTED, fontSize: 11.5 }}> · {r.sub}</span> : null}</td>
            <td style={{ padding: "9px 4px", textAlign: "right", fontWeight: 700, color: DEEP, fontVariantNumeric: "tabular-nums" }}>{fmt(r.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
