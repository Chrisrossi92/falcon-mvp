import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OrdersFilterBar from "./OrdersFilterBar";
import { fetchOrders, OrderFilters, OrderRow } from "@/api/fetchOrders";
import OrdersTable from "./OrdersTable";

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
  return sp;
}

export default function OrdersListMvp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const filters = useMemo(() => paramsToFilters(searchParams), [searchParams]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
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

  return (
    <div className="p-4">
      <OrdersFilterBar value={filters} onChange={onChangeFilters} />
      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          <OrdersTable orders={rows} />
          <div className="flex items-center gap-3 mt-4">
            <button className="px-2 py-1 border rounded" disabled={page <= 1}
              onClick={() => setSearchParams(filtersToParams({ ...filters, page: page - 1 }), { replace: true })}>
              Prev
            </button>
            <span className="text-sm">Page {page} / {pageCount}</span>
            <button className="px-2 py-1 border rounded" disabled={page >= pageCount}
              onClick={() => setSearchParams(filtersToParams({ ...filters, page: page + 1 }), { replace: true })}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

    </div>
  );
}

