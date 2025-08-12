// src/features/order-detail/ActivityTimeLine.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type OrderEvent = {
  id: number;
  order_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  occurred_at: string;
  actor: string | null;
  message: string | null;
  kind: string | null;
};

export default function ActivityTimeLine({ orderId }: { orderId: string }) {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string | null }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // initial load
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("falcon_mvp.order_activity")
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

  // realtime (turn Realtime ON for falcon_mvp.order_activity)
  useEffect(() => {
    const ch = supabase
      .channel(`order-activity-${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "falcon_mvp", table: "order_activity", filter: `order_id=eq.${orderId}` },
        (payload) => setEvents((prev) => [payload.new as any, ...prev])
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orderId]);

  // users for nicer labels
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("falcon_mvp.users")
        .select("id, full_name");
      setUsers(data ?? []);
    })();
  }, []);
  const usersMap = useMemo(
    () => Object.fromEntries(users.map(u => [u.id, u.full_name ?? u.id.slice(0,8)])),
    [users]
  );

  if (loading) return <div>Loading activity…</div>;
  if (err) return <div className="text-red-600">{err}</div>;
  if (!events.length) return <div>No activity yet.</div>;

  return (
    <div className="space-y-2">
      {events.map(ev => (
        <div key={ev.id} className="rounded-md border p-2">
          <div className="text-sm font-medium">{label(ev, usersMap)}</div>
          {ev.message && <div className="text-sm opacity-80">{ev.message}</div>}
          <div className="text-xs opacity-60">{new Date(ev.occurred_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

function label(ev: OrderEvent, users: Record<string,string>) {
  switch (ev.event_type) {
    case "order_created": return "Order created";
    case "assigned_to_appraiser": {
      const to = (ev.event_data?.["assigned_to"] as string) ?? "";
      return `Assigned to ${users[to] ?? to ?? "user"}`;
    }
    case "status_changed": return "Status updated";
    case "user_note": return "Note added";
    // keep backward-compat just in case
    case "created": return "Order created";
    case "assigned": return "Assigned";
    default: return ev.event_type;
  }
}

// Named export for older imports (belt & suspenders)
export { ActivityTimeLine };

