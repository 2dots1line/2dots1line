import app from './app';

const PORT = process.env.USER_SERVICE_PORT || 3001;

app.listen(PORT, () => {
  console.log(`User Service is running on port ${PORT}`);
}); 