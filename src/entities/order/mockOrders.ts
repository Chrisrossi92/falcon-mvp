import { Order } from './types';

export const mockOrders: Order[] = [
  {
    id: '1001',
    client: 'ABC Bank',
    property: '123 Elm St',
    city: 'Columbus',
    state: 'OH',
    type: 'Residential',
    status: 'New',
    assigned: 'John Smith',
    due: '2025-09-01',
    sla: '5 days',
    lastActivity: '2025-08-01'
  },
  {
    id: '1002',
    client: 'XYZ Corp',
    property: '456 Oak Ave',
    city: 'Cleveland',
    state: 'OH',
    type: 'Commercial',
    status: 'In Progress',
    assigned: 'Jane Doe',
    due: '2025-09-05',
    sla: '7 days',
    lastActivity: '2025-08-02'
  },
  {
    id: '1003',
    client: 'Acme LLC',
    property: '789 Pine Rd',
    city: 'Cincinnati',
    state: 'OH',
    type: 'Industrial',
    status: 'Review',
    assigned: 'Mike Lee',
    due: '2025-09-10',
    sla: '10 days',
    lastActivity: '2025-08-03'
  }
];
