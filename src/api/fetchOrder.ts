// src/api/fetchOrders.ts
import { supabase } from "@/lib/supabaseClient";

// Keep this as the single source of truth for list filters.
export type OrderFilters = {
  q?: string;
  status?: Array<"new" | "in_review" | "completed" | "cancelled"> | undefined;
  assigneeId?: string | null;   // null = any, "" = unassigned
  clientId?: string | null;     // null = any
  includeArchived?: boolean;
  dueFrom?: string | null;      // ISO date (YYYY-MM-DD) or ISO datetime
  dueTo?: string | null;
  page?: number;                // 1-based
  pageSize?: number;            // default 50
};

// Columns expected from v_orders (adjust if your view differs)
export type OrderView = {
  id: string;
  title: string | null;
  status: "new" | "in_review" | "completed" | "cancelled" | string | null;
  assigned_to: string | null;
  assignee_name?: string | null;
  client_id: string | null;
  client_display_name?: string | null;
  address?: string | null;
  created_at: string | null;
  is_archived?: boolean | null;
  due_at?: string | null;
};

export type FetchOrdersResult = {
  rows: OrderView[];
  count: number; // total rows matching filters (ignores pagination)
};

function toInt(n: any, fallback: number) {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}

export async function fetchOrders(filters: OrderFilters): Promise<FetchOrdersResult> {
  const page = toInt(filters.page, 1);
  const pageSize = toInt(filters.pageSize, 50);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Start query
  let query = supabase
    .from("v_orders")
    .select("*", { count: "exact" }) // returns { data, count }
    .order("created_at", { ascending: false });

  // Archived toggle
  if (!filters.includeArchived) {
    // prefer boolean eq, fall back to is() if nullables are used
    query = query.eq("is_archived", false);
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    query = query.in("status", filters.status as any);
  }

  // Assignee filter
  if (filters.assigneeId !== undefined && filters.assigneeId !== null) {
    if (filters.assigneeId === "") {
      // explicitly unassigned
      query = query.is("assigned_to", null);
    } else {
      query = query.eq("assigned_to", filters.assigneeId);
    }
  }

  // Client filter
  if (filters.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  // Date range (created_at)
  if (filters.dueFrom) {
    query = query.gte("created_at", filters.dueFrom);
  }
  if (filters.dueTo) {
    query = query.lte("created_at", filters.dueTo);
  }

  // Text search across common columns (adjust to your view names if different)
  const q = (filters.q ?? "").trim();
  if (q) {
    // Try ilike OR across title, address, client_display_name, id::text
    // supabase-js v2 .or() takes a comma-separated filter string
    const pattern = `%${q}%`;
    // If q looks like a UUID, the id-ilike will still work; equals is nice-to-have.
    const orExpr =
      `title.ilike.${pattern},` +
      `address.ilike.${pattern},` +
      `client_display_name.ilike.${pattern},` +
      `id.ilike.${pattern}`;
    query = query.or(orExpr);
  }

  // Pagination
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = Array.isArray(data) ? (data as OrderView[]) : [];
  return { rows, count: count ?? rows.length };
}



