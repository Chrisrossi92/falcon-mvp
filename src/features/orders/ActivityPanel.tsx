// src/features/orders/ActivityPanel.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { OrderEvent } from "../../types/order";

export function ActivityPanel({ orderId }: { orderId: string }) {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("order_activity")
        .select(
          "id, order_id, event_type, event_data, occurred_at, actor, message, kind"
        )
        .eq("order_id", orderId)
        .order("occurred_at", { ascending: false });
      if (!active) return;
      if (error) setErr(error.message);
      else setEvents((data ?? []) as OrderEvent[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [orderId]);

  if (loading) return <div>Loading activity…</div>;
  if (err) return <div>Couldn’t load activity: {err}</div>;
  if (!events.length) return <div>No activity yet.</div>;

  return (
    <div className="space-y-2">
      {events.map(ev => (
        <div key={ev.id} className="rounded-md border p-2">
          <div className="text-sm font-medium">{label(ev)}</div>
          {ev.message && <div className="text-sm opacity-80">{ev.message}</div>}
          <div className="text-xs opacity-60">{new Date(ev.occurred_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

function label(ev: OrderEvent) {
  switch (ev.event_type) {
    case "created": return "Order created";
    case "assigned": {
      const a = ev.event_data?.["assigned_to"];
      return `Assigned to ${typeof a === "string" ? a : "user"}`;
    }
    case "status_changed": return "Status updated";
    case "note_added": return "Note added";
    default: return ev.event_type;
  }
}
