import React from 'react';
import { Calendar, Clock, Star, TrendingUp, MessageCircle, FileText, Users, Tag } from 'lucide-react';

interface NodeDetailsDisplayProps {
  nodeDetails: {
    id: string;
    type: string;
    title: string;
    description: string;
    importance: number;
    metadata: {
      conceptType?: string;
      status?: string;
      createdAt?: string;
      lastUpdated?: string;
      communityId?: string;
      mergedInto?: string;
      sentimentScore?: number;
      lastModified?: string;
      ingestionDate?: string;
      sourceConversationId?: string;
      artifactType?: string;
      sourceMemoryUnitIds?: string[];
      sourceConceptIds?: string[];
      contentData?: any;
      lastAnalyzed?: string;
    };
  };
}

export const NodeDetailsDisplay: React.FC<NodeDetailsDisplayProps> = ({ nodeDetails }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Concept':
        return <Tag className="w-5 h-5" />;
      case 'MemoryUnit':
        return <MessageCircle className="w-5 h-5" />;
      case 'DerivedArtifact':
        return <FileText className="w-5 h-5" />;
      case 'Community':
        return <Users className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Concept':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'MemoryUnit':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'DerivedArtifact':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Community':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 0.8) return 'text-yellow-400';
    if (importance >= 0.6) return 'text-orange-400';
    return 'text-blue-400';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'archived':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getTypeColor(nodeDetails.type)}`}>
              {getTypeIcon(nodeDetails.type)}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {nodeDetails.title}
              </h3>
              <p className="text-sm text-white/60">
                {nodeDetails.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full border text-sm ${getTypeColor(nodeDetails.type)}`}>
              {nodeDetails.type}
            </div>
            {nodeDetails.metadata.status && (
              <div className={`px-3 py-1 rounded-full border text-sm ${getStatusColor(nodeDetails.metadata.status)}`}>
                {nodeDetails.metadata.status}
              </div>
            )}
            <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-sm">
              <Star className="w-4 h-4" />
              <span className={getImportanceColor(nodeDetails.importance)}>
                {nodeDetails.importance >= 0.8 ? 'High' : nodeDetails.importance >= 0.6 ? 'Medium' : 'Low'} Priority
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="text-sm font-medium text-white/80 mb-2">Description</h4>
          <p className="text-white/90 leading-relaxed">
            {nodeDetails.description}
          </p>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dates */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Timeline
          </h4>
          <div className="space-y-2">
            {nodeDetails.metadata.createdAt && (
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Created:</span>
                <span className="text-white/90">{formatDate(nodeDetails.metadata.createdAt)}</span>
              </div>
            )}
            {nodeDetails.metadata.lastUpdated && (
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Last Updated:</span>
                <span className="text-white/90">{formatDate(nodeDetails.metadata.lastUpdated)}</span>
              </div>
            )}
            {nodeDetails.metadata.lastModified && (
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Last Modified:</span>
                <span className="text-white/90">{formatDate(nodeDetails.metadata.lastModified)}</span>
              </div>
            )}
            {nodeDetails.metadata.ingestionDate && (
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Ingested:</span>
                <span className="text-white/90">{formatDate(nodeDetails.metadata.ingestionDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Type-specific metadata */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Metrics
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Importance:</span>
              <span className={`font-medium ${getImportanceColor(nodeDetails.importance)}`}>
                {(nodeDetails.importance * 100).toFixed(0)}%
              </span>
            </div>
            
            {nodeDetails.metadata.sentimentScore !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Sentiment:</span>
                <span className={`font-medium ${
                  nodeDetails.metadata.sentimentScore > 0.3 ? 'text-green-400' : 
                  nodeDetails.metadata.sentimentScore < -0.3 ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {(nodeDetails.metadata.sentimentScore * 100).toFixed(0)}%
                </span>
              </div>
            )}

            {nodeDetails.metadata.conceptType && (
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Concept Type:</span>
                <span className="text-white/90">{nodeDetails.metadata.conceptType}</span>
              </div>
            )}

            {nodeDetails.metadata.artifactType && (
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Artifact Type:</span>
                <span className="text-white/90">{nodeDetails.metadata.artifactType}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Source Information */}
      {(nodeDetails.metadata.sourceConversationId || nodeDetails.metadata.communityId) && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Source Information
          </h4>
          <div className="space-y-2">
            {nodeDetails.metadata.sourceConversationId && (
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Source Conversation:</span>
                <span className="text-white/90 font-mono text-xs">
                  {nodeDetails.metadata.sourceConversationId}
                </span>
              </div>
            )}
            {nodeDetails.metadata.communityId && (
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Community:</span>
                <span className="text-white/90 font-mono text-xs">
                  {nodeDetails.metadata.communityId}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related Entities */}
      {((nodeDetails.metadata.sourceMemoryUnitIds && nodeDetails.metadata.sourceMemoryUnitIds.length > 0) || 
        (nodeDetails.metadata.sourceConceptIds && nodeDetails.metadata.sourceConceptIds.length > 0)) && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80">Related Entities</h4>
          <div className="space-y-2">
            {nodeDetails.metadata.sourceMemoryUnitIds && nodeDetails.metadata.sourceMemoryUnitIds.length > 0 && (
              <div className="text-sm">
                <span className="text-white/60">Memory Units: </span>
                <span className="text-white/90">
                  {nodeDetails.metadata.sourceMemoryUnitIds.length} connected
                </span>
              </div>
            )}
            {nodeDetails.metadata.sourceConceptIds && nodeDetails.metadata.sourceConceptIds.length > 0 && (
              <div className="text-sm">
                <span className="text-white/60">Concepts: </span>
                <span className="text-white/90">
                  {nodeDetails.metadata.sourceConceptIds.length} connected
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 