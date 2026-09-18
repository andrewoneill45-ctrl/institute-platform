// One client for the whole platform. Runs in demo mode until keys are supplied.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const DEMO = !url || !key;
export const supabase = DEMO ? null : createClient(url, key);
