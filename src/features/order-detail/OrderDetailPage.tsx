import React from 'react';
import { useParams } from 'react-router-dom';

/**
 * Placeholder order detail page. Displays the selected order id and placeholder
 * content. This will later include tabs for overview, files, tasks, notes, etc.
 */
const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <h2 className="text-lg font-semibold">Order Detail</h2>
      <p>Viewing order with id: {id}</p>
      <p className="italic">Order detail placeholder</p>
    </div>
  );
};

export default OrderDetailPage;
