// src/routes.tsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import CommandPalette from "@/features/command/CommandPalette";

// Helper to tolerate either default or named export (safer with lazy)
const lazyDefault = <T extends object>(p: Promise<T>, key?: keyof T) =>
  p.then((m: any) => ({ default: (m.default ?? (key ? m[key as string] : undefined)) as React.ComponentType }));

const OrdersListMvp        = lazy(() => lazyDefault(import("@/features/orders-list/OrdersListMvp")));
const OrderDetailPage      = lazy(() => lazyDefault(import("@/features/order-detail/OrderDetailPage")));
const OrderCreatePage      = lazy(() => lazyDefault(import("@/features/order-create/OrderCreatePage")));
const OrderAppointmentPage = lazy(() => lazyDefault(import("@/features/order-appointment/OrderAppointmentPage")));
const ReportsPage          = lazy(() => lazyDefault(import("@/features/reports/ReportsPage")));
const PreferencesPage      = lazy(() => lazyDefault(import("@/features/settings/PreferencesPage")));
// If NotificationsHost was a named export, the helper above would still work,
// but to isolate crashes we’ll disable it for one deploy and re-enable after.
const KanbanBoardPage      = lazy(() => lazyDefault(import("@/features/kanban/KanbanBoardPage")));

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

function AppRoutes() {
  return (
    <ErrorBoundary>
      <CommandPalette /> {/* ← mount inside the tree */}
      <Suspense fallback={<div className="p-6">Loading…</div>}>
        {/* Temporarily comment out NotificationsHost to isolate crashes */}
        {/* <NotificationsHost /> */}
        <Routes>
          <Route path="/" element={<Navigate to={ROUTES.orders} replace />} />
          <Route path={ROUTES.orders} element={<OrdersListMvp />} />
          <Route path={ROUTES.newOrder} element={<OrderCreatePage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/orders/:id/appointment" element={<OrderAppointmentPage />} />
          <Route path={ROUTES.reports} element={<ReportsPage />} />
          <Route path={ROUTES.settings} element={<PreferencesPage />} />
          <Route path={ROUTES.board} element={<KanbanBoardPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default AppRoutes;
export { AppRoutes };








