// src/features/orders-list/components/panels/OrderMap.tsx
import React from "react";
import type { OrderView } from "@/types/domain";

export default function OrderMap({ order }: { order: OrderView }) {
  // TODO: integrate Google Maps once API key is added; for now show the address.
  const addr = [order.address, order.city, order.state, order.postal_code].filter(Boolean).join(", ");
  return (
    <div>
      <div style={{ marginBottom: 8, color: "#666" }}><em>Map coming soon.</em></div>
      <div><strong>Address:</strong> {addr || "(not set)"}</div>
    </div>
  );
}
