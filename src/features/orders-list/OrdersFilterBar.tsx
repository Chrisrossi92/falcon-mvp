// src/features/orders-list/OrdersFilterBar.tsx
import React, { useEffect, useMemo, useState } from "react";
import { listUsers, type UserLite } from "@/api/listUsers";
import { listClients, type ClientLite } from "@/api/listClients";
import { OrderFilters } from "@/api/fetchOrders";

type Props = { value: OrderFilters; onChange: (next: OrderFilters) => void; };
const ALL_STATUSES = ["new","in_review","completed","cancelled"] as const;

function StatusChip({ active, label, onClick }:{ active:boolean; label:string; onClick:()=>void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: active ? "1px solid #888" : "1px solid #ddd",
        background: active ? "#f4f4f4" : "#fff",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export default function OrdersFilterBar({ value, onChange }: Props) {
  const [users, setUsers] = useState<UserLite[]>([]);
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [clientQuery, setClientQuery] = useState("");
  const [userErr, setUserErr] = useState<string | null>(null);
  const [clientErr, setClientErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setUserErr(null);
    listUsers().then(d => { if (alive) setUsers(Array.isArray(d) ? d : []); })
      .catch(e => { if (alive) { setUsers([]); setUserErr(e?.message ?? "Failed to load users"); } });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    setClientErr(null);
    listClients(clientQuery).then(d => { if (alive) setClients(Array.isArray(d) ? d : []); })
      .catch(e => { if (alive) { setClients([]); setClientErr(e?.message ?? "Failed to load clients"); } });
    return () => { alive = false; };
  }, [clientQuery]);

  const toggleStatus = (s: typeof ALL_STATUSES[number]) => {
    const cur = new Set(value.status ?? []);
    cur.has(s) ? cur.delete(s) : cur.add(s);
    onChange({ ...value, status: Array.from(cur) as any, page: 1 });
  };

  const assigneeOptions = useMemo(
    () => [{ id: "", full_name: "Any assignee" }, ...(Array.isArray(users) ? users : [])],
    [users]
  );
  const clientOptions = useMemo(
    () => [{ id: "", display_name: "Any client" }, ...(Array.isArray(clients) ? clients : [])],
    [clients]
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
      {/* status chips + q */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {ALL_STATUSES.map(s => (
          <StatusChip key={s} active={(value.status ?? []).includes(s)} label={s.replace("_", " ")} onClick={() => toggleStatus(s)} />
        ))}
        <input
          value={value.q ?? ""}
          onChange={(e) => onChange({ ...value, q: e.target.value, page: 1 })}
          placeholder="Search by id / title / status…"
          style={{ flex: 1, minWidth: 240, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" }}
        />
      </div>

      {/* assignee + client */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={value.assigneeId ?? ""}
          onChange={(e) => onChange({ ...value, assigneeId: e.target.value || null, page: 1 })}
          style={{ border: "1px solid #ddd", borderRadius: 8, padding: "6px 8px" }}
        >
          {assigneeOptions.map(u => (
            <option key={u.id} value={u.id}>{u.full_name ?? "Any assignee"}</option>
          ))}
        </select>

        <input
          value={clientQuery}
          onChange={(e) => setClientQuery(e.target.value)}
          placeholder="Find client…"
          style={{ padding: "6px 8px", border: "1px solid #ddd", borderRadius: 8, minWidth: 180 }}
        />
        <select
          value={value.clientId ?? ""}
          onChange={(e) => onChange({ ...value, clientId: e.target.value || null, page: 1 })}
          style={{ border: "1px solid #ddd", borderRadius: 8, padding: "6px 8px" }}
        >
          {clientOptions.map(c => (
            <option key={c.id} value={c.id}>{c.display_name}</option>
          ))}
        </select>

        <label style={{ marginLeft: 8 }}>
          <input
            type="checkbox"
            checked={!!value.includeArchived}
            onChange={(e) => onChange({ ...value, includeArchived: e.target.checked, page: 1 })}
            style={{ marginRight: 6 }}
          />
          Include archived
        </label>
      </div>

      {/* errors (non-fatal) */}
      <div style={{ display: "flex", gap: 12, color: "#a00", fontSize: 12 }}>
        {userErr && <span>Users: {userErr}</span>}
        {clientErr && <span>Clients: {clientErr}</span>}
      </div>
    </div>
  );
}


