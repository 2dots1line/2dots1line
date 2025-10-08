import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface QuestState {
  isProcessing: boolean;
  execution_id: string | null;
  key_phrases: any[];
  visualization_stages: { stage1: any[]; stage2: any[]; stage3: any[] };
  walkthrough_script: any[];
  response: string;
  reflective_question: string;
  error: string | null;
  // V11.0: Streaming narration and stage control
  accumulatedNarration: string;
  highlightedNodeIds: string[];
  highlightedEdges: Array<[string, string]>;
  dimOthers: boolean;
  starfieldOpacity: number;
  vignetteOpacity: number;
  revealingNodeIds: string[];
  // V11.0: Real-time streaming support
  narration_chunk: string;
  stage_direction: any;
}

export const useQuestConnection = (authToken: string | null, userId: string | null) => {
  const [questState, setQuestState] = useState<QuestState>({
    isProcessing: false,
    execution_id: null,
    key_phrases: [],
    visualization_stages: { stage1: [], stage2: [], stage3: [] },
    walkthrough_script: [],
    response: '',
    reflective_question: '',
    error: null,
    // V11.0: Streaming narration and stage control
    accumulatedNarration: '',
    highlightedNodeIds: [],
    highlightedEdges: [],
    dimOthers: false,
    starfieldOpacity: 1.0,
    vignetteOpacity: 0,
    revealingNodeIds: [],
    // V11.0: Real-time streaming support
    narration_chunk: '',
    stage_direction: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const url = useMemo(
    () => process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3002',
    []
  );

  useEffect(() => {
    if (!authToken || !userId) return;
    const socket = io(url, { auth: { token: authToken, userId } });
    socketRef.current = socket;

    const onQuestUpdate = (data: any) => {
      switch (data.type) {
        case 'key_phrases':
          setQuestState((prev) => ({ ...prev, key_phrases: data.capsules }));
          break;
        case 'visualization_stage_1':
          setQuestState((prev) => ({
            ...prev,
            visualization_stages: { ...prev.visualization_stages, stage1: data.entities },
          }));
          break;
        case 'visualization_stages_2_3':
          setQuestState((prev) => ({
            ...prev,
            visualization_stages: {
              ...prev.visualization_stages,
              stage2: data.stage2.entities,
              stage3: data.stage3.entities,
            },
          }));
          break;
        case 'final_response':
          setQuestState((prev) => ({
            ...prev,
            response: data.response_text,
            walkthrough_script: data.walkthrough_script,
            reflective_question: data.reflective_question,
            isProcessing: false,
          }));
          break;
        case 'error':
          setQuestState((prev) => ({ ...prev, error: data.message, isProcessing: false }));
          break;
        
        // V11.0: Streaming narration
        case 'narration_chunk':
          setQuestState((prev) => ({
            ...prev,
            accumulatedNarration: prev.accumulatedNarration + (data.content || ''),
          }));
          break;
        
        // V11.0: Stage directions
        case 'stage_direction':
          const direction = data.direction;
          if (!direction) break;
          
          switch (direction.action) {
            case 'camera_focus':
              // Dispatch custom event for camera controller
              window.dispatchEvent(new CustomEvent('camera-focus-request', {
                detail: { 
                  entity_id: direction.entity_id,
                  offset: direction.offset,
                  ease_ms: direction.ease_ms
                }
              }));
              break;
            
            case 'highlight_nodes':
              setQuestState((prev) => ({
                ...prev,
                highlightedNodeIds: direction.ids || [],
                dimOthers: direction.dim_others || false,
              }));
              break;
            
            case 'highlight_edges':
              setQuestState((prev) => ({
                ...prev,
                highlightedEdges: direction.pairs || [],
              }));
              break;
            
            case 'reveal_entities':
              setQuestState((prev) => ({
                ...prev,
                revealingNodeIds: direction.ids || [],
              }));
              // TODO: Add revealed nodes to visualization_stages after animation
              break;
            
            case 'environment':
              setQuestState((prev) => ({
                ...prev,
                starfieldOpacity: direction.starfield === 'dim' ? 0.3 : 1.0,
                vignetteOpacity: direction.vignette_opacity || 0,
              }));
              break;
            
            case 'show_details':
              // Dispatch custom event for details panel
              window.dispatchEvent(new CustomEvent('show-entity-details', {
                detail: { entity_id: direction.entity_id }
              }));
              break;
          }
          break;
      }
    };

    socket.on('quest:update', onQuestUpdate);
    return () => {
      socket.off('quest:update', onQuestUpdate);
      socket.disconnect();
    };
  }, [authToken, userId, url]);

  const joinQuest = (executionId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('quest:join', { executionId });
    setQuestState((prev) => ({ ...prev, execution_id: executionId, isProcessing: true }));
  };

  const leaveQuest = (executionId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('quest:leave', { executionId });
  };

  return { questState, joinQuest, leaveQuest };
};


