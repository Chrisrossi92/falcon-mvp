import React, { useState } from 'react';
import { Order } from '../../entities/order/types';
import { mockOrders } from '../../entities/order/mockOrders';
import OrdersFilterBar from './OrdersFilterBartsx';
import OrdersTable from './OrdersTable';

interface SavedView {
  name: string;
  search: string;
}

const SAVED_VIEWS_KEY = 'ordersListSavedViews';

const OrdersListView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    const stored = localStorage.getItem(SAVED_VIEWS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const filteredOrders: Order[] = mockOrders.filter((order) =>
    (order.clientName + ' ' + order.propertyAddress + ' ' + order.orderNumber)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const saveCurrentView = () => {
    const name = prompt('Enter a name for this view:');
    if (!name) return;
    const newViews = [...savedViews, { name, search }];
    setSavedViews(newViews);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(newViews));
  };

  const applyView = (view: SavedView) => {
    setSearch(view.search);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <OrdersFilterBar search={search} setSearch={setSearch} />
        <button
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded"
          onClick={saveCurrentView}
        >
          Save View
        </button>
        {savedViews.length > 0 && (
          <select
            className="px-2 py-2 border rounded"
            onChange={(e) => {
              const index = e.target.selectedIndex - 1;
              if (index >= 0) {
                applyView(savedViews[index]);
              }
            }}
          >
            <option value="">Load View</option>
            {savedViews.map((view, idx) => (
              <option key={idx} value={view.name}>
                {view.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <OrdersTable orders={filteredOrders} />
    </div>
  );
};

export default OrdersListView;
