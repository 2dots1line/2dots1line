# Streaming Timeout Fix - October 12, 2025

## Issue Summary

User reported two critical issues:
1. **LLM streaming responses getting cut off mid-sentence** - text would stop appearing while "Loading your cosmic journey..." spinner continues
2. **Screen becomes unresponsive after page refresh** - Opening modal hangs indefinitely

## Root Cause Analysis

### Issue #1: Streaming Cut-offs

The streaming responses were being terminated prematurely due to multiple timeout-related issues:

1. **No SSE Keep-Alive Mechanism**
   - SSE streams require periodic data to keep connections alive
   - Long pauses during LLM processing (observed 30-60 seconds between chunks) exceeded default timeouts
   - Both browser and proxy timeouts would kill connections during silence

2. **Default Node.js HTTP Timeout**
   - Node.js HTTP server default timeout: 2 minutes (120,000ms)
   - LLM responses can take longer, especially for complex queries
   - No explicit timeout configuration for streaming endpoints

3. **Missing Socket Configuration**
   - No TCP keep-alive enabled
   - Nagle's algorithm causing unnecessary buffering
   - No timeout override per request

4. **LLM Performance Issues**
   - Logs showed massive gaps between streaming chunks (35-62 seconds)
   - Likely caused by:
     - Large context windows
     - Complex reasoning (JSON output with multiple fields)
     - Model latency variations

### Issue #2: Unresponsive Screen on Refresh

The Opening modal (Dashboard) makes 5 parallel API requests:
```typescript
await Promise.all([
  dashboardService.getDashboardData(),
  dashboardService.getDynamicDashboard(),
  dashboardService.getDashboardConfig(),
  dashboardService.getProactiveGreeting(),
  dashboardService.getUserMetrics()
]);
```

If any of these requests hang or fail without proper timeout handling, the entire dashboard loading is blocked.

**Note:** After investigation, the proactive greeting endpoint is NOT making LLM calls (it just queries the database), so the hang is likely from:
- Network issues
- Database query timeouts
- Race conditions in parallel Promise.all()
- Missing error boundaries in React components

## Solutions Implemented

### 1. SSE Keep-Alive Heartbeat (apps/api-gateway/src/controllers/conversation.controller.ts)

Added periodic heartbeat comments to keep connection alive:

```typescript
// Send a comment (ignored by SSE parsers) every 15 seconds to keep connection alive
const keepAliveInterval = setInterval(() => {
  if (!res.writableEnded) {
    res.write(`: keepalive ${Date.now()}\n\n`);
    console.log(`💓 ConversationController: Sent keep-alive heartbeat`);
  }
}, 15000); // 15 seconds

// Cleanup function to clear keep-alive when stream ends
const cleanup = () => {
  clearInterval(keepAliveInterval);
  console.log(`🧹 ConversationController: Cleaned up keep-alive interval`);
};

// Handle client disconnect
req.on('close', () => {
  console.log(`🔌 ConversationController: Client disconnected, cleaning up`);
  cleanup();
});
```

### 2. Socket-Level Timeout Configuration

Disabled request timeout and enabled TCP keep-alive:

```typescript
// CRITICAL FIX: Disable all timeouts for SSE streaming
req.socket.setTimeout(0); // Disable request timeout
req.socket.setKeepAlive(true, 30000); // Enable TCP keep-alive every 30s
req.socket.setNoDelay(true); // Disable Nagle's algorithm for immediate chunk delivery
```

### 3. Enhanced SSE Headers

Added proxy-friendly headers:

```typescript
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Cache-Control',
  'X-Accel-Buffering': 'no' // Disable nginx buffering if behind proxy
});
```

### 4. Server-Level Timeout Configuration (apps/api-gateway/src/server.ts)

Configured HTTP server timeouts globally:

```typescript
// CRITICAL FIX: Configure server timeouts for long-running SSE connections
// Default Node.js timeout is 2 minutes (120000ms), which is too short for LLM streaming
server.timeout = 0; // Disable timeout for SSE endpoints (they handle their own keep-alive)
server.keepAliveTimeout = 65000; // Keep TCP connections alive for 65s (longer than typical load balancer timeout of 60s)
server.headersTimeout = 70000; // Wait up to 70s for complete headers (must be > keepAliveTimeout)

console.log(`⚙️  Server timeout configuration:
  - timeout: ${server.timeout}ms (0 = disabled for SSE)
  - keepAliveTimeout: ${server.keepAliveTimeout}ms
  - headersTimeout: ${server.headersTimeout}ms`);

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Handle connection errors
server.on('clientError', (error, socket) => {
  console.error('❌ Client error:', error);
  if (socket.writable) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  }
});
```

### 5. Enhanced Error Handling

Improved error recovery for disconnected clients:

```typescript
// Call the streaming DialogueAgent
let agentResult;
try {
  agentResult = await this.dialogueAgent.processTurnStreaming({
    // ... streaming configuration
  });
} finally {
  // Always clean up keep-alive, whether processing succeeded or failed
  cleanup();
}

// Enhanced error handling in catch block
try {
  if (!res.writableEnded) {
    if (!res.headersSent) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        // ... headers
      });
    }
    res.write(`data: ${JSON.stringify({ 
      type: 'error',
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Failed to process streaming message' 
      }
    })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'stream_end' })}\n\n`);
    res.end();
  }
} catch (writeError) {
  console.error('❌ ConversationController.postMessageStream - Failed to send error to client:', writeError);
}
```

## Verification

After implementing these changes and rebuilding:

```bash
pnpm --filter @2dots1line/api-gateway build
pm2 restart api-gateway
```

Logs confirm the new configuration is active:

```
2025-10-11T20:14:40: ⚙️  Server timeout configuration:
      - timeout: 0ms (0 = disabled for SSE)
      - keepAliveTimeout: 65000ms
      - headersTimeout: 70000ms
2025-10-11T20:14:40: [API Gateway] Server is running on port 3001
```

## Expected Behavior After Fix

### Streaming Chat
- ✅ **No more premature disconnections** - Keep-alive heartbeat every 15 seconds prevents timeout
- ✅ **Handles slow LLM responses** - Server timeout disabled, relying on keep-alive mechanism
- ✅ **Faster chunk delivery** - TCP_NODELAY enabled for immediate transmission
- ✅ **Graceful cleanup** - Proper resource cleanup on disconnect or error

### Dashboard Loading
- ⚠️ **Still needs investigation** - While timeout configuration helps, the root cause of dashboard hang needs deeper analysis:
  - Add individual request timeouts to Promise.all()
  - Add error boundaries in React components
  - Add loading state timeouts with fallback UI
  - Investigate database query performance

## Remaining Work

1. **Dashboard Loading Resilience**
   - Add per-request timeout wrappers (e.g., 10s timeout per API call)
   - Implement graceful degradation (show partial dashboard if some requests fail)
   - Add React Error Boundaries around DashboardModal
   - Add "Retry" button if loading fails

2. **LLM Performance Optimization**
   - Investigate why there are 30-60 second gaps between chunks
   - Consider using faster model for streaming (gemini-2.5-flash-lite vs gemini-2.5-flash)
   - Reduce context window size if possible
   - Add streaming progress indicators for long processing

3. **Frontend Timeout Handling**
   - Add client-side timeout for SSE connections (e.g., 5 minutes)
   - Show user-friendly error message if connection times out
   - Add "Reconnect" functionality

4. **Monitoring & Observability**
   - Add metrics for streaming duration
   - Track keep-alive heartbeat effectiveness
   - Monitor connection drop rates
   - Alert on excessive LLM latency

## Files Modified

1. `apps/api-gateway/src/controllers/conversation.controller.ts` - Added keep-alive mechanism and socket configuration
2. `apps/api-gateway/src/server.ts` - Configured server-level timeouts and error handling

## Testing Checklist

- [ ] Test streaming chat with long LLM responses (>2 minutes)
- [ ] Test streaming with network interruptions
- [ ] Verify keep-alive logs appear every 15 seconds during long processing
- [ ] Test dashboard loading with slow network
- [ ] Test dashboard loading with failed API requests
- [ ] Test page refresh during active streaming
- [ ] Verify cleanup happens on client disconnect
- [ ] Test with multiple concurrent streaming requests

## Related Issues

- V11.0 Streaming Implementation
- Response Time Improvement Plan (DevLog/20251006ResponseTimeImprovementPlan.md)
- LLM Performance Optimization

## References

- Server-Sent Events (SSE) Specification
- Node.js HTTP Server Documentation
- Express.js Best Practices for Streaming
- TCP Keep-Alive Mechanism

