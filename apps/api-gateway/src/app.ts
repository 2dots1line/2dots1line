import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import v1Router from './routes/v1';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'API Gateway is running' });
});

// V11.1 API Routes
app.use('/api/v1', v1Router);

// Handle 404 Not Found for any routes not matched above
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

// Global Error Handler - MUST be the last middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app; 