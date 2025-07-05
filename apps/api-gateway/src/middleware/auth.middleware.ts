import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔍 Auth Debug - Authorization header:', authHeader ? `"${authHeader.substring(0, 20)}..."` : 'MISSING');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth Debug - No Bearer token found');
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔍 Auth Debug - Extracted token length:', token.length);
    
    // Development mode - allow special dev token
    if (NODE_ENV === 'development' && token === 'dev-token') {
      console.log('🔧 Auth Debug - Development mode dev-token accepted');
      req.user = {
        id: 'dev-user-123',
        username: 'developer',
        email: 'dev@example.com'
      };
      return next();
    }

    // Check if it's a custom token format (token_<userId>_<timestamp>)
    if (token.startsWith('token_')) {
      console.log('🔍 Auth Debug - Custom token format detected');
      const parts = token.split('_');
      if (parts.length >= 2 && parts[0] === 'token') {
        const userId = parts[1];
        console.log('✅ Auth Debug - Custom token validated for user:', userId);
        
        req.user = {
          id: userId,
          username: 'user', // Basic username for custom tokens
          email: 'user@example.com' // Basic email for custom tokens
        };
        
        return next();
      } else {
        console.log('❌ Auth Debug - Invalid custom token format');
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid token format' 
        });
      }
    }

    // Try JWT token verification
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      console.log('✅ Auth Debug - JWT verified successfully for user:', decoded.userId);
      
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.email.split('@')[0] // Use email prefix as username
      };
      
      return next();
    } catch (jwtError) {
      console.error('❌ Auth Debug - JWT verification failed:', jwtError instanceof Error ? jwtError.message : 'Unknown JWT error');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Auth middleware error type:', error instanceof Error ? error.constructor.name : typeof error);
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication error' 
    });
  }
}; 