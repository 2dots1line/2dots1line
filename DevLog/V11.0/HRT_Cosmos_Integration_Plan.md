# HRT Cosmos Integration Plan

## Overview

This plan implements the integration between HRT (Hybrid Retrieval Tool) and the Cosmos view to provide real-time visual effects when users are chatting from the cosmos interface. When HRT retrieves seed entities, they will be highlighted in the 3D cosmos scene with special visual effects.

## Key Principles

1. **View-Specific Behavior**: HRT seed entity effects only apply when user is on cosmos view
2. **Parallel Processing**: HRT sends seed entity IDs immediately after semantic grounding, before completing full pipeline
3. **No DialogueAgent Changes**: DialogueAgent workflow remains unchanged
4. **Existing Infrastructure**: Uses existing streaming mechanism and event system

## Current System Analysis

### HRT Flow
1. **Stage 1**: Key phrase processing
2. **Stage 2**: Semantic grounding (Weaviate) → **seed entities**
3. **Stage 3**: Graph traversal (Neo4j) → candidate entities
4. **Stage 4**: Pre-hydration (PostgreSQL metadata)
5. **Stage 5**: Scoring & prioritization → scored entities
6. **Stage 6**: Full content hydration → AugmentedMemoryContext

### View Context Detection
- **Frontend**: `ChatInterface` detects view via `pathname === '/cosmos'` and `activeView`
- **Backend**: `ConversationController` receives `viewContext` and passes to `DialogueAgent`
- **PromptBuilder**: Receives `viewContext` and applies view-specific instructions
- **Cosmos View**: Has `MediumChat`/`MiniChat` components that send messages with `viewContext: { currentView: 'cosmos' }`

### Cosmos Visual System
- **Camera Focus**: Event-driven via `camera-focus-request` events
- **Node Effects**: Applied via `NodeMesh` component properties
- **Edge Filtering**: Controlled by `showEdges` prop and edge visibility logic

## Implementation Plan

### Phase 1: DialogueAgent Passes View Context to HRT

**Location**: `services/dialogue-service/src/DialogueAgent.ts`

**Changes**:
1. Pass view context to HRT when calling it
2. Pass streaming callback to HRT for seed entity data

```typescript
// In DialogueAgent.processTurnStreaming() - when calling HRT
const augmentedContext = await this.hybridRetrievalTool.execute({
  keyPhrasesForRetrieval: keyPhrases,
  userId: input.userId,
  userParameters: userParameters,
  // NEW: Pass view context to HRT
  viewContext: input.viewContext,
  onSeedEntitiesFound: (data) => {
    onChunk?.(JSON.stringify(data));
  }
});
```

### Phase 2: HRT Uses View Context and Sends Seed Entities

**Location**: `packages/tools/src/retrieval/HybridRetrievalTool.ts`

**Changes**:
1. Update `HRTInput` interface to include view context
2. Use view context from input (passed by DialogueAgent)
3. Send seed entity IDs only when user is on cosmos view

```typescript
export interface HRTInput {
  keyPhrasesForRetrieval: string[];
  userId: string;
  userParameters?: any;
  // NEW: View context passed from DialogueAgent
  viewContext?: {
    currentView: 'chat' | 'cards' | 'cosmos' | 'dashboard';
    viewDescription?: string;
  };
  onSeedEntitiesFound?: (data: any) => void;
}

// In HybridRetrievalTool.execute() - after Stage 2: Semantic Grounding
const seedEntities = await this.semanticGrounding(processedPhrases, input.userId, context, userParameters);

// NEW: Use view context from input (passed by DialogueAgent)
if (seedEntities.length > 0 && input.viewContext?.currentView === 'cosmos' && input.onSeedEntitiesFound) {
  const seedEntityIds = seedEntities.map(e => e.id);
  input.onSeedEntitiesFound({
    type: 'hrt_seed_entities',
    seed_entity_ids: seedEntityIds,
    key_phrases: processedPhrases
  });
}

// Continue with existing stages 3-6...
```

### Phase 3: CosmosScene Applies Effects

**Location**: `apps/web-app/src/app/cosmos/CosmosScene.tsx`

**Changes**:
1. Add state for seed entity IDs
2. Listen for HRT seed entity events
3. Apply seed entity flag to graph data

```typescript
const [seedEntityIds, setSeedEntityIds] = useState<string[]>([]);

useEffect(() => {
  const handleHRTSeedEntities = (event: CustomEvent) => {
    setSeedEntityIds(event.detail.seed_entity_ids || []);
  };
  
  window.addEventListener('hrt-seed-entities', handleHRTSeedEntities as EventListener);
  return () => window.removeEventListener('hrt-seed-entities', handleHRTSeedEntities as EventListener);
}, []);

// Apply effects to existing graph data
const safeGraphData = {
  ...graphData,
  nodes: (graphData.nodes ?? []).map((node) => ({
    ...node,
    isSeedEntity: seedEntityIds.includes(node.id)
  }))
};
```

### Phase 4: Graph3D Applies Visual Effects

**Location**: `apps/web-app/src/components/cosmos/Graph3D.tsx`

**Changes**:
1. Use seed entity flag for visual effects
2. Apply enhanced visual properties to seed entities

```typescript
{graphData.nodes.map((node, index) => (
  <NodeMesh
    key={node.id}
    node={node}
    onClick={() => onNodeClick(node)}
    // NEW: Enhanced visual effects for seed entities
    size={node.isSeedEntity ? node.size * 1.5 : node.size}
    glowIntensity={node.isSeedEntity ? 0.8 : 0.3}
    pulseAnimation={node.isSeedEntity}
    highlightColor={node.isSeedEntity ? '#00ff88' : undefined}
  />
))}
```

### Phase 5: Filter Edges to Show Only Seed Entity Connections

**Location**: `apps/web-app/src/components/cosmos/Graph3D.tsx`

**Changes**:
1. Update edge visibility logic to show only edges connected to seed entities
2. Apply when seed entities are present

```typescript
// In Graph3D edge rendering
const shouldShowEdge = (edge: any) => {
  if (!showEdges) return false;
  
  // NEW: If we have seed entities, only show edges connected to them
  if (seedEntityIds.length > 0) {
    return seedEntityIds.includes(edge.source) || seedEntityIds.includes(edge.target);
  }
  
  // Existing edge visibility logic
  return true;
};
```

## User Experience Flow

1. **User on cosmos view** → **Sends message via cosmos chat** (e.g., "What do I know about machine learning?")
2. **DialogueAgent** → **Passes `viewContext: { currentView: 'cosmos' }` to HRT**
3. **HRT Stage 2 completes** → **Uses view context from input** → **Sends seed entity IDs**
4. **Frontend receives** → **Dispatches event to cosmos scene**
5. **Cosmos scene** → **Applies visual effects to seed entities** (glow, pulse, larger size)
6. **HRT continues** → **Stages 3-6 (unchanged)**
7. **DialogueAgent continues** → **2nd LLM call with augmented context (unchanged)**
8. **Final response** → **User sees both visual effects and text response**

## Benefits

1. **🎯 View-Specific**: Only applies when user is on cosmos view
2. **⚡ Real-time**: Immediate visual feedback as HRT finds entities
3. **🔄 Parallel**: Visual effects happen while HRT continues processing
4. **🧠 Memory-Aware**: Cosmos becomes visual extension of memory retrieval
5. **🎨 Enhanced UX**: Users see relevant entities highlighted in 3D space
6. **🔗 Focused Connections**: Only shows edges between retrieved entities

## Technical Benefits

1. **✅ No Breaking Changes**: All existing functionality remains unchanged
2. **✅ Minimal Code**: Leverages existing streaming and event infrastructure
3. **✅ Clean Separation**: HRT handles its own seed entity streaming
4. **✅ View-Aware**: Behavior is contextually appropriate
5. **✅ Performance**: Smaller dataset for edge rendering when seed entities present

## Implementation Notes

- **View Context**: Already implemented and working in the system
- **Streaming**: Uses existing streaming mechanism, no new infrastructure needed
- **Events**: Uses existing custom event system for cross-component communication
- **Visual Effects**: Leverages existing `NodeMesh` component properties
- **Edge Filtering**: Extends existing edge visibility logic

## Testing Strategy

1. **Unit Tests**: Test HRT view context checking logic
2. **Integration Tests**: Test DialogueAgent → HRT → Frontend flow
3. **E2E Tests**: Test complete user flow from cosmos chat to visual effects
4. **Visual Tests**: Verify seed entity highlighting and edge filtering

## Future Enhancements

1. **Camera Auto-Focus**: Automatically focus camera on seed entity cluster
2. **Animation**: Smooth transitions when seed entities are highlighted
3. **Persistence**: Remember seed entity state across cosmos navigation
4. **Multiple Views**: Extend to other views (cards, dashboard) if needed
