import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OrdersFilterBar from "./OrdersFilterBar";
import { fetchOrders, OrderFilters, OrderRow } from "@/api/fetchOrders";
import OrdersTable from "./OrdersTable";
import { listUsers, UserOpt } from "@/api/listUsers";
import { bulkAssignOrders } from "@/api/bulkAssignOrders";
import { getUserPrefs } from "@/api/userPrefs";

function paramsToFilters(sp: URLSearchParams): OrderFilters {
  const status = sp.getAll("status") as OrderFilters["status"];
  return {
    status: status.length ? status : undefined,
    assigneeId: sp.get("assigneeId") || null,
    clientId: sp.get("clientId") || null,
    q: sp.get("q") || "",
    dueFrom: sp.get("dueFrom") || "",
    dueTo: sp.get("dueTo") || "",
    includeArchived: sp.get("includeArchived") === "1",
    page: sp.get("page") ? parseInt(sp.get("page")!, 10) : 1,
    pageSize: sp.get("pageSize") ? parseInt(sp.get("pageSize")!, 10) : 20,
  };
}

function filtersToParams(f: OrderFilters): URLSearchParams {
  const sp = new URLSearchParams();
  (f.status ?? []).forEach((s) => sp.append("status", s));
  if (f.assigneeId) sp.set("assigneeId", f.assigneeId);
  if (f.clientId) sp.set("clientId", f.clientId);
  if (f.q) sp.set("q", f.q);
  if (f.dueFrom) sp.set("dueFrom", f.dueFrom);
  if (f.dueTo) sp.set("dueTo", f.dueTo);
  if (f.includeArchived) sp.set("includeArchived", "1");
  sp.set("page", String(f.page ?? 1));
  sp.set("pageSize", String(f.pageSize ?? 20));
  sp.set("defaultsApplied", "1");
  return sp;
}

export default function OrdersListMvp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserOpt[]>([]);
  const [assignTo, setAssignTo] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filters = useMemo(() => paramsToFilters(searchParams), [searchParams]);

  // 1) If URL is empty (first visit), apply user defaults once
  useEffect(() => {
    let alive = true;
    if (searchParams.toString() === "" || !searchParams.get("defaultsApplied")) {
      getUserPrefs().then((p) => {
        if (!alive) return;
        const f: OrderFilters = {
          status: p.orders_default_filters.status as any,
          includeArchived: !!p.orders_default_filters.includeArchived,
          q: p.orders_default_filters.q || "",
          dueFrom: p.orders_default_filters.dueFrom || "",
          dueTo: p.orders_default_filters.dueTo || "",
          assigneeId: (p.orders_default_filters.assigneeId ?? null) as any,
          clientId: (p.orders_default_filters.clientId ?? null) as any,
          page: 1,
          pageSize: p.orders_page_size ?? 20,
        };
        setSearchParams(filtersToParams(f), { replace: true });
      }).catch(() => {/* ignore */});
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { listUsers().then(setUsers).catch(console.error); }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setSelected(new Set()); // clear selection on filter/page change
    fetchOrders(filters)
      .then(({ rows, total }) => { if (!alive) return; setRows(rows); setTotal(total); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [filters]);

  const onChangeFilters = (next: OrderFilters) => {
    const normalized = { ...next, page: 1 };
    setSearchParams(filtersToParams(normalized), { replace: true });
  };

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const toggleOne = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const toggleAllOnPage = (idsOnPage: string[]) => {
    const allSelected = idsOnPage.every(id => selected.has(id));
    const s = new Set(selected);
    if (allSelected) idsOnPage.forEach(id => s.delete(id));
    else idsOnPage.forEach(id => s.add(id));
    setSelected(s);
  };

  async function doBulkAssign() {
    if (!assignTo || selected.size === 0) return;
    setAssigning(true);
    try {
      const count = await bulkAssignOrders(Array.from(selected), assignTo);
      fetchOrders(filters).then(({ rows, total }) => { setRows(rows); setTotal(total); });
      setSelected(new Set());
      alert(`Assigned ${count} orders.`);
    } catch (e: any) {
      alert(e?.message ?? "Bulk assign failed");
    } finally {
      setAssigning(false);
    }
  }

  function resetToDefaults() {
    getUserPrefs().then((p) => {
      const f: OrderFilters = {
        status: p.orders_default_filters.status as any,
        includeArchived: !!p.orders_default_filters.includeArchived,
        q: p.orders_default_filters.q || "",
        dueFrom: p.orders_default_filters.dueFrom || "",
        dueTo: p.orders_default_filters.dueTo || "",
        assigneeId: (p.orders_default_filters.assigneeId ?? null) as any,
        clientId: (p.orders_default_filters.clientId ?? null) as any,
        page: 1,
        pageSize: p.orders_page_size ?? 20,
      };
      setSearchParams(filtersToParams(f), { replace: true });
    });
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Orders</div>
        <button className="px-2 py-1 border rounded" onClick={resetToDefaults}>
          Reset to my defaults
        </button>
      </div>

      <OrdersFilterBar value={filters} onChange={onChangeFilters} />

      {/* Bulk bar */}
      <div className="flex items-center gap-3">
        <div className="text-sm">
          Selected: <strong>{selected.size}</strong>
        </div>
        <select className="border rounded px-2 py-1" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
          <option value="">Assign to…</option>
          {users.map(u => (<option key={u.id} value={u.id}>{u.full_name ?? "Unnamed"}</option>))}
        </select>
        <button
          className="px-3 py-1 border rounded bg-black text-white disabled:opacity-50"
          disabled={!assignTo || selected.size === 0 || assigning}
          onClick={doBulkAssign}
        >
          {assigning ? "Assigning…" : "Bulk Assign"}
        </button>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          <OrdersTable
            orders={rows}
            selectable
            selectedIds={selected}
            onToggle={toggleOne}
            onToggleAll={toggleAllOnPage}
          />
          <div className="flex items-center gap-3 mt-4">
            <button className="px-2 py-1 border rounded" disabled={page <= 1}
              onClick={() => setSearchParams(filtersToParams({ ...filters, page: page - 1 }), { replace: true })}
            >Prev</button>
            <span className="text-sm">Page {page} / {pageCount}</span>
            <button className="px-2 py-1 border rounded" disabled={page >= pageCount}
              onClick={() => setSearchParams(filtersToParams({ ...filters, page: page + 1 }), { replace: true })}
            >Next</button>
          </div>
    ...
      )}
    </div>
  );
}



