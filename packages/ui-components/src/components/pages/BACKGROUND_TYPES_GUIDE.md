# Background Types Guide - Portrait Insight Cards

## 🎨 Background Type Differences

### **1. Solid Background (`backgroundType="solid"`)**
- **Visual**: Solid dark purple background
- **Use Case**: When no media is available
- **Performance**: Lightweight, fast loading
- **Fallback**: Default option when no other media is provided

```typescript
<PortraitInsightCard
  title="Emotional Intelligence"
  content="Your growth in emotional intelligence..."
  backgroundType="solid"
  confidence={0.87}
/>
```

### **2. Image Background (`backgroundType="image"`)**
- **Visual**: Static image with gradient overlay
- **Use Case**: AI-generated card covers, photos, artwork
- **Performance**: Medium loading time
- **Fallback**: Falls back to solid if image fails

```typescript
<PortraitInsightCard
  title="Self-Reflection"
  content="Your ability to introspect..."
  cardCover="https://example.com/card-cover.jpg"
  backgroundType="image"
  confidence={0.92}
/>
```

### **3. Video Background (`backgroundType="video"`)**
- **Visual**: Looping video with gradient overlay
- **Use Case**: Premium content, dynamic visuals
- **Performance**: Higher loading time, more bandwidth
- **Fallback**: Falls back to image, then solid

```typescript
<PortraitInsightCard
  title="Communication Growth"
  content="Your nuanced understanding..."
  videoBackground="https://example.com/background-video.mp4"
  cardCover="https://example.com/fallback-image.jpg"
  backgroundType="video"
  confidence={0.78}
/>
```

## 🎥 Video Background Features

### **Video Properties**
- **Auto-play**: Starts automatically
- **Loop**: Repeats continuously
- **Muted**: No sound (user can control audio via TTS)
- **Plays Inline**: Works on mobile devices
- **Object Cover**: Fills the card completely

### **Fallback Chain**
1. **Video** → If video fails to load
2. **Image** → If image fails to load  
3. **Solid** → Final fallback

### **Performance Considerations**
- **File Size**: Keep videos under 5MB for good performance
- **Duration**: 10-30 seconds for seamless looping
- **Resolution**: 720p max for mobile optimization
- **Format**: MP4 preferred, WebM as backup

## 🔧 Implementation Examples

### **Basic Usage**
```typescript
// Solid background (default)
<PortraitInsightCard
  title="Insight Title"
  content="Insight content..."
  backgroundType="solid"
/>

// Image background
<PortraitInsightCard
  title="Insight Title"
  content="Insight content..."
  cardCover="https://example.com/image.jpg"
  backgroundType="image"
/>

// Video background
<PortraitInsightCard
  title="Insight Title"
  content="Insight content..."
  videoBackground="https://example.com/video.mp4"
  cardCover="https://example.com/fallback.jpg"
  backgroundType="video"
/>
```

### **Dynamic Background Selection**
```typescript
const getBackgroundType = (insight: Insight) => {
  if (insight.videoUrl) return 'video';
  if (insight.imageUrl) return 'image';
  return 'solid';
};

<PortraitInsightCard
  title={insight.title}
  content={insight.content}
  videoBackground={insight.videoUrl}
  cardCover={insight.imageUrl}
  backgroundType={getBackgroundType(insight)}
  confidence={insight.confidence}
/>
```

### **Conditional Rendering**
```typescript
<PortraitInsightCard
  title="Premium Insight"
  content="This is premium content..."
  {...(hasVideo ? {
    videoBackground: videoUrl,
    backgroundType: 'video'
  } : hasImage ? {
    cardCover: imageUrl,
    backgroundType: 'image'
  } : {
    backgroundType: 'solid'
  })}
/>
```

## 📱 Mobile Optimization

### **Video Performance**
- **Autoplay**: May be restricted on some mobile browsers
- **Data Usage**: Consider user's data plan
- **Battery**: Video backgrounds use more battery
- **Fallback**: Always provide image fallback

### **Responsive Design**
- **Aspect Ratio**: Maintains card proportions
- **Touch**: Video doesn't interfere with touch interactions
- **Loading**: Shows loading state while video loads

## 🎯 Use Case Recommendations

### **Solid Background**
- **When**: No media available, performance critical
- **Content**: Text-heavy insights, basic information
- **Audience**: Users with limited bandwidth

### **Image Background**
- **When**: AI-generated card covers, static visuals
- **Content**: Visual insights, artwork, photos
- **Audience**: Standard users, good for most content

### **Video Background**
- **When**: Premium content, dynamic visuals
- **Content**: High-value insights, engaging content
- **Audience**: Users with good bandwidth, premium experience

## 🔄 Background Switching

### **Runtime Changes**
```typescript
const [backgroundType, setBackgroundType] = useState<'solid' | 'image' | 'video'>('solid');

// Switch to video when available
useEffect(() => {
  if (videoUrl) {
    setBackgroundType('video');
  } else if (imageUrl) {
    setBackgroundType('image');
  }
}, [videoUrl, imageUrl]);
```

### **User Preferences**
```typescript
const userPrefersVideo = user.settings.backgroundType === 'video';
const userPrefersImage = user.settings.backgroundType === 'image';

<PortraitInsightCard
  backgroundType={userPrefersVideo ? 'video' : userPrefersImage ? 'image' : 'solid'}
  // ... other props
/>
```

## 🚀 Advanced Features

### **Video Controls**
```typescript
// Pause video when TTS is playing
const [isVideoPaused, setIsVideoPaused] = useState(false);

useEffect(() => {
  if (isTTSPlaying) {
    setIsVideoPaused(true);
  } else {
    setIsVideoPaused(false);
  }
}, [isTTSPlaying]);
```

### **Lazy Loading**
```typescript
const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

// Load video when card comes into view
const observer = useIntersectionObserver(() => {
  setShouldLoadVideo(true);
});

<PortraitInsightCard
  videoBackground={shouldLoadVideo ? videoUrl : undefined}
  backgroundType={shouldLoadVideo ? 'video' : 'image'}
  // ... other props
/>
```

## 📊 Performance Metrics

### **Loading Times**
- **Solid**: Instant
- **Image**: 1-3 seconds
- **Video**: 3-10 seconds (depending on size)

### **Bandwidth Usage**
- **Solid**: 0 KB
- **Image**: 50-500 KB
- **Video**: 1-10 MB

### **Battery Impact**
- **Solid**: Minimal
- **Image**: Low
- **Video**: Medium to High

## 🎨 Design Guidelines

### **Visual Hierarchy**
- **Text Readability**: Gradient overlay ensures text is always readable
- **Content Focus**: Background enhances, doesn't distract
- **Brand Consistency**: All backgrounds maintain glassmorphic design

### **Accessibility**
- **Alt Text**: Images should have descriptive alt text
- **Video Descriptions**: Videos should have text descriptions
- **Color Contrast**: Text remains readable on all backgrounds

The enhanced Portrait Insight Card now supports three distinct background types, each optimized for different use cases and performance requirements!
