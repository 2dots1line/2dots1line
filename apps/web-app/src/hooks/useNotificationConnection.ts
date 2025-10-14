'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '../stores/NotificationStore';
import { useUserStore } from '../stores/UserStore';

export const useNotificationConnection = () => {
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
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const NOTIFICATION_SERVICE_URL = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3002';
        
        console.log('[Socket.IO] Connecting to:', NOTIFICATION_SERVICE_URL);
        
        const socket = io(NOTIFICATION_SERVICE_URL, {
          auth: {
            token: token,
            userId: user.user_id
          },
          transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
          timeout: 20000,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          maxReconnectionAttempts: 5
        });

        socket.on('connect', () => {
          console.log('[Socket.IO] ✅ Connection established successfully');
          connectSSE();
        });

        socket.on('connected', (data) => {
          console.log('[Socket.IO] Server confirmation:', data);
        });

        // Handle video generation complete
        socket.on('video_generation_complete', (data: any) => {
          console.log('[Socket.IO] Video generation complete:', data);
          addNotification({
            type: 'success',
            title: '🎬 Video Ready!',
            message: data.message || 'Your background video is ready!',
            duration: 8000,
            metadata: {
              videoUrl: data.videoUrl,
              viewContext: data.viewContext,
              cost: data.cost,
              model: data.model
            }
          });
          
          // 🔥 NEW: Refresh local videos list to pick up the new file from filesystem
          const { useBackgroundVideoStore } = require('../stores/BackgroundVideoStore');
          const { loadLocalVideos } = useBackgroundVideoStore.getState();
          loadLocalVideos().catch((err: Error) => 
            console.error('[Socket.IO] Failed to refresh local videos:', err)
          );
          
          // Dispatch custom event for chat interface to show inline preview
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('video_generation_complete', { detail: data }));
          }
        });

        // Handle video generation failed
        socket.on('video_generation_failed', (data: any) => {
          console.log('[Socket.IO] Video generation failed:', data);
          addNotification({
            type: 'error',
            title: '❌ Video Generation Failed',
            message: data.message || 'Video generation failed. Please try again.',
            duration: 5000
          });
        });

        // Handle all notification events
        const handleNotification = (data: any) => {
          try {
            console.log('[Socket.IO] 📨 Event received:', data);
            
    // Handle HRT seed entities
    if (data.seedEntityIds) {
      // Dispatch custom event to cosmos scene
      const event = new CustomEvent('hrt-seed-entities', {
        detail: {
          seedEntityIds: data.seedEntityIds,
          userId: data.userId,
          timestamp: data.timestamp
        }
      });
      window.dispatchEvent(event);
      return;
    }
            
            // Handle consolidated updates from notification worker
            if (data.newCards !== undefined || data.graphUpdates !== undefined || data.insights !== undefined) {
              // This is a consolidated update
              const notification = {
                id: `consolidated-${Date.now()}`,
                type: 'new_card_available' as const, // Use a default type for consolidated updates
                title: 'Updates Available',
                description: data.message || 'New updates are available',
                timestamp: new Date(data.timestamp || Date.now()),
                isRead: false,
                userId: user.user_id,
                metadata: {
                  newCards: data.newCards || 0,
                  graphUpdates: data.graphUpdates || 0,
                  insights: data.insights || 0,
                  isConsolidated: true
                }
              };

              console.log('[Socket.IO] 🎉 Adding consolidated notification to store:', notification);
              addNotification(notification);
              return;
            }
            
            // Handle individual notifications
            const typeMap: Record<string, 'new_star_generated' | 'new_card_available' | 'graph_projection_updated' | 'coordinates_updated'> = {
              new_star: 'new_star_generated',
              new_card: 'new_card_available',
              new_card_available: 'new_card_available',
              graph_updated: 'graph_projection_updated',
              graph_projection_updated: 'graph_projection_updated',
              coordinates_updated: 'coordinates_updated'
            };

            const mappedType = typeMap[data.type] || data.type;

            // Build title/description with good fallbacks
            let title = data.title ?? data.display_data?.title;
            let description = data.description ?? data.display_data?.content;

            if (!title && mappedType === 'graph_projection_updated') {
              title = 'Graph projection updated';
              description = `Nodes: ${data.nodeCount ?? '—'}, Edges: ${data.edgeCount ?? '—'}`;
            } else if (!title && mappedType === 'coordinates_updated') {
              title = '3D coordinates updated';
              description = `Updated coordinates for ${data.coordinateUpdate?.nodeCount ?? '—'} nodes using ${data.coordinateUpdate?.method ?? 'hybrid UMAP'}`;
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

            console.log('[Socket.IO] 🎉 Adding notification to store:', notification);
            addNotification(notification);

            // Special handling for coordinates_updated - trigger Cosmos refresh
            if (mappedType === 'coordinates_updated') {
              console.log('[Socket.IO] 🌌 Coordinates updated, triggering Cosmos refresh');
              // Dispatch custom event for Cosmos to listen to
              window.dispatchEvent(new CustomEvent('cosmos-coordinates-updated', {
                detail: {
                  nodeCount: data.coordinateUpdate?.nodeCount,
                  method: data.coordinateUpdate?.method,
                  isIncremental: data.coordinateUpdate?.isIncremental
                }
              }));
            }
          } catch (error) {
            console.error('[Socket.IO] Error processing notification:', error);
          }
        };

        // Listen to all notification events
        ['notification', 'new_star', 'new_card', 'graph_updated', 'new_card_available', 'graph_projection_updated', 'consolidated_update', 'hrt_seed_entities'].forEach((eventName) => {
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