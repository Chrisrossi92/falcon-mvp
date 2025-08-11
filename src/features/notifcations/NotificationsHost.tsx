import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";

type ActivityRow = {
  id: string;
  order_id: string;
  event_type: string;
  event_data: any;
  actor: string | null;
  occurred_at: string;
};

type Toast = {
  id: string;
  title: string;
  body?: string;
  orderId: string;
};

function formatEvent(r: ActivityRow): Toast {
  const ed = r.event_data || {};
  const base = { id: r.id, orderId: r.order_id };

  switch (r.event_type) {
    case "status_changed":
      return {
        ...base,
        title: `Status: ${ed.from ?? "?"} → ${ed.to ?? "?"}`,
        body: ed.reason ? `Reason: ${ed.reason}` : undefined,
      };
    case "assignee_changed":
      return {
        ...base,
        title: "Assignee changed",
        body: ed.to ? `New assignee: ${ed.to}` : undefined, // UUID; we keep it simple
      };
    case "file_uploaded":
      return {
        ...base,
        title: "File uploaded",
        body: ed.filename ? `${ed.filename} (${ed.bytes ?? 0} bytes)` : undefined,
      };
    case "file_deleted":
      return {
        ...base,
        title: "File deleted",
        body: ed.filename ? `${ed.filename}` : undefined,
      };
    case "appointment_set":
      return {
        ...base,
        title: "Appointment set",
        body: ed.start ? new Date(ed.start).toLocaleString() : undefined,
      };
    case "appointment_cleared":
      return { ...base, title: "Appointment cleared" };
    case "note_added":
      return { ...base, title: "New note", body: ed.preview ?? undefined };
    case "order_archived":
      return { ...base, title: "Order archived" };
    case "order_restored":
      return { ...base, title: "Order restored" };
    default:
      return { ...base, title: r.event_type };
  }
}

export default function NotificationsHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const myIdRef = useRef<string | null>(null);

  // get current user id so we can ignore our own events
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      myIdRef.current = data.user?.id ?? null;
    }).catch(() => {
      myIdRef.current = null;
    });
  }, []);

  // subscribe to activity inserts (RLS already limits to your org)
  useEffect(() => {
    const channel = supabase.channel("activity_toasts")
      .on("postgres_changes",
        { event: "INSERT", schema: "falcon_mvp", table: "order_activity" },
        (payload) => {
          const row = (payload.new ?? payload.record) as ActivityRow;
          if (!row) return;
          // ignore my own actions
          if (myIdRef.current && row.actor === myIdRef.current) return;

          const toast = formatEvent(row);
          setToasts((prev) => [...prev, toast]);
          // auto-dismiss after 5s
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div key={t.id} className="w-80 rounded-xl border bg-white shadow p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="font-medium">{t.title}</div>
            <button
              className="text-gray-500 hover:text-black"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
          {t.body && <div className="text-sm text-gray-700 mt-1">{t.body}</div>}
          <div className="mt-2">
            <Link
              to={`/orders/${t.orderId}`}
              className="text-sm underline"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            >
              View order
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
