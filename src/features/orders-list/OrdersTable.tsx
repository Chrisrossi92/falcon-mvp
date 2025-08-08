import React from 'react';
import { Order } from '../../entities/order/types';

interface OrdersTableProps {
  orders: Order[];
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
  if (!orders || orders.length === 0) {
    return <div>No orders found.</div>;
  }
  return (
    <table className="min-w-full bg-white border border-gray-200">
      <thead>
        <tr>
          <th className="px-3 py-2 border-b">Order #</th>
          <th className="px-3 py-2 border-b">Client</th>
          <th className="px-3 py-2 border-b">Property</th>
          <th className="px-3 py-2 border-b">City</th>
          <th className="px-3 py-2 border-b">State</th>
          <th className="px-3 py-2 border-b">Type</th>
          <th className="px-3 py-2 border-b">Status</th>
          <th className="px-3 py-2 border-b">Assigned</th>
          <th className="px-3 py-2 border-b">Due</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td className="px-3 py-2 border-b">{order.id}</td>
            <td className="px-3 py-2 border-b">{order.client}</td>
            <td className="px-3 py-2 border-b">{order.property}</td>
            <td className="px-3 py-2 border-b">{order.city}</td>
            <td className="px-3 py-2 border-b">{order.state}</td>
            <td className="px-3 py-2 border-b">{order.type}</td>
            <td className="px-3 py-2 border-b">{order.status}</td>
            <td className="px-3 py-2 border-b">{order.assigned}</td>
            <td className="px-3 py-2 border-b">{order.due}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default OrdersTable;
