import { useEffect, useMemo, useRef, useState } from "react";
import { getDataset } from "../../lib/dataset.js";
import { ensureMotionCss, Loading } from "../../lib/motion.jsx";
import { BLOCK_TYPES, searchEntities, computeReport, scopeLabel, attachOfsted } from "./engine.js";
import { renderBlocks, coverHtml, reportHtml, PZ_CSS } from "./render.js";

/* Prizm — the report studio. One box: say what you need, or type a name.
   Entities resolve instantly on the device; sentences the dataset cannot
   name go to the reader. The mathematics computes every figure here, and
   the report downloads as one self-contained file in the Institute's hand. */

const INK = "#221233", MUTED = "#6F6580", PAPER = "#FBFAF7", PURPLE = "#6A0CA0";
const panel = { background: "#fff", border: "1px solid rgba(34,18,51,.1)", borderRadius: 14, padding: 18 };
const DEFAULT_BLOCKS = ["headlines", "cohort", "movement", "gap", "scatter"];

export default function Prizm() {
  const [all, setAll] = useState(null);
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState(null);
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [drawer, setDrawer] = useState(true);

  useEffect(ensureMotionCss, []);
  useEffect(() => { getDataset().then(({ raw, ofsted }) => setAll(attachOfsted(raw, ofsted))); }, []);

  const hits = useMemo(() => (all && q.trim().length >= 2 ? searchEntities(all, q) : null), [all, q]);
  const chips = useMemo(() => {
    if (!hits) return [];
    const c = [];
    (hits.composed || []).forEach((x, i) => c.push({ k: "x" + i, label: x.label.replace(/ · \d+ schools?$/, ""), tag: `${x.n} school${x.n === 1 ? "" : "s"}`, sc: x.sc }));
    (hits.regions || []).forEach((r) => c.push({ k: "r" + r.name, label: r.name, tag: `region · ${r.n}`, sc: { type: "region", name: r.name } }));
    hits.trusts.forEach((t) => c.push({ k: "t" + t.name, label: t.name, tag: `trust · ${t.n}`, sc: { type: "trust", name: t.name } }));
    hits.las.forEach((l) => c.push({ k: "l" + l.name, label: l.name, tag: `authority · ${l.n}`, sc: { type: "la", name: l.name } }));
    (hits.towns || []).forEach((t) => c.push({ k: "w" + t.name, label: t.name, tag: `town · ${t.n}`, sc: { type: "town", name: t.name } }));
    hits.schools.forEach((s) => c.push({ k: "s" + s.urn, label: s.name, tag: s.la, sc: scope && scope.type === "urns" ? { type: "urns", urns: [...new Set([...scope.urns, String(s.urn)])] } : { type: "urns", urns: [String(s.urn)] } }));
    return c.slice(0, 7);
  }, [hits, scope]);

  const spec = useMemo(() => ({
    title: title || (scope ? "The picture in brief: " + scopeLabel(scope) : "A Prizm report"),
    scope, blocks: blocks.map((type) => ({ type })),
  }), [title, scope, blocks]);
  const computed = useMemo(() => (all && scope ? computeReport(all, spec) : null), [all, spec, scope]);

  function toggle(t) { setBlocks((b) => (b.includes(t) ? b.filter((x) => x !== t) : [...b, t])); }
  function pick(c) { setScope(c.sc); setQ(""); }

  async function send(given) {
    const text = (given ?? q).trim();
    if (!text || thinking) return;
    setQ(""); setThinking(true);
    const history = [...msgs, { role: "user", content: text }];
    setMsgs(history);
    try {
      const context = JSON.stringify({ currentSpec: { title: spec.title, scope, blocks }, candidates: all ? searchEntities(all, text) : null });
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
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "The reader is out of reach just now, but everything works by hand: type a trust, authority, region or school and choose it below." }]);
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
    <div style={{ background: "#F2EFEA", minHeight: "100%", padding: "26px 22px 60px" }}>
      <style>{PZ_CSS}</style>
      <div style={{ maxWidth: 1380, margin: "0 auto" }}>
        <div className="asi-rise" style={{ "--asi-d": "80ms", marginBottom: 18, display: "flex", alignItems: "flex-end", gap: 18, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontSize: 11, letterSpacing: ".2em", fontWeight: 700, color: "#8a6d1c" }}>PRIZM · THE REPORT STUDIO</div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 500, fontSize: 32, margin: "6px 0 0", color: INK }}>Say what you need to understand.</h1>
          </div>
          <button onClick={() => setDrawer((v) => !v)} style={{ border: "1px solid rgba(34,18,51,.2)", background: "#fff", color: INK, borderRadius: 999, padding: "9px 18px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            {drawer ? "Hide the controls ‹" : "› Controls"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: drawer ? "372px 1fr" : "1fr", gap: 20, alignItems: "start" }}>
          {drawer && (
            <div style={{ display: "grid", gap: 14, position: "sticky", top: 18 }}>
              <div className="asi-rise" style={{ ...panel, "--asi-d": "200ms" }}>
                <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: MUTED, marginBottom: 8 }}>ASK PRIZM</div>
                {scope && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 12.5, fontWeight: 600, color: INK }}>
                    <span style={{ background: "rgba(106,12,160,.08)", border: "1px solid rgba(106,12,160,.2)", borderRadius: 999, padding: "5px 12px" }}>{scopeLabel(scope, computed ? computed.schools.length : null)}</span>
                    <button onClick={() => setScope(null)} style={{ border: "none", background: "transparent", color: "#B3261E", cursor: "pointer", fontSize: 11.5, textDecoration: "underline", padding: 0 }}>clear</button>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={q} onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key !== "Enter") return; if (chips.length) pick(chips[0]); else if (q.trim().length >= 8) send(); }}
                    placeholder={scope ? "Refine it: 'disadvantage front and centre'…" : "A trust, a region, a question — one box does it all…"}
                    style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(34,18,51,.18)", fontSize: 13, background: PAPER }} />
                  <button onClick={() => send()} disabled={thinking || q.trim().length < 2} style={{ border: "none", background: INK, color: "#fff", borderRadius: 9, padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", opacity: thinking ? 0.6 : 1 }}>Ask</button>
                </div>
                {chips.length > 0 && (
                  <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                    {chips.map((c) => (
                      <button key={c.k} onClick={() => pick(c)} style={{ textAlign: "left", border: "1px solid rgba(34,18,51,.1)", background: "#fff", borderRadius: 9, padding: "7px 10px", cursor: "pointer", fontFamily: "inherit" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: INK, display: "block" }}>{c.label}</span>
                        <span style={{ fontSize: 10.5, color: MUTED }}>{c.tag}</span>
                      </button>
                    ))}
                  </div>
                )}
                {hits && !chips.length && q.trim().length >= 8 && (
                  <button onClick={() => send()} disabled={thinking} style={{ marginTop: 8, width: "100%", textAlign: "left", border: "1px solid rgba(106,12,160,.25)", background: "rgba(106,12,160,.05)", borderRadius: 9, padding: "8px 11px", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, color: "#4B0875" }}>
                    Nothing matches by name — <strong>ask Prizm to read it</strong> →
                  </button>
                )}
                {(msgs.length > 0 || thinking) && (
                  <div style={{ display: "grid", gap: 8, maxHeight: 220, overflowY: "auto", marginTop: 10 }}>
                    {msgs.slice(-4).map((m, i) => (
                      <div key={i} style={{ fontSize: 12.5, lineHeight: 1.5, color: m.role === "user" ? INK : "#4B0875", background: m.role === "user" ? "rgba(34,18,51,.05)" : "rgba(106,12,160,.06)", borderRadius: 10, padding: "8px 11px" }}>{m.content}</div>
                    ))}
                    {thinking && <div style={{ fontSize: 12.5, color: MUTED }}>reading…</div>}
                  </div>
                )}
              </div>

              <div className="asi-rise" style={{ ...panel, "--asi-d": "320ms" }}>
                <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: MUTED, marginBottom: 8 }}>BLOCKS</div>
                {BLOCK_TYPES.map((b) => (
                  <label key={b.type} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "5px 0", cursor: "pointer" }}>
                    <input type="checkbox" checked={blocks.includes(b.type)} onChange={() => toggle(b.type)} style={{ marginTop: 2, accentColor: PURPLE }} />
                    <span style={{ fontSize: 12.5, color: INK }}><strong>{b.name}</strong><span style={{ color: MUTED }}> — {b.desc}</span></span>
                  </label>
                ))}
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title the report (or let the reader)…"
                  style={{ width: "100%", boxSizing: "border-box", marginTop: 10, padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(34,18,51,.18)", fontSize: 13, background: PAPER }} />
              </div>

              {computed && (
                <button onClick={download} className="asi-rise asi-lift" style={{ "--asi-d": "440ms", border: "none", background: PURPLE, color: "#fff", borderRadius: 12, padding: "13px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                  Download as a single HTML file
                </button>
              )}
            </div>
          )}

          <div className="asi-rise" style={{ "--asi-d": "260ms" }}>
            {computed ? (
              <div className="pz-report" style={{ borderRadius: 4 }} dangerouslySetInnerHTML={{ __html: coverHtml(spec, computed) + renderBlocks(computed) }} />
            ) : (
              <div style={{ ...panel, padding: 60, textAlign: "center", color: MUTED }}>
                <div style={{ fontFamily: "Fraunces, serif", fontWeight: 500, fontSize: 22, color: INK, marginBottom: 8 }}>The page is waiting for you.</div>
                <p style={{ fontSize: 13.5, margin: 0, maxWidth: 560, marginInline: "auto" }}>Type a trust, an authority, a region or a school and choose it; or tell Prizm what you want to understand ("our schools against London, disadvantage front and centre") and it will shape the whole report. Every figure is the dataset's own.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
