import React, { useState, useEffect } from 'react';
import { SectionNavigation } from './SectionNavigation';
import { HeroAudioCard } from './HeroAudioCard';
import { PortraitInsightCard } from './PortraitInsightCard';
import { GrowthEventCard } from './GrowthEventCard';
import { ProactivePromptCard } from './ProactivePromptCard';
import { InsightCarousel } from './InsightCarousel';

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

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  openingContent,
  insights,
  growthEvents,
  prompts,
  autoRotate = true,
  rotationInterval = 8000, // 8 seconds per section
  insightsLayout = 'scroll',
  onPlay,
  onPause,
  isPlaying = () => false,
  isSupported = true,
  className = ''
}) => {
  const [currentSection, setCurrentSection] = useState('opening');
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Auto-rotation logic
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

  // Group growth events by dimension
  const growthEventsByDimension = growthEvents.reduce((acc, event) => {
    const dimension = event.growthDimension;
    if (!acc[dimension]) {
      acc[dimension] = [];
    }
    acc[dimension].push(event);
    return acc;
  }, {} as Record<string, typeof growthEvents>);

  const handleSectionChange = (sectionId: string) => {
    setCurrentSection(sectionId);
    setIsUserInteracting(true);
    // Reset interaction flag after a delay
    setTimeout(() => setIsUserInteracting(false), 30000);
  };

  const renderInsights = () => {
    switch (insightsLayout) {
      case 'scroll':
        return (
          <div className="space-y-6">
            {insights.map((insight) => (
              <PortraitInsightCard
                key={insight.id}
                title={insight.title}
                content={insight.content}
                cardCover={insight.cardCover}
                videoBackground={insight.videoBackground}
                backgroundType={insight.backgroundType}
                onPlay={() => onPlay?.('insight', insight.id)}
                onPause={() => onPause?.('insight', insight.id)}
                isPlaying={isPlaying('insight', insight.id)}
                isSupported={isSupported}
              />
            ))}
          </div>
        );

      case 'deck':
        return (
          <div className="relative h-96 flex items-center justify-center">
            {insights.map((insight, index) => (
              <div
                key={insight.id}
                className="absolute transition-all duration-500"
                style={{
                  transform: `translateY(${index * 8}px) rotate(${index * 2}deg) scale(${1 - index * 0.05})`,
                  zIndex: insights.length - index,
                  opacity: index < 3 ? 1 : 0.3
                }}
              >
                <PortraitInsightCard
                  title={insight.title}
                  content={insight.content}
                  cardCover={insight.cardCover}
                  videoBackground={insight.videoBackground}
                  backgroundType={insight.backgroundType}
                  onPlay={() => onPlay?.('insight', insight.id)}
                  onPause={() => onPause?.('insight', insight.id)}
                  isPlaying={isPlaying('insight', insight.id)}
                  isSupported={isSupported}
                  className="w-80"
                />
              </div>
            ))}
          </div>
        );

      case 'messy-deck':
        return (
          <div className="relative h-96 flex items-center justify-center">
            {insights.map((insight, index) => (
              <div
                key={insight.id}
                className="absolute transition-all duration-500"
                style={{
                  transform: `translate(${index * 15 - 30}px, ${index * 20 - 40}px) rotate(${(index % 2 === 0 ? 1 : -1) * (index * 3 + 5)}deg) scale(${1 - index * 0.03})`,
                  zIndex: insights.length - index,
                  opacity: index < 4 ? 1 : 0.2
                }}
              >
                <PortraitInsightCard
                  title={insight.title}
                  content={insight.content}
                  cardCover={insight.cardCover}
                  videoBackground={insight.videoBackground}
                  backgroundType={insight.backgroundType}
                  onPlay={() => onPlay?.('insight', insight.id)}
                  onPause={() => onPause?.('insight', insight.id)}
                  isPlaying={isPlaying('insight', insight.id)}
                  isSupported={isSupported}
                  className="w-80"
                />
              </div>
            ))}
          </div>
        );

      case 'carousel':
        return (
          <InsightCarousel
            insights={insights}
            onPlay={(id) => onPlay?.('insight', id)}
            onPause={(id) => onPause?.('insight', id)}
            isPlaying={(id) => isPlaying('insight', id)}
            isSupported={isSupported}
            showDots={true}
            showArrows={true}
            autoPlay={true}
            autoPlayInterval={4000}
          />
        );

      default:
        return null;
    }
  };

  const renderGrowth = () => {
    const dimensions = ['self_know', 'self_act', 'self_show', 'world_know', 'world_act', 'world_show'];
    
    return (
      <div className="space-y-8">
        {dimensions.map((dimension) => {
          const events = growthEventsByDimension[dimension] || [];
          if (events.length === 0) return null;

          const getDimensionTitle = (dim: string) => {
            const titles = {
              'self_know': 'Self Knowledge',
              'self_act': 'Self Action',
              'self_show': 'Self Expression',
              'world_know': 'World Knowledge',
              'world_act': 'World Action',
              'world_show': 'World Expression'
            };
            return titles[dim as keyof typeof titles] || dim;
          };

          return (
            <div key={dimension} className="space-y-4">
              <h3 className="text-xl font-semibold text-white/80 mb-4">
                {getDimensionTitle(dimension)}
              </h3>
              <div className="relative overflow-hidden">
                <div 
                  className="flex space-x-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" 
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none'
                  }}
                >
                  {events.map((event) => (
                    <div key={event.id} className="flex-shrink-0 w-72 sm:w-80 snap-start">
                      <GrowthEventCard
                        title={event.title}
                        content={event.content}
                        growthDimension={event.growthDimension}
                        cardCover={event.cardCover}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPrompts = () => {
    return (
      <div className="space-y-6">
        {prompts.map((prompt) => (
          <ProactivePromptCard
            key={prompt.id}
            title={prompt.title}
            content={prompt.content}
            cardCover={prompt.cardCover}
            videoBackground={prompt.videoBackground}
            backgroundType={prompt.backgroundType}
            onPlay={() => onPlay?.('prompt', prompt.id)}
            onPause={() => onPause?.('prompt', prompt.id)}
            isPlaying={isPlaying('prompt', prompt.id)}
            isSupported={isSupported}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 ${className}`}>
      <div className="max-w-7xl mx-auto p-8">
        {/* Section Navigation */}
        <div className="mb-8">
          <SectionNavigation
            sections={[
              { id: 'opening', title: 'Opening', description: 'Welcome and overview' },
              { id: 'insights', title: 'Insights', description: 'Dynamic insights and patterns' },
              { id: 'growth', title: 'Growth', description: 'Growth events and milestones' },
              { id: 'prompts', title: 'Prompts', description: 'Proactive suggestions' }
            ]}
            currentSection={currentSection}
            onSectionChange={handleSectionChange}
            variant="tabs"
            className="justify-center"
          />
        </div>

        {/* Content Area */}
        <div className="transition-all duration-500">
          {currentSection === 'opening' && (
            <div className="max-w-4xl mx-auto pt-40">
              <HeroAudioCard
                title={openingContent.title}
                content={openingContent.content}
                isSupported={isSupported}
                onPlay={() => onPlay?.('opening', 'opening')}
                onPause={() => onPause?.('opening', 'opening')}
                isPlaying={isPlaying('opening', 'opening')}
                maxLength={500}
                showExpandButton={true}
                className="w-full"
              />
            </div>
          )}

          {currentSection === 'insights' && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-semibold text-white/80 mb-8 text-center">
                Dynamic Insights
              </h2>
              {renderInsights()}
            </div>
          )}

          {currentSection === 'growth' && (
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-semibold text-white/80 mb-8 text-center">
                Growth Events
              </h2>
              {renderGrowth()}
            </div>
          )}

          {currentSection === 'prompts' && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-semibold text-white/80 mb-8 text-center">
                Proactive Prompts
              </h2>
              {renderPrompts()}
            </div>
          )}
        </div>

        {/* Auto-rotation indicator */}
        {autoRotate && (
          <div className="fixed bottom-4 right-4 text-white/60 text-sm">
            Auto-rotating in {rotationInterval / 1000}s
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;
