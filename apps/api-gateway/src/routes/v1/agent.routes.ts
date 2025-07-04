import { Router } from 'express';
import { ConversationController } from '../../controllers/conversation.controller';

export function createAgentRoutes(conversationController: ConversationController): Router {
  const router = Router();

  router.post('/chat', (req, res, next) => conversationController.handleChat(req, res, next));
  router.post('/start-conversation', (req, res, next) => conversationController.startConversation(req, res, next));
  router.get('/conversation/:id', (req, res, next) => conversationController.getConversation(req, res, next));
  
  return router;
} 