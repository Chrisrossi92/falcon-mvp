// src/api/addOrderNote.ts
import { supabase } from "@/lib/supabaseClient";

export async function addOrderNote(orderId: string, body: string): Promise<string> {
  const { data, error } = await supabase.rpc<string>("add_order_note", {
    p_order_id: orderId,
    p_body: body,
  });
  if (error) throw new Error(error.message);
  return data!;
}

