import app from './app';

const PORT = process.env.API_GATEWAY_PORT || 3001;

app.listen(PORT, () => {
  console.log(`[API Gateway] Server is running on port ${PORT}`);
}); 