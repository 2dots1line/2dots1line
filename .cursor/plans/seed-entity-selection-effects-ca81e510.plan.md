<!-- ca81e510-09d4-464e-8f5c-5ebadf928424 3cda08ca-f108-41b7-b72a-9b7543c3ad17 -->
# View Transition Abstraction System

## Design Principles

1. **Configuration-driven**: All transitions defined in JSON, not code
2. **True abstraction**: No view-specific logic in implementation
3. **Single global storage**: One transition content key for all views
4. **Generic chat management**: Chat as independent floating entity
5. **No backward compatibility**: Clean implementation, test immediately

## Architecture Overview

### Core Components

1. **Configuration Layer**: `config/view_transitions.json` - defines all possible transitions
2. **Service Layer**: `apps/web-app/src/services/viewTransitionService.ts` - generic transition logic
3. **Hook Layer**: `apps/web-app/src/hooks/useViewTransitionContent.ts` - reusable content handler
4. **Store Layer**: Enhanced `HUDStore` with generic chat size method
5. **Prompt Layer**: Dynamic transition loading in `PromptBuilder`

---

## Implementation Steps

### Step 1: Create View Transitions Configuration

**File**: `config/view_transitions.json` (NEW)

Create comprehensive configuration defining all view transitions:

```json
{
  "storage_key": "viewTransitionContent",
  
  "transitions": {
    "chat_to_cosmos": {
      "from": "chat",
      "to": "cosmos",
      "trigger_patterns": [
        "spatial relationships",
        "memory landscape",
        "how concepts connect",
        "value patterns",
        "cosmos shaping",
        "visualize",
        "show me in 3D"
      ],
      "question_template": "Should we go to Cosmos view together?",
      "target_chat_size": "medium",
      "transition_delay_ms": 1500
    },
    "cosmos_to_cards": {
      "from": "cosmos",
      "to": "cards",
      "trigger_patterns": [
        "create a card",
        "save this entity",
        "organize this memory",
        "make a card for"
      ],
      "question_template": "Would you like to create a card for this entity?",
      "target_chat_size": "mini",
      "transition_delay_ms": 1500
    },
    "cards_to_chat": {
      "from": "cards",
      "to": "chat",
      "trigger_patterns": [
        "let's discuss",
        "tell me more about",
        "I want to reflect on",
        "help me understand"
      ],
      "question_template": "Should we dive deeper in a conversation?",
      "target_chat_size": "large",
      "transition_delay_ms": 1500
    },
    "cosmos_to_chat": {
      "from": "cosmos",
      "to": "chat",
      "trigger_patterns": [
        "let's talk about this",
        "I have questions about",
        "help me process"
      ],
      "question_template": "Would you like to open up a conversation about this?",
      "target_chat_size": "large",
      "transition_delay_ms": 1500
    },
    "dashboard_to_cosmos": {
      "from": "dashboard",
      "to": "cosmos",
      "trigger_patterns": [
        "show me in 3D",
        "visualize this pattern",
        "explore spatially"
      ],
      "question_template": "Want to see this in your cosmos?",
      "target_chat_size": "medium",
      "transition_delay_ms": 1500
    },
    "cards_to_cosmos": {
      "from": "cards",
      "to": "cosmos",
      "trigger_patterns": [
        "where does this fit",
        "show connections",
        "see the bigger picture"
      ],
      "question_template": "Should we see how this connects in your cosmos?",
      "target_chat_size": "medium",
      "transition_delay_ms": 1500
    }
  },
  
  "views": {
    "chat": {
      "route": "/",
      "activeView": "chat",
      "chat_enabled": true,
      "default_chat_size": "large"
    },
    "cosmos": {
      "route": "/cosmos",
      "activeView": null,
      "chat_enabled": true,
      "default_chat_size": "mini"
    },
    "cards": {
      "route": "/",
      "activeView": "cards",
      "chat_enabled": true,
      "default_chat_size": "mini"
    },
    "dashboard": {
      "route": "/",
      "activeView": "dashboard",
      "chat_enabled": false
    }
  }
}
```

**Notes**:

- Each transition has trigger patterns for LLM to recognize
- `transition_delay_ms` is reading time before view switch
- `target_chat_size` defines chat size in destination view
- `views` config maps view names to routes and HUD activeView states

---

### Step 2: Create View Transition Service

**File**: `apps/web-app/src/services/viewTransitionService.ts` (NEW)

Generic service for all transition logic:

```typescript
import viewTransitionsConfig from '../../../config/view_transitions.json';

export interface ViewTransitionConfig {
  from: string;
  to: string;
  trigger_patterns: string[];
  question_template: string;
  target_chat_size: 'mini' | 'medium' | 'large';
  transition_delay_ms: number;
}

export interface ViewConfig {
  route: string;
  activeView: string | null;
  chat_enabled: boolean;
  default_chat_size?: 'mini' | 'medium' | 'large';
}

export interface TransitionContent {
  targetView: string;
  content: string;
  timestamp: number;
  targetChatSize: 'mini' | 'medium' | 'large';
}

export class ViewTransitionService {
  private static readonly STORAGE_KEY = viewTransitionsConfig.storage_key;

  /**
   * Get transition config for specific route
   */
  static getTransition(fromView: string, toView: string): ViewTransitionConfig | null {
    const transitionKey = `${fromView}_to_${toView}`;
    const config = (viewTransitionsConfig.transitions as any)[transitionKey];
    return config || null;
  }

  /**
   * Get all available transitions from a specific view
   */
  static getAvailableTransitions(fromView: string): ViewTransitionConfig[] {
    return Object.values(viewTransitionsConfig.transitions)
      .filter((t: any) => t.from === fromView);
  }

  /**
   * Get view configuration
   */
  static getViewConfig(view: string): ViewConfig | null {
    const config = (viewTransitionsConfig.views as any)[view];
    return config || null;
  }

  /**
   * Store transition content (single global key)
   */
  static storeTransitionContent(
    targetView: string,
    mainContent: string,
    targetChatSize?: string
  ): void {
    const transitionConfig = this.getViewConfig(targetView);
    const finalChatSize = targetChatSize || transitionConfig?.default_chat_size || 'medium';

    const content: TransitionContent = {
      targetView,
      content: mainContent,
      timestamp: Date.now(),
      targetChatSize: finalChatSize as 'mini' | 'medium' | 'large'
    };

    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(content));
    console.log(`🔄 ViewTransitionService: Stored content for ${targetView}`, content);
  }

  /**
   * Retrieve and clear transition content (single global key)
   * Only returns content if targetView matches currentView
   */
  static retrieveTransitionContent(currentView: string): TransitionContent | null {
    const data = sessionStorage.getItem(this.STORAGE_KEY);
    
    if (!data) return null;

    try {
      const content: TransitionContent = JSON.parse(data);
      
      // Only consume if this content is meant for current view
      if (content.targetView === currentView) {
        // Clear immediately after retrieval
        sessionStorage.removeItem(this.STORAGE_KEY);
        console.log(`🔄 ViewTransitionService: Retrieved content for ${currentView}`, content);
        return content;
      }
      
      // Content is for a different view, don't consume it
      console.log(`🔄 ViewTransitionService: Content is for ${content.targetView}, not ${currentView}. Ignoring.`);
      return null;
    } catch (error) {
      console.error('🔄 ViewTransitionService: Failed to parse transition content', error);
      sessionStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  /**
   * Get route and activeView for navigation
   */
  static getNavigationTarget(targetView: string): { route: string; activeView: string | null } {
    const viewConfig = this.getViewConfig(targetView);
    return {
      route: viewConfig?.route || `/${targetView}`,
      activeView: viewConfig?.activeView ?? null
    };
  }
}
```

---

### Step 3: Add Generic Chat Size Management to ChatStore

**File**: `apps/web-app/src/stores/ChatStore.ts`

Add chat size state and methods to ChatStore (where it semantically belongs):

```typescript
interface ChatState {
  // ... existing fields ...
  
  // NEW: Chat sizing per view - chat is independent floating entity
  chatSizeByView: {
    [key: string]: 'mini' | 'medium' | 'large';
  };
  
  // NEW: Generic chat size methods
  setChatSize: (view: string, size: 'mini' | 'medium' | 'large') => void;
  getChatSize: (view: string) => 'mini' | 'medium' | 'large';
}

// In the store implementation:
// Initial state
chatSizeByView: {
  cosmos: 'mini',
  cards: 'mini',
  chat: 'large',
  dashboard: 'mini'
},

// Actions
setChatSize: (view: string, size: 'mini' | 'medium' | 'large') => {
  console.log(`💬 ChatStore: Setting chat size for ${view} to ${size}`);
  set((state) => ({
    chatSizeByView: {
      ...state.chatSizeByView,
      [view]: size
    }
  }));
},

getChatSize: (view: string) => {
  const size = get().chatSizeByView[view];
  return size || 'mini'; // Default to mini if view not found
},
```

**Changes**:

- Add `chatSizeByView` map to store chat sizes for all views
- Add `setChatSize(view, size)` generic setter
- Add `getChatSize(view)` getter with fallback
- Initialize with default sizes for known views

**Rationale**: Chat is an independent floating entity, not part of HUD navigation. Chat state belongs in ChatStore for proper semantic separation and true abstraction.

---

### Step 4: Create Reusable View Transition Content Hook

**File**: `apps/web-app/src/hooks/useViewTransitionContent.ts` (NEW)

Generic hook for all views:

```typescript
import { useEffect } from 'react';
import { useChatStore } from '../stores/ChatStore';
import { useHUDStore } from '../stores/HUDStore';
import { ViewTransitionService } from '../services/viewTransitionService';
import type { ChatMessage } from '../services/chatService';

/**
 * Generic hook to handle view transition content display
 * Works for any view (cosmos, cards, chat, dashboard)
 * 
 * @param currentView - Name of current view ('cosmos', 'cards', 'chat', 'dashboard')
 * @param isLoading - Whether the view is currently loading
 * @param isReady - Whether the view is ready to display content
 */
export const useViewTransitionContent = (
  currentView: string,
  isLoading: boolean,
  isReady: boolean
) => {
  const { addMessage } = useChatStore();
  const { setChatSizeForView } = useHUDStore();

  useEffect(() => {
    // Wait for view to be fully loaded before displaying content
    if (isLoading || !isReady) return;

    const transitionContent = ViewTransitionService.retrieveTransitionContent(currentView);
    
    if (transitionContent) {
      console.log(`🎬 useViewTransitionContent: Displaying content in ${currentView}`);
      
      // Add main content as bot message
      const mainMessage: ChatMessage = {
        id: `transition-${transitionContent.timestamp}`,
        type: 'bot',
        content: transitionContent.content,
        timestamp: new Date(transitionContent.timestamp)
      };
      addMessage(mainMessage);
      
      // Set chat size for this view
      setChatSizeForView(currentView as any, transitionContent.targetChatSize);
      
      console.log(`🎬 useViewTransitionContent: Content displayed, chat size set to ${transitionContent.targetChatSize}`);
    }
  }, [isLoading, isReady, addMessage, setChatSizeForView, currentView]);
};
```

---

### Step 5: Update ChatInterface to Use ViewTransitionService

**File**: `apps/web-app/src/components/chat/ChatInterface.tsx`

Replace hardcoded transition logic with generic service calls:

```typescript
import { ViewTransitionService } from '../../services/viewTransitionService';
import { useHUDStore } from '../../stores/HUDStore';

// In handleActionClick callback:
const handleActionClick = useCallback((action: UiAction, buttonValue: 'confirm' | 'dismiss') => {
  if (buttonValue === 'dismiss') {
    // Scenario B: User dismissed
    const dismissScenario = action.payload.scenarios.on_dismiss;
    
    const botMessage: ChatMessage = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content: dismissScenario.content,
      timestamp: new Date()
    };
    addMessage(botMessage);
    
    trackEvent({
      type: 'click',
      target: 'action_dismiss',
      targetType: 'button',
      view: currentView || 'chat',
      metadata: { action: action.action, target: action.payload.target }
    });
    
    return;
  }
  
  if (buttonValue === 'confirm' && action.action === 'switch_view') {
    // Scenario A: User confirmed
    const confirmScenario = action.payload.scenarios.on_confirm;
    const targetView = action.payload.target.toLowerCase();
    
    // Get transition config
    const transitionConfig = ViewTransitionService.getTransition(
      currentView || 'chat',
      targetView
    );
    
    // 1. Add transition message immediately
    const transitionMessage: ChatMessage = {
      id: `transition-${Date.now()}`,
      type: 'bot',
      content: confirmScenario.transition_message,
      timestamp: new Date()
    };
    addMessage(transitionMessage);
    
    // 2. Track confirmation
    trackEvent({
      type: 'click',
      target: 'action_confirm',
      targetType: 'button',
      view: currentView || 'chat',
      metadata: {
        action: action.action,
        target: targetView,
        question: action.question
      }
    });
    
    // 3. Store main content using ViewTransitionService (single global key)
    ViewTransitionService.storeTransitionContent(
      targetView,
      confirmScenario.main_content,
      transitionConfig?.target_chat_size
    );
    
    // 4. Give user time to read transition message
    const delay = transitionConfig?.transition_delay_ms || 1500;
    setTimeout(() => {
      // 5. Navigate to target view
      const navTarget = ViewTransitionService.getNavigationTarget(targetView);
      
      // Handle navigation based on route and activeView
      if (navTarget.route === '/') {
        // Navigating to main page - set activeView via HUD
        if (navTarget.activeView) {
          useHUDStore.getState().setActiveView(navTarget.activeView as any);
        }
        router.push('/');
      } else {
        // Navigating to dedicated route (e.g., /cosmos)
        router.push(navTarget.route);
      }
      
      console.log(`🔄 ChatInterface: Navigating to ${targetView}`, navTarget);
    }, delay);
  }
  
  // Other actions (open_card, focus_entity, etc.) - future implementation
}, [router, trackEvent, currentView, addMessage]);
```

**Changes**:

- Remove hardcoded `cosmosMainContent` storage key
- Use `ViewTransitionService.storeTransitionContent()` (single global key)
- Use `ViewTransitionService.getTransition()` for delay config
- Use `ViewTransitionService.getNavigationTarget()` for routing

---

### Step 6: Update CosmosScene to Use Generic Hook

**File**: `apps/web-app/src/app/cosmos/CosmosScene.tsx`

Replace existing transition content logic:

```typescript
import { useViewTransitionContent } from '../../hooks/useViewTransitionContent';

const CosmosScene: React.FC = () => {
  // ... existing state ...
  
  // Use generic hook to handle transition content
  useViewTransitionContent('cosmos', isLoading, !!graphData);
  
  // REMOVE the old useEffect that handled cosmosMainContent manually
  // DELETE lines 96-123 (the old content handling logic)
  
  // ... rest of component ...
};
```

**Changes**:

- Add `useViewTransitionContent('cosmos', isLoading, !!graphData)` hook call
- Remove the old `useEffect` that manually handled `cosmosMainContent` (lines 96-123)

---

### Step 7: Update view_specific_instructions.json

**File**: `config/view_specific_instructions.json`

Replace hardcoded engagement-aware instructions with references to transitions config:

```json
{
  "chat": {
    "view_name": "Chat Interface",
    "description": "Main conversational interface for open-ended dialogue and personal growth",
    "available_features": [
      "memory_exploration",
      "conversation_analysis",
      "cross_view_navigation"
    ],
    "engagement_aware_instructions": {
      "general": "When user asks view-appropriate questions, suggest switching to that view. Available transitions are dynamically loaded from view_transitions.json.",
      "use_transition_config": true
    }
  },
  "cards": {
    "view_name": "Cards Interface",
    "description": "Knowledge graph exploration interface with card-based interactions",
    "available_features": [
      "card_creation",
      "relationship_exploration",
      "cosmos_visualization"
    ],
    "engagement_aware_instructions": {
      "general": "When user requests deeper conversation or cosmos visualization, suggest appropriate view transition.",
      "use_transition_config": true
    }
  },
  "cosmos": {
    "view_name": "Cosmos Interface",
    "description": "3D immersive memory visualization and exploration interface",
    "available_features": [
      "guided_walkthrough",
      "entity_clustering",
      "relationship_exploration",
      "memory_timeline"
    ],
    "engagement_aware_instructions": {
      "general": "When user wants to create cards or have deeper conversations, suggest appropriate view transition.",
      "use_transition_config": true
    }
  },
  "dashboard": {
    "view_name": "Dashboard Interface",
    "description": "Overview interface for high-level insights and strategic knowledge graph exploration",
    "available_features": [
      "insight_generation",
      "pattern_analysis",
      "cross_view_navigation"
    ],
    "engagement_aware_instructions": {
      "general": "When user wants spatial visualization, suggest switching to cosmos view.",
      "use_transition_config": true
    }
  }
}
```

**Changes**:

- Remove hardcoded `suggestions` objects
- Add `"use_transition_config": true` flag
- Simplify `general` instructions to be view-agnostic

---

### Step 8: Update PromptBuilder to Load Transitions Dynamically

**File**: `services/dialogue-service/src/PromptBuilder.ts`

Modify `formatViewContext` to load transitions from config:

```typescript
private formatViewContext(viewContext?: ViewContext): string {
  if (!viewContext?.currentView) {
    return 'No specific view context.';
  }

  const viewConfig = this.loadViewSpecificInstructions();
  const currentViewConfig = viewConfig[viewContext.currentView];
  
  if (!currentViewConfig) {
    return `**Current View:** ${viewContext.currentView}`;
  }

  // Load available transitions from view_transitions.json
  const transitionsConfig = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'config', 'view_transitions.json'),
      'utf-8'
    )
  );

  // Filter transitions that start from current view
  const availableTransitions = Object.entries(transitionsConfig.transitions)
    .filter(([key, t]: [string, any]) => t.from === viewContext.currentView)
    .map(([key, t]: [string, any]) => ({
      transition_key: key,
      from: t.from,
      to: t.to,
      question_template: t.question_template,
      trigger_patterns: t.trigger_patterns,
      target_chat_size: t.target_chat_size
    }));

  const viewData = {
    current_view: viewContext.currentView,
    view_name: currentViewConfig.view_name,
    view_description: currentViewConfig.description,
    available_features: currentViewConfig.available_features || [],
    has_view_instructions: !!currentViewConfig.specific_instructions,
    specific_instructions: currentViewConfig.specific_instructions || '',
    has_suggested_actions: (currentViewConfig.suggested_actions?.length ?? 0) > 0,
    suggested_actions: currentViewConfig.suggested_actions || [],
    response_style: currentViewConfig.response_style || '',
    
    // NEW: Available transitions
    has_available_transitions: availableTransitions.length > 0,
    available_transitions: availableTransitions
  };

  return Mustache.render(this.templates.view_context_template, viewData);
}
```

**Changes**:

- Load `view_transitions.json` alongside `view_specific_instructions.json`
- Filter transitions where `from` matches `currentView`
- Add `has_available_transitions` and `available_transitions` to template data
- Remove hardcoded suggestions mapping

---

### Step 9: Update Prompt Template for Dynamic Transitions

**File**: `config/prompt_templates.yaml`

Update view_context_template to render transitions:

```yaml
view_context_template: |
  **Current View:** {{current_view}}
  **View Description:** {{view_description}}
  
  {{#has_available_transitions}}
  **Available View Transitions:**
  You can suggest switching to other views when appropriate. Available transitions from {{current_view}}:
  {{#available_transitions}}
  - **{{from}} → {{to}}**: Use question: "{{question_template}}"
    Trigger patterns: {{#trigger_patterns}}"{{.}}", {{/trigger_patterns}}
    Target chat size: {{target_chat_size}}
  {{/available_transitions}}
  
  **How to suggest transitions:**
  1. Detect if user's question matches trigger patterns
  2. Use the exact question_template for that transition
  3. Generate both on_confirm and on_dismiss scenarios
  4. Set target to destination view name
  5. System will automatically handle chat sizing and navigation
  {{/has_available_transitions}}
  
  {{#has_view_instructions}}
  **View-Specific Instructions:**
  {{specific_instructions}}
  {{/has_view_instructions}}
  
  {{#has_suggested_actions}}
  **Suggested Actions for This View:**
  {{#suggested_actions}}
  - {{.}}
  {{/suggested_actions}}
  {{/has_suggested_actions}}
  
  **Response Style:** {{response_style}}
```

**Changes**:

- Add `{{#has_available_transitions}}` block
- List all available transitions dynamically
- Include trigger patterns, question templates, and target chat sizes
- Add clear instructions for LLM on how to use transitions

---

### Step 10: Update Main Page to Handle Chat View Transitions

**File**: `apps/web-app/src/app/page.tsx`

Add transition content handling for chat and cards views:

```typescript
import { useViewTransitionContent } from '../hooks/useViewTransitionContent';

function HomePage() {
  // ... existing state ...
  
  // Handle transition content for chat view
  useViewTransitionContent(
    'chat',
    false, // chat is always loaded
    activeView === 'chat' // only ready when chat view is active
  );
  
  // Handle transition content for cards view
  useViewTransitionContent(
    'cards',
    isLoading && cards.length === 0, // loading state
    activeView === 'cards' && cards.length > 0 // ready when cards loaded
  );
  
  // Handle transition content for dashboard view
  useViewTransitionContent(
    'dashboard',
    false, // dashboard is always loaded
    activeView === 'dashboard' // only ready when dashboard view is active
  );
  
  // ... rest of component ...
}
```

**Changes**:

- Add `useViewTransitionContent` hook calls for chat, cards, and dashboard views
- Hook conditionally displays content based on `activeView` state

---

## Testing Plan

### Test 1: Chat → Cosmos Transition

1. Ask: "what's my cosmos shaping?"
2. Verify: Action buttons appear with "Should we go to Cosmos view together?"
3. Click "Yes"
4. Verify: Transition message appears, wait 1.5s, navigate to /cosmos
5. Verify: Main content appears, chat resizes to medium

### Test 2: Cosmos → Cards Transition

1. In cosmos, say: "create a card for this entity"
2. Verify: Action buttons appear
3. Click "Yes"
4. Verify: Transition to cards view, content appears, chat mini

### Test 3: Cards → Chat Transition

1. In cards, say: "let's discuss this in detail"
2. Verify: Action buttons appear
3. Click "Yes"
4. Verify: Navigate to main page, activeView='chat', chat large

### Test 4: Dismiss Scenario

1. Ask any transition-triggering question
2. Click "Maybe later"
3. Verify: Stay in current view, fallback response appears instantly

### Test 5: Rapid Switching

1. Click "Yes" for Chat → Cosmos
2. Before cosmos loads, navigate away
3. Navigate to cosmos later
4. Verify: No stale content appears (targetView check works)

### Test 6: Storage Key Collision

1. Click "Yes" for Chat → Cosmos
2. Immediately click "Yes" for Chat → Cards
3. Verify: Cards content overwrites cosmos content
4. Verify: Cosmos doesn't consume cards content (targetView mismatch)

---

## Files Summary

### New Files (5)

1. `config/view_transitions.json` - Central configuration
2. `apps/web-app/src/services/viewTransitionService.ts` - Generic service
3. `apps/web-app/src/hooks/useViewTransitionContent.ts` - Reusable hook

### Modified Files (7)

4. `apps/web-app/src/stores/HUDStore.ts` - Add `setChatSizeForView`
5. `apps/web-app/src/components/chat/ChatInterface.tsx` - Use ViewTransitionService
6. `apps/web-app/src/app/cosmos/CosmosScene.tsx` - Use generic hook
7. `apps/web-app/src/app/page.tsx` - Add hook calls for chat/cards/dashboard
8. `config/view_specific_instructions.json` - Reference transitions config
9. `services/dialogue-service/src/PromptBuilder.ts` - Load transitions dynamically
10. `config/prompt_templates.yaml` - Render transitions dynamically

---

## Success Criteria

- All 6 transitions work bidirectionally (12 total routes)
- Single global storage key (`viewTransitionContent`)
- No view-specific logic in implementation
- Chat size management is generic and extensible
- LLM receives dynamic transition config in prompt
- No backward compatibility code
- All tests pass

### To-dos

- [ ] Create config/view_transitions.json with all 6 transitions and view configs
- [ ] Create apps/web-app/src/services/viewTransitionService.ts with generic transition logic
- [ ] Add setChatSizeForView method to apps/web-app/src/stores/HUDStore.ts
- [ ] Create apps/web-app/src/hooks/useViewTransitionContent.ts reusable hook
- [ ] Update apps/web-app/src/components/chat/ChatInterface.tsx to use ViewTransitionService
- [ ] Update apps/web-app/src/app/cosmos/CosmosScene.tsx to use generic hook and remove old logic
- [ ] Update apps/web-app/src/app/page.tsx to add hook calls for chat/cards/dashboard views
- [ ] Update config/view_specific_instructions.json to reference transitions config
- [ ] Update services/dialogue-service/src/PromptBuilder.ts to load transitions dynamically
- [ ] Update config/prompt_templates.yaml to render transitions dynamically
- [ ] Run all 6 test scenarios to verify transitions work end-to-end