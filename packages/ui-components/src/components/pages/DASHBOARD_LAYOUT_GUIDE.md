# Dashboard Layout Guide

## 🎯 Complete Dashboard System

I've created a comprehensive dashboard layout system with automatic rotation and multiple interaction patterns for each section.

### **🔄 Auto-Rotation System**

#### **Four Section Navigation**
- **Opening**: Welcome content with hero audio card
- **Insights**: Dynamic insights with multiple layout options
- **Growth**: 6 growth dimensions with horizontal carousels
- **Prompts**: Proactive suggestions with same layout as insights

#### **Auto-Rotation Logic**
- **Default**: 8 seconds per section
- **User Interaction**: Pauses auto-rotation for 30 seconds
- **Manual Override**: Users can click section tabs to navigate
- **Smooth Transitions**: 500ms fade between sections

### **📱 Section Layouts**

## **1. Opening Section**
- **Layout**: Single hero audio card
- **Content**: Welcome message with TTS support
- **Features**: Expandable content, audio controls
- **Design**: Centered, max-width container

## **2. Insights Section**
Four different layout options:

### **A. Scroll Layout** (Default)
```typescript
insightsLayout="scroll"
```
- **Design**: Vertical stack of cards
- **Interaction**: Simple scroll down
- **Use Case**: Clean, organized presentation
- **Best For**: Desktop and mobile

### **B. Deck Layout**
```typescript
insightsLayout="deck"
```
- **Design**: Organized card stack
- **Interaction**: Cards layered with slight rotation
- **Visual**: Top card prominent, others partially visible
- **Use Case**: Focus on primary insight with context

### **C. Messy Deck Layout**
```typescript
insightsLayout="messy-deck"
```
- **Design**: Slightly disorganized card stack
- **Interaction**: Cards scattered with random rotation
- **Visual**: More organic, playful appearance
- **Use Case**: Creative, exploratory feel

### **D. Carousel Layout**
```typescript
insightsLayout="carousel"
```
- **Design**: Horizontal carousel with navigation
- **Interaction**: Swipe/click to navigate
- **Features**: Auto-play, dots, arrows
- **Use Case**: Focused, one-at-a-time viewing

## **3. Growth Section**
- **Layout**: 6 growth dimensions as sections
- **Each Dimension**: Horizontal carousel showing 1.5 cards
- **Interaction**: Swipe left/right within each dimension
- **Navigation**: Scroll vertically between dimensions
- **Dimensions**: Self Knowledge, Self Action, Self Expression, World Knowledge, World Action, World Expression

## **4. Prompts Section**
- **Layout**: Same as insights (scroll by default)
- **Content**: Proactive suggestions and questions
- **Design**: Consistent with insight cards
- **Interaction**: Same layout options as insights

### **🎨 Visual Design Patterns**

#### **Card Stacking (Deck Layouts)**
```typescript
// Organized Deck
transform: `translateY(${index * 8}px) rotate(${index * 2}deg) scale(${1 - index * 0.05})`

// Messy Deck  
transform: `translate(${index * 15 - 30}px, ${index * 20 - 40}px) rotate(${(index % 2 === 0 ? 1 : -1) * (index * 3 + 5)}deg) scale(${1 - index * 0.03})`
```

#### **Horizontal Carousels**
```typescript
// Growth dimension carousels
<div className="flex space-x-4 overflow-x-auto pb-4">
  {events.map((event) => (
    <div key={event.id} className="flex-shrink-0 w-80">
      <GrowthEventCard {...event} />
    </div>
  ))}
</div>
```

### **🔧 Implementation**

#### **Basic Usage**
```typescript
<DashboardLayout
  openingContent={{
    title: "Welcome to Your Journey",
    content: "Your personalized dashboard..."
  }}
  insights={insightsData}
  growthEvents={growthEventsData}
  prompts={promptsData}
  autoRotate={true}
  rotationInterval={8000}
  insightsLayout="scroll"
  isSupported={true}
  onPlay={(type, id) => console.log(`Playing ${type}:`, id)}
  onPause={(type, id) => console.log(`Pausing ${type}:`, id)}
  isPlaying={(type, id) => false}
/>
```

#### **Props Interface**
```typescript
export interface DashboardLayoutProps {
  openingContent: {
    title: string;
    content: string;
  };
  insights: Array<{
    id: string;
    title: string;
    content: string;
    cardCover?: string;
    videoBackground?: string;
    backgroundType?: 'image' | 'video' | 'solid';
  }>;
  growthEvents: Array<{
    id: string;
    title: string;
    content: string;
    growthDimension: string;
    cardCover?: string;
  }>;
  prompts: Array<{
    id: string;
    title: string;
    content: string;
    cardCover?: string;
    videoBackground?: string;
    backgroundType?: 'image' | 'video' | 'solid';
  }>;
  autoRotate?: boolean;
  rotationInterval?: number;
  insightsLayout?: 'scroll' | 'deck' | 'messy-deck' | 'carousel';
  onPlay?: (type: string, id: string) => void;
  onPause?: (type: string, id: string) => void;
  isPlaying?: (type: string, id: string) => boolean;
  isSupported?: boolean;
  className?: string;
}
```

### **📊 Storybook Stories**

#### **Complete Dashboard**
- **Auto-rotation enabled**
- **All sections working**
- **8-second intervals**

#### **Layout Comparisons**
- **Scroll Layout**: Clean vertical stack
- **Deck Layout**: Organized card stack
- **Messy Deck**: Scattered card stack
- **Carousel Layout**: Horizontal navigation

#### **Section Focus**
- **Opening Section**: Hero audio card
- **Insights Section**: Multiple layout options
- **Growth Section**: 6 dimensions with carousels
- **Prompts Section**: Same as insights

### **🎯 User Experience**

#### **Auto-Rotation Benefits**
- **Passive Consumption**: Users can watch content automatically
- **Discovery**: Exposes all content without interaction
- **Engagement**: Encourages exploration of different sections
- **Accessibility**: Works for users with limited mobility

#### **Manual Override**
- **User Control**: Click section tabs
- **Pause Auto-rotation**: 30-second pause on interaction
- **Resume**: Automatic resumption after delay
- **Visual Feedback**: Clear section indicators

#### **Mobile Optimization**
- **Touch Gestures**: Swipe support for carousels
- **Responsive Design**: Adapts to screen size
- **Performance**: Optimized for mobile devices
- **Accessibility**: Full keyboard and screen reader support

### **🚀 Advanced Features**

#### **Growth Dimension Organization**
```typescript
// Group events by dimension
const growthEventsByDimension = growthEvents.reduce((acc, event) => {
  const dimension = event.growthDimension;
  if (!acc[dimension]) {
    acc[dimension] = [];
  }
  acc[dimension].push(event);
  return acc;
}, {} as Record<string, typeof growthEvents>);
```

#### **Layout Switching**
```typescript
// Dynamic layout selection
const renderInsights = () => {
  switch (insightsLayout) {
    case 'scroll': return <ScrollLayout />;
    case 'deck': return <DeckLayout />;
    case 'messy-deck': return <MessyDeckLayout />;
    case 'carousel': return <CarouselLayout />;
  }
};
```

#### **Auto-Rotation Control**
```typescript
// User interaction detection
const [isUserInteracting, setIsUserInteracting] = useState(false);

useEffect(() => {
  if (!autoRotate || isUserInteracting) return;
  
  const interval = setInterval(() => {
    setCurrentSection(prev => {
      switch (prev) {
        case 'opening': return 'insights';
        case 'insights': return 'growth';
        case 'growth': return 'prompts';
        case 'prompts': return 'opening';
        default: return 'opening';
      }
    });
  }, rotationInterval);

  return () => clearInterval(interval);
}, [autoRotate, isUserInteracting, rotationInterval]);
```

### **🎨 Design System Integration**

#### **Consistent Styling**
- **Glassmorphic Design**: All cards use glassmorphic panels
- **Color Scheme**: Purple/blue gradient background
- **Typography**: Consistent font weights and sizes
- **Spacing**: Uniform padding and margins

#### **Animation System**
- **Smooth Transitions**: 500ms fade between sections
- **Card Animations**: Scale and rotate effects
- **Auto-rotation**: Seamless section transitions
- **User Feedback**: Hover and interaction states

#### **Responsive Breakpoints**
- **Mobile**: Single column, touch-optimized
- **Tablet**: Two columns, larger cards
- **Desktop**: Three columns, full layout
- **Large Screens**: Maximum width containers

The dashboard layout system provides a complete, interactive experience with automatic rotation, multiple layout options, and seamless integration across all card types!
