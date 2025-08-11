// src/features/orders-list/OrdersListMvp.tsx
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { fetchOrders, type OrderFilters, type FetchOrdersResult } from "@/api/fetchOrders";
import type { OrderView } from "@/api/fetchOrders";
import OrdersFilterBar from "./OrdersFilterBar";
import OrderDrawer from "./components/OrderDrawer";

type LoadState =
  | { phase: "idle" | "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready" };

const DEFAULT_FILTERS: OrderFilters = {
  q: "",
  status: undefined,
  assigneeId: null,
  clientId: null,
  includeArchived: false,
  dueFrom: null,
  dueTo: null,
  page: 1,
  pageSize: 50,
};

export default function OrdersListMvp() {
  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_FILTERS);
  const [rows, setRows] = useState<OrderView[]>([]);
  const [count, setCount] = useState(0);
  const [state, setState] = useState<LoadState>({ phase: "idle" });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(count / (filters.pageSize ?? 50)));

  const load = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const { rows, count }: FetchOrdersResult = await fetchOrders(filters);
      setRows(rows);
      setCount(count);
      setState({ phase: "ready" });
    } catch (e: any) {
      setRows([]);
      setCount(0);
      setState({ phase: "error", message: e?.message ?? "Failed to load orders" });
    }
  }, [filters]);

  // Initial + whenever filters change
  useEffect(() => { load(); }, [load]);

  // Realtime refresh
  useEffect(() => {
    const ch = supabase
      .channel("orders_list_mvp")
      .on("postgres_changes", { event: "*", schema: "falcon_mvp", table: "orders" }, () => {
        if (state.phase === "ready") load();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, load]);

  const goPage = (p: number) =>
    setFilters((f) => ({ ...f, page: Math.min(Math.max(1, p), totalPages) }));

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Orders</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => load()}
            disabled={state.phase === "loading"}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", cursor: "pointer" }}
          >
            {state.phase === "loading" ? "Loading…" : "Reload"}
          </button>
          <Link
            to="/orders/new"
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", textDecoration: "none" }}
          >
            + New Order
          </Link>
        </div>
      </header>

      <OrdersFilterBar value={filters} onChange={(next) => {
        // Reset to page 1 when any filter except page changes
        setFilters((prev) => ({ ...prev, ...next, page: 1 }));
      }} />

      {/* Pager */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => goPage((filters.page ?? 1) - 1)}
          disabled={(filters.page ?? 1) <= 1 || state.phase === "loading"}
          style={pagerBtn}
        >
          ◀ Prev
        </button>
        <div style={{ fontSize: 13, color: "#666" }}>
          Page {(filters.page ?? 1)} of {totalPages} · {count} total
        </div>
        <button
          onClick={() => goPage((filters.page ?? 1) + 1)}
          disabled={(filters.page ?? 1) >= totalPages || state.phase === "loading"}
          style={pagerBtn}
        >
          Next ▶
        </button>
      </div>

      {state.phase === "error" && (
        <div style={{ padding: 12, borderRadius: 8, background: "#fff3f3", border: "1px solid #ffd0d0", color: "#a40000" }}>
          <strong>Error:</strong> {(state as any).message}
        </div>
      )}

      {state.phase !== "error" && (
        <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#fafafa" }}>
              <tr>
                <th style={th}>Title</th>
                <th style={th}>Client</th>
                <th style={th}>Status</th>
                <th style={th}>Assigned To</th>
                <th style={th}>Created</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {state.phase === "loading" && (
                <tr><td colSpan={6} style={tdMuted}>Loading…</td></tr>
              )}
              {state.phase !== "loading" && rows.length === 0 && (
                <tr><td colSpan={6} style={tdMuted}>No orders found.</td></tr>
              )}
              {state.phase !== "loading" && rows.map((o) => (
                <tr key={o.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td style={td}>
                    <button onClick={() => setSelectedOrderId(o.id)} style={linkBtn} title="Open details">
                      {o.title || (o as any).address || "(untitled)"}{(o as any).is_archived ? " · (archived)" : ""}
                    </button>
                  </td>
                  <td style={td}>{(o as any).client_display_name ?? "-"}</td>
                  <td style={td}>{o.status ?? "-"}</td>
                  <td style={td}>{(o as any).assignee_name ?? "—"}</td>
                  <td style={td}>{o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <Link to={`/orders/${o.id}`} style={smallLink}>Go to page →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      {selectedOrderId && (
        <OrderDrawer
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onUpdated={() => load()}
        />
      )}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontWeight: 600, borderBottom: "1px solid #eee", fontSize: 14 };
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "middle", fontSize: 14 };
const tdMuted: React.CSSProperties = { ...td, color: "#777", textAlign: "center" };
const linkBtn: React.CSSProperties = { padding: 0, margin: 0, border: "none", background: "none", textDecoration: "underline", cursor: "pointer", font: "inherit" };
const smallLink: React.CSSProperties = { textDecoration: "none", border: "1px solid #ddd", padding: "4px 8px", borderRadius: 6, fontSize: 12 };
const pagerBtn: React.CSSProperties = { padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", background: "#fff" };








