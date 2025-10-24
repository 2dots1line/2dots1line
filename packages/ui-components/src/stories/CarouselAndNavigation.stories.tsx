import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { 
  InsightCarousel, 
  DotNavigation, 
  SectionNavigation,
  PortraitInsightCard 
} from '../components/pages';

const meta: Meta = {
  title: 'Dashboard/Carousel & Navigation',
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0a' },
        { name: 'light', value: '#ffffff' }
      ]
    }
  }
};

export default meta;
type Story = StoryObj;

// Sample data
const sampleInsights = [
  {
    id: '1',
    title: 'Emotional Intelligence',
    content: 'You\'ve shown remarkable growth in your ability to reflect on complex emotions. Your recent conversations demonstrate a deepening self-awareness that\'s opening new pathways for personal development.',
    backgroundType: 'solid' as const
  },
  {
    id: '2',
    title: 'Self-Reflection',
    content: 'Your ability to introspect has deepened significantly. You\'re asking more meaningful questions about your motivations and values.',
    cardCover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
    backgroundType: 'image' as const
  },
  {
    id: '3',
    title: 'Communication Growth',
    content: 'You\'ve developed a more nuanced understanding of how to express complex ideas clearly and empathetically.',
    videoBackground: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    cardCover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
    backgroundType: 'video' as const
  },
  {
    id: '4',
    title: 'Pattern Recognition',
    content: 'You\'re beginning to notice recurring themes in your conversations and thoughts, showing advanced cognitive development.',
    backgroundType: 'solid' as const
  },
  {
    id: '5',
    title: 'Empathy Expansion',
    content: 'Your capacity for understanding others\' perspectives has grown significantly, leading to deeper connections.',
    cardCover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
    backgroundType: 'image' as const
  }
];

const sampleSections = [
  { id: 'opening', title: 'Opening', description: 'Welcome and overview' },
  { id: 'insights', title: 'Insights', description: 'Dynamic insights and patterns' },
  { id: 'growth', title: 'Growth', description: 'Growth events and milestones' },
  { id: 'prompts', title: 'Prompts', description: 'Proactive suggestions' }
];

export const InsightCarouselBasic: Story = {
  name: 'Insight Carousel - Basic',
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Insight Carousel</h1>
        <InsightCarousel
          insights={sampleInsights}
          onPlay={(id) => console.log('Playing insight:', id)}
          onPause={(id) => console.log('Pausing insight:', id)}
          isPlaying={(id) => false}
          isSupported={true}
          showDots={true}
          showArrows={true}
        />
      </div>
    </div>
  )
};

export const InsightCarouselAutoPlay: Story = {
  name: 'Insight Carousel - Auto Play',
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Auto-Playing Carousel</h1>
        <p className="text-white/60 text-center mb-8">This carousel automatically advances every 3 seconds</p>
        <InsightCarousel
          insights={sampleInsights}
          onPlay={(id) => console.log('Playing insight:', id)}
          onPause={(id) => console.log('Pausing insight:', id)}
          isPlaying={(id) => false}
          isSupported={true}
          showDots={true}
          showArrows={true}
          autoPlay={true}
          autoPlayInterval={3000}
        />
      </div>
    </div>
  )
};

export const DotNavigationVariants: Story = {
  name: 'Dot Navigation - Variants',
  render: () => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Dot Navigation Variants</h1>
          
          <div className="space-y-12">
            {/* Minimal Variant */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white/80 mb-4">Minimal Dots</h2>
              <DotNavigation
                totalItems={5}
                currentIndex={currentIndex}
                onDotClick={setCurrentIndex}
                variant="minimal"
                className="mb-4"
              />
            </div>

            {/* Default Variant */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white/80 mb-4">Default Dots</h2>
              <DotNavigation
                totalItems={5}
                currentIndex={currentIndex}
                onDotClick={setCurrentIndex}
                variant="default"
                className="mb-4"
              />
            </div>

            {/* Large Variant with Progress */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white/80 mb-4">Large Dots with Progress</h2>
              <DotNavigation
                totalItems={5}
                currentIndex={currentIndex}
                onDotClick={setCurrentIndex}
                variant="large"
                className="mb-4"
              />
            </div>

            {/* With Labels */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white/80 mb-4">Dots with Labels</h2>
              <DotNavigation
                totalItems={5}
                currentIndex={currentIndex}
                onDotClick={setCurrentIndex}
                variant="default"
                showLabels={true}
                labels={['Opening', 'Insights', 'Growth', 'Prompts', 'Summary']}
                className="mb-4"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export const SectionNavigationVariants: Story = {
  name: 'Section Navigation - Variants',
  render: () => {
    const [currentSection, setCurrentSection] = React.useState('opening');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Section Navigation Variants</h1>
          
          <div className="space-y-12">
            {/* Dots Variant */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white/80 mb-4">Dots Navigation</h2>
              <SectionNavigation
                sections={sampleSections}
                currentSection={currentSection}
                onSectionChange={setCurrentSection}
                variant="dots"
                showLabels={true}
                className="mb-4"
              />
            </div>

            {/* Tabs Variant */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white/80 mb-4">Tabs Navigation</h2>
              <SectionNavigation
                sections={sampleSections}
                currentSection={currentSection}
                onSectionChange={setCurrentSection}
                variant="tabs"
                className="mb-4"
              />
            </div>

            {/* Minimal Variant */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white/80 mb-4">Minimal Navigation</h2>
              <SectionNavigation
                sections={sampleSections}
                currentSection={currentSection}
                onSectionChange={setCurrentSection}
                variant="minimal"
                className="mb-4"
              />
            </div>
          </div>

          {/* Current Section Display */}
          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold text-white/80 mb-2">Current Section:</h3>
            <p className="text-white/60">
              {sampleSections.find(s => s.id === currentSection)?.title} - 
              {sampleSections.find(s => s.id === currentSection)?.description}
            </p>
          </div>
        </div>
      </div>
    );
  }
};

export const CompleteDashboardNavigation: Story = {
  name: 'Complete Dashboard - Navigation',
  render: () => {
    const [currentSection, setCurrentSection] = React.useState('insights');
    const [currentInsight, setCurrentInsight] = React.useState(0);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Complete Dashboard Navigation</h1>
          
          {/* Section Navigation */}
          <div className="mb-12">
            <SectionNavigation
              sections={sampleSections}
              currentSection={currentSection}
              onSectionChange={setCurrentSection}
              variant="tabs"
              className="justify-center"
            />
          </div>

          {/* Content Area */}
          <div className="mb-8">
            {currentSection === 'insights' && (
              <div>
                <h2 className="text-2xl font-semibold text-white/80 mb-6 text-center">Dynamic Insights</h2>
                <InsightCarousel
                  insights={sampleInsights}
                  onPlay={(id) => console.log('Playing insight:', id)}
                  onPause={(id) => console.log('Pausing insight:', id)}
                  isPlaying={(id) => false}
                  isSupported={true}
                  showDots={true}
                  showArrows={true}
                  autoPlay={false}
                />
              </div>
            )}
            
            {currentSection === 'growth' && (
              <div>
                <h2 className="text-2xl font-semibold text-white/80 mb-6 text-center">Growth Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PortraitInsightCard
                    title="Emotional Breakthrough"
                    content="This week marked a significant breakthrough in your emotional intelligence."
                    confidence={0.85}
                    backgroundType="image"
                    cardCover="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop"
                    isSupported={true}
                    onPlay={() => console.log('Playing growth event')}
                    onPause={() => console.log('Pausing growth event')}
                  />
                  <PortraitInsightCard
                    title="Communication Milestone"
                    content="You successfully navigated a difficult conversation with grace and empathy."
                    confidence={0.72}
                    backgroundType="solid"
                    isSupported={true}
                    onPlay={() => console.log('Playing growth event')}
                    onPause={() => console.log('Pausing growth event')}
                  />
                </div>
              </div>
            )}
            
            {currentSection === 'prompts' && (
              <div>
                <h2 className="text-2xl font-semibold text-white/80 mb-6 text-center">Proactive Prompts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PortraitInsightCard
                    title="Reflection Prompt"
                    content="What if you could explore the deeper patterns in your recent conversations?"
                    confidence={0.88}
                    backgroundType="video"
                    videoBackground="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
                    cardCover="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop"
                    isSupported={true}
                    onPlay={() => console.log('Playing prompt')}
                    onPause={() => console.log('Pausing prompt')}
                  />
                  <PortraitInsightCard
                    title="Growth Question"
                    content="How might your recent insights apply to your upcoming challenges?"
                    confidence={0.75}
                    backgroundType="image"
                    cardCover="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop"
                    isSupported={true}
                    onPlay={() => console.log('Playing prompt')}
                    onPause={() => console.log('Pausing prompt')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};
