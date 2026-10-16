/* The School Vault — Constellation's shared memory.
   Files are still read, parsed and scored on the device; what the vault holds
   is the resulting state, one document per school, guarded by verified
   membership and row-level security. If the vault cannot be reached, the
   device copy carries on alone: the vault is a privilege, never a dependency. */

import { supabase, DEMO } from "../../lib/supabase.js";

/* ── the sync decision, pure and testable ───────────────────────────────────
   Given what exists locally and in the vault, decide what Constellation
   should do on arrival. The vault, when it has anything, is the truth. */
export function planSync(local, vaultRow) {
  if (vaultRow && vaultRow.state) return "adopt";                       // the school's copy wins
  if (local && (local.ledger || []).length) return "seed";              // device work becomes the school's
  return "blank";                                                       // nothing anywhere yet
}

/* ── membership: which school vault, if any, does this user belong to? ── */
export async function vaultMembership() {
  if (DEMO || !supabase) return null;
  try {
    const { data, error } = await supabase.from("school_members").select("urn, role").limit(1);
    if (error || !data || !data.length) return null;
    return data[0]; /* RLS already restricts to the user's own rows */
  } catch { return null; }
}

/* ── read the school's state ── */
export async function vaultLoad(urn) {
  if (DEMO || !supabase) return null;
  try {
    const { data, error } = await supabase.from("vault_states").select("state, version").eq("urn", urn).maybeSingle();
    if (error || !data) return null;
    return data;
  } catch { return null; }
}

/* ── write the school's state, with optimistic concurrency ──────────────────
   expectedVersion 0 means "no row yet": insert. Otherwise update only if the
   version still matches; a miss means a colleague wrote in between, and the
   caller receives their newer state instead of silently clobbering it. */
export async function vaultSave(urn, state, expectedVersion, userId) {
  if (DEMO || !supabase) return null;
  try {
    if (!expectedVersion) {
      const { data, error } = await supabase.from("vault_states")
        .insert({ urn, state, version: 1, updated_by: userId || null })
        .select("version").maybeSingle();
      if (!error && data) return { ok: true, version: data.version };
      /* a colleague seeded first: fall through to the conflict path */
    } else {
      const { data, error } = await supabase.from("vault_states")
        .update({ state, version: expectedVersion + 1, updated_at: new Date().toISOString(), updated_by: userId || null })
        .eq("urn", urn).eq("version", expectedVersion)
        .select("version");
      if (!error && data && data.length) return { ok: true, version: data[0].version };
      if (error) return null; /* unreachable or refused: stay on the device copy */
    }
    const current = await vaultLoad(urn);
    if (current) return { conflict: true, state: current.state, version: current.version };
    return null;
  } catch { return null; }
}
