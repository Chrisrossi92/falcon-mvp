// src/routes.tsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const OrdersListMvp   = lazy(() => import("@/features/orders-list/OrdersListMvp"));
const OrderDetailPage = lazy(() => import("@/features/order-detail/OrderDetailPage"));
const OrderCreatePage = lazy(() => import("@/features/order-create/OrderCreatePage"));
const OrderAppointmentPage = lazy(() => import("@/features/order-appointment/OrderAppointmentPage"));

export const ROUTES = {
  orders: "/orders",
  order: (id: string) => `/orders/${id}`,
  newOrder: "/orders/new",
  appointment: (id: string) => `/orders/${id}/appointment`,
};

function NotFound() {
  return <div className="p-6">Page not found.</div>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.orders} replace />} />
        <Route path={ROUTES.orders} element={<OrdersListMvp />} />
        <Route path={ROUTES.newOrder} element={<OrderCreatePage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/orders/:id/appointment" element={<OrderAppointmentPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
export { AppRoutes };


