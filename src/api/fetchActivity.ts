import { supabase } from "@/lib/supabaseClient";

export async function fetchActivity(orderId: string) {
  const { data, error } = await supabase
    .from("v_order_activity")
    .select("*")
    .eq("order_id", orderId)
    .order("occurred_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data;
}
