import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchOrder } from '@/api/fetchOrder';
import ActivityTimeline from './ActivityTimeline';
import NoteComposer from './NoteComposer';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchOrder(id)
        .then((data) => {
          setOrder(data);
          setLoading(false);
        })
        .catch((e) => {
          setError(e);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div>Loading…</div>;
  }
  if (error || !order) {
    return <div>Error loading order.</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Order detail</h2>
      <div className="mb-4">
        <p><strong>Address:</strong> {order.address || 'N/A'}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Client:</strong> {order.client_name || 'N/A'}</p>
        <p><strong>Assignee:</strong> {order.assignee_name || 'Unassigned'}</p>
        <p><strong>Due Date:</strong> {order.due_date || 'N/A'}</p>
      </div>
      <ActivityTimeline orderId={id} />
      <NoteComposer orderId={id} />
    </div>
  );
};

export default OrderDetailPage;

