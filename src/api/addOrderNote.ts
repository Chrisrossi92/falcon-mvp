// src/api/addOrderNote.ts
import { supabase } from "@/lib/supabaseClient";

/**
 * RPC-only write. You’ll need a Postgres function like:
 * create function add_order_note(p_order_id uuid, p_body text) returns uuid ...
 * that inserts into order_activity (kind='note') and returns activity id.
 */
export async function addOrderNote(orderId: string, body: string): Promise<string> {
  const { data, error } = await supabase.rpc("add_order_note", {
    p_order_id: orderId,
    p_body: body,
  });
  if (error) throw error;
  return data as string; // activity id
}


