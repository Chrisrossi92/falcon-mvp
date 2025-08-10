import { supabase } from "@/lib/supabaseClient";

export type ClientOpt = { id: string; display_name: string };

export async function listClients(q?: string, limit = 50) {
  let query = supabase
    .from("clients")
    .select("id, display_name")
    .order("display_name", { ascending: true })
    .limit(limit);

  if (q && q.trim()) {
    query = query.ilike("display_name", `%${q.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ClientOpt[];
}
