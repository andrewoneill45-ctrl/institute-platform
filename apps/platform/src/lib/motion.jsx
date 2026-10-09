/* The Institute's motion grammar — one law: motion carries meaning, nothing
   decorates. Shared tokens, the quatrefoil loader, and the arrival primitives
   every room uses, so the whole site moves with one hand.
   Honours prefers-reduced-motion throughout: everything lands instantly there. */
import React, { useEffect } from "react";

export const MOTION = { arrive: 700, settle: 420, coil: 1550, ease: "cubic-bezier(.22,.9,.28,1)" };
export const QUATREFOIL = "M31.5 31.5 A 18.5 18.5 0 1 1 68.5 31.5 A 18.5 18.5 0 1 1 68.5 68.5 A 18.5 18.5 0 1 1 31.5 68.5 A 18.5 18.5 0 1 1 31.5 31.5 Z";

let injected = false;
export function ensureMotionCss() {
  if (injected || typeof document === "undefined" || document.getElementById("asi-motion")) return;
  injected = true;
  const s = document.createElement("style");
  s.id = "asi-motion";
  s.textContent = `
@media (prefers-reduced-motion: no-preference) {
  .asi-rise { opacity: 0; transform: translateY(14px); animation: asiRise ${MOTION.arrive}ms ${MOTION.ease} forwards; animation-delay: var(--asi-d, 0ms); }
  @keyframes asiRise { to { opacity: 1; transform: none; } }
  .asi-fade { opacity: 0; animation: asiFade 900ms ease forwards; animation-delay: var(--asi-d, 0ms); }
  @keyframes asiFade { to { opacity: 1; } }
  .asi-draw { stroke-dasharray: 300; stroke-dashoffset: 300; animation: asiDraw 1100ms ${MOTION.ease} forwards; }
  @keyframes asiDraw { to { stroke-dashoffset: 0; } }
  .asi-lift { transition: transform ${MOTION.settle}ms ${MOTION.ease}, box-shadow ${MOTION.settle}ms ${MOTION.ease}; }
  .asi-lift:hover { transform: translateY(-3px); box-shadow: 0 2px 4px rgba(34,18,51,.05), 0 26px 64px rgba(34,18,51,.13); }
  @keyframes asiSpin { to { transform: rotate(360deg); } }
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
