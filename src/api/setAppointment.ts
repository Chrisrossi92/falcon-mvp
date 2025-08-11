// src/api/setAppointment.ts
import { supabase } from "@/lib/supabaseClient";

/**
 * RPC `set_order_appointment` should insert or update an appointment
 * and return the appointment id.
 */
export async function setAppointment(orderId: string, datetime: string, note?: string): Promise<string> {
  const { data, error } = await supabase.rpc("set_order_appointment", {
    p_order_id: orderId,
    p_datetime: datetime,
    p_note: note ?? null,
  });
  if (error) throw error;
  return data as string;
}

