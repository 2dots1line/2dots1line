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

// Import routes (to be created)
import { authRoutes } from './routes/auth.routes';
import { cardRoutes } from './routes/card.routes';
import userRoutes from './routes/user.routes';
import chatRoutes from './routes/chat.routes';

const app: Express = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Basic Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'API is running' });
});

// API Routes - Implements Directive 2: User growth profile endpoints
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

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