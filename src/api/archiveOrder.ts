import { supabase } from "@/lib/supabaseClient";

export async function archiveOrder(orderId: string, isArchived = true) {
  const { data, error } = await supabase.rpc("archive_order", {
    p_order_id: orderId,
    p_is_archived: isArchived,
  });
  if (error) throw error;
  return data as string; // order id
}

