import React from "react";
export default function Loading({ label = "Loading…" }: { label?: string }) {
  return <div className="p-6">{label}</div>;
}
