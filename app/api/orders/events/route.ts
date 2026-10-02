import { NextResponse } from 'next/server';
import { subscribeToOrderEvents, OrderEventPayload } from '@/lib/events';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authResult = await requireRole(request, ['SUPER_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    start(controller) {
      // Send initial connection handshake
      const connectMessage = `event: connected\ndata: ${JSON.stringify({ message: 'Connected to Oh Richi live order stream' })}\n\n`;
      controller.enqueue(encoder.encode(connectMessage));

      // Subscribe to order events
      const unsubscribe = subscribeToOrderEvents((event: OrderEventPayload) => {
        const message = `event: ${event.type}\ndata: ${JSON.stringify(event.order)}\n\n`;
        try {
          controller.enqueue(encoder.encode(message));
        } catch (e) {
          // Stream closed
        }
      });

      // Send periodic heartbeat every 15 seconds to keep connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch (e) {
          clearInterval(interval);
        }
      }, 15000);

      // Clean up subscription when client disconnects
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {
          // Already closed
        }
      });
    },
  });

  return new NextResponse(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
