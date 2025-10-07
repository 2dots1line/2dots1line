/**
 * CosmosQuest Types
 * V11.0 - Types for the CosmosQuestAgent and immersive memory exploration
 */

import { TAgentInput, TAgentOutput } from './agent.types';

// === INPUT/OUTPUT CONTRACTS ===

export interface CosmosQuestInput {
  userQuestion: string;
  userId: string;
  conversationId: string;
  questType?: 'exploration' | 'reflection' | 'discovery' | 'connection';
}

export interface CosmosQuestResult {
  execution_id: string;
  key_phrases: KeyPhraseCapsule[];
  visualization_stages: {
    stage1: VisualizationEntity[];
    stage2: VisualizationEntity[];
    stage3: VisualizationEntity[];
  };
  response_text: string;
  walkthrough_script: WalkthroughStep[];
  reflective_question: string;
  metadata: {
    processing_time_ms: number;
    memory_units_retrieved: number;
    concepts_retrieved: number;
    artifacts_retrieved: number;
  };
}

// === KEY PHRASE TYPES ===

export interface KeyPhraseCapsule {
  phrase: string;
  confidence_score: number; // 0.0 to 1.0
  color: string; // Hex color for UI display
}

// === VISUALIZATION TYPES ===

export interface VisualizationEntity {
  entityId: string;
  entityType: 'MemoryUnit' | 'Concept' | 'Artifact' | 'Person' | 'Place' | 'Event';
  position: [number, number, number]; // 3D coordinates
  starTexture: 'bright_star' | 'medium_star' | 'dim_star';
  title: string;
  relevanceScore: number; // 0.0 to 1.0
  connectionType?: '1_hop' | '2_hop' | '3_hop';
  connectedTo?: string[]; // Array of entity IDs this connects to
}

// === WALKTHROUGH TYPES ===

export interface WalkthroughStep {
  step_number: number;
  title: string;
  description: string;
  focus_entity_id?: string; // Optional entity to focus on
  duration_seconds: number;
  camera_position?: [number, number, number]; // Camera position for this step
  camera_target?: [number, number, number]; // Camera target for this step
  highlight_color?: string; // Color to highlight entities
}

// === STAGE DIRECTION DSL (V11.0) ===
// Fine-grained scene control primitives for agent-driven cinematography

export interface CameraFocusDirection {
  action: 'camera_focus';
  entity_id: string;
  offset?: [number, number, number]; // Optional camera offset from entity
  ease_ms: number; // Smooth transition duration
}

export interface HighlightNodesDirection {
  action: 'highlight_nodes';
  ids: string[]; // Entity IDs to highlight
  mode: 'spotlight' | 'pulse'; // Highlight style
  dim_others: boolean; // Whether to dim non-highlighted nodes
  ease_ms: number; // Transition duration
}

export interface HighlightEdgesDirection {
  action: 'highlight_edges';
  pairs: [string, string][]; // Pairs of [source_id, target_id]
  strength: number; // Glow intensity (0.0-1.0)
  ease_ms: number; // Transition duration
}

export interface RevealEntitiesDirection {
  action: 'reveal_entities';
  ids: string[]; // Entity IDs to reveal/add to scene
  layout_hint?: string; // Optional layout hint (e.g., "near_entity_id")
  ease_ms: number; // Fade-in duration
}

export interface EnvironmentDirection {
  action: 'environment';
  starfield: 'dim' | 'bright'; // Background starfield intensity
  vignette_opacity: number; // Vignette overlay opacity (0.0-1.0)
  fade_ms: number; // Transition duration
}

export interface ShowDetailsDirection {
  action: 'show_details';
  entity_id: string; // Entity to show details panel for
}

/**
 * Union type for all stage directions
 * Agent emits these to control the 3D scene dynamically
 */
export type StageDirection = 
  | CameraFocusDirection 
  | HighlightNodesDirection 
  | HighlightEdgesDirection 
  | RevealEntitiesDirection 
  | EnvironmentDirection 
  | ShowDetailsDirection;

// === AGENT WRAPPER TYPES ===

export interface CosmosQuestAgentInputPayload extends CosmosQuestInput {}

export interface CosmosQuestAgentResult extends CosmosQuestResult {}

export type CosmosQuestAgentInput = TAgentInput<CosmosQuestAgentInputPayload>;
export type CosmosQuestAgentOutput = TAgentOutput<CosmosQuestAgentResult>;

// === BATCH UPDATE TYPES ===

export interface KeyPhraseBatch {
  type: 'key_phrases';
  capsules: KeyPhraseCapsule[];
}

export interface VisualizationStage1Batch {
  type: 'visualization_stage_1';
  stage: 1;
  entities: VisualizationEntity[];
}

export interface VisualizationStages2And3Batch {
  type: 'visualization_stages_2_and_3';
  stage2: VisualizationEntity[];
  stage3: VisualizationEntity[];
}

export interface FinalResponseBatch {
  type: 'final_response';
  response_text: string;
  walkthrough_script: WalkthroughStep[];
  reflective_question: string;
}

// V11.0: New batch types for streaming and stage directions
export interface NarrationChunkBatch {
  type: 'narration_chunk';
  content: string; // Streaming text chunk
}

export interface StageDirectionBatch {
  type: 'stage_direction';
  direction: StageDirection; // Single stage direction
}

export type QuestUpdateBatch = 
  | KeyPhraseBatch 
  | VisualizationStage1Batch 
  | VisualizationStages2And3Batch 
  | FinalResponseBatch
  | NarrationChunkBatch
  | StageDirectionBatch;

// === MOCK DATA TYPES ===

export interface QuestMockSequence {
  batches: Array<{
    data: QuestUpdateBatch;
    delay: number; // milliseconds
  }>;
}
