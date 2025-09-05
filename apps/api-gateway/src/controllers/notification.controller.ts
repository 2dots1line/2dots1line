import type { Request, Response } from 'express';
import { DatabaseService } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils';
import type { SSEMessage } from '@2dots1line/shared-types';

export class NotificationController {
  private db: DatabaseService;
  private channelName: string;

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
    environmentLoader.load();
    this.channelName = environmentLoader.get('NOTIFICATION_REDIS_CHANNEL') || 'sse_notifications_channel';
  }

  // GET /api/v1/notifications/subscribe?userId=...
  public subscribe = async (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || '';

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Initial event to establish the stream
    res.write(': connected\n\n');

    // Create a dedicated subscriber connection
    const subscriber = this.db.redis.duplicate();

    try {
      await subscriber.subscribe(this.channelName);
      console.log(`[SSE] Client connected userId=${userId} channel=${this.channelName}`);
    } catch (err) {
      console.error('[SSE] Failed to subscribe to channel:', err);
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Subscription failed' })}\n\n`);
      res.end();
      return;
    }

    // Forward only messages for this userId
    const onMessage = (channel: string, raw: string) => {
      try {
        const parsed: SSEMessage = JSON.parse(raw);
        if (userId && parsed.userId && parsed.userId !== userId) {
          return; // not this client's message
        }

        // Stream event to client
        const event = parsed.event || 'message';
        const data = parsed.data || '{}';

        // Debug: log when forwarding
        console.log(`[SSE] Forwarding event="${event}" to userId="${userId || parsed.userId || 'unknown'}"`); 

        res.write(`event: ${event}\n`);
        res.write(`data: ${data}\n\n`);
      } catch (e) {
        console.error('[SSE] Error parsing message:', e);
      }
    };

    subscriber.on('message', onMessage);

    // Keep-alive ping
    const keepAlive = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 25000);

    // Cleanup on client disconnect
    const cleanup = async () => {
      clearInterval(keepAlive);
      try {
        await subscriber.unsubscribe(this.channelName);
      } catch (_) {}
      try {
        subscriber.quit();
      } catch (_) {}
      console.log(`[SSE] Client disconnected userId=${userId}`);
    };

    req.on('close', cleanup);
    req.on('end', cleanup);
    req.on('error', cleanup);
  };
}