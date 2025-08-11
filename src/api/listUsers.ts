import { supabase } from "@/lib/supabaseClient";
import type { UserLite } from "@/types/domain";

export async function listUsers(limit = 50): Promise<UserLite[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name")
    .order("full_name", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as UserLite[];
}

