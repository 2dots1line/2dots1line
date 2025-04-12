/**
 * Memory Broker
 * 
 * Handles communication between the conversation agent (Dot) and the Memory Manager
 * Serves as a central hub for memory-related operations, facilitating the flow
 * of information between components of the system.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Event tracking
const EVENT_LOG_DIR = path.join(__dirname, '../../logs/memory_events');
fs.ensureDirSync(EVENT_LOG_DIR);

/**
 * Initialize the memory broker
 */
async function initialize() {
  try {
    console.log('[INFO] Initializing memory broker...');
    
    // Ensure required directories exist
    fs.ensureDirSync(EVENT_LOG_DIR);
    
    // Future initialization steps would go here
    
    console.log('[INFO] Memory broker initialized successfully');
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to initialize memory broker:', error);
    return false;
  }
}

/**
 * Notify when raw data is processed
 * @param {Object} data - Information about the raw data processing
 */
async function notifyRawDataProcessing(data) {
  try {
    const eventData = {
      type: 'raw_data_processing',
      timestamp: new Date().toISOString(),
      ...data
    };
    
    await logMemoryEvent(eventData);
    
    // Here we would trigger any additional processing or notifications
    // needed for the Memory Manager based on raw data processing
    
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to notify raw data processing:', error);
    return false;
  }
}

/**
 * Notify when a semantic chunk is created
 * @param {Object} data - Information about the semantic chunk
 */
async function notifySemanticChunkCreation(data) {
  try {
    const eventData = {
      type: 'semantic_chunk_creation',
      timestamp: new Date().toISOString(),
      ...data
    };
    
    await logMemoryEvent(eventData);
    
    // Here we would notify the Memory Manager about new semantic chunks
    // and trigger any automatic processing needed
    
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to notify semantic chunk creation:', error);
    return false;
  }
}

/**
 * Notify when thought processing occurs
 * @param {Object} data - Information about the thought processing
 */
async function notifyThoughtProcessing(data) {
  try {
    const eventData = {
      type: 'thought_processing',
      timestamp: new Date().toISOString(),
      ...data
    };
    
    await logMemoryEvent(eventData);
    
    // Update metrics tracking for memory processing
    await updateMemoryProcessingMetrics(data.userId, {
      thoughtsProcessed: 1,
      thoughtsSkipped: data.status === 'skipped' ? 1 : 0
    });
    
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to notify thought processing:', error);
    return false;
  }
}

/**
 * Notify when a new thought is created
 * @param {Object} data - Information about the new thought
 */
async function notifyNewThought(data) {
  try {
    const eventData = {
      type: 'new_thought',
      timestamp: new Date().toISOString(),
      ...data
    };
    
    await logMemoryEvent(eventData);
    
    // Update metrics for successful thought creation
    await updateMemoryProcessingMetrics(data.userId, {
      thoughtsCreated: 1
    });
    
    // Here we would handle any actions needed when new thoughts are created
    // such as updating knowledge graphs, generating insights, etc.
    
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to notify new thought:', error);
    return false;
  }
}

/**
 * Get memory content for Dot agent based on query
 * @param {string} userId - User ID
 * @param {Object} query - Query parameters for memory retrieval
 * @returns {Promise<Object>} Memory data relevant to the query
 */
async function getMemoryForDot(userId, query) {
  try {
    console.log(`[DEBUG] Retrieving memory for Dot, userId=${userId}, query=${JSON.stringify(query)}`);
    
    // This would be implemented to retrieve relevant memory items
    // from all sources (thoughts, semantic chunks, knowledge graph)
    // based on the query parameters
    
    // For now, return a simplified dataset
    const relevantThoughts = await prisma.thought.findMany({
      where: {
        userId: userId,
        // Add additional filters based on query
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    // Simple summary generation
    const memorySummary = relevantThoughts.length > 0
      ? `Found ${relevantThoughts.length} relevant thoughts from the user's memory.`
      : 'No relevant memories found for this topic.';
    
    return {
      summary: memorySummary,
      thoughts: relevantThoughts.map(t => ({
        id: t.id,
        content: t.content,
        title: t.title,
        subjectType: t.subjectType,
        subjectName: t.subjectName,
        createdAt: t.createdAt
      })),
      recommendedTopics: generateRecommendedTopics(relevantThoughts)
    };
  } catch (error) {
    console.error('[ERROR] Failed to get memory for Dot:', error);
    return {
      summary: 'Error retrieving memory data.',
      thoughts: [],
      recommendedTopics: []
    };
  }
}

/**
 * Generate recommended topics from thoughts
 * @param {Array} thoughts - Array of thought objects
 * @returns {Array} Recommended topics
 */
function generateRecommendedTopics(thoughts) {
  // Extract subject types and names
  const subjects = thoughts
    .filter(t => t.subjectType && t.subjectName)
    .map(t => ({ type: t.subjectType, name: t.subjectName }));
  
  // Count frequency
  const subjectCounts = {};
  subjects.forEach(s => {
    const key = `${s.type}:${s.name}`;
    subjectCounts[key] = (subjectCounts[key] || 0) + 1;
  });
  
  // Sort by frequency and convert back to objects
  return Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => {
      const [type, name] = key.split(':');
      return { type, name, frequency: count };
    });
}

/**
 * Update memory processing metrics for a user
 * @param {string} userId - User ID
 * @param {Object} metrics - Metrics to update
 */
async function updateMemoryProcessingMetrics(userId, metrics) {
  try {
    // Get or create metrics record
    let userMetrics = await prisma.memoryMetrics.findUnique({
      where: { userId: userId }
    });
    
    if (!userMetrics) {
      // Create initial metrics record
      userMetrics = await prisma.memoryMetrics.create({
        data: {
          user: {
            connect: { user_id: userId }
          },
          rawDataProcessed: 0,
          chunksCreated: 0,
          thoughtsProcessed: 0,
          thoughtsCreated: 0,
          thoughtsSkipped: 0,
          lastUpdated: new Date()
        }
      });
    }
    
    // Update metrics
    await prisma.memoryMetrics.update({
      where: { userId: userId },
      data: {
        rawDataProcessed: metrics.rawDataProcessed ? userMetrics.rawDataProcessed + metrics.rawDataProcessed : userMetrics.rawDataProcessed,
        chunksCreated: metrics.chunksCreated ? userMetrics.chunksCreated + metrics.chunksCreated : userMetrics.chunksCreated,
        thoughtsProcessed: metrics.thoughtsProcessed ? userMetrics.thoughtsProcessed + metrics.thoughtsProcessed : userMetrics.thoughtsProcessed,
        thoughtsCreated: metrics.thoughtsCreated ? userMetrics.thoughtsCreated + metrics.thoughtsCreated : userMetrics.thoughtsCreated,
        thoughtsSkipped: metrics.thoughtsSkipped ? userMetrics.thoughtsSkipped + metrics.thoughtsSkipped : userMetrics.thoughtsSkipped,
        lastUpdated: new Date()
      }
    });
    
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to update memory metrics:', error);
    return false;
  }
}

/**
 * Log memory event to file for audit trail
 * @param {Object} eventData - Event data to log
 */
async function logMemoryEvent(eventData) {
  try {
    const logFile = path.join(EVENT_LOG_DIR, `memory_events_${new Date().toISOString().split('T')[0]}.jsonl`);
    
    // Append event to log file
    await fs.appendFile(
      logFile,
      JSON.stringify(eventData) + '\n'
    );
    
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to log memory event:', error);
    return false;
  }
}

module.exports = {
  initialize,
  notifyRawDataProcessing,
  notifySemanticChunkCreation,
  notifyThoughtProcessing,
  notifyNewThought,
  getMemoryForDot,
  updateMemoryProcessingMetrics
}; 