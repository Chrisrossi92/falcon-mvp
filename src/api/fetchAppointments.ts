// src/api/fetchAppointments.ts
import { supabase } from "@/lib/supabaseClient";

export type Appointment = {
  id: string;
  order_id: string;
  scheduled_at: string;
  note: string | null;
  created_at: string;
  created_by: string | null;
};

export async function fetchAppointments(orderId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("order_appointments") // view or table
    .select("*")
    .eq("order_id", orderId)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Appointment[];
}
