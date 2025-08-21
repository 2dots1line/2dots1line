import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from '../services/chatService';

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
  messages: ChatMessage[];
  isLoading: boolean;
  isInitialized: boolean;
  
  // Conversation history
  conversationHistory: ConversationSummary[];
  isHistoryLoading: boolean;
  
  // UI state
  showHistoryModal: boolean;
  showNewChatButton: boolean;
  
  // Actions
  setCurrentConversation: (conversationId: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  
  // History actions
  setConversationHistory: (history: ConversationSummary[]) => void;
  setHistoryLoading: (loading: boolean) => void;
  addToHistory: (conversation: ConversationSummary) => void;
  updateHistoryItem: (id: string, updates: Partial<ConversationSummary>) => void;
  
  // UI actions
  setShowHistoryModal: (show: boolean) => void;
  setShowNewChatButton: (show: boolean) => void;
  
  // Utility actions
  startNewChat: () => void;
  loadConversation: (conversationId: string) => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentConversationId: null,
      messages: [],
      isLoading: false,
      isInitialized: false,
      
      conversationHistory: [],
      isHistoryLoading: false,
      
      showHistoryModal: false,
      showNewChatButton: false,
      
      // Actions
      setCurrentConversation: (conversationId) => {
        set({ currentConversationId: conversationId });
      },
      
      setMessages: (messages) => {
        // Ensure all timestamps are Date objects
        const messagesWithDateTimestamps = messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
        }));
        set({ messages: messagesWithDateTimestamps });
      },
      
      addMessage: (message) => {
        // Ensure timestamp is a Date object
        const messageWithDateTimestamp = {
          ...message,
          timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
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
      
      // History actions
      setConversationHistory: (history) => {
        set({ conversationHistory: history });
      },
      
      setHistoryLoading: (loading) => {
        set({ isHistoryLoading: loading });
      },
      
      addToHistory: (conversation) => {
        set((state) => ({
          conversationHistory: [conversation, ...state.conversationHistory]
        }));
      },
      
      updateHistoryItem: (id, updates) => {
        set((state) => ({
          conversationHistory: state.conversationHistory.map(conv =>
            conv.id === id ? { ...conv, ...updates } : conv
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
      startNewChat: () => {
        set({
          currentConversationId: null,
          messages: [],
          isInitialized: false,
          showNewChatButton: false
        });
      },
      
      loadConversation: (conversationId) => {
        set({
          currentConversationId: conversationId,
          showNewChatButton: true
        });
      },
      
      resetChat: () => {
        set({
          currentConversationId: null,
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
        messages: state.messages,
        isInitialized: state.isInitialized,
        conversationHistory: state.conversationHistory,
        showNewChatButton: state.showNewChatButton,
      }),
    }
  )
);
