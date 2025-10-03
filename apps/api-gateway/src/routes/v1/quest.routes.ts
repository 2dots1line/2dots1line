import { Router } from 'express';
import { QuestController } from '../../controllers/quest.controller';

export function createQuestRoutes(questController: QuestController): Router {
  const router = Router();
  router.post('/process', (req, res, next) => questController.processQuest(req, res, next));
  return router;
}


