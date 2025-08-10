import { supabase } from "@/lib/supabaseClient";

export async function getMyOrgId(): Promise<string> {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const uid = authData.user?.id;
  if (!uid) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", uid)
    .single();

  if (error) throw error;
  if (!data?.organization_id) throw new Error("No organization found for user");
  return data.organization_id as string;
}
