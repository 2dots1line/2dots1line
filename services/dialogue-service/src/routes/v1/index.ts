import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';

const agentRouter = Router();
const agentController = new AgentController();

agentRouter.post('/agent/chat', agentController.chat);

export default agentRouter; 