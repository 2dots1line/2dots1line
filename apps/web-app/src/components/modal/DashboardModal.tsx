'use client';

import React from 'react';
import { 
  X, 
  TrendingUp, 
  Users, 
  Calendar, 
  Activity,
  BarChart2,
  PieChart,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardModal: React.FC<DashboardModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-4 z-40 flex items-center justify-center pointer-events-none">
      {/* Modal Content - Only the modal panel captures pointer events */}
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="lg"
        className="relative w-full max-w-5xl max-h-[85vh] overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white font-brand">Dashboard</h1>
          <GlassButton
            onClick={onClose}
            className="p-2 hover:bg-white/20"
          >
            <X size={20} className="stroke-current" />
          </GlassButton>
        </div>

        {/* Content Area */}
        <div className="h-[calc(85vh-200px)] overflow-y-auto custom-scrollbar">
          {/* Carousel Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white/90">Recent Insights</h2>
              <div className="flex gap-2">
                <GlassButton className="p-2 hover:bg-white/20">
                  <ChevronLeft size={16} className="stroke-current" />
                </GlassButton>
                <GlassButton className="p-2 hover:bg-white/20">
                  <ChevronRight size={16} className="stroke-current" />
                </GlassButton>
              </div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4].map((item) => (
                <GlassmorphicPanel
                  key={item}
                  variant="glass-panel"
                  rounded="lg"
                  padding="md"
                  className="min-w-[280px] flex-shrink-0 hover:bg-white/15 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                    <span className="text-white/90 font-medium">Insight {item}</span>
                  </div>
                  <p className="text-white/70 text-sm mb-4">
                    This is a placeholder insight card that would contain meaningful data and analysis.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-white/60">
                    <span>2 hours ago</span>
                    <span>•</span>
                    <span>Growth</span>
                  </div>
                </GlassmorphicPanel>
              ))}
            </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large Card - Stats Overview */}
            <GlassmorphicPanel
              variant="glass-panel"
              rounded="lg"
              padding="md"
              className="md:col-span-2 hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <BarChart2 size={24} className="text-white/80 stroke-current" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold text-white/90">Overview</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Memories', value: '127', icon: Calendar },
                  { label: 'Insights', value: '23', icon: TrendingUp },
                  { label: 'Connections', value: '8', icon: Users },
                  { label: 'Growth', value: '+12%', icon: Activity }
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <stat.icon size={16} className="text-white/60 stroke-current mx-auto mb-2" strokeWidth={1.5} />
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-white/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </GlassmorphicPanel>

            {/* Activity Card */}
            <GlassmorphicPanel
              variant="glass-panel"
              rounded="lg"
              padding="md"
              className="hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <Activity size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                <h3 className="text-white/90 font-medium">Activity</h3>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white/50 rounded-full" />
                    <div className="text-sm text-white/70">
                      Activity item {item}
                    </div>
                  </div>
                ))}
              </div>
            </GlassmorphicPanel>

            {/* Chart Card */}
            <GlassmorphicPanel
              variant="glass-panel"
              rounded="lg"
              padding="md"
              className="hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <PieChart size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                <h3 className="text-white/90 font-medium">Analytics</h3>
              </div>
              <div className="h-32 flex items-center justify-center text-white/50 text-sm">
                Chart Placeholder
              </div>
            </GlassmorphicPanel>

            {/* Progress Card */}
            <GlassmorphicPanel
              variant="glass-panel"
              rounded="lg"
              padding="md"
              className="md:col-span-2 hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={20} className="text-white/80 stroke-current" strokeWidth={1.5} />
                <h3 className="text-white/90 font-medium">Progress Tracking</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Personal Growth', progress: 75 },
                  { name: 'Reflection Practice', progress: 60 },
                  { name: 'Goal Achievement', progress: 90 }
                ].map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm text-white/80 mb-1">
                      <span>{item.name}</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-white/60 to-white/80 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassmorphicPanel>
          </div>
        </div>
      </GlassmorphicPanel>
    </div>
  );
};

export default DashboardModal; 