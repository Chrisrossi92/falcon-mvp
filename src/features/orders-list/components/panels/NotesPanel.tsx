// src/features/orders-list/components/panels/NotesPanel.tsx
import React, { useState } from "react";

export default function NotesPanel({ orderId }: { orderId: string }) {
  // TODO: wire to RPC to create activity "note" + list notes.
  const [text, setText] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a note (stubbed)…"
        rows={4}
        style={{ width: "100%", borderRadius: 8, border: "1px solid #ddd", padding: 8 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => {
            // future: await addOrderNote(orderId, text)
            setText("");
            alert("Note creation is stubbed in MVP scaffolding.");
          }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}
        >
          Save Note
        </button>
      </div>
      <div style={{ color: "#666" }}>
        <em>Existing notes will render here.</em>
      </div>
      <div style={{ fontSize: 12, color: "#999" }}>
        (Order: {orderId})
      </div>
    </div>
  );
}
