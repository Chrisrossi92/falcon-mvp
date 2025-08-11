import { supabase } from "@/lib/supabaseClient";

export type WorkloadRow = {
  assigned_to: string | null;
  assignee_name: string | null;
  open_count: number;
};

export async function fetchWorkload(): Promise<WorkloadRow[]> {
  const { data, error } = await supabase
    .from("v_orders")
    .select("assigned_to,assignee_name,open_count:count(id)")
    .in("status", ["new", "in_review"])
    .order("open_count", { ascending: false });

  if (error) throw error;
  // PostgREST groups by the non-aggregated columns automatically.
  return (data ?? []).map((r: any) => ({
    assigned_to: r.assigned_to ?? null,
    assignee_name: r.assignee_name ?? null,
    open_count: Number(r.open_count ?? 0),
  }));
}
