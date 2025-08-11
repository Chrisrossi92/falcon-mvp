import React from "react";
import { OrderRow } from "@/api/fetchOrders";

type Props = {
  orders: OrderRow[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
  onToggleAll?: (idsOnPage: string[]) => void;
};

export default function OrdersTable({
  orders, selectable = false, selectedIds = new Set(), onToggle, onToggleAll
}: Props) {
  const idsOnPage = orders.map(o => o.id);
  const allOnPageSelected = idsOnPage.length > 0 && idsOnPage.every(id => selectedIds.has(id));

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={() => onToggleAll && onToggleAll(idsOnPage)}
                />
              </th>
            )}
            <th className="text-left px-3 py-2 font-medium">Address</th>
            <th className="text-left px-3 py-2 font-medium">Status</th>
            <th className="text-left px-3 py-2 font-medium">Client</th>
            <th className="text-left px-3 py-2 font-medium">Assignee</th>
            <th className="text-left px-3 py-2 font-medium">Due</th>
            <th className="text-left px-3 py-2 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => {
            const sel = selectedIds.has(o.id);
            return (
              <tr key={o.id} className="border-t">
                {selectable && (
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={sel}
                      onChange={() => onToggle && onToggle(o.id)}
                    />
                  </td>
                )}
                <td className="px-3 py-2">{[o.address, o.city, o.state].filter(Boolean).join(", ") || "No address"}</td>
                <td className="px-3 py-2">{o.status}</td>
                <td className="px-3 py-2">{o.client_name ?? "—"}</td>
                <td className="px-3 py-2">{o.assignee_name ?? "Unassigned"}</td>
                <td className="px-3 py-2">{o.due_date ?? "—"}</td>
                <td className="px-3 py-2">{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            );
          })}
          {!orders.length && (
            <tr>
              <td className="px-3 py-4 text-gray-500" colSpan={selectable ? 7 : 6}>No results.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

