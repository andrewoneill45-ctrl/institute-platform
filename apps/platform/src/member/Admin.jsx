/* Accounts — the administrator's room. Every member, and what their account
   can see: School, Whole system, Trust, Local authority, Diocese or AEPA.
   Creating a login still happens in Supabase (Authentication → Add user);
   everything after that happens here. */
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { supabase, DEMO } from "../lib/supabase.js";

const INK = "#221233", MUTED = "#6F6580", HAIR = "rgba(34,18,51,.14)";
const card = { background: "#fff", borderRadius: 18, boxShadow: "0 1px 2px rgba(34,18,51,.04), 0 18px 50px rgba(34,18,51,.09)", padding: "22px 24px" };
const field = { boxSizing: "border-box", padding: "8px 11px", borderRadius: 9, border: `1px solid ${HAIR}`, fontSize: 12.5, background: "#FBFAF7", fontFamily: "inherit" };
const TYPES = [["school", "School"], ["system", "Whole system"], ["trust", "Trust"], ["la", "Local authority"], ["diocese", "Diocese"], ["aepa", "AEPA"]];

function Row({ a, onSaved }) {
  const [t, setT] = useState(a.account_type || "school");
  const [org, setOrg] = useState(a.org_name || "");
  const [urn, setUrn] = useState(a.urn != null ? String(a.urn) : "");
  const [school, setSchool] = useState(a.school_name || "");
  const [name, setName] = useState(a.full_name || "");
  const [role, setRole] = useState(a.role_title || "");
  const [admin, setAdmin] = useState(a.is_admin === true);
  const [sysView, setSysView] = useState(a.system_access === true);
  const [horizon, setHorizon] = useState(a.horizon_access === true);
  const [state, setState] = useState("");

  async function save() {
    setState("Saving…");
    const { error } = await supabase.rpc("admin_update_profile", {
      target: a.id, p_account_type: t,
      p_org_name: ["trust", "la", "diocese", "aepa"].includes(t) ? (org.trim() || null) : null,
      p_urn: t === "school" && urn.trim() !== "" && Number.isFinite(Number(urn)) ? Number(urn) : null,
      p_school_name: t === "school" ? (school.trim() || null) : null,
      p_full_name: name.trim() || null, p_role_title: role.trim() || null, p_is_admin: admin,
      p_system_access: sysView,
      p_horizon_access: horizon,
    });
    if (error) { setState(error.message); return; }
    setState("Saved."); onSaved && onSaved();
    setTimeout(() => setState(""), 2500);
  }

  return (
    <div style={{ ...card, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16.5, color: INK }}>{a.full_name || a.email}</span>
        <span style={{ fontSize: 12, color: MUTED }}>{a.email}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: MUTED }}>joined {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8 }}>
        <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", color: MUTED }}>TYPE
          <select style={field} value={t} onChange={(e) => setT(e.target.value)}>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        {t === "school" && (
          <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", color: MUTED }}>URN
            <input style={field} value={urn} onChange={(e) => setUrn(e.target.value)} placeholder="100503" />
          </label>
        )}
        {t === "school" && (
          <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", color: MUTED }}>SCHOOL
            <input style={field} value={school} onChange={(e) => setSchool(e.target.value)} placeholder="All Saints Catholic College" />
          </label>
        )}
        {["trust", "la", "diocese", "aepa"].includes(t) && (
          <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", color: MUTED }}>ORGANISATION
            <input style={field} value={org} onChange={(e) => setOrg(e.target.value)} placeholder={t === "trust" ? "Trust name as the DfE styles it" : t === "la" ? "Local authority name" : "Organisation"} />
          </label>
        )}
        <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", color: MUTED }}>NAME
          <input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", color: MUTED }}>ROLE
          <input style={field} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role title" />
        </label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: INK, fontWeight: 600, cursor: "pointer" }}>
          <input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} style={{ accentColor: "#6A0CA0" }} />
          Administrator
        </label>
        {t === "school" && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: INK, fontWeight: 600, cursor: "pointer" }}>
            <input type="checkbox" checked={sysView} onChange={(e) => setSysView(e.target.checked)} style={{ accentColor: "#6A0CA0" }} />
            System view
            <span style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>sees England as well as the school</span>
          </label>
        )}
        <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: INK, fontWeight: 600, cursor: "pointer" }}>
          <input type="checkbox" checked={horizon || admin} disabled={admin} onChange={(e) => setHorizon(e.target.checked)} style={{ accentColor: "#C6A035" }} />
          Horizon
          <span style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>{admin ? "administrators always have it" : "forecasts and policy levers"}</span>
        </label>
        <button onClick={save} style={{ marginLeft: "auto", border: "none", background: "#6A0CA0", color: "#fff", borderRadius: 999, padding: "8px 18px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
        {state && <span style={{ fontSize: 12, color: state === "Saved." ? "#2F7A39" : "#B3261E" }}>{state}</span>}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState(null);
  const [err, setErr] = useState(null);

  async function load() {
    if (DEMO || !supabase) { setErr("The Accounts room works on the live platform, where Supabase holds the members."); return; }
    const { data, error } = await supabase.rpc("admin_list_accounts");
    if (error) setErr(error.message);
    else setAccounts(data || []);
  }
  useEffect(() => { if (user?.isAdmin) load(); }, [user?.isAdmin]);

  if (!user?.isAdmin) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "60px 0", textAlign: "center", color: MUTED, fontSize: 14 }}>
        The Accounts room belongs to administrators.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "40px 0 70px" }}>
      <p style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#C6A035", fontWeight: 700, margin: "0 0 10px" }}>Administration</p>
      <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 32, letterSpacing: "-.015em", color: INK, margin: "0 0 10px" }}>Accounts.</h1>
      <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, maxWidth: 640, margin: "0 0 24px" }}>
        Every member, and what their account can see. To add someone new: Supabase → Authentication → Add user (email and password), then set their type here. A whole-system account needs no school; a trust, authority or diocese account carries its organisation's name.
      </p>
      {err && <div style={{ ...card, color: "#B3261E", fontSize: 13, marginBottom: 14 }}>{err}</div>}
      {!err && accounts === null && <div style={{ color: MUTED, fontSize: 13.5 }}>Reading the member list…</div>}
      <div style={{ display: "grid", gap: 12 }}>
        {(accounts || []).map((a) => <Row key={a.id} a={a} onSaved={load} />)}
      </div>
    </div>
  );
}
