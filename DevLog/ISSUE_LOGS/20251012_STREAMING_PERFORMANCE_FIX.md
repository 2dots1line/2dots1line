# Streaming Performance Fix - October 12, 2025

## Issue Summary

Streaming chat responses would start successfully but develop 6+ minute gaps after ~1000 characters, eventually causing:
- Browser timeout (EPIPE errors)
- Connection drops
- "Load failed, please try again" error messages
- Failed responses not saved to database
- Dashboard/cards failing to load after disconnect

## Root Cause

**O(n²) Performance Degradation in Chunk Processing**

In `packages/tools/src/ai/LLMChatTool.ts` lines 411-477, the streaming chunk processor had catastrophic performance issues:

### The Problem:
```typescript
// OLD CODE (lines 421-456):
for await (const chunk of stream) {
  accumulatedText += chunkText;
  
  // PROBLEM 1: Regex on entire accumulated text (3000+ chars) every chunk
  const endMatch = currentResponseText.match(/^([^"]*(?:\\.[^"]*)*)"(\s*})/);
  
  // PROBLEM 2: Character-by-character fallback scanning ENTIRE text
  for (let i = 0; i < currentResponseText.length; i++) {
    // Check escapes, look ahead, etc - on 3000+ chars every chunk
  }
  
  // PROBLEM 3: Re-unescape all accumulated text every chunk
  const unescaped = currentResponseText.replace(/\\"/g, '"').replace(/\\n/g, '\n');
}
```

### Why It Failed:
1. **Exponential Complexity**: As response grew to 1000→2000→3000 chars, processing time grew quadratically
2. **Event Loop Blocking**: Heavy synchronous regex/parsing blocked Node.js event loop
3. **Keep-Alive Failure**: `setInterval` heartbeat couldn't fire (no "💓" logs during gaps)
4. **Browser Timeout**: After 2-5 minutes of silence, browser killed connection
5. **EPIPE Error**: Server tried to write to closed socket

### Key Insight from User:
The prompt template places `direct_response_text` as the **last field** in the JSON response. This means:
- Once we find the start of `direct_response_text`, we can stream everything that follows
- We only need to check **new chunks** for the end marker `"}`
- No need to repeatedly scan the entire accumulated text

## Solution Implemented

### Optimized Chunk Processing

**File**: `packages/tools/src/ai/LLMChatTool.ts` lines 411-462

```typescript
// NEW CODE: Only process NEW content
if (isRespondDirectlyDecision && inDirectResponseText) {
  const fullResponseText = accumulatedText.substring(directResponseTextStart);
  const alreadyProcessedLength = lastStreamedLength;
  
  // Extract ONLY the new content from this chunk
  const newRawContent = fullResponseText.substring(alreadyProcessedLength);
  
  if (newRawContent.length > 0) {
    // Check only NEW content for end marker (not entire accumulated text)
    const endMarkerIndex = newRawContent.lastIndexOf('"}');
    
    let contentToProcess = newRawContent;
    let isEndOfResponse = false;
    
    if (endMarkerIndex !== -1) {
      contentToProcess = newRawContent.substring(0, endMarkerIndex);
      isEndOfResponse = true;
      inDirectResponseText = false;
    }
    
    // Unescape only NEW content (not re-processing old content)
    const unescapedNewContent = contentToProcess
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\\\/g, '\\');
    
    if (unescapedNewContent.length > 0) {
      lastStreamedLength += contentToProcess.length;
      input.payload.onChunk!(unescapedNewContent);
    }
  }
}
```

### Performance Improvements:

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Regex matching | O(n) on full text | O(n) on new chunk only | ~100x faster at 3000 chars |
| Character scanning | O(n) on full text | Not needed | Eliminated |
| Unescaping | O(n) on full text | O(n) on new chunk only | ~100x faster at 3000 chars |
| Overall complexity | O(n²) | O(n) | Linear scaling |

### Why This Works:

1. **Incremental Processing**: Only processes new characters that arrived in this chunk
2. **Simple End Detection**: Uses `lastIndexOf('"}')` instead of complex regex
3. **No Re-scanning**: Never re-processes already-streamed content
4. **Event Loop Friendly**: Minimal CPU per chunk allows `setInterval` to fire
5. **Leverages Architecture**: Uses the fact that `direct_response_text` is last field

## Verification

### Before Fix:
```
20:15:37 - Chunk arrives (smooth)
20:15:38 - Chunk arrives (smooth)
20:15:39 - Chunk arrives (smooth)
20:15:40 - Chunk arrives (smooth)
20:15:42 - Last chunk before gap
[4-6 MINUTE GAP - NO LOGS AT ALL]
20:19:41 - EPIPE error (connection dead)
```

### After Fix (Expected):
```
Chunks arrive every 1-2 seconds
💓 Keep-alive heartbeat every 15s
No gaps >5 seconds
No EPIPE errors
Smooth streaming regardless of response length
```

## Testing

To verify the fix works:

1. **Send a long query** requiring >2000 character response
2. **Monitor logs** for:
   - Consistent chunk arrival (no multi-minute gaps)
   - Keep-alive heartbeats: `💓 ConversationController: Sent keep-alive heartbeat`
   - New log format: `🌊 LLMChatTool: ✅ Streamed clean response chunk (N chars)`
3. **Check frontend** for:
   - Smooth text appearance
   - No "Load failed" errors
   - Complete responses

## Remaining Work

While this fix solves the streaming performance issue, there are still improvements needed:

### 1. Keep-Alive Event Loop (Already Fixed)
The `setInterval` keep-alive is already implemented (lines 179-196 in conversation.controller.ts), but we should verify it fires now that chunk processing is fast.

### 2. Frontend Timeout Handling
**File**: `apps/web-app/src/services/chatService.ts`
- Add `AbortController` with 5-minute timeout
- Preserve partial responses on disconnect
- Add reconnection with resume

### 3. Database Persistence
**File**: `apps/api-gateway/src/controllers/conversation.controller.ts`
- Save partial responses even on error
- Add error state to `llm_interactions` table

### 4. Post-Disconnect Recovery
**Issue**: Dashboard/cards fail to load after streaming disconnect
- Add proper error boundaries
- Reset corrupted state
- Prevent blocking of subsequent requests

## Files Modified

1. `packages/tools/src/ai/LLMChatTool.ts` - Optimized chunk processing (lines 411-462)

## Related Documentation

- Previous timeout fix: `DevLog/ISSUE_LOGS/20251012_STREAMING_TIMEOUT_FIX.md`
- V11.0 Streaming Architecture: `DevLog/V11.0/`
- Response Time Plan: `DevLog/20251006ResponseTimeImprovementPlan.md`

## Impact

This fix eliminates the O(n²) bottleneck that was causing streaming to become unusable for long responses. Combined with the previous timeout configuration fixes, streaming should now work reliably for responses of any length.

