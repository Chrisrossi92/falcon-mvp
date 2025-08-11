import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { setOrderStatus } from "@/api/setOrderStatus";
import { assignOrder } from "@/api/assignOrder";
import { getKanbanSettings, updateKanbanSettings, toWipMap, type WipMap } from "@/api/kanbanSettings";
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

type DragPayload = { orderId: string; from: OrderStatus; fromAssignee: string | null };

export default function KanbanBoardPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [board, setBoard] = useState<Board>({ new: [], in_review: [], completed: [], cancelled: [] });
  const [wip, setWip] = useState<WipMap>({});
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [groupByAssignee, setGroupByAssignee] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const columns = useMemo(
    () => includeCancelled ? ALL_COLS : ALL_COLS.filter(c => c.key !== "cancelled"),
    [includeCancelled]
  );

  // lanes (assignees) derived from data
  const lanes = useMemo(() => {
    const m = new Map<string, { id: string | null; name: string }>();
    (Object.keys(board) as OrderStatus[]).forEach(s => {
      board[s].forEach(o => {
        const id = o.assigned_to ?? null;
        const key = id ?? "__null__";
        if (!m.has(key)) m.set(key, { id, name: o.assignee_name ?? "Unassigned" });
      });
    });
    const arr = Array.from(m.values());
    arr.sort((a, b) => {
      if (a.id === null && b.id !== null) return 1; // Unassigned last
      if (a.id !== null && b.id === null) return -1;
      return (a.name || "").localeCompare(b.name || "");
    });
    return arr;
  }, [board]);

  // load settings + data
  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const [{ settings, wip: w }, orders] = await Promise.all([
        getKanbanSettings(),
        supabase.from("v_orders").select("*").order("created_at", { ascending: false })
      ]);
      const next: Board = { new: [], in_review: [], completed: [], cancelled: [] };
      if (orders.error) throw orders.error;
      (orders.data as any[]).forEach(row => {
        const s = row.status as OrderStatus;
        if (next[s]) next[s].push(row as OrderView);
      });
      (Object.keys(next) as OrderStatus[]).forEach(k => next[k].sort(byCreatedDesc));
      setBoard(next);
      setWip(w);
      setIncludeCancelled(!!settings.show_cancelled);
      setGroupByAssignee(!!settings.group_by_assignee_default);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load board");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  // realtime refresh
  useEffect(() => {
    const ch = supabase.channel("kanban_orders")
      .on("postgres_changes", { event: "INSERT", schema: "falcon_mvp", table: "orders" }, () => loadAll())
      .on("postgres_changes", { event: "UPDATE", schema: "falcon_mvp", table: "orders" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  function onDragStart(e: React.DragEvent, payload: DragPayload) {
    e.dataTransfer.setData("text/plain", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  }
  function allowDrop(e: React.DragEvent) { e.preventDefault(); }

  function atLimit(status: OrderStatus) {
    const lim = wip[status];
    if (lim == null) return false;
    // count across all lanes; WIP is per column (global)
    const count = board[status]?.length ?? 0;
    return count >= lim;
  }

  async function dropTo(to: { status: OrderStatus; assignee?: string | null }, e: React.DragEvent) {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain")) as DragPayload;
      const { orderId, from, fromAssignee } = data;
      const toAssignee = ('assignee' in to) ? (to.assignee ?? null) : fromAssignee;
      const toStatus = to.status;

      if (from === toStatus && fromAssignee === toAssignee) return;

      // status transition validation
      if (from !== toStatus && !ALLOWED[from].includes(toStatus)) {
        alert(`Invalid transition: ${from} → ${toStatus}`);
        return;
      }
      // WIP guard
      if (from !== toStatus && atLimit(toStatus)) {
        const lim = wip[toStatus];
        alert(`WIP limit reached for ${toStatus}${lim ? ` (${lim})` : ""}`);
        return;
      }

      // optimistic move
      setBoard(prev => {
        const copy: Board = {
          new: [...prev.new], in_review: [...prev.in_review], completed: [...prev.completed], cancelled: [...prev.cancelled],
        };
        const idx = copy[from].findIndex(o => o.id === orderId);
        if (idx >= 0) {
          const [card] = copy[from].splice(idx, 1);
          copy[toStatus].unshift({ ...card, status: toStatus, assigned_to: toAssignee, assignee_name: (toAssignee === fromAssignee) ? card.assignee_name : (toAssignee ? card.assignee_name : "Unassigned") });
        }
        return copy;
      });

      // persist (status first, then assignment if needed)
      if (from !== toStatus) await setOrderStatus({ orderId, newStatus: toStatus });
      if (fromAssignee !== toAssignee) await assignOrder(orderId, toAssignee ?? null);

      await loadAll();
    } catch (err) {
      console.error(err);
      alert((err as any)?.message ?? "Move failed");
      loadAll();
    }
  }

  function Card({ o }: { o: OrderView }) {
    const payload: DragPayload = { orderId: o.id, from: o.status, fromAssignee: o.assigned_to ?? null };
    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(e, payload)}
        className="rounded-lg border bg-white shadow-sm p-3 cursor-grab active:cursor-grabbing"
        title="Drag to another cell/column"
      >
        <div className="font-medium text-sm">
          {[o.address, o.city, o.state].filter(Boolean).join(", ") || "No address"}
        </div>
        <div className="text-xs text-gray-600">
          {o.client_name ?? "—"} • {o.assignee_name ?? "Unassigned"}
        </div>
        <div className="text-xs text-gray-600 mt-1">Due: {o.due_date ?? "—"}</div>
        <div className="mt-2">
          <button className="text-xs underline" onClick={() => nav(`/orders/${o.id}`)}>Open order</button>
        </div>
      </div>
    );
  }

  function ColHeader({ s }: { s: OrderStatus }) {
    const label = ALL_COLS.find(c => c.key === s)?.label ?? s;
    const cnt = board[s]?.length ?? 0;
    const lim = wip[s];
    return (
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{label}</div>
        <div className={`text-xs ${lim != null && cnt > lim ? "text-red-600" : "text-gray-600"}`}>
          {lim != null ? `${cnt}/${lim}` : `${cnt}`}
        </div>
      </div>
    );
  }

  function Column({ s }: { s: OrderStatus }) {
    const col = board[s];
    return (
      <div onDragOver={allowDrop} onDrop={(e) => dropTo({ status: s }, e)} className="flex flex-col gap-2 bg-gray-50 rounded-xl border p-3 min-h-[200px]">
        <ColHeader s={s} />
        <div className="flex flex-col gap-2">
          {(col ?? []).map(o => <Card key={o.id} o={o} />)}
          {(col ?? []).length === 0 && <div className="text-xs text-gray-500 italic">No cards</div>}
        </div>
      </div>
    );
  }

  function Cell({ s, assignee }: { s: OrderStatus; assignee: { id: string | null; name: string } }) {
    const items = (board[s] ?? []).filter(o => (o.assigned_to ?? null) === assignee.id);
    return (
      <div
        onDragOver={allowDrop}
        onDrop={(e) => dropTo({ status: s, assignee: assignee.id }, e)}
        className="flex flex-col gap-2 bg-gray-50 rounded-xl border p-3 min-h-[140px]"
      >
        {(items ?? []).map(o => <Card key={o.id} o={o} />)}
        {items.length === 0 && <div className="text-xs text-gray-400 italic">—</div>}
      </div>
    );
  }

  function SettingsPanel() {
    const [wNew, setWNew] = useState<string>(wip.new == null ? "" : String(wip.new));
    const [wInr, setWInr] = useState<string>(wip.in_review == null ? "" : String(wip.in_review));
    const [wCmp, setWCmp] = useState<string>(wip.completed == null ? "" : String(wip.completed));
    const [wCan, setWCan] = useState<string>(wip.cancelled == null ? "" : String(wip.cancelled));
    const [saving, setSaving] = useState(false);
    const [errMsg, setErrMsg] = useState<string | null>(null);

    async function save() {
      setSaving(true);
      setErrMsg(null);
      try {
        const patch = {
          wip_new: wNew === "" ? null : Math.max(0, Number(wNew) || 0),
          wip_in_review: wInr === "" ? null : Math.max(0, Number(wInr) || 0),
          wip_completed: wCmp === "" ? null : Math.max(0, Number(wCmp) || 0),
          wip_cancelled: wCan === "" ? null : Math.max(0, Number(wCan) || 0),
          show_cancelled: includeCancelled,
          group_by_assignee_default: groupByAssignee,
        };
        const { settings } = await updateKanbanSettings(patch);
        setWip(toWipMap(settings));
        setSettingsOpen(false);
      } catch (e: any) {
        setErrMsg(e?.message ?? "Save failed");
      } finally {
        setSaving(false);
      }
    }

    return (
      <div className="rounded-xl border p-3 bg-white shadow-sm space-y-3">
        <div className="text-sm font-semibold">Board settings</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="block text-xs text-gray-600">WIP: New</label>
            <input className="border rounded px-2 py-1 w-full" placeholder="∞" value={wNew} onChange={e => setWNew(e.target.value)} />
          </div>
          <div><label className="block text-xs text-gray-600">WIP: In Review</label>
            <input className="border rounded px-2 py-1 w-full" placeholder="∞" value={wInr} onChange={e => setWInr(e.target.value)} />
          </div>
          <div><label className="block text-xs text-gray-600">WIP: Completed</label>
            <input className="border rounded px-2 py-1 w-full" placeholder="∞" value={wCmp} onChange={e => setWCmp(e.target.value)} />
          </div>
          <div><label className="block text-xs text-gray-600">WIP: Cancelled</label>
            <input className="border rounded px-2 py-1 w-full" placeholder="∞" value={wCan} onChange={e => setWCan(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={includeCancelled} onChange={(e) => setIncludeCancelled(e.target.checked)} />
            Show cancelled column
          </label>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={groupByAssignee} onChange={(e) => setGroupByAssignee(e.target.checked)} />
            Group by assignee by default
          </label>
        </div>
        {errMsg && <div className="text-red-600 text-sm">{errMsg}</div>}
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded bg-black text-white disabled:opacity-50" disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button className="px-3 py-1 border rounded" onClick={() => setSettingsOpen(false)}>Close</button>
        </div>
      </div>
    );
  }

  if (loading) return <Loading />;
  if (err) return <ErrorState message={err} />;

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold">Kanban Board</h1>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={groupByAssignee} onChange={(e) => setGroupByAssignee(e.target.checked)} />
            Group by assignee (swimlanes)
          </label>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={includeCancelled} onChange={(e) => setIncludeCancelled(e.target.checked)} />
            Show cancelled
          </label>
          <button className="px-2 py-1 border rounded" onClick={() => setSettingsOpen(v => !v)}>
            {settingsOpen ? "Close settings" : "Board settings"}
          </button>
          <button className="px-2 py-1 border rounded" onClick={loadAll}>Refresh</button>
        </div>
      </div>

      {settingsOpen && <SettingsPanel />}

      {!groupByAssignee ? (
        <div className={`grid gap-3 ${includeCancelled ? "md:grid-cols-4" : "md:grid-cols-3"} grid-cols-1`}>
          {columns.map(c => <div key={c.key}><Column s={c.key} /></div>)}
        </div>
      ) : (
        <div className="space-y-3">
          {/* header row */}
          <div className={`grid gap-3 ${includeCancelled ? "md:grid-cols-5" : "md:grid-cols-4"} grid-cols-1`}>
            <div className="text-sm font-semibold text-gray-600">Assignee</div>
            {columns.map(c => (
              <div key={c.key} className="px-1"><ColHeader s={c.key} /></div>
            ))}
          </div>
          {/* lanes */}
          {lanes.map(lane => (
            <div key={lane.id ?? "__null__"} className={`grid gap-3 ${includeCancelled ? "md:grid-cols-5" : "md:grid-cols-4"} grid-cols-1`}>
              <div className="px-1 py-2 text-sm font-medium">{lane.name}</div>
              {columns.map(c => (
                <Cell key={`${lane.id ?? "null"}:${c.key}`} s={c.key} assignee={lane} />
              ))}
            </div>
          ))}
          {lanes.length === 0 && <div className="text-sm text-gray-500">No cards.</div>}
        </div>
      )}
    </div>
  );
}

