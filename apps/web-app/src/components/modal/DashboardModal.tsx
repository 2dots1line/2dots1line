'use client';

import { GlassmorphicPanel, GlassButton, MarkdownRenderer, CardTile, useTextToSpeech, HeroAudioCard, PortraitInsightCard, GrowthEventCard, ProactivePromptCard } from '@2dots1line/ui-components';
import { useTranslation } from '@2dots1line/core-utils/i18n/useTranslation';
import { useUserStore } from '../../stores/UserStore';
import { EntityDetailModal } from './EntityDetailModal';
import { useCardStore } from '../../stores/CardStore';
import { useHUDStore } from '../../stores/HUDStore';
import { useEngagementStore } from '../../stores/EngagementStore';
import { useDeviceStore } from '../../stores/DeviceStore';
import { useDashboardStore } from '../../stores/DashboardStore';
import { useNotificationStore } from '../../stores/NotificationStore';
import { useChatStore } from '../../stores/ChatStore';
import { useAudioStore } from '../../stores/AudioStore';
import { useAutoLoadCards } from '../hooks/useAutoLoadCards';
import { 
  X, 
  TrendingUp, 
  Activity,
  Brain,
  Globe,
  Target,
  Lightbulb,
  Star,
  BookOpen,
  MessageCircle,
  Award,
  Clock,
  Zap,
  Eye,
  Compass,
  Sprout,
  User,
  Plus,
  Sparkles,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { dashboardService, type RecentActivity, type DynamicDashboardData, type DashboardSectionItem } from '../../services/dashboardService';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Types are now imported from dashboardService

const DashboardModal: React.FC<DashboardModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [userData, setUserData] = useState<{ name: string; email: string; memberSince: string } | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [dynamicDashboardData, setDynamicDashboardData] = useState<DynamicDashboardData | null>(null);
  
  const { user } = useUserStore();
  const { t } = useTranslation(user?.language_preference);
  
  // Use the same stores as infinite/sorted card views
  const { cards, setSelectedCard, isLoading: cardsLoading, error: cardsError } = useCardStore();
  const { setCardDetailModalOpen, setActiveView } = useHUDStore();
  const { trackEvent } = useEngagementStore();
  const { deviceInfo } = useDeviceStore();
  
  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Ensure cards are loaded when dashboard opens
  useAutoLoadCards();
  
  // Text-to-speech functionality
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech({
    rate: 0.8, // Slower, more natural pace
    pitch: 1.0, // Natural pitch
    volume: 0.9, // Clear volume
    onEnd: () => {}
  });

  // Data transformation functions for mobile dashboard
  const transformDashboardData = (dynamicData: DynamicDashboardData) => {
    // Get all available sections like desktop version does
    const allSections = Object.entries(dynamicData.sections || {})
      .filter(([sectionKey, sectionData]) => 
        sectionData && 
        sectionData.items && 
        sectionData.items.length > 0 &&
        // Exclude growth_dimensions, opening_words, recent_cards, and mobile_growth_events as they belong to other tabs
        sectionKey !== 'growth_dimensions' &&
        sectionKey !== 'opening_words' &&
        sectionKey !== 'recent_cards' &&
        sectionKey !== 'mobile_growth_events'
      );

    // Get insights from all available sections (same logic as desktop)
    const insights = allSections.flatMap(([sectionKey, sectionData]) => 
      sectionData.items.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        cardCover: item.background_image_url,
        videoBackground: undefined,
        backgroundType: item.background_image_url ? 'image' : 'solid' as const,
        // Preserve section information for entity type determination
        sectionKey: sectionKey
      }))
    );

    // Get growth events - use mobile-specific section
    const growthEvents = (() => {
      const sectionData = (dynamicData.sections as any).mobile_growth_events;
      if (!sectionData || !sectionData.items) {
        return [];
      }
      
      
      const events: any[] = [];
      
      // Extract events from each dimension
      sectionData.items.forEach((dimensionItem: any) => {
        const dimension = dimensionItem.metadata?.dimension;
        const dimensionEvents = dimensionItem.metadata?.events || [];
        
        
        dimensionEvents.forEach((event: any) => {
          events.push({
            id: event.entity_id || `${dimension}-${Math.random()}`,
            title: event.content?.substring(0, 50) + '...' || dimensionItem.title,
            content: event.content || '',
            growthDimension: dimension,
            cardCover: undefined // Growth events don't have card covers
          });
        });
      });
      
      return events;
    })();

    // Get prompts from all prompt sections
    const promptSections = [
      'reflection_prompts',
      'exploration_prompts', 
      'goal_setting_prompts',
      'skill_development_prompts',
      'creative_expression_prompts'
    ];
    
    const prompts = promptSections.flatMap(sectionKey => 
      (dynamicData.sections[sectionKey as keyof typeof dynamicData.sections]?.items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        cardCover: item.background_image_url,
        videoBackground: undefined,
        backgroundType: item.background_image_url ? 'image' : 'solid' as const
      }))
    );

    return {
      openingContent: {
        id: dynamicData.sections.opening_words?.items?.[0]?.id || 'opening-default',
        title: dynamicData.sections.opening_words?.items?.[0]?.title || "Welcome to Your Journey",
        content: dynamicData.sections.opening_words?.items?.[0]?.content || "Your personalized dashboard where we'll explore your recent insights, growth milestones, and proactive suggestions.",
        // Add metadata for entity type determination
        metadata: {
          artifact_type: 'opening'
        },
        // Mark as derived artifact for entity type
        sectionKey: 'opening_words'
      },
      insights,
      growthEvents,
      prompts
    };
  };

  // TTS handlers for mobile dashboard
  const handleTTSPlay = (type: string, id: string) => {
    const transformedData = dynamicDashboardData ? transformDashboardData(dynamicDashboardData) : null;
    if (!transformedData) return;

    let content = '';
    switch (type) {
      case 'opening':
        content = `${transformedData.openingContent.title}. ${transformedData.openingContent.content}`;
        break;
      case 'insight': {
        const insight = transformedData.insights.find(i => i.id === id);
        content = insight ? `${insight.title}. ${insight.content}` : '';
        break;
      }
      case 'growth': {
        const growthEvent = transformedData.growthEvents.find(g => g.id === id);
        content = growthEvent ? `${growthEvent.title}. ${growthEvent.content}` : '';
        break;
      }
      case 'prompt': {
        const prompt = transformedData.prompts.find(p => p.id === id);
        content = prompt ? `${prompt.title}. ${prompt.content}` : '';
        break;
      }
    }
    
    if (content) {
      speak(content);
    }
  };

  const handleTTSPause = () => {
    stop();
  };

  // Handle card clicks to open entity detail modal
  const handleCardClick = (entity: any) => {
    // Use the same pattern as CapsulePill and SeedEntitiesDisplay
    // Dispatch custom event that the existing listener will handle
    const entityId = entity.id || entity.entity_id;
    
    // Determine entity type based on section and context
    let entityType = entity.metadata?.artifact_type || entity.type || entity.entity_type;
    
    // If no type found, determine based on section and context
    if (!entityType) {
      if (entity.growthDimension) {
        // Growth events - this takes priority over section key
        entityType = 'growthevent';
      } else if (entity.sectionKey) {
        // Determine based on section key
        if (entity.sectionKey.endsWith('_prompts')) {
          // Prompt sections come from proactive_prompts table
          entityType = 'proactiveprompt';
        } else {
          // Regular artifact sections come from derived_artifacts table
          entityType = 'derivedartifact';
        }
      } else {
        // Default fallback
        entityType = 'derivedartifact';
      }
    }
    
    // Override artifact_type if it's not a valid entity type for the API
    if (entityType === 'opening' || entityType === 'insight' || entityType === 'pattern' || entityType === 'recommendation' || entityType === 'synthesis') {
      entityType = 'derivedartifact';
    }
    
    const displayText = entity.title || entity.name || 'Entity';
    
    if (entityId && entityType) {
      window.dispatchEvent(new CustomEvent('open-entity-modal', {
        detail: { entityId, entityType, displayText }
      }));
    }
  };

  const isCurrentlyPlaying = (type: string, id: string) => {
    return isSpeaking;
  };
  const [dashboardConfig, setDashboardConfig] = useState<{
    dashboard_sections: Record<string, {
      title: string;
      icon: string;
      description: string;
      max_items: number;
      priority: number;
      category: string;
    }>;
    dashboard_layout: {
      tabs: Record<string, {
        title: string;
        icon: string;
        section_groups: Array<{
          title: string;
          sections: string[];
          priority: number;
        }>;
      }>;
    };
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'opening' | 'dynamic' | 'growth-trajectory' | 'activity'>('opening');
  const [proactiveGreeting, setProactiveGreeting] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [userMetrics, setUserMetrics] = useState<{
    memory_units_count: number;
    concepts_count: number;
    growth_events_count: number;
    cards_count: number;
    latest_cycle_date_range: {
      start_date: string | null;
      end_date: string | null;
    };
    total_artifacts: number;
    total_prompts: number;
  } | null>(null);

  // Tab name mapping
  const tabNames: Record<string, string> = {
    'opening': t('dashboard.tabs.overview' as any),
    'dynamic': t('dashboard.tabs.insights' as any),
    'growth-trajectory': t('dashboard.tabs.growth' as any),
    'activity': t('dashboard.tabs.activity' as any)
  };

  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to defer the API calls to next tick, allowing UI to render first
      const loadTimeout = setTimeout(() => {
        loadDashboardData();
      }, 0); // Defer to next tick
      
      return () => clearTimeout(loadTimeout);
    }
  }, [isOpen]);

  // Listen for entity modal open requests from inline capsules
  useEffect(() => {
    const handleEntityModalOpen = async (event: Event) => {
      const { entityId, entityType, displayText } = (event as CustomEvent).detail || {};
      if (entityId && entityType) {
        
        try {
          // Create a basic entity object that matches the expected format
          // Use the same structure as Cards and Cosmos nodes
          const entity = {
            id: entityId,
            entity_id: entityId,
            type: entityType,
            entity_type: entityType,
            title: displayText || entityId,
            name: displayText || entityId,
            // Add source entity fields to match card format
            source_entity_id: entityId,
            source_entity_type: entityType
          };
          
          setSelectedEntity(entity);
          setEntityModalOpen(true);
        } catch (error) {
          console.error('Error opening entity modal:', error);
        }
      }
    };
    window.addEventListener('open-entity-modal', handleEntityModalOpen);
    return () => window.removeEventListener('open-entity-modal', handleEntityModalOpen);
  }, []);

  // Cards are loaded automatically when user is authenticated via useAutoLoadCards hook above

  // Handle card selection - same approach as infinite/sorted card views
  const handleCardSelect = (card: any) => {
    // Track card click in dashboard
    trackEvent({
      type: 'click',
      target: card.title || card.name || card.card_id || 'unknown_card',
      targetType: 'card',
      view: 'dashboard',
      metadata: {
        cardId: card.card_id || card.id,
        cardTitle: card.title || card.name,
        action: 'card_select',
        source: 'dashboard_modal'
      }
    });

    setSelectedCard(card);
    setCardDetailModalOpen(true);
  };

  // Render recent cards section - mini sorted card view
  const renderRecentCards = () => {
    // Use the same card store as sorted view, but limit to 5 most recent
    const recentCards = cards.slice(0, 5);
    
    // Show loading state while cards are being loaded, but only if we don't have any cards yet
    if (cardsLoading && cards.length === 0) {
      return (
        <div className="text-center py-4 text-white/60">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60 mx-auto mb-2"></div>
          <p className="text-sm">{t('dashboard.loading.cards' as any)}</p>
        </div>
      );
    }
    
    // Show error state if cards failed to load
    if (cardsError) {
      return (
        <div className="text-center py-4 text-red-400">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="text-sm">{t('dashboard.errors.failedToLoad' as any)}</p>
          <p className="text-xs text-red-300 mt-1">{cardsError}</p>
        </div>
      );
    }
    
    // Show empty state if no cards are available
    if (recentCards.length === 0) {
      return (
        <div className="text-center py-4 text-white/60">
          <div className="text-2xl mb-2">📭</div>
          <p className="text-sm">{t('dashboard.empty.noCards')}</p>
        </div>
      );
    }

    return recentCards.map((card: any, index: number) => (
      <div key={card.card_id || `card-${index}`} className="mx-auto w-48 h-48">
        <CardTile
          card={card}
          size="lg"
          onClick={() => handleCardSelect(card)}
          showActions={false}
          showMetadata={true}
          className="w-full h-full"
          optimizeForInfiniteGrid={false}
        />
      </div>
    ));
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Check authentication
      const token = localStorage.getItem('auth_token');
      
      // Load all dashboard data
      const [legacyResponse, dynamicResponse, configResponse, greetingResponse, metricsResponse] = await Promise.all([
        dashboardService.getDashboardData(),
        dashboardService.getDynamicDashboard(),
        dashboardService.getDashboardConfig(),
        dashboardService.getProactiveGreeting(),
        dashboardService.getUserMetrics()
      ]);
      
      if (legacyResponse.success && legacyResponse.data) {
        setUserData({
          name: 'User',
          email: 'user@example.com',
          memberSince: '2024-01-01'
        });
        setRecentActivity(legacyResponse.data.recentActivity);
      } else {
        console.error('Failed to load legacy dashboard data:', legacyResponse.error);
      }

      if (dynamicResponse.success && dynamicResponse.data) {
        setDynamicDashboardData(dynamicResponse.data);
      } else {
        console.error('Failed to load dynamic dashboard data:', dynamicResponse.error);
      }

      if (configResponse.success && configResponse.data) {
        setDashboardConfig(configResponse.data);
      } else {
        console.error('Failed to load dashboard config:', configResponse.error);
      }

      if (greetingResponse.success && greetingResponse.data) {
        setProactiveGreeting(greetingResponse.data.greeting);
      } else {
        console.error('Failed to load proactive greeting:', greetingResponse.error);
      }

      if (metricsResponse.success && metricsResponse.data) {
        setUserMetrics(metricsResponse.data);
      } else {
        console.error('Failed to load user metrics:', metricsResponse.error);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const key =
      hour < 12
        ? 'dashboard.greeting.morning'
        : hour < 17
        ? 'dashboard.greeting.afternoon'
        : 'dashboard.greeting.evening';
    return t(key as any);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };


  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'journal': return <BookOpen size={16} className="stroke-current" strokeWidth={1.5} />;
      case 'conversation': return <MessageCircle size={16} className="stroke-current" strokeWidth={1.5} />;
      case 'insight': return <Lightbulb size={16} className="stroke-current" strokeWidth={1.5} />;
      case 'growth': return <TrendingUp size={16} className="stroke-current" strokeWidth={1.5} />;
      default: return <Activity size={16} className="stroke-current" strokeWidth={1.5} />;
    }
  };

  // Map emoji icons to Lucide components
  const getIconComponent = (emoji: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      '💡': Lightbulb,
      '🎯': Target,
      '📋': Award,
      '🤔': MessageCircle,
      '🎉': Star,
      '🃏': Eye,
      '📈': TrendingUp,
      '🔍': Compass,
      '🧠': Brain,
      '🌟': Star,
      '⚠️': Eye,
      '🎨': Star,
      '📚': BookOpen,
      '⚡': Zap,
      '💬': MessageCircle,
      '🌍': Globe,
      '🌱': Sprout,
      '🎭': User,
      '🆕': Plus,
      '🔮': Sparkles
    };
    return iconMap[emoji] || Lightbulb;
  };


  // Get section groups for a specific tab from configuration
  const getTabSectionGroups = (tabKey: string) => {
    if (!dashboardConfig) {
      return [];
    }
    
    const tabConfig = dashboardConfig.dashboard_layout?.tabs?.[tabKey];
    if (!tabConfig?.section_groups) {
      return [];
    }
    
    return tabConfig.section_groups.sort((a, b) => a.priority - b.priority);
  };


  // Render any section dynamically based on configuration
  const renderSection = (sectionKey: string, sectionData: { items: Array<{ id: string; title: string; content: string; confidence?: number; actionability?: string }>; total_count: number }) => {
    const config = dashboardConfig?.dashboard_sections?.[sectionKey];
    if (!config || !dashboardConfig) return null;
    
    // Hide sections with no data
    if (!sectionData.items || sectionData.items.length === 0) return null;
    
    
    const IconComponent = getIconComponent(config.icon);
    
    return (
      <GlassmorphicPanel
        key={sectionKey}
        variant="glass-panel"
        rounded="lg"
        padding="md"
        className="hover:bg-white/15 transition-all duration-200 h-fit"
      >
        <div className="flex items-center gap-3 mb-4">
          <IconComponent size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
          <h4 className="text-white/90 font-medium">{config.title}</h4>
          <span className="text-xs text-white/60">({sectionData.total_count})</span>
        </div>
        <div className="space-y-3">
          {sectionData.items.slice(0, config.max_items || 3).map((item) => (
            <div key={item.id} className="p-3 bg-white/10 rounded-lg">
              <div className="text-sm font-medium text-white/90 mb-2">{item.title}</div>
              <div className="text-xs text-white/70 leading-relaxed">
                <MarkdownRenderer 
                  content={item.content}
                  variant="dashboard"
                  className="text-xs text-white/70 leading-relaxed"
                />
              </div>
              {item.confidence && (
                <div className="text-xs text-white/50 mt-2">
                  Confidence: {Math.round(item.confidence * 100)}%
                </div>
              )}
              {item.actionability && (
                <div className="text-xs text-blue-400 mt-2">
                  {item.actionability}
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassmorphicPanel>
    );
  };

  if (!isOpen) return null;

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="fixed inset-0 z-40 pointer-events-auto">
        <div className="flex items-center justify-center h-full">
          <div className="text-white/60">Loading...</div>
        </div>
      </div>
    );
  }

  // Mobile Dashboard - Direct overlay on video background using mobile-specific page templates
  // Only render on client side to prevent hydration mismatch
  if (deviceInfo.isMobile && dynamicDashboardData) {
    const transformedData = transformDashboardData(dynamicDashboardData);
    
    // Show loading state if data is still being processed
    if (isLoading) {
      return (
        <div className="fixed inset-0 z-40 pointer-events-auto">
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60">{t('dashboard.loading.growthData')}</div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="fixed inset-0 z-40 pointer-events-auto">
        {/* Mobile Navigation */}
        <div className="absolute top-4 left-20 right-4 z-50">
          <div className="flex gap-2 mb-4">
            {[
              { key: 'opening', label: t('dashboard.tabs.overview' as any) },
              { key: 'dynamic', label: t('dashboard.tabs.insights' as any) },
              { key: 'growth-trajectory', label: t('dashboard.tabs.growth' as any) }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Content with reduced top spacing */}
        <div className="pt-20 px-4 pb-4 h-full overflow-y-auto">
          {/* Opening Section - Use same approach as desktop with MarkdownRenderer */}
          {activeTab === 'opening' && (
            <div className="max-w-4xl mx-auto">
              <div 
                className="cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleCardClick(transformedData.openingContent);
                }}
              >
                <GlassmorphicPanel
                  variant="glass-panel"
                  rounded="xl"
                  padding="lg"
                  className="hover:bg-white/15 transition-all duration-200"
                >
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-white/90">
                      {transformedData.openingContent.title}
                    </h2>
                  </div>
                  {isSupported && (
                    <div className="flex justify-end">
                      <GlassButton
                        onClick={(e) => {
                          e.stopPropagation();
                          const textToSpeak = `${transformedData.openingContent.title}. ${transformedData.openingContent.content}`;
                          if (isSpeaking) {
                            stop();
                          } else {
                            speak(textToSpeak);
                          }
                        }}
                        variant="default"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isSpeaking ? (
                          <>
                            <Pause size={14} className="stroke-current" strokeWidth={1.5} />
                            <span className="text-sm">{t('dashboard.actions.pause')}</span>
                          </>
                        ) : (
                          <>
                            <Play size={14} className="stroke-current" strokeWidth={1.5} />
                            <span className="text-sm">{t('dashboard.actions.listen')}</span>
                          </>
                        )}
                      </GlassButton>
                    </div>
                  )}
                </div>
                <div className="prose prose-invert max-w-none text-left" style={{ textAlign: 'left' }}>
                  <MarkdownRenderer 
                    content={transformedData.openingContent.content}
                    variant="dashboard"
                    className="prose prose-invert max-w-none text-left"
                  />
                </div>
              </GlassmorphicPanel>
              </div>
            </div>
          )}

          {/* Insights Section - Use PortraitInsightCard with standardized 16:9 aspect ratio */}
          {activeTab === 'dynamic' && (
            <div className="max-w-6xl mx-auto">
              <div className="space-y-6">
                {transformedData.insights.map((insight) => (
                  <div 
                    key={insight.id}
                    onClick={() => handleCardClick(insight)}
                    className="cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                  >
                    <PortraitInsightCard
                      title={insight.title}
                      content={insight.content}
                      cardCover={insight.cardCover}
                      videoBackground={insight.videoBackground}
                      backgroundType={insight.backgroundType as "image" | "solid" | "video" | undefined}
                      onPlay={() => handleTTSPlay('insight', insight.id)}
                      onPause={handleTTSPause}
                      isPlaying={isCurrentlyPlaying('insight', insight.id)}
                      isSupported={isSupported}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Growth Section - 6 rows by growth dimension with horizontal scroll */}
          {activeTab === 'growth-trajectory' && (
            <div className="max-w-6xl mx-auto">
              <div className="space-y-6">
                {(() => {
                  
                  // Group growth events by dimension
                  const eventsByDimension = transformedData.growthEvents.reduce((acc, event) => {
                    const dimension = event.growthDimension || 'unknown';
                    if (!acc[dimension]) {
                      acc[dimension] = [];
                    }
                    acc[dimension].push(event);
                    return acc;
                  }, {} as Record<string, any[]>);
                  

                  // Define the 6 growth dimensions in order - FIXED to match actual data keys
                  const growthDimensions = [
                    'know_self', 'act_self', 'show_self', 
                    'know_world', 'act_world', 'show_world'
                  ];

                  return growthDimensions.map((dimension) => {
                    const events = eventsByDimension[dimension] || [];
                    const dimensionDisplayName = {
                      'know_self': 'Self Knowledge',
                      'act_self': 'Self Action', 
                      'show_self': 'Self Expression',
                      'know_world': 'World Knowledge',
                      'act_world': 'World Action',
                      'show_world': 'World Expression'
                    }[dimension] || dimension;


                    return (
                      <div key={dimension} className="space-y-3">
                        <h3 className="text-lg font-semibold text-white/90 px-2">
                          {dimensionDisplayName}
                        </h3>
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                          {events.length > 0 ? (
                            events.map((event: any) => (
                              <div 
                                key={event.id} 
                                className="flex-shrink-0 w-72 cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                                onClick={() => handleCardClick(event)}
                              >
                                <GrowthEventCard
                                  title={event.title}
                                  content={event.content}
                                  growthDimension={event.growthDimension}
                                  cardCover={event.cardCover}
                                  className="w-full"
                                  onReadMore={() => handleCardClick(event)}
                                />
                              </div>
                            ))
                          ) : (
                            <div className="flex-shrink-0 w-80 h-32 flex items-center justify-center text-white/60 text-sm">
                              No events for {dimensionDisplayName}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

        </div>

        {/* Mobile Dashboard Chat Button */}
        <button
          onClick={() => setActiveView('chat')}
          className="fixed bottom-4 left-4 z-50 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/20 hover:scale-105 transition-all duration-200 shadow-lg"
          title="Start a conversation"
        >
          <MessageCircle size={18} />
        </button>

        {/* Entity Detail Modal for capsule clicks */}
        {selectedEntity && (
          <EntityDetailModal
            entity={selectedEntity}
            isOpen={entityModalOpen}
            onClose={() => {
              setEntityModalOpen(false);
              setSelectedEntity(null);
            }}
          />
        )}
      </div>
    );
  }

  // Desktop Dashboard - Modal container
  return (
    <div className="fixed inset-4 z-40 flex items-center justify-center pointer-events-none">
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="lg"
        className="relative w-full max-w-7xl max-h-[90vh] overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white font-brand">{tabNames[activeTab]}</h1>
            <p className="text-white/70 text-sm">
              {proactiveGreeting || `${getGreeting()}, ${userData?.name || t('common.user' as any)}! ${t('dashboard.greeting.subtitle' as any)}`}
            </p>
          </div>
          <GlassButton
            onClick={onClose}
            className="p-2 hover:bg-white/20"
          >
            <X size={20} className="stroke-current" />
          </GlassButton>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="h-[calc(90vh-200px)] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/70">Loading your cosmic journey...</p>
            </div>
          </div>
        )}

        {/* Content Area */}
        {!isLoading && (
          <div className="h-[calc(90vh-200px)] overflow-y-auto custom-scrollbar">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {[
                { key: 'opening', label: t('dashboard.tabs.overview' as any), icon: BookOpen },
                { key: 'dynamic', label: t('dashboard.tabs.insights' as any), icon: Brain },
                { key: 'growth-trajectory', label: t('dashboard.tabs.growth' as any), icon: TrendingUp },
                { key: 'activity', label: t('dashboard.tabs.activity' as any), icon: Activity }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <GlassButton
                    key={tab.key}
                    onClick={() => {
                      // Track dashboard tab click
                      trackEvent({
                        type: 'click',
                        target: tab.key,
                        targetType: 'button',
                        view: 'dashboard',
                        metadata: {
                          tabLabel: tab.label,
                          fromTab: activeTab,
                          toTab: tab.key,
                          action: 'tab_switch'
                        }
                      });
                      setActiveTab(tab.key as any);
                    }}
                    className={`px-4 py-2 flex items-center gap-2 transition-all duration-200 ${
                      activeTab === tab.key 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <IconComponent size={16} className="stroke-current" strokeWidth={1.5} />
                    {tab.label}
                  </GlassButton>
                );
              })}
            </div>




            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <GlassmorphicPanel
                  variant="glass-panel"
                  rounded="lg"
                  padding="md"
                  className="hover:bg-white/15 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Activity size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                    <h3 className="text-white/90 font-medium">{t('dashboard.sections.recentActivity' as any)}</h3>
                  </div>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-white/10 rounded-lg transition-all duration-200">
                        <div className="mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white/90 mb-1">{activity.title}</div>
                          <div className="text-xs text-white/70 mb-2">{activity.description}</div>
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <Clock size={12} className="stroke-current" strokeWidth={1.5} />
                            <span>{formatTimeAgo(activity.timestamp)}</span>
                            {activity.dimension && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{activity.dimension.replace('_', ' ')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassmorphicPanel>
              </div>
            )}

            {/* Dynamic Insights Tab - Configuration-Driven */}
            {activeTab === 'dynamic' && (
              <div className="space-y-6">
                {dynamicDashboardData && dashboardConfig ? (
                  <>
                    {/* User Metrics Header */}
                    <GlassmorphicPanel
                      variant="glass-panel"
                      rounded="lg"
                      padding="md"
                      className="hover:bg-white/15 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Brain size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                          <h3 className="text-white/90 font-medium">{t('dashboard.sections.dynamicInsights' as any)}</h3>
                        </div>
                        {userMetrics?.latest_cycle_date_range?.start_date && (
                          <div className="text-sm text-white/60">
                            Latest Cycle: {new Date(userMetrics.latest_cycle_date_range.start_date).toLocaleDateString()} - {userMetrics.latest_cycle_date_range.end_date ? new Date(userMetrics.latest_cycle_date_range.end_date).toLocaleDateString() : 'Ongoing'}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{userMetrics?.memory_units_count || 0}</div>
                          <div className="text-xs text-white/60">Memory Units</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{userMetrics?.concepts_count || 0}</div>
                          <div className="text-xs text-white/60">Concepts</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{userMetrics?.growth_events_count || 0}</div>
                          <div className="text-xs text-white/60">{t('dashboard.metrics.growthEvents' as any)}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{userMetrics?.cards_count || 0}</div>
                          <div className="text-xs text-white/60">Cards</div>
                        </div>
                      </div>
                    </GlassmorphicPanel>

                    {/* DYNAMIC SECTIONS - Show all available sections directly */}
                    {dashboardConfig && dynamicDashboardData?.sections ? (
                      <div className="columns-1 lg:columns-2 xl:columns-3 gap-6 space-y-6">
                        {Object.entries(dynamicDashboardData.sections)
                          .filter(([sectionKey, sectionData]) => 
                            sectionData && 
                            sectionData.items && 
                            sectionData.items.length > 0 &&
                            // Exclude growth_dimensions, opening_words, and recent_cards as they belong to other tabs
                            sectionKey !== 'growth_dimensions' &&
                            sectionKey !== 'opening_words' &&
                            sectionKey !== 'recent_cards'
                          )
                          .sort(([a]: [string, any], [b]: [string, any]) => {
                            const priorityA = dashboardConfig?.dashboard_sections?.[a]?.priority || 999;
                            const priorityB = dashboardConfig?.dashboard_sections?.[b]?.priority || 999;
                            return priorityA - priorityB;
                          })
                          .map(([sectionKey, sectionData]: [string, any]) => (
                            <div key={sectionKey} className="break-inside-avoid mb-6">
                              {renderSection(sectionKey, sectionData)}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="col-span-2 text-center py-8">
                        <div className="text-white/60">Loading insights...</div>
                      </div>
                    )}
                  </>
                ) : (
                  <GlassmorphicPanel
                    variant="glass-panel"
                    rounded="lg"
                    padding="md"
                    className="hover:bg-white/15 transition-all duration-200"
                  >
                    <div className="text-center py-8">
                      <Brain size={48} className="text-white/40 mx-auto mb-4" />
                      <h3 className="text-white/90 font-medium mb-2">No Dynamic Insights Available</h3>
                      <p className="text-white/60 text-sm">
                        Start a conversation to generate insights, or check back later for new data.
                      </p>
                    </div>
                  </GlassmorphicPanel>
                )}
              </div>
            )}

            {/* Opening Tab */}
            {activeTab === 'opening' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Opening Words - 75% of page */}
                  <div className="lg:col-span-3">
                    <GlassmorphicPanel
                      variant="glass-panel"
                      rounded="lg"
                      padding="lg"
                      className="hover:bg-white/15 transition-all duration-200 h-full"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <BookOpen size={24} className="text-white/80 stroke-current" strokeWidth={1.5} />
                          <h3 className="text-2xl font-semibold text-white/90">{t('dashboard.sections.editorsNote')}</h3>
                        </div>
                        {isSupported && (
                          <GlassButton
                            onClick={() => {
                              const openingWords = dynamicDashboardData?.sections?.opening_words?.items?.[0];
                              const textToSpeak = openingWords ? 
                                `${openingWords.title}. ${openingWords.content}` : 
                                "Your Journey Through the Cosmos. Welcome to your personal cosmic journey. This month, we've witnessed remarkable growth across all dimensions of your being. Your conversations have revealed patterns of self-discovery that speak to a deeper understanding of your place in the universe.";
                              
                              if (isSpeaking) {
                                stop();
                              } else {
                                speak(textToSpeak);
                              }
                            }}
                            variant="default"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            {isSpeaking ? (
                              <>
                                <Pause size={16} className="stroke-current" strokeWidth={1.5} />
                                <span>{t('dashboard.actions.pause')}</span>
                              </>
                            ) : (
                              <>
                                <Play size={16} className="stroke-current" strokeWidth={1.5} />
                                <span>{t('dashboard.actions.listen')}</span>
                              </>
                            )}
                          </GlassButton>
                        )}
                      </div>
                      <div className="prose prose-invert max-w-none text-left" style={{ textAlign: 'left' }}>
                        {(() => {
                          const openingWords = dynamicDashboardData?.sections?.opening_words?.items?.[0];
                          
                          if (openingWords) {
                            return (
                              <>
                                <h1 className="text-4xl font-bold text-white mb-6 leading-tight text-left">
                                  {openingWords.title}
                                </h1>
                                <div className="text-lg text-white/90 leading-relaxed text-left" style={{ textAlign: 'left' }}>
                                  <MarkdownRenderer 
                                    content={openingWords.content} 
                                    variant="dashboard"
                                    className="prose prose-invert max-w-none text-left"
                                  />
                                </div>
                              </>
                            );
                          } else {
                            // Fallback to hardcoded content if no opening words exist
                            return (
                              <>
                                <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
                                  {t('dashboard.fallback.title')}
                                </h1>
                                <div className="text-lg text-white/90 leading-relaxed">
                                  <p>{t('dashboard.fallback.paragraph1')}</p>
                                  <p>{t('dashboard.fallback.paragraph2')}</p>
                                  <p>{t('dashboard.fallback.paragraph3')}</p>
                                  <p className="text-white/70 italic">“{t('dashboard.fallback.quote')}”</p>
                                </div>
                              </>
                            );
                          }
                        })()}
                      </div>
                    </GlassmorphicPanel>
                  </div>

                  {/* Recent Cards Column - 25% of page */}
                  <div className="lg:col-span-1">
                    <GlassmorphicPanel
                      variant="glass-panel"
                      rounded="lg"
                      padding="md"
                      className="hover:bg-white/15 transition-all duration-200 h-full"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Eye size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                        <h4 className="text-white/90 font-medium">{t('dashboard.sections.recentCards')}</h4>
                      </div>
                <div className="space-y-6 h-full overflow-y-auto custom-scrollbar">
                  {renderRecentCards()}
                </div>
                    </GlassmorphicPanel>
                  </div>
                </div>
              </div>
            )}


            {/* Growth Trajectory Tab */}
            {activeTab === 'growth-trajectory' && (
              <div className="space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-white/60">Loading growth trajectory...</div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      const sectionData = dynamicDashboardData?.sections?.growth_dimensions;
                      if (!sectionData || sectionData.items?.[0]?.metadata?.layout?.type !== 'table') {
                        return <div className="text-white/60">No growth dimensions data available</div>;
                      }
                      
                      const tableData = sectionData.items[0].metadata;
                      
                      return (
                        <GlassmorphicPanel
                          variant="glass-panel"
                          rounded="lg"
                          padding="md"
                          className="hover:bg-white/15 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <TrendingUp size={24} className="text-white/80 stroke-current" strokeWidth={1.5} />
                            <h3 className="text-2xl font-semibold text-white/90">Growth Trajectory</h3>
                            <span className="text-sm text-white/60">({sectionData.total_count})</span>
                          </div>
                          
                          {/* Dynamic Table Layout */}
                          <div className="overflow-x-auto">
                            <table className="w-full table-fixed">
                              <thead>
                                <tr className="border-b border-white/20">
                                  <th className="w-1/5 text-left py-3 px-3 text-white/80 font-medium">Dimension</th>
                                  {tableData.layout.columns.map((column: any) => {
                                    // Use different icons for different column types
                                    const getColumnIcon = (columnKey: string) => {
                                      if (columnKey === 'whats_new') return Clock;
                                      if (columnKey === 'whats_next') return Target;
                                      return TrendingUp; // fallback
                                    };
                                    
                                    const ColumnIconComponent = getColumnIcon(column.key);
                                    
                                    return (
                                      <th key={column.key} className="w-2/5 text-center py-3 px-4 text-white/80 font-medium">
                                        <div className="flex items-center justify-center gap-2">
                                          <ColumnIconComponent size={16} className="text-white/70" />
                                          <span>{column.title}</span>
                                        </div>
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/10">
                                {tableData.layout.rows.map((row: any) => {
                                  const RowIconComponent = getIconComponent(row.icon);
                                  return (
                                    <tr key={row.key} className="hover:bg-white/5 transition-colors">
                                      <td className="w-1/5 py-4 px-3">
                                        <div className="flex items-center gap-2">
                                          <RowIconComponent size={18} className="text-white/70 stroke-current" strokeWidth={1.5} />
                                          <span className="text-white/90 font-medium break-words">{row.title}</span>
                                        </div>
                                      </td>
                                      {tableData.layout.columns.map((column: any) => {
                                        return (
                                          <td key={column.key} className="w-2/5 py-4 px-4 align-top">
                                            <div className="text-sm text-white/70">
                                              {row.cells[column.key].count > 0 ? (
                                                <div className="space-y-2">
                                                  {row.cells[column.key].events.slice(0, 2).map((event: any) => (
                                                    <div key={event.entity_id} className="bg-white/10 rounded-lg p-3">
                                                      <div className="text-sm text-white/90">
                                                        <MarkdownRenderer 
                                                          content={event.content}
                                                          variant="dashboard"
                                                          className="text-sm text-white/90"
                                                        />
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="bg-white/5 rounded-lg p-3">
                                                  <div className="text-xs text-white/40">
                                                    {column.key === 'whats_new' ? 'No recent growth events' : 'No strategic recommendations'}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </GlassmorphicPanel>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </GlassmorphicPanel>

      {/* Card Detail Modal is handled by ModalContainer */}
      
      {/* Entity Detail Modal for capsule clicks */}
      {selectedEntity && (
        <EntityDetailModal
          entity={selectedEntity}
          isOpen={entityModalOpen}
          onClose={() => {
            setEntityModalOpen(false);
            setSelectedEntity(null);
          }}
        />
      )}
    </div>
  );
};

export default DashboardModal;