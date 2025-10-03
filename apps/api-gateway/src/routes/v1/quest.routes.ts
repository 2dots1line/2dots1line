import { Router } from 'express';
import { QuestController } from '../../controllers/quest.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

export function createQuestRoutes(questController: QuestController): Router {
  const router = Router();
  router.post('/process', authMiddleware, (req, res, next) => questController.processQuest(req, res, next));
  return router;
}


