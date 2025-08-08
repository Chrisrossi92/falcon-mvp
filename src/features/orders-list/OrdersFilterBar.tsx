import React from 'react';

interface OrdersFilterBarProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
}

const OrdersFilterBar: React.FC<OrdersFilterBarProps> = ({ search, setSearch }) => (
  <div className="mb-4 flex items-center gap-2">
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search orders"
      className="border border-gray-300 rounded px-2 py-1"
    />
  </div>
);

export default OrdersFilterBar;
