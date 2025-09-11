/**
 * LLMRetryHandler
 * Shared utility for handling LLM retry logic across all components
 * Based on DialogueAgent's proven retry implementation
 */

export interface LLMRetryConfig {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryablePatterns?: RegExp[];
  callType?: string; // For logging purposes (e.g., 'first', 'second', 'strategic', 'holistic')
}

export interface LLMRetryResult {
  status: 'success' | 'error';
  result?: any;
  error?: any;
}

export class LLMRetryHandler {
  private static readonly DEFAULT_RETRYABLE_PATTERNS = [
    /model.*overloaded/i,
    /service.*unavailable/i,
    /rate.*limit/i,
    /quota.*exceeded/i,
    /temporary/i,
    /try.*again.*later/i,
    /timeout/i,
    /network.*error/i,
    /connection.*error/i,
    /api.*error/i,
    /503/i, // Service Unavailable
    /429/i, // Too Many Requests
    /502/i, // Bad Gateway
    /504/i, // Gateway Timeout
    /500/i  // Internal Server Error
  ];

  /**
   * Execute LLM call with retry logic
   * Based on DialogueAgent's proven implementation
   */
  static async executeWithRetry<T = any>(
    llmTool: any,
    input: any,
    config: LLMRetryConfig = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      retryablePatterns = this.DEFAULT_RETRYABLE_PATTERNS,
      callType = 'LLM'
    } = config;

    let attempts = 0;
    
    while (attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call - Attempt ${attempts}/${maxAttempts}`);
        
        const llmResult = await llmTool.execute({ payload: input });
        
        if (llmResult.status === 'success' && llmResult.result?.text) {
          console.log(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call successful on attempt ${attempts}`);
          return llmResult;
        }
        
        // Check if this is a retryable error
        const errorMessage = llmResult.error?.message || 'Unknown error';
        if (attempts < maxAttempts && this.isRetryableError(errorMessage, retryablePatterns)) {
          console.log(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call - Retryable error detected: ${errorMessage}`);
          console.log(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call - Attempting to switch to fallback model...`);
          
          try {
            // Force reinitialization to try a different model
            if ((llmTool as any).forceReinitialize) {
              (llmTool as any).forceReinitialize();
              console.log(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call - Switched to fallback model`);
            }
            
            // Add exponential backoff delay before retrying
            const delay = Math.min(baseDelay * Math.pow(2, attempts - 1), maxDelay);
            console.log(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call - Waiting ${delay}ms before retry...`);
            await this.delay(delay);
            
            continue; // Try again with the new model
          } catch (modelSwitchError) {
            console.error(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call - Failed to switch to fallback model:`, modelSwitchError);
            // Continue with the next attempt
          }
        } else {
          // If not retryable or all attempts exhausted, break out of retry loop
          console.error(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call - Non-retryable error or max attempts reached: ${errorMessage}`);
          throw new Error(`LLM call failed: ${errorMessage}`);
        }
      } catch (error) {
        console.error(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call - Unexpected error on attempt ${attempts}:`, error);
        
        if (attempts < maxAttempts && this.isRetryableError(error, retryablePatterns)) {
          console.log(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call - Retryable error, attempting retry...`);
          
          try {
            // Force reinitialization to try a different model
            if ((llmTool as any).forceReinitialize) {
              (llmTool as any).forceReinitialize();
              console.log(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call - Switched to fallback model after unexpected error`);
            }
            
            // Add exponential backoff delay before retrying
            const delay = Math.min(baseDelay * Math.pow(2, attempts - 1), maxDelay);
            console.log(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call - Waiting ${delay}ms before retry...`);
            await this.delay(delay);
            
            continue; // Try again with the new model
          } catch (modelSwitchError) {
            console.error(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call - Failed to switch to fallback model:`, modelSwitchError);
          }
        } else {
          // If not retryable or all attempts exhausted, re-throw the error
          throw error;
        }
      }
    }

    // If all attempts fail, throw the last error
    console.error(`[LLMRetryHandler] ${callType.toUpperCase()} LLM call - All ${maxAttempts} attempts failed`);
    throw new Error(`Failed to get LLM response after ${maxAttempts} attempts. The AI service may be temporarily overloaded. Please try again in a moment.`);
  }

  /**
   * Check if an error is retryable
   * Based on DialogueAgent's proven error classification
   */
  private static isRetryableError(error: any, patterns: RegExp[]): boolean {
    if (!error) return false;
    
    const errorMessage = (typeof error === 'string') ? error : (error.message || error.toString() || '');
    return patterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Delay utility for exponential backoff
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
