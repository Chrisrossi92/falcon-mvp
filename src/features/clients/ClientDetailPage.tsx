// src/features/clients/ClientDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { fetchClient, type Client } from "@/api/fetchClient";
import { fetchClientOrders } from "@/api/fetchClientOrders";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams(); // future: tabs
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load(cid: string) {
    setLoading(true); setErr(null);
    try {
      const [c, o] = await Promise.all([fetchClient(cid), fetchClientOrders(cid)]);
      setClient(c); setOrders(o);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load client");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (id) load(id); }, [id]);

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>{client?.display_name ?? "Client"}</h1>
          <div style={{ color: "#666", marginTop: 4 }}>{client?.kind?.toUpperCase() ?? ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/clients" style={btn}>← Back</Link>
          <Link to={`/orders/new?client=${id}`} style={btn}>+ New Order</Link>
        </div>
      </header>

      {err && <div style={{ color: "#a00" }}>Error: {err}</div>}
      {loading && <div>Loading…</div>}
      {!loading && !client && <div>Not found.</div>}

      {!loading && client && (
        <>
          <section style={card}>
            <h3 style={h3}>Overview</h3>
            <div><strong>ID:</strong> {client.id}</div>
            <div><strong>Notes:</strong> {client.notes ?? "—"}</div>
            <div><strong>Created:</strong> {new Date(client.created_at).toLocaleString()}</div>
          </section>

          <section style={card}>
            <h3 style={h3}>Orders</h3>
            <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#fafafa" }}>
                  <tr>
                    <th style={th}>Title</th>
                    <th style={th}>Status</th>
                    <th style={th}>Assigned</th>
                    <th style={th}>Created</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 && <tr><td colSpan={5} style={tdMuted}>No orders yet.</td></tr>}
                  {orders.map((o) => (
                    <tr key={o.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                      <td style={td}>
                        <Link to={`/orders/${o.id}`} style={{ textDecoration: "underline", color: "inherit" }}>
                          {o.title || o.address || "(untitled)"}
                        </Link>
                      </td>
                      <td style={td}>{o.status ?? "-"}</td>
                      <td style={td}>{o.assignee_name ?? "—"}</td>
                      <td style={td}>{o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</td>
                      <td style={{ ...td, textAlign: "right" }}>
                        <Link to={`/orders/${o.id}`} style={smallLink}>Open →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

const btn: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", textDecoration: "none" };
const card: React.CSSProperties = { border: "1px solid #eee", borderRadius: 10, padding: 12, background: "#fff" };
const h3: React.CSSProperties = { margin: "0 0 10px 0" };
const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontWeight: 600, borderBottom: "1px solid #eee", fontSize: 14 };
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "middle", fontSize: 14 };
const tdMuted: React.CSSProperties = { ...td, color: "#777", textAlign: "center" };
const smallLink: React.CSSProperties = { textDecoration: "none", border: "1px solid #ddd", padding: "4px 8px", borderRadius: 6, fontSize: 12 };
