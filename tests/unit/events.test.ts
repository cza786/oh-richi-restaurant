import { describe, it, expect, vi } from 'vitest';
import {
  broadcastOrderCreated,
  broadcastOrderUpdated,
  subscribeToOrderEvents,
  OrderEventPayload,
} from '@/lib/events';

describe('Real-Time Events Hub (lib/events.ts)', () => {
  it('should broadcast order_created event to subscribed listeners', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToOrderEvents(listener);

    const mockOrder = { id: 'order-1', shortId: 'OR-100', status: 'PENDING' };
    broadcastOrderCreated(mockOrder);

    expect(listener).toHaveBeenCalledTimes(1);
    const payload: OrderEventPayload = listener.mock.calls[0][0];
    expect(payload.type).toBe('order_created');
    expect(payload.order.id).toBe('order-1');
    expect(payload.timestamp).toBeDefined();

    unsubscribe();
  });

  it('should broadcast order_updated event to subscribed listeners', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToOrderEvents(listener);

    const mockOrder = { id: 'order-2', shortId: 'OR-200', status: 'PREPARING' };
    broadcastOrderUpdated(mockOrder);

    expect(listener).toHaveBeenCalledTimes(1);
    const payload: OrderEventPayload = listener.mock.calls[0][0];
    expect(payload.type).toBe('order_updated');
    expect(payload.order.status).toBe('PREPARING');

    unsubscribe();
  });

  it('should stop receiving events after unsubscribing', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToOrderEvents(listener);

    unsubscribe();
    broadcastOrderCreated({ id: 'order-3' });

    expect(listener).not.toHaveBeenCalled();
  });
});
