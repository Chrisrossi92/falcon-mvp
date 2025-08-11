import { supabase } from "@/lib/supabaseClient";
import type { OrderView } from "@/types/domain";

export async function fetchOrder(orderId: string): Promise<OrderView> {
  const { data, error } = await supabase
    .from("v_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Order not found");
  return data as unknown as OrderView;
}


