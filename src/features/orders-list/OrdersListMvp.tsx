// src/features/orders-list/OrdersListMvp.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

type OrderRow = {
  id: string;
  title: string | null;
  status: string | null;
  assigned_to: string | null;
  is_archived: boolean;
  created_at: string;
  client_id: string | null;
};

export default function OrdersListMvp() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);

  async function load() {
    setLoading(true);
    setErrMsg(null);
    const table = includeArchived ? "v_orders_all" : "v_orders";
    const { data, error } = await supabase
      .from<OrderRow>(table)
      .select("id,title,status,assigned_to,is_archived,created_at,client_id")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      setErrMsg(error.message);
      setOrders([]);
    } else {
      setOrders(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeArchived]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return orders ?? [];
    return (orders ?? []).filter((o) =>
      [o.id, o.title, o.status]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(needle))
    );
  }, [orders, q]);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Orders</h1>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by id / title / status…"
          style={{ flex: 1, padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8 }}
        />
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
          />
          Include archived
        </label>
        <button
          onClick={load}
          disabled={loading}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: loading ? "#f3f3f3" : "white",
            cursor: loading ? "default" : "pointer",
          }}
        >
          Reload
        </button>
      </div>

      {loading && <div>Loading…</div>}

      {!loading && errMsg && (
        <div style={{ color: "#b00020", marginTop: 8 }}>
          Error: {errMsg}
          <div style={{ color: "#666", marginTop: 4, fontSize: 13 }}>
            Tip: ensure you’re signed in and RLS allows reading your org’s orders.
          </div>
        </div>
      )}

      {!loading && !errMsg && filtered.length === 0 && (
        <div style={{ color: "#666" }}>No orders found.</div>
      )}

      {!loading && !errMsg && filtered.length > 0 && (
        <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 140px 160px 200px",
              gap: 0,
              padding: "10px 12px",
              background: "#fafafa",
              borderBottom: "1px solid #eee",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <div>Title</div>
            <div>Status</div>
            <div>Assigned To</div>
            <div>Created</div>
          </div>
          {filtered.map((o) => (
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 140px 160px 200px",
                padding: "10px 12px",
                textDecoration: "none",
                color: "inherit",
                borderBottom: "1px solid #f2f2f2",
              }}
            >
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {o.title || "(untitled)"} {o.is_archived ? " · (archived)" : ""}
              </div>
              <div>{o.status ?? "-"}</div>
              <div>{o.assigned_to ?? "-"}</div>
              <div>{new Date(o.created_at).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}





