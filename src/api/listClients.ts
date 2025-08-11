// src/api/listClients.ts
import { supabase } from "@/lib/supabaseClient";

export type ClientLite = { id: string; display_name: string };

async function trySelectDisplayName(q: string | undefined, limit: number) {
  let query = supabase.from("clients").select("id, display_name").order("display_name", { ascending: true }).limit(limit);
  if (q?.trim()) query = query.ilike("display_name", `%${q.trim()}%`);
  return await query;
}

async function trySelectName(q: string | undefined, limit: number) {
  let query = supabase.from("clients").select("id, name").order("name", { ascending: true }).limit(limit);
  if (q?.trim()) query = query.ilike("name", `%${q.trim()}%`);
  return await query;
}

/**
 * Flexible selector: prefers `display_name`, falls back to `name`.
 */
export async function listClients(q?: string, limit = 50): Promise<ClientLite[]> {
  // First attempt: display_name
  let { data, error } = await trySelectDisplayName(q, limit);

  // Unknown column? (Postgres code 42703). Fallback to name.
  if (error && (error as any).code === "42703") {
    const fallback = await trySelectName(q, limit);
    data = fallback.data?.map((row: any) => ({ id: row.id, display_name: row.name })) ?? [];
    if (fallback.error) throw fallback.error;
    return data as ClientLite[];
  }

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    display_name: row.display_name,
  })) as ClientLite[];
}


