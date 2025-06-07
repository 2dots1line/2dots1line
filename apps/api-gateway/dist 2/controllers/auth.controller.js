"use strict";
/**
 * Auth Controller - Authentication and Authorization
 * Handles user registration, login, logout, and token refresh
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("@2dots1line/database");
class AuthController {
    constructor() {
        /**
         * POST /api/auth/register
         * Register a new user
         */
        this.register = async (req, res) => {
            try {
                const { email, password, name } = req.body;
                // Validate input
                if (!email || !password) {
                    res.status(400).json({
                        success: false,
                        error: 'Email and password are required'
                    });
                    return;
                }
                if (password.length < 6) {
                    res.status(400).json({
                        success: false,
                        error: 'Password must be at least 6 characters long'
                    });
                    return;
                }
                // Check if user already exists
                const existingUser = await this.databaseService.prisma.user.findUnique({
                    where: { email: email.toLowerCase() }
                });
                if (existingUser) {
                    res.status(409).json({
                        success: false,
                        error: 'User with this email already exists'
                    });
                    return;
                }
                // Hash password
                const saltRounds = 12;
                const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
                // Create user
                const newUser = await this.databaseService.prisma.user.create({
                    data: {
                        email: email.toLowerCase(),
                        hashed_password: hashedPassword,
                        name: name || null,
                        region: 'us',
                        timezone: 'UTC',
                        language_preference: 'en',
                        account_status: 'active'
                    }
                });
                // Generate JWT token
                const token = jsonwebtoken_1.default.sign({
                    userId: newUser.user_id,
                    email: newUser.email
                }, this.jwtSecret, { expiresIn: '7d' });
                // Return user data (without password) and token
                const userResponse = {
                    user_id: newUser.user_id,
                    email: newUser.email,
                    name: newUser.name,
                    region: newUser.region,
                    timezone: newUser.timezone,
                    language_preference: newUser.language_preference,
                    profile_picture_url: newUser.profile_picture_url,
                    created_at: newUser.created_at.toISOString(),
                    last_active_at: newUser.last_active_at?.toISOString(),
                    account_status: newUser.account_status,
                    growth_profile: newUser.growth_profile
                };
                res.status(201).json({
                    success: true,
                    data: {
                        user: userResponse,
                        token
                    },
                    message: 'User registered successfully'
                });
            }
            catch (error) {
                console.error('Error in register:', error);
                res.status(500).json({
                    success: false,
                    error: 'Registration failed. Please try again.'
                });
            }
        };
        /**
         * POST /api/auth/login
         * Authenticate user and return JWT token
         */
        this.login = async (req, res) => {
            console.log('AuthController.login called with body:', req.body);
            try {
                const { email, password } = req.body;
                // Validate input
                if (!email || !password) {
                    res.status(400).json({
                        success: false,
                        error: 'Email and password are required'
                    });
                    return;
                }
                // Find user
                const user = await this.databaseService.prisma.user.findUnique({
                    where: { email: email.toLowerCase() }
                });
                if (!user || !user.hashed_password) {
                    res.status(401).json({
                        success: false,
                        error: 'Invalid email or password'
                    });
                    return;
                }
                // Verify password
                const isPasswordValid = await bcryptjs_1.default.compare(password, user.hashed_password);
                if (!isPasswordValid) {
                    res.status(401).json({
                        success: false,
                        error: 'Invalid email or password'
                    });
                    return;
                }
                // Update last active timestamp
                await this.databaseService.prisma.user.update({
                    where: { user_id: user.user_id },
                    data: { last_active_at: new Date() }
                });
                // Generate JWT token
                const token = jsonwebtoken_1.default.sign({
                    userId: user.user_id,
                    email: user.email
                }, this.jwtSecret, { expiresIn: '7d' });
                // Return user data (without password) and token
                const userResponse = {
                    user_id: user.user_id,
                    email: user.email,
                    name: user.name,
                    region: user.region,
                    timezone: user.timezone,
                    language_preference: user.language_preference,
                    profile_picture_url: user.profile_picture_url,
                    created_at: user.created_at.toISOString(),
                    last_active_at: new Date().toISOString(),
                    account_status: user.account_status,
                    growth_profile: user.growth_profile
                };
                res.status(200).json({
                    success: true,
                    data: {
                        user: userResponse,
                        token
                    },
                    message: 'Login successful'
                });
            }
            catch (error) {
                console.error('Error in login:', error);
                res.status(500).json({
                    success: false,
                    error: 'Login failed. Please try again.'
                });
            }
        };
        /**
         * POST /api/auth/logout
         * Logout user and invalidate token
         */
        this.logout = async (req, res) => {
            try {
                // In a more sophisticated implementation, you would:
                // 1. Add the token to a blacklist
                // 2. Remove any active sessions from the database
                // For now, we'll just return success since JWT logout is handled client-side
                res.status(200).json({
                    success: true,
                    message: 'Logout successful'
                });
            }
            catch (error) {
                console.error('Error in logout:', error);
                res.status(500).json({
                    success: false,
                    error: 'Logout failed'
                });
            }
        };
        /**
         * POST /api/auth/refresh
         * Refresh JWT token
         */
        this.refreshToken = async (req, res) => {
            try {
                const { token } = req.body;
                if (!token) {
                    res.status(400).json({
                        success: false,
                        error: 'Token is required'
                    });
                    return;
                }
                // Verify the existing token
                const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
                // Find user to ensure they still exist
                const user = await this.databaseService.prisma.user.findUnique({
                    where: { user_id: decoded.userId }
                });
                if (!user) {
                    res.status(401).json({
                        success: false,
                        error: 'User not found'
                    });
                    return;
                }
                // Generate new token
                const newToken = jsonwebtoken_1.default.sign({
                    userId: user.user_id,
                    email: user.email
                }, this.jwtSecret, { expiresIn: '7d' });
                res.status(200).json({
                    success: true,
                    data: {
                        token: newToken
                    },
                    message: 'Token refreshed successfully'
                });
            }
            catch (error) {
                console.error('Error in refreshToken:', error);
                res.status(401).json({
                    success: false,
                    error: 'Invalid or expired token'
                });
            }
        };
        this.databaseService = new database_1.DatabaseService();
        this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map