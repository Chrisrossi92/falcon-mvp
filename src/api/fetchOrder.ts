import { supabase } from "@/lib/supabaseClient";

export async function fetchOrder(orderId: string) {
  const { data, error } = await supabase
    .from("v_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) {
    throw error;
  }
  return data;
}
