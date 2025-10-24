import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DashboardLayout } from '../components/pages/DashboardLayout';

const meta: Meta = {
  title: 'Dashboard/Complete Layout',
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
const sampleOpeningContent = {
  title: "Welcome to Your Personal Growth Journey",
  content: "This is your personalized dashboard where we'll explore your recent insights, growth milestones, and proactive suggestions. Each section offers a different perspective on your development journey, from the opening words that set the tone, to dynamic insights that reveal patterns in your thinking, growth events that celebrate your progress across six dimensions, and proactive prompts that guide your next steps."
};

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
  },
  {
    id: '6',
    title: 'Creative Thinking',
    content: 'Your creative problem-solving abilities have expanded, allowing you to approach challenges with fresh perspectives.',
    backgroundType: 'solid' as const
  }
];

const sampleGrowthEvents = [
  // Self Knowledge
  { id: 'g1', title: 'Self Knowledge Breakthrough', content: 'You\'ve gained deeper insights into your own thought patterns and emotional responses.', growthDimension: 'self_know', cardCover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' },
  { id: 'g2', title: 'Pattern Recognition', content: 'You\'re beginning to notice recurring themes in your thoughts and behaviors.', growthDimension: 'self_know', cardCover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop' },
  
  // Self Action
  { id: 'g3', title: 'Self Action Milestone', content: 'You took concrete steps to improve your daily habits and personal routines.', growthDimension: 'self_act', cardCover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' },
  { id: 'g4', title: 'Habit Formation', content: 'You successfully established a new morning routine that supports your goals.', growthDimension: 'self_act', cardCover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop' },
  
  // Self Expression
  { id: 'g5', title: 'Self Expression Growth', content: 'You\'ve become more authentic in expressing your true thoughts and feelings.', growthDimension: 'self_show', cardCover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' },
  { id: 'g6', title: 'Creative Expression', content: 'You\'ve found new ways to express your creativity and share your unique perspective.', growthDimension: 'self_show', cardCover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop' },
  
  // World Knowledge
  { id: 'g7', title: 'World Knowledge Expansion', content: 'You\'ve learned more about the world around you and how systems work.', growthDimension: 'world_know', cardCover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' },
  { id: 'g8', title: 'System Understanding', content: 'You\'ve developed a deeper understanding of how organizations and communities function.', growthDimension: 'world_know', cardCover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop' },
  
  // World Action
  { id: 'g9', title: 'World Action Impact', content: 'You\'ve taken meaningful action to contribute to your community and environment.', growthDimension: 'world_act', cardCover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' },
  { id: 'g10', title: 'Community Contribution', content: 'You\'ve made a positive impact in your local community through volunteer work.', growthDimension: 'world_act', cardCover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop' },
  
  // World Expression
  { id: 'g11', title: 'World Expression Sharing', content: 'You\'ve shared your insights and knowledge with others, contributing to collective wisdom.', growthDimension: 'world_show', cardCover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' },
  { id: 'g12', title: 'Knowledge Sharing', content: 'You\'ve mentored others and shared your expertise to help them grow.', growthDimension: 'world_show', cardCover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop' }
];

const samplePrompts = [
  {
    id: 'p1',
    title: 'Reflection Prompt',
    content: 'What if you could explore the deeper patterns in your recent conversations? Consider what themes emerge when you look back at your interactions this week.',
    backgroundType: 'solid' as const
  },
  {
    id: 'p2',
    title: 'Growth Question',
    content: 'How might your recent insights about emotional intelligence apply to your upcoming challenges? What specific situations could benefit from this awareness?',
    cardCover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
    backgroundType: 'image' as const
  },
  {
    id: 'p3',
    title: 'Action Suggestion',
    content: 'Consider taking 10 minutes today to reflect on one conversation that stood out to you. What made it meaningful?',
    backgroundType: 'solid' as const
  },
  {
    id: 'p4',
    title: 'Future Focus',
    content: 'What area of your personal development would you like to explore deeper this month? How can you create opportunities for growth?',
    cardCover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
    backgroundType: 'image' as const
  }
];

export const CompleteDashboard: Story = {
  name: 'Complete Dashboard - Auto Rotation',
  render: () => (
    <DashboardLayout
      openingContent={sampleOpeningContent}
      insights={sampleInsights}
      growthEvents={sampleGrowthEvents}
      prompts={samplePrompts}
      autoRotate={true}
      rotationInterval={6000}
      insightsLayout="scroll"
      isSupported={true}
      onPlay={(type, id) => console.log(`Playing ${type}:`, id)}
      onPause={(type, id) => console.log(`Pausing ${type}:`, id)}
      isPlaying={(type, id) => false}
    />
  )
};

export const MobileResponsiveDemo: Story = {
  name: 'Mobile Responsive Demo',
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-8 text-center">
          Mobile Responsive Dashboard
        </h1>
        <p className="text-white/60 text-center mb-8 max-w-3xl mx-auto text-sm sm:text-base">
          Optimized for mobile devices with responsive design, horizontal scrolling for growth events, 
          and top spacing to reveal video backgrounds.
        </p>
        
        <DashboardLayout
          openingContent={sampleOpeningContent}
          insights={sampleInsights}
          growthEvents={sampleGrowthEvents}
          prompts={samplePrompts}
          autoRotate={false}
          insightsLayout="scroll"
          isSupported={true}
          onPlay={(type, id) => console.log(`Playing ${type}:`, id)}
          onPause={(type, id) => console.log(`Pausing ${type}:`, id)}
          isPlaying={(type, id) => false}
        />
      </div>
    </div>
  )
};

export const InsightsScrollLayout: Story = {
  name: 'Insights - Scroll Layout',
  render: () => (
    <DashboardLayout
      openingContent={sampleOpeningContent}
      insights={sampleInsights}
      growthEvents={sampleGrowthEvents}
      prompts={samplePrompts}
      autoRotate={false}
      insightsLayout="scroll"
      isSupported={true}
      onPlay={(type, id) => console.log(`Playing ${type}:`, id)}
      onPause={(type, id) => console.log(`Pausing ${type}:`, id)}
      isPlaying={(type, id) => false}
    />
  )
};

export const InsightsDeckLayout: Story = {
  name: 'Insights - Deck Layout',
  render: () => (
    <DashboardLayout
      openingContent={sampleOpeningContent}
      insights={sampleInsights}
      growthEvents={sampleGrowthEvents}
      prompts={samplePrompts}
      autoRotate={false}
      insightsLayout="deck"
      isSupported={true}
      onPlay={(type, id) => console.log(`Playing ${type}:`, id)}
      onPause={(type, id) => console.log(`Pausing ${type}:`, id)}
      isPlaying={(type, id) => false}
    />
  )
};

export const InsightsMessyDeckLayout: Story = {
  name: 'Insights - Messy Deck Layout',
  render: () => (
    <DashboardLayout
      openingContent={sampleOpeningContent}
      insights={sampleInsights}
      growthEvents={sampleGrowthEvents}
      prompts={samplePrompts}
      autoRotate={false}
      insightsLayout="messy-deck"
      isSupported={true}
      onPlay={(type, id) => console.log(`Playing ${type}:`, id)}
      onPause={(type, id) => console.log(`Pausing ${type}:`, id)}
      isPlaying={(type, id) => false}
    />
  )
};

export const InsightsCarouselLayout: Story = {
  name: 'Insights - Carousel Layout',
  render: () => (
    <DashboardLayout
      openingContent={sampleOpeningContent}
      insights={sampleInsights}
      growthEvents={sampleGrowthEvents}
      prompts={samplePrompts}
      autoRotate={false}
      insightsLayout="carousel"
      isSupported={true}
      onPlay={(type, id) => console.log(`Playing ${type}:`, id)}
      onPause={(type, id) => console.log(`Pausing ${type}:`, id)}
      isPlaying={(type, id) => false}
    />
  )
};

export const GrowthSection: Story = {
  name: 'Growth Section - 6 Dimensions',
  render: () => (
    <DashboardLayout
      openingContent={sampleOpeningContent}
      insights={sampleInsights}
      growthEvents={sampleGrowthEvents}
      prompts={samplePrompts}
      autoRotate={false}
      insightsLayout="scroll"
      isSupported={true}
      onPlay={(type, id) => console.log(`Playing ${type}:`, id)}
      onPause={(type, id) => console.log(`Pausing ${type}:`, id)}
      isPlaying={(type, id) => false}
    />
  )
};

export const PromptsSection: Story = {
  name: 'Prompts Section',
  render: () => (
    <DashboardLayout
      openingContent={sampleOpeningContent}
      insights={sampleInsights}
      growthEvents={sampleGrowthEvents}
      prompts={samplePrompts}
      autoRotate={false}
      insightsLayout="scroll"
      isSupported={true}
      onPlay={(type, id) => console.log(`Playing ${type}:`, id)}
      onPause={(type, id) => console.log(`Pausing ${type}:`, id)}
      isPlaying={(type, id) => false}
    />
  )
};

export const OpeningSectionWithTopSpacing: Story = {
  name: 'Opening Section - Top Spacing for Video Background',
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-8 text-center">
          Opening Section with Top Spacing
        </h1>
        <p className="text-white/60 text-center mb-8 max-w-3xl mx-auto text-sm sm:text-base">
          The opening card is positioned with top spacing to reveal the video background. 
          The book icon has been removed for a cleaner look.
        </p>
        
        <div className="max-w-4xl mx-auto pt-40">
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 lg:p-8 hover:bg-white/15 transition-all duration-200 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-white/90">
                    {sampleOpeningContent.title}
                  </h2>
                </div>
                <button className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <span className="text-sm sm:text-lg">Listen</span>
                </button>
              </div>
              
              <div className="prose prose-invert max-w-none">
                <div className="text-base sm:text-lg leading-relaxed text-white/90 whitespace-pre-wrap">
                  {sampleOpeningContent.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export const LayoutComparison: Story = {
  name: 'Layout Comparison - All Insights Styles',
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Insights Layout Comparison</h1>
        
        <div className="space-y-16">
          {/* Scroll Layout */}
          <div>
            <h2 className="text-2xl font-semibold text-white/80 mb-6">Scroll Layout</h2>
            <div className="max-h-96 overflow-y-auto space-y-6">
              {sampleInsights.map((insight) => (
                <div key={insight.id} className="max-w-sm mx-auto">
                  <div className="bg-white/10 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white/90 mb-2">{insight.title}</h3>
                    <p className="text-sm text-white/80">{insight.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deck Layout */}
          <div>
            <h2 className="text-2xl font-semibold text-white/80 mb-6">Deck Layout</h2>
            <div className="relative h-96 flex items-center justify-center">
              {sampleInsights.slice(0, 4).map((insight, index) => (
                <div
                  key={insight.id}
                  className="absolute transition-all duration-500"
                  style={{
                    transform: `translateY(${index * 8}px) rotate(${index * 2}deg) scale(${1 - index * 0.05})`,
                    zIndex: 4 - index,
                    opacity: index < 3 ? 1 : 0.3
                  }}
                >
                  <div className="w-80 bg-white/10 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white/90 mb-2">{insight.title}</h3>
                    <p className="text-sm text-white/80">{insight.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messy Deck Layout */}
          <div>
            <h2 className="text-2xl font-semibold text-white/80 mb-6">Messy Deck Layout</h2>
            <div className="relative h-96 flex items-center justify-center">
              {sampleInsights.slice(0, 4).map((insight, index) => (
                <div
                  key={insight.id}
                  className="absolute transition-all duration-500"
                  style={{
                    transform: `translate(${index * 15 - 30}px, ${index * 20 - 40}px) rotate(${(index % 2 === 0 ? 1 : -1) * (index * 3 + 5)}deg) scale(${1 - index * 0.03})`,
                    zIndex: 4 - index,
                    opacity: index < 4 ? 1 : 0.2
                  }}
                >
                  <div className="w-80 bg-white/10 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white/90 mb-2">{insight.title}</h3>
                    <p className="text-sm text-white/80">{insight.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};
