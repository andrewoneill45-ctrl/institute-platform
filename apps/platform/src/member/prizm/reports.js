/* Saved Prizm reports. A report is saved as its SPECIFICATION, not its
   figures: opening one recomputes against the dataset of the day, so a saved
   report is always current and always honest about vintage.

   With Supabase configured, reports live in prizm_reports, scoped to the
   member's school by RLS (see supabase/prizm-reports.sql): save one and a
   colleague at the same school sees it. In the demo, they live in this
   browser only. */
import { supabase, DEMO } from "../../lib/supabase.js";

const LS = "asi-prizm-reports";

const local = () => { try { return JSON.parse(localStorage.getItem(LS) || "[]"); } catch { return []; } };
const setLocal = (l) => { try { localStorage.setItem(LS, JSON.stringify(l.slice(0, 40))); } catch { /* private mode */ } };

export async function listReports(urn) {
  if (DEMO || !supabase || !urn) return local();
  const { data, error } = await supabase.from("prizm_reports")
    .select("id,title,spec,created_at").eq("urn", urn)
    .order("created_at", { ascending: false }).limit(40);
  if (error) throw error;
  return data || [];
}

export async function saveReport(urn, title, spec) {
  if (DEMO || !supabase || !urn) {
    const r = { id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), title, spec, created_at: new Date().toISOString() };
    setLocal([r, ...local()]);
    return r;
  }
  const { data, error } = await supabase.from("prizm_reports").insert({ urn, title, spec }).select("id,title,spec,created_at").single();
  if (error) throw error;
  return data;
}

export async function deleteReport(urn, id) {
  if (DEMO || !supabase || !urn) { setLocal(local().filter((r) => r.id !== id)); return; }
  const { error } = await supabase.from("prizm_reports").delete().eq("id", id);
  if (error) throw error;
}
