import { createApp } from './app';

const PORT = process.env.API_GATEWAY_PORT || 3001;

async function startServer() {
  try {
    console.log('🚀 Starting API Gateway...');
    const app = await createApp();
    
    app.listen(PORT, () => {
      console.log(`[API Gateway] Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start API Gateway:', error);
    process.exit(1);
  }
}

startServer(); 