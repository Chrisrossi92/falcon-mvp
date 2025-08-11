import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchOrder } from "@/api/fetchOrder";
import { setAppointment } from "@/api/setAppointment";
import { clearAppointment } from "@/api/clearAppointment";
import { useEffect } from "react";

function toInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toIsoFromLocal(input: string) {
  // datetime-local is interpreted as local time; convert to ISO (UTC)
  if (!input) return "";
  const d = new Date(input);
  return d.toISOString();
}

export default function OrderAppointmentPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any | null>(null);
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!id) return;
    setLoading(true);
    fetchOrder(id)
      .then((o) => {
        if (!alive) return;
        setOrder(o);
        setStartLocal(toInputValue(o.appointment_start));
        setEndLocal(toInputValue(o.appointment_end));
      })
      .catch((e) => setErr(e?.message ?? "Failed to load order"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  const canSave = useMemo(() => !!startLocal, [startLocal]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    if (!startLocal) return;
    setSaving(true);
    setErr(null);
    try {
      const startIso = toIsoFromLocal(startLocal);
      const endIso = endLocal ? toIsoFromLocal(endLocal) : null;
      await setAppointment({ orderId: id, startIso, endIso });
      nav(`/orders/${id}`);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save appointment");
    } finally {
      setSaving(false);
    }
  }

  async function onClear() {
    if (!id) return;
    setSaving(true);
    setErr(null);
    try {
      await clearAppointment(id);
      nav(`/orders/${id}`);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to clear appointment");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!order) return <div className="p-6">Order not found.</div>;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Appointment</h1>
      <div className="text-sm text-gray-600">
        <div><strong>Order:</strong> {order.address ?? "No address"}{order.city ? `, ${order.city}` : ""}{order.state ? `, ${order.state}` : ""}</div>
        <div><strong>Status:</strong> {order.status}</div>
      </div>

      <form className="space-y-4" onSubmit={onSave}>
        <div>
          <label className="block text-sm mb-1">Start</label>
          <input
            type="datetime-local"
            className="border rounded px-2 py-1 w-full"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">End (optional)</label>
          <input
            type="datetime-local"
            className="border rounded px-2 py-1 w-full"
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
          />
        </div>

        {err && <div className="text-red-600 text-sm">{err}</div>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!canSave || saving}
            className="px-4 py-2 border rounded bg-black text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={saving}
            className="px-4 py-2 border rounded"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => nav(`/orders/${id}`)}
            disabled={saving}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
