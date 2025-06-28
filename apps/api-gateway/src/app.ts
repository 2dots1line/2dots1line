import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

// Manually resolve DATABASE_URL since dotenv doesn't support variable substitution
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('${')) {
  const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST_PORT, POSTGRES_DB_NAME } = process.env;
  if (POSTGRES_USER && POSTGRES_PASSWORD && POSTGRES_HOST_PORT && POSTGRES_DB_NAME) {
    process.env.DATABASE_URL = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_HOST_PORT}/${POSTGRES_DB_NAME}`;
    console.log('DATABASE_URL resolved:', process.env.DATABASE_URL);
  } else {
    console.error('Missing PostgreSQL environment variables');
  }
}

// Import V9.7 consolidated routes with error handling
let v1Router;
try {
  console.log('🔧 Importing v1Router...');
  v1Router = require('./routes/v1').default;
  console.log('✅ v1Router imported successfully');
} catch (error) {
  console.error('❌ Failed to import v1Router:', error);
  process.exit(1);
}

const app: Express = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Basic Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'API Gateway V9.7 is running' });
});

// Debug endpoint to check router
app.get('/api/debug', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Debug endpoint',
    v1RouterLoaded: !!v1Router,
    routes: app._router ? app._router.stack.map((r: any) => r.route?.path || 'middleware') : 'no router'
  });
});

// V9.7 API Routes - All routes are now versioned under /api/v1
if (v1Router) {
  console.log('🔧 Mounting v1Router at /api/v1...');
  app.use('/api/v1', v1Router);
  console.log('✅ v1Router mounted successfully');
} else {
  console.error('❌ v1Router is null, cannot mount routes');
}

// Global Error Handler (simple example)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err.stack);
  // Avoid sending stack trace to client in production
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Handle 404 Not Found
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

export default app; 