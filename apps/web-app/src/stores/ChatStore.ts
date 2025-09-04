import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, SessionSummary } from '../services/chatService';
import { chatService } from '../services/chatService';

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  status: 'active' | 'ended';
}

interface ChatState {
  // Current conversation state
  currentConversationId: string | null;
  currentSessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isInitialized: boolean;
  
  // Session history (replaces conversation history)
  sessionHistory: SessionSummary[];
  isHistoryLoading: boolean;
  
  // UI state
  showHistoryModal: boolean;
  showNewChatButton: boolean;
  
  // Actions
  setCurrentConversation: (conversationId: string | null) => void;
  setCurrentSession: (sessionId: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  
  // Session history actions
  setSessionHistory: (history: SessionSummary[]) => void;
  setHistoryLoading: (loading: boolean) => void;
  addToSessionHistory: (session: SessionSummary) => void;
  updateSessionHistoryItem: (sessionId: string, updates: Partial<SessionSummary>) => void;
  
  // UI actions
  setShowHistoryModal: (show: boolean) => void;
  setShowNewChatButton: (show: boolean) => void;
  
  // Utility actions
  startNewChat: () => void;
  loadSession: (sessionId: string) => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentConversationId: null,
      currentSessionId: null,
      messages: [],
      isLoading: false,
      isInitialized: false,
      
      sessionHistory: [],
      isHistoryLoading: false,
      
      showHistoryModal: false,
      showNewChatButton: false,
      
      // Actions
      setCurrentConversation: (conversationId) => {
        set({ currentConversationId: conversationId });
      },
      
      setCurrentSession: (sessionId) => {
        set({ currentSessionId: sessionId });
      },
      
      setMessages: (messages) => {
        // Ensure all timestamps are Date objects and handle attachments
        const messagesWithDateTimestamps = messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
          // Ensure attachment has valid file data
          attachment: msg.attachment && msg.attachment.file ? {
            ...msg.attachment,
            file: msg.attachment.file
          } : undefined
        }));
        set({ messages: messagesWithDateTimestamps });
      },
      
      addMessage: (message) => {
        // Ensure timestamp is a Date object and handle attachments
        const messageWithDateTimestamp = {
          ...message,
          timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp),
          // Ensure attachment has valid file data
          attachment: message.attachment && message.attachment.file ? {
            ...message.attachment,
            file: message.attachment.file
          } : undefined
        };
        set((state) => ({
          messages: [...state.messages, messageWithDateTimestamp]
        }));
      },
      
      clearMessages: () => {
        set({ messages: [] });
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      setInitialized: (initialized) => {
        set({ isInitialized: initialized });
      },
      
      // Session history actions
      setSessionHistory: (history) => {
        set({ sessionHistory: history });
      },
      
      setHistoryLoading: (loading) => {
        set({ isHistoryLoading: loading });
      },
      
      addToSessionHistory: (session) => {
        set((state) => ({
          sessionHistory: [session, ...state.sessionHistory]
        }));
      },
      
      updateSessionHistoryItem: (sessionId, updates) => {
        set((state) => ({
          sessionHistory: state.sessionHistory.map(session =>
            session.session_id === sessionId ? { ...session, ...updates } : session
          )
        }));
      },
      
      // UI actions
      setShowHistoryModal: (show) => {
        set({ showHistoryModal: show });
      },
      
      setShowNewChatButton: (show) => {
        set({ showNewChatButton: show });
      },
      
      // Utility actions
      startNewChat: async () => {
        try {
          // Call the backend to prepare for a new chat (no session created yet)
          const newChatData = await chatService.startNewChat();
          
          set({
            currentConversationId: null,
            currentSessionId: null, // No session until first message
            messages: [],
            isInitialized: false,
            showNewChatButton: false
          });
          
          // Don't add to session history yet - session will be created when first message is sent
          console.log('🆕 New chat prepared - session will be created on first message');
          
        } catch (error) {
          console.error('Failed to start new chat:', error);
          // Fallback to local state change only
          set({
            currentConversationId: null,
            currentSessionId: null,
            messages: [],
            isInitialized: false,
            showNewChatButton: false
          });
        }
      },
      
      loadSession: (sessionId) => {
        set({
          currentSessionId: sessionId,
          showNewChatButton: true
        });
      },
      
      resetChat: () => {
        set({
          currentConversationId: null,
          currentSessionId: null,
          messages: [],
          isLoading: false,
          isInitialized: false,
          showHistoryModal: false,
          showNewChatButton: false
        });
      },
    }),
    {
      name: 'chat-storage',
      // Only persist essential state, not transient UI state
      partialize: (state) => ({
        currentConversationId: state.currentConversationId,
        currentSessionId: state.currentSessionId,
        messages: state.messages,
        isInitialized: state.isInitialized,
        sessionHistory: state.sessionHistory,
        showNewChatButton: state.showNewChatButton,
      }),
    }
  )
);
