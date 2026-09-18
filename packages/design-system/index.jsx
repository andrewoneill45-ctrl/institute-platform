// @asi/design-system — the Institute's marks and primitives.
export const QF_PATH =
  "M31.5 31.5 A 18.5 18.5 0 1 1 68.5 31.5 A 18.5 18.5 0 1 1 68.5 68.5 A 18.5 18.5 0 1 1 31.5 68.5 A 18.5 18.5 0 1 1 31.5 31.5 Z";

export function Mark({ size = 16, weight = 6, color = "currentColor", style }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style} aria-hidden="true">
      <path d={QF_PATH} fill="none" stroke={color} strokeWidth={weight} />
    </svg>
  );
}

/* The wordmark: lowercase "institute", quatrefoil as the tittle of the i. */
export function Wordmark({ size = 26, color = "var(--ink)", markColor = "var(--purple)" }) {
  return (
    <span style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: size,
      letterSpacing: "-.012em", color, lineHeight: 1 }}>
      inst
      <span style={{ position: "relative", display: "inline-block" }}>
        {"\u0131"}
        <Mark weight={11} color={markColor}
          style={{ position: "absolute", left: "50%", transform: "translateX(-50%)",
            top: "-.175em", width: ".34em", height: ".34em" }} />
      </span>
      tute
    </span>
  );
}

export function Kick({ children }) {
  return (
    <p className="kick">
      <Mark size={14} color="var(--gold)" />
      {children}
    </p>
  );
}

export const CREED = [
  "Disadvantage is the central fact of English schooling, and it is not destiny. The schools that prove this every day are the most important schools in the country.",
  "Evidence should be read honestly and said plainly. If the data is uncomfortable, that is the data's job.",
  "Schools improve schools. The knowledge the system needs already exists inside it; the work is to find it, name it and move it.",
  "Leadership can be built. The disciplines that produce champions in elite sport produce exceptional schools too.",
  "Simplicity wins. A school that does a few things completely will beat a school that does everything partially.",
];

export const INSTRUMENTS = [
  { name: "Atlas", verb: "SEE",  blurb: "Every school in England, mapped and open to interrogation: results, intake, inclusion, trajectory, benchmarked against the schools most like yours." },
  { name: "Lens",  verb: "KNOW", blurb: "Your own school, examined properly. Private to you: strengths made visible, weaknesses put to you as questions before anyone else asks them." },
  { name: "Orbit", verb: "ACT",  blurb: "The plan in motion. What Atlas and Lens have shown you, turned into a live improvement plan built on simplicity." },
];
