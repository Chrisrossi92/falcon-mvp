import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type Command = {
  id: string;
  title: string;
  run: () => void | Promise<void>;
  keywords?: string[];
};

function isUUIDLike(s: string) {
  // loose check: 36 chars with dashes OR 32 hex chars
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const hex32 = /^[0-9a-f]{32}$/i;
  return uuid.test(s) || hex32.test(s);
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Base actions (navigation)
  const baseActions = useMemo<Command[]>(() => [
    { id: "orders",  title: "Open: Orders",   run: () => navigate("/orders"),   keywords: ["list","table"] },
    { id: "board",   title: "Open: Board",    run: () => navigate("/board"),    keywords: ["kanban"] },
    { id: "reports", title: "Open: Reports",  run: () => navigate("/reports"),  keywords: ["kpi","metrics"] },
    { id: "settings",title: "Open: Settings", run: () => navigate("/settings"), keywords: ["prefs","preferences"] },
  // You already have /orders/:id/appointment in routes
  ], [navigate]);

  // Dynamic "Go to order by ID" when query looks like an ID
  const dynamicOrderAction = useMemo<Command[]>(() => {
    const trimmed = q.trim();
    if (!isUUIDLike(trimmed)) return [];
    return [{
      id: `goto:${trimmed}`,
      title: `Go to Order: ${trimmed}`,
      run: () => navigate(`/orders/${trimmed}`),
      keywords: ["jump","open","detail"]
    }];
  }, [q, navigate]);

  // Filter
  const actions = useMemo(() => {
    const all = [...dynamicOrderAction, ...baseActions];
    if (!q.trim()) return all;
    const needle = q.toLowerCase();
    return all.filter(a =>
      a.title.toLowerCase().includes(needle) ||
      (a.keywords ?? []).some(k => k.toLowerCase().includes(needle))
    );
  }, [q, baseActions, dynamicOrderAction]);

  // Open/close with ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isK = e.key.toLowerCase() === "k";
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        setOpen(v => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset on route change
  useEffect(() => {
    setQ("");
    setActive(0);
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function onRun(index: number) {
    const a = actions[index];
    if (!a) return;
    Promise.resolve(a.run()).finally(() => setOpen(false));
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80, zIndex: 9999
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 92vw)",
          borderRadius: 12,
          background: "white",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
        }}
      >
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #eee" }}>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            placeholder="Type a command…  (⌘K / Ctrl+K)"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive(i => Math.min(i + 1, actions.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
              else if (e.key === "Enter") { e.preventDefault(); onRun(active); }
              else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
            }}
            style={{
              width: "100%", fontSize: 16, lineHeight: "24px", border: "none", outline: "none",
              padding: "8px 10px", background: "transparent"
            }}
          />
        </div>

        <div ref={listRef} role="listbox" aria-label="Commands" style={{ maxHeight: 360, overflowY: "auto" }}>
          {actions.length === 0 ? (
            <div style={{ padding: 14, color: "#888" }}>No matches.</div>
          ) : actions.map((a, i) => (
            <div
              key={a.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => onRun(i)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                background: i === active ? "#f5f7ff" : "white"
              }}
            >
              {a.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
