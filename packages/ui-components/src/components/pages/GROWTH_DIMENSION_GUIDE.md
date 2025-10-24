# Growth Dimension Guide

## 🎯 Growth Dimension Feature

I've added a **growth dimension** field to the `GrowthEventCard` component to categorize and highlight the specific area of personal development using the **6D Growth Model**.

### **What is Growth Dimension?**

Growth dimensions are **categorical labels** that identify the specific area of personal growth demonstrated in each growth event using the **6D Growth Model**:

- **Self Knowledge** (`self_know`): Understanding one's internal landscape
- **Self Action** (`self_act`): Taking actions to benefit oneself  
- **Self Expression** (`self_show`): Expressing one's inner truth
- **World Knowledge** (`world_know`): Learning about the external environment
- **World Action** (`world_act`): Contributing to the wider world
- **World Expression** (`world_show`): Sharing insights with others

## 🎨 Visual Design

### **Growth Dimension Display**
```typescript
{growthDimension && (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 bg-green-400 rounded-full" />
    <span className="text-xs text-white/80 font-medium">{growthDimension}</span>
  </div>
)}
```

### **Visual Hierarchy**
1. **Growth Dimension**: Green dot + label (top priority)
2. **Date**: Calendar icon + date (secondary)

### **Color Coding**
- **Green Dot**: Growth dimension (primary focus)
- **Calendar Icon**: Date information (secondary)

## 📊 Usage Examples

### **Self Knowledge Growth**
```typescript
<GrowthEventCard
  title="Self Knowledge Breakthrough"
  content="You've gained deeper insights into your own thought patterns..."
  date="This Week"
  growthDimension="self_know"
  cardCover="https://example.com/image.jpg"
  isSupported={true}
  onPlay={() => speak(content)}
  onPause={() => stop()}
/>
```

### **World Action Growth**
```typescript
<GrowthEventCard
  title="World Action Impact"
  content="You've taken meaningful action to contribute to your community..."
  date="Last Week"
  growthDimension="world_act"
  cardCover="https://example.com/image.jpg"
  isSupported={true}
  onPlay={() => speak(content)}
  onPause={() => stop()}
/>
```

### **Self Expression Development**
```typescript
<GrowthEventCard
  title="Self Expression Growth"
  content="You've become more authentic in expressing your true thoughts..."
  date="This Month"
  growthDimension="self_show"
  cardCover="https://example.com/image.jpg"
  isSupported={true}
  onPlay={() => speak(content)}
  onPause={() => stop()}
/>
```

## 🎯 Growth Dimension Categories

### **6D Growth Model Dimensions**

#### **Self Knowledge** (`self_know`)
- Understanding one's internal landscape
- Self-reflection and introspection
- Recognizing personal patterns and behaviors
- **Examples**: "I noticed I was getting frustrated and took a step back", "I realized I was projecting my own fears"

#### **Self Action** (`self_act`)
- Taking actions to benefit oneself
- Personal habit formation and improvement
- Self-care and personal development
- **Examples**: "I started a daily meditation practice", "I improved my sleep schedule"

#### **Self Expression** (`self_show`)
- Expressing one's inner truth
- Authentic communication of thoughts and feelings
- Creative self-expression
- **Examples**: "I shared my true feelings with my partner", "I expressed my ideas through writing"

#### **World Knowledge** (`world_know`)
- Learning about the external environment
- Understanding systems and how the world works
- Gaining knowledge about others and society
- **Examples**: "I learned about climate change impacts", "I studied how organizations work"

#### **World Action** (`world_act`)
- Contributing to the wider world
- Taking action for community and environment
- Making a positive impact on others
- **Examples**: "I volunteered at the local food bank", "I organized a community cleanup"

#### **World Expression** (`world_show`)
- Sharing insights with others
- Contributing to collective knowledge
- Teaching and mentoring others
- **Examples**: "I shared my expertise with colleagues", "I mentored a junior team member"

## 🔧 Implementation Details

### **Props Interface**
```typescript
export interface GrowthEventCardProps {
  title: string;
  content: string;
  date?: string;
  growthDimension?: string; // One of the 6 growth dimensions: self_know, self_act, self_show, world_know, world_act, world_show
  cardCover?: string;
  onPlay?: () => void;
  onPause?: () => void;
  isPlaying?: boolean;
  isSupported?: boolean;
  className?: string;
}
```

### **Display Logic**
```typescript
{/* Growth Dimension */}
{growthDimension && (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 bg-green-400 rounded-full" />
    <span className="text-xs text-white/80 font-medium">{growthDimension}</span>
  </div>
)}
```

### **Layout Structure**
```
┌─────────────────────────────────┐
│ [Title]                    [▶] │
│                                 │
│ Content text here...            │
│                                 │
│ ● Self Knowledge               │ ← Growth Dimension
│ 📅 This Week                   │ ← Date
└─────────────────────────────────┘
```

## 📱 Mobile Optimization

### **Responsive Design**
- **Growth Dimension**: Always visible and prominent
- **Touch Targets**: Minimum 44px for interactive elements
- **Text Sizing**: Readable on small screens
- **Color Contrast**: High contrast for accessibility

### **Visual Hierarchy**
1. **Growth Dimension**: Most prominent (green dot + bold text)
2. **Content**: Main focus area
3. **Metadata**: Date and significance (secondary)

## 🎨 Design System Integration

### **Color Palette**
- **Green**: Growth dimension (primary)
- **Blue**: Significance (secondary)
- **White/80**: Text (tertiary)
- **White/70**: Metadata (quaternary)

### **Typography**
- **Growth Dimension**: `text-xs font-medium` (bold, small)
- **Date**: `text-xs` (regular, small)
- **Significance**: `text-xs` (regular, small)

### **Spacing**
- **Gap**: `gap-2` between dot and text
- **Margin**: `space-y-2` between elements
- **Padding**: Consistent with card design

## 🚀 Advanced Usage

### **Dynamic Growth Dimensions**
```typescript
const growthDimensions = [
  'Emotional Intelligence',
  'Communication', 
  'Self-Awareness',
  'Resilience',
  'Empathy',
  'Leadership',
  'Creativity',
  'Critical Thinking'
];

const getGrowthDimension = (eventType: string) => {
  // Logic to determine growth dimension based on event type
  return growthDimensions.find(dim => 
    eventType.toLowerCase().includes(dim.toLowerCase())
  );
};
```

### **Growth Dimension Analytics**
```typescript
const analyzeGrowthDimensions = (events: GrowthEvent[]) => {
  const dimensionCounts = events.reduce((acc, event) => {
    const dimension = event.growthDimension;
    acc[dimension] = (acc[dimension] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return dimensionCounts;
};
```

### **Filtering by Growth Dimension**
```typescript
const filterByDimension = (events: GrowthEvent[], dimension: string) => {
  return events.filter(event => 
    event.growthDimension === dimension
  );
};
```

## 📊 Data Integration

### **Database Schema**
```sql
-- Growth events table
CREATE TABLE growth_events (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  date TIMESTAMP,
  significance DECIMAL(3,2),
  growth_dimension VARCHAR(100), -- NEW FIELD
  card_cover_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **API Response**
```typescript
interface GrowthEventResponse {
  id: string;
  title: string;
  content: string;
  date: string;
  significance: number;
  growthDimension: string; // NEW FIELD
  cardCover: string;
}
```

## 🎯 Benefits

### **User Experience**
- **Clear Categorization**: Users understand what type of growth occurred
- **Visual Hierarchy**: Growth dimension is prominently displayed
- **Consistent Design**: Follows established design patterns
- **Accessibility**: High contrast and readable text

### **Analytics & Insights**
- **Growth Tracking**: Track progress across different dimensions
- **Pattern Recognition**: Identify areas of strength and growth
- **Personalized Content**: Tailor content based on growth dimensions
- **Progress Visualization**: Show growth across multiple dimensions

### **Content Management**
- **Categorization**: Organize growth events by dimension
- **Filtering**: Filter content by growth dimension
- **Search**: Find events by specific growth areas
- **Recommendations**: Suggest related content based on dimensions

The growth dimension feature provides clear categorization and visual hierarchy for growth events, making it easier for users to understand and track their personal development across different areas!
