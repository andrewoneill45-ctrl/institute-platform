import { supabase, DEMO } from "./supabase.js";

/* The member shell is the sync agent: the instrument iframes speak localStorage,
   and this module carries those keys to and from Supabase so a school's plan
   and Library follow the account, not the machine. */
const slug = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
const schoolId = (u) => (u.lens === "ascc" ? "ascc" : slug(u.school));
const last = {};

export async function syncDown(u) {
  if (DEMO || !u?.id) return;
  const id = schoolId(u);
  try {
    const { data: row } = await supabase.from("orbit_plans").select("plan").eq("user_id", u.id).maybeSingle();
    if (row?.plan) {
      localStorage.setItem("asi-orbit-plan:" + id, JSON.stringify(row.plan));
      last["plan"] = JSON.stringify(row.plan);
    }
  } catch {}
  try {
    /* the Library and the Section 48 vault, each item with its reading */
    let { data: files, error } = await supabase.from("lens_files").select("path,label,uploaded_at,room,meta").eq("user_id", u.id).order("uploaded_at", { ascending: false });
    if (error) ({ data: files } = await supabase.from("lens_files").select("path,label,uploaded_at").eq("user_id", u.id).order("uploaded_at", { ascending: false }));
    if (files?.length) {
      for (const [room, key] of [["library", "lens-lib-" + id], ["s48", "lens-s48-" + id]]) {
        const mine = files.filter((f) => (f.room || "library") === room);
        if (!mine.length) continue;
        let local = [];
        try { local = JSON.parse(localStorage.getItem(key) || "[]"); } catch { local = []; }
        const byName = new Map(local.map((x) => [x.name, x]));
        const items = mine.map((f) => {
          const name = (f.path || "").split("/").pop();
          const m = f.meta || {};
          const here = byName.get(name) || {};
          /* never let the catalogue wipe a reading this device holds */
          return { name, label: f.label || "Other evidence", size: m.size || here.size || 0,
            date: m.date || here.date || new Date(f.uploaded_at).toLocaleDateString("en-GB"),
            ...(m.read || here.read ? { read: m.read || here.read } : {}) };
        });
        localStorage.setItem(key, JSON.stringify(items));
        last[room] = JSON.stringify(items);
      }
    }
  } catch {}
}

async function push(u) {
  if (DEMO || !u?.id) return;
  const id = schoolId(u);
  const planRaw = localStorage.getItem("asi-orbit-plan:" + id);
  if (planRaw && planRaw !== last["plan"]) {
    try {
      await supabase.from("orbit_plans").upsert({ user_id: u.id, plan: JSON.parse(planRaw), updated_at: new Date().toISOString() });
      last["plan"] = planRaw;
    } catch {}
  }
  for (const [room, key] of [["library", "lens-lib-" + id], ["s48", "lens-s48-" + id]]) {
    const raw = localStorage.getItem(key);
    if (!raw || raw === last[room]) continue;
    try {
      const items = JSON.parse(raw);
      const rows = items.map((x) => ({ user_id: u.id, path: u.id + "/" + x.name, label: x.label, room, meta: { size: x.size || 0, date: x.date || null, read: x.read || null } }));
      await supabase.from("lens_files").delete().eq("user_id", u.id).eq("room", room);
      if (rows.length) {
        const { error } = await supabase.from("lens_files").insert(rows);
        /* before evidence.sql has run there is no room or meta column: keep the
           Library's catalogue syncing as it always has */
        if (error && room === "library") { await supabase.from("lens_files").delete().eq("user_id", u.id); await supabase.from("lens_files").insert(rows.map(({ room: _r, meta: _m, ...r }) => r)); }
      }
      last[room] = raw;
    } catch {}
  }
}

export function startSync(u) {
  if (DEMO || !u?.id) return () => {};
  const tick = () => push(u);
  const iv = setInterval(tick, 12000);
  addEventListener("beforeunload", tick);
  return () => { clearInterval(iv); removeEventListener("beforeunload", tick); push(u); };
}

/* the original file, kept in the member's private folder of the 'lens' bucket */
export async function keepOriginal(u, file) {
  if (DEMO || !u?.id || !file) return false;
  try {
    const { error } = await supabase.storage.from("lens").upload(u.id + "/" + file.name, file, { upsert: true, contentType: file.type || undefined });
    return !error;
  } catch { return false; }
}
