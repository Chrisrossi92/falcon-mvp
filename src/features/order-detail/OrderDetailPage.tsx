import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchOrder } from "@/api/fetchOrder";
import ActivityTimeline from "./ActivityTimeline";
import NoteComposer from "./NoteComposer";

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
};

const OrderDetailPage: React.FC = () => {
  const params = useParams();
  const orderId = (params as { id?: string }).id;
  const [order, setOrder] = useState<OrderVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    if (!orderId) return;
    setLoading(true);
    fetchOrder(orderId)
      .then((data: any) => {
        if (!alive) return;
        setOrder({
          id: data.id,
          address: data.address,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          status: data.status,
          client_name: data.client_name ?? null,
          assignee_name: data.assignee_name ?? null,
          due_date: data.due_date ?? null,
        });
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [orderId]);

  if (!orderId) return <div>Missing order id.</div>;
  if (loading) return <div>Loading…</div>;
  if (err || !order) return <div>Couldn’t load the order.</div>;

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {order.address ?? "No address"}
          {order.city ? `, ${order.city}` : ""}{order.state ? `, ${order.state}` : ""}
        </h2>
        <span className="px-2 py-1 text-sm rounded bg-gray-200">{order.status}</span>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div><strong>Client:</strong> {order.client_name ?? "N/A"}</div>
          <div><strong>Assignee:</strong> {order.assignee_name ?? "Unassigned"}</div>
        </div>
        <div className="space-y-2">
          <div><strong>Postal:</strong> {order.postal_code ?? "—"}</div>
          <div><strong>Due:</strong> {order.due_date ?? "—"}</div>
        </div>
      </section>

      <section className="space-y-4">
        <ActivityTimeline orderId={orderId} />
        <NoteComposer orderId={orderId} />
      </section>
    </div>
  );
};

export default OrderDetailPage;

