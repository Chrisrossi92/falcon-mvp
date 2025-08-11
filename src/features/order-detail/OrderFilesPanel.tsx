import React, { useEffect, useRef, useState } from "react";
import { uploadOrderFile } from "@/api/uploadOrderFile";
import { listOrderFiles, getFileSignedUrl, deleteOrderFileRemote, deleteOrderFileRow, OrderFile } from "@/api/listOrderFiles";

function fmtBytes(n?: number | null) {
  if (!n) return "0 B";
  const k = 1024;
  const units = ["B","KB","MB","GB","TB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

export default function OrderFilesPanel({ orderId }: { orderId: string }) {
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const rows = await listOrderFiles(orderId);
      setFiles(rows);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [orderId]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setErr(null);
    try {
      await uploadOrderFile(orderId, f);
      if (inputRef.current) inputRef.current.value = "";
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onDownload(f: OrderFile) {
    try {
      const url = await getFileSignedUrl(f.bucket, f.path, 120);
      window.open(url, "_blank");
    } catch (e: any) {
      setErr(e?.message ?? "Could not generate download link");
    }
  }

  async function onDelete(f: OrderFile) {
    if (!confirm(`Delete "${f.filename}"?`)) return;
    try {
      await deleteOrderFileRemote(f.bucket, f.path);
      await deleteOrderFileRow(f.id); // logs activity & removes row
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Delete failed");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Files</h3>
        <label className="px-3 py-1 border rounded bg-white cursor-pointer">
          <input ref={inputRef} type="file" className="hidden" onChange={onPick} />
          {uploading ? "Uploading…" : "Upload file"}
        </label>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      {loading ? (
        <div>Loading files…</div>
      ) : files.length === 0 ? (
        <div className="text-sm text-gray-600">No files yet.</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium">File</th>
                <th className="text-left px-3 py-2 font-medium">Size</th>
                <th className="text-left px-3 py-2 font-medium">Uploaded</th>
                <th className="text-left px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id} className="border-t">
                  <td className="px-3 py-2">{f.filename}</td>
                  <td className="px-3 py-2">{fmtBytes(f.bytes)}</td>
                  <td className="px-3 py-2">{new Date(f.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 border rounded" onClick={() => onDownload(f)}>Download</button>
                      <button className="px-2 py-1 border rounded" onClick={() => onDelete(f)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
