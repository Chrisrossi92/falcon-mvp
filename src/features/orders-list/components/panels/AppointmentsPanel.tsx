// src/features/orders-list/components/panels/AppointmentsPanel.tsx
import React, { useEffect, useState } from "react";
import { fetchAppointments, type Appointment } from "@/api/fetchAppointments";
import { setAppointment } from "@/api/setAppointment";

export default function AppointmentsPanel({ orderId }: { orderId: string }) {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchAppointments(orderId);
      setRows(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    if (!date || !time) return;
    setSaving(true);
    try {
      const dt = new Date(`${date}T${time}:00`).toISOString();
      await setAppointment(orderId, dt, note.trim() || undefined);
      setDate(""); setTime(""); setNote("");
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Failed to set appointment");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { load(); }, [orderId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{ margin: 0 }}>Set Appointment</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={input}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={input}
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          style={{ ...input, flex: 1 }}
        />
        <button
          onClick={onSave}
          disabled={saving || !date || !time}
          style={btn}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <h3 style={{ margin: 0 }}>Appointments</h3>
      {loading && <div>Loading…</div>}
      {err && <div style={{ color: "#a00" }}>Error: {err}</div>}
      {!loading && !rows.length && <div>No appointments set.</div>}
      {!loading && rows.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rows.map((a) => (
            <li key={a.id} style={{ borderBottom: "1px solid #f0f0f0", padding: "6px 0" }}>
              <div><strong>{new Date(a.scheduled_at).toLocaleString()}</strong></div>
              {a.note && <div style={{ fontSize: 13, color: "#555" }}>{a.note}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const input: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 8, padding: "6px 8px" };
const btn: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 8, padding: "6px 12px", background: "#fff" };

