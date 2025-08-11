import { supabase } from "@/lib/supabaseClient";

export async function clearAppointment(orderId: string) {
  const { data, error } = await supabase.rpc("clear_appointment", {
    p_order_id: orderId,
  });
  if (error) throw error;
  return data as string; // order id
}
