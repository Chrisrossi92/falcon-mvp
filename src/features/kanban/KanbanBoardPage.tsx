import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { setOrderStatus } from "@/api/setOrderStatus";
import type { OrderStatus, OrderView } from "@/types/domain";
import Loading from "@/components/Loading";
import ErrorState from "@/components/ErrorState";

type Board = Record<OrderStatus, OrderView[]>;

const ALL_COLS: { key: OrderStatus; label: string }[] = [
  { key: "new",        label: "New" },
  { key: "in_review",  label: "In Review" },
  { key: "completed",  label: "Completed" },
  { key: "cancelled",  label: "Cancelled" },
];

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  new: ["in_review", "cancelled"],
  in_review: ["completed", "cancelled"],
  completed: ["in_review"],
  cancelled: ["in_review"],
};

function byCreatedDesc(a: OrderView, b: OrderView) {
  return (b.created_at || "").localeCompare(a.created_at || "");
}

export default function KanbanBoardPage() {
  const nav = useNavigate();
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [board, setBoard] = useState<Board>({
    new: [], in_review: [], completed: [], cancelled: []
  });

  const columns = useMemo(
    () => includeCancelled ? ALL_COLS : ALL_COLS.filter(c => c.key !== "cancelled"),
    [includeCancelled]
  );

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const statuses: OrderStatus[] = includeCancelled
        ? ["new","in_review","completed","cancelled"]
        : ["new","in_review","completed"];
      const { data, error } = await supabase
        .from("v_orders")
        .select("*")
        .in("status", statuses)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const next: Board = { new: [], in_review: [], completed: [], cancelled: [] };
      (data as any[]).forEach(row => {
        const s = row.status as OrderStatus;
        if (next[s]) next[s].push(row as OrderView);
      });
      // ensure consistent sorting
      (Object.keys(next) as OrderStatus[]).forEach(k => next[k].sort(byCreatedDesc));
      setBoard(next);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load board");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [includeCancelled]);

  // Realtime refresh on inserts/updates to orders
  useEffect(() => {
    const ch = supabase.channel("kanban_orders")
      .on("postgres_changes", { event: "INSERT", schema: "falcon_mvp", table: "orders" }, () => load())
      .on("postgres_changes", { event: "UPDATE", schema: "falcon_mvp", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  function onDragStart(e: React.DragEvent, orderId: string, from: OrderStatus) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ orderId, from }));
    e.dataTransfer.effectAllowed = "move";
  }

  function allowDrop(e: React.DragEvent) {
    e.preventDefault(); // allow drop
  }

  async function onDrop(e: React.DragEvent, to: OrderStatus) {
    e.preventDefault();
    try {
      const payload = JSON.parse(e.dataTransfer.getData("text/plain")) as { orderId: string; from: OrderStatus };
      const { orderId, from } = payload;
      if (from === to) return;
      if (!ALLOWED[from].includes(to)) {
        alert(`Invalid transition: ${from} → ${to}`);
        return;
      }

      // optimistic move
      setBoard(prev => {
        const copy: Board = {
          new: [...prev.new],
          in_review: [...prev.in_review],
          completed: [...prev.completed],
          cancelled: [...prev.cancelled],
        };
        const idx = copy[from].findIndex(o => o.id === orderId);
        if (idx >= 0) {
          const [card] = copy[from].splice(idx, 1);
          copy[to].unshift({ ...card, status: to });
        }
        return copy;
      });

      // persist
      await setOrderStatus({ orderId, newStatus: to });
      // reload to normalize ordering/derived fields
      await load();
    } catch (err) {
      console.error(err);
      alert((err as any)?.message ?? "Move failed");
      // hard reload board to ensure consistency after failure
      load();
    }
  }

  function Card({ o }: { o: OrderView }) {
    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(e, o.id, o.status)}
        className="rounded-lg border bg-white shadow-sm p-3 cursor-grab active:cursor-grabbing"
        title="Drag to another column to change status"
      >
        <div className="font-medium text-sm">
          {[o.address, o.city, o.state].filter(Boolean).join(", ") || "No address"}
        </div>
        <div className="text-xs text-gray-600">
          {o.client_name ?? "—"} • {o.assignee_name ?? "Unassigned"}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          Due: {o.due_date ?? "—"}
        </div>
        <div className="mt-2">
          <button
            className="text-xs underline"
            onClick={() => nav(`/orders/${o.id}`)}
          >
            Open order
          </button>
        </div>
      </div>
    );
  }

  function Column({ s }: { s: OrderStatus }) {
    const col = board[s];
    return (
      <div
        onDragOver={allowDrop}
        onDrop={(e) => onDrop(e, s)}
        className="flex flex-col gap-2 bg-gray-50 rounded-xl border p-3 min-h-[200px]"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold">{ALL_COLS.find(c => c.key === s)?.label}</div>
          <div className="text-xs text-gray-600">{col?.length ?? 0}</div>
        </div>
        <div className="flex flex-col gap-2">
          {(col ?? []).map(o => <Card key={o.id} o={o} />)}
          {(col ?? []).length === 0 && (
            <div className="text-xs text-gray-500 italic">No cards</div>
          )}
        </div>
      </div>
    );
  }

  if (loading) return <Loading />;
  if (err) return <ErrorState message={err} />;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Kanban Board</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeCancelled}
              onChange={(e) => setIncludeCancelled(e.target.checked)}
            />
            Show cancelled
          </label>
          <button className="px-2 py-1 border rounded" onClick={load}>Refresh</button>
        </div>
      </div>

      <div
        className={`grid gap-3 ${includeCancelled ? "md:grid-cols-4" : "md:grid-cols-3"} grid-cols-1`}
      >
        {columns.map(c => <Column key={c.key} s={c.key} />)}
      </div>
    </div>
  );
}
