const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const authMiddleware = require('../middleware/authMiddleware');

// All interaction routes are protected by authentication
router.use(authMiddleware.verifyToken);

// Create a new interaction
router.post('/', interactionController.createInteraction);

// Get all interactions for the authenticated user
router.get('/', interactionController.getUserInteractions);

// Get a specific interaction
router.get('/:id', interactionController.getInteraction);

// Update interaction processing status
router.patch('/:id/processing', interactionController.updateProcessingStatus);

// Delete an interaction
router.delete('/:id', interactionController.deleteInteraction);

// Process an interaction (for vector/graph DB)
router.post('/:id/process', interactionController.processInteraction);

// Reprocess interactions for knowledge graph
router.post('/reprocess-knowledge', interactionController.reprocessInteractionsForKnowledge);

// Reprocess interactions for thoughts extraction
router.post('/reprocess-thoughts', interactionController.reprocessInteractionsForThoughts);

module.exports = router; 