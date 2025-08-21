'use client';

import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
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
import { dashboardService, type GrowthDimension, type Insight, type RecentActivity } from '../../services/dashboardService';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'growth' | 'insights' | 'activity'>('overview');

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
      const response = await dashboardService.getDashboardData();
      
      if (response.success && response.data) {
        setUserData({
          name: 'Alex', // This would come from user service
          email: 'alex@example.com',
          memberSince: '2024-06-15'
        });
        setGrowthProfile(response.data.growthProfile);
        setRecentInsights(response.data.recentInsights);
        setRecentActivity(response.data.recentActivity);
      } else {
        console.error('Failed to load dashboard data:', response.error);
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
            <div className="flex gap-2 mb-6">
              {[
                { key: 'overview', label: 'Overview', icon: Compass },
                { key: 'growth', label: 'Growth Dimensions', icon: TrendingUp },
                { key: 'insights', label: 'Insights', icon: Lightbulb },
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
          </div>
        )}
      </GlassmorphicPanel>
    </div>
  );
};

export default DashboardModal; 