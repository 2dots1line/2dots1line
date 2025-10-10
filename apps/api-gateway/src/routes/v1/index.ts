import { Router, type IRouter } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { uploadSingle, handleUploadError } from '../../middleware/upload.middleware';

// Import all V11.0 controllers
import { AuthController } from '../../controllers/auth.controller';
import { ConversationController } from '../../controllers/conversation.controller';
import { CardController } from '../../controllers/card.controller';
import { UserController } from '../../controllers/user.controller';
import { GraphController } from '../../controllers/graph.controller';
import { MediaController } from '../../controllers/media.controller';
import { HRTParametersController } from '../../controllers/hrtParameters.controller';
import { EmbeddingController } from '../../controllers/embedding.controller';
import { createAgentRoutes } from './agent.routes';
import { createQuestRoutes } from './quest.routes';
import { QuestController } from '../../controllers/quest.controller';
import { CosmosQuestAgent } from '@2dots1line/cosmos-quest-service';
import dashboardRoutes from '../../routes/dashboard';

export function createV1Routes(
  authController: AuthController,
  userController: UserController,
  cardController: CardController,
  conversationController: ConversationController,
  graphController: GraphController,
  mediaController: MediaController,
  hrtParametersController: HRTParametersController,
  embeddingController: EmbeddingController,
  cosmosQuestAgent: CosmosQuestAgent
): IRouter {
  const v1Router: IRouter = Router();
  // Create a mock notifier that uses HTTP fallback
  const mockNotifier = {
    sendQuestUpdate: async (executionId: string, data: any) => {
      const notificationWorkerUrl = 'http://localhost:3002';
      try {
        const response = await fetch(`${notificationWorkerUrl}/internal/quest/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            executionId,
            data
          })
        });
        if (!response.ok) {
          console.error(`[MockNotifier] HTTP response not ok: ${response.status}`);
        }
      } catch (error) {
        console.error(`[MockNotifier] Failed to send quest update:`, error);
      }
    }
  };
  
  const questController = new QuestController(mockNotifier, cosmosQuestAgent);

// --- Health Check ---
v1Router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        'api-gateway': 'online',
        'database': 'connected'
      }
    }
  });
});

// --- Auth Routes (Public) ---
v1Router.post('/auth/register', authController.register);
v1Router.post('/auth/login', authController.login);

// --- Conversation Routes (Authenticated) ---
v1Router.post('/conversations/messages', authMiddleware, conversationController.postMessage);
v1Router.post('/conversations/messages/stream', authMiddleware, conversationController.postMessageStream);
v1Router.post('/conversations/upload', authMiddleware, uploadSingle, handleUploadError, conversationController.uploadFile);
v1Router.post('/conversations/new-chat', authMiddleware, conversationController.startNewChat);
v1Router.post('/conversations/:conversationId/end', authMiddleware, conversationController.endConversation);
v1Router.get('/conversations/proactive-greeting/:userId', authMiddleware, conversationController.getProactiveGreeting.bind(conversationController));
v1Router.get('/conversations', authMiddleware, conversationController.getConversationHistory);
v1Router.get('/conversations/:conversationId', authMiddleware, conversationController.getConversation);

// --- Session Routes (Authenticated) ---
v1Router.get('/sessions', authMiddleware, conversationController.getSessions);
v1Router.get('/sessions/:sessionId', authMiddleware, conversationController.getSessionInfo);



// --- Card Routes (Authenticated) ---
v1Router.get('/cards', authMiddleware, cardController.getCards);
v1Router.get('/cards/search', authMiddleware, cardController.searchCards);
v1Router.get('/cards/ids', authMiddleware, cardController.getAllCardIds);
v1Router.post('/cards/by-ids', authMiddleware, cardController.getCardsByIds);
v1Router.get('/cards/by-source/:entityId', authMiddleware, cardController.getCardBySourceEntity);
v1Router.get('/cards/dashboard/evolution', authMiddleware, cardController.getCardsByEvolutionStateDashboard);
v1Router.get('/cards/top-growth', authMiddleware, cardController.getTopGrowthCards);
v1Router.get('/cards/evolution/:state', authMiddleware, cardController.getCardsByEvolutionState);
v1Router.get('/cards/:cardId', authMiddleware, cardController.getCardDetails);
v1Router.get('/cards/:cardId/related', authMiddleware, cardController.getRelatedCards);
v1Router.put('/cards/:cardId/background', authMiddleware, cardController.updateCardBackground);

// --- User Routes (Authenticated) ---
v1Router.get('/users/me/profile', authMiddleware, userController.getUserProfile);
v1Router.get('/users/me/growth-profile', authMiddleware, userController.getGrowthProfile);
v1Router.get('/users/me/dashboard/growth-summary', authMiddleware, userController.getDashboardGrowthSummary);
v1Router.get('/users/:userId', authMiddleware, userController.getUserData);

// --- Dashboard Routes (Authenticated) ---
// Legacy dashboard routes (keeping for backward compatibility)
v1Router.get('/dashboard/summary', authMiddleware, userController.getDashboardGrowthSummary);
v1Router.get('/dashboard/insights', authMiddleware, userController.getRecentInsights);
v1Router.get('/dashboard/recent-events', authMiddleware, userController.getRecentActivity);
v1Router.get('/dashboard/data', authMiddleware, userController.getDashboardData);

// New dynamic dashboard routes
v1Router.use('/dashboard', dashboardRoutes);

// --- Graph Routes (Authenticated) --- V11.0: Real-time metrics from Neo4j source of truth
v1Router.get('/nodes/:nodeId/metrics', authMiddleware, graphController.getNodeMetrics);

// --- Node Details Routes (Authenticated) --- V11.0: Rich node information from PostgreSQL
v1Router.get('/nodes/:nodeId/details', authMiddleware, graphController.getNodeDetails);

// --- Graph Projection Routes (Authenticated) --- V11.0: 3D visualization data
v1Router.get('/graph-projection/latest', authMiddleware, graphController.getLatestGraphProjection.bind(graphController));

// --- Cosmos Query Routes (Authenticated) --- V11.0: Interactive spatial queries
v1Router.post('/cosmos/query', authMiddleware, graphController.processCosmosQuery.bind(graphController));

// --- Simple Entity Lookup (Authenticated) --- V11.0: Direct entity lookup by ID
v1Router.get('/entities/:entityId', authMiddleware, graphController.getEntityById.bind(graphController));

// --- Neo4j Query (Authenticated) --- V11.0: Direct Neo4j graph traversal
v1Router.post('/neo4j/query', authMiddleware, graphController.executeNeo4jQuery.bind(graphController));

// --- Media Routes (Authenticated) ---
v1Router.get('/media/search', authMiddleware, mediaController.searchMedia.bind(mediaController));
v1Router.get('/media/recommended', authMiddleware, mediaController.getRecommendedMedia.bind(mediaController));
v1Router.get('/media/popular/videos', authMiddleware, mediaController.getPopularVideos.bind(mediaController));
v1Router.get('/media/popular/photos', authMiddleware, mediaController.getPopularPhotos.bind(mediaController));
v1Router.get('/media/videos/:id', authMiddleware, mediaController.getVideoDetails.bind(mediaController));
v1Router.get('/media/photos/:id', authMiddleware, mediaController.getPhotoDetails.bind(mediaController));



// --- HRT Parameters Routes (Authenticated) ---
v1Router.post('/hrt/parameters', authMiddleware, hrtParametersController.saveParameters);
v1Router.get('/hrt/parameters/:userId', authMiddleware, hrtParametersController.loadParameters);
v1Router.post('/hrt/parameters/:userId/reset', authMiddleware, hrtParametersController.resetParameters);

// --- Embedding Routes (Authenticated) ---
v1Router.post('/embedding/generate', authMiddleware, embeddingController.generateEmbedding.bind(embeddingController));
v1Router.post('/embedding/batch', authMiddleware, embeddingController.generateBatchEmbeddings.bind(embeddingController));
v1Router.delete('/embedding/cache', authMiddleware, embeddingController.clearCache.bind(embeddingController));

// Agent routes
v1Router.use('/agent', createAgentRoutes(conversationController));

// Quest routes (initial minimal endpoint)
v1Router.use('/quest', createQuestRoutes(questController));

  // Notification routes removed - now handled by dedicated Socket.IO service

  return v1Router;
}