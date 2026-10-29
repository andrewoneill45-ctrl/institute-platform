/* The rooms, described once: for the "What do the tools do?" card and anywhere
   else the Institute introduces itself. Each has an emblem that is quietly alive. */
export const INSTRUMENTS = [
  { to: "atlas", verb: "See", name: "Atlas", accent: "#3E5F8A", desc: "Every school in England on one map: search it in plain English, compare and profile. And ask Prism a question to get a canvas of living evidence with a briefing PDF at the end.", cta: "Open Atlas" },
  { to: "prizm", verb: "Prove", name: "Prizm", accent: "#B3532A", desc: "The report studio: say what you need to understand about a trust, an authority or any set of schools, and Prizm composes the report before your eyes: every figure computed from the published data, downloadable as one beautiful file.", cta: "Open Prizm" },
  { to: "lens", verb: "Know", name: "Lens", accent: "#6A0CA0", desc: "Your inspection room: SEF, evidence vault, Ofsted and Section 48 frameworks, and Ask: a critical friend who knows both schedules and reads your own documents.", cta: "Open Lens" },
  { to: "orbit", verb: "Act", name: "Orbit", accent: "#C6A035", desc: "Strategy in motion: vision, objectives and strategies as one living plan, suggested from your Lens priorities and kept honest as the year turns.", cta: "Open Orbit" },
  { to: "forecast", verb: "Plan", name: "Forecast", accent: "#2F7A39", desc: "The ledger and the years ahead: every finance return since 2014/15, unit costs against the schools most like yours, where the money could go further, and what the roll forecast does to the reserve year by year, with each staffing decision dated by the year it has to be taken.", cta: "Open Forecast" },
  { to: "horizon", verb: "Try", name: "Horizon", accent: "#8a6d1c", desc: "The policy studio, by invitation: say what you want to try, a premium, a closure, a new measure, a growth rate, and Horizon runs it on the published data, in the round: pupils, places, money, outcomes, inclusion and workforce together.", cta: "Open Horizon" },
  { to: "constellation", verb: "Live", name: "Constellation", accent: "#4B0875", desc: "Every child in view: upload years of the data you already hold, keyed by UPN, and watch the whole school resolve into year groups, groups and single pupils, with the children nothing currently reaches flagged first.", cta: "Open Constellation" },
];

/* each instrument's emblem: a small mark that is quietly alive */
const RM = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export function Emblem({ kind }) {
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
  if (kind === "prizm") return (
    <svg viewBox="0 0 80 80" width="46" height="46" aria-hidden="true" style={{ display: "block" }}>
      <line x1="4" y1="40" x2="30" y2="40" stroke="rgba(34,18,51,.45)" strokeWidth="2" />
      <path d="M30 22 L30 58 L52 40 Z" fill="none" stroke={D} strokeWidth="2.4" strokeLinejoin="round" />
      {[["#3E5F8A", 22], ["#6A0CA0", 34], ["#C6A035", 46], ["#B3532A", 58]].map(([c, y], i) => (
        <line key={c} x1="48" y1="40" x2="76" y2={y} stroke={c} strokeWidth="2.2" strokeLinecap="round" opacity=".9">
          {!RM && <animate attributeName="opacity" values=".45;1;.45" dur={(3 + i * 0.7) + "s"} repeatCount="indefinite" />}
        </line>
      ))}
    </svg>
  );
  if (kind === "forecast") return (
    <svg viewBox="0 0 80 80" width="46" height="46" aria-hidden="true" style={{ display: "block" }}>
      <line x1="10" y1="62" x2="70" y2="62" stroke="rgba(34,18,51,.35)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 50 L28 38 L40 44 L62 18" fill="none" stroke={P} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 44 L62 56" fill="none" stroke="#B4475A" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 4" />
      <circle cx="62" cy="18" r="3.4" fill={G}>
        {!RM && <animate attributeName="opacity" values="1;.4;1" dur="3s" repeatCount="indefinite" />}
      </circle>
    </svg>
  );
  if (kind === "horizon") return (
    <svg viewBox="0 0 80 80" width="46" height="46" aria-hidden="true" style={{ display: "block" }}>
      <line x1="8" y1="52" x2="72" y2="52" stroke={D} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 52a18 18 0 0 1 36 0" fill="none" stroke={G} strokeWidth="2.6" />
      <circle cx="40" cy="52" r="5" fill={P}>
        {!RM && <animate attributeName="cy" values="52;46;52" dur="4s" repeatCount="indefinite" />}
      </circle>
      <line x1="16" y1="62" x2="64" y2="62" stroke="rgba(34,18,51,.3)" strokeWidth="1.6" strokeLinecap="round" />
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

