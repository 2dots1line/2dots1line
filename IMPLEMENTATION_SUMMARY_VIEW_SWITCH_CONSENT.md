# View Switch with User Consent - Implementation Summary

**Date**: 2025-10-11  
**Status**: Backend Complete - Ready for Frontend Integration  
**Feature**: Simplest Scenario - Chat → Cosmos View Switch with Two-Button Consent Pattern

## Overview

Implemented the simplest engagement-aware dialogue scenario: When a user asks cosmos-appropriate questions in the Chat view (e.g., "what's my cosmos shaping?", "how are my values driving my experience?"), the DialogueAgent suggests switching to Cosmos view with inline "Yes" and "Maybe later" buttons. Upon "Yes" click, the view switches and Dot greets the user proactively with context about what they'll explore together.

This serves as a **proof of concept** and establishes extensible infrastructure for future action types (cosmos quest, open card, focus entity, etc.).

## User Journey

1. **User in Chat view** asks: _"I wonder what my cosmos is shaping right now"_
2. **Agent responds**: _"That's a great question to explore visually. Should we go to Cosmos view together?"_
3. **Frontend displays** two inline pill buttons: **[Yes]** (green) and **[Maybe later]** (gray)
4. **User clicks "Yes"**
5. **Frontend switches** to Cosmos view
6. **Agent proactively greets**: _"Nice to see you again. As I mentioned, let me walk you through how your cosmos is shaping..."_

## Backend Changes Implemented

### 1. Configuration: View-Specific Instructions

**File**: `config/view_specific_instructions.json`

Added `engagement_aware_instructions` to Chat view only:

```json
{
  "chat": {
    "engagement_aware_instructions": {
      "general": "When user asks cosmos-appropriate questions, suggest switching to Cosmos view. Phrase as question with two button options.",
      "suggestions": {
        "switch_to_cosmos": "When user asks about spatial relationships, value patterns, memory landscape, or how concepts connect (e.g., 'what's my cosmos shaping?', 'how are my values driving my experience?'), ask: 'Should we go to Cosmos view together?' Provide two button options: 'Yes' and 'Maybe later'"
      }
    }
  }
}
```

**Design Decision**: Only Chat view has engagement instructions for now. Cosmos, Cards, and Dashboard views remain unchanged.

### 2. Prompt Template: Dynamic View Context

**File**: `config/prompt_templates.yaml`

**A. Enhanced `view_context_template`** (line 471-490):

Added conditional rendering for engagement-aware instructions:

```yaml
view_context_template: |
  **Current View:** {{current_view}}
  **View Description:** {{view_description}}
  
  {{#has_available_features}}
  **Available Features:**
  {{#available_features}}
  - {{.}}
  {{/available_features}}
  {{/has_available_features}}
  
  {{#has_engagement_aware_instructions}}
  **Context-Aware Suggestions:**
  {{engagement_aware_general}}
  
  **Available Actions:**
  {{#suggestion_examples}}
  - **{{action_type}}**: {{suggestion_template}}
  {{/suggestion_examples}}
  {{/has_engagement_aware_instructions}}
```

**B. Updated Section 3.8: Engagement Context Guidelines** (line 206-219):

Added concise guidelines for using engagement context appropriately:

```yaml
{{#engagement_context}}
## 3.8 ENGAGEMENT CONTEXT
Recent user interactions and engagement patterns:
{{engagement_context}}

**Guidelines for Using Engagement Context:**
- Use patterns to understand user's focus, but don't force connections
- When suggesting view switches, phrase as questions with two button options: "Yes" and "Maybe later"
- Suggest actions ONLY when genuinely helpful (max 1-2 per response)
- Don't reference engagement explicitly ("I see you clicked...") - inform understanding naturally
- Serve user's actual question first, not showcasing capabilities

**Available Actions**: switch_view (more action types will be added in future)
{{/engagement_context}}
```

**C. Added `ui_action_hints` Field to Response Schema** (line 123-155):

```yaml
RESPONSE FORMAT: Return ONLY a JSON object with this schema (no other text):
{
  "thought_process": "Your reasoning here...",
  "response_plan": {
    "decision": "respond_directly" | "query_memory",
    "key_phrases_for_retrieval": null | string[]
  },
  "turn_context_package": {
    "suggested_next_focus": "Next focus area",
    "emotional_tone_to_adopt": "Supportive and curious",
    "flags_for_ingestion": ["important_insight", "growth_moment"]
  },
  "ui_action_hints": [
    {
      "action": "switch_view",
      "question": "Exact question from your response (e.g., 'Should we go to Cosmos view together?')",
      "buttons": [
        {"label": "Yes", "value": "confirm"},
        {"label": "Maybe later", "value": "dismiss"}
      ],
      "target": "cosmos",
      "proactiveGreeting": "Greeting to show after view switch (e.g., 'Nice to see you again. As I mentioned, let me walk you through...')"
    }
  ],
  "direct_response_text": "Your response text here (include the question naturally)"
}

**UI Action Hints Guidelines:**
- Generate ui_action_hints array ONLY when genuinely helpful (usually empty)
- For view switches: phrase as question, provide two buttons ("Yes"/"Maybe later")
- Include proactiveGreeting for context continuity after switch
- Currently supported: switch_view only (more actions will be added later)
- Example: User asks "what's my cosmos shaping?" → Suggest switching to cosmos with proactive greeting
```

**D. Updated Streaming Structure Order** (line 172-177):

```yaml
7. **STRUCTURE_ORDER**: Maintain this exact order:
   - thought_process (first)
   - response_plan (second)
   - turn_context_package (third)
   - ui_action_hints (fourth, optional - empty array [] if no suggestions)
   - direct_response_text (last - final field)
```

### 3. PromptBuilder: Load Engagement Instructions

**File**: `services/dialogue-service/src/PromptBuilder.ts`

Modified `formatViewContext` method (line 551-596) to load and render engagement-aware instructions:

```typescript
private formatViewContext(viewContext: ViewContext, userName: string): string {
  const templates = this.configService.getAllTemplates();
  const template = templates.view_context_template;
  
  // Load view-specific configuration
  const viewConfig = this.loadViewSpecificInstructions(viewContext.currentView);
  
  // ... template checks ...

  try {
    const viewData = {
      current_view: viewContext.currentView,
      view_description: viewContext.viewDescription || this.getDefaultViewDescription(viewContext.currentView),
      user_name: userName,
      available_features: viewConfig?.available_features || [],
      has_available_features: viewConfig?.available_features?.length > 0,
      
      // NEW: Add engagement-aware instructions
      has_engagement_aware_instructions: !!viewConfig?.engagement_aware_instructions,
      engagement_aware_general: viewConfig?.engagement_aware_instructions?.general || '',
      suggestion_examples: viewConfig?.engagement_aware_instructions?.suggestions 
        ? Object.entries(viewConfig.engagement_aware_instructions.suggestions).map(([key, value]) => ({
            action_type: key.replace(/_/g, ' '),
            suggestion_template: value
          }))
        : []
    };
    
    return Mustache.render(template, viewData);
  } catch (error) {
    // ... error handling ...
  }
}
```

**Key Points**:
- Dynamically loads view-specific instructions from JSON file
- Transforms `suggestions` object into array for Mustache iteration
- Replaces underscores with spaces for display (e.g., `switch_to_cosmos` → `switch to cosmos`)

### 4. DialogueAgent: Parse Two-Button UI Actions

**File**: `services/dialogue-service/src/DialogueAgent.ts`

Updated `parseLLMResponse` method (line 801-856) to map `ui_action_hints` to `ui_actions`:

```typescript
private parseLLMResponse(llmResult: any): any {
  const rawText = llmResult.result.text;
  console.log('DialogueAgent - Raw LLM response:', rawText.substring(0, 200) + '...');
  
  try {
    // ... JSON extraction logic ...
    
    const parsed = JSON.parse(jsonText);
    
    // Map ui_action_hints to ui_actions with two-button pattern for frontend compatibility
    if (parsed.ui_action_hints && Array.isArray(parsed.ui_action_hints)) {
      parsed.ui_actions = parsed.ui_action_hints.map((hint: any) => ({
        action: hint.action,
        question: hint.question || '',
        buttons: hint.buttons || [
          {label: 'Yes', value: 'confirm'},
          {label: 'Maybe later', value: 'dismiss'}
        ],
        payload: {
          target: hint.target,
          proactiveGreeting: hint.proactiveGreeting || '',
          priority: hint.priority || 'medium'
        }
      }));
      
      // Log view switch suggestions for monitoring
      const viewSwitchHints = parsed.ui_action_hints.filter((h: any) => h.action === 'switch_view');
      if (viewSwitchHints.length > 0) {
        console.log('🔀 DialogueAgent - View switch suggestion generated:', viewSwitchHints);
      }
    } else if (!parsed.ui_actions) {
      // Ensure ui_actions array always exists for frontend
      parsed.ui_actions = [];
    }
    
    return parsed;
    
  } catch (e) {
    // ... error handling ...
  }
}
```

**Key Points**:
- Transforms LLM's `ui_action_hints` into frontend-compatible `ui_actions` structure
- Ensures `ui_actions` always exists (empty array if no suggestions)
- Adds default button structure if missing
- Logs view switch suggestions for monitoring

## Frontend Integration Guide

The backend now returns `ui_actions` array in the dialogue response. Frontend needs to:

### 1. Response Structure

```typescript
interface DialogueResponse {
  direct_response_text: string; // Stream this to chat
  ui_actions: Array<{
    action: 'switch_view';
    question: string; // e.g., "Should we go to Cosmos view together?"
    buttons: Array<{
      label: string; // "Yes" or "Maybe later"
      value: 'confirm' | 'dismiss';
    }>;
    payload: {
      target: string; // "cosmos"
      proactiveGreeting: string; // Greeting to show after switch
      priority?: string;
    };
  }>;
}
```

### 2. Button Rendering (Inline Pill Design)

**Visual Design**:
```
Agent: That's a great question to explore visually. 
Should we go to Cosmos view together? [Yes] [Maybe later]
```

**Button Styling Specifications**:
- **Shape**: Rounded pill button (high border-radius)
- **Size**: Compact - `padding: 6px 16px`, `border-radius: 20px`, `font-size: 14px`
- **Position**: Inline with text, immediately after question, `margin-left: 8px`
- **Design System**: Glassmorphic style matching chat modal and seed entities panel
  - **"Yes" button**: 
    - Background: `rgba(74, 222, 128, 0.1)` (subtle green tint)
    - Border: `1px solid rgba(74, 222, 128, 0.3)`
    - Text: Green (`text-green-400`)
  - **"Maybe later" button**:
    - Background: `rgba(156, 163, 175, 0.1)` (subtle gray tint)
    - Border: `1px solid rgba(156, 163, 175, 0.3)`
    - Text: Gray (`text-gray-400`)
  - Backdrop filter: `blur(12px)`
- **Hover State**: 
  - Scale: `transform: scale(1.05)`
  - Glow: `box-shadow: 0 0 12px rgba(74, 222, 128, 0.4)` (green for Yes)
  - Transition: `all 0.2s ease`
- **Active State**: Slight press effect (`scale(0.95)`)

**Implementation Pseudo-Code**:

```tsx
// In ChatInterface component
{message.ui_actions && message.ui_actions.length > 0 && (
  <span className="inline-flex items-center gap-2 ml-2">
    {message.ui_actions[0].buttons.map((button, index) => (
      <button
        key={index}
        onClick={() => handleButtonClick(message.ui_actions[0], button.value)}
        className={`inline-flex items-center px-4 py-1.5 rounded-full
                   backdrop-blur-sm border text-sm font-medium
                   transition-all duration-200 ease-in-out
                   hover:scale-105 active:scale-95
                   ${button.value === 'confirm' 
                     ? 'bg-green-500/10 border-green-400/30 text-green-400 hover:shadow-[0_0_12px_rgba(74,222,128,0.4)]'
                     : 'bg-gray-500/10 border-gray-400/30 text-gray-400 hover:shadow-[0_0_12px_rgba(156,163,175,0.4)]'
                   }`}
        aria-label={`${button.label}: ${message.ui_actions[0].question}`}
      >
        {button.label}
      </button>
    ))}
  </span>
)}
```

### 3. Action Execution Logic

```tsx
function handleButtonClick(action: UiAction, buttonValue: 'confirm' | 'dismiss') {
  if (buttonValue === 'dismiss') {
    // Just remove/hide the buttons
    // (buttons could disappear or be replaced with "Not now" text)
    return;
  }
  
  if (buttonValue === 'confirm' && action.action === 'switch_view') {
    // 1. Store proactive greeting for display in target view
    sessionStorage.setItem('proactiveGreeting', action.payload.proactiveGreeting);
    
    // 2. Switch to target view
    router.push(`/${action.payload.target}`); // e.g., /cosmos
    
    // 3. Optional: Track user consent for analytics
    trackEvent('view_switch_consent', {
      from: 'chat',
      to: action.payload.target,
      question: action.question
    });
  }
}
```

### 4. Proactive Greeting in Cosmos View

```tsx
// In CosmosScene.tsx or similar
useEffect(() => {
  const greeting = sessionStorage.getItem('proactiveGreeting');
  if (greeting) {
    // Display greeting in chat modal automatically
    // This could be:
    // - A system message in the chat
    // - An auto-opened chat with the greeting
    // - A toast notification with the greeting
    displayProactiveMessage(greeting);
    
    // Clear after use
    sessionStorage.removeItem('proactiveGreeting');
  }
}, []);

function displayProactiveMessage(greeting: string) {
  // Example: Add system message to chat
  addSystemMessage({
    role: 'assistant',
    content: greeting,
    timestamp: Date.now()
  });
  
  // Example: Auto-open chat modal if closed
  if (!isChatOpen) {
    setChatOpen(true);
  }
}
```

### 5. Accessibility

- `aria-label`: "Confirm: Should we go to Cosmos view together?" or "Dismiss: Maybe later"
- `role="button"` (already implied by `<button>`)
- Keyboard navigation: Enter/Space to activate
- Focus visible state for keyboard users
- Screen reader announces button purpose and action

## Testing Scenarios

### 1. Basic Flow - Cosmos-Appropriate Question

**Steps**:
1. Open Chat view
2. User asks: _"I wonder what my cosmos is shaping right now"_
3. **Expected**: Agent suggests view switch with two buttons
4. User clicks "Yes"
5. **Expected**: View switches to Cosmos, proactive greeting appears

**Validation**:
- [ ] Agent detects cosmos-appropriate question
- [ ] Agent phrases suggestion as question
- [ ] Two buttons appear inline: "Yes" (green) and "Maybe later" (gray)
- [ ] "Yes" triggers view switch to Cosmos
- [ ] Proactive greeting appears in Cosmos after switch
- [ ] Greeting references earlier conversation context

### 2. Maybe Later - User Dismisses Suggestion

**Steps**:
1. User asks: _"How are my values driving my experience?"_
2. Agent suggests view switch
3. User clicks "Maybe later"
4. **Expected**: Buttons disappear, conversation continues in Chat view

**Validation**:
- [ ] "Maybe later" dismisses buttons without switching
- [ ] Conversation flow continues naturally
- [ ] No view switch occurs

### 3. No Suggestion - Unrelated Question

**Steps**:
1. User asks: _"What's the weather like today?"_
2. **Expected**: Agent responds directly, no buttons appear

**Validation**:
- [ ] Agent responds to question without suggesting view switch
- [ ] No buttons appear
- [ ] Response is natural and helpful

### 4. Streaming + Consent - Response Order

**Steps**:
1. User asks cosmos-appropriate question
2. Observe streaming behavior

**Validation**:
- [ ] `direct_response_text` streams to chat first
- [ ] Buttons appear after streaming completes
- [ ] No visual glitches or button flickering
- [ ] Response feels natural and fluid

### 5. Multiple Suggestions (Future)

**Steps**:
1. User asks complex question that could trigger multiple suggestions
2. **Expected**: Agent provides at most 1-2 suggestions (per guidelines)

**Validation**:
- [ ] Agent respects "max 1-2 per response" guideline
- [ ] If multiple suggestions, they don't conflict
- [ ] UI handles multiple button sets gracefully

## Backend Validation Checklist

- [x] View-specific instructions added to `view_specific_instructions.json`
- [x] Prompt template enhanced with engagement guidelines
- [x] `ui_action_hints` schema added to response format
- [x] PromptBuilder loads and renders engagement instructions
- [x] DialogueAgent parses and maps `ui_action_hints` to `ui_actions`
- [x] Linter passes with no errors
- [x] Logging added for monitoring view switch suggestions

## Frontend Implementation Checklist

- [ ] Parse `ui_actions` array from dialogue response
- [ ] Render inline pill buttons after streamed text
- [ ] Style buttons with glassmorphic design (green "Yes", gray "Maybe later")
- [ ] Implement button click handlers (confirm vs. dismiss)
- [ ] Store `proactiveGreeting` in sessionStorage on "Yes" click
- [ ] Switch to target view using router
- [ ] Display proactive greeting in Cosmos view
- [ ] Clear sessionStorage after greeting displayed
- [ ] Add accessibility features (aria-labels, keyboard support)
- [ ] Test all 5 scenarios

## Future Enhancements (Not in This PR)

- [ ] Add more action types: `start_cosmos_quest`, `open_card`, `focus_entity`, `highlight_cluster`
- [ ] Add engagement-aware instructions to Cosmos, Cards, and Dashboard views
- [ ] Add cross-view suggestions (Cosmos → Chat, Dashboard → Cosmos, etc.)
- [ ] Add "Tell me more" button for complex actions
- [ ] Add user preferences ("Always allow" for trusted actions)
- [ ] Add voice command support ("Yes" via speech)
- [ ] Add analytics tracking for suggestion acceptance rates

## Key Design Decisions

1. **Start Simple**: Only one action type (`switch_view`), one direction (Chat → Cosmos), two buttons
2. **User Consent First**: Clear "Yes" / "Maybe later" choice - no auto-execution
3. **Context Continuity**: Proactive greeting maintains conversation flow after view switch
4. **LLM Judgment**: Agent decides when to suggest based on question content, not hard-coded rules
5. **Extensible Infrastructure**: Pattern established for future action types
6. **Inline Design**: Buttons appear inline with text for natural reading flow
7. **Glassmorphic Style**: Consistent with existing design system (chat modal, seed entities panel)

## Notes

- Backend is **complete and ready** for frontend integration
- No breaking changes to existing functionality
- `ui_actions` array is always present (empty if no suggestions)
- LLM will **not** suggest view switches for unrelated questions
- Guidelines emphasize quality over quantity (max 1-2 suggestions per response)
- This implementation serves as **proof of concept** for more complex engagement-aware features

## Questions for Frontend Team

1. **Proactive Greeting Display**: What's the preferred UX for displaying the greeting in Cosmos view?
   - System message in chat?
   - Auto-open chat modal?
   - Toast notification?
   - Animated text overlay?

2. **Button Dismissal**: What happens after "Maybe later" is clicked?
   - Buttons disappear?
   - Replaced with "Not now" text?
   - Fade out animation?

3. **Multiple Suggestions**: How should UI handle multiple button sets (future)?
   - Stack vertically?
   - Separate lines?
   - Grouped by action type?

4. **Analytics**: What events should be tracked?
   - Suggestion shown?
   - Button clicked (Yes/Maybe later)?
   - View switch completed?
   - Greeting displayed?

## Contact

For questions or clarifications, refer to:
- Plan document: `/plan.md`
- Original implementation summary in chat history
- Configuration files: `config/view_specific_instructions.json`, `config/prompt_templates.yaml`

