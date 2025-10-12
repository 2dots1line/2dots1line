import { createApp } from './app';
import { Server } from 'http';

const PORT = process.env.API_GATEWAY_PORT || 3001;

async function startServer() {
  try {
    console.log('🚀 Starting API Gateway...');
    const app = await createApp();
    
    const server: Server = app.listen(PORT, () => {
      console.log(`[API Gateway] Server is running on port ${PORT}`);
    });

    // CRITICAL FIX: Configure server timeouts for long-running SSE connections
    // Default Node.js timeout is 2 minutes (120000ms), which is too short for LLM streaming
    server.timeout = 0; // Disable timeout for SSE endpoints (they handle their own keep-alive)
    server.keepAliveTimeout = 65000; // Keep TCP connections alive for 65s (longer than typical load balancer timeout of 60s)
    server.headersTimeout = 70000; // Wait up to 70s for complete headers (must be > keepAliveTimeout)

    console.log(`⚙️  Server timeout configuration:
      - timeout: ${server.timeout}ms (0 = disabled for SSE)
      - keepAliveTimeout: ${server.keepAliveTimeout}ms
      - headersTimeout: ${server.headersTimeout}ms`);

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });

    // Handle connection errors
    server.on('clientError', (error, socket) => {
      console.error('❌ Client error:', error);
      if (socket.writable) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start API Gateway:', error);
    process.exit(1);
  }
}

startServer(); 