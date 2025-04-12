const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize database connections
const neo4jService = require('./services/neo4jService');

// Import routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const vectorRoutes = require('./routes/vectorRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const thoughtRoutes = require('./routes/thoughtRoutes');
const knowledgeGraphRoutes = require('./routes/knowledgeGraphRoutes');
const semanticMemoryRoutes = require('./routes/semanticMemoryRoutes');

// Add the import for memory broker and test routes
const memoryBroker = require('./memory/memoryBroker');
const testRoutes = require('./routes/testRoutes');

// Initialize Express app
const app = express();
const PORT = 3010;
console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize memory broker in non-production environments
if (process.env.NODE_ENV !== 'production') {
  // Initialize memory broker
  memoryBroker.initialize()
    .then(() => console.log('Memory broker initialized successfully'))
    .catch(err => console.error('Failed to initialize memory broker:', err));
}

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/vector', vectorRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/thoughts', thoughtRoutes);
app.use('/api/knowledge', knowledgeGraphRoutes);
app.use('/api/semantic-memory', semanticMemoryRoutes);

// Add test routes in non-production environments
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes);
  console.log('✅ Test routes enabled - DO NOT USE IN PRODUCTION');
}

// Serve the landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Serve the profile page
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'profile.html'));
});

// Serve the chat page
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'chat.html'));
});

// Serve the NEW chat page
app.get('/newchat', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'NewChat.html'));
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Catch-all route to serve the index page for SPA-like behavior
app.get('*', (req, res) => {
  // Exclude API routes and static file extensions
  if (!req.path.startsWith('/api') && 
      !req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/)) {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

// Function to check if port is in use
const isPortInUse = async (port) => {
  return new Promise((resolve) => {
    const server = require('net').createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
};

// Function to find next available port
const findAvailablePort = async (startPort) => {
  // First try the preferred port
  if (!(await isPortInUse(startPort))) {
    return startPort;
  }
  
  // Then try the backup port
  const backupPort = 3002;
  if (!(await isPortInUse(backupPort))) {
    return backupPort;
  }
  
  // If both are in use, use a stable fallback port
  return 3003;
};

// Initialize services and start server
const startServer = async () => {
  try {
    // Initialize Neo4j connection
    await neo4jService.init();
    console.log('Neo4j database initialized successfully');

    // Use a different stable port
    const PORT = 3010;
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      memoryBroker.initialize().then(() => {
        console.log('Memory broker initialized successfully');
      }).catch(err => {
        console.error('Failed to initialize memory broker:', err);
      });
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutdown signal received. Closing server...');
      
      // Close Neo4j connection
      try {
        await neo4jService.close();
        console.log('Neo4j connection closed');
      } catch (error) {
        console.error('Error closing Neo4j connection:', error);
      }

      // Close HTTP server
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    // Handle various shutdown signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught Exception:', error);
      await shutdown();
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 