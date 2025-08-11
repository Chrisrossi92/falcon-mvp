import { supabase } from "@/lib/supabaseClient";
import type { ClientLite } from "@/types/domain";

export async function listClients(q?: string, limit = 50): Promise<ClientLite[]> {
  let query = supabase
    .from("clients")
    .select("id, display_name")
    .order("display_name", { ascending: true })
    .limit(limit);
  if (q?.trim()) query = query.ilike("display_name", `%${q.trim()}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ClientLite[];
}

