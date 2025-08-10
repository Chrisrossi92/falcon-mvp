// src/api/assignOrder.ts
import { supabase } from "@/lib/supabaseClient";

export async function assignOrder(orderId: string, userId: string) {
  const { data, error } = await supabase.rpc("assign_order", {
    p_order_id: orderId,
    p_user_id: userId,
  });
  if (error) throw error;
  return data as string; // order id
}
