import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * App shell component.
 * Renders a sidebar with navigation links and a main content area where nested routes are displayed.
 */
const App: React.FC = () => {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-gray-100 p-4">
        <h1 className="text-xl font-bold mb-4">Falcon</h1>
        <nav className="space-y-2">
          <a href="/" className="block">Dashboard</a>
          <a href="/orders" className="block">Orders</a>
          <a href="/clients" className="block">Clients</a>
          <a href="/reports" className="block">Reports</a>
          <a href="/users" className="block">Users</a>
          <a href="/settings" className="block">Settings</a>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default App;
