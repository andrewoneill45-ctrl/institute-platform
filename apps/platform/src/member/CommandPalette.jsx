/* The command palette: ⌘K anywhere in the members' area. One box that finds
   any school, trust or place in England, jumps to any room, and hands a whole
   question to Prizm. Keyboard first, honest about what it found, and fast:
   the dataset's slim core loads only the first time it opens. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDatasetCore } from "../lib/dataset.js";
import { searchEntities } from "./prizm/engine.js";
import { RoomIcon, roomsFor } from "./RoomIcons.jsx";

const RECENT_KEY = "asi-palette-recent";
const readRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, 5); } catch { return []; } };
const writeRecent = (it) => {
  try {
    const keep = readRecent().filter((r) => r.href !== it.href);
    localStorage.setItem(RECENT_KEY, JSON.stringify([{ label: it.label, sub: it.sub, href: it.href, icon: it.icon }, ...keep].slice(0, 5)));
  } catch { /* storage may be off: recents are a convenience */ }
};
const specHref = (scope, blocks) => `/members/prizm?spec=${encodeURIComponent(JSON.stringify(blocks ? { scope, blocks } : { scope }))}`;
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const looksLikeQuestion = (t) => /\?\s*$/.test(t) || (/^(which|what|where|who|how|why|show|compare|tell|give|rank|find)\b/i.test(t) && t.split(/\s+/).length >= 4);

/* schools by name across both phases: every word typed must appear */
function findSchools(rows, q) {
  const words = norm(q).split(" ").filter((w) => w.length >= 2);
  if (!words.length) return [];
  const out = [];
  for (const s of rows) {
    const n = norm(s.name);
    if (!n || !words.every((w) => n.includes(w))) continue;
    const score = (n.startsWith(words[0]) ? 2 : 0) + (n === norm(q) ? 5 : 0) - n.length / 200;
    out.push({ s, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 6).map((x) => x.s);
}

export default function CommandPalette({ open, onClose, user }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [rows, setRows] = useState(null);
  const [recent, setRecent] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQ(""); setSel(0); setRecent(readRecent());
    const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 20);
    if (!rows) getDatasetCore().then(({ raw }) => setRows(raw)).catch(() => setRows([]));
    return () => clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* every row the palette offers, grouped, in the order a member would want */
  const groups = useMemo(() => {
    const text = q.trim();
    const g = [];
    const rooms = [...roomsFor(user),
      { key: "profile", to: "/members/profile", label: "Your profile", verb: "Account and school details", kw: "profile account settings me" },
      ...(user && user.isAdmin ? [{ key: "accounts", to: "/members/admin", label: "Accounts", verb: "Members and access", kw: "admin accounts users members access" }] : []),
    ];
    if (!text) {
      if (recent.length) g.push({ name: "Recent", items: recent.map((r) => ({ ...r, icon: r.icon || "recent", kind: "recent" })) });
      g.push({ name: "Go to", items: rooms.map((r) => ({ label: r.label, sub: r.verb, href: r.to, icon: r.key, kind: "room" })) });
      g.push({ name: "Try asking Prizm", items: [
        "Which London schools have the highest EHCP shares?",
        "Catholic secondaries in the north east against London",
        "How have United Learning's year groups changed?",
      ].map((t) => ({ label: t, sub: "Opens a composed report", href: `/members/prizm?ask=${encodeURIComponent(t)}`, icon: "ask", kind: "ask" })) });
      return g;
    }
    const nq = norm(text);
    const roomHits = rooms.filter((r) => norm(r.label).startsWith(nq) || (nq.length >= 3 && (norm(r.label).includes(nq) || r.kw.includes(nq))));
    const question = looksLikeQuestion(text);
    const ask = { label: `Ask Prizm: “${text.length > 70 ? text.slice(0, 70) + "…" : text}”`, sub: "The reader composes a report from your words", href: `/members/prizm?ask=${encodeURIComponent(text)}`, icon: "ask", kind: "ask" };
    if (question) g.push({ name: "Ask", items: [ask] });
    if (roomHits.length) g.push({ name: "Rooms", items: roomHits.map((r) => ({ label: r.label, sub: r.verb, href: r.to, icon: r.key, kind: "room" })) });
    if (rows && rows.length && !question && text.length >= 2) {
      const schools = findSchools(rows, text);
      if (schools.length) g.push({ name: "Schools", items: schools.map((s) => ({
        label: s.name, sub: [s.phase, s.la].filter(Boolean).join(" · "), icon: "school", kind: "school",
        href: `/members/prizm?school=${encodeURIComponent(s.urn)}`, alt: { label: "Map", href: `/members/atlas?urn=${encodeURIComponent(s.urn)}` },
      })) });
      let ents = null;
      try { ents = searchEntities(rows, text); } catch { ents = null; }
      if (ents) {
        const places = [];
        (ents.composed || []).slice(0, 2).forEach((c) => places.push({ label: c.label.replace(/ · \d+ schools?$/, ""), sub: `${c.n} school${c.n === 1 ? "" : "s"} · a composed report`, href: specHref(c.sc), icon: "ask", kind: "scope" }));
        (ents.trusts || []).slice(0, 3).forEach((t) => places.push({ label: t.name, sub: `Trust · ${t.n} school${t.n === 1 ? "" : "s"}`, href: specHref({ type: "trust", name: t.name }), icon: "trust", kind: "scope" }));
        (ents.las || []).slice(0, 3).forEach((l) => places.push({ label: l.name, sub: `Local authority · ${l.n} schools`, href: specHref({ type: "la", name: l.name }), icon: "place", kind: "scope" }));
        (ents.regions || []).slice(0, 2).forEach((r) => places.push({ label: r.name, sub: `Region · ${r.n} schools`, href: specHref({ type: "region", name: r.name }), icon: "place", kind: "scope" }));
        (ents.towns || []).slice(0, 2).forEach((t) => places.push({ label: t.name, sub: `Town · ${t.n} schools`, href: specHref({ type: "town", name: t.name }), icon: "place", kind: "scope" }));
        (ents.pcons || []).slice(0, 2).forEach((p) => places.push({ label: p.name, sub: `Constituency · ${p.n} schools`, href: specHref({ type: "pcon", name: p.name }), icon: "place", kind: "scope" }));
        const seen = new Set();
        const uniq = places.filter((p) => (seen.has(p.href) ? false : seen.add(p.href)));
        if (uniq.length) {
          const grp = { name: "Trusts and places", items: uniq.slice(0, 7) };
          /* a trust or place whose name begins with exactly what was typed leads */
          const leads = norm(uniq[0].label).startsWith(nq) && !(g.find((x) => x.name === "Schools") || { items: [] }).items.some((s) => norm(s.label) === nq);
          const si = g.findIndex((x) => x.name === "Schools");
          if (leads && si >= 0) g.splice(si, 0, grp); else g.push(grp);
        }
      }
    }
    if (!question) g.push({ name: "Ask", items: [ask] });
    return g;
  }, [q, rows, recent, user]);

  const flat = useMemo(() => groups.flatMap((gr) => gr.items), [groups]);
  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => {
    const el = listRef.current && listRef.current.querySelector(`[data-i="${sel}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const go = (it, useAlt) => {
    const target = useAlt && it.alt ? { ...it, href: it.alt.href, sub: `On the map · ${it.sub}`, icon: "atlas" } : it;
    if (target.kind !== "recent") writeRecent(target);
    onClose();
    /* a palette jump always lands fresh, even inside the room already open */
    navigate(target.href, { state: { palette: Date.now() } });
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const it = flat[sel]; if (it) go(it, e.shiftKey); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  if (!open) return null;
  let i = -1;
  return (
    <div className="cmdk-veil" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="presentation">
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Search and jump">
        <div className="cmdk-in">
          <RoomIcon room="search" size={19} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Search any school, trust or place, jump to a room, or ask a question"
            aria-label="Search" role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-activedescendant={flat[sel] ? `cmdk-${sel}` : undefined} />
          <kbd onClick={onClose}>esc</kbd>
        </div>
        <div className="cmdk-list" id="cmdk-list" ref={listRef} role="listbox">
          {q.trim().length >= 2 && !rows && <div className="cmdk-wait">The national dataset is arriving&hellip;</div>}
          {groups.map((gr) => (
            <div key={gr.name} className="cmdk-group">
              <div className="cmdk-gname">{gr.name}</div>
              {gr.items.map((it) => {
                i += 1;
                const idx = i;
                return (
                  <div key={gr.name + it.href} id={`cmdk-${idx}`} data-i={idx} role="option" aria-selected={idx === sel}
                    className={`cmdk-item${idx === sel ? " on" : ""}`} onMouseMove={() => sel !== idx && setSel(idx)} onClick={() => go(it)}>
                    <span className="cmdk-ico"><RoomIcon room={it.icon} size={17} /></span>
                    <span className="cmdk-txt"><b>{it.label}</b>{it.sub && <small>{it.sub}</small>}</span>
                    {it.alt && <button className="cmdk-alt" onClick={(e) => { e.stopPropagation(); go(it, true); }} title="Open on the Atlas map (Shift+Enter)">{it.alt.label}</button>}
                    {idx === sel && <span className="cmdk-enter" aria-hidden="true">&#8629;</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="cmdk-foot">
          <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> to move</span>
          <span><kbd>&#8629;</kbd> to open</span>
          <span><kbd>shift</kbd><kbd>&#8629;</kbd> school on the map</span>
          <span className="cmdk-brand">Every figure from the DfE&rsquo;s published data</span>
        </div>
      </div>
    </div>
  );
}
