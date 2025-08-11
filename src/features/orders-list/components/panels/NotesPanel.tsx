// src/features/orders-list/components/panels/NotesPanel.tsx
import React, { useState } from "react";
import { addOrderNote } from "@/api/addOrderNote";

export default function NotesPanel({ orderId, onAdded }: { orderId: string; onAdded?: () => void }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSave() {
    if (!text.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await addOrderNote(orderId, text.trim());
      setText("");
      onAdded?.();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a note…"
        rows={4}
        style={{ width: "100%", borderRadius: 8, border: "1px solid #ddd", padding: 8 }}
      />
      {err && <div style={{ color: "#a00" }}>Error: {err}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onSave}
          disabled={saving || !text.trim()}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}
        >
          {saving ? "Saving…" : "Save Note"}
        </button>
      </div>
    </div>
  );
}

