/**
 * CosmosModal - 3D cosmos experience with knowledge graph
 * V11.0 - Cosmos Integration Phase 3.3
 * Simplified version to avoid circular dependencies
 */

import type { DisplayCard } from '@2dots1line/shared-types';
import { GlassButton } from '@2dots1line/ui-components';
import { X, Search, Filter, Settings, Info } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { cardService } from '../../services/cardService';
import { useCardStore } from '../../stores/CardStore';

// Simplified cosmos types to avoid dependency issues
interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface SimpleCosmosNode {
  id: string;
  title: string;
  description?: string;
  category: string;
  position: Vector3D;
  size: number;
  color: string;
  metadata?: {
    cardType: string;
    status: string;
    isFavorited: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface SimpleNodeConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: 'related' | 'temporal' | 'semantic';
  strength: number;
  color: string;
}

interface CosmosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Navigation state type with proper camera modes
interface NavigationState {
  cameraMode: 'free' | 'orbit' | 'follow' | 'cinematic';
  isFlying: boolean;
  isOrbiting: boolean;
  flySpeed: number;
  orbitSpeed: number;
}

// Placeholder 3D Canvas component until ui-components is ready
const PlaceholderCosmosCanvas: React.FC<{
  nodes: SimpleCosmosNode[];
  connections: SimpleNodeConnection[];
  onNodeSelect: (node: SimpleCosmosNode) => void;
  className?: string;
}> = ({ nodes, connections, className }) => {
  return (
    <div className={`${className} bg-black/50 border border-white/20 rounded-lg p-8 flex items-center justify-center`}>
      <div className="text-center">
        <div className="text-6xl mb-4">🌌</div>
        <h3 className="text-xl font-semibold text-white mb-2">3D Cosmos Visualization</h3>
        <p className="text-white/70 mb-4">
          Found {nodes.length} nodes and {connections.length} connections
        </p>
        <p className="text-white/50 text-sm">
          3D visualization will be available when ui-components build is complete
        </p>
      </div>
    </div>
  );
};

export const CosmosModal: React.FC<CosmosModalProps> = ({
  isOpen,
  onClose
}) => {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimpleCosmosNode | null>(null);
  const [selectedCard, setSelectedCard] = useState<DisplayCard | null>(null);
  const [connections, setConnections] = useState<SimpleNodeConnection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  
  // Card store
  const { cards } = useCardStore();
  
  // Generate cosmos nodes from cards
  const cosmosNodes = useMemo(() => {
    return cards.map((card, index) => {
      // Generate spiral galaxy layout
      const radius = 100 + (index * 30);
      const angle = index * 0.3;
      const height = (Math.sin(index * 0.5) - 0.5) * 50;
      
      const node: SimpleCosmosNode = {
        id: (card as any).card_id,
        title: (card as any).title || (card as any).display_data?.title || `Card ${(card as any).card_id}`,
        description: (card as any).description || (card as any).display_data?.description,
        category: (card as any).card_type,
        position: {
          x: Math.cos(angle) * radius,
          y: height,
          z: Math.sin(angle) * radius,
        },
        size: (card as any).is_favorited ? 1.5 : 1.0,
        color: (card as any).status === 'active_canvas' ? '#00ff88' : '#888888',
        metadata: {
          cardType: (card as any).card_type,
          status: (card as any).status,
          isFavorited: (card as any).is_favorited,
          createdAt: new Date((card as any).created_at),
          updatedAt: new Date((card as any).updated_at),
        },
      };
      
      return node;
    });
  }, [cards]);
  
  // Generate connections between related cards
  const cosmosConnections = useMemo(() => {
    const connections: SimpleNodeConnection[] = [];
    
    for (let i = 0; i < cosmosNodes.length; i++) {
      for (let j = i + 1; j < cosmosNodes.length; j++) {
        const nodeA = cosmosNodes[i];
        const nodeB = cosmosNodes[j];
        
        // Find cards for comparison
        const cardA = cards.find(c => (c as any).card_id === nodeA.id);
        const cardB = cards.find(c => (c as any).card_id === nodeB.id);
        
        if (cardA && cardB) {
          // Create connections based on similarity
          let shouldConnect = false;
          let connectionType: 'related' | 'temporal' | 'semantic' = 'related';
          let strength = 0;
          
          // Same type connection
          if ((cardA as any).card_type === (cardB as any).card_type) {
            shouldConnect = true;
            strength += 0.3;
          }
          
          // Temporal proximity (created around same time)
          const timeDiff = Math.abs(new Date((cardA as any).created_at).getTime() - new Date((cardB as any).created_at).getTime());
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          if (daysDiff < 7) {
            shouldConnect = true;
            connectionType = 'temporal';
            strength += 0.4;
          }
          
          // Title similarity (simple keyword matching)
          const titleA = (cardA as any).title || (cardA as any).display_data?.title || '';
          const titleB = (cardB as any).title || (cardB as any).display_data?.title || '';
          if (titleA && titleB) {
            const wordsA = titleA.toLowerCase().split(' ');
            const wordsB = titleB.toLowerCase().split(' ');
            const commonWords = wordsA.filter((word: string) => wordsB.includes(word) && word.length > 3);
            if (commonWords.length > 0) {
              shouldConnect = true;
              strength += commonWords.length * 0.2;
            }
          }
          
          // Only create connection if strength is significant
          if (shouldConnect && strength > 0.3) {
            connections.push({
              id: `${nodeA.id}-${nodeB.id}`,
              fromNodeId: nodeA.id,
              toNodeId: nodeB.id,
              type: connectionType,
              strength: Math.min(strength, 1.0),
              color: connectionType === 'temporal' ? '#00ff00' : 
                     connectionType === 'related' ? '#ff00ff' : '#00ffff',
            });
          }
        }
      }
    }
    
    return connections;
  }, [cosmosNodes, cards]);
  
  // Navigation hooks (for navigation controls)
  const [navigationState] = useState<NavigationState>({
    cameraMode: 'free',
    isFlying: false,
    isOrbiting: false,
    flySpeed: 2,
    orbitSpeed: 0.5,
  });
  
  // Load cards from API
  const loadCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await cardService.getCards({
        limit: 200 // Load cards for cosmos visualization
      });
      
      if (response.success && response.cards) {
        // Cards are now managed by CardStore, no need to set local state
        console.log('CosmosModal: Loaded', response.cards.length, 'cards for visualization');
      } else {
        setError(response.error || 'Failed to load cards');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load cards on mount - NON-BLOCKING
  useEffect(() => {
    if (isOpen && cards.length === 0) {
      // Use setTimeout to defer the API call to next tick, allowing UI to render first
      const loadTimeout = setTimeout(() => {
        loadCards();
      }, 0); // Defer to next tick
      
      return () => clearTimeout(loadTimeout);
    }
  }, [isOpen, cards.length, loadCards]);
  
  // Handle node selection
  const handleNodeSelect = useCallback(async (node: SimpleCosmosNode) => {
    setSelectedNode(node);
    setSidePanelOpen(true);
    
    // Load card details by finding the card in our store
    const card = cards.find(c => (c as any).card_id === node.id);
    if (card) {
      setSelectedCard(card);
    }
    
    // Load connections for this node
    const nodeConnections = cosmosConnections.filter(
      conn => conn.fromNodeId === node.id || conn.toNodeId === node.id
    );
    setConnections(nodeConnections);
  }, [cosmosConnections, cards]);
  
  // Handle card interactions
  const handleToggleFavorite = useCallback(async (cardId: string) => {
    try {
      const card = cards.find(c => (c as any).card_id === cardId);
      if (!card) return;
      
      const response = await cardService.updateCard({
        card_id: cardId,
        updates: { is_favorited: !(card as any).is_favorited } as any
      });
      
      if (response.success) {
        // Update selected card if it's the same
        if (selectedCard && (selectedCard as any).card_id === cardId) {
          setSelectedCard((prev: DisplayCard | null) => prev ? { ...prev, is_favorited: !(prev as any).is_favorited } : null);
        }
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  }, [cards, selectedCard]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-modal bg-black/95">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4">
        <div className="flex items-center justify-between">
          {/* Left: Title and Search */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Cosmos</h1>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                <input
                  type="text"
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:border-white/40 focus:outline-none"
                />
              </div>
              
              <GlassButton
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 ${showFilters ? 'bg-white/20' : 'hover:bg-white/20'}`}
              >
                <Filter size={16} className="stroke-current" />
              </GlassButton>
            </div>
          </div>
          
          {/* Right: Settings and Close */}
          <div className="flex items-center gap-2">
            <GlassButton
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 ${showSettings ? 'bg-white/20' : 'hover:bg-white/20'}`}
            >
              <Settings size={16} className="stroke-current" />
            </GlassButton>
            
            <GlassButton
              onClick={() => setShowHelp(!showHelp)}
              className={`p-2 ${showHelp ? 'bg-white/20' : 'hover:bg-white/20'}`}
            >
              <Info size={16} className="stroke-current" />
            </GlassButton>
            
            <GlassButton
              onClick={onClose}
              className="p-2 hover:bg-white/20"
            >
              <X size={20} className="stroke-current" />
            </GlassButton>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="h-full pt-16">
        {/* Loading State */}
        {isLoading && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/70">Loading cosmos...</p>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Error Loading Cosmos
              </h3>
              <p className="text-white/70 mb-4">{error}</p>
              <GlassButton
                onClick={loadCards}
                className="px-6 py-2"
              >
                Try Again
              </GlassButton>
            </div>
          </div>
        )}
        
        {/* Cosmos Canvas Placeholder */}
        {!isLoading && !error && (
          <PlaceholderCosmosCanvas
            nodes={cosmosNodes}
            connections={cosmosConnections}
            onNodeSelect={handleNodeSelect}
            className="h-full"
          />
        )}
        
        {/* Side Panel - Simple version */}
        {sidePanelOpen && selectedCard && (
          <div className="absolute top-0 right-0 w-96 h-full bg-black/80 border-l border-white/20 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Card Details</h3>
              <button
                onClick={() => setSidePanelOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Title</h4>
                <p className="text-white/70">{(selectedCard as any).title || 'Untitled'}</p>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">Type</h4>
                <p className="text-white/70">{(selectedCard as any).card_type}</p>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">Status</h4>
                <p className="text-white/70">{(selectedCard as any).status}</p>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">Created</h4>
                <p className="text-white/70">{new Date((selectedCard as any).created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="pt-4">
                <button
                  onClick={() => handleToggleFavorite((selectedCard as any).card_id)}
                  className={`px-4 py-2 rounded-lg ${
                    (selectedCard as any).is_favorited 
                      ? 'bg-yellow-500/20 text-yellow-300' 
                      : 'bg-white/10 text-white/70'
                  } hover:bg-white/20 transition-colors`}
                >
                  {(selectedCard as any).is_favorited ? '★ Favorited' : '☆ Add to Favorites'}
                </button>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">Connections</h4>
                <p className="text-white/70">{connections.length} related nodes</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 p-4">
        <div className="flex items-center justify-between text-sm text-white/70">
          <div className="flex items-center gap-4">
            <span>{cosmosNodes.length} nodes</span>
            <span>{cosmosConnections.length} connections</span>
            {selectedNode && (
              <span>Selected: {selectedNode.title}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span>Camera: {navigationState.cameraMode}</span>
            <span>Speed: {navigationState.flySpeed}x</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 