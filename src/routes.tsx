import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import DashboardPage from './features/dashboard/DashboardPage';
import OrdersListPage from './features/orders-list/OrdersListPage';
import OrderDetailPage from './features/order-detail/OrderDetailPage';
import ClientsListPage from './features/clients/ClientsListPage';
import ClientProfilePage from './features/clients/ClientProfilePage';
import ReportsPage from './features/reports/ReportsPage';
import UsersPage from './features/users/UsersPage';
import SettingsPage from './features/settings/SettingsPage';

/**
 * Defines the router configuration for the application.
 * Uses react-router-dom to map routes to pages. Nested under the App shell for layout.
 */
const RoutesConfig: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersListPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="clients" element={<ClientsListPage />} />
        <Route path="clients/:id" element={<ClientProfilePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RoutesConfig;
