import { Request, Response, NextFunction } from 'express';

const NODE_ENV = process.env.NODE_ENV || 'development';

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

    // Development mode - allow any token for now (TODO: implement proper JWT verification)
    if (NODE_ENV === 'development') {
      console.log('🔧 Auth Debug - Development mode - allowing any token');
      req.user = {
        id: token.substring(0, 8) || 'unknown-user',
        username: 'dev-user',
        email: 'dev@example.com'
      };
      return next();
    }

    // Production mode - reject tokens since JWT verification is not implemented
    console.error('❌ Auth middleware error: JWT verification not implemented for production');
    return res.status(501).json({ 
      success: false, 
      error: 'Authentication not implemented for production environment' 
    });
  } catch (error) {
    console.error('❌ Auth middleware error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Auth middleware error type:', error instanceof Error ? error.constructor.name : typeof error);
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication error' 
    });
  }
}; 