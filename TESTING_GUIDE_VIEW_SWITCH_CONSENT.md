# Testing Guide: View Switch with User Consent

**Date**: 2025-10-11  
**Status**: Ready for Testing  
**Feature**: Simplest Scenario - Chat → Cosmos View Switch with Two-Button Consent Pattern

## Overview

This guide provides step-by-step testing instructions for the new engagement-aware dialogue feature. The backend and frontend are both complete and ready for end-to-end testing.

## What Was Implemented

### Backend (Completed ✅)
- View-specific instructions for Chat view with `switch_to_cosmos` suggestion
- Enhanced prompt template with engagement guidelines and `ui_action_hints` schema
- PromptBuilder loads and renders engagement-aware instructions
- DialogueAgent parses `ui_action_hints` and maps to `ui_actions`

### Frontend (Completed ✅)
- ChatInterface displays inline pill buttons ("Yes"/"Maybe later") with glassmorphic design
- Action handler executes view switching and stores proactive greeting
- CosmosScene checks for and displays proactive greeting
- Full integration with streaming dialogue workflow

## Test Environment Setup

### 1. Start All Services

```bash
cd /Users/danniwang/Documents/GitHub/202506062D1L/2D1L

# Start Docker services
docker-compose -f docker-compose.dev.yml up -d

# Start PM2 processes
pm2 start ecosystem.config.js

# Start web-app dev server
cd apps/web-app
pnpm dev
```

### 2. Verify Services

```bash
# Check Docker containers
docker ps

# Check PM2 processes
pm2 status

# Check web-app is running on http://localhost:3000
```

## Test Scenarios

### Scenario 1: Basic Flow - Cosmos-Appropriate Question

**Objective**: Verify agent detects cosmos-appropriate question and suggests view switch with buttons

**Steps**:
1. Open browser to `http://localhost:3000`
2. Open Chat interface (full or medium size)
3. Send message: _"I wonder what my cosmos is shaping right now"_
4. **Expected**:
   - Agent responds with text that includes a question like: _"Should we go to Cosmos view together?"_
   - Two inline pill buttons appear after the question: **[Yes]** (green) and **[Maybe later]** (gray)
   - Buttons have glassmorphic styling (semi-transparent, blur effect)
   - Green "Yes" button glows on hover
   - Gray "Maybe later" button also has hover effect

**Validation Checklist**:
- [ ] Agent's response includes natural question about switching views
- [ ] "Yes" button is green with glassmorphic style
- [ ] "Maybe later" button is gray with glassmorphic style
- [ ] Both buttons have hover effects (scale + glow)
- [ ] Buttons appear inline with text, not as a separate block
- [ ] Buttons do not overlap with other UI elements

**Console Logs to Check**:
```
🔀 DialogueAgent - View switch suggestion generated: [...]
🎬 ChatInterface: Received ui_actions: [...]
```

### Scenario 2: User Confirms - View Switch + Proactive Greeting

**Objective**: Verify "Yes" button triggers view switch and displays proactive greeting

**Steps**:
1. Complete Scenario 1 to get the buttons
2. Click **"Yes"** button
3. **Expected**:
   - View immediately switches to Cosmos (`/cosmos` route)
   - Cosmos scene loads
   - Console shows proactive greeting retrieval
   - Greeting is logged (and should be displayed in chat if chat is open)

**Validation Checklist**:
- [ ] Clicking "Yes" triggers view switch to Cosmos
- [ ] No errors in console
- [ ] Cosmos loads successfully
- [ ] Proactive greeting is retrieved from sessionStorage
- [ ] Greeting includes context from earlier conversation (e.g., "As I mentioned, let me walk you through...")

**Console Logs to Check**:
```
🔘 ChatInterface: User confirmed action: {...}
🔘 ChatInterface: Stored proactive greeting: ...
🔘 ChatInterface: Switching to view: cosmos
🌌 CosmosScene: Found proactive greeting: ...
```

**Note**: Currently, the proactive greeting is logged to console. Full chat integration in Cosmos view can be added in a follow-up iteration.

### Scenario 3: User Dismisses - "Maybe Later"

**Objective**: Verify "Maybe later" button dismisses suggestion without switching

**Steps**:
1. Complete Scenario 1 to get the buttons
2. Click **"Maybe later"** button
3. **Expected**:
   - Buttons remain (or could be hidden with additional logic)
   - View does NOT switch
   - Conversation continues in Chat view
   - User can continue asking questions

**Validation Checklist**:
- [ ] Clicking "Maybe later" does NOT switch views
- [ ] User remains in Chat view
- [ ] No errors in console
- [ ] User can send another message normally

**Console Logs to Check**:
```
🔘 ChatInterface: User dismissed action suggestion
```

### Scenario 4: No Suggestion - Unrelated Question

**Objective**: Verify agent does NOT suggest view switch for unrelated questions

**Steps**:
1. Open Chat interface
2. Send message: _"What's the weather like today?"_
3. **Expected**:
   - Agent responds to question normally
   - NO buttons appear
   - Response does not include view switch suggestion

**Validation Checklist**:
- [ ] Agent responds to unrelated question
- [ ] No "Yes"/"Maybe later" buttons appear
- [ ] Response is natural and helpful
- [ ] No view switch suggestion in response

**Console Logs to Check**:
- Should NOT see: `🔀 DialogueAgent - View switch suggestion`
- Should NOT see: `🎬 ChatInterface: Received ui_actions`

### Scenario 5: Multiple Cosmos-Appropriate Questions

**Objective**: Verify agent doesn't force suggestions too frequently

**Steps**:
1. Send: _"Tell me about my cosmos"_
2. (Agent suggests, user dismisses with "Maybe later")
3. Send another cosmos-related question: _"How are my memories connected?"_
4. **Expected**:
   - Agent may or may not suggest again (uses LLM judgment)
   - Agent prioritizes answering the question
   - If suggestion appears, it feels natural, not forced

**Validation Checklist**:
- [ ] Agent doesn't suggest view switch for EVERY cosmos question
- [ ] Suggestions feel natural and helpful, not mechanical
- [ ] Agent answers user's actual question first
- [ ] Maximum 1-2 suggestions per response

### Scenario 6: Streaming + Buttons

**Objective**: Verify buttons appear smoothly after streaming completes

**Steps**:
1. Send cosmos-appropriate question
2. Watch streaming behavior
3. **Expected**:
   - Response text streams naturally
   - Buttons appear AFTER streaming completes
   - No visual glitches or button flickering
   - Buttons don't cause layout shift

**Validation Checklist**:
- [ ] Text streams smoothly first
- [ ] Buttons appear after streaming ends
- [ ] No layout shift when buttons appear
- [ ] No flickering or visual glitches
- [ ] Timing feels natural

## Additional Testing

### Edge Case: Multiple Actions (Future)

If agent returns multiple `ui_actions` (not typical for this simple scenario):
- [ ] Multiple button sets appear
- [ ] Each set is visually separated
- [ ] All buttons work independently
- [ ] No UI overlap or collision

### Accessibility Testing

- [ ] Buttons have appropriate `aria-label` attributes
- [ ] Buttons are keyboard accessible (Tab to focus, Enter/Space to activate)
- [ ] Focus visible state is clear
- [ ] Screen reader announces button purpose

### Responsive Testing

- [ ] Buttons display correctly in full-size chat
- [ ] Buttons display correctly in medium-size chat
- [ ] Buttons display correctly (or are hidden) in mini chat
- [ ] Buttons don't break layout on mobile viewport

### Error Handling

- [ ] If backend fails to return ui_actions, no buttons appear (graceful degradation)
- [ ] If view switch fails, error is logged but app doesn't crash
- [ ] If proactive greeting is missing, Cosmos still loads normally

## Debugging

### Backend Logs

Monitor DialogueAgent and PromptBuilder:

```bash
pm2 logs dialogue-service --lines 100
```

Look for:
- `🔀 DialogueAgent - View switch suggestion generated:`
- `PromptBuilder - formatViewContext`
- `DialogueAgent - parseLLMResponse`

### Frontend Logs

Open browser console and filter by:
- `ChatInterface`
- `CosmosScene`
- `🔘` (action buttons)
- `🌌` (cosmos scene)

### Check sessionStorage

```javascript
// In browser console after clicking "Yes"
sessionStorage.getItem('proactiveGreeting')
```

Should contain the greeting text.

### Check Response Structure

Add breakpoint or console.log in `ChatInterface.tsx` line ~426:

```typescript
if (response.ui_actions && response.ui_actions.length > 0) {
  console.log('🎬 Full response:', response);
  console.log('🎬 UI Actions:', response.ui_actions);
}
```

Expected structure:
```json
{
  "ui_actions": [{
    "action": "switch_view",
    "question": "Should we go to Cosmos view together?",
    "buttons": [
      {"label": "Yes", "value": "confirm"},
      {"label": "Maybe later", "value": "dismiss"}
    ],
    "payload": {
      "target": "cosmos",
      "proactiveGreeting": "Nice to see you again. As I mentioned...",
      "priority": "medium"
    }
  }]
}
```

## Known Limitations (Future Enhancements)

1. **Proactive Greeting Display**: Currently logs to console. Full integration with chat in Cosmos view requires:
   - Chat store method to add system message
   - Auto-open chat modal in Cosmos
   - Or display greeting as toast notification

2. **Button Dismissal**: Clicking "Maybe later" doesn't currently hide the buttons. Could add state management to remove buttons on dismiss.

3. **Voice Command**: No voice support yet for "Yes"/"Maybe later" responses.

4. **Preferences**: No "Always allow" or "Don't ask again" preferences yet.

## Success Criteria

The implementation is successful if:

1. ✅ Agent detects cosmos-appropriate questions in Chat view
2. ✅ Agent phrases suggestion as natural question
3. ✅ Two inline pill buttons appear with glassmorphic design
4. ✅ "Yes" button triggers view switch to Cosmos
5. ✅ Proactive greeting is stored and retrieved in Cosmos
6. ✅ "Maybe later" button dismisses without switching
7. ✅ Agent doesn't suggest for unrelated questions
8. ✅ Streaming + buttons work smoothly together
9. ✅ No console errors or visual glitches
10. ✅ Build passes and app runs without errors

## Next Steps After Testing

1. **User Feedback**: Test with real user interactions, gather feedback on:
   - Button placement (feels natural?)
   - Question phrasing (sounds conversational?)
   - Timing (not too frequent?)

2. **Expand to More Views**: Add engagement-aware instructions to:
   - Cosmos view (suggest cosmos quest, focus entity)
   - Cards view (suggest opening cards)
   - Dashboard view (suggest insights)

3. **Add More Action Types**:
   - `start_cosmos_quest` - Immersive guided tour
   - `open_card` - Open specific cards
   - `focus_entity` - Focus camera on entities

4. **Full Proactive Greeting Integration**:
   - Display greeting in chat modal in Cosmos
   - Or show as toast notification
   - Maintain context continuity

5. **Analytics**: Track metrics:
   - Suggestion acceptance rate
   - Most common action types
   - User engagement patterns

## Reporting Issues

If you encounter issues, please report:

1. **Scenario**: Which test scenario failed
2. **Steps**: Exact steps to reproduce
3. **Expected**: What you expected to happen
4. **Actual**: What actually happened
5. **Logs**: Relevant console logs (backend + frontend)
6. **Screenshot**: Visual evidence if applicable

File issues with tag: `feature:engagement-aware-dialogue`

---

**Happy Testing! 🚀**

