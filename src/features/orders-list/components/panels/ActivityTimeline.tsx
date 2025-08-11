// src/features/orders-list/components/panels/ActivityTimeline.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { fetchOrderActivity, type ActivityRow } from "@/api/fetchOrderActivity";

export default function ActivityTimeline({ orderId }: { orderId: string }) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchOrderActivity(orderId);
      setRows(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [orderId]);

  // realtime: refresh on activity table changes for this order
  useEffect(() => {
    const ch = supabase
      .channel(`order_activity_${orderId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "falcon_mvp",
        table: "order_activity",
        filter: `order_id=eq.${orderId}`,
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) return <div>Loading activity…</div>;
  if (err) return <div style={{ color: "#a00" }}>Error: {err}</div>;
  if (!rows.length) return <div style={{ color: "#666" }}><em>No activity yet.</em></div>;

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r) => (
        <li key={r.id} style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: 10 }}>
          <div style={{ fontSize: 12, color: "#888" }}>
            {new Date(r.created_at).toLocaleString()} · {r.actor_name ?? "System"} · {r.kind}
          </div>
          <div style={{ marginTop: 4 }}>
            {r.message || <span style={{ color: "#666" }}><em>(no message)</em></span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

