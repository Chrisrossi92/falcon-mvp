import React, { useEffect, useMemo, useState } from "react";
import { listClients, ClientOpt } from "@/api/listClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type Props = {
  value: { clientId: string | null; name: string; kind: "lender" | "amc" };
  onChange: (next: Props["value"]) => void;
};

export default function ClientTypeahead({ value, onChange }: Props) {
  const [query, setQuery] = useState(value.name);
  const debounced = useDebouncedValue(query, 250);
  const [options, setOptions] = useState<ClientOpt[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    listClients(debounced).then((rows) => {
      if (!alive) return;
      setOptions(rows);
      setOpen(true);
    }).catch(console.error);
    return () => { alive = false; };
  }, [debounced]);

  const showCreate = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return false;
    return !options.some(o => o.display_name.trim().toLowerCase() === q);
  }, [query, options]);

  return (
    <div className="relative">
      <label className="block text-sm mb-1">Client</label>
      <div className="flex gap-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Search or type a new client name…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange({ ...value, name: e.target.value, clientId: null });
          }}
          onFocus={() => setOpen(true)}
        />
        <select
          className="border rounded px-2 py-1"
          value={value.kind}
          onChange={(e) => onChange({ ...value, kind: e.target.value as "lender" | "amc" })}
        >
          <option value="lender">Lender</option>
          <option value="amc">AMC</option>
        </select>
      </div>

      {open && (options.length > 0 || showCreate) && (
        <div className="absolute z-10 mt-1 w-full border bg-white rounded shadow">
          {options.map(o => (
            <button
              key={o.id}
              type="button"
              className="w-full text-left px-2 py-1 hover:bg-gray-100"
              onClick={() => {
                onChange({ ...value, clientId: o.id, name: o.display_name });
                setOpen(false);
              }}
            >
              {o.display_name}
            </button>
          ))}
          {showCreate && (
            <div className="border-t">
              <div className="px-2 py-2 text-sm text-gray-600">No exact match.</div>
              <div className="px-2 pb-2">
                <span className="text-sm">Will create: </span>
                <span className="font-medium">{query.trim()}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
