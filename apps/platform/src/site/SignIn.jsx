import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Wordmark } from "@asi/design-system";
import { useAuth } from "../lib/auth.jsx";

export default function SignIn() {
  const { signIn, signUp, demo } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("join") ? "join" : "in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [school, setSchool] = useState("");
  const [err, setErr] = useState(null);
  const [note, setNote] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setErr(null); setNote(null);
    if (mode === "in") {
      const { error } = await signIn(email, pw);
      if (error) setErr(error.message);
      else nav("/members");
    } else {
      const res = await signUp(email, pw, school.trim());
      if (res.error) setErr(res.error.message);
      else if (res.needsConfirm) setNote("Almost there: confirm the address from the email we have just sent, then sign in.");
      else nav("/members");
    }
  }

  const tab = (m, label) => (
    <button type="button" onClick={() => { setMode(m); setErr(null); setNote(null); }}
      style={{ flex: 1, padding: "9px 0", border: "none", cursor: "pointer", fontFamily: "inherit",
        fontSize: 12.5, fontWeight: 600, borderRadius: 999,
        background: mode === m ? "var(--purple-700)" : "transparent",
        color: mode === m ? "#fff" : "var(--muted)" }}>{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <form onSubmit={submit} style={{ width: 400, background: "#fff", border: "1px solid var(--hair)",
        borderRadius: 18, padding: "44px 42px" }}>
        <Link to="/" style={{ textDecoration: "none" }}><Wordmark size={30} /></Link>
        <p style={{ margin: "10px 0 18px", fontSize: 13, color: "var(--muted)" }}>
          For member schools of the Fellowship.
        </p>
        <div style={{ display: "flex", gap: 4, background: "var(--lilac)", borderRadius: 999,
          padding: 4, marginBottom: 22 }}>
          {tab("in", "Sign in")}{tab("join", "Request membership")}
        </div>
        {mode === "join" && (
          <div className="field"><label>SCHOOL NAME</label>
            <input value={school} onChange={(e) => setSchool(e.target.value)} required
              placeholder="As it appears on Get Information About Schools" /></div>
        )}
        <div className="field"><label>SCHOOL EMAIL</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></div>
        <div className="field"><label>PASSWORD</label>
          <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" required
            minLength={mode === "join" ? 8 : undefined} /></div>
        {err && <p style={{ color: "var(--rag-r)", fontSize: 12.5, marginBottom: 12 }}>{err}</p>}
        {note && <p style={{ color: "var(--purple-700)", fontSize: 12.5, marginBottom: 12 }}>{note}</p>}
        <button className="btn solid" type="submit" style={{ width: "100%" }}>
          {mode === "in" ? "Sign in" : "Request membership"}
        </button>
        {mode === "join" && (
          <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 14, marginBottom: 0 }}>
            Membership of the founding hundred is reviewed, not automatic: an account gives you the
            instruments while your place is considered. The covenant applies from the first upload.
          </p>
        )}
      </form>
    </div>
  );
}
