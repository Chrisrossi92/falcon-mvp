export type OrderStatus = 'New' | 'In Progress' | 'Review' | 'Complete' | 'Cancelled';

export interface Order {
  id: number;
  client: string;
  property: string;
  cityState: string;
  type: string;
  status: OrderStatus;
  assignedTo: string;
  due: string;
}
