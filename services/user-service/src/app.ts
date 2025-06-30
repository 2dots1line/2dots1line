import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import v1UserRouter from './routes/v1';

const app: Express = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'user-service' });
});

app.use('/api/v1', v1UserRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error in user-service:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

export default app; 