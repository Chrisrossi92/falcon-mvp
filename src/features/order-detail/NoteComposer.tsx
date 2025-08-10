import React, { useState } from "react";
import { addOrderNote } from "@/api/addOrderNote";

export function NoteComposer({ orderId }: { orderId: string }) {
  const [note, setNote] = useState("");
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) return;
    try {
      await addOrderNote(orderId, trimmed);
      setNote("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="border p-2 rounded"
        placeholder="Add a note..."
        rows={3}
      />
      <button type="submit" className="self-end px-3 py-1 bg-blue-600 text-white rounded">
        Add note
      </button>
    </form>
  );
}
