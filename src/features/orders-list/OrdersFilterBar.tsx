import React, { useEffect, useMemo, useState } from "react";
import { listUsers, UserOpt } from "@/api/listUsers";
import { listClients, ClientOpt } from "@/api/listClients";
import { OrderFilters } from "@/api/fetchOrders";

type Props = { value: OrderFilters; onChange: (next: OrderFilters) => void; };
const ALL_STATUSES = ["new","in_review","completed","cancelled"] as const;

function StatusChip({ active, label, onClick }:{ active:boolean; label:string; onClick:()=>void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded text-sm border ${active ? "bg-black text-white" : "bg-white"}`}
    >
      {label}
    </button>
  );
}

export default function OrdersFilterBar({ value, onChange }: Props) {
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [clients, setClients] = useState<ClientOpt[]>([]);
  const [clientQuery, setClientQuery] = useState("");

  useEffect(() => { listUsers().then(setUsers).catch(console.error); }, []);
  useEffect(() => {
    let alive = true;
    listClients(clientQuery).then(d => { if (alive) setClients(d); }).catch(console.error);
    return () => { alive = false; };
  }, [clientQuery]);

  const toggleStatus = (s: typeof ALL_STATUSES[number]) => {
    const cur = new Set(value.status ?? []);
    cur.has(s) ? cur.delete(s) : cur.add(s);
    onChange({ ...value, status: Array.from(cur) as any });
  };

  const assigneeOptions = useMemo(() => [{ id: "", full_name: "Any assignee" }, ...users], [users]);
  const clientOptions   = useMemo(() => [{ id: "", display_name: "Any client" }, ...clients], [clients]);

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        {ALL_STATUSES.map(s => (
          <StatusChip key={s} label={s} active={(value.status ?? []).includes(s)} onClick={() => toggleStatus(s)} />
        ))}
        <input
          className="border rounded px-2 py-1 ml-auto"
          placeholder="Search address, city, client…"
          value={value.q ?? ""}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="border rounded px-2 py-1"
          value={value.assigneeId ?? ""}
          onChange={(e) => onChange({ ...value, assigneeId: e.target.value || null })}
        >
          {assigneeOptions.map(u => (<option key={u.id || "any"} value={u.id}>{u.full_name ?? "Any assignee"}</option>))}
        </select>

        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1"
            placeholder="Find client…"
            value={clientQuery}
            onChange={(e) => setClientQuery(e.target.value)}
          />
          <select
            className="border rounded px-2 py-1"
            value={value.clientId ?? ""}
            onChange={(e) => onChange({ ...value, clientId: e.target.value || null })}
          >
            {clientOptions.map(c => (<option key={c.id || "any"} value={c.id}>{c.display_name}</option>))}
          </select>
        </div>

        <input type="date" className="border rounded px-2 py-1"
          value={value.dueFrom ?? ""} onChange={(e) => onChange({ ...value, dueFrom: e.target.value || null, page: 1 })} />
        <span className="text-sm text-gray-500">to</span>
        <input type="date" className="border rounded px-2 py-1"
          value={value.dueTo ?? ""} onChange={(e) => onChange({ ...value, dueTo: e.target.value || null, page: 1 })} />

        <label className="ml-auto flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!value.includeArchived}
            onChange={(e) => onChange({ ...value, includeArchived: e.target.checked, page: 1 })}
          />
          Include archived
        </label>
      </div>
    </div>
  );
}

