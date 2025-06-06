import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router: Router = Router();
const authController = new AuthController();

// Authentication routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));

export { router as authRoutes }; 