import { supabase } from "@/lib/supabaseClient";
import { getMyOrgId } from "@/api/getMyOrgId";

function safeName(name: string) {
  return name.replace(/[^\w.\- ]+/g, "_");
}

export async function uploadOrderFile(orderId: string, file: File) {
  const orgId = await getMyOrgId();
  const slug = Math.random().toString(36).slice(2, 10);
  const path = `${orgId}/${orderId}/${Date.now()}_${slug}_${safeName(file.name)}`;
  const bucket = "orders";

  const { error: upErr } = await supabase
    .storage
    .from(bucket)
    .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });

  if (upErr) throw upErr;

  const { error: rpcErr } = await supabase.rpc("log_file_upload", {
    p_order_id: orderId,
    p_bucket: bucket,
    p_path: path,
    p_filename: file.name,
    p_content_type: file.type || null,
    p_bytes: file.size,
  });
  if (rpcErr) throw rpcErr;

  return { bucket, path };
}
