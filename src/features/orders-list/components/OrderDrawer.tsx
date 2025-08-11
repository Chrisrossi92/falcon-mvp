// src/features/orders-list/components/OrderDrawer.tsx
import React, { useEffect, useState } from "react";
import type { OrderView } from "@/types/domain";
import { supabase } from "@/lib/supabaseClient";
import ActivityTimeline from "./panels/ActivityTimeline";
import OrderMap from "./panels/OrderMap";
import NotesPanel from "./panels/NotesPanel";
import AppointmentsPanel from "./panels/AppointmentsPanel";
import { assignOrder } from "@/api/assignOrder";
import { setOrderStatus } from "@/api/setOrderStatus";
import { listUsers } from "@/api/listUsers";

type Props = {
  orderId: string;
  onClose: () => void;
  onUpdated?: () => void; // called after actions that mutate the order/activity
};

type TabKey = "timeline" | "map" | "notes" | "appointments";

export default function OrderDrawer({ orderId, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<TabKey>("timeline");
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("v_orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    if (error) {
      setErr(error.message);
      setOrder(null);
    } else {
      setOrder((data as any) ?? null);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [orderId]);
  useEffect(() => { listUsers(100).then(setUsers).catch(() => {}); }, []);

  async function onAssign(userId: string | null) {
    if (!order) return;
    setBusy(true);
    setErr(null);
    try {
      await assignOrder(order.id, userId);
      await load();
      onUpdated?.();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to assign");
    } finally {
      setBusy(false);
    }
  }

  async function onStatus(next: "new" | "in_review" | "completed" | "cancelled") {
    if (!order) return;
    setBusy(true);
    setErr(null);
    try {
      await setOrderStatus({ orderId: order.id, newStatus: next });
      await load();
      onUpdated?.();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside style={drawer}>
      <div style={drawerHeader}>
        <div>
          <strong>Order {orderId}</strong>
          {order?.title ? <span style={{ marginLeft: 6, color: "#666" }}>· {order.title}</span> : null}
          {order?.is_archived ? <span style={{ marginLeft: 6, color: "#a00" }}>· archived</span> : null}
        </div>
        <button onClick={onClose} style={closeBtn} title="Close">×</button>
      </div>

      {/* Quick actions */}
      <div style={quickBar}>
        {/* Assign */}
        <label style={label}>Assign:</label>
        <select
          disabled={busy || loading}
          value={order?.assigned_to ?? ""}
          onChange={(e) => onAssign(e.target.value || null)}
          style={select}
        >
          <option value="">Unassigned</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.full_name ?? "(no name)"}</option>
          ))}
        </select>

        {/* Status */}
        <label style={{ ...label, marginLeft: 8 }}>Status:</label>
        <select
          disabled={busy || loading}
          value={order?.status ?? "new"}
          onChange={(e) => onStatus(e.target.value as any)}
          style={select}
        >
          <option value="new">New</option>
          <option value="in_review">In Review</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {err && <span style={{ color: "#a00", marginLeft: 8, fontSize: 12 }}>Error: {err}</span>}
      </div>

      {/* Tabs */}
      <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
        <nav style={{ display: "flex", gap: 8 }}>
          {(["timeline","map","notes","appointments"] as TabKey[]).map(k => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={tabBtn(k === tab)}
            >
              {k === "timeline" ? "Activity" :
               k === "map" ? "Map" :
               k === "notes" ? "Notes" : "Appointments"}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div style={{ padding: 12, overflow: "auto" }}>
        {loading && <div>Loading…</div>}
        {!loading && !order && <div>Not found.</div>}
        {!loading && order && (
          <>
            {tab === "timeline" && <ActivityTimeline orderId={orderId} />}
            {tab === "map" && <OrderMap order={order} />}
            {tab === "notes" && (
              <NotesPanel
                orderId={orderId}
                onAdded={() => {
                  // Activity panel will auto-refresh via realtime; we also refetch order for safety.
                  load();
                  onUpdated?.();
                }}
              />
            )}
            {tab === "appointments" && <AppointmentsPanel orderId={orderId} />}
          </>
        )}
      </div>
    </aside>
  );
}

/* styles */
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

const quickBar: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #eee",
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};

const label: React.CSSProperties = { fontSize: 12, color: "#666" };

const select: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "6px 8px",
  background: "#fff",
};

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: "6px 10px",
  borderRadius: 8,
  border: active ? "1px solid #aaa" : "1px solid #ddd",
  background: active ? "#f7f7f7" : "#fff",
  cursor: "pointer",
  textTransform: "capitalize",
});


