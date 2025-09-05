import { Router } from 'express';
import { NotificationController } from '../../controllers/notification.controller';
import { DatabaseService } from '@2dots1line/database';

const router: Router = Router();
const databaseService = DatabaseService.getInstance();
const notificationController = new NotificationController(databaseService);

// GET /api/v1/notifications/subscribe
router.get('/subscribe', notificationController.subscribe);

export { router as notificationRoutes };