// One client for the whole platform. Runs in demo mode until keys are supplied.
import { createClient } from "@supabase/supabase-js";

const env = import.meta.env || {}; /* vite supplies env; plain node (the batteries) does not */
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

export const DEMO = !url || !key;
export const supabase = DEMO ? null : createClient(url, key);
