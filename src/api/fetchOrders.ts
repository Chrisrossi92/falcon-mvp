import { supabase } from "@/lib/supabaseClient";
import type { OrderStatus, OrderView, Paged } from "@/types/domain";

export type OrderFilters = {
  status?: OrderStatus[];
  assigneeId?: string | null;
  clientId?: string | null;
  q?: string | null;
  dueFrom?: string | null; // YYYY-MM-DD
  dueTo?: string | null;   // YYYY-MM-DD
  includeArchived?: boolean;
  page?: number;           // 1-based
  pageSize?: number;       // default 20
};

export async function fetchOrders(filters: OrderFilters): Promise<Paged<OrderView>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, filters.pageSize ?? 20);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const view = filters.includeArchived ? "v_orders_all" : "v_orders";

  let q = supabase
    .from(view)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status?.length) q = q.in("status", filters.status);
  if (filters.assigneeId) q = q.eq("assigned_to", filters.assigneeId);
  if (filters.clientId) q = q.eq("client_id", filters.clientId);
  if (filters.dueFrom) q = q.gte("due_date", filters.dueFrom);
  if (filters.dueTo) q = q.lte("due_date", filters.dueTo);
  if (filters.q?.trim()) {
    const term = filters.q.trim();
    q = q.or(`address.ilike.%${term}%,city.ilike.%${term}%,client_name.ilike.%${term}%`);
  }

  const { data, error, count } = await q;
  if (error) throw error;
  return {
    rows: (data ?? []) as unknown as OrderView[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

