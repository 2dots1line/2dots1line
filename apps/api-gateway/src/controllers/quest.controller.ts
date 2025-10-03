import type { Request, Response, NextFunction } from 'express';
import { CosmosQuestAgent } from '@2dots1line/cosmos-quest-service';
import { CosmosQuestInput } from '@2dots1line/shared-types';

type Notifier = { sendQuestUpdate: (executionId: string, data: any) => void };

export class QuestController {
  private notifier?: Notifier;
  private cosmosQuestAgent?: CosmosQuestAgent;

  constructor(notifier?: Notifier, cosmosQuestAgent?: CosmosQuestAgent) {
    this.notifier = notifier;
    this.cosmosQuestAgent = cosmosQuestAgent;
  }

  /**
   * POST /api/v1/quest/process
   * Returns a new executionId immediately. Background streaming will be added next.
   */
  async processQuest(req: Request, res: Response, next: NextFunction) {
    try {
      const { userQuestion, conversationId, questType } = req.body || {};
      const userId = req.user?.id;
      const executionId = `cq_${Date.now()}`;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Log receipt
      console.log('[QuestController] processQuest received', {
        userId,
        conversationId,
        hasQuestion: Boolean(userQuestion),
        questType,
        executionId,
        hasCosmosQuestAgent: !!this.cosmosQuestAgent
      });

      // Return execution ID immediately
      res.json({
        success: true,
        data: {
          executionId,
          status: 'processing',
          message: 'Quest processing started',
        },
      });

      // Process quest in background if agent is available
      if (this.cosmosQuestAgent) {
        this.processQuestInBackground({
          userQuestion,
          userId,
          conversationId,
          questType: questType || 'exploration'
        }, executionId);
      } else {
        console.warn('[QuestController] Missing CosmosQuestAgent, falling back to mock data');
        this.processMockQuestInBackground(userQuestion, executionId);
      }
    } catch (error) {
      console.error('[QuestController] processQuest error:', error);
      next(error);
    }
  }

  /**
   * Process quest in background using real CosmosQuestAgent with progressive updates
   */
  private async processQuestInBackground(input: CosmosQuestInput, executionId: string) {
    try {
      console.log(`[QuestController] Starting background quest processing for ${executionId}`);
      
      // Process quest with progressive updates
      const result = await this.cosmosQuestAgent!.processQuestWithProgressiveUpdates(input, (updateType: string, data: any) => {
        this.sendQuestUpdate(executionId, updateType, data);
      });
      
    } catch (error) {
      console.error(`[QuestController] Background quest processing failed for ${executionId}:`, error);
      
      // Send error update
      this.sendQuestUpdate(executionId, 'error', {
        message: 'Quest processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send a single quest update
   */
  private sendQuestUpdate(executionId: string, updateType: string, data: any) {
    if (this.notifier) {
      this.notifier.sendQuestUpdate(executionId, {
        type: updateType,
        ...data
      });
    } else {
      // HTTP fallback
      const notificationWorkerUrl = 'http://localhost:3002';
      fetch(`${notificationWorkerUrl}/internal/quest/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionId,
          data: {
            type: updateType,
            ...data
          }
        })
      }).catch(error => console.error(`[QuestController] Failed to send ${updateType} via HTTP for ${executionId}:`, error));
    }
  }

  /**
   * Send progressive updates to frontend
   */
  private sendProgressiveUpdates(result: any, executionId: string) {
    if (!this.notifier) {
      console.log(`[QuestController] No notifier available, using HTTP fallback for ${executionId}`);
      this.sendProgressiveUpdatesViaHTTP(result, executionId);
      return;
    }

    // Batch 1: Key phrases
    setTimeout(() => {
      this.notifier!.sendQuestUpdate(executionId, {
        type: 'key_phrases',
        capsules: result.key_phrases
      });
      console.log(`[QuestController] Sent key phrases for ${executionId}`);
    }, 200);

    // Batch 2: Stage 1 visualization
    setTimeout(() => {
      this.notifier!.sendQuestUpdate(executionId, {
        type: 'visualization_stage_1',
        stage: 1,
        entities: result.visualization_stages.stage1
      });
      console.log(`[QuestController] Sent stage 1 visualization for ${executionId}`);
    }, 1000);

    // Batch 3: Stages 2 & 3 visualization
    setTimeout(() => {
      this.notifier!.sendQuestUpdate(executionId, {
        type: 'visualization_stages_2_and_3',
        stage2: result.visualization_stages.stage2,
        stage3: result.visualization_stages.stage3
      });
      console.log(`[QuestController] Sent stages 2&3 visualization for ${executionId}`);
    }, 2000);

    // Batch 4: Final response
    setTimeout(() => {
      this.notifier!.sendQuestUpdate(executionId, {
        type: 'final_response',
        response_text: result.response_text,
        walkthrough_script: result.walkthrough_script,
        reflective_question: result.reflective_question
      });
      console.log(`[QuestController] Sent final response for ${executionId}`);
    }, 3000);
  }

  /**
   * Fallback: Process mock quest in background
   */
  private processMockQuestInBackground(userQuestion: string, executionId: string) {
    if (!this.notifier) return;

    // Use existing mock data generation
    setTimeout(() => {
      this.notifier!.sendQuestUpdate(executionId, {
        type: 'key_phrases',
        capsules: [
          { phrase: 'skating', confidence_score: 0.95, color: '#ff6b6b' },
          { phrase: 'ice skating', confidence_score: 0.9, color: '#4ecdc4' },
        ],
      });
    }, 200);

    setTimeout(() => {
      this.notifier!.sendQuestUpdate(executionId, {
        type: 'visualization_stage_1',
        stage: 1,
        entities: [
          {
            entityId: 'mock_memoryunit_1',
            entityType: 'MemoryUnit',
            position: [10.5, 2.3, -5.7],
            starTexture: 'bright_star',
            title: 'First skating lesson',
            relevanceScore: 0.92,
          },
        ],
        metadata: { total_entities: 1, processing_time_ms: 200 },
      });
    }, 400);

    setTimeout(() => {
      this.notifier!.sendQuestUpdate(executionId, {
        type: 'visualization_stages_2_3',
        stage2: {
          entities: [
            {
              entityId: 'mock_memoryunit_2',
              entityType: 'MemoryUnit',
              position: [5.2, -1.8, 7.3],
              starTexture: 'medium_star',
              title: 'Therapy sessions',
              relevanceScore: 0.75,
              connectionType: '1_hop',
              connectedTo: ['mock_memoryunit_1'],
            },
          ],
          description: '1-hop connections',
        },
        stage3: {
          entities: [
            {
              entityId: 'mock_concept_1',
              entityType: 'Concept',
              position: [-2.1, 4.5, -1.2],
              starTexture: 'dim_star',
              title: 'Resilience',
              relevanceScore: 0.65,
              connectionType: '2_hop',
              connectedTo: ['mock_memoryunit_2'],
            },
          ],
          description: '2-hop connections',
        },
        metadata: { total_entities: 2, processing_time_ms: 400 },
      });
    }, 800);

    setTimeout(() => {
      this.notifier!.sendQuestUpdate(executionId, {
        type: 'final_response',
        response_text:
          'You started skating in 2018, faced challenges, and recovered. Would you like a guided walk through your cosmos graph?',
        walkthrough_script: [
          {
            step_id: 'step_1',
            entity_id: 'mock_memoryunit_1',
            entity_type: 'MemoryUnit',
            narrative:
              'This memory shows your first significant experience where your passion began.',
            camera_position: [10.5, 2.3, -5.7],
            camera_target: [10.5, 2.3, -5.7],
            duration_ms: 3000,
            transition_type: 'smooth',
            highlight_color: '#ff6b6b',
            related_step_ids: ['step_2'],
          },
        ],
        reflective_question: 'What patterns do you notice in your journey?',
        metadata: { entities_retrieved: 3, processing_time_ms: 400, total_processing_time_ms: 1200 },
      });
    }, 1200);
  }

  /**
   * Send progressive updates via HTTP to NotificationWorker
   */
  private async sendProgressiveUpdatesViaHTTP(result: any, executionId: string) {
    const notificationWorkerUrl = 'http://localhost:3002'; // NotificationWorker port
    
    try {
      // Batch 1: Key phrases
      setTimeout(async () => {
        try {
          await fetch(`${notificationWorkerUrl}/internal/quest/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              executionId,
              data: {
                type: 'key_phrases',
                capsules: result.key_phrases
              }
            })
          });
          console.log(`[QuestController] Sent key phrases via HTTP for ${executionId}`);
        } catch (error) {
          console.error(`[QuestController] Failed to send key phrases via HTTP for ${executionId}:`, error);
        }
      }, 200);

      // Batch 2: Stage 1 visualization
      setTimeout(async () => {
        try {
          await fetch(`${notificationWorkerUrl}/internal/quest/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              executionId,
              data: {
                type: 'visualization_stage_1',
                stage: 1,
                entities: result.visualization_stages.stage1
              }
            })
          });
          console.log(`[QuestController] Sent stage 1 visualization via HTTP for ${executionId}`);
        } catch (error) {
          console.error(`[QuestController] Failed to send stage 1 via HTTP for ${executionId}:`, error);
        }
      }, 1000);

      // Batch 3: Stages 2 & 3 visualization
      setTimeout(async () => {
        try {
          await fetch(`${notificationWorkerUrl}/internal/quest/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              executionId,
              data: {
                type: 'visualization_stages_2_and_3',
                stage2: result.visualization_stages.stage2,
                stage3: result.visualization_stages.stage3
              }
            })
          });
          console.log(`[QuestController] Sent stages 2&3 visualization via HTTP for ${executionId}`);
        } catch (error) {
          console.error(`[QuestController] Failed to send stages 2&3 via HTTP for ${executionId}:`, error);
        }
      }, 2000);

      // Batch 4: Final response
      setTimeout(async () => {
        try {
          await fetch(`${notificationWorkerUrl}/internal/quest/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              executionId,
              data: {
                type: 'final_response',
                response_text: result.response_text,
                walkthrough_script: result.walkthrough_script,
                reflective_question: result.reflective_question
              }
            })
          });
          console.log(`[QuestController] Sent final response via HTTP for ${executionId}`);
        } catch (error) {
          console.error(`[QuestController] Failed to send final response via HTTP for ${executionId}:`, error);
        }
      }, 3000);
    } catch (error) {
      console.error(`[QuestController] HTTP fallback failed for ${executionId}:`, error);
    }
  }
}


