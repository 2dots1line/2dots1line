'use client';

import { GlassmorphicPanel, GlassButton, MarkdownRenderer, CardTile } from '@2dots1line/ui-components';
import { useCardStore } from '../../stores/CardStore';
import { useHUDStore } from '../../stores/HUDStore';
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
  Sparkles
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
  const [userData, setUserData] = useState<{ name: string; email: string; memberSince: string } | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [dynamicDashboardData, setDynamicDashboardData] = useState<DynamicDashboardData | null>(null);
  // Use the same stores as infinite/sorted card views
  const { cards, setSelectedCard } = useCardStore();
  const { setCardDetailModalOpen } = useHUDStore();
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
    'opening': 'Opening',
    'dynamic': 'Dynamic Insights',
    'growth-trajectory': 'Growth Trajectory',
    'activity': 'Activity'
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

  // Cards are now loaded automatically when user is authenticated via useAutoLoadCards

  // Handle card selection - same approach as infinite/sorted card views
  const handleCardSelect = (card: any) => {
    setSelectedCard(card);
    setCardDetailModalOpen(true);
  };

  // Render recent cards section - mini sorted card view
  const renderRecentCards = () => {
    // Use the same card store as sorted view, but limit to 5 most recent
    const recentCards = cards.slice(0, 5);
    
    if (recentCards.length === 0) {
      return (
        <div className="text-center py-4 text-white/60">
          <div className="text-2xl mb-2">📭</div>
          <p className="text-sm">No recent cards available</p>
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
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
              <div className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{item.content}</div>
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
              {proactiveGreeting || `${getGreeting()}, ${userData?.name || 'there'}! Here's your growth journey.`}
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
                { key: 'opening', label: 'Opening', icon: BookOpen },
                { key: 'dynamic', label: 'Dynamic Insights', icon: Brain },
                { key: 'growth-trajectory', label: 'Growth Trajectory', icon: TrendingUp },
                { key: 'activity', label: 'Activity', icon: Activity }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <GlassButton
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
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
                    <h3 className="text-white/90 font-medium">Recent Activity</h3>
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
                          <h3 className="text-white/90 font-medium">Dynamic Insights</h3>
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
                          <div className="text-xs text-white/60">Growth Events</div>
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
                      <div className="flex items-center gap-3 mb-6">
                        <BookOpen size={24} className="text-white/80 stroke-current" strokeWidth={1.5} />
                        <h3 className="text-2xl font-semibold text-white/90">Editor&apos;s Note</h3>
                      </div>
                      <div className="prose prose-invert max-w-none">
                        {(() => {
                          const openingWords = dynamicDashboardData?.sections?.opening_words?.items?.[0];
                          
                          if (openingWords) {
                            return (
                              <>
                                <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
                                  {openingWords.title}
                                </h1>
                                <div className="text-lg text-white/90 leading-relaxed">
                                  <MarkdownRenderer 
                                    content={openingWords.content} 
                                    variant="dashboard"
                                    className="prose prose-invert max-w-none"
                                  />
                                </div>
                              </>
                            );
                          } else {
                            // Fallback to hardcoded content if no opening words exist
                            return (
                              <>
                                <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
                                  Your Journey Through the Cosmos
                                </h1>
                                <div className="text-lg text-white/90 leading-relaxed">
                                  <p>
                                    Welcome to your personal cosmic journey. This month, we&apos;ve witnessed remarkable growth 
                                    across all dimensions of your being. Your conversations have revealed patterns of 
                                    self-discovery that speak to a deeper understanding of your place in the universe.
                                  </p>
                                  <p>
                                    The insights we&apos;ve gathered show a person who is not just growing, but evolving. 
                                    Each interaction, each moment of reflection, each new connection you make adds 
                                    another layer to the rich tapestry of your experience.
                                  </p>
                                  <p>
                                    As you explore the cards and insights that follow, remember that this is your story. 
                                    These are your discoveries, your breakthroughs, your moments of clarity. They represent 
                                    not just where you&apos;ve been, but where you&apos;re heading.
                                  </p>
                                  <p className="text-white/70 italic">
                                    &ldquo;The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.&rdquo;
                                  </p>
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
                        <h4 className="text-white/90 font-medium">Recent Cards</h4>
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
                                                        {event.content}
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
    </div>
  );
};

export default DashboardModal; 