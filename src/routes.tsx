// src/routes.tsx
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import CommandPalette from "@/features/command/CommandPalette";

// DIRECT imports (safer while we stabilize; we can switch to lazy later)
import OrdersListMvp from "@/features/orders-list/OrdersListMvp";
import PreferencesPage from "@/features/settings/PreferencesPage";
import KanbanBoardPage from "@/features/kanban/KanbanBoardPage";

export const ROUTES = {
  orders: "/orders",
  order: (id: string) => `/orders/${id}`,
  newOrder: "/orders/new",
  appointment: (id: string) => `/orders/${id}/appointment`,
  reports: "/reports",
  settings: "/settings",
  board: "/board",
};

function NotFound() {
  return <div className="p-6">Page not found.</div>;
}

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <CommandPalette />
      <Suspense fallback={<div className="p-6">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Navigate to={ROUTES.orders} replace />} />
          <Route path={ROUTES.orders} element={<OrdersListMvp />} />
          <Route path={ROUTES.settings} element={<PreferencesPage />} />
          <Route path={ROUTES.board} element={<KanbanBoardPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}










