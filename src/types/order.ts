// src/types/order.ts
export type OrderEventType = "created" | "assigned" | "status_changed" | "note_added";

export interface OrderEvent {
  id: number;
  order_id: string;
  event_type: OrderEventType;
  event_data: Record<string, unknown>;
  occurred_at: string;
  actor: string | null;
  message: string | null;
  kind: string | null;
}
