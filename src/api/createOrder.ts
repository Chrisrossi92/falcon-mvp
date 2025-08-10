// src/api/createOrder.ts
import { supabase } from "@/lib/supabaseClient";

export async function createOrder(payload: {
  organization_id: string;
  client_id: string | null;
  address?: string; city?: string; state?: string; postal_code?: string;
  due_date?: string; // YYYY-MM-DD
}) {
  const { data, error } = await supabase.rpc("create_order", {
    p_organization_id: payload.organization_id,
    p_client_id: payload.client_id,
    p_address: payload.address ?? null,
    p_city: payload.city ?? null,
    p_state: payload.state ?? null,
    p_postal_code: payload.postal_code ?? null,
    p_due_date: payload.due_date ?? null,
  });
  if (error) throw error;
  return data as string; // order id
}
