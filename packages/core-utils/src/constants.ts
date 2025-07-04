/**
 * Shared constants for the 2dots1line V9.7 system
 */

// Redis key prefixes
export const REDIS_CONVERSATION_HEARTBEAT_PREFIX = 'conversation:heartbeat:';
export const REDIS_CONVERSATION_TIMEOUT_PREFIX = 'conversation:timeout:';

// Queue names
export const INGESTION_QUEUE_NAME = 'ingestion-queue';

/**
 * Tunable parameters (timeouts, intervals, etc.) have been moved to:
 *   config/operational_parameters.json
 * Access them via the ConfigService.
 */ 