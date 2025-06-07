import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

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
    console.log('🔍 Auth Debug - Token parts count:', token.split('.').length);
    console.log('🔍 Auth Debug - Token starts with:', token.substring(0, 20));

    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Internal server error' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('✅ Auth Debug - Token verified successfully, userId:', decoded.userId);
    
    req.user = {
      id: decoded.userId,
      username: decoded.username || decoded.email,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Auth middleware error type:', error instanceof Error ? error.constructor.name : typeof error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error during authentication' 
    });
  }
}; 