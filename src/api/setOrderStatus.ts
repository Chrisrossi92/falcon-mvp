// src/api/setOrderStatus.ts
import { supabase } from "@/lib/supabaseClient";
export async function setOrderStatus(orderId: string, status: "new" | "in_review" | "completed" | "cancelled") {
  const { data, error } = await supabase.rpc("set_order_status", {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw error;
  return data as string;
}
