// src/api/listUsers.ts
import { supabase } from "@/lib/supabaseClient";

export type UserLite = { id: string; full_name: string | null };

/** Try common shapes in order:
 *  1) users(id, full_name)
 *  2) users(id, name)
 *  3) profiles(id, full_name)  // some setups keep names in profiles
 */
export async function listUsers(limit = 50): Promise<UserLite[]> {
  // Attempt 1: full_name on users
  let q1 = await supabase.from("users").select("id, full_name").order("full_name", { ascending: true }).limit(limit);
  if (!q1.error) {
    return (q1.data ?? []).map((r: any) => ({ id: r.id, full_name: r.full_name ?? null })) as UserLite[];
  }
  if ((q1.error as any).code !== "42703") {
    // some other error: bubble up
    throw q1.error;
  }

  // Attempt 2: name on users
  const q2 = await supabase.from("users").select("id, name").order("name", { ascending: true }).limit(limit);
  if (!q2.error) {
    return (q2.data ?? []).map((r: any) => ({ id: r.id, full_name: r.name ?? null })) as UserLite[];
  }
  if ((q2.error as any).code !== "42703") {
    throw q2.error;
  }

  // Attempt 3: profiles table with full_name (if present)
  const q3 = await supabase.from("profiles").select("id, full_name").order("full_name", { ascending: true }).limit(limit);
  if (q3.error) throw q3.error;
  return (q3.data ?? []).map((r: any) => ({ id: r.id, full_name: r.full_name ?? null })) as UserLite[];
}


