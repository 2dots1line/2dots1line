import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { AgentController } from '../../controllers/agent.controller';

const agentRouter: ExpressRouter = Router();
const agentController = new AgentController();

agentRouter.post('/agent/chat', agentController.chat);
agentRouter.post('/agent/upload', agentController.upload);

export default agentRouter; 