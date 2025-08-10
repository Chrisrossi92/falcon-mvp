import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientTypeahead from "./ClientTypeahead";
import { getMyOrgId } from "@/api/getMyOrgId";
import { createClient } from "@/api/createClient";
import { createOrder } from "@/api/createOrder";

export default function OrderCreatePage() {
  const nav = useNavigate();
  const [client, setClient] = useState<{ clientId: string | null; name: string; kind: "lender" | "amc" }>({
    clientId: null, name: "", kind: "lender"
  });
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setStateVal] = useState("");
  const [postal, setPostal] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit =
    (client.clientId || client.name.trim().length > 1) &&
    address.trim().length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErr(null);
    try {
      const orgId = await getMyOrgId();

      let clientId = client.clientId;
      if (!clientId) {
        clientId = await createClient({
          organization_id: orgId,
          display_name: client.name.trim(),
          kind: client.kind,
          notes: null,
        });
      }

      const orderId = await createOrder({
        organization_id: orgId,
        client_id: clientId!,
        address,
        city,
        state: state,
        postal_code: postal,
        due_date: dueDate || undefined,
      });

      nav(`/orders/${orderId}`);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">New Order</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <ClientTypeahead value={client} onChange={setClient} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Address</label>
            <input className="border rounded px-2 py-1 w-full" value={address} onChange={e=>setAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">City</label>
            <input className="border rounded px-2 py-1 w-full" value={city} onChange={e=>setCity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">State</label>
            <input className="border rounded px-2 py-1 w-full" value={state} onChange={e=>setStateVal(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Postal Code</label>
            <input className="border rounded px-2 py-1 w-full" value={postal} onChange={e=>setPostal(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Due Date</label>
            <input type="date" className="border rounded px-2 py-1 w-full" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
          </div>
        </div>

        {err && <div className="text-red-600 text-sm">{err}</div>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="px-4 py-2 border rounded bg-black text-white disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create Order"}
          </button>
          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={() => nav(-1)}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
