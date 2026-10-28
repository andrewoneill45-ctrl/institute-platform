/* Kept scenarios: specifications, never figures, so a reopened scenario
   recomputes on the data of the day. Each member keeps their own; in the
   demo they live in this browser. */
import { supabase, DEMO } from "../../lib/supabase.js";
const LS = "asi-horizon-scenarios";
const local = () => { try { return JSON.parse(localStorage.getItem(LS) || "[]"); } catch { return []; } };
const setLocal = (l) => { try { localStorage.setItem(LS, JSON.stringify(l.slice(0, 60))); } catch { /* private mode */ } };
export async function listScenarios() {
  if (DEMO || !supabase) return local();
  const { data, error } = await supabase.from("horizon_scenarios").select("id,title,spec,created_at").order("created_at", { ascending: false }).limit(60);
  if (error) throw error;
  return data || [];
}
export async function saveScenario(title, spec) {
  if (DEMO || !supabase) { const r = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title, spec, created_at: new Date().toISOString() }; setLocal([r, ...local()]); return r; }
  const { data, error } = await supabase.from("horizon_scenarios").insert({ title, spec }).select("id,title,spec,created_at").single();
  if (error) throw error;
  return data;
}
export async function deleteScenario(id) {
  if (DEMO || !supabase) { setLocal(local().filter((r) => r.id !== id)); return; }
  const { error } = await supabase.from("horizon_scenarios").delete().eq("id", id);
  if (error) throw error;
}
