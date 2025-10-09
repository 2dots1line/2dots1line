import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Graph3D } from './Graph3D';
import { useQuestConnection } from '../../hooks/useQuestConnection';
import { useCosmosStore } from '../../stores/CosmosStore';
import { useUserStore } from '../../stores/UserStore';
import CosmosError from '../modal/CosmosError';
import CosmosLoading from '../modal/CosmosLoading';
import CosmosNodeModal from '../modal/CosmosNodeModal';
import CosmosInfoPanel from '../modal/CosmosInfoPanel';
import { NodeLabelControls } from './NodeLabelControls';
import { LookupCameraController } from './LookupCameraController';
import { HUDContainer } from '../hud/HUDContainer';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { Send, Loader2, MessageSquare, X, Plus } from 'lucide-react';
import { performKeyPhraseLookup, createGraphProjection, LookupConfig as EntityLookupConfig } from '../../utils/entityLookup';
import { MinimalistLookupControls } from './LookupControls';

const LiveQuestScene: React.FC = () => {
  const [question, setQuestion] = useState('What do you know about my skating experience?');
  const [isChatOpen, setIsChatOpen] = useState(true); // Open by default
  const [messages, setMessages] = useState<Array<{type: 'user' | 'agent' | 'system', content: string, timestamp: Date}>>([]);
  const [streamingNarration, setStreamingNarration] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [stageDirections, setStageDirections] = useState<any[]>([]);
  
  const { user } = useUserStore();
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const userId = user?.user_id;
  const { questState, joinQuest } = useQuestConnection(authToken, userId || null);
  
  // Cosmos store for node selection and basic edge controls
  const {
    selectedNode,
    setSelectedNode,
    showEdges,
    setShowEdges,
    graphData,
    setGraphData,
    showNodeLabels,
    setShowNodeLabels
  } = useCosmosStore();

  // Local edge control state
  const [edgeOpacity, setEdgeOpacity] = useState(0.5);
  const [edgeWidth, setEdgeWidth] = useState(1.0);
  const [animatedEdges, setAnimatedEdges] = useState(true);

  // Add minimalist lookup controls
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [graphHops, setGraphHops] = useState(2); // Default to 2 hops
  
  // Store key phrases and expanded graph data
  const [keyPhrases, setKeyPhrases] = useState<string[]>([]);
  const [expandedGraphData, setExpandedGraphData] = useState<any>({ nodes: [], edges: [] });
  const [currentQuestId, setCurrentQuestId] = useState<string | null>(null);

  // Use key phrases as virtual entities for similarity search
  const expandWithKeyPhrases = useCallback(async (phrases: string[]) => {
    console.log('🔍 LiveQuestScene: Expanding with key phrases:', phrases, 'similarity:', similarityThreshold, 'hops:', graphHops, 'questId:', currentQuestId);
    
    try {
      const config: EntityLookupConfig = {
        graphHops,
        similarityThreshold,
        enableGraphHops: true
      };

      if (!userId) {
        console.error('No authenticated user found for key phrase lookup');
        return;
      }
      
      const result = await performKeyPhraseLookup(phrases, config, userId, currentQuestId || undefined);
      
      if (result.nodes.length === 0) {
        const emptyGraphData = createGraphProjection([], [], {
          dimension_reduction_algorithm: 'key_phrase_expansion',
          semantic_similarity_threshold: similarityThreshold,
          graph_hops: graphHops,
          key_phrases: phrases
        }, 10); // Use same position scale as CosmosScene
        setExpandedGraphData(emptyGraphData);
        setGraphData(emptyGraphData);
        return;
      }

      // Create graph projection with position scaling to match CosmosScene style
      const newGraphData = createGraphProjection(result.nodes, result.edges, {
        dimension_reduction_algorithm: 'key_phrase_expansion',
        semantic_similarity_threshold: similarityThreshold,
        graph_hops: graphHops,
        key_phrases: phrases
      }, 10); // Use same position scale as CosmosScene
      
      setExpandedGraphData(newGraphData);
      // Update the cosmos store so the counts are live
      setGraphData(newGraphData);
      
      console.log('🔍 LiveQuestScene: Expanded graph:', {
        keyPhrases: phrases.length,
        totalNodes: result.nodes.length,
        totalEdges: result.edges.length
      });
      
    } catch (error) {
      console.error('🔍 LiveQuestScene: Key phrase expansion failed:', error);
    }
  }, [similarityThreshold, graphHops, currentQuestId]);

  // Set edges and labels to be on by default when key phrases arrive
  useEffect(() => {
    if (questState.key_phrases && questState.key_phrases.length > 0) {
      console.log('🔍 LiveQuestScene: Quest state key phrases:', questState.key_phrases);
      setShowEdges(true); // Force edges to be on for key phrase exploration
      setShowNodeLabels(true); // Force labels to be on for quest results readability
    }
  }, [questState.key_phrases, setShowEdges, setShowNodeLabels]);

  // Extract key phrases when they arrive and trigger expansion
  useEffect(() => {
    if (questState.key_phrases && questState.key_phrases.length > 0) {
      const phrases = questState.key_phrases.map((kp: any) => kp.phrase || kp);
      console.log('🔍 LiveQuestScene: Key phrases extracted:', phrases);
      setKeyPhrases(phrases);
      
      // Auto-expand with current settings
      expandWithKeyPhrases(phrases);
    }
  }, [questState.key_phrases, expandWithKeyPhrases]);

  // Re-expand when controls change
  useEffect(() => {
    if (keyPhrases.length > 0) {
      expandWithKeyPhrases(keyPhrases);
    }
  }, [similarityThreshold, graphHops, keyPhrases, expandWithKeyPhrases]);

  const startLiveQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 LiveQuestScene: Starting quest with question:', question);
    
    // Add user message to chat
    const userMessage = { type: 'user' as const, content: question, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsChatOpen(true);
    
    const startTime = Date.now();
    console.log('⏱️ LiveQuestScene: Quest start time:', new Date(startTime).toISOString());
    
    try {
      const res = await fetch('http://localhost:3000/api/v1/quest/process', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          userQuestion: question, 
          conversationId: `quest-${Date.now()}`,
          questType: 'exploration',
          userId: userId 
        })
      });
      
      const responseTime = Date.now() - startTime;
      console.log('📡 LiveQuestScene: API response time:', responseTime + 'ms');
      
      const j = await res.json();
      console.log('📋 LiveQuestScene: API response:', j);
      
      const execId = j?.data?.executionId;
      if (execId) {
        console.log('🎯 LiveQuestScene: Quest execution ID:', execId);
        setCurrentQuestId(execId); // Store the quest ID for embedding isolation
        joinQuest(execId);
      } else {
        console.error('❌ LiveQuestScene: No execution ID received');
      }
    } catch (error) {
      console.error('❌ LiveQuestScene: Quest start error:', error);
    }
  };

  // Update messages when quest state changes
  React.useEffect(() => {
    // Log quest state changes for debugging
    if (Object.keys(questState).length > 0) {
      console.log('🔄 LiveQuestScene: Quest state update:', questState);
    }
    
    if (questState.key_phrases && questState.key_phrases.length > 0) {
      console.log('🔍 LiveQuestScene: Key phrases received:', questState.key_phrases);
      const keyPhrasesText = questState.key_phrases.map((kp: any) => kp.phrase || kp).join(', ');
      const systemMessage = { 
        type: 'system' as const, 
        content: `🔍 Key phrases extracted: ${keyPhrasesText}`, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, systemMessage]);
    }
    
    // Handle streaming narration chunks
    if (questState.narration_chunk) {
      console.log('📝 LiveQuestScene: Narration chunk received:', questState.narration_chunk);
      setIsStreaming(true);
      setStreamingNarration(prev => prev + questState.narration_chunk);
    }
    
    // Handle stage directions
    if (questState.stage_direction) {
      console.log('🎬 LiveQuestScene: Stage direction received:', questState.stage_direction);
      setStageDirections(prev => [...prev, questState.stage_direction]);
      
      // Execute stage direction immediately
      executeStageDirection(questState.stage_direction);
    }
    
    // Handle final response (end of streaming)
    if (questState.response) {
      setIsStreaming(false);
      if (streamingNarration) {
        // Add the accumulated streaming narration as a message
        const narrationMessage = { 
          type: 'agent' as const, 
          content: streamingNarration, 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, narrationMessage]);
        setStreamingNarration('');
      }
      
      // Add the final response if it's different from narration
      if (questState.response !== streamingNarration) {
        const agentMessage = { 
          type: 'agent' as const, 
          content: questState.response, 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, agentMessage]);
      }
    }
  }, [questState.key_phrases, questState.narration_chunk, questState.response, streamingNarration]);

  // Process visualization data
  const viz = questState.visualization_stages;
  const POSITION_SCALE = 50; // Much larger scale to create sense of distance like CosmosScene
  
  // Map entity types from CosmosQuestAgent format to API format
  const mapEntityType = (entityType: string): string => {
    const mapping: Record<string, string> = {
      'Concept': 'concept',
      'MemoryUnit': 'memoryunit', 
      'Artifact': 'derivedartifact'
    };
    return mapping[entityType] || 'concept';
  };

  // Process nodes with proper labels and properties (like CosmosLookupScene)
  const nodes = [
    ...viz.stage1,
    ...viz.stage2,
    ...viz.stage3,
  ].map((e: any, index: number) => {
    const x = e.position[0] * POSITION_SCALE;
    const y = e.position[1] * POSITION_SCALE;
    const z = e.position[2] * POSITION_SCALE;
    
    const apiEntityType = mapEntityType(e.entityType);
    
    return {
      id: e.entityId,
      type: apiEntityType, // Use mapped type for API compatibility
      entity_type: apiEntityType, // Also add entity_type field for API
      label: e.title || e.entityId, // Proper label mapping
      name: e.title || e.entityId, // Fallback for name
      x,
      y,
      z,
      position: [x, y, z] as [number, number, number],
      title: e.title,
      content: e.content || '',
      properties: { 
        title: e.title || e.entityId,
        type: apiEntityType, // Use mapped type
        starTexture: e.starTexture,
        relevanceScore: e.relevanceScore,
        connectionType: e.connectionType,
        connectedTo: e.connectedTo
      },
      // Add metadata for proper display
      metadata: {
        title: e.title || e.entityId,
        type: apiEntityType, // Use mapped type
        content: e.content || '',
        importance: e.relevanceScore || 1,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    };
  });

  // Function to focus camera on a specific entity
  const focusCameraOnEntity = useCallback((entityId: string) => {
    const entity = nodes.find(node => node.id === entityId);
    if (entity) {
      const x = entity.x || 0;
      const y = entity.y || 0;
      const z = entity.z || 0;
      
      // Dispatch camera focus event
      const event = new CustomEvent('camera-focus-request', {
        detail: {
          position: { x, y, z },
          entity: {
            id: entity.id,
            title: entity.name || entity.label || entity.id,
            type: entity.type || 'unknown'
          }
        }
      });
      
      window.dispatchEvent(event);
      console.log('🎥 LiveQuestScene: Focusing camera on entity:', entityId, 'at position:', { x, y, z });
    } else {
      console.warn('🎥 LiveQuestScene: Entity not found for focus:', entityId);
    }
  }, [nodes]);

  // Execute stage directions from the quest agent
  const executeStageDirection = useCallback((direction: any) => {
    console.log('🎬 LiveQuestScene: Executing stage direction:', direction);
    
    switch (direction.action) {
      case 'focus_entity':
        if (direction.entity_id) {
          focusCameraOnEntity(direction.entity_id);
        }
        break;
      case 'highlight_entity':
        if (direction.entity_id) {
          // Dispatch highlight event
          const event = new CustomEvent('entity-highlight', {
            detail: {
              entityId: direction.entity_id,
              color: direction.color || '#00ff00',
              duration: direction.duration || 3000
            }
          });
          window.dispatchEvent(event);
        }
        break;
      case 'reveal_entity':
        if (direction.entity_id) {
          // Dispatch reveal event
          const event = new CustomEvent('entity-reveal', {
            detail: {
              entityId: direction.entity_id,
              animation: direction.animation || 'fadeIn'
            }
          });
          window.dispatchEvent(event);
        }
        break;
      case 'camera_move':
        if (direction.position && direction.target) {
          // Dispatch camera move event
          const event = new CustomEvent('camera-move', {
            detail: {
              position: direction.position,
              target: direction.target,
              duration: direction.duration || 2000
            }
          });
          window.dispatchEvent(event);
        }
        break;
      default:
        console.log('🎬 LiveQuestScene: Unknown stage direction action:', direction.action);
    }
  }, [focusCameraOnEntity]);

  // Process edges from walkthrough connections
  const edges: any[] = [];
  viz.stage2?.forEach((entity: any) => {
    if (entity.connectedTo && entity.connectedTo.length > 0) {
      entity.connectedTo.forEach((targetId: string) => {
        edges.push({
          id: `${entity.entityId}-${targetId}`,
          source: entity.entityId,
          target: targetId,
          type: '1_hop',
          animated: animatedEdges
        });
      });
    }
  });

  viz.stage3?.forEach((entity: any) => {
    if (entity.connectedTo && entity.connectedTo.length > 0) {
      entity.connectedTo.forEach((targetId: string) => {
        edges.push({
          id: `${entity.entityId}-${targetId}`,
          source: entity.entityId,
          target: targetId,
          type: '2_hop',
          animated: animatedEdges
        });
      });
    }
  });

  const questGraphData = { nodes, edges };

  // Compute cluster center for camera positioning
  const center = useMemo(() => {
    if (!nodes.length) return { x: 0, y: 0, z: 0 };
    const sum = nodes.reduce((acc: any, n: any) => ({ x: acc.x + n.x, y: acc.y + n.y, z: acc.z + n.z }), { x: 0, y: 0, z: 0 });
    return { x: sum.x / nodes.length, y: sum.y / nodes.length, z: sum.z / nodes.length };
  }, [nodes]);

  // Remove full-screen processing overlay - make it fluid

  // Show error state
  if (questState.error) {
    return (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-red-900/80 backdrop-blur-md rounded-lg p-8 text-center max-w-md">
            <h3 className="text-xl font-semibold text-white mb-2">Quest Error</h3>
            <p className="text-red-200 mb-4">{questState.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
        <Graph3D
          graphData={{ nodes: [], edges: [] }}
          onNodeClick={() => {}}
          showEdges={false}
          edgeOpacity={0}
          edgeWidth={1}
          animatedEdges={false}
          modalOpen={false}
          customCameraPosition={[0, 0, 100]}
          customCameraTarget={{ x: 0, y: 0, z: 0 }}
          customTargetDistance={100}
          customCameraController={LookupCameraController}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative text-white">
      {/* Top Left: Node Label Controls (Labels/Edges Toggle) */}
      <NodeLabelControls />
      
      {/* Top Right: HUD */}
      <HUDContainer className="top-4 right-4" onViewSelect={(view) => {
        if (view === 'cosmos') {
          window.location.href = '/cosmos';
        } else {
          window.location.href = '/';
        }
      }} />
      
      {/* Bottom Left: Cosmos Stats - Exact same as CosmosScene */}
      <CosmosInfoPanel />

      {/* Quest Chat Modal - Bottom positioned, 50% wider, 1/3 height, no header */}
      {isChatOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 pointer-events-none">
          <GlassmorphicPanel
            variant="glass-panel"
            rounded="xl"
            padding="none"
            className="relative w-full max-w-6xl h-[20vh] flex flex-col overflow-hidden pointer-events-auto mx-auto"
          >

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {messages.length === 0 && !questState.isProcessing ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare size={24} className="text-white/60" />
                    </div>
                    <p className="text-white/60 text-sm">Ask about your memories to start exploring</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${message.type === 'user' ? 'order-1' : 'order-2'}`}>
                        <GlassmorphicPanel
                          variant="glass-panel"
                          rounded="lg"
                          padding="sm"
                          className={`
                            ${message.type === 'user' 
                              ? 'bg-white/20 ml-auto' 
                              : message.type === 'system'
                              ? 'bg-yellow-600/20 border border-yellow-400/30'
                              : 'bg-white/10'
                            }
                          `}
                        >
                          <div className="text-sm leading-relaxed text-white/90">
                            {message.content}
                          </div>
                          <div className="mt-2">
                            <span className="text-xs text-white/50">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </GlassmorphicPanel>
                      </div>
                      
                      {/* Avatar */}
                      <div className={`
                        w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1
                        ${message.type === 'user' 
                          ? 'bg-white/20 order-2 ml-3' 
                          : 'bg-gradient-to-br from-white/30 to-white/10 order-1 mr-3'
                        }
                      `}>
                        {message.type === 'user' ? (
                          <div className="w-4 h-4 bg-white/70 rounded-full" />
                        ) : (
                          <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Streaming Narration */}
                  {isStreaming && streamingNarration && (
                    <div className="flex justify-start">
                      <div className="order-2">
                        <GlassmorphicPanel
                          variant="glass-panel"
                          rounded="lg"
                          padding="sm"
                          className="bg-white/10"
                        >
                          <div className="text-sm leading-relaxed text-white/90">
                            {streamingNarration}
                            <span className="animate-pulse">|</span>
                          </div>
                        </GlassmorphicPanel>
                      </div>
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-gradient-to-br from-white/30 to-white/10 order-1 mr-3">
                        <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" />
                      </div>
                    </div>
                  )}
                  
                  {/* Processing State */}
                  {questState.isProcessing && !isStreaming && (
                    <div className="flex justify-start">
                      <div className="order-2">
                        <GlassmorphicPanel
                          variant="glass-panel"
                          rounded="lg"
                          padding="sm"
                          className="bg-white/10"
                        >
                          <div className="flex items-center space-x-2 text-sm text-white/90">
                            <Loader2 size={16} className="animate-spin" />
                            <span>Processing quest...</span>
                          </div>
                        </GlassmorphicPanel>
                      </div>
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-gradient-to-br from-white/30 to-white/10 order-1 mr-3">
                        <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/20">
              <GlassmorphicPanel
                variant="glass-panel"
                rounded="lg"
                padding="sm"
                className="flex items-end gap-3"
              >
                {/* Message Input */}
                <div className="flex-1">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask about your memories..."
                    className="
                      w-full bg-transparent text-white placeholder-white/50 
                      resize-none outline-none text-sm leading-relaxed
                      min-h-[40px] max-h-[120px] py-2
                    "
                    rows={1}
                    disabled={questState.isProcessing}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        startLiveQuest(e as any);
                      }
                    }}
                  />
                </div>

                {/* Send Button */}
                <GlassButton
                  onClick={startLiveQuest}
                  disabled={(!question.trim()) || questState.isProcessing}
                  className="
                    p-2 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                  "
                  title="Send message"
                >
                  {questState.isProcessing ? (
                    <div className="animate-spin w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <Send size={18} className="stroke-current" strokeWidth={1.5} />
                  )}
                </GlassButton>
              </GlassmorphicPanel>
              
              <p className="text-xs text-white/40 mt-2 text-center">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </GlassmorphicPanel>
        </div>
      )}


      {/* Minimalist Controls - Top Right */}
      {keyPhrases.length > 0 && (
        <MinimalistLookupControls
          similarityThreshold={similarityThreshold}
          onSimilarityChange={setSimilarityThreshold}
          graphHops={graphHops}
          onGraphHopsChange={setGraphHops}
          className="absolute top-4 right-20 z-10"
        />
      )}

      {/* 3D Visualization with expanded data */}
      <Graph3D
        graphData={graphData} // Use cosmos store data for live counts
        onNodeClick={(node) => setSelectedNode(node)}
        showEdges={showEdges} // Use cosmos store edge state
        edgeOpacity={edgeOpacity}
        edgeWidth={edgeWidth}
        animatedEdges={animatedEdges}
        modalOpen={!!selectedNode}
        customCameraPosition={[center.x + 200, center.y + 200, center.z - 150]}
        customCameraTarget={center}
        customTargetDistance={80}
        enableNodeRotation={false} // Disable node cluster rotation for better interaction
        customCameraController={LookupCameraController}
      />
      
      {/* Node Modal */}
      {selectedNode && <CosmosNodeModal node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  );
};

export default LiveQuestScene;