import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import v1Router from './routes/v1';

const app: Express = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'dialogue-service' });
});

app.use('/api/v1', v1Router);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error in dialogue-service:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

export default app; 