import { supabase } from "@/lib/supabaseClient";

export async function setAppointment(params: {
  orderId: string;
  startIso: string;          // ISO string
  endIso?: string | null;    // ISO or null
}) {
  const { data, error } = await supabase.rpc("set_appointment", {
    p_order_id: params.orderId,
    p_start: params.startIso,
    p_end: params.endIso ?? null,
  });
  if (error) throw error;
  return data as string; // order id
}
