import { MockQuestDataGenerator, QuestBatch } from '../utils/mockQuestData';

type Listener = (data: any) => void;

export class MockQuestWebSocket {
  private listeners: Map<string, Listener[]> = new Map();
  private connected: boolean = false;
  private currentExecutionId: string | null = null;

  constructor() {
    this.setupMockConnection();
  }

  private setupMockConnection(): void {
    setTimeout(() => {
      this.connected = true;
      this.emit('connect', { message: 'Mock WebSocket connected' });
    }, 100);
  }

  get isConnected(): boolean {
    return this.connected;
  }

  joinQuest(executionId: string): void {
    this.currentExecutionId = executionId;
    // no-op in mock
  }

  leaveQuest(executionId: string): void {
    if (this.currentExecutionId === executionId) this.currentExecutionId = null;
  }

  startMockQuest(question: string): void {
    if (!this.connected) return;
    const sequence = MockQuestDataGenerator.generateCompleteQuestSequence(question);
    this.currentExecutionId = sequence.execution_id;
    sequence.batches.forEach((batch) => {
      setTimeout(() => {
        if (this.currentExecutionId === sequence.execution_id) {
          this.emit('quest:update', batch.data as QuestBatch);
        }
      }, batch.delay);
    });
  }

  on(event: string, callback: Listener): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Listener): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    callbacks.forEach((cb) => cb(data));
  }

  disconnect(): void {
    this.connected = false;
    this.currentExecutionId = null;
    this.listeners.clear();
  }
}


