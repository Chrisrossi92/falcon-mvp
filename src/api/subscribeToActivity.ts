import { supabase } from "@/lib/supabaseClient";

export function subscribeToActivity(orderId: string, onChange: (row: any) => void) {
  const channel = supabase
    .channel(`order-activity-${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "falcon_mvp",
        table: "order_activity",
        filter: `order_id=eq.${orderId}`,
      },
      (payload) => {
        const row = payload.new ?? payload.old;
        if (row) {
          onChange(row);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
