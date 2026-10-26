/* The reading desk, as Lens meets it: a sheet over the room. Any file in;
   each passes the same stages as in Constellation (opened on the device,
   privacy checked, interrogated, your word, filed) and leaves as evidence
   that knows what it is, what it says and where it belongs. */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { extract, MAX_BYTES } from "../lib/reading/extract.js";
import { profileTable } from "../lib/reading/profile.js";
import { askDesk, documentPayload, isPupilLevel, tableAsDocument } from "../lib/reading/desk.js";
import { DeskStages, DeskQuestion, DocumentReading } from "../lib/reading/DeskUI.jsx";

const OFSTED_AREAS = ["Inclusion", "Curriculum and teaching", "Achievement", "Attendance and behaviour", "Personal development and well-being", "Leadership and governance", "Safeguarding"];
const S48_AREAS = ["Catholic life and mission", "Religious education", "Collective worship"];
const kb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const uid = () => "c" + Math.random().toString(36).slice(2, 9);

export default function ReadingDesk({ config, onClose, onFiled }) {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [over, setOver] = useState(false);
  const [note, setNote] = useState("");
  const inputRef = useRef(null);
  const room = config.room === "s48" ? "s48" : "library";
  const labels = config.labels && config.labels.length ? config.labels : ["Other evidence"];
  const areas = room === "s48" ? S48_AREAS : OFSTED_AREAS;
  const patch = (id, p) => setCards((cur) => cur.map((c) => (c.id === id ? { ...c, ...(typeof p === "function" ? p(c) : p) } : c)));

  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  async function take(files) {
    const fresh = [...files].map((f) => ({ id: uid(), file: f, stage: "open", busy: true, note }));
    setCards((cur) => [...fresh, ...cur]);
    setNote("");
    for (const c of fresh) open(c);
  }

  async function open(c) {
    const rd = await extract(c.file);
    if (rd.kind === "unsupported") return patch(c.id, { stage: "open", busy: false, failed: true, status: "bad", rd, message: `Not read: ${rd.note}.` });
    if (rd.kind === "scan") return patch(c.id, { stage: "open", busy: false, status: "stop", rd, message: `${rd.note ? rd.note[0].toUpperCase() + rd.note.slice(1) : "A scan"}. Its pages are pictures, so there are no words to read yet. You can still store it as evidence.` });
    let doc = rd;
    if (rd.kind === "table") {
      const pupil = rd.tables.some((t) => isPupilLevel(profileTable(t, { fileName: rd.name })));
      if (pupil) return patch(c.id, { stage: "privacy", busy: false, status: "pupil", rd, message: "This is live pupil data: one row per child, with names or UPNs. The desk will not send it, and it belongs in Constellation, which matches every row to a child on the roll. Results by year and survey figures, with no child named, read here." });
      doc = tableAsDocument(rd);
    }
    const prep = documentPayload(doc, { labels, areas, note: c.note });
    const base = { rd: doc, prep, words: prep.payload.pages.reduce((a, p) => a + p.text.length, 0) };
    if (!base.words) return patch(c.id, { ...base, stage: "privacy", busy: false, status: "stop", message: "There are no words in this file to read. You can still store it as evidence." });
    if (prep.names.likely) return patch(c.id, { ...base, stage: "privacy", busy: false, status: "names", message: `This document seems to name pupils (${prep.names.pairs} name-like pairs alongside words such as pupil and Year). If you send it, the reading desk will see those names; it is told never to repeat them, and nothing is stored. UPNs, emails, phone numbers and postcodes are removed either way.` });
    patch(c.id, base);
    interrogate({ ...c, ...base });
  }

  async function interrogate(c) {
    patch(c.id, { stage: "read", busy: true, status: null, failed: false, message: null });
    const res = await askDesk(c.prep.payload);
    if (!res || res.error || !res.reading) return patch(c.id, { stage: "read", busy: false, failed: true, status: "bad", message: `The reading desk could not read it (${(res && res.error) || "no answer"}).`, retry: true });
    const r = res.reading;
    patch(c.id, { stage: "word", busy: false, ai: r, label: labels.includes(r.label) ? r.label : labels[labels.length - 1], tagged: r.areas || [], answers: {}, title: r.title });
  }

  function file(c, readIt) {
    const r = readIt ? c.ai : null;
    const unit = c.rd && c.rd.unit;
    const item = {
      name: c.file.name,
      label: c.label || labels[labels.length - 1],
      size: c.file.size,
      date: new Date().toLocaleDateString("en-GB"),
      read: r ? {
        desk: true, ai: true, unit, pages: (c.rd.pages || []).length, chars: c.words,
        reading: { ...r, title: c.title || r.title, areas: c.tagged, answers: c.answers || {} },
        withheld: c.prep && c.prep.withheld.length ? c.prep.withheld : undefined,
        ...(r.series && r.series.length ? { series: r.series.map((s) => ({ label: s.label, years: s.years, vals: s.vals })), summary: r.summary } : {}),
      } : { note: c.status === "pupil" ? "live pupil data, kept unread: it belongs in Constellation" : c.status === "names" ? "kept unread: it names pupils" : c.status === "stop" ? "stored as it is: no words to read" : "stored only" },
    };
    onFiled(room, item, URL.createObjectURL(c.file), c.file);
    patch(c.id, { stage: "filed", busy: false, filed: true, status: "done" });
  }

  const answer = (c, q, v) => patch(c.id, (x) => ({ answers: { ...(x.answers || {}), [q.text]: v } }));
  const toggleArea = (c, a) => patch(c.id, (x) => ({ tagged: (x.tagged || []).includes(a) ? x.tagged.filter((t) => t !== a) : [...(x.tagged || []), a] }));

  return (
    <div className="rdesk-veil" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="presentation">
      <div className="rdesk" role="dialog" aria-modal="true" aria-label="The reading desk">
        <div className="rdesk-h">
          <div>
            <h2>The reading desk</h2>
            <p>Bring any file: Word, PDF, PowerPoint, Excel or CSV. It is opened on this device, checked for anything that could identify a child, read closely, and set before you to confirm before it is filed in {room === "s48" ? "the Section 48 vault" : "the Library"}.</p>
          </div>
          <button className="rdesk-x" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className={`rdesk-drop${over ? " over" : ""}`} onClick={() => inputRef.current && inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) take(e.dataTransfer.files); }}>
          <b>Drop files here, or choose them</b>
          <small>Up to {MAX_BYTES / 1048576} MB each &middot; .docx .pdf .pptx .xlsx .csv .txt</small>
          <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={(e) => { if (e.target.files.length) take(e.target.files); e.target.value = ""; }} />
        </div>
        <input className="rdesk-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional: a word about the next file, e.g. “the 2025 SEF, final version”" />

        {cards.map((c) => (
          <div key={c.id} className={`rdesk-card${c.status === "done" ? " done" : c.status === "pupil" || c.status === "names" || c.status === "stop" ? " stop" : c.status === "bad" ? " bad" : ""}`}>
            <div className="rdesk-file"><span>{c.file.name}</span><small>{kb(c.file.size)}{c.rd && c.rd.pages ? ` · ${c.rd.pages.length} ${c.rd.unit || "page"}${c.rd.pages.length === 1 ? "" : "s"}` : ""}</small></div>
            <DeskStages stage={c.stage} busy={c.busy} failed={c.failed} />
            {c.busy && c.stage === "read" && <div className="desk-panel busy"><span className="desk-spin" aria-hidden="true" />Reading {c.words ? `${Math.round(c.words / 1000)}k characters` : "it"} closely: what it is, what it says, the figures it states. A long document takes up to a minute.</div>}
            {c.busy && c.stage === "open" && <div className="desk-panel busy"><span className="desk-spin" aria-hidden="true" />Opening it on this device&hellip;</div>}
            {c.message && <div className={`desk-panel${c.status === "bad" ? " warn" : ""}`}>{c.message}</div>}
            {c.prep && c.prep.withheld.length > 0 && c.stage !== "filed" && <div className="desk-priv">Withheld from the desk: {c.prep.withheld.map((w) => `${w.name} (${w.rows} rows naming pupils)`).join("; ")}.</div>}

            {c.ai && !c.filed && (
              <>
                <div className="desk-panel" style={{ background: "#fff", padding: "14px 2px 4px" }}>
                  <DocumentReading r={{ ...c.ai, title: c.title }} unit={c.rd.unit} />
                </div>
                {c.ai.cautions?.map((t, i) => <div key={i} className="desk-note gold" style={{ fontSize: 12.5 }}>{t}</div>)}
                {(c.ai.questions || []).filter((q) => !(c.answers || {})[q.text]).map((q) => <DeskQuestion key={q.id} q={q} onAnswer={(qq, v) => answer(c, qq, v)} />)}
                {Object.keys(c.answers || {}).length > 0 && <div className="desk-priv">Your answers: {Object.entries(c.answers).map(([q, a]) => `${a}`).join(" · ")} (filed with the reading)</div>}
                <div className="rdesk-row">
                  <label>Title <input className="rdesk-note" style={{ marginTop: 0, width: 300 }} value={c.title || ""} onChange={(e) => patch(c.id, { title: e.target.value })} /></label>
                  <label>File under <select value={c.label} onChange={(e) => patch(c.id, { label: e.target.value })}>{labels.map((l) => <option key={l}>{l}</option>)}</select></label>
                </div>
                <div className="rdesk-row"><span style={{ color: "#6F6580" }}>Evidences</span>{areas.map((a) => (
                  <button key={a} onClick={() => toggleArea(c, a)} className="rdesk-chip" style={{ border: "none", cursor: "pointer", opacity: (c.tagged || []).includes(a) ? 1 : 0.45 }}>{(c.tagged || []).includes(a) ? "✓ " : ""}{a}</button>
                ))}</div>
              </>
            )}

            {!c.filed && !c.busy && (
              <div className="rdesk-btns">
                {c.ai && <button className="rdesk-go" onClick={() => file(c, true)}>File it with its reading</button>}
                {c.status === "names" && <button className="rdesk-go" onClick={() => interrogate(c)}>Read it anyway</button>}
                {c.retry && <button className="rdesk-go" onClick={() => interrogate(c)}>Try again</button>}
                {c.status === "pupil" && <button className="rdesk-go" onClick={() => { onClose(); navigate("/members/constellation"); }}>Open Constellation</button>}
                {!c.ai && (c.status === "pupil" || c.status === "names" || c.status === "stop" || c.status === "bad") && c.rd && c.rd.kind !== "unsupported" && <button className="rdesk-alt" onClick={() => file(c, false)}>Store it without reading</button>}
                <button className="rdesk-alt" onClick={() => setCards((cur) => cur.filter((x) => x.id !== c.id))}>Set aside</button>
              </div>
            )}
            {c.filed && <div className="desk-note" style={{ marginTop: 10 }}>Filed under <b>{c.label || "Other evidence"}</b>{c.ai ? ", with its reading. Ask can now cite it." : "."}</div>}
          </div>
        ))}

        <div className="rdesk-foot">Pupil-level tables never leave this device; the desk sees their structure only. Documents are sent as their words, with UPNs, emails, phone numbers and postcodes removed, and nothing is kept by the desk once it has answered. Every figure it reports is checked against the page it cites.</div>
      </div>
    </div>
  );
}
