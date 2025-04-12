const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Signup route
router.post('/signup', authController.signup);

// Login route
router.post('/login', authController.login);

// Logout route (requires authentication)
router.post('/logout', authMiddleware.verifyToken, authController.logout);

// Test protected route
router.get('/protected', authMiddleware.verifyToken, (req, res) => {
  res.status(200).json({ 
    message: 'You have access to this protected route', 
    user: req.user 
  });
});

// Get user profile (protected route)
router.get('/profile', authMiddleware.verifyToken, authController.getProfile);

module.exports = router; 