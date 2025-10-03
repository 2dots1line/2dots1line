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


