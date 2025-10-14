'use client';

import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { GlassmorphicPanel } from '@2dots1line/ui-components';

interface GroundingMetadataProps {
  metadata: {
    search_queries: string[];
    grounding_chunks: Array<{
      web_url: string;
      title?: string;
      snippet?: string;
    }>;
    grounding_supports?: Array<any>;
  };
}

export const GroundingMetadata: React.FC<GroundingMetadataProps> = ({ metadata }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Helper to extract clean domain name from URL
  const getDomainName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname;
      // Remove 'www.' prefix
      domain = domain.replace(/^www\./, '');
      // For very long domains, truncate
      if (domain.length > 20) {
        domain = domain.substring(0, 17) + '...';
      }
      return domain;
    } catch {
      return 'source';
    }
  };
  
  if (!metadata || !metadata.grounding_chunks || metadata.grounding_chunks.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-3 space-y-2">
      {/* Inline Source Chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <Globe size={14} className="text-blue-400/80" />
        <span className="text-xs text-blue-400/80">Sources:</span>
        {metadata.grounding_chunks.slice(0, 5).map((chunk, idx) => {
          const displayName = chunk.title 
            ? (chunk.title.length > 30 ? chunk.title.substring(0, 27) + '...' : chunk.title)
            : getDomainName(chunk.web_url);
          
          return (
            <a
              key={idx}
              href={chunk.web_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-400/30 hover:border-blue-400/50 rounded-full text-xs text-blue-300 hover:text-blue-200 transition-all group"
              title={chunk.title || chunk.web_url}
            >
              <span className="font-medium">{displayName}</span>
              <ExternalLink size={11} className="opacity-60 group-hover:opacity-100" />
            </a>
          );
        })}
        {metadata.grounding_chunks.length > 5 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-blue-400/60 hover:text-blue-400 underline"
          >
            +{metadata.grounding_chunks.length - 5} more
          </button>
        )}
      </div>
      
      <GlassmorphicPanel className="!bg-blue-950/20 border-blue-400/20">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-2 hover:bg-blue-400/10 rounded transition-all"
        >
          <span className="text-xs font-medium text-blue-300">
            View {metadata.grounding_chunks.length} sources
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {isExpanded && (
          <div className="px-2 pb-2 space-y-2 max-h-64 overflow-y-auto">
            {metadata.grounding_chunks.map((chunk, idx) => (
              <a
                key={idx}
                href={chunk.web_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 bg-blue-900/20 hover:bg-blue-900/30 rounded border border-blue-400/20 transition-all group"
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-blue-500/30 rounded-full text-xs text-blue-300">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-sm text-blue-300 group-hover:text-blue-200">
                      <span className="truncate">{chunk.title || chunk.web_url}</span>
                      <ExternalLink size={12} className="flex-shrink-0" />
                    </div>
                    {chunk.snippet && (
                      <p className="mt-1 text-xs text-gray-400 line-clamp-2">
                        {chunk.snippet}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            ))}
            
            {metadata.search_queries && metadata.search_queries.length > 0 && (
              <div className="pt-2 border-t border-blue-400/20">
                <p className="text-xs text-gray-500">
                  Search: <span className="text-blue-400">{metadata.search_queries[0]}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </GlassmorphicPanel>
    </div>
  );
};

export default GroundingMetadata;


