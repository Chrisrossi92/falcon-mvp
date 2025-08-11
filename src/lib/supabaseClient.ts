import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error("Missing Supabase env: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel (Preview + Production) and redeploy.");
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});


