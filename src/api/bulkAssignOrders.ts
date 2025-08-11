import { supabase } from "@/lib/supabaseClient";

export async function bulkAssignOrders(orderIds: string[], assigneeId: string) {
  if (!orderIds.length) return 0;
  const { data, error } = await supabase.rpc("bulk_assign_orders", {
    p_order_ids: orderIds,
    p_assigned_to: assigneeId,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}
