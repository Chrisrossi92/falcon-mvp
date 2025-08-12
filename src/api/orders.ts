// src/lib/api/orders.ts
// Adjust the import path below to your actual client export.
import { supabase } from "../supabaseClient";

export async function createOrder(input: {
  organization_id: string;
  client_id: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  due_date?: string | null; // YYYY-MM-DD
}) {
  const { data, error } = await supabase.rpc(
    "falcon_mvp.rpc_create_order",
    {
      p_organization_id: input.organization_id,
      p_client_id: input.client_id,
      p_address: input.address,
      p_city: input.city,
      p_state: input.state,
      p_postal_code: input.postal_code,
      p_due_date: input.due_date ?? null,
    }
  );
  if (error) throw error;
  return data as string; // order_id
}

export async function assignOrder(opts: {
  order_id: string;
  assigned_to: string;
  note?: string | null;
}) {
  const { error } = await supabase.rpc("falcon_mvp.rpc_assign_order", {
    p_order_id: opts.order_id,
    p_assigned_to: opts.assigned_to,
    p_note: opts.note ?? null,
  });
  if (error) throw error;
}

export async function addOrderEvent(opts: {
  order_id: string;
  type: "created" | "assigned" | "status_changed" | "note_added";
  data?: Record<string, unknown>;
  message?: string | null;
  kind?: string | null;
}) {
  const { error } = await supabase.rpc("falcon_mvp.rpc_add_order_event", {
    p_order_id: opts.order_id,
    p_event_type: opts.type,
    p_event_data: opts.data ?? {},
    p_message: opts.message ?? null,
    p_kind: opts.kind ?? null,
  });
  if (error) throw error;
}

