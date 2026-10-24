/* The Institute's motion grammar — one law: motion carries meaning, nothing
   decorates. Shared tokens, the quatrefoil loader, and the arrival primitives
   every room uses, so the whole site moves with one hand.
   Honours prefers-reduced-motion throughout: everything lands instantly there. */
import React, { useEffect } from "react";

/* timed to Constellation's coil: arrivals are unhurried and travel far enough to be felt */
export const MOTION = { arrive: 1250, settle: 620, coil: 1550, ease: "cubic-bezier(.22,.9,.28,1)" };
export const QUATREFOIL = "M31.5 31.5 A 18.5 18.5 0 1 1 68.5 31.5 A 18.5 18.5 0 1 1 68.5 68.5 A 18.5 18.5 0 1 1 31.5 68.5 A 18.5 18.5 0 1 1 31.5 31.5 Z";

let injected = false;
export function ensureMotionCss() {
  if (injected || typeof document === "undefined" || document.getElementById("asi-motion")) return;
  injected = true;
  const s = document.createElement("style");
  s.id = "asi-motion";
  s.textContent = `
@media (prefers-reduced-motion: no-preference) {
  .asi-rise { opacity: 0; transform: translateY(26px); animation: asiRise ${MOTION.arrive}ms ${MOTION.ease} forwards; animation-delay: var(--asi-d, 0ms); }
  @keyframes asiRise { to { opacity: 1; transform: none; } }
  .asi-fade { opacity: 0; animation: asiFade 1500ms ease forwards; animation-delay: var(--asi-d, 0ms); }
  @keyframes asiFade { to { opacity: 1; } }
  .asi-draw { stroke-dasharray: 300; stroke-dashoffset: 300; animation: asiDraw 1700ms ${MOTION.ease} forwards; }
  @keyframes asiDraw { to { stroke-dashoffset: 0; } }
  .asi-lift { transition: transform ${MOTION.settle}ms ${MOTION.ease}, box-shadow ${MOTION.settle}ms ${MOTION.ease}; }
  .asi-lift:hover { transform: translateY(-6px); box-shadow: 0 3px 6px rgba(34,18,51,.06), 0 34px 80px rgba(34,18,51,.17); }
  @keyframes asiSpin { to { transform: rotate(360deg); } }
  .asi-think { stroke-dasharray: 300; animation: asiThink 1.9s cubic-bezier(.45,.1,.55,.9) infinite; }
  @keyframes asiThink { 0% { stroke-dashoffset: 300; } 50% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -300; } }
  @keyframes asiCardIn { from { opacity: 0; transform: translateX(76px) scale(.96); } to { opacity: 1; transform: none; } }
  @keyframes asiCardOut { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateX(76px) scale(.97); } }
}`;
  document.head.appendChild(s);
}

/* a block that rises into place on arrival; delay staggers an orchestration */
export function Rise({ delay = 0, style, children, ...rest }) {
  useEffect(ensureMotionCss, []);
  return <div className="asi-rise" style={{ "--asi-d": delay + "ms", ...style }} {...rest}>{children}</div>;
}

/* the house mark, drawn in one stroke */
export function Quatrefoil({ size = 40, stroke = "#6A0CA0", width = 7, draw = true }) {
  useEffect(ensureMotionCss, []);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ display: "block", margin: "0 auto" }}>
      <path d={QUATREFOIL} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" className={draw ? "asi-draw" : undefined} />
    </svg>
  );
}

/* the roundel thinking: the quatrefoil drawing and undrawing until the answer lands */
export function Thinking({ size = 20, label, style }) {
  useEffect(ensureMotionCss, []);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, minWidth: 0, ...style }} role="status" aria-live="polite">
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
        <path d={QUATREFOIL} fill="none" stroke="#6A0CA0" strokeWidth="9" strokeLinecap="round" opacity="0.22" />
        <path d={QUATREFOIL} fill="none" stroke="#6A0CA0" strokeWidth="9" strokeLinecap="round" className="asi-think" />
      </svg>
      {label && <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "#4B0875", fontStyle: "italic" }}>{label}</span>}
    </span>
  );
}

/* inject at module load, before first paint, so an arrival never flashes */
ensureMotionCss();

/* the house loader: quatrefoil drawing itself, name beneath — Atlas set the pattern */
export function Loading({ title, label = "loading…" }) {
  useEffect(ensureMotionCss, []);
  return (
    <div style={{ height: "100%", minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center", background: "#FBFAF7", fontFamily: "Inter, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <Quatrefoil size={44} />
        {title && <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "2.1rem", letterSpacing: "-.015em", color: "#221233", marginTop: 10 }}>{title}</div>}
        <div style={{ fontSize: ".9rem", color: "#6F6580", marginTop: title ? 4 : 10 }}>{label}</div>
      </div>
    </div>
  );
}
