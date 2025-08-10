import { supabase } from "@/lib/supabaseClient";

export type OrderFilters = {
  status?: Array<"new" | "in_review" | "completed" | "cancelled">;
  assigneeId?: string | null;
  clientId?: string | null;
  q?: string | null;
  dueFrom?: string | null; // YYYY-MM-DD
  dueTo?: string | null;   // YYYY-MM-DD
  page?: number;           // 1-based
  pageSize?: number;       // default 20
};

export type OrderRow = {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  status: "new" | "in_review" | "completed" | "cancelled";
  client_name: string | null;
  assignee_name: string | null;
  due_date: string | null;
  created_at: string;
};

export async function fetchOrders(filters: OrderFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, filters.pageSize ?? 20);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("v_orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status && filters.status.length) {
    q = q.in("status", filters.status);
  }
  if (filters.assigneeId) {
    q = q.eq("assigned_to", filters.assigneeId);
  }
  if (filters.clientId) {
    q = q.eq("client_id", filters.clientId);
  }
  if (filters.dueFrom) {
    q = q.gte("due_date", filters.dueFrom);
  }
  if (filters.dueTo) {
    q = q.lte("due_date", filters.dueTo);
  }
  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim();
    q = q.or(
      `address.ilike.%${term}%,city.ilike.%${term}%,client_name.ilike.%${term}%`
    );
  }

  const { data, error, count } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as OrderRow[], total: count ?? 0, page, pageSize };
}
