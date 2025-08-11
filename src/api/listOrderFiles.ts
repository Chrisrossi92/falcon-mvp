import { supabase } from "@/lib/supabaseClient";

export type OrderFile = {
  id: string;
  order_id: string;
  bucket: string;
  path: string;
  filename: string;
  content_type: string | null;
  bytes: number | null;
  uploaded_by: string;
  created_at: string;
};

export async function listOrderFiles(orderId: string): Promise<OrderFile[]> {
  const { data, error } = await supabase
    .from("order_files")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as OrderFile[];
}

export async function getFileSignedUrl(bucket: string, path: string, expiresInSec = 60) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSec);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteOrderFileRemote(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export async function deleteOrderFileRow(fileId: string) {
  const { data, error } = await supabase.rpc("delete_order_file", { p_file_id: fileId });
  if (error) throw error;
  return data as string; // order_id
}
