// src/features/order-detail/OrderDetailPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import fetchOrder from "@/api/fetchOrder";
import archiveOrder from "@/api/archiveOrder";
import setOrderStatus from "@/api/setOrderStatus";
import OrderFilesPanel from "./OrderFilesPanel";

// ---------- Types ----------
type OrderStatus = "new" | "in_review" | "completed" | "cancelled";

type OrderVM = {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  status: OrderStatus;
  client_name: string | null;
  assignee_name: string | null;
  due_date: string | null; // YYYY-MM-DD
  is_archived: boolean | null;
  appointment_start?: string | null;
  appointment_end?: string | null;
};

type OrderEventType = "created" | "assigned" | "status_changed" | "note_added";

type OrderEvent = {
  id: number;
  order_id: string;
  event_type: OrderEventType | string; // tolerate legacy types
  event_data: Record<string, unknown>;
  occurred_at: string;
  actor: string | null;
  message: string | null;
  kind: string | null;
};

// ---------- Helpers ----------
function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function labelEvent(ev: OrderEvent, users: Record<string, string>) {
  switch (ev.event_type) {
    case "created":
      return "Order created";
    case "assigned": {
      const to = (ev.event_data?.["assigned_to"] as string) ?? "";
      return `Assigned to ${users[to] ?? to ?? "user"}`;
    }
    case "status_changed":
      return "Status updated";
    case "note_added":
      return "Note added";
    default:
      // fallback for any legacy/custom types
      return String(ev.event_type);
  }
}

// ---------- Embedded components ----------
function ActivityPanel({ orderId }: { orderId: string }) {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string | null }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Load events
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
    return () => {
      active = false;
    };
  }, [orderId]);

  // Live inserts via Supabase Realtime
useEffect(() => {
  const channel = supabase
    .channel(`order-activity-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'falcon_mvp',
        table: 'order_activity',
        filter: `order_id=eq.${orderId}`,
      },
      (payload) => {
        setEvents((prev) => [payload.new as any, ...prev]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
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
          <div className="text-sm font-medium">{labelEvent(ev, usersMap)}</div>
          {ev.message && <div className="text-sm opacity-80">{ev.message}</div>}
          <div className="text-xs opacity-60">{fmtWhen(ev.occurred_at)}</div>
        </div>
      ))}
    </div>
  );
}

function AssignControl({ orderId, onAssigned }: { orderId: string; onAssigned?: () => void }) {
  const [users, setUsers] = useState<{ id: string; full_name: string | null }[]>(
    []
  );
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("falcon_mvp.users")
        .select("id, full_name")
        .order("full_name", { ascending: true });
      if (!error) setUsers(data ?? []);
    })();
  }, []);

  const onSave = async () => {
    if (!value) return;
    setSaving(true);
    setErr(null);
    const { error } = await supabase.rpc("falcon_mvp.rpc_assign_order", {
      p_order_id: orderId,
      p_assigned_to: value,
      p_note: null,
    });
    setSaving(false);
    if (error) {
      setErr(error.message);
    } else {
      onAssigned?.();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded p-2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        <option value="">Assign to…</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.full_name ?? u.id}
          </option>
        ))}
      </select>
      <button
        className="rounded bg-black text-white px-3 py-2 disabled:opacity-50"
        disabled={!value || saving}
        onClick={onSave}
      >
        {saving ? "Assigning…" : "Assign"}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}

// ---------- Page ----------
const OrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const orderId = id ?? "";

  const [order, setOrder] = useState<OrderVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const reload = async () => {
    if (!orderId) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchOrder(orderId);
      setOrder(data as unknown as OrderVM);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const onArchive = async () => {
    if (!orderId) return;
    await archiveOrder(orderId);
    navigate("/orders");
  };

  const onStatusChange = async (next: OrderStatus) => {
    if (!orderId || !order) return;
    setSavingStatus(true);
    try {
      await setOrderStatus(orderId, next);
      // Optional: also log a status_changed event
      await supabase.rpc("falcon_mvp.rpc_add_order_event", {
        p_order_id: orderId,
        p_event_type: "status_changed",
        p_event_data: { from: order.status, to: next },
        p_message: `Status changed: ${order.status} → ${next}`,
        p_kind: "status",
      });
      await reload();
    } finally {
      setSavingStatus(false);
    }
  };

  if (!orderId) return <div>Missing order id.</div>;
  if (loading) return <div>Loading order…</div>;
  if (err) return <div className="text-red-600">{err}</div>;
  if (!order) return <div>Order not found.</div>;

  const title =
    order.address
      ? `${order.address}${order.city ? `, ${order.city}` : ""}${
          order.state ? `, ${order.state}` : ""
        }`
      : `Order ${order.id}`;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="text-sm opacity-70">
            Client: {order.client_name ?? "—"} · Status:{" "}
            <span className="font-medium">{order.status}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="border rounded p-2"
            value={order.status}
            onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
            disabled={savingStatus}
          >
            <option value="new">New</option>
            <option value="in_review">In review</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            className="rounded border px-3 py-2"
            onClick={onArchive}
            title="Archive"
          >
            Archive
          </button>
        </div>
      </div>

      {/* 3-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Basics / Assign */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium mb-2">Assignment</div>
            <AssignControl
              orderId={orderId}
              onAssigned={async () => {
                await reload();
              }}
            />
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium mb-2">Details</div>
            <div className="text-sm grid grid-cols-2 gap-x-3 gap-y-1">
              <span className="opacity-60">Address</span>
              <span>{order.address ?? "—"}</span>
              <span className="opacity-60">City</span>
              <span>{order.city ?? "—"}</span>
              <span className="opacity-60">State</span>
              <span>{order.state ?? "—"}</span>
              <span className="opacity-60">Postal</span>
              <span>{order.postal_code ?? "—"}</span>
              <span className="opacity-60">Due</span>
              <span>{order.due_date ?? "—"}</span>
              <span className="opacity-60">Assignee</span>
              <span>{order.assignee_name ?? "Unassigned"}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Activity (default) */}
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium mb-2">Activity</div>
          <ActivityPanel orderId={orderId} />
        </div>

        {/* Column 3: Files / Map placeholder */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium mb-2">Files</div>
            <OrderFilesPanel orderId={orderId} />
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium mb-2">Map</div>
            <div className="h-40 rounded border border-dashed grid place-items-center text-xs opacity-70">
              Map placeholder
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;




