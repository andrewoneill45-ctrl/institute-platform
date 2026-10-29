// Netlify Function: /.netlify/functions/accounts
// The administrator's hand on Supabase Auth: create a member with an email
// and a first password, set someone a new password, or remove an account.
// The service-role key lives only in Netlify's environment
// (SUPABASE_SERVICE_ROLE_KEY); the browser never sees it. Every call must
// carry the caller's own session token, and the caller must be an
// administrator in public.profiles, or nothing happens.

const cors = () => ({ "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization" });
const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: cors() });

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return reply(500, { error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not both configured in Netlify." });

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return reply(401, { error: "Sign in first." });
  let body;
  try { body = await req.json(); } catch { return reply(400, { error: "Bad request" }); }

  const S = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
  const j = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch { return { raw: t }; } };

  /* who is calling, and are they an administrator? */
  const me = await fetch(`${url}/auth/v1/user`, { headers: { apikey: service, Authorization: `Bearer ${token}` } });
  if (!me.ok) return reply(401, { error: "Your session has expired; sign in again." });
  const caller = await me.json();
  const prof = await fetch(`${url}/rest/v1/profiles?id=eq.${caller.id}&select=is_admin`, { headers: S }).then(j);
  if (!Array.isArray(prof) || !prof[0] || prof[0].is_admin !== true) return reply(403, { error: "Only an administrator may manage accounts." });

  const action = body.action;
  try {
    if (action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { error: "That email address does not look right." });
      if (password.length < 8) return reply(400, { error: "A first password needs at least eight characters." });
      const p = body.profile || {};
      const r = await fetch(`${url}/auth/v1/admin/users`, { method: "POST", headers: S, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { school_name: p.school_name || null, urn: p.urn || null, full_name: p.full_name || null } }) });
      const u = await j(r);
      if (!r.ok) return reply(r.status, { error: u.msg || u.message || u.error_description || u.error || "Supabase refused to create the user." });
      /* the profile row, straight away, so the member lands in the right room */
      const row = {
        id: u.id, full_name: p.full_name || null, role_title: p.role_title || null,
        account_type: p.account_type || "school", org_name: p.org_name || null,
        urn: p.urn || null, school_name: p.school_name || null,
        is_admin: p.is_admin === true, system_access: p.system_access === true, horizon_access: p.horizon_access === true,
        tools: p.tools && typeof p.tools === "object" ? p.tools : {},
      };
      const pr = await fetch(`${url}/rest/v1/profiles?on_conflict=id`, { method: "POST", headers: { ...S, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) });
      if (!pr.ok) { const e = await j(pr); return reply(200, { id: u.id, warning: "The login exists, but the profile could not be written: " + (e.message || e.hint || pr.status) + ". Set it in Accounts." }); }
      return reply(200, { id: u.id });
    }
    if (action === "password") {
      const id = String(body.id || ""), password = String(body.password || "");
      if (!id) return reply(400, { error: "Which account?" });
      if (password.length < 8) return reply(400, { error: "A password needs at least eight characters." });
      const r = await fetch(`${url}/auth/v1/admin/users/${id}`, { method: "PUT", headers: S, body: JSON.stringify({ password }) });
      if (!r.ok) { const e = await j(r); return reply(r.status, { error: e.msg || e.message || "Supabase refused the new password." }); }
      return reply(200, { ok: true });
    }
    if (action === "remove") {
      const id = String(body.id || "");
      if (!id) return reply(400, { error: "Which account?" });
      if (id === caller.id) return reply(400, { error: "You cannot remove your own account from here." });
      const r = await fetch(`${url}/auth/v1/admin/users/${id}`, { method: "DELETE", headers: S });
      if (!r.ok) { const e = await j(r); return reply(r.status, { error: e.msg || e.message || "Supabase refused to remove the user." }); }
      return reply(200, { ok: true });
    }
    return reply(400, { error: "Unknown action." });
  } catch (e) {
    return reply(502, { error: "Upstream error: " + e.message });
  }
};
