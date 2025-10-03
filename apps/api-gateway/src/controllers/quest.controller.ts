import type { Request, Response, NextFunction } from 'express';

type Notifier = { sendQuestUpdate: (executionId: string, data: any) => void };

export class QuestController {
  private notifier?: Notifier;

  constructor(notifier?: Notifier) {
    this.notifier = notifier;
  }

  /**
   * POST /api/v1/quest/process
   * Returns a new executionId immediately. Background streaming will be added next.
   */
  async processQuest(req: Request, res: Response, next: NextFunction) {
    try {
      const { userQuestion, userId, conversationId } = req.body || {};
      const executionId = `cq_${Date.now()}`;

      // Log receipt (placeholder for background processing trigger)
      console.log('[QuestController] processQuest received', {
        userId,
        conversationId,
        hasQuestion: Boolean(userQuestion),
        executionId,
      });

      // Simulate progressive quest batches via Socket.IO if notifier is available
      if (this.notifier) {
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

      // If no in-process notifier is provided, call NotificationWorker internal endpoint
      if (!this.notifier) {
        const post = async (data: any, delayMs: number) => {
          setTimeout(async () => {
            try {
              await fetch(`http://localhost:${process.env.NOTIFICATION_SERVICE_PORT || '3002'}/internal/quest/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ executionId, data })
              });
            } catch (err) {
              console.error('[QuestController] Failed to post internal quest update:', err);
            }
          }, delayMs);
        };

        await post({
          type: 'key_phrases',
          capsules: [
            { phrase: 'skating', confidence_score: 0.95, color: '#ff6b6b' },
            { phrase: 'ice skating', confidence_score: 0.9, color: '#4ecdc4' },
          ]
        }, 200);

        await post({
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
        }, 400);

        await post({
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
        }, 800);

        await post({
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
        }, 1200);
      }

      return res.status(200).json({
        success: true,
        data: {
          executionId,
          status: 'processing',
          message: 'Quest processing started',
        },
      });
    } catch (err) {
      next(err);
    }
  }
}


