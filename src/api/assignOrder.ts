import { supabase } from "@/lib/supabaseClient";

export async function assignOrder(orderId: string, userId: string | null) {
  // allow setting to NULL to unassign
  const { data, error } = await supabase.rpc("assign_order", {
    p_order_id: orderId,
    p_user_id: userId, // param name matches your existing function
  });
  if (error) throw error;
  return data as string; // order id
}

