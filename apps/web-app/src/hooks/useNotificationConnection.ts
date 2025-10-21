'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '../stores/NotificationStore';
import { useUserStore } from '../stores/UserStore';

export function useNotificationConnection() {
  const { user } = useUserStore();
  const { connectSSE, disconnectSSE, addNotification } = useNotificationStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log('[Socket.IO] useNotificationConnection effect - user:', user, 'user_id:', user?.user_id);
    
    if (!user?.user_id) {
      console.log('[Socket.IO] No user_id found, disconnecting if connected');
      // User not authenticated, disconnect if connected
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        disconnectSSE();
      }
      return;
    }

    // User is authenticated, establish Socket.IO connection
    const connectToSocketIO = () => {
      try {
        // Close existing connection if any
        if (socketRef.current) {
          socketRef.current.disconnect();
        }

        // Get token for authentication
        const token = (typeof window !== 'undefined' && localStorage.getItem('auth_token')) || 'dev-token';
        const NOTIFICATION_SERVICE_URL = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3002';
        
        console.log('[Socket.IO] Connecting to:', NOTIFICATION_SERVICE_URL);
        
        const socket = io(NOTIFICATION_SERVICE_URL, {
          auth: {
            token: token,
            userId: user.user_id
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5
          // removed: maxReconnectionAttempts (not a valid Socket.IO option)
        });

        socket.on('connect', () => {
          console.log('[Socket.IO] ✅ Connection established successfully');
          connectSSE();
        });

        socket.on('connected', (data) => {
          console.log('[Socket.IO] Server confirmation:', data);
        });

        // Handle all notification events
        const handleNotification = (data: any) => {
          try {
            console.log('[Socket.IO] 📨 Event received:', data);

            if (data.newCards !== undefined || data.graphUpdates !== undefined || data.insights !== undefined) {
              const consolidatedDescription =
                data.message ||
                `Cards: ${data.newCards ?? 0}, Graph updates: ${data.graphUpdates ?? 0}, Insights: ${data.insights ?? 0}`;

              const consolidatedPayload = {
                type: 'new_card_available' as const,
                title: 'Updates Available',
                description: consolidatedDescription,
                userId: user.user_id
              };

              console.log('[Socket.IO] 🎉 Adding consolidated notification to store:', consolidatedPayload);
              addNotification(consolidatedPayload);
              return;
            }

            const typeMap: Record<string, 'new_star_generated' | 'new_card_available' | 'graph_projection_updated'> = {
              new_star: 'new_star_generated',
              new_card: 'new_card_available',
              new_card_available: 'new_card_available',
              graph_updated: 'graph_projection_updated',
              graph_projection_updated: 'graph_projection_updated'
            };

            const mappedType = typeMap[data.type] || data.type;

            let title = data.title ?? data.display_data?.title;
            let description = data.description ?? data.display_data?.description;

            if (!title && mappedType === 'graph_projection_updated') {
              title = 'Graph projection updated';
              description = `Nodes: ${data.nodeCount ?? '—'}, Edges: ${data.edgeCount ?? '—'}`;
            }

            const metadataCandidate = {
              starId: data.metadata?.starId,
              cardId: data.metadata?.cardId,
              starType: data.metadata?.starType
            };

            const payload = {
              type: mappedType,
              title: title ?? 'Notification',
              description: description ?? '',
              userId: user.user_id,
              ...(metadataCandidate.starId || metadataCandidate.cardId || metadataCandidate.starType
                ? { metadata: metadataCandidate }
                : {})
            };

            console.log('[Socket.IO] 🎉 Adding notification to store:', payload);
            addNotification(payload);
          } catch (error) {
            console.error('[Socket.IO] Error processing notification:', error);
          }
        };

        // Listen to all notification events
        ['notification', 'new_star', 'new_card', 'graph_updated', 'new_card_available', 'graph_projection_updated', 'consolidated_update'].forEach((eventName) => {
          console.log('[Socket.IO] Adding listener for event:', eventName);
          socket.on(eventName, handleNotification);
        });

        socket.on('disconnect', (reason) => {
          console.log('[Socket.IO] Disconnected:', reason);
          disconnectSSE();
        });

        socket.on('connect_error', (error) => {
          console.error('[Socket.IO] Connection error:', error);
          disconnectSSE();
        });

        socket.on('reconnect', (attemptNumber) => {
          console.log('[Socket.IO] Reconnected after', attemptNumber, 'attempts');
          connectSSE();
        });

        socket.on('reconnect_error', (error) => {
          console.error('[Socket.IO] Reconnection error:', error);
        });

        socket.on('reconnect_failed', () => {
          console.error('[Socket.IO] Reconnection failed');
          disconnectSSE();
        });

        // Handle ping/pong for connection health
        socket.on('pong', (data) => {
          console.log('[Socket.IO] Pong received:', data);
        });

        socketRef.current = socket;
      } catch (error) {
        console.error('Failed to establish Socket.IO connection:', error);
      }
    };

    connectToSocketIO();

    // Cleanup on unmount or user change
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        disconnectSSE();
      }
    };
  }, [user?.user_id, connectSSE, disconnectSSE, addNotification]);

  return {
    isConnected: !!socketRef.current && socketRef.current.connected
  };
};