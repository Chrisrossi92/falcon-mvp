import { supabase } from "@/lib/supabaseClient";

export type Kpis = {
  totalOpen: number;
  inReview: number;
  dueThisWeek: number;
  overdue: number;
  newThis7: number;
};

function isoDate(d: Date) {
  // YYYY-MM-DD (UTC) is fine for date columns
  return d.toISOString().slice(0, 10);
}

export async function fetchKpis(): Promise<Kpis> {
  const now = new Date();
  const today = isoDate(now);
  const in7 = new Date(now);
  in7.setDate(in7.getDate() + 7);
  const plus7 = isoDate(in7);

  const last7 = new Date(now);
  last7.setDate(last7.getDate() - 7);
  const last7Iso = last7.toISOString();

  const [
    totalOpenRes,
    inReviewRes,
    dueThisWeekRes,
    overdueRes,
    newThis7Res,
  ] = await Promise.all([
    supabase.from("v_orders").select("*", { count: "exact", head: true })
      .in("status", ["new", "in_review"]),
    supabase.from("v_orders").select("*", { count: "exact", head: true })
      .eq("status", "in_review"),
    supabase.from("v_orders").select("*", { count: "exact", head: true })
      .neq("status", "completed").gte("due_date", today).lt("due_date", plus7),
    supabase.from("v_orders").select("*", { count: "exact", head: true })
      .neq("status", "completed").lt("due_date", today),
    supabase.from("v_orders").select("*", { count: "exact", head: true })
      .gte("created_at", last7Iso),
  ]);

  const err =
    totalOpenRes.error || inReviewRes.error || dueThisWeekRes.error ||
    overdueRes.error || newThis7Res.error;
  if (err) throw err;

  return {
    totalOpen: totalOpenRes.count ?? 0,
    inReview: inReviewRes.count ?? 0,
    dueThisWeek: dueThisWeekRes.count ?? 0,
    overdue: overdueRes.count ?? 0,
    newThis7: newThis7Res.count ?? 0,
  };
}
