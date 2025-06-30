import { Router, IRouter } from 'express';
import { AuthController, UserController } from '../../controllers';

const v1UserRouter: IRouter = Router();

// Instantiate controllers
const authController = new AuthController();
const userController = new UserController();

// Auth routes
v1UserRouter.post('/auth/register', authController.register);
v1UserRouter.post('/auth/login', authController.login);

// User profile routes
v1UserRouter.get('/users/:userId/profile', userController.getUserProfile);

export default v1UserRouter;
