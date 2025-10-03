import { useState, useEffect, useCallback } from 'react';
import { MockQuestWebSocket } from '../services/mockQuestWebSocket';
import { QuestBatch } from '../utils/mockQuestData';

interface QuestState {
  isProcessing: boolean;
  execution_id: string | null;
  key_phrases: any[];
  visualization_stages: { stage1: any[]; stage2: any[]; stage3: any[] };
  walkthrough_script: any[];
  response: string;
  reflective_question: string;
  error: string | null;
}

export const useMockQuest = () => {
  const [questState, setQuestState] = useState<QuestState>({
    isProcessing: false,
    execution_id: null,
    key_phrases: [],
    visualization_stages: { stage1: [], stage2: [], stage3: [] },
    walkthrough_script: [],
    response: '',
    reflective_question: '',
    error: null,
  });

  const [mockWebSocket] = useState(() => new MockQuestWebSocket());

  useEffect(() => {
    const onConnect = () => {};
    const onUpdate = (data: QuestBatch) => handleQuestUpdate(data);
    mockWebSocket.on('connect', onConnect);
    mockWebSocket.on('quest:update', onUpdate);
    return () => {
      mockWebSocket.off('connect', onConnect);
      mockWebSocket.off('quest:update', onUpdate);
      mockWebSocket.disconnect();
    };
  }, [mockWebSocket]);

  const handleQuestUpdate = useCallback((data: QuestBatch) => {
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
    }
  }, []);

  const startQuest = useCallback(
    (question: string) => {
      if (questState.isProcessing) return;
      setQuestState({
        isProcessing: true,
        execution_id: null,
        key_phrases: [],
        visualization_stages: { stage1: [], stage2: [], stage3: [] },
        walkthrough_script: [],
        response: '',
        reflective_question: '',
        error: null,
      });
      mockWebSocket.startMockQuest(question);
    },
    [questState.isProcessing, mockWebSocket]
  );

  const resetQuest = useCallback(() => {
    setQuestState({
      isProcessing: false,
      execution_id: null,
      key_phrases: [],
      visualization_stages: { stage1: [], stage2: [], stage3: [] },
      walkthrough_script: [],
      response: '',
      reflective_question: '',
      error: null,
    });
  }, []);

  return { questState, startQuest, resetQuest, isConnected: mockWebSocket.isConnected };
};


