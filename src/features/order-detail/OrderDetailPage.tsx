import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { fetchOrder } from "@/api/fetchOrder";
import { archiveOrder } from "@/api/archiveOrder";

// Be compatible with either default or named exports
import * as ActivityTimelineMod from "./ActivityTimeline";
import * as NoteComposerMod from "./NoteComposer";
const ActivityTimeline =
  // @ts-ignore
  (ActivityTimelineMod as any).default ?? (ActivityTimelineMod as any).ActivityTimeline;
const NoteComposer =
  // @ts-ignore
  (NoteComposerMod as any).default ?? (NoteComposerMod as any).NoteComposer;

type OrderVM = {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  status: "new" | "in_review" | "completed" | "cancelled";
  client_name: string | null;
  assignee_name: string | null;
  due_date: string | null;
  is_archived?: boolean | null;
  appointment_start?: string | null;
  appointment_end?: string | null;
};

function fmtAddr(o: OrderVM) {
  const parts = [o.address, o.city, o.state].filter(Boolean);
  return parts.length ? parts.join(", ") : "No address";
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  // show local date/time short
  return d.toLocaleString();
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const orderId = id ?? "";

  const reload = async () => {
    setLoading(true);
    setErr(null);
    try {
      // 1) Try the standard view (non-archived)
      const data = await fetchOrder(orderId).catch(async () => {
        // 2) If not found (e.g., archived), fall back to v_orders_all
        const { data, error } = await supabase
          .from("v_orders_all")
          .select("*")
          .eq("id", orderId)
          .single();
        if (error) throw error;
        return data as any;
      });
      setOrder(data as OrderVM);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const statusChip = useMemo(() => {
    if (!order) return null;
    return (
      <span className="px-2 py-1 text-sm rounded bg-gray-200">
        {order.status}
      </span>
    );
  }, [order]);

  async function onArchiveToggle() {
    if (!order) return;
    try {
      const next = !(order.is_archived ?? false);
      await archiveOrder(order.id, next);
      await reload(); // reflect changes even if archived
    } catch (e: any) {
      setErr(e?.message ?? "Failed to toggle archive");
    }
  }

  if (!orderId) return <div className="p-6">Missing order id.</div>;
  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!order) return <div className="p-6">Order not found.</div>;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{fmtAddr(order)}</h2>
          <div className="text-sm text-gray-600">
            <span className="mr-2"><strong>Client:</strong> {order.client_name ?? "N/A"}</span>
            <span className="mr-2"><strong>Assignee:</strong> {order.assignee_name ?? "Unassigned"}</span>
            <span className="mr-2"><strong>Due:</strong> {order.due_date ?? "—"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusChip}
          <button
            className="px-2 py-1 border rounded"
            onClick={() => navigate(`/orders/${order.id}/appointment`)}
            title="Set appointment"
          >
            Appointment
          </button>
          <button
            className="px-2 py-1 border rounded"
            onClick={onArchiveToggle}
            title={order.is_archived ? "Restore order" : "Archive order"}
          >
            {order.is_archived ? "Restore" : "Archive"}
          </button>
        </div>
      </header>

      {/* Appointment summary (if any) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div><strong>Status:</strong> {order.status}</div>
          <div><strong>Archived:</strong> {(order.is_archived ?? false) ? "Yes" : "No"}</div>
        </div>
        <div className="space-y-1">
          <div><strong>Appointment start:</strong> {fmtDate(order.appointment_start)}</div>
          <div><strong>Appointment end:</strong> {fmtDate(order.appointment_end)}</div>
        </div>
        <div className="space-y-1">
          <div><strong>Postal:</strong> {order.postal_code ?? "—"}</div>
        </div>
      </section>

      {/* Timeline + Note composer */}
      <section className="space-y-4">
        {ActivityTimeline ? <ActivityTimeline orderId={order.id} /> : null}
        {NoteComposer ? <NoteComposer orderId={order.id} /> : null}
      </section>
    </div>
  );
}


