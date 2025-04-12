const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');
const fileProcessor = require('../utils/fileProcessor'); // Import file processor
const { PrismaClient } = require('@prisma/client'); // Import prisma
const prisma = new PrismaClient();
const vectorUtils = require('../models/vectorUtils'); // Import vector utils

// --- Use Memory Storage --- 
const storage = multer.memoryStorage();

// Configure file filter (keep existing)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // 'audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg', // Keep audio separate for now
    'application/pdf', 'text/plain', 'text/markdown',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents (PDF, DOCX, TXT, MD) are currently supported for analysis.'), false);
  }
};

// Configure upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // Increased limit to 15MB for larger files/images
  }
});

// All upload routes require authentication
router.use(authMiddleware.verifyToken);

// Upload single file & Process endpoint
router.post('/file', upload.single('file'), async (req, res) => {
  console.log('[DEBUG] /api/upload/file endpoint hit');
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!req.user || !req.user.user_id) {
        return res.status(401).json({ error: 'Authentication failed, user ID missing.' });
    }

    console.log(`[DEBUG] Processing file in memory: ${req.file.originalname}, Type: ${req.file.mimetype}, Size: ${req.file.size}`);

    // Process file content directly from buffer
    const fileProcessingResult = await fileProcessor.processFileContentFromBuffer(
        req.file.buffer,
        req.file.mimetype
    );

    console.log('[DEBUG] File processing result:', fileProcessingResult);

    if (fileProcessingResult.type === 'error' || fileProcessingResult.type === 'unsupported') {
      return res.status(400).json({
        error: `Failed to process file content: ${fileProcessingResult.error || 'Unsupported file type'}`,
        fileName: req.file.originalname
      });
    }

    // Determine interaction type based on processing result
    let interaction_type;
    let analysisText = fileProcessingResult.content;
    let analysisMetadata = {};

    if (req.file.mimetype.startsWith('image/')) {
        interaction_type = 'image_upload';
        analysisMetadata = { analysis_type: 'image_analysis', file_type: req.file.mimetype };
    } else {
        interaction_type = 'document_upload';
        analysisMetadata = { analysis_type: 'text_extraction', file_type: req.file.mimetype };
    }
    
    // --- Create Interaction Records --- 
    const sessionId = req.body.session_id || uuidv4(); // Get session ID from request body if provided
    const userId = req.user.user_id;
    let originalInteraction = null;
    let analysisInteraction = null;

    try {
      // 1. Create the original upload interaction
      originalInteraction = await prisma.interaction.create({
        data: {
          interaction_id: uuidv4(),
          user_id: userId,
          session_id: sessionId,
          interaction_type: interaction_type,
          raw_data: { // Store metadata, not buffer or path
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            // Optionally add user message if sent alongside file
            message: req.body.message || null 
          },
          metadata: { source: 'upload_endpoint' },
          // Mark as processed since analysis is done synchronously here
          processed_flag: true, 
          processing_notes: JSON.stringify({ 
              file_processing: fileProcessingResult // Store the result notes
          })
        }
      });
      console.log(`[DEBUG] Created original upload interaction: ${originalInteraction.interaction_id}`);

      // 2. Create the AI response interaction with the analysis
      if (analysisText) {
        let aiMessagePrefix = "";
        if (interaction_type === 'image_upload') {
            aiMessagePrefix = "Here's what I see in the image: ";
        } else if (interaction_type === 'document_upload') {
            aiMessagePrefix = "Based on the document you shared: ";
        }
        try {
          analysisInteraction = await prisma.interaction.create({
            data: {
              interaction_id: uuidv4(),
              user_id: userId,
              session_id: sessionId, 
              interaction_type: 'ai_response', 
              raw_data: { message: aiMessagePrefix + analysisText },
              metadata: { 
                source: 'file_analysis_result', 
                original_interaction_id: originalInteraction.interaction_id 
              },
              processed_flag: true 
            }
          });
          console.log(`[SUCCESS][Upload] Saved file analysis result as new AI interaction: ${analysisInteraction.interaction_id}`);
          
          // 3. Trigger vector embedding (only after successful save)
          if (analysisText.length >= 3) {
            vectorUtils.processTextForVector(
              originalInteraction.interaction_id, // Link vector to original upload interaction
              userId, 
              analysisText, 
              originalInteraction.timestamp, 
              interaction_type, 
              analysisMetadata
            ).then(vectorResult => {
              console.log(`[DEBUG] Async vector processing completed for ${originalInteraction.interaction_id}:`, vectorResult);
            }).catch(vectorError => {
              console.error(`[ERROR] Async vector processing failed for ${originalInteraction.interaction_id}:`, vectorError);
            });
          }
        } catch (analysisSaveError) {
          console.error('[ERROR][Upload] FAILED to save file analysis interaction:', analysisSaveError);
          // Do NOT proceed to return success if saving failed.
          // We might want to return a specific error code/message here.
          // For now, let the outer catch handle it or return a generic server error.
          throw analysisSaveError; // Rethrow to be caught by the main try-catch
        }
      }
      
      // Return successful analysis to frontend (ONLY if all DB writes succeeded)
      res.status(200).json({
        message: 'File processed and interactions saved successfully',
        analysis: analysisText, 
        originalInteractionId: originalInteraction.interaction_id,
        analysisInteractionId: analysisInteraction ? analysisInteraction.interaction_id : null
      });

    } catch (dbError) {
        console.error('[ERROR] Error saving interaction records during upload processing:', dbError);
        return res.status(500).json({ error: 'Failed to save interaction records after processing file.' });
    }

  } catch (error) {
    // Handle Multer errors (e.g., file too large, invalid type)
    if (error instanceof multer.MulterError) {
        console.error('Multer error during upload:', error);
        return res.status(400).json({ error: `Upload error: ${error.message}` });
    } else if (error.message.includes('Invalid file type')) {
        console.error('File type error during upload:', error);
        return res.status(400).json({ error: error.message });
    } 
    // Handle other errors
    console.error('Error processing upload:', error);
    res.status(500).json({ error: `Failed to process upload: ${error.message}` });
  }
});

// Audio transcription endpoint using browser Speech Recognition
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    
    // Audio transcription is now handled client-side with the Web Speech API
    // We just store the audio file and return the URL
    
    res.status(200).json({
      message: 'Audio received successfully',
      note: 'Audio transcription is now handled directly in the browser using Web Speech API',
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        url: `/uploads/${req.user.user_id}/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Error handling audio:', error);
    res.status(500).json({ error: 'Failed to process audio' });
  }
});

module.exports = router; 