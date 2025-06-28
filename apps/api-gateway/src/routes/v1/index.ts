import { Router, type IRouter } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { uploadSingle, handleUploadError } from '../../middleware/upload.middleware';

// Import all V9.7 controllers
import { AuthController } from '../../controllers/auth.controller';
import { ConversationController } from '../../controllers/conversation.controller';
import { CardController } from '../../controllers/card.controller';
import { UserController } from '../../controllers/user.controller';

const v1Router: IRouter = Router();

// Instantiate controllers
const authController = new AuthController();
const conversationController = new ConversationController();
const cardController = new CardController();
const userController = new UserController();

// --- Auth Routes (Public) ---
v1Router.post('/auth/register', authController.register);
v1Router.post('/auth/login', authController.login);

// --- Conversation Routes (Authenticated) ---
v1Router.post('/conversations/messages', authMiddleware, conversationController.postMessage);
v1Router.post('/conversations/upload', authMiddleware, uploadSingle, handleUploadError, conversationController.uploadFile);

// --- Card Routes (Authenticated) ---
v1Router.get('/cards', authMiddleware, cardController.getCards);
v1Router.get('/cards/by-source/:entityId', authMiddleware, cardController.getCardBySourceEntity);
v1Router.get('/cards/dashboard/evolution', authMiddleware, cardController.getCardsByEvolutionStateDashboard);
v1Router.get('/cards/top-growth', authMiddleware, cardController.getTopGrowthCards);
v1Router.get('/cards/evolution/:state', authMiddleware, cardController.getCardsByEvolutionState);
v1Router.get('/cards/:cardId', authMiddleware, cardController.getCardDetails);

// --- User Routes (Authenticated) ---
v1Router.get('/users/me/profile', authMiddleware, userController.getUserProfile);
v1Router.get('/users/me/growth-profile', authMiddleware, userController.getGrowthProfile);
v1Router.get('/users/me/dashboard/growth-summary', authMiddleware, userController.getDashboardGrowthSummary);

// --- Graph Routes (Authenticated) ---
v1Router.get('/graph-projection/latest', authMiddleware, (req, res) => {
  // This controller logic will be built out to call a graph-data-service
  res.status(501).json({ message: 'Graph projection endpoint not yet implemented.' });
});

export default v1Router; 