import { useEffect, useMemo, useRef, useState } from "react";
import { getDataset } from "../../lib/dataset.js";
import { ensureMotionCss, Loading } from "../../lib/motion.jsx";
import { BLOCK_TYPES, searchEntities, computeReport, scopeLabel } from "./engine.js";
import { renderBlocks, coverHtml, reportHtml, PZ_CSS } from "./render.js";

/* Prizm — the report studio. Say what you need to understand; the reader
   shapes the report; the mathematics computes every figure on this device
   from the published national dataset; the result downloads as one
   self-contained HTML file in the Institute's hand. */

const INK = "#221233", MUTED = "#6F6580", PAPER = "#FBFAF7", PURPLE = "#6A0CA0";
const panel = { background: "#fff", border: "1px solid rgba(34,18,51,.1)", borderRadius: 14, padding: 18 };
const DEFAULT_BLOCKS = ["cohort", "movement", "gap", "scatter"];

export default function Prizm() {
  const [all, setAll] = useState(null);
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState(null);
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [brief, setBrief] = useState("");
  const [thinking, setThinking] = useState(false);
  const [askNote, setAskNote] = useState("");
  const reportRef = useRef(null);

  useEffect(ensureMotionCss, []);
  useEffect(() => { getDataset().then(({ raw }) => setAll(raw)); }, []);

  const hits = useMemo(() => (all && q ? searchEntities(all, q) : null), [all, q]);
  const spec = useMemo(() => ({
    title: title || (scope ? "The picture in brief: " + scopeLabel(scope) : "A Prizm report"),
    scope, blocks: blocks.map((type) => ({ type })),
  }), [title, scope, blocks]);
  const computed = useMemo(() => (all && scope ? computeReport(all, spec) : null), [all, spec, scope]);

  function toggle(t) { setBlocks((b) => (b.includes(t) ? b.filter((x) => x !== t) : [...b, t])); }
  function pick(sc, label) { setScope(sc); setQ(""); if (!title) setTitle(""); setMsgs((m) => m.length ? m : [{ role: "assistant", content: `Scope set: ${label}. Tell me what you want to understand and I'll shape the report; or build it by hand below.` }]); }

  async function send(given) {
    const text = (given ?? brief).trim();
    if (!text || thinking) return;
    setBrief(""); setQ(""); setThinking(true); setAskNote("");
    const history = [...msgs, { role: "user", content: text }];
    setMsgs(history);
    try {
      const context = JSON.stringify({
        currentSpec: { title: spec.title, scope, blocks },
        candidates: all ? searchEntities(all, text) : null,
      });
      const r = await fetch("/.netlify/functions/prizm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: text, history: msgs, context }),
      });
      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error || "no answer");
      if (data.spec) {
        if (data.spec.scope) setScope(data.spec.scope);
        if (data.spec.title) setTitle(data.spec.title);
        if (Array.isArray(data.spec.blocks) && data.spec.blocks.length) setBlocks(data.spec.blocks.map((b) => b.type).filter((t) => BLOCK_TYPES.some((k) => k.type === t)));
      }
      setMsgs((m) => [...m, { role: "assistant", content: data.reply || "Done." }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: "I couldn't reach the reader just now, but everything here works by hand: set the scope above and choose the blocks." }]);
      setAskNote(String(e.message || e));
    }
    setThinking(false);
  }

  function download() {
    if (!computed) return;
    const blob = new Blob([reportHtml(spec, computed)], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (spec.title || "prizm-report").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) + ".html";
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  if (!all) return <Loading title="Prizm" label="the national dataset is arriving…" />;

  return (
    <div style={{ background: PAPER, minHeight: "100%", padding: "26px 22px 60px" }}>
      <style>{PZ_CSS}</style>
      <div style={{ maxWidth: 1340, margin: "0 auto" }}>
        <div className="asi-rise" style={{ "--asi-d": "80ms", marginBottom: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: ".2em", fontWeight: 700, color: "#8a6d1c" }}>PRIZM · THE REPORT STUDIO</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 34, margin: "6px 0 2px", color: INK }}>Say what you need to understand.</h1>
          <p style={{ color: MUTED, fontSize: 13.5, margin: 0 }}>The reader shapes the report; the mathematics computes every figure on this device from the published dataset; the file is yours to keep.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 14 }}>
            <div className="asi-rise" style={{ ...panel, "--asi-d": "220ms" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: MUTED, marginBottom: 8 }}>SCOPE</div>
              {scope && <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8 }}>{scopeLabel(scope, computed ? computed.schools.length : null)}
                <button onClick={() => setScope(null)} style={{ marginLeft: 8, border: "none", background: "transparent", color: "#B3261E", cursor: "pointer", fontSize: 11.5, textDecoration: "underline" }}>clear</button></div>}
              <input value={q} onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const first = hits && (hits.regions?.[0] && { sc: { type: "region", name: hits.regions[0].name }, l: hits.regions[0].name }
                    || hits.trusts[0] && { sc: { type: "trust", name: hits.trusts[0].name }, l: hits.trusts[0].name }
                    || hits.las[0] && { sc: { type: "la", name: hits.las[0].name }, l: hits.las[0].name }
                    || hits.schools[0] && { sc: { type: "urns", urns: [String(hits.schools[0].urn)] }, l: hits.schools[0].name });
                  if (first) pick(first.sc, first.l); else if (q.trim().length >= 8) send(q);
                }}
                placeholder="A trust, an authority, a region, a school — or just say what you need…"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(34,18,51,.18)", fontSize: 13, background: PAPER }} />
              {hits && (hits.trusts.length || hits.las.length || hits.regions?.length || hits.schools.length) ? (
                <div style={{ marginTop: 8, display: "grid", gap: 4, fontSize: 12.5 }}>
                  {(hits.regions || []).map((r) => <Hit key={"r" + r.name} label={r.name} tag={`region · ${r.n}`} onClick={() => pick({ type: "region", name: r.name }, r.name)} />)}
                  {hits.trusts.map((t) => <Hit key={"t" + t.name} label={t.name} tag={`trust · ${t.n}`} onClick={() => pick({ type: "trust", name: t.name }, t.name)} />)}
                  {hits.las.map((l) => <Hit key={"l" + l.name} label={l.name} tag={`local authority · ${l.n}`} onClick={() => pick({ type: "la", name: l.name }, l.name)} />)}
                  {hits.schools.map((s) => <Hit key={s.urn} label={s.name} tag={s.la} onClick={() => pick(scope && scope.type === "urns" ? { type: "urns", urns: [...new Set([...scope.urns, String(s.urn)])] } : { type: "urns", urns: [String(s.urn)] }, s.name)} />)}
                </div>
              ) : null}
              {hits && !hits.regions?.length && !hits.trusts.length && !hits.las.length && !hits.schools.length && q.trim().length >= 8 && (
                <button onClick={() => send(q)} disabled={thinking} style={{ marginTop: 8, width: "100%", textAlign: "left", border: "1px solid rgba(106,12,160,.25)", background: "rgba(106,12,160,.05)", borderRadius: 9, padding: "8px 11px", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, color: "#4B0875" }}>
                  Nothing matches by name — <strong>ask Prizm to read it</strong> →
                </button>
              )}
              {scope?.type === "urns" && <p style={{ fontSize: 11, color: MUTED, margin: "8px 0 0" }}>Keep searching to add more schools to the set.</p>}
            </div>

            <div className="asi-rise" style={{ ...panel, "--asi-d": "340ms" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: MUTED, marginBottom: 8 }}>BLOCKS</div>
              {BLOCK_TYPES.map((b) => (
                <label key={b.type} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "6px 0", cursor: "pointer" }}>
                  <input type="checkbox" checked={blocks.includes(b.type)} onChange={() => toggle(b.type)} style={{ marginTop: 2, accentColor: PURPLE }} />
                  <span style={{ fontSize: 12.5, color: INK }}><strong>{b.name}</strong><span style={{ color: MUTED }}> — {b.desc}</span></span>
                </label>
              ))}
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title the report (or let the reader)…"
                style={{ width: "100%", boxSizing: "border-box", marginTop: 10, padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(34,18,51,.18)", fontSize: 13, background: PAPER }} />
            </div>

            <div className="asi-rise" style={{ ...panel, "--asi-d": "460ms" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: MUTED, marginBottom: 8 }}>ASK PRIZM</div>
              <div style={{ display: "grid", gap: 8, maxHeight: 260, overflowY: "auto", marginBottom: 10 }}>
                {msgs.length === 0 && <p style={{ fontSize: 12.5, color: MUTED, margin: 0 }}>"Our eight schools against London, disadvantage front and centre." Prizm sets the scope, picks the blocks and titles the piece; every figure stays the dataset's own.</p>}
                {msgs.map((m, i) => (
                  <div key={i} style={{ fontSize: 12.5, lineHeight: 1.5, color: m.role === "user" ? INK : "#4B0875", background: m.role === "user" ? "rgba(34,18,51,.05)" : "rgba(106,12,160,.06)", borderRadius: 10, padding: "8px 11px" }}>{m.content}</div>
                ))}
                {thinking && <div style={{ fontSize: 12.5, color: MUTED }}>reading…</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={brief} onChange={(e) => setBrief(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="What do you want to find out?"
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(34,18,51,.18)", fontSize: 13, background: PAPER }} />
                <button onClick={send} disabled={thinking} style={{ border: "none", background: INK, color: "#fff", borderRadius: 9, padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", opacity: thinking ? 0.6 : 1 }}>Ask</button>
              </div>
              {askNote && <p style={{ fontSize: 10.5, color: MUTED, margin: "6px 0 0" }}>({askNote})</p>}
            </div>

            {computed && (
              <button onClick={download} className="asi-rise asi-lift" style={{ "--asi-d": "580ms", border: "none", background: PURPLE, color: "#fff", borderRadius: 12, padding: "13px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                Download as a single HTML file
              </button>
            )}
          </div>

          <div className="asi-rise" style={{ "--asi-d": "300ms" }} ref={reportRef}>
            {computed ? (
              <div className="pz-report" dangerouslySetInnerHTML={{ __html: coverHtml(spec, computed) + renderBlocks(computed) }} />
            ) : (
              <div style={{ ...panel, padding: 60, textAlign: "center", color: MUTED }}>
                <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, color: INK, marginBottom: 8 }}>The page is waiting for a scope.</div>
                <p style={{ fontSize: 13.5, margin: 0 }}>Search a trust, a local authority or a set of schools on the left, or simply tell Prizm what you need; the report assembles here as you shape it.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hit({ label, tag, onClick }) {
  return (
    <button onClick={onClick} style={{ textAlign: "left", border: "1px solid rgba(34,18,51,.1)", background: "#fff", borderRadius: 9, padding: "7px 10px", cursor: "pointer", fontFamily: "inherit" }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: INK, display: "block" }}>{label}</span>
      <span style={{ fontSize: 10.5, color: MUTED }}>{tag}</span>
    </button>
  );
}
