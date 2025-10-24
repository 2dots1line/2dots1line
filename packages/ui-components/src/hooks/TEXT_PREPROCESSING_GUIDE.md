# Text Preprocessing for TTS Guide

## Problem Solved

**Before**: TTS was reading markdown content including entity chips, resulting in cluttered speech like:
> "Your journey through the cosmos views, cosmos views, concept, memory unit, artifact..."

**After**: Clean, natural speech that focuses on the actual content:
> "Your journey through the cosmos. Welcome to your personal cosmic journey..."

## Key Improvements

### **1. Entity Chip Removal**
- **Pattern**: `@[displayText](id:type)` → Removed completely
- **Pattern**: `@[displayText](url)` → Removed completely
- **Result**: No more "cosmos views, cosmos views, concept" in speech

### **2. Markdown Formatting Cleanup**
- **Bold/Italic**: `**text**` → `text`
- **Code**: `` `code` `` → Removed
- **Headers**: `# Header` → Removed
- **Links**: `[text](url)` → Removed
- **Lists**: `- item` → Removed
- **Tables**: `| row |` → Removed

### **3. Technical Term Filtering**
Removes common technical terms that clutter speech:
- `concept`, `memory_unit`, `artifact`, `growth_event`
- `cosmos_views`, `app`, `dashboard`, `chat`, `cards`
- `entity`, `entities`, `reference`, `references`
- Programming terms: `data`, `id`, `type`, `url`, `api`, etc.

### **4. Natural Speech Rhythm**
- **Sentence Pauses**: `.` → `. ` (adds pause after sentences)
- **Question Pauses**: `?` → `? ` (adds pause after questions)
- **Exclamation Pauses**: `!` → `! ` (adds pause after exclamations)
- **Comma Pauses**: `,` → `, ` (adds slight pause after commas)

## Configuration Options

### **Basic Usage (Default)**
```typescript
const { speak } = useTextToSpeech({
  rate: 0.8,
  pitch: 1.0,
  volume: 0.9
});
// Automatically cleans markdown and removes entities
```

### **Preserve Entity Names**
```typescript
const { speak } = useTextToSpeech({
  rate: 0.8,
  pitch: 1.0,
  volume: 0.9,
  preserveEntities: true // Keeps entity names but removes markdown syntax
});
// @[cosmos views](id:concept) → "cosmos views"
```

### **Disable Markdown Cleaning**
```typescript
const { speak } = useTextToSpeech({
  rate: 0.8,
  pitch: 1.0,
  volume: 0.9,
  cleanMarkdown: false // Keeps all markdown formatting
});
// Reads markdown as-is (not recommended for TTS)
```

### **Full Control**
```typescript
const { speak } = useTextToSpeech({
  rate: 0.8,
  pitch: 1.0,
  volume: 0.9,
  preserveEntities: false, // Remove entities completely
  cleanMarkdown: true     // Clean markdown formatting
});
```

## Examples

### **Before Preprocessing**
```
Your journey through the cosmos views, cosmos views, concept. This month, we've witnessed remarkable growth across all dimensions of your being. Your conversations have revealed patterns of self-discovery that speak to a deeper understanding of your place in the universe, memory unit, artifact.
```

### **After Preprocessing (Default)**
```
Your journey through the cosmos. This month, we've witnessed remarkable growth across all dimensions of your being. Your conversations have revealed patterns of self-discovery that speak to a deeper understanding of your place in the universe.
```

### **After Preprocessing (Preserve Entities)**
```
Your journey through the cosmos views. This month, we've witnessed remarkable growth across all dimensions of your being. Your conversations have revealed patterns of self-discovery that speak to a deeper understanding of your place in the universe.
```

## Supported Patterns

### **Entity Chips**
- `@[displayText](id:type)` → Removed or kept as `displayText`
- `@[displayText](url)` → Removed or kept as `displayText`

### **Markdown Elements**
- `**bold**` → `bold`
- `*italic*` → `italic`
- `` `code` `` → Removed
- `# Header` → Removed
- `[link](url)` → Removed
- `- list item` → Removed
- `1. numbered item` → Removed
- `> quote` → Removed
- `| table |` → Removed

### **Technical Terms**
- Entity types: `concept`, `memory_unit`, `artifact`, `growth_event`
- App terms: `cosmos_views`, `app`, `dashboard`, `chat`, `cards`
- Generic terms: `entity`, `entities`, `reference`, `references`
- Programming terms: `data`, `id`, `type`, `url`, `api`, etc.

## Performance

- **Lightweight**: Text preprocessing is fast and efficient
- **Configurable**: Can be disabled for performance if needed
- **Cached**: Uses useCallback for optimal performance
- **Memory Efficient**: No large regex patterns or complex operations

## Browser Compatibility

- **All Browsers**: Works with any browser that supports TTS
- **No Dependencies**: Uses native JavaScript string methods
- **Fallback Safe**: Gracefully handles edge cases

## Testing

### **Test Different Content Types**
```typescript
// Test with entity-heavy content
const entityContent = "Your journey through @[cosmos views](id:concept) and @[memory units](id:memory_unit)";

// Test with markdown content
const markdownContent = "**Bold text** and *italic text* with `code` and [links](url)";

// Test with mixed content
const mixedContent = "Your **journey** through @[cosmos views](id:concept) and `technical terms`";
```

### **Verify Speech Quality**
1. **Open Dashboard**: Click Dashboard button
2. **Go to Opening Tab**: Navigate to Opening tab
3. **Click Listen**: Test the speech quality
4. **Compare**: Notice the difference in clarity

## Future Enhancements

### **1. Smart Entity Handling**
- Detect entity importance
- Keep only relevant entities
- Remove redundant references

### **2. Content-Aware Preprocessing**
- Different rules for different content types
- Preserve important technical terms
- Remove only clutter

### **3. User Preferences**
- Allow users to configure what to remove
- Save preferences per user
- A/B testing for optimal settings

## Current Status

✅ **Entity Chips**: Completely removed from speech
✅ **Markdown**: Cleaned and formatted for natural speech
✅ **Technical Terms**: Filtered out clutter
✅ **Natural Rhythm**: Added pauses for better flow
✅ **Configurable**: Options for different use cases
✅ **Performance**: Fast and efficient
✅ **Browser Compatible**: Works everywhere

The TTS now provides a clean, natural listening experience without the clutter of markdown formatting and entity references!
