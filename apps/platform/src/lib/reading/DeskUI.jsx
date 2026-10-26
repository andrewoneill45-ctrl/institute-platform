/* The reading desk's shared pieces: the stage strip every file passes
   through, and the panel that sets out what the desk found and asks the
   member what it could not decide. Used in Constellation's slips and in the
   Lens reading desk alike, so a file is read the same way in both rooms. */
import React from "react";

const INK = "#221233", PURPLE = "#6A0CA0", DEEP = "#4B0875", GOLD = "#C6A035", MUTED = "#6F6580", RED = "#B4475A";

export const STAGES = [
  { key: "open", label: "Opened" },
  { key: "privacy", label: "Privacy checked" },
  { key: "read", label: "Interrogated" },
  { key: "word", label: "Your word" },
  { key: "filed", label: "Filed" },
];

/* stage: the key now in hand; busy: that stage is still working */
export function DeskStages({ stage, busy, failed }) {
  const at = Math.max(0, STAGES.findIndex((s) => s.key === stage));
  return (
    <ol className="desk-stages" aria-label="Reading stages">
      {STAGES.map((s, i) => {
        const state = i < at ? "done" : i === at ? (failed ? "failed" : busy ? "busy" : "now") : "todo";
        return (
          <li key={s.key} className={`desk-stage ${state}`}>
            <span className="desk-dot" aria-hidden="true">{state === "done" ? "✓" : state === "failed" ? "!" : ""}</span>
            <span>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* a question with its options as chips; answered, it folds away */
export function DeskQuestion({ q, onAnswer }) {
  return (
    <div className="desk-q">
      <div className="desk-q-t">{q.text}</div>
      <div className="desk-q-o">
        {q.options.map((o, i) => (
          <button key={i} onClick={() => onAnswer(q, typeof o === "string" ? o : o.value, typeof o === "string" ? o : o.label)}>{typeof o === "string" ? o : o.label}</button>
        ))}
      </div>
    </div>
  );
}

/* Constellation: what the desk made of a table */
export function TableDeskPanel({ desk, onAnswer, onRetry }) {
  if (!desk) return null;
  if (desk.stage === "privacy" && desk.blocked) {
    return <div className="desk-panel warn">The reading desk was not asked: an identifying value would have left the device ({desk.leaks}). The rules reading below stands; check it by eye.</div>;
  }
  if (desk.busy) return <div className="desk-panel busy"><span className="desk-spin" aria-hidden="true" />The reading desk is interrogating the file&rsquo;s structure: {desk.cols} column headings and their patterns, never a name or a UPN.</div>;
  if (desk.error) return <div className="desk-panel warn">The reading desk could not help with this one ({desk.error}). The rules reading below stands. <button className="desk-link" onClick={onRetry}>Try again</button></div>;
  const open = (desk.questions || []).filter((q) => !(desk.answered || {})[q.id]);
  return (
    <div className="desk-panel">
      {desk.summary && <div className="desk-sum">{desk.summary}</div>}
      {desk.notPupil && <div className="desk-note warn">This does not look like live pupil data. Finished results, survey figures and documents belong in Lens&rsquo;s Library, where the reading desk can file them as evidence.</div>}
      {desk.applied?.length > 0 && <div className="desk-note">Applied on the desk&rsquo;s reading: {desk.applied.join("; ")}. Change anything below.</div>}
      {desk.cautions?.map((c, i) => <div key={i} className="desk-note gold">{c}</div>)}
      {open.map((q) => <DeskQuestion key={q.id} q={q} onAnswer={onAnswer} />)}
      <div className="desk-priv">The desk saw {desk.cols} column headings, how full and varied each is, and safe values such as grades and Y/N flags. No name, UPN or birthdate left this device.</div>
    </div>
  );
}

const cite = (c, unit) => (c && c.length ? <span className="desk-cite">{unit === "slide" ? "slide" : unit === "section" ? "§" : "p."}&nbsp;{c.join(", ")}</span> : null);

/* Lens: what the desk made of a document */
export function DocumentReading({ r, unit }) {
  if (!r) return null;
  return (
    <div className="desk-doc">
      <div className="desk-doc-h">
        <b>{r.title || "Untitled"}</b>
        <small>{[r.docType, r.date, r.author].filter(Boolean).join(" · ")}</small>
      </div>
      {r.summary && <p className="desk-sum">{r.summary}</p>}
      {r.findings?.length > 0 && (
        <div className="desk-sec"><h5>What it says</h5><ul>{r.findings.map((f, i) => <li key={i}>{f.text} {cite(f.cite, unit)}</li>)}</ul></div>
      )}
      {(r.strengths?.length > 0 || r.gaps?.length > 0) && (
        <div className="desk-two">
          {r.strengths?.length > 0 && <div className="desk-sec"><h5>An inspector would credit</h5><ul>{r.strengths.map((f, i) => <li key={i}>{f.text} {cite(f.cite, unit)}</li>)}</ul></div>}
          {r.gaps?.length > 0 && <div className="desk-sec gap"><h5>An inspector would ask about</h5><ul>{r.gaps.map((f, i) => <li key={i}>{f.text} {cite(f.cite, unit)}</li>)}</ul></div>}
        </div>
      )}
      {r.figures?.length > 0 && (
        <div className="desk-sec"><h5>Figures it states <small>transcribed, each checked against its page</small></h5>
          <div className="desk-figs">{r.figures.map((f, i) => <div key={i} className="desk-fig"><b>{f.value}</b><span>{f.label}{f.period ? `, ${f.period}` : ""}</span>{cite([f.cite], unit)}</div>)}</div>
        </div>
      )}
      {r.series?.length > 0 && (
        <div className="desk-sec"><h5>Trends it reports</h5>{r.series.map((s, i) => <div key={i} className="desk-series"><b>{s.label}</b> {s.years.map((y, j) => `${y}: ${s.vals[j]}`).join(" · ")} {cite([s.cite], unit)}</div>)}</div>
      )}
      {r.dropped > 0 && <div className="desk-priv">{r.dropped} claim{r.dropped === 1 ? "" : "s"} the desk could not match to {unit === "slide" ? "a slide" : "a page"} {r.dropped === 1 ? "was" : "were"} left out.</div>}
    </div>
  );
}

export const deskColours = { INK, PURPLE, DEEP, GOLD, MUTED, RED };
