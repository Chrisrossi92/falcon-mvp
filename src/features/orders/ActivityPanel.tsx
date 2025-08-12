// src/features/orders/ActivityPanel.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { OrderEvent } from "../../types/order";

export function ActivityPanel({ orderId }: { orderId: string }) {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string | null }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Load events
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("falcon_mvp.order_activity")
        .select(
          "id, order_id, event_type, event_data, occurred_at, actor, message, kind"
        )
        .eq("order_id", orderId)
        .order("occurred_at", { ascending: false });

      if (cancelled) return;
      if (error) setErr(error.message);
      else setEvents((data ?? []) as OrderEvent[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // Load users map for nicer labels
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("falcon_mvp.users")
        .select("id, full_name");
      if (!error) setUsers(data ?? []);
    })();
  }, []);

  const usersMap = useMemo(
    () =>
      Object.fromEntries(
        users.map((u) => [u.id, u.full_name ?? u.id.substring(0, 8)])
      ),
    [users]
  );

  if (loading) return <div>Loading activity…</div>;
  if (err) return <div className="text-red-600">Couldn’t load: {err}</div>;
  if (!events.length) return <div>No activity yet.</div>;

  return (
    <div className="space-y-2">
      {events.map((ev) => (
        <div key={ev.id} className="rounded-md border p-2">
          <div className="text-sm font-medium">{label(ev, usersMap)}</div>
          {ev.message && <div className="text-sm opacity-80">{ev.message}</div>}
          <div className="text-xs opacity-60">
            {new Date(ev.occurred_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function label(
  ev: OrderEvent,
  usersMap: Record<string, string>
): string {
  if (ev.event_type === "created") return "Order created";
  if (ev.event_type === "assigned") {
    const id = (ev.event_data?.["assigned_to"] as string) ?? "";
    return `Assigned to ${usersMap[id] ?? "user"}`;
  }
  if (ev.event_type === "status_changed") return "Status updated";
  if (ev.event_type === "note_added") return "Note added";
  return ev.event_type;
}

