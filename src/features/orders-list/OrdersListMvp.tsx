// src/features/orders-list/OrdersListMvp.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { fetchOrders, type OrderFilters } from "@/api/fetchOrders";
import type { OrderView } from "@/types/domain";
import OrdersFilterBar from "./OrdersFilterBar";

// Future-ready drawer + subpanels (all stubs provided in this PR)
import OrderDrawer from "./components/OrderDrawer";

type LoadState =
  | { phase: "idle" | "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready" };

const DEFAULT_FILTERS: OrderFilters = {
  q: "",
  status: undefined,     // e.g., ["new","in_review"]
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
  const [state, setState] = useState<LoadState>({ phase: "idle" });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const data = await fetchOrders(filters);
      setRows(data ?? []);
      setState({ phase: "ready" });
    } catch (e: any) {
      setRows([]);
      setState({ phase: "error", message: e?.message ?? "Failed to load orders" });
    }
  }, [filters]);

  // Initial + whenever filters change
  useEffect(() => { load(); }, [load]);

  // Realtime refresh on changes to falcon_mvp.orders
  useEffect(() => {
    const ch = supabase
      .channel("orders_list_mvp")
      .on("postgres_changes", { event: "*", schema: "falcon_mvp", table: "orders" }, () => {
        // Light debounce: only reload if we're already ready; otherwise allow current load to settle.
        if (state.phase === "ready") load();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, load]);

  // Derived view for quick text search (client-side) layered on top of API filtering
  const filtered = useMemo(() => {
    const needle = (filters.q ?? "").trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((o) =>
      [o.id, o.title, o.status, o.address, o.client_display_name]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(needle))
    );
  }, [rows, filters.q]);

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
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              textDecoration: "none",
            }}
          >
            + New Order
          </Link>
        </div>
      </header>

      {/* Unified filter bar (status, assignee, client, dates, includeArchived, q) */}
      <OrdersFilterBar value={filters} onChange={setFilters} />

      {state.phase === "error" && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "#fff3f3",
            border: "1px solid #ffd0d0",
            color: "#a40000",
          }}
        >
          <strong>Error:</strong> {(state as any).message}
          <div style={{ marginTop: 4, opacity: 0.8 }}>
            Tip: ensure you’re signed in and RLS allows reading your org’s orders.
          </div>
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
                <tr>
                  <td colSpan={6} style={tdMuted}>Loading…</td>
                </tr>
              )}
              {state.phase !== "loading" && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={tdMuted}>No orders found.</td>
                </tr>
              )}
              {state.phase !== "loading" &&
                filtered.map((o) => (
                  <tr key={o.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={td}>
                      <button
                        onClick={() => setSelectedOrderId(o.id)}
                        style={linkBtn}
                        title="Open details"
                      >
                        {o.title || o.address || "(untitled)"}
                        {o.is_archived ? " · (archived)" : ""}
                      </button>
                    </td>
                    <td style={td}>{o.client_display_name ?? "-"}</td>
                    <td style={td}>{o.status ?? "-"}</td>
                    <td style={td}>{o.assignee_name ?? "—"}</td>
                    <td style={td}>{o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <Link to={`/orders/${o.id}`} style={smallLink}>
                        Go to page →
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer (future panels already wired) */}
      {selectedOrderId && (
        <OrderDrawer
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          // Future-ready props (no-ops now, real handlers will be added later)
          onUpdated={() => load()}
        />
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 600,
  borderBottom: "1px solid #eee",
  fontSize: 14,
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "middle",
  fontSize: 14,
};

const tdMuted: React.CSSProperties = {
  ...td,
  color: "#777",
  textAlign: "center",
};

const linkBtn: React.CSSProperties = {
  padding: 0,
  margin: 0,
  border: "none",
  background: "none",
  textDecoration: "underline",
  cursor: "pointer",
  font: "inherit",
};

const smallLink: React.CSSProperties = {
  textDecoration: "none",
  border: "1px solid #ddd",
  padding: "4px 8px",
  borderRadius: 6,
  fontSize: 12,
};






