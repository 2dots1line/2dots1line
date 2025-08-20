/**
 * Common API response structures
 */

/**
 * Standard success response structure
 */
export interface TApiResponseSuccess<T> {
  success: true;
  data: T;
  metadata?: {
    /** Time taken for the operation in milliseconds */
    processing_time_ms?: number;
    /** Pagination details if applicable */
    pagination?: {
      total_items: number;
      total_pages: number;
      current_page: number;
      page_size: number;
    };
    [key: string]: unknown;
  };
}

/**
 * Standard error response structure
 */
export interface TApiResponseError {
  success: false;
  error: {
    /** A machine-readable error code (e.g., 'INVALID_INPUT', 'NOT_FOUND') */
    code: string;
    /** A human-readable error message */
    message: string;
    /** Optional details about the error */
    details?: Record<string, unknown>;
    /** Optional unique ID for tracing the request */
    request_id?: string;
  };
}

/**
 * Union type for API responses
 */
export type TApiResponse<T> = TApiResponseSuccess<T> | TApiResponseError;

/**
 * Input structure for API requests requiring pagination
 */
export interface TPaginationInput {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
}

/**
 * Input structure for API requests requiring sorting
 */
export interface TSortInput {
  /** Field to sort by */
  sort_by?: string;
  /** Sort order ('asc' or 'desc') */
  sort_order?: 'asc' | 'desc';
} 