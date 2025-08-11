// src/features/orders-list/components/OrderDrawer.tsx
import React, { useEffect, useState } from "react";
import type { OrderView } from "@/types/domain";
import { supabase } from "@/lib/supabaseClient";
import ActivityTimeline from "./panels/ActivityTimeline";
import OrderMap from "./panels/OrderMap";
import NotesPanel from "./panels/NotesPanel";

type Props = {
  orderId: string;
  onClose: () => void;
  onUpdated?: () => void; // call after actions: assign, status change, note, etc.
};

type TabKey = "timeline" | "map" | "notes";

export default function OrderDrawer({ orderId, onClose }: Props) {
  const [tab, setTab] = useState<TabKey>("timeline");
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("v_orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (!alive) return;
      if (error) console.error(error);
      setOrder((data as any) ?? null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [orderId]);

  return (
    <aside style={drawer}>
      <div style={drawerHeader}>
        <strong>Order {orderId}</strong>
        <button onClick={onClose} style={closeBtn}>×</button>
      </div>

      <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
        <nav style={{ display: "flex", gap: 8 }}>
          {(["timeline","map","notes"] as TabKey[]).map(k => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={tabBtn(k === tab)}
            >
              {k === "timeline" ? "Activity" : k === "map" ? "Map" : "Notes"}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ padding: 12, overflow: "auto" }}>
        {loading && <div>Loading…</div>}
        {!loading && !order && <div>Not found.</div>}
        {!loading && order && (
          <>
            {tab === "timeline" && <ActivityTimeline orderId={orderId} />}
            {tab === "map" && <OrderMap order={order} />}
            {tab === "notes" && <NotesPanel orderId={orderId} />}
          </>
        )}
      </div>
    </aside>
  );
}

const drawer: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  width: 420,
  background: "white",
  borderLeft: "1px solid #eaeaea",
  boxShadow: "0 0 20px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
};

const drawerHeader: React.CSSProperties = {
  padding: "12px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #eee",
};

const closeBtn: React.CSSProperties = {
  border: "1px solid #ddd",
  background: "white",
  borderRadius: 8,
  width: 28,
  height: 28,
  cursor: "pointer",
};

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: "6px 10px",
  borderRadius: 8,
  border: active ? "1px solid #aaa" : "1px solid #ddd",
  background: active ? "#f7f7f7" : "#fff",
  cursor: "pointer",
  textTransform: "capitalize",
});
