import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';

const v1UserRouter = Router();
const authController = new AuthController();
const userController = new UserController();

// Auth routes
v1UserRouter.post('/auth/register', authController.register);
v1UserRouter.post('/auth/login', authController.login);

// User routes
v1UserRouter.get('/users/:userId/profile', userController.getUserProfile);

export default v1UserRouter; 