// src/features/orders/AssignControl.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { assignOrder } from "../../lib/api/orders";

export function AssignControl({ orderId }: { orderId: string }) {
  const [users, setUsers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name")
        .order("full_name", { ascending: true });
      if (error) throw error;
      setUsers(data ?? []);
    })();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded p-2"
        value={assignedTo}
        onChange={(e) => setAssignedTo(e.target.value)}
      >
        <option value="">Select reviewer/appraiser</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.full_name ?? u.id}</option>
        ))}
      </select>
      <button
        className="rounded bg-black text-white px-3 py-2"
        disabled={!assignedTo}
        onClick={async () => {
          await assignOrder({ order_id: orderId, assigned_to: assignedTo });
        }}
      >
        Assign
      </button>
    </div>
  );
}
