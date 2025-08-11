import { supabase } from "@/lib/supabaseClient";

export async function setOrderStatus(params: {
  orderId: string;
  newStatus: "new" | "in_review" | "completed" | "cancelled";
  reason?: string | null;
}) {
  const { data, error } = await supabase.rpc("set_order_status", {
    p_order_id: params.orderId,
    p_new_status: params.newStatus,
    p_reason: params.reason ?? null,
  });
  if (error) throw error;
  return data as string; // order id
}

