'use client';

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../stores/NotificationStore';
import { useUserStore } from '../stores/UserStore';

export const useNotificationConnection = () => {
  const { user } = useUserStore();
  const { connectSSE, disconnectSSE, addNotification } = useNotificationStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!user?.user_id) {
      // User not authenticated, disconnect if connected
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        disconnectSSE();
      }
      return;
    }

    // User is authenticated, establish SSE connection
    const connectToSSE = () => {
      try {
        // Close existing connection if any
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Get token for SSE (sent via query param)
        const token = (typeof window !== 'undefined' && localStorage.getItem('auth_token')) || 'dev-token';
        const url = `/api/v1/notification/subscribe?userId=${encodeURIComponent(user.user_id)}&token=${encodeURIComponent(token)}`;
        console.log('[SSE] Connecting to:', url);
        const eventSource = new EventSource(url, { withCredentials: true });

        eventSource.onopen = () => {
          console.log('[SSE] connection established');
          connectSSE();
        };

        // Unified handler for both default and named events
        const handleIncoming = (event: MessageEvent) => {
          try {
            const raw = event.data;
            const eventName = (event as any).type || 'message';
            console.log('[SSE] Event received:', { eventName, raw });

            const data = JSON.parse(raw);

            // Map worker event names to store types
            const typeMap: Record<string, 'new_star_generated' | 'new_card_available' | 'graph_projection_updated'> = {
              new_star: 'new_star_generated',
              new_card: 'new_card_available',
              graph_updated: 'graph_projection_updated'
            };

            const mappedType =
              typeMap[eventName] ||
              (data.type as 'new_star_generated' | 'new_card_available' | 'graph_projection_updated' | undefined);

            // Build title/description with good fallbacks
            let title = data.title ?? data.display_data?.title;
            let description = data.description ?? data.display_data?.description;

            if (!title && mappedType === 'graph_projection_updated') {
              title = 'Graph projection updated';
              description = `Nodes: ${data.nodeCount ?? '—'}, Edges: ${data.edgeCount ?? '—'}`;
            }

            const notification = {
              id: data.id || `notification-${Date.now()}`,
              type: mappedType,
              title: title ?? 'Notification',
              description: description ?? '',
              timestamp: new Date(data.timestamp || Date.now()),
              isRead: false,
              userId: user.user_id,
              metadata: data.metadata
            };

            console.log('[SSE] Parsed notification:', notification);
            addNotification(notification);
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };

        // Listen to default "message" and all named events
        eventSource.onmessage = handleIncoming;
        ['notification', 'new_star', 'new_card', 'graph_updated'].forEach((evt) => {
          console.log('[SSE] Adding listener for event:', evt);
          eventSource.addEventListener(evt, handleIncoming);
        });

        eventSource.onerror = (error) => {
          console.error('[SSE] connection error:', error);
          try {
            console.log('[SSE] readyState:', eventSource.readyState);
          } catch {}
          eventSource.close();

          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (user?.user_id) {
              console.log('[SSE] reconnecting…');
              connectToSSE();
            }
          }, 5000);
        };

        eventSourceRef.current = eventSource;
      } catch (error) {
        console.error('Failed to establish SSE connection:', error);
      }
    };

    connectToSSE();

    // Cleanup on unmount or user change
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        disconnectSSE();
      }
    };
  }, [user?.user_id, connectSSE, disconnectSSE, addNotification]);

  return {
    isConnected: !!eventSourceRef.current && eventSourceRef.current.readyState === EventSource.OPEN
  };
};