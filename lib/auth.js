import jwt from 'jsonwebtoken';

// Secret key for JWT
// In production, this should be a strong, environment-specific secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Authentication middleware for API routes
 * Verifies JWT token from Authorization header and attaches user data to request
 */
export function authenticateToken(handler) {
  return async (req, res) => {
    try {
      // Get the auth header
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify the token
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ error: 'Invalid or expired token' });
        }

        // Attach user data to request
        req.user = user;
      });

      // Call the original handler
      return handler(req, res);
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ error: 'Authentication failed', details: error.message });
    }
  };
}

/**
 * Utility function to check if user has required role
 */
export function hasRole(req, ...allowedRoles) {
  return req.user && allowedRoles.includes(req.user.role);
} 