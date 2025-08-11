// src/features/orders-list/components/panels/ActivityTimeline.tsx
import React from "react";

export default function ActivityTimeline({ orderId }: { orderId: string }) {
  // TODO: subscribeToActivity(orderId) + render reverse-chronological items.
  return (
    <div style={{ color: "#666" }}>
      <em>Activity timeline will appear here for order {orderId}.</em>
    </div>
  );
}
