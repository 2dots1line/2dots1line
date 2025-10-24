# TTS Entity Chip Improvement Demo

## Problem Fixed

**Before**: Entity chips were completely removed, losing meaningful content
**After**: Entity chip content is preserved while removing technical syntax

## Examples

### **Input Text**
```
Your journey through @[cosmos views](id:concept) and @[memory units](id:memory_unit) reveals patterns of @[self-discovery](id:artifact).
```

### **Before (Too Aggressive)**
```
Your journey through and reveals patterns of .
```
❌ **Lost meaningful content**: "cosmos views", "memory units", "self-discovery"

### **After (Smart Processing)**
```
Your journey through cosmos views and memory units reveals patterns of self-discovery.
```
✅ **Preserved meaningful content**: Keeps the human-readable text from entity chips

## Technical Details

### **Entity Chip Processing**
- **Pattern**: `@[displayText](id:type)` → `displayText`
- **Pattern**: `@[displayText](url)` → `displayText`
- **Result**: Keeps the meaningful content, removes technical syntax

### **What Gets Removed**
- Technical markdown syntax: `@[...](...)`
- Programming terms: `data`, `id`, `type`, `url`, `api`, etc.
- App-specific clutter: `cosmos_views`, `app`, `dashboard`, `chat`

### **What Gets Preserved**
- Meaningful entity names: "cosmos views", "memory units", "self-discovery"
- Content words: "concept", "memory", "artifact" (when they add value)
- All actual content and context

## Testing

### **Test Case 1: Entity Chips**
```
Input: "Your journey through @[cosmos views](id:concept)"
Output: "Your journey through cosmos views"
```

### **Test Case 2: Mixed Content**
```
Input: "Explore @[memory units](id:memory_unit) and @[growth events](id:growth_event)"
Output: "Explore memory units and growth events"
```

### **Test Case 3: Complex Text**
```
Input: "Your @[cosmic journey](id:concept) through @[self-discovery](id:artifact) reveals @[growth patterns](id:growth_event)"
Output: "Your cosmic journey through self-discovery reveals growth patterns"
```

## Configuration Options

### **Default (Recommended)**
```typescript
const { speak } = useTextToSpeech({
  rate: 0.8,
  pitch: 1.0,
  volume: 0.9
});
// Automatically preserves entity content while removing technical syntax
```

### **Disable Preprocessing (Not Recommended)**
```typescript
const { speak } = useTextToSpeech({
  rate: 0.8,
  pitch: 1.0,
  volume: 0.9,
  cleanMarkdown: false
});
// Reads markdown as-is (will include technical syntax)
```

## Benefits

✅ **Preserves Meaning**: Keeps important content from entity chips
✅ **Removes Clutter**: Eliminates technical markdown syntax
✅ **Natural Speech**: Sounds like human conversation
✅ **Context Aware**: Maintains the flow and meaning of text
✅ **Configurable**: Can be customized for different use cases

## Current Status

The TTS now intelligently processes entity chips to preserve meaningful content while removing technical clutter, providing a much better listening experience!
