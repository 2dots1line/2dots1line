import app from './app';

const PORT = process.env.DIALOGUE_SERVICE_PORT || 3002;

app.listen(PORT, () => {
  console.log(`Dialogue Service is running on port ${PORT}`);
}); 