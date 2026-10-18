import { useEffect, useMemo, useRef, useState } from "react";
import { getDataset } from "../../lib/dataset.js";
import { ensureMotionCss, Loading } from "../../lib/motion.jsx";
import { useAuth } from "../../lib/auth.jsx";
import { BLOCK_TYPES, searchEntities, computeReport, scopeLabel, attachOfsted, verifyCommentary } from "./engine.js";
import { renderBlocks, coverHtml, reportHtml, forewordHtml, PZ_CSS } from "./render.js";
import { listReports, saveReport, deleteReport } from "./reports.js";

/* the findings the reader is allowed to quote: every scalar the engine
   computed, with the big row arrays trimmed to their ends */
function slim(v, depth = 0) {
  if (Array.isArray(v)) {
    if (!v.length || depth > 3) return undefined;
    const take = v.length > 6 ? [...v.slice(0, 3), ...v.slice(-3)] : v;
    return take.map((x) => slim(x, depth + 1)).filter((x) => x !== undefined);
  }
  if (v && typeof v === "object") {
    const o = {};
    for (const [k, val] of Object.entries(v)) {
      if (["cloud", "bins", "marks", "bench"].includes(k)) continue;
      const s = slim(val, depth + 1);
      if (s !== undefined) o[k] = s;
    }
    return o;
  }
  return typeof v === "number" || typeof v === "string" || typeof v === "boolean" ? v : undefined;
}

/* Prizm — the report studio. One box: say what you need, or type a name.
   Entities resolve instantly on the device; sentences the dataset cannot
   name go to the reader. The mathematics computes every figure here, and
   the report downloads as one self-contained file in the Institute's hand. */

const INK = "#221233", MUTED = "#6F6580", PAPER = "#FBFAF7", PURPLE = "#6A0CA0";
const panel = { background: "#fff", border: "1px solid rgba(34,18,51,.1)", borderRadius: 14, padding: 18 };
const DEFAULT_BLOCKS = ["headlines", "cohort", "movement", "gap", "scatter"];
/* what the same blocks mean when the scope is the primary estate */
const KS2_DESCS = {
  headlines: "the scope in four numbers, against England (KS2)",
  cohort: "every school ranked by RWM expected standard",
  movement: "KS2 2024/25 against 2023/24, school by school",
  gap: "disadvantaged and other pupils at the expected standard",
  attendance: "overall and persistent absence against primary England",
  behaviour: "suspension rates and permanent exclusions (primary)",
  destinations: "secondary only — KS4 leavers' destinations",
  scatter: "FSM against RWM, the scope against England's primaries",
  distribution: "the national RWM distribution, scope schools marked",
  ofsted: "current Ofsted judgements across the scope",
  league: "authorities or trusts ranked by what their primaries achieve",
};

export default function Prizm() {
  const { user } = useAuth() || {};
  const urn = user && user.urn ? Number(user.urn) : null;
  const [all, setAll] = useState(null);
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState(null);
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [drawer, setDrawer] = useState(true);
  const [foreword, setForeword] = useState(null);
  const [fwBusy, setFwBusy] = useState(false);
  const [fwNote, setFwNote] = useState(null);
  const [saved, setSaved] = useState([]);
  const [keeping, setKeeping] = useState(false);

  useEffect(ensureMotionCss, []);
  useEffect(() => { getDataset().then(({ raw, ofsted }) => setAll(attachOfsted(raw, ofsted))); }, []);
  useEffect(() => { listReports(urn).then(setSaved).catch(() => {}); }, [urn]);
  /* a different report means the old foreword no longer speaks for it */
  useEffect(() => { setForeword(null); setFwNote(null); }, [scope, blocks]);

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
  function pick(c) {
    setScope(c.sc); setQ("");
    /* a filter implies its evidence: querying absence should show the attendance block */
    const sc = c.sc, want = [];
    if (sc.minAbs != null || sc.maxAbs != null || sc.minPA != null || sc.maxPA != null) want.push("attendance");
    if (sc.minSusp != null || sc.maxSusp != null || sc.maxPex != null) want.push("behaviour");
    if (sc.minDest != null || sc.maxDest != null || sc.minNotsust != null) want.push("destinations");
    if (/\b(league|by (local )?authorit|by trust|which (la|authorit|trust))/i.test(q)) want.push("league");
    if (want.length) setBlocks((b) => [...b, ...want.filter((w) => !b.includes(w))]);
  }

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

  function buildFindings() {
    if (!computed) return null;
    const { pri, ...england } = computed.bench;
    return {
      title: spec.title,
      scope: scopeLabel(scope, computed.schools.length),
      labels: computed.labels,
      phase: computed.phase,
      schools: computed.schools.length,
      vsSchools: computed.vsSchools ? computed.vsSchools.length : undefined,
      england,
      blocks: computed.blocks.map((b) => ({ type: b.type, ...slim(b.data), versus: b.vs ? slim(b.vs) : undefined })),
    };
  }

  async function askForeword() {
    if (!computed || fwBusy) return;
    setFwBusy(true); setFwNote(null);
    const findings = buildFindings();
    try {
      const r = await fetch("/.netlify/functions/prizm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foreword: true, findings }),
      });
      const data = await r.json();
      if (!r.ok || data.error || !data.foreword) throw new Error(data.error || "no foreword");
      const safe = verifyCommentary(data.foreword, findings);
      if (safe) setForeword(safe);
      else setFwNote("The reader's draft quoted a figure outside the computed findings, so it was set aside. Ask again.");
    } catch {
      setFwNote("The reader is out of reach just now; the report stands on its own.");
    }
    setFwBusy(false);
  }

  async function keep() {
    if (!computed || keeping) return;
    setKeeping(true);
    try {
      const r = await saveReport(urn, spec.title, { title: spec.title, scope, blocks: blocks.map((type) => ({ type })) });
      setSaved((s) => [r, ...s.filter((x) => x.id !== r.id)]);
    } catch { /* surfaced by the list staying unchanged */ }
    setKeeping(false);
  }

  function openSaved(r) {
    const s = r.spec || {};
    if (s.scope) setScope(s.scope);
    if (s.title) setTitle(s.title);
    if (Array.isArray(s.blocks) && s.blocks.length) setBlocks(s.blocks.map((b) => b.type).filter((t) => BLOCK_TYPES.some((k) => k.type === t)));
  }

  function download() {
    if (!computed) return;
    const blob = new Blob([reportHtml(spec, computed, foreword)], { type: "text/html;charset=utf-8" });
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
                {BLOCK_TYPES.map((b) => {
                  const pri = scope && scope.phase === "primary";
                  const desc = pri ? (KS2_DESCS[b.type] || b.desc) : b.desc;
                  const off = pri && b.type === "destinations";
                  return (
                    <label key={b.type} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "5px 0", cursor: off ? "default" : "pointer", opacity: off ? 0.45 : 1 }}>
                      <input type="checkbox" checked={!off && blocks.includes(b.type)} disabled={off} onChange={() => toggle(b.type)} style={{ marginTop: 2, accentColor: PURPLE }} />
                      <span style={{ fontSize: 12.5, color: INK }}><strong>{b.name}</strong><span style={{ color: MUTED }}> — {desc}</span></span>
                    </label>
                  );
                })}
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title the report (or let the reader)…"
                  style={{ width: "100%", boxSizing: "border-box", marginTop: 10, padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(34,18,51,.18)", fontSize: 13, background: PAPER }} />
              </div>

              {computed && (
                <div className="asi-rise" style={{ "--asi-d": "440ms", display: "grid", gap: 8 }}>
                  <button onClick={askForeword} disabled={fwBusy} style={{ border: "1px solid rgba(106,12,160,.3)", background: foreword ? "rgba(106,12,160,.06)" : "#fff", color: "#4B0875", borderRadius: 12, padding: "11px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: fwBusy ? 0.6 : 1 }}>
                    {fwBusy ? "The reader is writing…" : foreword ? "Rewrite the foreword" : "Have the reader write the foreword"}
                  </button>
                  {fwNote && <div style={{ fontSize: 11.5, color: "#8a4a00", lineHeight: 1.45 }}>{fwNote}</div>}
                  <button onClick={keep} disabled={keeping} style={{ border: "1px solid rgba(34,18,51,.2)", background: "#fff", color: INK, borderRadius: 12, padding: "11px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: keeping ? 0.6 : 1 }}>
                    {keeping ? "Keeping…" : "Keep in the vault"}
                  </button>
                  <button onClick={download} className="asi-lift" style={{ border: "none", background: PURPLE, color: "#fff", borderRadius: 12, padding: "13px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                    Download as a single HTML file
                  </button>
                </div>
              )}

              {saved.length > 0 && (
                <div className="asi-rise" style={{ ...panel, "--asi-d": "500ms" }}>
                  <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: MUTED, marginBottom: 8 }}>THE VAULT&apos;S REPORTS</div>
                  <div style={{ display: "grid", gap: 4, maxHeight: 220, overflowY: "auto" }}>
                    {saved.map((r) => (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => openSaved(r)} style={{ flex: 1, textAlign: "left", border: "1px solid rgba(34,18,51,.1)", background: "#fff", borderRadius: 9, padding: "7px 10px", cursor: "pointer", fontFamily: "inherit", minWidth: 0 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: INK, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</span>
                          <span style={{ fontSize: 10.5, color: MUTED }}>{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · recomputes on today&apos;s data</span>
                        </button>
                        <button onClick={() => { deleteReport(urn, r.id).then(() => setSaved((s) => s.filter((x) => x.id !== r.id))).catch(() => {}); }} title="Remove"
                          style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: 15, padding: 4 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="asi-rise" style={{ "--asi-d": "260ms" }}>
            {computed ? (
              <div className="pz-report" style={{ borderRadius: 4 }} dangerouslySetInnerHTML={{ __html: coverHtml(spec, computed) + forewordHtml(foreword) + renderBlocks(computed) }} />
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
