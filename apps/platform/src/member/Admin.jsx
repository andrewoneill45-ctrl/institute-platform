/* Accounts: the administrator's control panel. Add a member here (email and
   a first password, written straight to Supabase by the accounts function),
   choose what their account is, and switch each room on or off for them. */
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { supabase, DEMO } from "../lib/supabase.js";
import { getDatasetCore } from "../lib/dataset.js";
import { RoomIcon, ROOMS, TOOL_KEYS } from "./RoomIcons.jsx";

const INK = "#221233", MUTED = "#6F6580", PURPLE = "#6A0CA0", DEEP = "#4B0875", GOLD = "#C6A035", RED = "#B3261E", HAIR = "rgba(34,18,51,.14)";
const TYPES = [["school", "School"], ["trust", "Trust"], ["la", "Local authority"], ["diocese", "Diocese"], ["aepa", "AEPA"], ["system", "Whole system"]];
const TYPE_NAME = Object.fromEntries(TYPES);
const ORG_TYPES = ["trust", "la", "diocese", "aepa"];
const ROOM_BY_KEY = Object.fromEntries(ROOMS.map((r) => [r.key, r]));

/* a word the first password can be: readable, typeable, not guessable */
function firstPassword() {
  const words = ["orare", "laborare", "servire", "harbour", "meadow", "lantern", "quarry", "beacon", "summit", "copper", "willow", "ember", "marble", "saffron", "harvest", "compass"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  const a = pick(); let b = pick(); while (b === a) b = pick();
  return `${a[0].toUpperCase()}${a.slice(1)}-${b}-${Math.floor(10 + Math.random() * 90)}`;
}

/* the demonstration build has no Supabase: a sample list shows the room */
const DEMO_LIST = [
  { id: "d1", email: "a.oneill@allsaintscc.org.uk", full_name: "Andrew O'Neill", role_title: "Executive Headteacher", account_type: "school", urn: 100503, school_name: "All Saints Catholic College", is_admin: true, system_access: true, horizon_access: true, tools: {}, created_at: "2026-09-01", last_sign_in_at: new Date().toISOString() },
  { id: "d2", email: "dcs@camden.gov.uk", full_name: "Dawn Example", role_title: "Director of Children's Services", account_type: "la", org_name: "Camden", is_admin: false, system_access: false, horizon_access: true, tools: { lens: false, orbit: false, constellation: false }, created_at: "2026-10-02", last_sign_in_at: null },
  { id: "d3", email: "head@stmarys.demo", full_name: "Sam Example", role_title: "Headteacher", account_type: "school", urn: 100000, school_name: "St Mary's Demonstration School", is_admin: false, system_access: false, horizon_access: false, tools: {}, created_at: "2026-10-12", last_sign_in_at: "2026-10-20" },
];

async function callAccounts(payload) {
  if (DEMO || !supabase) throw new Error("This is the demonstration build; on the live platform this writes to Supabase.");
  const { data } = await supabase.auth.getSession();
  const token = data.session && data.session.access_token;
  const r = await fetch("/.netlify/functions/accounts", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` }, body: JSON.stringify(payload) });
  const out = await r.json().catch(() => ({}));
  if (!r.ok || out.error) throw new Error(out.error || `The accounts function answered ${r.status}.`);
  return out;
}

/* ── the editor, shared by "add" and "change" ── */
function blank() { return { email: "", password: firstPassword(), full_name: "", role_title: "", account_type: "school", org_name: "", urn: "", school_name: "", is_admin: false, system_access: false, horizon_access: false, tools: {} }; }
function fromAccount(a) {
  return { email: a.email || "", password: "", full_name: a.full_name || "", role_title: a.role_title || "", account_type: a.account_type || "school", org_name: a.org_name || "", urn: a.urn != null ? String(a.urn) : "", school_name: a.school_name || "", is_admin: a.is_admin === true, system_access: a.system_access === true, horizon_access: a.horizon_access === true, tools: a.tools && typeof a.tools === "object" ? { ...a.tools } : {} };
}

function Editor({ value, onChange, isNew, schools }) {
  const f = value, set = (k, v) => onChange({ ...f, [k]: v });
  const school = f.account_type === "school";
  const match = school && f.urn && schools ? schools.get(String(f.urn).trim()) : null;
  useEffect(() => { if (match && match.name !== f.school_name) onChange({ ...f, school_name: match.name }); }, [match && match.name]); // eslint-disable-line react-hooks/exhaustive-deps
  const toolOn = (k) => f.tools[k] !== false;
  const flip = (k) => set("tools", { ...f.tools, [k]: toolOn(k) ? false : true });
  return (
    <div className="ac-ed">
      <div className="ac-grid">
        {isNew && <label>Email<input value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@school.org.uk" autoComplete="off" /></label>}
        {isNew && (
          <label>First password
            <span className="ac-pw"><input value={f.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" /><button type="button" onClick={() => set("password", firstPassword())} title="Another">↻</button></span>
          </label>
        )}
        <label>Name<input value={f.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Full name" /></label>
        <label>Role<input value={f.role_title} onChange={(e) => set("role_title", e.target.value)} placeholder="Headteacher, CEO, Director of Children's Services…" /></label>
      </div>
      <div className="ac-sec">What the account is</div>
      <div className="ac-types">
        {TYPES.map(([v, l]) => <button key={v} type="button" className={f.account_type === v ? "on" : ""} onClick={() => set("account_type", v)}>{l}</button>)}
      </div>
      <div className="ac-grid" style={{ marginTop: 10 }}>
        {school && <label>URN<input value={f.urn} onChange={(e) => set("urn", e.target.value.replace(/[^\d]/g, ""))} placeholder="100503" inputMode="numeric" /><small>{match ? `${match.name}, ${match.la}` : f.urn ? "No school in the dataset has that URN" : "The DfE's six-digit number for the school"}</small></label>}
        {school && <label>School<input value={f.school_name} onChange={(e) => set("school_name", e.target.value)} placeholder="As the DfE styles it" /></label>}
        {ORG_TYPES.includes(f.account_type) && <label>{f.account_type === "trust" ? "Trust" : f.account_type === "la" ? "Local authority" : f.account_type === "diocese" ? "Diocese" : "Organisation"}<input value={f.org_name} onChange={(e) => set("org_name", e.target.value)} placeholder={f.account_type === "trust" ? "Harris Federation" : f.account_type === "la" ? "Camden" : f.account_type === "diocese" ? "Diocese of Westminster" : "AEPA"} /><small>Spelt as the DfE styles it, so the estate matches</small></label>}
        {f.account_type === "system" && <div className="ac-hint">A whole-system account sees England first; no school or organisation needed.</div>}
      </div>
      <div className="ac-sec">The rooms</div>
      <div className="ac-tools">
        {TOOL_KEYS.map((k) => (
          <button key={k} type="button" className={"ac-tool" + (toolOn(k) ? " on" : "")} onClick={() => flip(k)} aria-pressed={toolOn(k)}>
            <span className="ac-tool-i"><RoomIcon room={k} size={16} /></span>
            <span><b>{ROOM_BY_KEY[k].label}</b><small>{ROOM_BY_KEY[k].verb}</small></span>
            <span className="ac-sw"><i /></span>
          </button>
        ))}
        <button type="button" className={"ac-tool ac-tool-h" + (f.horizon_access || f.is_admin ? " on" : "")} onClick={() => !f.is_admin && set("horizon_access", !f.horizon_access)} aria-pressed={f.horizon_access || f.is_admin} disabled={f.is_admin}>
          <span className="ac-tool-i"><RoomIcon room="horizon" size={16} /></span>
          <span><b>Horizon</b><small>{f.is_admin ? "administrators always hold it" : "by invitation"}</small></span>
          <span className="ac-sw"><i /></span>
        </button>
      </div>
      <div className="ac-flags">
        <label><input type="checkbox" checked={f.is_admin} onChange={(e) => set("is_admin", e.target.checked)} />Administrator<small>manages accounts, holds every room</small></label>
        {school && <label><input type="checkbox" checked={f.system_access} onChange={(e) => set("system_access", e.target.checked)} />System view<small>sees England as well as the school</small></label>}
      </div>
    </div>
  );
}

/* ── one member ── */
function Member({ a, me, schools, onChanged }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(() => fromAccount(a));
  const [state, setState] = useState("");
  const [pw, setPw] = useState(null);
  useEffect(() => { setF(fromAccount(a)); }, [a]);
  const scope = a.account_type === "school" ? (a.school_name || (a.urn ? `URN ${a.urn}` : "no school yet")) : a.account_type === "system" ? "England" : a.org_name || "no organisation yet";
  const off = TOOL_KEYS.filter((k) => a.tools && a.tools[k] === false);

  async function save() {
    setState("Saving…");
    if (DEMO || !supabase) { setState("Saved."); setTimeout(() => setState(""), 2500); return; }
    const { error } = await supabase.rpc("admin_update_profile", {
      target: a.id, p_account_type: f.account_type,
      p_org_name: ORG_TYPES.includes(f.account_type) ? (f.org_name.trim() || null) : null,
      p_urn: f.account_type === "school" && f.urn.trim() !== "" && Number.isFinite(Number(f.urn)) ? Number(f.urn) : null,
      p_school_name: f.account_type === "school" ? (f.school_name.trim() || null) : null,
      p_full_name: f.full_name.trim() || null, p_role_title: f.role_title.trim() || null, p_is_admin: f.is_admin,
      p_system_access: f.system_access, p_horizon_access: f.horizon_access, p_tools: f.tools,
    });
    if (error) { setState(error.message); return; }
    setState("Saved."); onChanged(); setTimeout(() => setState(""), 2500);
  }
  async function newPassword() {
    const p = firstPassword();
    if (!window.confirm(`Set ${a.email} a new password?\n\n${p}\n\nIt is shown once more after it is set.`)) return;
    setState("Setting…");
    try { await callAccounts({ action: "password", id: a.id, password: p }); setPw(p); setState(""); } catch (e) { setState(e.message); }
  }
  async function remove() {
    if (!window.confirm(`Remove ${a.email} from the Institute? Their login and profile go; their kept reports and scenarios go with them.`)) return;
    setState("Removing…");
    try { await callAccounts({ action: "remove", id: a.id }); onChanged(); } catch (e) { setState(e.message); }
  }
  return (
    <div className={"ac-row" + (open ? " open" : "")}>
      <button className="ac-row-h" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="ac-av">{((a.full_name || a.email || "?").match(/\b[A-Za-z]/g) || ["?"]).slice(0, 2).join("").toUpperCase()}</span>
        <span className="ac-who"><b>{a.full_name || a.email}</b><small>{[a.role_title, a.email].filter(Boolean).join(" · ")}</small></span>
        <span className="ac-badge" data-t={a.account_type}>{TYPE_NAME[a.account_type] || a.account_type}</span>
        <span className="ac-scope">{scope}</span>
        <span className="ac-rooms">
          {TOOL_KEYS.map((k) => <i key={k} className={a.tools && a.tools[k] === false ? "off" : ""} title={`${ROOM_BY_KEY[k].label}${a.tools && a.tools[k] === false ? " (off)" : ""}`}><RoomIcon room={k} size={13} /></i>)}
          <i className={a.is_admin || a.horizon_access ? "gold" : "off"} title={`Horizon${a.is_admin || a.horizon_access ? "" : " (not held)"}`}><RoomIcon room="horizon" size={13} /></i>
          {a.is_admin && <em>admin</em>}
        </span>
        <span className="ac-when">{a.last_sign_in_at ? `signed in ${new Date(a.last_sign_in_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "never signed in"}</span>
        <span className="ac-car">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="ac-body">
          <Editor value={f} onChange={setF} schools={schools} />
          {pw && <div className="ac-pwnote">New password for {a.email}: <code>{pw}</code> <button type="button" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(pw); }}>copy</button></div>}
          <div className="ac-actions">
            <button className="ac-btn ac-btn-p" onClick={save}>Save changes</button>
            <button className="ac-btn" onClick={newPassword}>Set a new password</button>
            {a.id !== me && <button className="ac-btn ac-btn-d" onClick={remove}>Remove</button>}
            {state && <span className="ac-state" style={{ color: state === "Saved." ? "#2F7A39" : state.endsWith("…") ? MUTED : RED }}>{state}</span>}
            {off.length > 0 && !state && <span className="ac-state" style={{ color: MUTED }}>{off.map((k) => ROOM_BY_KEY[k].label).join(", ")} switched off</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── add a member ── */
function AddMember({ schools, onAdded, onClose }) {
  const [f, setF] = useState(blank);
  const [state, setState] = useState("");
  const [done, setDone] = useState(null);
  async function create() {
    setState("Creating…");
    try {
      const profile = {
        full_name: f.full_name.trim() || null, role_title: f.role_title.trim() || null, account_type: f.account_type,
        org_name: ORG_TYPES.includes(f.account_type) ? (f.org_name.trim() || null) : null,
        urn: f.account_type === "school" && f.urn.trim() && Number.isFinite(Number(f.urn)) ? Number(f.urn) : null,
        school_name: f.account_type === "school" ? (f.school_name.trim() || null) : null,
        is_admin: f.is_admin, system_access: f.system_access, horizon_access: f.horizon_access, tools: f.tools,
      };
      const r = await callAccounts({ action: "create", email: f.email, password: f.password, profile });
      setDone({ email: f.email.trim().toLowerCase(), password: f.password, warning: r.warning });
      setState(""); onAdded();
    } catch (e) { setState(e.message); }
  }
  return (
    <div className="ac-veil" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ac-modal" role="dialog" aria-label="Add a member">
        <div className="ac-modal-h"><div><div className="ac-kick">Accounts</div><h2>Add a member.</h2></div><button className="ac-x" onClick={onClose} aria-label="Close">×</button></div>
        {done ? (
          <div className="ac-done">
            <p>The account exists and can sign in now. Send these by whatever route you trust; the password is shown only here.</p>
            <div className="ac-cred"><span>Email</span><code>{done.email}</code><span>Password</span><code>{done.password}</code></div>
            <button className="ac-btn" onClick={() => navigator.clipboard && navigator.clipboard.writeText(`institute.school\nEmail: ${done.email}\nPassword: ${done.password}`)}>Copy both</button>
            {done.warning && <p className="ac-warn">{done.warning}</p>}
            <div className="ac-actions"><button className="ac-btn ac-btn-p" onClick={onClose}>Done</button><button className="ac-btn" onClick={() => { setDone(null); setF(blank()); }}>Add another</button></div>
          </div>
        ) : (
          <>
            <p className="ac-lead">Email and a first password go to Supabase Auth; everything else is the profile the rooms read. They can change their password from their profile once in.</p>
            <Editor value={f} onChange={setF} isNew schools={schools} />
            <div className="ac-actions">
              <button className="ac-btn ac-btn-p" onClick={create} disabled={state.endsWith("…")}>{state.endsWith("…") ? state : "Create the account"}</button>
              <button className="ac-btn" onClick={onClose}>Cancel</button>
              {state && !state.endsWith("…") && <span className="ac-state" style={{ color: RED }}>{state}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState(null);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [adding, setAdding] = useState(false);
  const [schools, setSchools] = useState(null);

  async function load() {
    if (DEMO || !supabase) { setAccounts(DEMO_LIST); return; }
    const { data, error } = await supabase.rpc("admin_list_accounts");
    if (error) setErr(error.message);
    else setAccounts(data || []);
  }
  useEffect(() => { if (user?.isAdmin) load(); }, [user?.isAdmin]);
  useEffect(() => { getDatasetCore().then(({ raw }) => setSchools(new Map(raw.map((s) => [String(s.urn), { name: s.name, la: s.la }])))).catch(() => {}); }, []);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (accounts || []).filter((a) => (!type || a.account_type === type) && (!t || [a.full_name, a.email, a.role_title, a.org_name, a.school_name].some((x) => (x || "").toLowerCase().includes(t))));
  }, [accounts, q, type]);
  const counts = useMemo(() => { const c = {}; (accounts || []).forEach((a) => { c[a.account_type] = (c[a.account_type] || 0) + 1; }); return c; }, [accounts]);

  if (!user?.isAdmin) return <div style={{ maxWidth: 680, margin: "0 auto", padding: "60px 0", textAlign: "center", color: MUTED, fontSize: 14 }}>The Accounts room belongs to administrators.</div>;

  return (
    <div className="ac-root">
      <style>{AC_CSS}</style>
      <div className="ac-head">
        <div>
          <div className="ac-kick">Administration</div>
          <h1>Accounts.</h1>
          <p className="ac-lead">Every member, what their account sees, and which rooms are open to them. Add someone here and they can sign in straight away.</p>
        </div>
        <button className="ac-btn ac-btn-p ac-add" onClick={() => setAdding(true)}>+ Add a member</button>
      </div>
      {err && <div className="ac-err">{err}</div>}
      {!err && (
        <>
          <div className="ac-bar">
            <input className="ac-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find by name, email, school or organisation…" />
            <div className="ac-filters">
              <button className={!type ? "on" : ""} onClick={() => setType("")}>All · {(accounts || []).length}</button>
              {TYPES.filter(([v]) => counts[v]).map(([v, l]) => <button key={v} className={type === v ? "on" : ""} onClick={() => setType(type === v ? "" : v)}>{l} · {counts[v]}</button>)}
            </div>
          </div>
          {accounts === null && <div className="ac-wait">Reading the member list…</div>}
          <div className="ac-list">
            {shown.map((a) => <Member key={a.id} a={a} me={user.id} schools={schools} onChanged={load} />)}
            {accounts && !shown.length && <div className="ac-wait">No member matches.</div>}
          </div>
        </>
      )}
      {adding && <AddMember schools={schools} onAdded={load} onClose={() => setAdding(false)} />}
    </div>
  );
}

const AC_CSS = `
.ac-root{max-width:1040px;margin:0 auto;padding:40px 0 80px;color:${INK}}
.ac-kick{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${GOLD};font-weight:700;margin-bottom:8px}
.ac-root h1{font-family:Fraunces,serif;font-weight:600;font-size:34px;letter-spacing:-.015em;margin:0 0 8px}
.ac-modal h2{font-family:Fraunces,serif;font-weight:600;font-size:26px;letter-spacing:-.015em;margin:0}
.ac-lead{font-size:13.5px;color:${MUTED};line-height:1.6;max-width:620px;margin:0}
.ac-head{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;flex-wrap:wrap}
.ac-add{white-space:nowrap}
.ac-err{background:#fff;border-radius:14px;padding:16px 18px;color:${RED};font-size:13px;margin-top:18px;box-shadow:0 1px 2px rgba(34,18,51,.04),0 12px 34px rgba(34,18,51,.07)}
.ac-bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:26px 0 14px}
.ac-search{flex:1 1 280px;font-family:inherit;font-size:13.5px;padding:10px 14px;border-radius:12px;border:1px solid ${HAIR};background:#fff;color:${INK}}
.ac-filters{display:flex;gap:6px;flex-wrap:wrap}
.ac-filters button{font-family:inherit;font-size:12px;font-weight:600;border:1px solid ${HAIR};background:#fff;color:${MUTED};border-radius:999px;padding:7px 13px;cursor:pointer}
.ac-filters button.on{background:${INK};color:#fff;border-color:${INK}}
.ac-wait{color:${MUTED};font-size:13.5px;padding:24px 4px}
.ac-list{display:grid;gap:10px}
.ac-row{background:#fff;border-radius:16px;box-shadow:0 1px 2px rgba(34,18,51,.04),0 12px 34px rgba(34,18,51,.07);overflow:hidden}
.ac-row.open{box-shadow:0 1px 2px rgba(34,18,51,.04),0 18px 50px rgba(34,18,51,.12)}
.ac-row-h{display:grid;grid-template-columns:38px minmax(160px,1.3fr) auto minmax(120px,1fr) auto auto 16px;gap:14px;align-items:center;width:100%;text-align:left;font-family:inherit;border:none;background:transparent;padding:13px 16px;cursor:pointer;color:${INK}}
.ac-row-h:hover{background:rgba(106,12,160,.03)}
.ac-av{width:38px;height:38px;border-radius:50%;background:${DEEP};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:700}
.ac-who b{display:block;font-size:14px}.ac-who small{display:block;font-size:11.5px;color:${MUTED};margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ac-badge{font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:4px 9px;background:rgba(106,12,160,.08);color:${DEEP};white-space:nowrap}
.ac-badge[data-t="system"]{background:rgba(198,160,53,.16);color:#8a6d1c}.ac-badge[data-t="la"],.ac-badge[data-t="trust"],.ac-badge[data-t="diocese"],.ac-badge[data-t="aepa"]{background:rgba(62,95,138,.1);color:#3E5F8A}
.ac-scope{font-size:12.5px;color:${MUTED};overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ac-rooms{display:inline-flex;gap:4px;align-items:center}
.ac-rooms i{display:inline-flex;width:24px;height:24px;border-radius:7px;align-items:center;justify-content:center;background:rgba(106,12,160,.08);color:${PURPLE}}
.ac-rooms i.off{background:rgba(34,18,51,.05);color:rgba(34,18,51,.25)}.ac-rooms i.gold{background:rgba(198,160,53,.18);color:#8a6d1c}
.ac-rooms em{font-style:normal;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${GOLD};margin-left:4px}
.ac-when{font-size:11px;color:${MUTED};white-space:nowrap}
.ac-car{color:${MUTED};font-size:12px}
.ac-body{padding:4px 18px 18px;border-top:1px solid rgba(34,18,51,.06)}
.ac-ed{margin-top:14px}
.ac-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.ac-grid label,.ac-flags label{display:grid;gap:5px;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}}
.ac-grid input{font-family:inherit;font-size:13px;padding:9px 12px;border-radius:10px;border:1px solid ${HAIR};background:#FBFAF7;color:${INK};letter-spacing:0;text-transform:none;font-weight:500;width:100%;box-sizing:border-box}
.ac-grid small{font-size:11px;font-weight:500;letter-spacing:0;text-transform:none;color:${MUTED}}
.ac-pw{display:flex;gap:6px}.ac-pw input{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.ac-pw button{font-family:inherit;border:1px solid ${HAIR};background:#fff;border-radius:10px;padding:0 12px;cursor:pointer;color:${DEEP};font-size:15px}
.ac-hint{font-size:12.5px;color:${MUTED};align-self:end;padding:10px 0}
.ac-sec{font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${GOLD};margin:18px 0 8px}
.ac-types{display:flex;gap:6px;flex-wrap:wrap}
.ac-types button{font-family:inherit;font-size:12.5px;font-weight:600;border:1px solid ${HAIR};background:#fff;color:${INK};border-radius:999px;padding:7px 14px;cursor:pointer}
.ac-types button.on{background:${PURPLE};border-color:${PURPLE};color:#fff}
.ac-tools{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}
.ac-tool{display:grid;grid-template-columns:30px 1fr auto;gap:10px;align-items:center;text-align:left;font-family:inherit;border:1px solid ${HAIR};background:#FBFAF7;border-radius:12px;padding:9px 12px;cursor:pointer;color:${INK};opacity:.72;transition:all .18s}
.ac-tool.on{background:#fff;opacity:1;border-color:rgba(106,12,160,.3)}
.ac-tool:disabled{cursor:default}
.ac-tool-i{display:inline-flex;width:30px;height:30px;border-radius:9px;align-items:center;justify-content:center;background:rgba(106,12,160,.08);color:${PURPLE}}
.ac-tool-h.on .ac-tool-i{background:rgba(198,160,53,.18);color:#8a6d1c}
.ac-tool b{display:block;font-size:13px}.ac-tool small{display:block;font-size:10.5px;color:${MUTED}}
.ac-sw{width:34px;height:20px;border-radius:999px;background:rgba(34,18,51,.18);position:relative;transition:background .18s}
.ac-sw i{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .18s;box-shadow:0 1px 2px rgba(0,0,0,.2)}
.ac-tool.on .ac-sw{background:${PURPLE}}.ac-tool-h.on .ac-sw{background:${GOLD}}.ac-tool.on .ac-sw i{left:16px}
.ac-flags{display:flex;gap:22px;flex-wrap:wrap;margin-top:16px}
.ac-flags label{grid-template-columns:auto auto;align-items:center;gap:8px;font-size:12.5px;letter-spacing:0;text-transform:none;color:${INK};cursor:pointer}
.ac-flags label small{grid-column:2;font-size:11px;font-weight:500;color:${MUTED}}
.ac-flags input{accent-color:${PURPLE};width:16px;height:16px}
.ac-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:18px}
.ac-btn{font-family:inherit;font-size:12.5px;font-weight:600;border:1px solid ${HAIR};background:#fff;color:${INK};border-radius:999px;padding:9px 18px;cursor:pointer}
.ac-btn-p{background:${PURPLE};border-color:${PURPLE};color:#fff}.ac-btn-d{color:${RED};border-color:rgba(179,38,30,.3)}
.ac-btn:disabled{opacity:.6;cursor:default}
.ac-state{font-size:12.5px}
.ac-pwnote{margin-top:14px;font-size:12.5px;background:rgba(198,160,53,.12);border:1px solid rgba(198,160,53,.4);border-radius:10px;padding:10px 12px}
.ac-pwnote code,.ac-cred code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;background:#fff;border-radius:6px;padding:2px 7px}
.ac-pwnote button{margin-left:8px;font-family:inherit;font-size:11.5px;border:none;background:transparent;color:${DEEP};text-decoration:underline;cursor:pointer}
.ac-veil{position:fixed;inset:0;z-index:1000;background:rgba(34,18,51,.34);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding:6vh 16px 16px;overflow:auto}
.ac-modal{background:#FBFAF7;border-radius:22px;max-width:860px;width:100%;padding:26px 28px 24px;box-shadow:0 30px 90px rgba(34,18,51,.3)}
.ac-modal-h{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}
.ac-x{border:none;background:#fff;border-radius:999px;width:34px;height:34px;font-size:20px;color:${MUTED};cursor:pointer;box-shadow:0 1px 2px rgba(34,18,51,.08)}
.ac-done p{font-size:13.5px;color:${MUTED};line-height:1.6}
.ac-cred{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;align-items:center;background:#fff;border-radius:14px;padding:16px 18px;margin:10px 0 12px;font-size:12px;color:${MUTED};font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.ac-cred code{font-size:15px;color:${INK};letter-spacing:0;text-transform:none;background:#FBFAF7}
.ac-warn{color:${RED}}
@media (max-width:800px){.ac-row-h{grid-template-columns:38px 1fr auto 16px}.ac-scope,.ac-rooms,.ac-when{display:none}}
`;
