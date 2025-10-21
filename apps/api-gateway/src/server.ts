// server.ts
import { environmentLoader } from '@2dots1line/core-utils';
environmentLoader.load();
environmentLoader.injectIntoProcess();

import { createApp } from './app';

const isProd = process.env.NODE_ENV === 'production';
const PORT = isProd
  ? Number(process.env.PORT || 8080)
  : Number(process.env.PORT || process.env.API_GATEWAY_PORT || 3001);

async function startServer() {
  try {
    console.log('🚀 Starting API Gateway...');
    console.log(`[Startup] NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}, API_GATEWAY_PORT=${process.env.API_GATEWAY_PORT}`);
    const app = await createApp();
    
    app.listen(PORT, () => {
      console.log(`[API Gateway] Server is running on port ${PORT}`);
    });
    console.log(`[API Gateway] Server is running on port ${PORT}`);
  } catch (error) {
    console.error('❌ Failed to start API Gateway:', error);
    process.exit(1);
  }
}

startServer();