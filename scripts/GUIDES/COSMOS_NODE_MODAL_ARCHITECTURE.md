# Cosmos Node Modal Architecture Guide

## Overview

This guide outlines the architecture for enhancing the Cosmos node double-click modal from a basic JSON display to a rich, card-based interface that integrates with the existing card system.

## Current State Analysis

### Current Implementation
- **File**: `apps/web-app/src/components/modal/CosmosNodeModal.tsx`
- **Issue**: Displays raw JSON data instead of formatted card content
- **Data Source**: Graph projection API returns node data with `properties.title`, `properties.content`, etc.

### Current Data Flow
```
Graph Projection API → CosmosScene → Graph3D → NodeMesh → CosmosNodeModal (JSON)
```

## Proposed Architecture

### 1. Enhanced Data Flow
```
Graph Projection API → CosmosScene → Graph3D → NodeMesh → CosmosNodeModal → CardService → Rich Card Display
```

### 2. Component Architecture

#### A. Data Layer
- **CosmosService**: Fetches graph projection data
- **CardService**: Fetches detailed card data by node ID
- **NodeDataMapper**: Maps between graph nodes and card data

#### B. Presentation Layer
- **CosmosNodeModal**: Main modal container
- **NodeCardDisplay**: Rich card content display
- **NodeConnectionsPanel**: Shows related nodes/connections
- **NodeActionsPanel**: Card actions (favorite, share, etc.)

#### C. Integration Layer
- **useNodeCardData**: Hook for fetching and managing node card data
- **useNodeInteractions**: Enhanced interaction handlers

## Implementation Options

### Option 1: Direct Card Integration (Recommended)

#### Architecture
```
Node Click → Fetch Card by Node ID → Display Card Modal
```

#### Pros
- ✅ Reuses existing card system
- ✅ Consistent UI/UX
- ✅ Full card functionality
- ✅ Easy to maintain

#### Cons
- ⚠️ Requires node ID to card ID mapping
- ⚠️ Additional API call

#### Implementation Steps
1. **Create Node-to-Card Mapping Service**
2. **Enhance CosmosNodeModal with Card Components**
3. **Add Card Actions Integration**
4. **Implement Connection Visualization**

### Option 2: Hybrid Approach

#### Architecture
```
Node Click → Display Node Data + Fetch Related Cards → Rich Modal
```

#### Pros
- ✅ Shows both node and card data
- ✅ No mapping required
- ✅ Flexible display options

#### Cons
- ⚠️ More complex UI
- ⚠️ Potential data duplication

### Option 3: Graph-First Approach

#### Architecture
```
Node Click → Enhanced Node Display → Graph Context + Actions
```

#### Pros
- ✅ Graph-centric design
- ✅ No external dependencies
- ✅ Fast rendering

#### Cons
- ⚠️ Duplicates card functionality
- ⚠️ Inconsistent with card system

## Recommended Implementation: Option 1

### 1. Data Mapping Service

#### File: `apps/web-app/src/services/nodeCardMappingService.ts`
```typescript
interface NodeCardMapping {
  nodeId: string;
  cardId: string;
  cardType: string;
  confidence: number;
}

class NodeCardMappingService {
  // Map node IDs to card IDs based on properties
  async mapNodeToCard(node: any): Promise<string | null> {
    // Implementation: Use node.properties to find corresponding card
  }
  
  // Get related cards for a node
  async getRelatedCards(nodeId: string): Promise<DisplayCard[]> {
    // Implementation: Find cards with similar content/tags
  }
}
```

### 2. Enhanced Node Modal

#### File: `apps/web-app/src/components/modal/CosmosNodeModal.tsx`
```typescript
interface CosmosNodeModalProps {
  node: any;
  onClose: () => void;
  onCardAction?: (action: string, cardId: string) => void;
}

const CosmosNodeModal: React.FC<CosmosNodeModalProps> = ({ node, onClose, onCardAction }) => {
  const { cardData, isLoading, error } = useNodeCardData(node);
  
  return (
    <Modal>
      {isLoading ? <LoadingSpinner /> : (
        <div className="node-modal-content">
          <NodeCardDisplay card={cardData} />
          <NodeConnectionsPanel node={node} />
          <NodeActionsPanel card={cardData} onAction={onCardAction} />
        </div>
      )}
    </Modal>
  );
};
```

### 3. Node Card Data Hook

#### File: `apps/web-app/src/hooks/cosmos/useNodeCardData.ts`
```typescript
export const useNodeCardData = (node: any) => {
  const [cardData, setCardData] = useState<DisplayCard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (node) {
      fetchCardData(node);
    }
  }, [node]);
  
  const fetchCardData = async (node: any) => {
    setIsLoading(true);
    try {
      const cardId = await nodeCardMappingService.mapNodeToCard(node);
      if (cardId) {
        const response = await cardService.getCard(cardId);
        setCardData(response.card);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return { cardData, isLoading, error };
};
```

### 4. Node Card Display Component

#### File: `apps/web-app/src/components/cosmos/NodeCardDisplay.tsx`
```typescript
interface NodeCardDisplayProps {
  card: DisplayCard;
  node: any;
  className?: string;
}

const NodeCardDisplay: React.FC<NodeCardDisplayProps> = ({ card, node, className }) => {
  return (
    <div className={`node-card-display ${className}`}>
      {/* Card Header */}
      <div className="card-header">
        <h2>{card.title || node.properties?.title}</h2>
        <CardTypeBadge type={card.card_type} />
      </div>
      
      {/* Card Content */}
      <div className="card-content">
        <CardDescription content={card.description || node.properties?.content} />
        <CardMetadata metadata={card} />
      </div>
      
      {/* Card Background */}
      <CardBackground background={card.background_image_url} />
      
      {/* Card Actions */}
      <CardActions card={card} />
    </div>
  );
};
```

## Layout Options

### Option A: Full-Screen Modal (Recommended)
```
┌─────────────────────────────────────────────────────────┐
│                    Node Card Modal                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────────┐ │
│  │   Card Display  │  │      Connections Panel          │ │
│  │                 │  │                                 │ │
│  │  • Title        │  │  • Related Nodes               │ │
│  │  • Content      │  │  • Connection Types            │ │
│  │  • Metadata     │  │  • Connection Strength         │ │
│  │  • Background   │  │                                 │ │
│  │  • Actions      │  │                                 │ │
│  └─────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Option B: Side Panel Modal
```
┌─────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐ │
│  │               3D Graph View                         │ │
│  │                                                     │ │
│  │  ┌─────────────────────────────────────────────┐   │ │
│  │  │              Node Card Panel                 │   │ │
│  │  │  • Title                                    │   │ │
│  │  │  • Content                                  │   │ │
│  │  │  • Actions                                  │   │ │
│  │  │  • Connections                              │   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Option C: Overlay Modal
```
┌─────────────────────────────────────────────────────────┐
│               3D Graph View (Background)                │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Node Card Overlay                      │ │
│  │  • Floating card display                           │ │
│  │  • Semi-transparent background                     │ │
│  │  • Click outside to close                          │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Implementation Priority

### Phase 1: Basic Card Integration
1. **Create NodeCardMappingService**
2. **Enhance CosmosNodeModal with CardTile component**
3. **Add basic card actions (favorite, close)**

### Phase 2: Rich Interactions
1. **Add NodeConnectionsPanel**
2. **Implement card sharing functionality**
3. **Add background image support**

### Phase 3: Advanced Features
1. **Add connection visualization**
2. **Implement card editing**
3. **Add search and filtering**

## File Structure

```
apps/web-app/src/
├── components/
│   ├── modal/
│   │   ├── CosmosNodeModal.tsx          # Enhanced modal
│   │   └── NodeCardModal.tsx            # New card-specific modal
│   ├── cosmos/
│   │   ├── NodeCardDisplay.tsx          # Card display component
│   │   ├── NodeConnectionsPanel.tsx     # Connections panel
│   │   └── NodeActionsPanel.tsx         # Actions panel
│   └── cards/
│       └── CardTile.tsx                 # Reuse existing
├── hooks/
│   └── cosmos/
│       └── useNodeCardData.ts           # Node card data hook
├── services/
│   ├── nodeCardMappingService.ts        # Mapping service
│   └── cardService.ts                   # Existing (enhanced)
└── stores/
    └── NodeModalStore.ts                # Modal state management
```

## Data Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Graph API     │───▶│  CosmosScene    │───▶│   NodeMesh      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Node Click     │───▶│  CosmosNodeModal│
                       └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │NodeCardMapping  │◀───│  useNodeCardData│
                       │Service          │    │                 │
                       └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  CardService    │    │ NodeCardDisplay │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
```

## Benefits of This Architecture

### ✅ **Consistency**
- Reuses existing card components
- Maintains UI/UX consistency
- Leverages existing card actions

### ✅ **Maintainability**
- Clear separation of concerns
- Reusable components
- Easy to extend

### ✅ **Performance**
- Lazy loading of card data
- Efficient data mapping
- Minimal API calls

### ✅ **User Experience**
- Rich, familiar interface
- Full card functionality
- Seamless integration

## Next Steps

1. **Implement NodeCardMappingService**
2. **Create useNodeCardData hook**
3. **Enhance CosmosNodeModal**
4. **Add NodeCardDisplay component**
5. **Test and iterate**

This architecture provides a solid foundation for transforming the basic JSON modal into a rich, card-based interface that integrates seamlessly with the existing card system. 