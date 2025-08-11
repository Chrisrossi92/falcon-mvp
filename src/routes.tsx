// src/routes.tsx
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import CommandPalette from "@/features/command/CommandPalette";

// Direct imports for the 3 we already proved
import OrdersListMvp from "@/features/orders-list/OrdersListMvp";
import PreferencesPage from "@/features/settings/PreferencesPage";
import KanbanBoardPage from "@/features/kanban/KanbanBoardPage";

// Safe placeholders for the other half (we'll swap real pages in next)
const OrderDetailPage      = () => <div className="p-6">Order detail placeholder</div>;
const OrderAppointmentPage = () => <div className="p-6">Appointment placeholder</div>;
const ReportsPage          = () => <div className="p-6">Reports placeholder</div>;

// NOTE: Leave NotificationsHost off for now until everything else is stable.

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











