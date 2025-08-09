import { Order } from './types';
import { mockOrders } from './mockOrders';

export const getOrders = async (): Promise<Order[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockOrders);
    }, 500);
  });
};

export const getOrderById = async (id: string): Promise<Order | undefined> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockOrders.find(o => o.id === id));
    }, 500);
  });
};
