import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase, DEMO } from "./supabase.js";

// ── Simple gate for the demo period. Change these two lines to change the login. ──
const DEMO_PASSWORD = "institute26";
const DEMO_ACCOUNTS = {
  "andrew@allsaints.co.uk": { school: "All Saints Catholic College", lens: "ascc" },
  "head@stmarys.demo": { school: "St Mary's Demonstration School", lens: "new" },
};

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    DEMO && localStorage.getItem("asi-demo-user")
      ? JSON.parse(localStorage.getItem("asi-demo-user"))
      : null
  );
  const [ready, setReady] = useState(DEMO);

  async function enrich(su) {
    if (!su) return null;
    let school = su.user_metadata?.school_name || "";
    let urn = su.user_metadata?.urn ? Number(su.user_metadata.urn) : null;
    try {
      const { data: prof } = await supabase.from("profiles").select("school_name,urn").eq("id", su.id).maybeSingle();
      if (prof) { school = prof.school_name || school; urn = prof.urn ?? urn; }
      else if (school) await supabase.from("profiles").upsert({ id: su.id, school_name: school, urn });
    } catch {}
    /* URN is the identity; the name fallback survives only for pre-URN accounts. */
    const lens = urn === 100503 || (!urn && /^all saints catholic college$/i.test((school || "").trim())) ? "ascc" : "new";
    return { id: su.id, email: su.email, school: school || "Your school", urn, lens };
  }

  useEffect(() => {
    if (DEMO) return;
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(await enrich(data.session?.user ?? null));
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) =>
      setUser(await enrich(session?.user ?? null))
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    if (DEMO) {
      const acct = DEMO_ACCOUNTS[email.trim().toLowerCase()];
      if (!acct || password !== DEMO_PASSWORD)
        return { error: { message: "Incorrect email or password." } };
      const u = { email, id: "demo", ...acct };
      localStorage.setItem("asi-demo-user", JSON.stringify(u));
      setUser(u);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email, password, school, urn) {
    if (DEMO)
      return { error: { message: "This is the demonstration build. Use a demo account, or deploy with Supabase keys to open membership." } };
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { school_name: school, urn: urn || null } },
    });
    if (error) return { error };
    return { error: null, needsConfirm: !data.session };
  }

  async function signOut() {
    if (DEMO) localStorage.removeItem("asi-demo-user");
    else await supabase.auth.signOut();
    setUser(null);
  }

  return <Ctx.Provider value={{ user, ready, signIn, signUp, signOut, demo: DEMO }}>{children}</Ctx.Provider>;
}

export function RequireMember({ children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return null;
  if (!user) return <Navigate to="/signin" state={{ from: loc }} replace />;
  return children;
}
