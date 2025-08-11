import React from "react";
export default function EmptyState({ title = "Nothing here yet.", body }: { title?: string; body?: string }) {
  return (
    <div className="p-6 text-gray-600">
      <div className="text-lg font-semibold">{title}</div>
      {body && <div className="text-sm mt-1">{body}</div>}
    </div>
  );
}
