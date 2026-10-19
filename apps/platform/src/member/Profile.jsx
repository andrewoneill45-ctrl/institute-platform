/* Your profile — who the platform greets, and what your account can see. */
import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { supabase, DEMO } from "../lib/supabase.js";

const INK = "#221233", MUTED = "#6F6580", HAIR = "rgba(34,18,51,.14)";
const card = { background: "#fff", borderRadius: 18, boxShadow: "0 1px 2px rgba(34,18,51,.04), 0 18px 50px rgba(34,18,51,.09)", padding: "26px 28px" };
const field = { width: "100%", boxSizing: "border-box", padding: "10px 13px", borderRadius: 10, border: `1px solid ${HAIR}`, fontSize: 13.5, background: "#FBFAF7", fontFamily: "inherit" };
const TYPE_NAMES = { school: "School", system: "Whole system", trust: "Trust", la: "Local authority", diocese: "Diocese", aepa: "AEPA" };

export default function Profile() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.fullName || "");
  const [role, setRole] = useState(user?.roleTitle || "");
  const [state, setState] = useState("");

  async function save() {
    if (DEMO || !supabase) { setState("This is the demonstration build; profiles save on the live platform."); return; }
    setState("Saving…");
    const { error } = await supabase.from("profiles").update({ full_name: name.trim() || null, role_title: role.trim() || null }).eq("id", user.id);
    if (error) { setState("That didn't save: " + error.message); return; }
    await refresh();
    setState("Saved.");
  }

  const rows = [
    ["Email", user?.email],
    ["Account type", TYPE_NAMES[user?.accountType] || "School"],
    user?.accountType === "school" ? ["School", user?.school || "Not yet set"] : ["Scope", user?.scopeName],
    user?.urn ? ["URN", String(user.urn)] : null,
    user?.isAdmin ? ["Administrator", "Yes — the Accounts room is yours"] : null,
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 0 70px" }}>
      <p style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#C6A035", fontWeight: 700, margin: "0 0 10px" }}>Your profile</p>
      <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 32, letterSpacing: "-.015em", color: INK, margin: "0 0 22px" }}>
        {user?.fullName || "Tell the platform who you are."}
      </h1>

      <div style={{ ...card, marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: INK, marginBottom: 6 }}>Your name</label>
        <input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="How the platform should greet you" />
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: INK, margin: "16px 0 6px" }}>Your role</label>
        <input style={field} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Executive Headteacher, Director of Education…" />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
          <button onClick={save} style={{ border: "none", background: "#6A0CA0", color: "#fff", borderRadius: 999, padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save changes</button>
          {state && <span style={{ fontSize: 12.5, color: MUTED }}>{state}</span>}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 10.5, letterSpacing: ".14em", fontWeight: 700, color: MUTED, marginBottom: 12 }}>YOUR ACCOUNT</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: "8px 0", color: MUTED, width: 160, verticalAlign: "top" }}>{k}</td>
                <td style={{ padding: "8px 0", color: INK, fontWeight: 500 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 12, color: MUTED, margin: "12px 0 0", lineHeight: 1.5 }}>
          Account type and scope are set by an administrator; ask Andrew if yours needs changing.
        </p>
      </div>
    </div>
  );
}
