# Investigation: Streaming Error Patterns & Systematic Solutions

## Executive Summary

Analysis of recent streaming errors reveals **three distinct categories** of failures that require systematic solutions rather than symptom-specific fixes. The patterns show interconnected issues where fixing one symptom without addressing root causes creates new problems.

## Error Pattern Categories

### Pattern 1: External API Failures (Transient, Retryable)

**Symptoms:**
- `503 Service Unavailable: The model is overloaded`
- `Failed to parse stream` (GoogleGenerativeAIError)
- Multiple rapid failures with retries

**Evidence:**
```
2025-10-29T10:10:18: ❌ LLMChatTool - Error calling LLM API on attempt 1/2: 
  GoogleGenerativeAIFetchError: [503 Service Unavailable] The model is overloaded
  
2025-10-29T10:10:33: GoogleGenerativeAIError: [GoogleGenerativeAI Error]: Failed to parse stream
2025-10-29T10:10:33: ❌ LLMChatTool - All 2 attempts failed
```

**Root Cause:**
- Google Gemini API experiencing capacity issues
- Stream parsing failures when API returns malformed SSE responses
- Current retry logic treats "Failed to parse stream" as **non-retryable**

**Impact:**
- User sees: "Failed to process streaming message"
- Conversation fails entirely
- Poor user experience during API overload periods

### Pattern 2: Model Behavior Issues (Systematic, Preventable)

**Symptoms:**
- LLM includes "Here is the JSON requested:" in `direct_response_text` content
- JSON structure becomes malformed (missing closing quotes/braces)
- Model stops early (finish_reason: STOP) when JSON becomes invalid

**Evidence:**
```
2025-10-29T10:12:19: 🌊 LLMChatTool: ✅ Streamed clean response chunk (4 chars): "Here"
2025-10-29T10:12:19: 🌊 LLMChatTool: ✅ Streamed clean response chunk (23 chars): " is the JSON requested:"

2025-10-29T10:12:24: DialogueAgent - Direct JSON parsing failed: Expected property name or '}' in JSON at position 2
```

**Frequency:**
- Appears in multiple recent interactions (at least 3 instances)
- Occurs despite explicit prompt instructions to NOT include this phrase
- Happens during streaming when model is mid-generation

**Root Cause:**
1. **Prompt Instructions Not Strong Enough**: Model ignores "Do NOT include..." directive
2. **No Runtime Filtering**: Content filtering happens after streaming, not during
3. **JSON Mode Validation**: Gemini stops early when detecting invalid JSON (safety feature)

**Impact:**
- Incomplete responses streamed to user
- JSON parsing fails at backend
- User sees truncated content with confusing "Here is the JSON requested:" text

### Pattern 3: Retry Logic Gaps (Configurable, Fixable)

**Symptoms:**
- "Failed to parse stream" errors not retried
- Retries exhausted, all attempts fail
- No fallback mechanism when streaming completely fails

**Evidence:**
```typescript
// Current retry patterns in LLMRetryHandler.ts
const retryablePatterns = [
  /model.*overloaded/i,      // ✅ Covers 503 errors
  /service.*unavailable/i,   // ✅ Covers service issues
  /failed to parse stream/i  // ❌ NOT PRESENT - Missing!
];
```

**Root Cause:**
- `LLMRetryHandler` doesn't recognize "Failed to parse stream" as retryable
- Network-level stream parsing failures treated as permanent errors
- No differentiation between transient parsing errors vs. permanent issues

**Impact:**
- Legitimate transient failures treated as permanent
- Reduced system resilience during API instability
- Poor recovery from temporary network issues

## Interconnected Issues: Why Fixing One Symptom Causes Others

### Issue Chain Analysis

**Scenario 1: API Overload → Parse Failure → No Recovery**
1. API returns 503 (retryable) → System retries
2. Retry succeeds but returns malformed SSE → "Failed to parse stream"
3. Parse failure treated as permanent → No further retries
4. **Result**: User sees error even though retry could have worked

**Scenario 2: Model Generates Forbidden Phrase → JSON Breaks → Early Stop**
1. Model includes "Here is the JSON requested:" in content (model behavior)
2. JSON structure becomes invalid (no closing quote)
3. Gemini JSON mode detects invalid structure → Stops early (safety feature)
4. Streaming continues until end detected → Backend parsing fails
5. **Result**: User sees partial response with confusing content

**Scenario 3: Streaming Succeeds → Content Filtered → User Confusion**
1. Content streams successfully to frontend
2. Backend detects malformed JSON during final parse
3. Error message sent to user
4. **Result**: User already saw content, then gets error - confusing UX

## Systematic Solutions: Addressing Root Causes

### Solution 1: Enhanced Retry Logic (Pattern 1 & 3)

**Implementation:**
```typescript
// packages/core-utils/src/llm/LLMRetryHandler.ts
private static readonly DEFAULT_RETRYABLE_PATTERNS = [
  // ... existing patterns ...
  /failed to parse stream/i,        // ✅ NEW: Stream parsing failures
  /stream.*parse.*error/i,          // ✅ NEW: Generic stream errors
  /sse.*parse/i,                    // ✅ NEW: SSE parsing issues
];
```

**Rationale:**
- Stream parsing failures often transient (network issues, API quirks)
- Should be retried with backoff, like other transient errors
- Only treat as permanent after max retries exhausted

**Impact:**
- ✅ Improved recovery from transient API issues
- ✅ Better resilience during API instability
- ✅ Reduces "Failed to process streaming message" errors

### Solution 2: Real-Time Content Filtering (Pattern 2)

**Implementation:**
```typescript
// packages/tools/src/ai/LLMChatTool.ts - During streaming
if (unescapedNewContent.length > 0) {
  // NEW: Filter forbidden phrases in real-time
  const filteredContent = unescapedNewContent
    .replace(/Here is the JSON requested:/gi, '')
    .replace(/Here's the JSON:/gi, '')
    .replace(/Here is the JSON:/gi, '');
  
  if (filteredContent.length > 0 && filteredContent !== unescapedNewContent) {
    console.warn(`⚠️ Filtered forbidden phrase from streamed content`);
    // Optionally: Try to repair JSON by adding missing closing quote
  }
  
  input.payload.onChunk!(filteredContent);
}
```

**Rationale:**
- Prevents forbidden phrases from reaching frontend
- Catches issues during streaming, not after
- Allows JSON repair before model stops early

**Impact:**
- ✅ Prevents "Here is the JSON requested:" from appearing in UI
- ✅ Reduces JSON parsing failures
- ✅ Better user experience (clean content stream)

### Solution 3: Prompt Reinforcement (Pattern 2)

**Implementation:**
```yaml
# config/prompt_templates.yaml
⚠️ CRITICAL JSON STRUCTURE RULES:
- If you accidentally include "Here is the JSON requested:" or similar phrases,
  IMMEDIATELY stop and properly close the JSON:
  1. Add closing quote: "
  2. Add closing brace: }
  3. Do NOT continue generating after this phrase
  
CONSEQUENCE OF VIOLATION: The response will be rejected and you will need to regenerate.
```

**Rationale:**
- Explicit consequences for violations
- Self-correction instructions (repair steps)
- Reinforces importance with consequence statement

**Impact:**
- ✅ Reduces model-generated violations
- ✅ Provides recovery path if violation occurs
- ✅ Clearer instructions for model behavior

### Solution 4: Graceful Degradation (All Patterns)

**Implementation:**
```typescript
// services/dialogue-service/src/DialogueAgent.ts
private parseLLMResponse(llmResult: any, enableGrounding?: boolean): any {
  // ... existing parsing logic ...
  
  catch (e) {
    console.error('DialogueAgent - JSON parsing error:', e);
    
    // NEW: Extract partial response from streamed content
    const partialResponse = this.extractPartialResponseFromError(llmResult);
    if (partialResponse) {
      console.warn('DialogueAgent - Using partial response from streamed content');
      return partialResponse;
    }
    
    // Existing fallback...
  }
}

private extractPartialResponseFromError(llmResult: any): any | null {
  // Try to extract direct_response_text even from malformed JSON
  const rawText = llmResult.result.text || '';
  
  // Look for direct_response_text field and extract its value
  const match = rawText.match(/"direct_response_text"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
  if (match && match[1]) {
    return {
      decision: 'respond_directly',
      response_plan: { decision: 'respond_directly', key_phrases_for_retrieval: null },
      turn_context_package: { /* defaults */ },
      direct_response_text: match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
      ui_actions: []
    };
  }
  
  return null;
}
```

**Rationale:**
- When JSON parsing fails but content was streamed, use streamed content
- Better than showing generic error after user saw partial response
- Maintains conversation flow even with parsing issues

**Impact:**
- ✅ Better UX when parsing fails (user gets content they saw)
- ✅ Reduces error message frequency
- ✅ Maintains conversation continuity

## Implementation Priority

### Phase 1: Quick Wins (High Impact, Low Risk)
1. ✅ **Add "Failed to parse stream" to retryable patterns** (30 min)
2. ✅ **Real-time content filtering during streaming** (1 hour)

### Phase 2: Medium-Term (Moderate Impact, Low Risk)
3. ✅ **Prompt reinforcement with consequences** (30 min)
4. ✅ **Enhanced error logging for pattern detection** (1 hour)

### Phase 3: Long-Term (High Impact, Moderate Risk)
5. ✅ **Graceful degradation with partial response extraction** (2 hours)
6. ✅ **Stream health monitoring and alerts** (3 hours)

## Metrics to Track

### Success Criteria
- **Reduced Error Rate**: "Failed to process streaming message" < 1% of requests
- **Improved Recovery**: >80% of transient errors successfully retried
- **Content Quality**: Zero instances of "Here is the JSON requested:" in user-visible content
- **User Experience**: Error messages appear <5% of streaming conversations

### Monitoring Queries
```sql
-- Error rate by type (last 24 hours)
SELECT 
  error_code,
  COUNT(*) as error_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM llm_interactions 
WHERE status = 'error' 
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_code;

-- Success rate after retries
SELECT 
  CASE 
    WHEN status = 'success' THEN 'Success'
    ELSE 'Failed'
  END as outcome,
  COUNT(*) as count
FROM llm_interactions 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY outcome;
```

## Conclusion

These streaming errors form **three interconnected patterns** that require systematic solutions:

1. **External API failures** need better retry logic
2. **Model behavior issues** need real-time filtering and prompt reinforcement  
3. **Retry gaps** need pattern recognition expansion

Fixing these systematically (rather than addressing individual symptoms) will:
- ✅ Improve overall system resilience
- ✅ Reduce user-facing errors
- ✅ Better handle API instability
- ✅ Maintain conversation quality

