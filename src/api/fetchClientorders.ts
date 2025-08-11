// src/api/fetchClientOrders.ts
import { supabase } from "@/lib/supabaseClient";
import type { OrderView } from "@/types/domain";

export async function fetchClientOrders(clientId: string): Promise<OrderView[]> {
  const { data, error } = await supabase
    .from("v_orders")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderView[];
}
