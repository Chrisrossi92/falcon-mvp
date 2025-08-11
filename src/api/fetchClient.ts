// src/api/fetchClient.ts
import { supabase } from "@/lib/supabaseClient";

export type Client = {
  id: string;
  organization_id: string;
  display_name: string;
  kind: "lender" | "amc" | string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export async function fetchClient(clientId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  return (data as Client) ?? null;
}

