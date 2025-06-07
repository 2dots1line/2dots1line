/**
 * Auth Controller - Authentication and Authorization
 * Handles user registration, login, logout, and token refresh
 */
import { Request, Response } from 'express';
export declare class AuthController {
    private databaseService;
    private jwtSecret;
    constructor();
    /**
     * POST /api/auth/register
     * Register a new user
     */
    register: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/auth/login
     * Authenticate user and return JWT token
     */
    login: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/auth/logout
     * Logout user and invalidate token
     */
    logout: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/auth/refresh
     * Refresh JWT token
     */
    refreshToken: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map