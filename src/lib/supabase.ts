import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const enabled = import.meta.env.VITE_ENABLE_SUPABASE !== "false";

export const supabase = enabled && url && anonKey ? createClient(url, anonKey) : null;
