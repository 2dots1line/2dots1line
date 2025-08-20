/**
 * Types related to system entities like Jobs and Metrics
 */

/**
 * Represents an agent processing job
 */
export interface TAgentProcessingJob {
  /** Unique identifier for the job (UUID) */
  job_id: string;
  /** Name of the queue the job belongs to */
  queue_name: string;
  /** Name of the agent responsible for the job */
  agent_name: string;
  /** Job payload (JSON object) */
  payload?: Record<string, unknown> | null;
  /** Current status of the job ('pending', 'processing', 'completed', 'failed', 'retrying') */
  status: string;
  /** Job priority */
  priority: number;
  /** Number of attempts made */
  attempts: number;
  /** Maximum number of attempts allowed */
  max_attempts: number;
  /** Error message if the job failed */
  last_error?: string | null;
  /** Result of the job if completed successfully (JSON object) */
  result?: Record<string, unknown> | null;
  /** Timestamp when the job was created */
  created_at: Date;
  /** Timestamp when the job was last updated */
  updated_at: Date;
  /** Timestamp when the job completed */
  completed_at?: Date | null;
  /** Identifier of the worker instance that processed the job */
  processing_node_id?: string | null;
  /** Timestamp until which the job is locked for processing */
  lock_until?: Date | null;
}

/**
 * Represents a system metric record
 */
export interface TSystemMetric {
  /** Unique identifier for the metric record (UUID) */
  metric_id: string;
  /** Name of the metric (e.g., 'api_latency', 'queue_depth') */
  metric_name: string;
  /** Value of the metric */
  metric_value: number;
  /** Dimensions to slice the metric by (JSON object, e.g., {region: 'us', agent: 'Ingestion'}) */
  dimension?: Record<string, string | number | boolean> | null;
  /** Timestamp of the metric measurement */
  timestamp: Date;
  /** Additional metadata (JSON object) */
  metadata?: Record<string, unknown> | null;
}

/**
 * Represents a user activity log entry
 */
export interface TUserActivityLog {
  /** Unique identifier for the log entry (UUID) */
  log_id: string;
  /** ID of the user */
  user_id: string;
  /** Type of activity ('login', 'journal_entry', 'chat', 'search') */
  activity_type: string;
  /** Timestamp of the activity */
  timestamp: Date;
  /** Activity-specific details (JSON object) */
  details?: Record<string, unknown> | null;
  /** Information about the client used (JSON object) */
  client_info?: Record<string, unknown> | null;
} 