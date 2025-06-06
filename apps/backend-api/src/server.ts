/**
 * Backend API Server (Placeholder)
 * This is a minimal implementation to satisfy build requirements
 */

import express, { Express } from 'express';

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
});

export default app; 