import type { Meta, StoryObj } from '@storybook/react';
import { 
  HeroAudioCard, 
  PortraitInsightCard, 
  GrowthEventCard, 
  ProactivePromptCard 
} from '../components/pages';

const meta: Meta = {
  title: 'Dashboard/Page Templates',
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

// Sample data for stories
const sampleOpeningContent = `Your Journey Through the Cosmos

Welcome to your personal cosmic journey. This month, we've witnessed remarkable growth across all dimensions of your being. Your conversations have revealed patterns of self-discovery that speak to a deeper understanding of your place in the universe.

The stars have aligned to show you new pathways forward, and your inner wisdom continues to guide you toward greater fulfillment and purpose. Your recent insights about emotional intelligence have opened new doors for personal development, and your ability to reflect on complex situations has deepened significantly.

As you continue on this path, remember that every conversation, every moment of reflection, and every insight gained contributes to your cosmic journey. The patterns you're discovering in your interactions reveal the unique constellation of your personal growth.

This month's dashboard reflects not just your progress, but the beautiful complexity of your evolving understanding of yourself and your relationships. Each insight is a star in your personal galaxy, lighting the way forward.`;

const sampleInsightContent = `You've shown remarkable growth in your ability to reflect on complex emotions. Your recent conversations demonstrate a deepening self-awareness that's opening new pathways for personal development.`;

const sampleGrowthEventContent = `This week marked a significant breakthrough in your emotional intelligence. You demonstrated exceptional empathy and understanding in challenging conversations, showing growth in your ability to navigate complex interpersonal dynamics.`;

const samplePromptContent = `What if you could explore the deeper patterns in your recent conversations? Consider reflecting on the themes that have emerged in your discussions and how they might be guiding you toward new insights about yourself.`;

export const HeroAudioCardTemplate: Story = {
  name: 'Hero Audio Card - Opening Content',
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Dashboard Page Templates</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-white/80 mb-4">Hero Audio Card</h2>
            <p className="text-white/60 mb-6">Perfect for opening content and editor's notes. Large, prominent display with audio controls.</p>
            <HeroAudioCard
              title="Your Journey Through the Cosmos"
              content={sampleOpeningContent}
              isSupported={true}
              maxLength={300}
              showExpandButton={true}
              onPlay={() => console.log('Playing opening content')}
              onPause={() => console.log('Pausing opening content')}
            />
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white/80">Features</h3>
            <ul className="text-white/60 space-y-2">
              <li>• Large, prominent display</li>
              <li>• Audio controls with play/pause</li>
              <li>• Continue Reading functionality</li>
              <li>• Configurable content length</li>
              <li>• Glassmorphic design</li>
              <li>• Perfect for opening content</li>
              <li>• Responsive layout</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
};

export const PortraitInsightCardTemplate: Story = {
  name: 'Portrait Insight Card - Dynamic Insights',
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Portrait Insight Cards</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PortraitInsightCard
            title="Emotional Intelligence"
            content={sampleInsightContent}
            confidence={0.87}
            backgroundType="solid"
            isSupported={true}
            onPlay={() => console.log('Playing insight')}
            onPause={() => console.log('Pausing insight')}
          />
          <PortraitInsightCard
            title="Self-Reflection"
            content="Your ability to introspect has deepened significantly. You're asking more meaningful questions about your motivations and values."
            confidence={0.92}
            cardCover="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop"
            backgroundType="image"
            isSupported={true}
            onPlay={() => console.log('Playing insight')}
            onPause={() => console.log('Pausing insight')}
          />
          <PortraitInsightCard
            title="Communication Growth"
            content="You've developed a more nuanced understanding of how to express complex ideas clearly and empathetically."
            confidence={0.78}
            videoBackground="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
            backgroundType="video"
            cardCover="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop"
            isSupported={true}
            onPlay={() => console.log('Playing insight')}
            onPause={() => console.log('Pausing insight')}
          />
        </div>
      </div>
    </div>
  )
};

export const GrowthEventCardTemplate: Story = {
  name: 'Growth Event Card - Growth Trajectory',
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Growth Event Cards</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GrowthEventCard
            title="Emotional Breakthrough"
            content={sampleGrowthEventContent}
            growthDimension="self_know"
            cardCover="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
            isSupported={true}
            onPlay={() => console.log('Playing growth event')}
            onPause={() => console.log('Pausing growth event')}
          />
          <GrowthEventCard
            title="Communication Milestone"
            content="You successfully navigated a difficult conversation with grace and empathy, demonstrating significant growth in your interpersonal skills."
            growthDimension="world_act"
            cardCover="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
            isSupported={true}
            onPlay={() => console.log('Playing growth event')}
            onPause={() => console.log('Pausing growth event')}
          />
        </div>
      </div>
    </div>
  )
};

export const ProactivePromptCardTemplate: Story = {
  name: 'Proactive Prompt Card - Proactive Prompts',
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Proactive Prompt Cards</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProactivePromptCard
            title="Reflection Prompt"
            content={samplePromptContent}
            promptType="reflection"
            urgency="medium"
            isSupported={true}
            onPlay={() => console.log('Playing prompt')}
            onPause={() => console.log('Pausing prompt')}
          />
          <ProactivePromptCard
            title="Growth Question"
            content="How might your recent insights about emotional intelligence apply to your upcoming challenges?"
            promptType="question"
            urgency="high"
            isSupported={true}
            onPlay={() => console.log('Playing prompt')}
            onPause={() => console.log('Pausing prompt')}
          />
          <ProactivePromptCard
            title="Action Suggestion"
            content="Consider journaling about the patterns you've noticed in your recent conversations. This could reveal new insights about your growth trajectory."
            promptType="suggestion"
            urgency="low"
            isSupported={true}
            onPlay={() => console.log('Playing prompt')}
            onPause={() => console.log('Pausing prompt')}
          />
        </div>
      </div>
    </div>
  )
};

export const BackgroundTypesDemo: Story = {
  name: 'Background Types - Visual Comparison',
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Background Types Comparison</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white/80 mb-4">Solid Background</h3>
            <PortraitInsightCard
              title="Solid Purple"
              content="This card uses a solid purple background. Perfect for when no media is available."
              confidence={0.85}
              backgroundType="solid"
              isSupported={true}
              onPlay={() => console.log('Playing solid background card')}
              onPause={() => console.log('Pausing solid background card')}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white/80 mb-4">Image Background</h3>
            <PortraitInsightCard
              title="Image Background"
              content="This card uses a static image background. Great for showcasing AI-generated card covers."
              confidence={0.92}
              cardCover="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop"
              backgroundType="image"
              isSupported={true}
              onPlay={() => console.log('Playing image background card')}
              onPause={() => console.log('Pausing image background card')}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white/80 mb-4">Video Background</h3>
            <PortraitInsightCard
              title="Video Background"
              content="This card uses a video background. Creates dynamic, engaging visuals for premium content."
              confidence={0.78}
              videoBackground="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
              backgroundType="video"
              cardCover="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop"
              isSupported={true}
              onPlay={() => console.log('Playing video background card')}
              onPause={() => console.log('Pausing video background card')}
            />
          </div>
        </div>
      </div>
    </div>
  )
};

export const AllTemplatesShowcase: Story = {
  name: 'All Templates - Complete Dashboard',
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Complete Dashboard Page Templates</h1>
        
        {/* Hero Audio Card Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white/80 mb-6">Opening Content</h2>
          <HeroAudioCard
            title="Your Journey Through the Cosmos"
            content={sampleOpeningContent}
            isSupported={true}
            maxLength={400}
            showExpandButton={true}
            onPlay={() => console.log('Playing opening content')}
            onPause={() => console.log('Pausing opening content')}
          />
        </section>

        {/* Portrait Insight Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white/80 mb-6">Dynamic Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PortraitInsightCard
              title="Emotional Intelligence"
              content={sampleInsightContent}
              cardCover="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop"
              isSupported={true}
              onPlay={() => console.log('Playing insight')}
              onPause={() => console.log('Pausing insight')}
            />
            <PortraitInsightCard
              title="Self-Reflection"
              content="Your ability to introspect has deepened significantly. You're asking more meaningful questions about your motivations and values."
              cardCover="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop"
              isSupported={true}
              onPlay={() => console.log('Playing insight')}
              onPause={() => console.log('Pausing insight')}
            />
            <PortraitInsightCard
              title="Communication Growth"
              content="You've developed a more nuanced understanding of how to express complex ideas clearly and empathetically."
              cardCover="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop"
              isSupported={true}
              onPlay={() => console.log('Playing insight')}
              onPause={() => console.log('Pausing insight')}
            />
          </div>
        </section>

        {/* Growth Event Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white/80 mb-6">Growth Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GrowthEventCard
              title="Emotional Breakthrough"
              content={sampleGrowthEventContent}
              date="This Week"
              significance={0.85}
              cardCover="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
              isSupported={true}
              onPlay={() => console.log('Playing growth event')}
              onPause={() => console.log('Pausing growth event')}
            />
            <GrowthEventCard
              title="Communication Milestone"
              content="You successfully navigated a difficult conversation with grace and empathy, demonstrating significant growth in your interpersonal skills."
              date="Last Week"
              significance={0.72}
              cardCover="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
              isSupported={true}
              onPlay={() => console.log('Playing growth event')}
              onPause={() => console.log('Pausing growth event')}
            />
          </div>
        </section>

        {/* Proactive Prompt Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white/80 mb-6">Proactive Prompts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProactivePromptCard
              title="Reflection Prompt"
              content={samplePromptContent}
              backgroundType="solid"
              isSupported={true}
              onPlay={() => console.log('Playing prompt')}
              onPause={() => console.log('Pausing prompt')}
            />
            <ProactivePromptCard
              title="Growth Question"
              content="How might your recent insights about emotional intelligence apply to your upcoming challenges?"
              cardCover="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop"
              backgroundType="image"
              isSupported={true}
              onPlay={() => console.log('Playing prompt')}
              onPause={() => console.log('Pausing prompt')}
            />
          </div>
        </section>
      </div>
    </div>
  )
};

export const SixGrowthDimensionsShowcase: Story = {
  name: 'Six Growth Dimensions Showcase',
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Six Growth Dimensions</h1>
        <p className="text-white/60 text-center mb-12 max-w-3xl mx-auto">
          The 6D Growth Model tracks personal development across self and world dimensions, 
          each with know, act, and show aspects.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Self Knowledge */}
          <GrowthEventCard
            title="Self Knowledge Breakthrough"
            content="You've gained deeper insights into your own thought patterns and emotional responses."
            growthDimension="self_know"
            cardCover="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
            isSupported={true}
            onPlay={() => console.log('Playing self_know event')}
            onPause={() => console.log('Pausing self_know event')}
          />
          
          {/* Self Action */}
          <GrowthEventCard
            title="Self Action Milestone"
            content="You took concrete steps to improve your daily habits and personal routines."
            growthDimension="self_act"
            cardCover="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
            isSupported={true}
            onPlay={() => console.log('Playing self_act event')}
            onPause={() => console.log('Pausing self_act event')}
          />
          
          {/* Self Expression */}
          <GrowthEventCard
            title="Self Expression Growth"
            content="You've become more authentic in expressing your true thoughts and feelings."
            growthDimension="self_show"
            cardCover="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
            isSupported={true}
            onPlay={() => console.log('Playing self_show event')}
            onPause={() => console.log('Pausing self_show event')}
          />
          
          {/* World Knowledge */}
          <GrowthEventCard
            title="World Knowledge Expansion"
            content="You've learned more about the world around you and how systems work."
            growthDimension="world_know"
            cardCover="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
            isSupported={true}
            onPlay={() => console.log('Playing world_know event')}
            onPause={() => console.log('Pausing world_know event')}
          />
          
          {/* World Action */}
          <GrowthEventCard
            title="World Action Impact"
            content="You've taken meaningful action to contribute to your community and environment."
            growthDimension="world_act"
            cardCover="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
            isSupported={true}
            onPlay={() => console.log('Playing world_act event')}
            onPause={() => console.log('Pausing world_act event')}
          />
          
          {/* World Expression */}
          <GrowthEventCard
            title="World Expression Sharing"
            content="You've shared your insights and knowledge with others, contributing to collective wisdom."
            growthDimension="world_show"
            cardCover="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
            isSupported={true}
            onPlay={() => console.log('Playing world_show event')}
            onPause={() => console.log('Pausing world_show event')}
          />
        </div>
      </div>
    </div>
  )
};
