import { supabase } from "@/lib/supabaseClient";

export type UserOpt = { id: string; full_name: string | null };

export async function listUsers(limit = 50) {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name")
    .order("full_name", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as UserOpt[];
}
