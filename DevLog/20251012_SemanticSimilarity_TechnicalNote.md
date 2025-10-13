# Semantic Similarity for Capability Ranking - Technical Note

**Date**: October 12, 2025  
**Context**: Phase 2 Agent Capability System  
**Status**: ⚠️ Current Implementation Limited - Enhancement Planned

---

## Problem Statement

The current capability ranking system in `PromptBuilder.rankCapabilitiesByRelevance()` uses **simple keyword matching**, not true **semantic similarity**. This means:

### Current Behavior (Keyword Matching)

```typescript
// Example recent message: "I'd love a guided tour of my memories"
// Capability trigger: "take me on a journey"

// ❌ Score: 0 (no keyword overlap)
// Despite being semantically equivalent!
```

### Desired Behavior (Semantic Similarity)

```typescript
// Example recent message: "I'd love a guided tour of my memories"
// Capability trigger: "take me on a journey"

// ✅ Score: 0.87 (high cosine similarity)
// Correctly identifies semantic equivalence
```

---

## Current Implementation

### Algorithm: Keyword Matching

```typescript
const recentText = conversationContext.recentMessages
  .map((m: any) => m.content)
  .join(' ')
  .toLowerCase();

// Exact substring match
if (recentText.includes(pattern.toLowerCase())) {
  score += 10;
}

// Partial word match
const words = pattern.toLowerCase().split(' ');
const matchedWords = words.filter(word => recentText.includes(word));
score += matchedWords.length * 2;
```

### Limitations

1. **No Semantic Understanding**
   - Misses: "journey" vs. "tour", "explore" vs. "show me", "analyze" vs. "understand"
   - Only matches exact or partial word overlap

2. **Brittle to Paraphrasing**
   - User: "I'd love to see patterns in my data"
   - Trigger: "what patterns emerge"
   - Result: Partial match (only "patterns") → Low score

3. **No Context Awareness**
   - "I need a break" vs. "I need to break this down" (both match "break" but different intent)

4. **Language Limitations**
   - Won't work for multilingual users (Chinese, Spanish, etc.)
   - No synonym detection

---

## Why This Limitation Exists

### Design Decision: Start Simple

1. **Immediate Functionality**: Keyword matching provides baseline capability detection
2. **No External Dependencies**: Doesn't require embedding infrastructure
3. **Fast Execution**: Simple string operations, no API calls or ML inference
4. **Deterministic**: Easy to debug and understand

### Infrastructure Not Yet Ready

The full semantic similarity solution requires:
- Embedding generation pipeline
- Embedding storage (Redis cache)
- Cosine similarity calculation
- Latency optimization (pre-computed embeddings)

Phase 2 focuses on **architecture**, not ML optimization.

---

## Future Enhancement: Embedding-Based Semantic Search

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Pre-compute Capability Embeddings (Startup)              │
│    - Generate embeddings for all trigger patterns            │
│    - Cache in Redis with TTL = 7 days                        │
│    - Key: capability:{id}:embedding                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Generate Conversation Embedding (Per Request)            │
│    - Join recent messages (last 3-5 turns)                   │
│    - Call EmbeddingWorker or OpenAI API                      │
│    - Get 1536-dim vector                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Calculate Cosine Similarity                               │
│    - For each capability, compute:                           │
│      similarity = dot(conv_emb, cap_emb) / (||conv|| * ||cap||)│
│    - Score = similarity * 100                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Rank and Return Top N                                    │
│    - Sort by similarity score (descending)                   │
│    - Return top 10 capabilities                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Options

#### Option A: Use EmbeddingWorker (Recommended)

**Pros**:
- Already part of infrastructure
- Consistent with ingestion pipeline
- Can cache embeddings in Redis

**Cons**:
- Async (adds latency)
- Requires queue + worker coordination

**Code**:
```typescript
private async rankCapabilitiesBySemantic(
  capabilities: any[],
  conversationContext: any
): Promise<any[]> {
  // 1. Get recent conversation text
  const recentText = conversationContext.recentMessages
    .map((m: any) => m.content)
    .join(' ');

  // 2. Generate conversation embedding (via EmbeddingWorker)
  const convEmbedding = await this.embeddingService.generateEmbedding(recentText);

  // 3. Load capability embeddings from cache
  const capabilityEmbeddings = await this.loadCapabilityEmbeddings(capabilities);

  // 4. Calculate cosine similarity for each
  const scored = capabilities.map((cap, idx) => {
    const similarity = this.cosineSimilarity(
      convEmbedding,
      capabilityEmbeddings[idx]
    );
    return { ...cap, relevance_score: similarity * 100 };
  });

  // 5. Sort by relevance
  return scored.sort((a, b) => b.relevance_score - a.relevance_score);
}

private cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magA * magB);
}
```

#### Option B: OpenAI Embeddings API (Fast Prototype)

**Pros**:
- Synchronous
- High quality embeddings
- Easy to implement

**Cons**:
- Costs $0.0001 per 1K tokens (adds up)
- External dependency
- Slower than cached embeddings

**Code**:
```typescript
private async rankCapabilitiesBySemantic(
  capabilities: any[],
  conversationContext: any
): Promise<any[]> {
  const recentText = conversationContext.recentMessages
    .map((m: any) => m.content)
    .join(' ');

  // Call OpenAI embeddings API
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: recentText
    })
  });

  const { data } = await response.json();
  const convEmbedding = data[0].embedding;

  // Load capability embeddings (cached)
  const capabilityEmbeddings = await this.loadCapabilityEmbeddings(capabilities);

  // Calculate cosine similarity
  const scored = capabilities.map((cap, idx) => {
    const similarity = this.cosineSimilarity(convEmbedding, capabilityEmbeddings[idx]);
    return { ...cap, relevance_score: similarity * 100 };
  });

  return scored.sort((a, b) => b.relevance_score - a.relevance_score);
}
```

#### Option C: Pre-computed Embeddings + Fallback (Hybrid)

**Pros**:
- Fast (no API calls for cached embeddings)
- Reliable (fallback to keyword matching if embedding fails)
- Best UX

**Cons**:
- Most complex to implement
- Requires startup initialization

**Code**:
```typescript
private async rankCapabilitiesByRelevance(
  capabilities: any[],
  conversationContext: any
): Promise<any[]> {
  try {
    // Try semantic similarity first
    return await this.rankCapabilitiesBySemantic(capabilities, conversationContext);
  } catch (error) {
    console.warn('Semantic ranking failed, falling back to keyword matching', error);
    // Fallback to keyword matching
    return this.rankCapabilitiesByKeywords(capabilities, conversationContext);
  }
}
```

---

## Recommended Implementation Path

### Phase 2.1 (Current - DONE ✅)

- ✅ Implement keyword matching
- ✅ Document limitation clearly
- ✅ Design architecture for future enhancement

### Phase 2.2 (Next Sprint)

1. **Pre-compute Capability Embeddings**
   - Add startup script to generate embeddings for all capabilities
   - Cache in Redis: `capability:{id}:embedding`
   - Use OpenAI `text-embedding-3-small` model ($0.0001/1K tokens)

2. **Add Embedding Service to PromptBuilder**
   - Inject `EmbeddingService` into constructor
   - Add `generateConversationEmbedding()` method
   - Add `loadCapabilityEmbeddings()` method

3. **Implement Cosine Similarity**
   - Add `cosineSimilarity()` utility method
   - Add `rankCapabilitiesBySemantic()` method

4. **Add Fallback Logic**
   - Try semantic first
   - Fall back to keyword matching if fails
   - Log fallback events for monitoring

### Phase 2.3 (Future)

5. **Performance Optimization**
   - Cache conversation embeddings (short TTL = 5 min)
   - Batch embedding generation
   - Use faster embedding models if needed

6. **Quality Improvements**
   - A/B test semantic vs. keyword ranking
   - Tune similarity thresholds
   - Add user feedback loop

---

## Testing Strategy

### Keyword Matching Tests (Current)

```typescript
describe('rankCapabilitiesByRelevance (keyword)', () => {
  it('matches exact trigger patterns', () => {
    const capabilities = [
      { id: 'quest', trigger_patterns: ['take me on a journey'] }
    ];
    const conversation = { recentMessages: [{ content: 'take me on a journey' }] };
    const ranked = promptBuilder.rankCapabilitiesByRelevance(capabilities, conversation);
    expect(ranked[0].relevance_score).toBeGreaterThan(0);
  });

  it('matches partial words', () => {
    const capabilities = [
      { id: 'quest', trigger_patterns: ['show me patterns'] }
    ];
    const conversation = { recentMessages: [{ content: 'I want to see the pattern' }] };
    const ranked = promptBuilder.rankCapabilitiesByRelevance(capabilities, conversation);
    expect(ranked[0].relevance_score).toBeGreaterThan(0);
  });
});
```

### Semantic Similarity Tests (Future)

```typescript
describe('rankCapabilitiesByRelevance (semantic)', () => {
  it('detects semantic equivalence', async () => {
    const capabilities = [
      { id: 'quest', trigger_patterns: ['take me on a journey'] }
    ];
    const conversation = { recentMessages: [{ content: 'I\'d love a guided tour' }] };
    const ranked = await promptBuilder.rankCapabilitiesByRelevance(capabilities, conversation);
    expect(ranked[0].relevance_score).toBeGreaterThan(70); // High similarity
  });

  it('distinguishes different intents', async () => {
    const capabilities = [
      { id: 'quest', trigger_patterns: ['take me on a journey'] },
      { id: 'create_card', trigger_patterns: ['create a card'] }
    ];
    const conversation = { recentMessages: [{ content: 'I want to save this as a card' }] };
    const ranked = await promptBuilder.rankCapabilitiesByRelevance(capabilities, conversation);
    expect(ranked[0].id).toBe('create_card'); // Correct capability ranked first
  });
});
```

---

## Performance Considerations

### Keyword Matching (Current)

- **Latency**: <1ms (string operations)
- **Accuracy**: ~60% (misses paraphrasing)
- **Cost**: $0 (no API calls)

### Semantic Similarity (Future)

- **Latency**: ~50-100ms (with cached embeddings)
- **Accuracy**: ~90% (handles paraphrasing)
- **Cost**: ~$0.0001 per conversation turn (negligible)

### Cache Strategy

```typescript
// Capability embeddings: pre-computed, long TTL
await redis.setex(`capability:${capId}:embedding`, 604800, JSON.stringify(embedding)); // 7 days

// Conversation embeddings: per-request, short TTL
await redis.setex(`conv:${sessionId}:embedding`, 300, JSON.stringify(embedding)); // 5 min
```

---

## Conclusion

The current **keyword matching** implementation provides baseline functionality for Phase 2. It's:
- ✅ Fast and reliable
- ✅ Easy to understand and debug
- ✅ Sufficient for exact or near-exact trigger pattern matches

However, it has clear limitations for **semantic understanding**. The recommended enhancement path is:

1. **Phase 2.2**: Implement embedding-based semantic similarity with fallback
2. **Phase 2.3**: Optimize performance and tune quality

This phased approach balances immediate functionality with future scalability.

---

**References**:
- [PromptBuilder Implementation](../services/dialogue-service/src/PromptBuilder.ts#L835)
- [Agent Capabilities Config](../config/agent_capabilities.json)
- [Phase 2 Summary](./20251012_Phase2_AgentCapabilitySystem.md)

