import { supabase } from "@/lib/supabaseClient";

export async function archiveClient(clientId: string, isArchived = true) {
  const { data, error } = await supabase.rpc("archive_client", {
    p_client_id: clientId,
    p_is_archived: isArchived,
  });
  if (error) throw error;
  return data as string; // client id
}
