import { supabase } from "@/lib/supabaseClient";

export async function addOrderNote(orderId: string, note: string): Promise<number> {
  const { data, error } = await supabase.rpc("add_order_note", {
    p_order_id: orderId,
    p_note: note,
  });
  if (error) {
    throw error;
  }
  // The Supabase stored procedure returns a bigint (activity id)
  return data as number;
}
