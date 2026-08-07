import { EventEmitter } from 'events';

// Global singleton instance for order event broadcasting across Next.js reloads
const globalForEvents = globalThis as unknown as { orderEventEmitter: EventEmitter };

export const orderEventEmitter =
  globalForEvents.orderEventEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.orderEventEmitter = orderEventEmitter;
}

// Configure max listeners to support multiple KDS screens and client dashboards
orderEventEmitter.setMaxListeners(100);

export type OrderEventType = 'order_created' | 'order_updated';

export interface OrderEventPayload {
  type: OrderEventType;
  order: any;
  timestamp: string;
}

/**
 * Broadcasts a newly placed order to all connected SSE clients.
 */
export function broadcastOrderCreated(order: any) {
  const payload: OrderEventPayload = {
    type: 'order_created',
    order,
    timestamp: new Date().toISOString(),
  };
  orderEventEmitter.emit('order_event', payload);
}

/**
 * Broadcasts an order status update to all connected SSE clients.
 */
export function broadcastOrderUpdated(order: any) {
  const payload: OrderEventPayload = {
    type: 'order_updated',
    order,
    timestamp: new Date().toISOString(),
  };
  orderEventEmitter.emit('order_event', payload);
}

/**
 * Subscribes a listener callback to order events and returns an unsubscribe function.
 */
export function subscribeToOrderEvents(
  callback: (payload: OrderEventPayload) => void
): () => void {
  orderEventEmitter.on('order_event', callback);
  return () => {
    orderEventEmitter.off('order_event', callback);
  };
}
