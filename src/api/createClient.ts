import { supabase } from "@/lib/supabaseClient";

export async function createClient(params: {
  organization_id: string;
  display_name: string;
  kind: "lender" | "amc";
  notes?: string | null;
}) {
  const { data, error } = await supabase.rpc("create_client", {
    p_organization_id: params.organization_id,
    p_display_name: params.display_name,
    p_kind: params.kind,
    p_notes: params.notes ?? null,
  });
  if (error) throw error;
  return data as string; // client id
}
