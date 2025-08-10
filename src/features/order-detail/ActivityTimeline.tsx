import { useEffect, useState } from "react";
import { fetchActivity } from "@/api/fetchActivity";
import { subscribeToActivity } from "@/api/subscribeToActivity";

interface ActivityEvent {
  id: number;
  order_id: string;
  event_type: string;
  message: string;
  occurred_at: string;
  actor_name?: string | null;
}

export function ActivityTimeline({ orderId }: { orderId: string }) {
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    let unsubscribe = () => {};
    // fetch initial data and set up subscription
    const init = async () => {
      try {
        const data = await fetchActivity(orderId);
        setActivity(data as ActivityEvent[]);
      } catch (error) {
        console.error(error);
      }
      // subscribe to realtime updates; on change, refetch activity
      unsubscribe = subscribeToActivity(orderId, async () => {
        try {
          const updated = await fetchActivity(orderId);
          setActivity(updated as ActivityEvent[]);
        } catch (err) {
          console.error(err);
        }
      });
    };
    init();
    return () => {
      unsubscribe();
    };
  }, [orderId]);

  return (
    <div className="space-y-2">
      {activity.map((event) => (
        <div key={event.id} className="border-b pb-2">
          <div className="text-sm text-gray-500">
            {new Date(event.occurred_at).toLocaleString()}
          </div>
          <div>{event.message}</div>
        </div>
      ))}
    </div>
  );
}
