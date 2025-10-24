# Navigation Components Guide

## 🎯 Components Overview

I've created a comprehensive set of navigation components for your dashboard:

### **1. InsightCarousel** - Swipeable Card Carousel
### **2. DotNavigation** - Dot Navigation (Pagination Dots)
### **3. SectionNavigation** - Section Navigation (Tab-like)

## 🎠 InsightCarousel

### **Features**
- **Swipeable Cards**: Portrait insight cards in a carousel
- **Navigation Arrows**: Left/right arrow buttons
- **Dot Navigation**: Dots at the bottom for direct navigation
- **Auto-play**: Optional automatic advancement
- **Touch Support**: Works on mobile devices
- **Audio Integration**: TTS controls for each card

### **Props**
```typescript
interface InsightCarouselProps {
  insights: Array<{
    id: string;
    title: string;
    content: string;
    confidence?: number;
    cardCover?: string;
    videoBackground?: string;
    backgroundType?: 'image' | 'video' | 'solid';
  }>;
  onPlay?: (insightId: string) => void;
  onPause?: (insightId: string) => void;
  isPlaying?: (insightId: string) => boolean;
  isSupported?: boolean;
  showDots?: boolean;           // Show dot navigation
  showArrows?: boolean;         // Show arrow buttons
  autoPlay?: boolean;           // Auto-advance slides
  autoPlayInterval?: number;    // Auto-play interval (ms)
}
```

### **Usage Examples**

#### **Basic Carousel**
```typescript
<InsightCarousel
  insights={insights}
  onPlay={(id) => speak(insights.find(i => i.id === id)?.content)}
  onPause={stop}
  isPlaying={(id) => isSpeaking && currentInsightId === id}
  isSupported={isTTSSupported}
  showDots={true}
  showArrows={true}
/>
```

#### **Auto-playing Carousel**
```typescript
<InsightCarousel
  insights={insights}
  autoPlay={true}
  autoPlayInterval={5000}  // 5 seconds
  showDots={true}
  showArrows={true}
/>
```

## 🔘 DotNavigation

### **Features**
- **Multiple Variants**: Minimal, default, large
- **Labels Support**: Optional text labels
- **Progress Bar**: Large variant includes progress bar
- **Accessibility**: ARIA labels and keyboard support

### **Props**
```typescript
interface DotNavigationProps {
  totalItems: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
  variant?: 'default' | 'minimal' | 'large';
  showLabels?: boolean;
  labels?: string[];
}
```

### **Variants**

#### **Minimal Dots**
```typescript
<DotNavigation
  totalItems={5}
  currentIndex={currentIndex}
  onDotClick={setCurrentIndex}
  variant="minimal"
/>
```

#### **Default Dots**
```typescript
<DotNavigation
  totalItems={5}
  currentIndex={currentIndex}
  onDotClick={setCurrentIndex}
  variant="default"
/>
```

#### **Large Dots with Progress**
```typescript
<DotNavigation
  totalItems={5}
  currentIndex={currentIndex}
  onDotClick={setCurrentIndex}
  variant="large"
/>
```

#### **Dots with Labels**
```typescript
<DotNavigation
  totalItems={5}
  currentIndex={currentIndex}
  onDotClick={setCurrentIndex}
  variant="default"
  showLabels={true}
  labels={['Opening', 'Insights', 'Growth', 'Prompts', 'Summary']}
/>
```

## 📑 SectionNavigation

### **Features**
- **Multiple Variants**: Dots, tabs, minimal
- **Section Management**: Navigate between dashboard sections
- **Responsive Design**: Adapts to different screen sizes
- **Accessibility**: Full keyboard and screen reader support

### **Props**
```typescript
interface SectionNavigationProps {
  sections: Section[];
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  variant?: 'dots' | 'tabs' | 'minimal';
  showLabels?: boolean;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}
```

### **Variants**

#### **Dots Navigation**
```typescript
<SectionNavigation
  sections={sections}
  currentSection={currentSection}
  onSectionChange={setCurrentSection}
  variant="dots"
  showLabels={true}
/>
```

#### **Tabs Navigation**
```typescript
<SectionNavigation
  sections={sections}
  currentSection={currentSection}
  onSectionChange={setCurrentSection}
  variant="tabs"
/>
```

#### **Minimal Navigation**
```typescript
<SectionNavigation
  sections={sections}
  currentSection={currentSection}
  onSectionChange={setCurrentSection}
  variant="minimal"
/>
```

## 🎨 Visual Design

### **Color Scheme**
- **Active Dots**: `bg-white/80` with scale effect
- **Inactive Dots**: `bg-white/40` with hover states
- **Tabs**: Glassmorphic design with borders
- **Arrows**: Glassmorphic buttons with icons

### **Animations**
- **Slide Transitions**: Smooth 500ms ease-in-out
- **Dot Hover**: Scale and color transitions
- **Tab Hover**: Background and border transitions
- **Auto-play**: Pauses on hover

## 📱 Mobile Optimization

### **Touch Support**
- **Swipe Gestures**: Natural swipe navigation
- **Touch Targets**: Minimum 44px touch targets
- **Responsive**: Adapts to different screen sizes

### **Performance**
- **Lazy Loading**: Cards load as needed
- **Smooth Scrolling**: 60fps animations
- **Memory Efficient**: Minimal re-renders

## 🔧 Advanced Usage

### **Combined Navigation**
```typescript
const [currentSection, setCurrentSection] = useState('insights');
const [currentInsight, setCurrentInsight] = useState(0);

return (
  <div>
    {/* Section Navigation */}
    <SectionNavigation
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      variant="tabs"
    />
    
    {/* Content Area */}
    {currentSection === 'insights' && (
      <InsightCarousel
        insights={insights}
        onPlay={handlePlay}
        onPause={handlePause}
        isPlaying={isPlaying}
        showDots={true}
        showArrows={true}
      />
    )}
  </div>
);
```

### **Auto-play with Pause on Interaction**
```typescript
const [isHovered, setIsHovered] = useState(false);
const [isPlaying, setIsPlaying] = useState(false);

<InsightCarousel
  insights={insights}
  autoPlay={!isHovered && !isPlaying}
  autoPlayInterval={3000}
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
/>
```

### **Custom Styling**
```typescript
<DotNavigation
  totalItems={5}
  currentIndex={currentIndex}
  onDotClick={setCurrentIndex}
  className="custom-dot-navigation"
  variant="large"
/>
```

## 🎯 Use Cases

### **Dashboard Sections**
- **Opening**: Hero content with navigation
- **Insights**: Carousel of dynamic insights
- **Growth**: Timeline of growth events
- **Prompts**: Proactive suggestions

### **Content Types**
- **Portrait Cards**: Insights with various backgrounds
- **Video Content**: Premium insights with video backgrounds
- **Interactive**: TTS-enabled content
- **Progressive**: Step-by-step content flow

## 🚀 Implementation Examples

### **Complete Dashboard**
```typescript
const Dashboard = () => {
  const [currentSection, setCurrentSection] = useState('opening');
  
  return (
    <div className="dashboard">
      <SectionNavigation
        sections={dashboardSections}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        variant="tabs"
      />
      
      {currentSection === 'insights' && (
        <InsightCarousel
          insights={insights}
          autoPlay={true}
          showDots={true}
          showArrows={true}
        />
      )}
    </div>
  );
};
```

### **Mobile-First Design**
```typescript
const MobileDashboard = () => {
  return (
    <div className="mobile-dashboard">
      <SectionNavigation
        sections={sections}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        variant="dots"
        showLabels={false}
      />
      
      <InsightCarousel
        insights={insights}
        showDots={true}
        showArrows={false}  // Hide arrows on mobile
        autoPlay={true}
      />
    </div>
  );
};
```

## 📊 Performance Considerations

### **Optimization Tips**
- **Lazy Loading**: Load content as needed
- **Image Optimization**: Use appropriate image sizes
- **Video Optimization**: Compress videos for web
- **Memory Management**: Clean up event listeners

### **Accessibility**
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and descriptions
- **Color Contrast**: Meets WCAG guidelines
- **Focus Management**: Clear focus indicators

The navigation components provide a complete solution for dashboard navigation with multiple interaction patterns and visual styles!
