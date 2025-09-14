'use client';

import { GlassmorphicPanel, GlassButton, CardTile } from '@2dots1line/ui-components';
import { 
  X, 
  TrendingUp, 
  Calendar, 
  Activity,
  Brain,
  Heart,
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
  Compass
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { dashboardService, type GrowthDimension, type Insight, type RecentActivity, type DynamicDashboardData, type DashboardSection } from '../../services/dashboardService';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Types are now imported from dashboardService

const DashboardModal: React.FC<DashboardModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [growthProfile, setGrowthProfile] = useState<GrowthDimension[]>([]);
  const [recentInsights, setRecentInsights] = useState<Insight[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [dynamicDashboardData, setDynamicDashboardData] = useState<DynamicDashboardData | null>(null);
  const [recentCards, setRecentCards] = useState<any[]>([]);
  const [dashboardConfig, setDashboardConfig] = useState<any>(null);
  const [sectionGroups, setSectionGroups] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'growth' | 'insights' | 'activity' | 'dynamic' | 'magazine' | 'insights-reflections' | 'growth-trajectory'>('overview');

  // Icon mapping for growth dimensions
  const dimensionIcons: Record<string, React.ComponentType<any>> = {
    self_know: Brain,
    self_act: Target,
    self_show: Heart,
    world_know: BookOpen,
    world_act: Globe,
    world_show: MessageCircle
  };

  // Mock data will be replaced by API calls

  useEffect(() => {
    if (isOpen) {
      loadDashboardData();
    }
  }, [isOpen]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load all dashboard data
      const [legacyResponse, dynamicResponse, cardsResponse, configResponse] = await Promise.all([
        dashboardService.getDashboardData(),
        dashboardService.getDynamicDashboard(),
        dashboardService.getRecentCards(5),
        dashboardService.getDashboardConfig()
      ]);
      
      if (legacyResponse.success && legacyResponse.data) {
        setUserData({
          name: 'Alex', // This would come from user service
          email: 'alex@example.com',
          memberSince: '2024-06-15'
        });
        setGrowthProfile(legacyResponse.data.growthProfile);
        setRecentInsights(legacyResponse.data.recentInsights);
        setRecentActivity(legacyResponse.data.recentActivity);
      } else {
        console.error('Failed to load legacy dashboard data:', legacyResponse.error);
      }

      if (dynamicResponse.success && dynamicResponse.data) {
        setDynamicDashboardData(dynamicResponse.data);
      } else {
        console.error('Failed to load dynamic dashboard data:', dynamicResponse.error);
      }

      if (cardsResponse.success && cardsResponse.data) {
        console.log('🎯 Cards loaded successfully:', cardsResponse.data);
        console.log('🎯 Number of cards:', cardsResponse.data.length);
        console.log('🎯 Card types:', cardsResponse.data.map(c => c.type));
        console.log('🎯 Card titles:', cardsResponse.data.map(c => c.title));
        setRecentCards(cardsResponse.data);
      } else {
        console.error('❌ Failed to load recent cards:', cardsResponse.error);
        setRecentCards([]); // Set empty array on failure
      }

      if (configResponse.success && configResponse.data) {
        console.log('🔧 Dashboard config loaded:', configResponse.data);
        console.log('🔧 Dashboard sections:', configResponse.data.dashboard_sections);
        setDashboardConfig(configResponse.data.dashboard_sections);
        
        // Extract section groups for Dynamic Insights tab
        const sectionGroups = configResponse.data.dashboard_layout?.section_groups || [];
        const dynamicInsightsSections = sectionGroups
          .flatMap(group => group.sections)
          .filter(section => section); // Remove any undefined values
        setSectionGroups(dynamicInsightsSections);
        console.log('🔧 Dynamic Insights sections:', dynamicInsightsSections);
      } else {
        console.error('❌ Failed to load dashboard config:', configResponse.error);
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

  const getDimensionIcon = (dimension: GrowthDimension) => {
    const IconComponent = dimensionIcons[dimension.key];
    return IconComponent ? <IconComponent size={16} className="stroke-current" strokeWidth={1.5} /> : null;
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
      '📚': BookOpen
    };
    return iconMap[emoji] || Lightbulb;
  };

  // Render any section dynamically based on configuration
  const renderSection = (sectionKey: string, sectionData: any) => {
    const config = dashboardConfig?.[sectionKey];
    if (!config || !dashboardConfig) return null;
    
    const IconComponent = getIconComponent(config.icon);
    
    return (
      <GlassmorphicPanel
        key={sectionKey}
        variant="glass-panel"
        rounded="lg"
        padding="md"
        className="hover:bg-white/15 transition-all duration-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <IconComponent size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
          <h4 className="text-white/90 font-medium">{config.title}</h4>
          <span className="text-xs text-white/60">({sectionData.total_count})</span>
        </div>
        <div className="space-y-3">
          {sectionData.items.slice(0, config.max_items || 3).map((item: any) => (
            <div key={item.id} className="p-3 bg-white/10 rounded-lg">
              <div className="text-sm font-medium text-white/90 mb-1">{item.title}</div>
              <div className="text-xs text-white/70 line-clamp-2">{item.content}</div>
              {item.confidence && (
                <div className="text-xs text-white/50 mt-1">
                  Confidence: {Math.round(item.confidence * 100)}%
                </div>
              )}
              {item.actionability && (
                <div className="text-xs text-blue-400 mt-1">
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
            <h1 className="text-2xl font-bold text-white font-brand">Dashboard</h1>
                          <p className="text-white/70 text-sm">
                {getGreeting()}, {userData?.name || 'there'}! Here&apos;s your growth journey.
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
                { key: 'overview', label: 'Overview', icon: Compass },
                { key: 'magazine', label: 'Magazine', icon: BookOpen },
                { key: 'insights-reflections', label: 'Insights & Reflections', icon: Lightbulb },
                { key: 'growth-trajectory', label: 'Growth Trajectory', icon: TrendingUp },
                { key: 'growth', label: 'Growth Dimensions', icon: Target },
                { key: 'insights', label: 'Legacy Insights', icon: Star },
                { key: 'activity', label: 'Activity', icon: Activity },
                { key: 'dynamic', label: 'Dynamic Insights', icon: Brain }
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

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Cosmic Metrics */}
                <GlassmorphicPanel
                  variant="glass-panel"
                  rounded="lg"
                  padding="md"
                  className="hover:bg-white/15 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Star size={24} className="text-white/80 stroke-current" strokeWidth={1.5} />
                    <h3 className="text-lg font-semibold text-white/90">Cosmic Metrics</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Memories', value: '127', icon: Brain, color: 'text-purple-400' },
                      { label: 'Active Insights', value: '23', icon: Lightbulb, color: 'text-yellow-400' },
                      { label: 'Growth Events', value: '156', icon: TrendingUp, color: 'text-green-400' },
                      { label: 'Days Active', value: '45', icon: Calendar, color: 'text-blue-400' }
                    ].map((metric) => {
                      const IconComponent = metric.icon;
                      return (
                        <div key={metric.label} className="text-center">
                          <IconComponent size={20} className={`${metric.color} stroke-current mx-auto mb-2`} strokeWidth={1.5} />
                          <div className="text-2xl font-bold text-white">{metric.value}</div>
                          <div className="text-xs text-white/60">{metric.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </GlassmorphicPanel>

                {/* Growth Dimensions Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GlassmorphicPanel
                    variant="glass-panel"
                    rounded="lg"
                    padding="md"
                    className="hover:bg-white/15 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Target size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                      <h3 className="text-white/90 font-medium">Growth Dimensions</h3>
                    </div>
                    <div className="space-y-3">
                      {growthProfile.slice(0, 3).map((dimension) => (
                        <div key={dimension.key} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getDimensionIcon(dimension)}
                            <span className="text-sm text-white/80">{dimension.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-white/20 rounded-full h-2">
                              <div 
                                className={`bg-gradient-to-r ${dimension.color} h-2 rounded-full transition-all duration-300`}
                                style={{ width: `${dimension.percentageOfMax}%` }}
                              />
                            </div>
                            <span className="text-xs text-white/60">{Math.round(dimension.percentageOfMax)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassmorphicPanel>

                  <GlassmorphicPanel
                    variant="glass-panel"
                    rounded="lg"
                    padding="md"
                    className="hover:bg-white/15 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                      <h3 className="text-white/90 font-medium">Recent Insights</h3>
                    </div>
                    <div className="space-y-3">
                      {recentInsights.slice(0, 3).map((insight) => (
                        <div key={insight.id} className="cursor-pointer hover:bg-white/10 p-2 rounded transition-all duration-200">
                          <div className="text-sm font-medium text-white/90 mb-1">{insight.title}</div>
                          <div className="text-xs text-white/60 line-clamp-2">{insight.description}</div>
                          <div className="text-xs text-white/40 mt-1">{formatTimeAgo(insight.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  </GlassmorphicPanel>
                </div>

                {/* Quick Actions */}
                <GlassmorphicPanel
                  variant="glass-panel"
                  rounded="lg"
                  padding="md"
                  className="hover:bg-white/15 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Zap size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                    <h3 className="text-white/90 font-medium">Quick Actions</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Start Journaling', icon: BookOpen, action: () => console.log('Start journaling') },
                      { label: 'Chat with Dot', icon: MessageCircle, action: () => console.log('Open chat') },
                      { label: 'Explore Cards', icon: Eye, action: () => console.log('Open cards') },
                      { label: 'View Insights', icon: Lightbulb, action: () => setActiveTab('insights') }
                    ].map((action) => {
                      const IconComponent = action.icon;
                      return (
                        <GlassButton
                          key={action.label}
                          onClick={action.action}
                          className="p-3 flex flex-col items-center gap-2 hover:bg-white/20 transition-all duration-200"
                        >
                          <IconComponent size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                          <span className="text-xs text-white/80">{action.label}</span>
                        </GlassButton>
                      );
                    })}
                  </div>
                </GlassmorphicPanel>
              </div>
            )}

            {/* Growth Dimensions Tab */}
            {activeTab === 'growth' && (
              <div className="space-y-6">
                <GlassmorphicPanel
                  variant="glass-panel"
                  rounded="lg"
                  padding="md"
                  className="hover:bg-white/15 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp size={24} className="text-white/80 stroke-current" strokeWidth={1.5} />
                    <h3 className="text-lg font-semibold text-white/90">Six-Dimensional Growth Profile</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         {growthProfile.map((dimension) => (
                      <div key={dimension.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getDimensionIcon(dimension)}
                            <div>
                              <div className="text-white/90 font-medium">{dimension.name}</div>
                              <div className="text-xs text-white/60">{dimension.description}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">{Math.round(dimension.percentageOfMax)}%</div>
                            <div className="text-xs text-white/60">
                              {dimension.trend === 'increasing' && '↗ Growing'}
                              {dimension.trend === 'decreasing' && '↘ Declining'}
                              {dimension.trend === 'stable' && '→ Stable'}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3">
                          <div 
                            className={`bg-gradient-to-r ${dimension.color} h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${dimension.percentageOfMax}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassmorphicPanel>

                {/* Growth Recommendations */}
                <GlassmorphicPanel
                  variant="glass-panel"
                  rounded="lg"
                  padding="md"
                  className="hover:bg-white/15 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Award size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                    <h3 className="text-white/90 font-medium">Growth Recommendations</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      {
                        dimension: 'Act World',
                        recommendation: 'Consider volunteering at a local community center to apply your self-knowledge in service to others.',
                        impact: 'High',
                        effort: 'Medium'
                      },
                      {
                        dimension: 'Show Self',
                        recommendation: 'Start a personal blog or vlog to share your creative insights and authentic voice.',
                        impact: 'Medium',
                        effort: 'Low'
                      }
                    ].map((rec, index) => (
                      <div key={index} className="p-3 bg-white/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-white/90">{rec.dimension}</span>
                          <span className="text-xs px-2 py-1 bg-white/20 rounded text-white/60">
                            Impact: {rec.impact}
                          </span>
                          <span className="text-xs px-2 py-1 bg-white/20 rounded text-white/60">
                            Effort: {rec.effort}
                          </span>
                        </div>
                        <div className="text-sm text-white/70">{rec.recommendation}</div>
                      </div>
                    ))}
                  </div>
                </GlassmorphicPanel>
              </div>
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {recentInsights.map((insight) => (
                    <GlassmorphicPanel
                      key={insight.id}
                      variant="glass-panel"
                      rounded="lg"
                      padding="md"
                      className="hover:bg-white/15 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Lightbulb size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                        <span className="text-white/90 font-medium">{insight.title}</span>
                      </div>
                      <p className="text-white/70 text-sm mb-4 line-clamp-3">{insight.description}</p>
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span>{formatTimeAgo(insight.createdAt)}</span>
                        <span className="capitalize">{insight.type.replace('_', ' ')}</span>
                      </div>
                    </GlassmorphicPanel>
                  ))}
                </div>
              </div>
            )}

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
                    {/* Cycle Info Header */}
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
                        <div className="text-sm text-white/60">
                          Cycle: {new Date(dynamicDashboardData.cycle_info.cycle_start_date).toLocaleDateString()} - {new Date(dynamicDashboardData.cycle_info.cycle_end_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{dynamicDashboardData.cycle_info.artifacts_created}</div>
                          <div className="text-xs text-white/60">Artifacts</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{dynamicDashboardData.cycle_info.prompts_created}</div>
                          <div className="text-xs text-white/60">Prompts</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{dynamicDashboardData.cycle_info.status}</div>
                          <div className="text-xs text-white/60">Status</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">
                            {dynamicDashboardData.cycle_info.processing_duration_ms ? Math.round(dynamicDashboardData.cycle_info.processing_duration_ms / 1000) : 'N/A'}s
                          </div>
                          <div className="text-xs text-white/60">Processing</div>
                        </div>
                      </div>
                    </GlassmorphicPanel>

                    {/* DYNAMIC SECTIONS - Configuration-driven */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {dashboardConfig && sectionGroups.length > 0 ? (
                        Object.entries(dynamicDashboardData.sections)
                          .filter(([sectionKey]) => sectionGroups.includes(sectionKey))
                          .sort(([a], [b]) => {
                            const priorityA = dashboardConfig?.[a]?.priority || 999;
                            const priorityB = dashboardConfig?.[b]?.priority || 999;
                            return priorityA - priorityB;
                          })
                          .map(([sectionKey, sectionData]) => (
                            <div key={sectionKey} className="space-y-4">
                              {renderSection(sectionKey, sectionData)}
                            </div>
                          ))
                      ) : (
                        <div className="col-span-2 text-center py-8">
                          <div className="text-white/60">Loading configuration...</div>
                        </div>
                      )}
                    </div>
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

            {/* Magazine Tab */}
            {activeTab === 'magazine' && (
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
                        <h3 className="text-2xl font-semibold text-white/90">Editor's Note</h3>
                      </div>
                      <div className="prose prose-invert max-w-none">
                        <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
                          Your Journey Through the Cosmos
                        </h1>
                        <div className="text-lg text-white/90 leading-relaxed space-y-4">
                          <p>
                            Welcome to your personal cosmic journey. This month, we've witnessed remarkable growth 
                            across all dimensions of your being. Your conversations have revealed patterns of 
                            self-discovery that speak to a deeper understanding of your place in the universe.
                          </p>
                          <p>
                            The insights we've gathered show a person who is not just growing, but evolving. 
                            Each interaction, each moment of reflection, each new connection you make adds 
                            another layer to the rich tapestry of your experience.
                          </p>
                          <p>
                            As you explore the cards and insights that follow, remember that this is your story. 
                            These are your discoveries, your breakthroughs, your moments of clarity. They represent 
                            not just where you've been, but where you're heading.
                          </p>
                          <p className="text-white/70 italic">
                            "The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself."
                          </p>
                        </div>
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
                  {(() => {
                    const cards = dynamicDashboardData?.sections?.recent_cards?.items || [];
                    console.log('🎨 Magazine tab rendering - cards from sections:', cards);
                    console.log('🎨 Magazine tab rendering - cards.length:', cards.length);
                    return cards.length > 0 ? (
                      cards.map((card, index) => {
                        console.log(`🎨 Rendering card ${index}:`, card);
                        
                        // Get card type for gradient selection
                        const cardType = card.metadata?.card_type || 'default';
                        const gradients = {
                          memoryunit: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          concept: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                          derived_artifact: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                          proactive_prompt: 'linear-gradient(135deg, #ffaa00 0%, #ff8800 100%)',
                          default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        };
                        
                        const backgroundImage = card.metadata?.background_image_url 
                          ? `url(${card.metadata.background_image_url})` 
                          : gradients[cardType as keyof typeof gradients] || gradients.default;
                        
                        return (
                          <div 
                            key={card.id} 
                            className="relative w-48 h-48 mx-auto rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                            style={{
                              backgroundImage,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat'
                            }}
                          >
                            {/* Card Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 rounded-2xl" />
                            
                            {/* Card Content */}
                            <div className="relative z-10 h-full flex flex-col justify-end p-4">
                              <div className="text-white">
                                <h3 className="text-sm font-semibold mb-1 text-shadow-sm">
                                  {card.title}
                                </h3>
                                <p className="text-xs text-white/80 text-shadow-sm line-clamp-2">
                                  {card.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-white/60">
                        <div className="text-2xl mb-2">📭</div>
                        <p className="text-sm">No recent cards available</p>
                        <p className="text-xs text-white/40 mt-1">Check console for API errors</p>
                      </div>
                    );
                  })()}
                </div>
                    </GlassmorphicPanel>
                  </div>
                </div>
              </div>
            )}

            {/* Insights & Reflections Tab */}
            {activeTab === 'insights-reflections' && (
              <div className="space-y-6">
                {dynamicDashboardData ? (
                  <>
                    {/* Cycle Info Header */}
                    <GlassmorphicPanel
                      variant="glass-panel"
                      rounded="lg"
                      padding="md"
                      className="hover:bg-white/15 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Lightbulb size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                          <h3 className="text-white/90 font-medium">Insights & Reflections</h3>
                        </div>
                        <div className="text-sm text-white/60">
                          Cycle: {new Date(dynamicDashboardData.cycle_info.cycle_start_date).toLocaleDateString()} - {new Date(dynamicDashboardData.cycle_info.cycle_end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </GlassmorphicPanel>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {/* Insights & Patterns */}
                      <div className="space-y-6">
                        <GlassmorphicPanel
                          variant="glass-panel"
                          rounded="lg"
                          padding="md"
                          className="hover:bg-white/15 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <Lightbulb size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                            <h4 className="text-white/90 font-medium">Key Insights</h4>
                            <span className="text-xs text-white/60">({dynamicDashboardData.sections.insights.total_count})</span>
                          </div>
                          <div className="space-y-3">
                            {dynamicDashboardData.sections.insights.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="p-3 bg-white/10 rounded-lg">
                                <div className="text-sm font-medium text-white/90 mb-1">{item.title}</div>
                                <div className="text-xs text-white/70 line-clamp-2">{item.content}</div>
                                {item.confidence && (
                                  <div className="text-xs text-white/50 mt-1">
                                    Confidence: {Math.round(item.confidence * 100)}%
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </GlassmorphicPanel>

                        <GlassmorphicPanel
                          variant="glass-panel"
                          rounded="lg"
                          padding="md"
                          className="hover:bg-white/15 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <Target size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                            <h4 className="text-white/90 font-medium">Patterns</h4>
                            <span className="text-xs text-white/60">({dynamicDashboardData.sections.patterns.total_count})</span>
                          </div>
                          <div className="space-y-3">
                            {dynamicDashboardData.sections.patterns.items.slice(0, 2).map((item) => (
                              <div key={item.id} className="p-3 bg-white/10 rounded-lg">
                                <div className="text-sm font-medium text-white/90 mb-1">{item.title}</div>
                                <div className="text-xs text-white/70 line-clamp-2">{item.content}</div>
                              </div>
                            ))}
                          </div>
                        </GlassmorphicPanel>
                      </div>

                      {/* Recommendations & Synthesis */}
                      <div className="space-y-6">
                        <GlassmorphicPanel
                          variant="glass-panel"
                          rounded="lg"
                          padding="md"
                          className="hover:bg-white/15 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <Star size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                            <h4 className="text-white/90 font-medium">Recommendations</h4>
                            <span className="text-xs text-white/60">({dynamicDashboardData.sections.recommendations.total_count})</span>
                          </div>
                          <div className="space-y-3">
                            {dynamicDashboardData.sections.recommendations.items.slice(0, 2).map((item) => (
                              <div key={item.id} className="p-3 bg-white/10 rounded-lg">
                                <div className="text-sm font-medium text-white/90 mb-1">{item.title}</div>
                                <div className="text-xs text-white/70 line-clamp-2">{item.content}</div>
                                {item.actionability && (
                                  <div className="text-xs text-blue-400 mt-1">
                                    {item.actionability}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </GlassmorphicPanel>

                        <GlassmorphicPanel
                          variant="glass-panel"
                          rounded="lg"
                          padding="md"
                          className="hover:bg-white/15 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <Brain size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                            <h4 className="text-white/90 font-medium">Synthesis</h4>
                            <span className="text-xs text-white/60">({dynamicDashboardData.sections.synthesis.total_count})</span>
                          </div>
                          <div className="space-y-3">
                            {dynamicDashboardData.sections.synthesis.items.slice(0, 2).map((item) => (
                              <div key={item.id} className="p-3 bg-white/10 rounded-lg">
                                <div className="text-sm font-medium text-white/90 mb-1">{item.title}</div>
                                <div className="text-xs text-white/70 line-clamp-2">{item.content}</div>
                              </div>
                            ))}
                          </div>
                        </GlassmorphicPanel>
                      </div>

                      {/* Prompts */}
                      <div className="space-y-6">
                        <GlassmorphicPanel
                          variant="glass-panel"
                          rounded="lg"
                          padding="md"
                          className="hover:bg-white/15 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <MessageCircle size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                            <h4 className="text-white/90 font-medium">Reflection Prompts</h4>
                            <span className="text-xs text-white/60">({dynamicDashboardData.sections.reflection_prompts.total_count})</span>
                          </div>
                          <div className="space-y-3">
                            {dynamicDashboardData.sections.reflection_prompts.items.slice(0, 2).map((item) => (
                              <div key={item.id} className="p-3 bg-white/10 rounded-lg">
                                <div className="text-sm font-medium text-white/90 mb-1">{item.title}</div>
                                <div className="text-xs text-white/70 line-clamp-2">{item.content}</div>
                              </div>
                            ))}
                          </div>
                        </GlassmorphicPanel>
                      </div>
                    </div>
                  </>
                ) : (
                  <GlassmorphicPanel
                    variant="glass-panel"
                    rounded="lg"
                    padding="lg"
                    className="hover:bg-white/15 transition-all duration-200"
                  >
                    <div className="text-center py-8">
                      <Lightbulb size={48} className="text-white/40 mx-auto mb-4" />
                      <h3 className="text-white/90 font-medium mb-2">No Insights Available</h3>
                      <p className="text-white/60 text-sm">
                        Start a conversation to generate insights, or check back later for new data.
                      </p>
                    </div>
                  </GlassmorphicPanel>
                )}
              </div>
            )}

            {/* Growth Trajectory Tab */}
            {activeTab === 'growth-trajectory' && (
              <div className="space-y-6">
                <GlassmorphicPanel
                  variant="glass-panel"
                  rounded="lg"
                  padding="md"
                  className="hover:bg-white/15 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp size={24} className="text-white/80 stroke-current" strokeWidth={1.5} />
                    <h3 className="text-2xl font-semibold text-white/90">Growth Trajectory</h3>
                  </div>
                  
                  {/* Growth Dimensions Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-3 px-4 text-white/80 font-medium">Dimension</th>
                          <th className="text-center py-3 px-4 text-white/80 font-medium">What's New</th>
                          <th className="text-center py-3 px-4 text-white/80 font-medium">What's Next</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {[
                          { key: 'self_know', name: 'Self Knowledge', icon: Brain },
                          { key: 'self_act', name: 'Self Action', icon: Target },
                          { key: 'self_show', name: 'Self Expression', icon: Heart },
                          { key: 'world_know', name: 'World Knowledge', icon: BookOpen },
                          { key: 'world_act', name: 'World Action', icon: Globe },
                          { key: 'world_show', name: 'World Expression', icon: MessageCircle }
                        ].map((dimension) => {
                          const IconComponent = dimension.icon;
                          return (
                            <tr key={dimension.key} className="hover:bg-white/5 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <IconComponent size={20} className="text-white/70 stroke-current" strokeWidth={1.5} />
                                  <span className="text-white/90 font-medium">{dimension.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="text-sm text-white/70">
                                  {(() => {
                                    // Get insights related to this dimension from dynamic dashboard data
                                    const dimensionInsights = dynamicDashboardData?.sections?.insights?.items?.filter(item => 
                                      item.content?.toLowerCase().includes(dimension.key.replace('_', ' ')) ||
                                      item.title?.toLowerCase().includes(dimension.key.replace('_', ' '))
                                    ).slice(0, 1);
                                    
                                    if (dimensionInsights && dimensionInsights.length > 0) {
                                      const insight = dimensionInsights[0];
                                      return (
                                        <div className="bg-white/10 rounded-lg p-3 mb-2">
                                          <div className="text-xs text-white/60 mb-1">Recent Insight</div>
                                          <div className="text-sm text-white/90 line-clamp-2">
                                            {insight.title}
                                          </div>
                                          <div className="text-xs text-white/50 mt-1">
                                            {new Date(insight.created_at).toLocaleDateString()}
                                          </div>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div className="bg-white/5 rounded-lg p-3 mb-2">
                                          <div className="text-xs text-white/40">No recent insights</div>
                                        </div>
                                      );
                                    }
                                  })()}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="text-sm text-white/70">
                                  {(() => {
                                    // Get focus areas for this dimension from dynamic dashboard data
                                    const focusAreas = dynamicDashboardData?.sections?.focus_areas?.items?.filter(item => 
                                      item.content?.toLowerCase().includes(dimension.key.replace('_', ' ')) ||
                                      item.title?.toLowerCase().includes(dimension.key.replace('_', ' '))
                                    ).slice(0, 1);
                                    
                                    if (focusAreas && focusAreas.length > 0) {
                                      const focus = focusAreas[0];
                                      return (
                                        <div className="bg-white/10 rounded-lg p-3 mb-2">
                                          <div className="text-xs text-white/60 mb-1">Focus Area</div>
                                          <div className="text-sm text-white/90 line-clamp-2">
                                            {focus.title}
                                          </div>
                                          <div className="text-xs text-white/50 mt-1">
                                            {new Date(focus.created_at).toLocaleDateString()}
                                          </div>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div className="bg-white/5 rounded-lg p-3 mb-2">
                                          <div className="text-xs text-white/40">No focus areas</div>
                                        </div>
                                      );
                                    }
                                  })()}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </GlassmorphicPanel>
              </div>
            )}
          </div>
        )}
      </GlassmorphicPanel>
    </div>
  );
};

export default DashboardModal; 