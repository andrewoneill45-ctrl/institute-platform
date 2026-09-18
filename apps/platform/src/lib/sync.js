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
    const { data: files } = await supabase.from("lens_files").select("path,label,uploaded_at").eq("user_id", u.id).order("uploaded_at", { ascending: false });
    if (files?.length) {
      const items = files.map(f => ({ name: (f.path || "").split("/").pop(), label: f.label || "Other evidence",
        size: 0, date: new Date(f.uploaded_at).toLocaleDateString("en-GB") }));
      localStorage.setItem("lens-lib-" + id, JSON.stringify(items));
      last["lib"] = JSON.stringify(items);
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
  const libRaw = localStorage.getItem("lens-lib-" + id);
  if (libRaw && libRaw !== last["lib"]) {
    try {
      const items = JSON.parse(libRaw);
      await supabase.from("lens_files").delete().eq("user_id", u.id);
      if (items.length)
        await supabase.from("lens_files").insert(items.map(x => ({ user_id: u.id, path: u.id + "/" + x.name, label: x.label })));
      last["lib"] = libRaw;
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
