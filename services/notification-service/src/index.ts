import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { environmentLoader } from '@2dots1line/core-utils';
import { NotificationService } from './NotificationService';

async function startNotificationService(): Promise<void> {
  try {
    // Load environment variables
    environmentLoader.load();

    // Create Express app
    const app = express();
    app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }));
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'notification-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO service
    const notificationService = new NotificationService(httpServer);

    // Get port from environment
    const port = parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3002', 10);

    // Start server
    httpServer.listen(port, () => {
      console.log(`🚀 Notification Service running on port ${port}`);
      console.log(`📡 Socket.IO server ready for connections`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Received shutdown signal, closing gracefully...');
      
      httpServer.close(async () => {
        await notificationService.shutdown();
        console.log('✅ Notification Service shutdown complete');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start Notification Service:', error);
    process.exit(1);
  }
}

// Start the service
startNotificationService();
