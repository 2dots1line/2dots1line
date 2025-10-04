/**
 * DashboardSection.tsx
 * V9.7 React component for displaying individual dashboard sections
 */

import React from 'react';
import { MarkdownRenderer } from '@2dots1line/ui-components';
import { DashboardSection as DashboardSectionType, DashboardSectionItem } from '../../services/dashboardService';

interface DashboardSectionProps {
  section: DashboardSectionType;
  maxItems?: number;
  showHeader?: boolean;
  className?: string;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  section,
  maxItems = 5,
  showHeader = true,
  className = ''
}) => {
  const displayItems = section.items.slice(0, maxItems);
  const hasMore = section.items.length > maxItems;

  const getSectionIcon = (sectionType: string) => {
    const icons: Record<string, string> = {
      insights: '💡',
      patterns: '🔍',
      recommendations: '📋',
      synthesis: '🧠',
      identified_patterns: '🎯',
      emerging_themes: '🌟',
      focus_areas: '🎯',
      blind_spots: '⚠️',
      celebration_moments: '🎉',
      reflection_prompts: '🤔',
      exploration_prompts: '🔍',
      goal_setting_prompts: '🎯',
      skill_development_prompts: '📚',
      creative_expression_prompts: '🎨',
      memory_profile: '👤'
    };
    return icons[sectionType] || '📄';
  };

  const getPriorityColor = (priority?: number) => {
    if (!priority) return 'text-gray-500';
    if (priority >= 8) return 'text-red-500';
    if (priority >= 6) return 'text-orange-500';
    if (priority >= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getSectionIcon(section.section_type)}</span>
            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            <span className="text-sm text-gray-500">({section.total_count})</span>
          </div>
          <div className="text-xs text-gray-400">
            Updated {new Date(section.last_updated).toLocaleDateString()}
          </div>
        </div>
      )}

      {displayItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <p>No {section.title.toLowerCase()} available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayItems.map((item, index) => (
            <DashboardItem key={item.id} item={item} index={index} />
          ))}
          
          {hasMore && (
            <div className="text-center pt-2">
              <span className="text-sm text-gray-500">
                +{section.items.length - maxItems} more {section.title.toLowerCase()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface DashboardItemProps {
  item: DashboardSectionItem;
  index: number;
}

const DashboardItem: React.FC<DashboardItemProps> = ({ item, index }) => {
  const getPriorityColor = (priority?: number) => {
    if (!priority) return 'text-gray-500';
    if (priority >= 8) return 'text-red-500';
    if (priority >= 6) return 'text-orange-500';
    if (priority >= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm leading-tight">
          {item.title}
        </h4>
        <div className="flex items-center space-x-2 ml-2">
          {item.priority && (
            <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
              P{item.priority}
            </span>
          )}
          {item.confidence && (
            <span className={`text-xs ${getConfidenceColor(item.confidence)}`}>
              {Math.round(item.confidence * 100)}%
            </span>
          )}
        </div>
      </div>
      
      <div className="text-gray-700 text-sm leading-relaxed mb-3">
        <MarkdownRenderer 
          content={item.content}
          variant="card"
          className="text-gray-700 text-sm leading-relaxed"
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{new Date(item.created_at).toLocaleDateString()}</span>
        {item.actionability && (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {item.actionability}
          </span>
        )}
      </div>
    </div>
  );
};
