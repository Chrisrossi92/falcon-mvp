import React, { useEffect, useState } from "react";
import { getUserPrefs, updateUserPrefs, UserPrefs } from "@/api/userPrefs";

const ALL_STATUSES = ["new", "in_review", "completed", "cancelled"] as const;

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getUserPrefs().then(p => { if (alive) setPrefs(p); }).catch(e => setErr(e?.message ?? "Failed to load"));
    return () => { alive = false; };
  }, []);

  if (!prefs) return <div className="p-6">Loading…</div>;

  const toggleStatus = (s: typeof ALL_STATUSES[number]) => {
    const cur = new Set(prefs.orders_default_filters.status ?? []);
    cur.has(s) ? cur.delete(s) : cur.add(s);
    setPrefs({
      ...prefs,
      orders_default_filters: { ...prefs.orders_default_filters, status: Array.from(cur) as any }
    });
  };

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const saved = await updateUserPrefs(prefs!);
      setPrefs(saved);
      setMsg("Saved.");
    } catch (e: any) {
      setErr(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Preferences</h1>
      <form className="space-y-6" onSubmit={onSave}>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.mute_my_toasts}
              onChange={(e) => setPrefs({ ...prefs, mute_my_toasts: e.target.checked })}
            />
            Mute my own activity toasts
          </label>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Orders defaults</h2>
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map(s => (
              <label key={s} className="flex items-center gap-1 border rounded px-2 py-1">
                <input
                  type="checkbox"
                  checked={(prefs.orders_default_filters.status ?? []).includes(s)}
                  onChange={() => toggleStatus(s)}
                />
                {s}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!prefs.orders_default_filters.includeArchived}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  orders_default_filters: { ...prefs.orders_default_filters, includeArchived: e.target.checked }
                })
              }
            />
            Include archived by default
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Default page size</label>
              <input
                type="number"
                min={5}
                max={200}
                className="border rounded px-2 py-1 w-full"
                value={prefs.orders_page_size}
                onChange={(e) => setPrefs({ ...prefs, orders_page_size: Math.max(5, Math.min(200, Number(e.target.value) || 20)) })}
              />
            </div>
          </div>
        </section>

        {msg && <div className="text-green-700 text-sm">{msg}</div>}
        {err && <div className="text-red-600 text-sm">{err}</div>}

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-4 py-2 border rounded bg-black text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
