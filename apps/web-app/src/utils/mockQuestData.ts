export interface KeyPhraseCapsule {
  phrase: string;
  confidence_score: number; // 0-1
  color: string; // Hex color for UI
  type?: string; // Optional categorization
}

export interface VisualizationEntity {
  entityId: string;
  entityType: 'MemoryUnit' | 'Concept' | 'GrowthEvent' | 'DerivedArtifact';
  position: [number, number, number];
  starTexture: 'bright_star' | 'medium_star' | 'dim_star';
  title: string;
  relevanceScore: number;
  connectionType?: '1_hop' | '2_hop';
  connectedTo?: string[];
}

export interface WalkthroughStepMock {
  stepId: string;
  entityId: string;
  entityType: 'MemoryUnit' | 'Concept' | 'GrowthEvent' | 'DerivedArtifact';
  narrative: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  duration: number;
  transitionType: 'smooth' | 'instant' | 'zoom';
  highlightColor: string;
  relatedSteps: string[];
}

export interface KeyPhraseBatch {
  type: 'key_phrases';
  execution_id: string;
  capsules: KeyPhraseCapsule[];
  created_at: string;
}

export interface VisualizationStage1Batch {
  type: 'visualization_stage_1';
  execution_id: string;
  stage: 1;
  entities: VisualizationEntity[];
  metadata: {
    total_entities: number;
    processing_time_ms: number;
  };
  created_at: string;
}

export interface VisualizationStages2And3Batch {
  type: 'visualization_stages_2_3';
  execution_id: string;
  stage2: { entities: VisualizationEntity[]; description: string };
  stage3: { entities: VisualizationEntity[]; description: string };
  metadata: {
    total_entities: number;
    processing_time_ms: number;
  };
  created_at: string;
}

export interface FinalResponseBatch {
  type: 'final_response';
  execution_id: string;
  response_text: string;
  walkthrough_script: WalkthroughStepMock[];
  reflective_question: string;
  metadata: {
    entities_retrieved: number;
    processing_time_ms: number;
    total_processing_time_ms: number;
  };
  created_at: string;
}

export type QuestBatch =
  | KeyPhraseBatch
  | VisualizationStage1Batch
  | VisualizationStages2And3Batch
  | FinalResponseBatch;

export interface QuestMockSequence {
  execution_id: string;
  batches: Array<{ delay: number; data: QuestBatch }>;
}

export class MockQuestDataGenerator {
  static generateKeyPhraseCapsules(question: string): KeyPhraseBatch {
    const mockPhrases = this.extractMockPhrases(question);
    return {
      type: 'key_phrases',
      execution_id: `cq_mock_${Date.now()}`,
      capsules: mockPhrases.map((phrase, index) => ({
        phrase,
        confidence_score: 0.85 + Math.random() * 0.15,
        color: this.getCapsuleColor(index),
        type: this.getCapsuleCategory(phrase),
      })),
      created_at: new Date().toISOString(),
    };
  }

  static generateStage1Visualization(question: string): VisualizationStage1Batch {
    const entities = this.generateMockEntities(3, 'MemoryUnit', 'bright_star');
    return {
      type: 'visualization_stage_1',
      execution_id: `cq_mock_${Date.now()}`,
      stage: 1,
      entities,
      metadata: {
        total_entities: entities.length,
        processing_time_ms: 200 + Math.random() * 100,
      },
      created_at: new Date().toISOString(),
    };
  }

  static generateStages2And3Visualization(question: string): VisualizationStages2And3Batch {
    const stage2Entities = this.generateMockEntities(2, 'MemoryUnit', 'medium_star');
    const stage3Entities = this.generateMockEntities(1, 'Concept', 'dim_star');
    return {
      type: 'visualization_stages_2_3',
      execution_id: `cq_mock_${Date.now()}`,
      stage2: { entities: stage2Entities, description: '1-hop connections from semantic matches' },
      stage3: { entities: stage3Entities, description: '2-hop connections from 1-hop entities' },
      metadata: {
        total_entities: stage2Entities.length + stage3Entities.length,
        processing_time_ms: 400 + Math.random() * 200,
      },
      created_at: new Date().toISOString(),
    };
  }

  static generateFinalResponse(question: string): FinalResponseBatch {
    return {
      type: 'final_response',
      execution_id: `cq_mock_${Date.now()}`,
      response_text: this.generateMockResponse(question),
      walkthrough_script: this.generateMockWalkthroughScript(),
      reflective_question: this.generateMockReflectiveQuestion(question),
      metadata: {
        entities_retrieved: 6,
        processing_time_ms: 400 + Math.random() * 200,
        total_processing_time_ms: 1200 + Math.random() * 300,
      },
      created_at: new Date().toISOString(),
    };
  }

  static generateCompleteQuestSequence(question: string): QuestMockSequence {
    const execution_id = `cq_mock_${Date.now()}`;
    return {
      execution_id,
      batches: [
        { delay: 200, data: this.generateKeyPhraseCapsules(question) },
        { delay: 400, data: this.generateStage1Visualization(question) },
        { delay: 800, data: this.generateStages2And3Visualization(question) },
        { delay: 1200, data: this.generateFinalResponse(question) },
      ],
    };
  }

  private static extractMockPhrases(question: string): string[] {
    const commonPhrases: Record<string, string[]> = {
      skating: ['skating', 'ice skating', 'roller skating', 'skateboard'],
      work: ['work', 'job', 'career', 'professional'],
      travel: ['travel', 'trip', 'vacation', 'journey'],
      family: ['family', 'parents', 'siblings', 'relatives'],
      health: ['health', 'fitness', 'exercise', 'wellness'],
      education: ['school', 'university', 'learning', 'education'],
      hobbies: ['hobbies', 'interests', 'activities', 'passions'],
    };
    const lower = question.toLowerCase();
    const result: string[] = [];
    Object.entries(commonPhrases).forEach(([key, phrases]) => {
      if (lower.includes(key)) result.push(...phrases.slice(0, 2));
    });
    if (result.length === 0) result.push('experience', 'memories', 'thoughts', 'feelings');
    return result.slice(0, 4);
  }

  private static generateMockEntities(
    count: number,
    entityType: VisualizationEntity['entityType'],
    starTexture: VisualizationEntity['starTexture']
  ): VisualizationEntity[] {
    const entities: VisualizationEntity[] = [];
    for (let i = 0; i < count; i++) {
      entities.push({
        entityId: `mock_${entityType.toLowerCase()}_${i + 1}`,
        entityType,
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
        ],
        starTexture,
        title: this.generateMockEntityTitle(entityType, i),
        relevanceScore: 0.7 + Math.random() * 0.3,
        connectionType: starTexture === 'medium_star' ? '1_hop' : starTexture === 'dim_star' ? '2_hop' : undefined,
        connectedTo: starTexture !== 'bright_star' ? [`mock_memoryunit_${i}`] : undefined,
      });
    }
    return entities;
  }

  private static generateMockEntityTitle(entityType: string, index: number): string {
    const titles: Record<string, string[]> = {
      MemoryUnit: [
        'First day at the new job',
        'Weekend hiking adventure',
        'Family dinner celebration',
        'Learning to play guitar',
        'Moving to a new city',
        'Graduation ceremony',
      ],
      Concept: [
        'Personal growth and development',
        'Work-life balance',
        'Creative expression',
        'Health and wellness',
        'Learning and curiosity',
        'Relationships and connections',
      ],
      GrowthEvent: [
        'Career milestone achievement',
        'Overcoming a major challenge',
        'Discovering a new passion',
        'Building meaningful relationships',
        'Developing new skills',
        'Personal transformation',
      ],
    } as const;
    const arr = titles[entityType] || titles['MemoryUnit'];
    return arr[index % arr.length];
  }

  private static generateMockResponse(question: string): string {
    const lower = question.toLowerCase();
    if (lower.includes('skating'))
      return 'You started skating in 2018, went through injuries, and recovered. Skating reflects your resilience and growth. Want a guided walk through your cosmos graph?';
    if (lower.includes('work') || lower.includes('job'))
      return 'Your professional journey shows adaptability and learning. It reflects values of innovation and collaboration. Explore your professional cosmos?';
    if (lower.includes('travel'))
      return 'Your travel experiences shaped your worldview and personal growth. Explore your travel memories?';
    return 'Your experiences reveal patterns of growth and self-discovery. Explore your personal cosmos?';
  }

  private static generateMockWalkthroughScript(): WalkthroughStepMock[] {
    return [
      {
        stepId: 'step_1',
        entityId: 'mock_memoryunit_1',
        entityType: 'MemoryUnit',
        narrative:
          'This memory shows your first significant experience in this area, where you discovered something important about yourself.',
        cameraPosition: [10.5, 2.3, -5.7],
        cameraTarget: [10.5, 2.3, -5.7],
        duration: 3000,
        transitionType: 'smooth',
        highlightColor: '#ff6b6b',
        relatedSteps: ['step_2'],
      },
      {
        stepId: 'step_2',
        entityId: 'mock_memoryunit_2',
        entityType: 'MemoryUnit',
        narrative:
          'Here you faced a challenge that tested your resolve and helped you grow.',
        cameraPosition: [-8.2, 1.1, 3.4],
        cameraTarget: [-8.2, 1.1, 3.4],
        duration: 3000,
        transitionType: 'smooth',
        highlightColor: '#4ecdc4',
        relatedSteps: ['step_1', 'step_3'],
      },
      {
        stepId: 'step_3',
        entityId: 'mock_concept_1',
        entityType: 'Concept',
        narrative:
          'This concept represents the deeper meaning and patterns you discovered through your experiences.',
        cameraPosition: [5.2, -1.8, 7.3],
        cameraTarget: [5.2, -1.8, 7.3],
        duration: 3000,
        transitionType: 'smooth',
        highlightColor: '#45b7d1',
        relatedSteps: ['step_2'],
      },
    ];
  }

  private static generateMockReflectiveQuestion(_question: string): string {
    const questions = [
      'What patterns do you notice in your journey that reflect your personal growth?',
      'How have these experiences shaped your current perspective?',
      'What connections do you see between these different aspects of your life?',
      'What insights about yourself emerge from exploring these memories?',
      'How do these experiences align with your values and goals?',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  private static getCapsuleColor(index: number): string {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    return colors[index % colors.length];
  }

  private static getCapsuleCategory(phrase: string): string {
    const categories: Record<string, string> = {
      skating: 'Activity',
      work: 'Professional',
      travel: 'Experience',
      family: 'Relationships',
      health: 'Wellness',
      education: 'Learning',
    };
    return categories[phrase.toLowerCase()] || 'General';
  }
}


