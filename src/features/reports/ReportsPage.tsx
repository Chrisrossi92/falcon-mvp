import React, { useEffect, useState } from "react";
import { fetchKpis, Kpis } from "@/api/fetchKpis";
import { fetchWorkload, WorkloadRow } from "@/api/fetchWorkload";

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-4 shadow-sm">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

export default function ReportsPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [workload, setWorkload] = useState<WorkloadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([fetchKpis(), fetchWorkload()])
      .then(([k, wl]) => {
        if (!alive) return;
        setKpis(k);
        setWorkload(wl);
      })
      .catch((e) => setErr(e?.message ?? "Failed to load reports"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <section className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Card label="Open" value={kpis?.totalOpen ?? 0} />
        <Card label="In Review" value={kpis?.inReview ?? 0} />
        <Card label="Due This Week" value={kpis?.dueThisWeek ?? 0} />
        <Card label="Overdue" value={kpis?.overdue ?? 0} />
        <Card label="New Last 7 Days" value={kpis?.newThis7 ?? 0} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Workload by Appraiser</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Assignee</th>
                <th className="text-left px-3 py-2 font-medium">Open Orders</th>
              </tr>
            </thead>
            <tbody>
              {workload.map((row) => (
                <tr key={row.assigned_to ?? "unassigned"} className="border-t">
                  <td className="px-3 py-2">{row.assignee_name ?? "Unassigned"}</td>
                  <td className="px-3 py-2">{row.open_count}</td>
                </tr>
              ))}
              {!workload.length && (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={2}>No open orders.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

