import { useEffect } from 'react';

export interface UseOrderEventsOptions {
  onOrderCreated?: (order: any) => void;
  onOrderUpdated?: (order: any) => void;
  enabled?: boolean;
}

/**
 * Custom React Hook that connects to the live Server-Sent Events (SSE) stream
 * at /api/orders/events and triggers callbacks on real-time order updates.
 */
export function useOrderEvents({
  onOrderCreated,
  onOrderUpdated,
  enabled = true,
}: UseOrderEventsOptions) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const eventSource = new EventSource('/api/orders/events');

    eventSource.onopen = () => {
      console.log('Connected to Oh Richi live SSE order stream.');
    };

    eventSource.addEventListener('order_created', (event: MessageEvent) => {
      try {
        const orderData = JSON.parse(event.data);
        if (onOrderCreated) {
          onOrderCreated(orderData);
        }
      } catch (err) {
        console.error('Error parsing order_created event data:', err);
      }
    });

    eventSource.addEventListener('order_updated', (event: MessageEvent) => {
      try {
        const orderData = JSON.parse(event.data);
        if (onOrderUpdated) {
          onOrderUpdated(orderData);
        }
      } catch (err) {
        console.error('Error parsing order_updated event data:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn('SSE connection error or reconnecting:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [onOrderCreated, onOrderUpdated, enabled]);
}
