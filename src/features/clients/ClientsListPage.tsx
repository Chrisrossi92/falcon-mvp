// src/features/clients/ClientsListPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listClients } from "@/api/listClients";

type Row = { id: string; display_name: string };

export default function ClientsListPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load(query: string) {
    setLoading(true);
    setErr(null);
    try {
      const data = await listClients(query, 200);
      setRows(data as any);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(""); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(r => r.display_name?.toLowerCase().includes(needle));
  }, [rows, q]);

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Clients</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => load(q)}
            disabled={loading}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", cursor: "pointer" }}
          >
            {loading ? "Loading…" : "Reload"}
          </button>
          <Link
            to="/orders/new"
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", textDecoration: "none" }}
          >
            + New Order
          </Link>
        </div>
      </header>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clients…"
          style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" }}
        />
        <button
          onClick={() => load(q)}
          disabled={loading}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}
        >
          Search
        </button>
      </div>

      {err && (
        <div style={{ padding: 12, borderRadius: 8, background: "#fff3f3", border: "1px solid #ffd0d0", color: "#a40000" }}>
          <strong>Error:</strong> {err}
        </div>
      )}

      <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#fafafa" }}>
            <tr>
              <th style={th}>Client</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={2} style={tdMuted}>Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={2} style={tdMuted}>No clients found.</td></tr>
            )}
            {!loading && filtered.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                <td style={td}>
                  <Link to={`/clients/${c.id}`} style={rowLink} title="Open profile">
                    {c.display_name}
                  </Link>
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <Link to={`/orders/new?client=${c.id}`} style={smallLink}>New order →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "middle", fontSize: 14 };
const tdMuted: React.CSSProperties = { ...td, color: "#777", textAlign: "center" };
const rowLink: React.CSSProperties = { textDecoration: "underline", color: "inherit" };
const smallLink: React.CSSProperties = {
  textDecoration: "none", border: "1px solid #ddd", padding: "4px 8px", borderRadius: 6, fontSize: 12,
};

