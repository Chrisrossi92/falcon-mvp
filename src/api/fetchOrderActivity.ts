// src/api/fetchOrderActivity.ts
import { supabase } from "@/lib/supabaseClient";

/**
 * Read-only view of activity. Expect a DB view like `v_order_activity`
 * with fields: id, order_id, kind, actor_name, message, created_at, meta (jsonb)
 */
export type ActivityRow = {
  id: string;
  order_id: string;
  kind: "note" | "status_change" | "assignment" | "system" | string;
  actor_name: string | null;
  message: string | null;
  created_at: string; // ISO
  meta: any | null;
};

export async function fetchOrderActivity(orderId: string): Promise<ActivityRow[]> {
  const { data, error } = await supabase
    .from("v_order_activity")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ActivityRow[];
}
