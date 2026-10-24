/* The story behind the figures: a sourced web context panel, kept apart from
   the report's computed data. Fetched only on request (every search costs),
   cached per scope, and every link one the context desk's searches returned. */
import { Thinking } from "../../lib/motion.jsx";

const INK = "#221233", MUTED = "#6F6580", GOLD = "#C6A035", DEEP = "#4B0875";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export async function fetchContext({ scope, kind, schools }) {
  const r = await fetch("/.netlify/functions/context", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope, kind, schools }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) { const e = new Error(data.error || "no answer"); e.slow = !!data.slow; throw e; }
  return { items: Array.isArray(data.items) ? data.items : [], note: data.note || "" };
}

/* the same panel as static HTML, for the downloaded report */
export function contextHtml(ctx) {
  if (!ctx || !ctx.items || !ctx.items.length) return "";
  return `<section class="pz-block" style="border-left:3px solid ${GOLD};padding-left:18px">
  <div style="font-size:11px;letter-spacing:.14em;font-weight:700;color:#8a6d1c;text-transform:uppercase">The story behind the figures</div>
  <p style="font-size:12px;color:${MUTED};margin:4px 0 10px">From the web, not from Prizm's data: sourced reporting on what has been happening, gathered when this report was made.</p>
  ${ctx.items.map((it) => `<div style="margin:10px 0"><a href="${esc(it.url)}" style="font-weight:600;color:${INK};text-decoration:none">${esc(it.headline)}</a><div style="font-size:12.5px;color:${INK};margin-top:2px">${esc(it.summary)}</div><div style="font-size:11px;color:${MUTED};margin-top:2px">${esc(it.source)}${it.date ? " · " + esc(it.date) : ""}</div></div>`).join("")}
</section>`;
}

export default function ContextPanel({ label, state, onAsk }) {
  /* state: undefined (not asked), "busy", { items, note }, or { error } */
  const box = { margin: "4px 0 26px", padding: "14px 18px", borderLeft: `3px solid ${GOLD}`, background: "rgba(198,160,53,.06)", borderRadius: "0 10px 10px 0", fontFamily: "Inter, system-ui, sans-serif" };
  const kick = { fontSize: 10.5, letterSpacing: ".14em", fontWeight: 700, color: "#8a6d1c", textTransform: "uppercase" };
  if (!state) {
    return (
      <div style={{ ...box, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px" }}>
          <div style={kick}>The story behind the figures</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginTop: 3 }}>What has been happening in {label}: inspections, leadership, mergers, closures and press, searched from the web and sourced. Kept apart from the figures, which come only from the DfE data.</div>
        </div>
        <button onClick={onAsk} style={{ fontFamily: "inherit", border: `1px solid ${GOLD}`, background: "#fff", color: DEEP, borderRadius: 999, padding: "8px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Find the context</button>
      </div>
    );
  }
  if (state === "busy") {
    return <div style={box}><div style={kick}>The story behind the figures</div><div style={{ marginTop: 8 }}><Thinking label={`Searching the web for what has been happening in ${label}…`} /></div></div>;
  }
  if (state.error) {
    return (
      <div style={box}>
        <div style={kick}>The story behind the figures</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>{state.slow ? "The web search took too long this time" : "The context desk is out of reach just now"}; the figures below are unaffected. <button onClick={onAsk} style={{ fontFamily: "inherit", border: "none", background: "transparent", color: DEEP, textDecoration: "underline", cursor: "pointer", padding: 0, fontSize: 12.5 }}>Try again</button></div>
      </div>
    );
  }
  return (
    <div style={box}>
      <div style={kick}>The story behind the figures</div>
      <div style={{ fontSize: 11.5, color: MUTED, margin: "3px 0 8px" }}>From the web, not from Prizm's data. {state.note}</div>
      {state.items.length === 0 && <div style={{ fontSize: 12.5, color: MUTED }}>Nothing reliable turned up for {label}.</div>}
      {state.items.map((it, i) => (
        <div key={i} style={{ padding: "8px 0", borderTop: i ? "1px solid rgba(34,18,51,.08)" : "none" }}>
          <a href={it.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 13.5, color: INK, textDecoration: "none" }}>{it.headline} <span style={{ color: GOLD }}>&#8599;</span></a>
          {it.summary && <div style={{ fontSize: 12.5, color: INK, marginTop: 2, lineHeight: 1.5 }}>{it.summary}</div>}
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{it.source}{it.date ? ` · ${it.date}` : ""}</div>
        </div>
      ))}
    </div>
  );
}
