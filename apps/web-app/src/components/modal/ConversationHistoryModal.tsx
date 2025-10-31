'use client';

import { GlassmorphicPanel, GlassButton, MinimizeToggle } from '@2dots1line/ui-components';
import { 
  MessageSquare, 
  Clock, 
  Trash2, 
  Plus,
  ChevronRight,
  X
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { chatService, type SessionSummary } from '../../services/chatService';
import { useChatStore } from '../../stores/ChatStore';

interface ConversationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConversationHistoryModal: React.FC<ConversationHistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    sessionHistory,
    setSessionHistory,
    setHistoryLoading,
    loadSession,
    startNewChat,
    setShowHistoryModal,
    setCurrentSession,
    setCurrentConversation,
    setMessages
  } = useChatStore();

  const modalRef = useRef<HTMLDivElement>(null);

  // Load session history when modal opens
  useEffect(() => {
    if (isOpen && sessionHistory.length === 0) {
      loadSessionHistory();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadSessionHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sessions = await chatService.getSessions(50);
      setSessionHistory(sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session history');
    } finally {
      setIsLoading(false);
    }
  }, [setSessionHistory]);

  const handleSessionSelect = useCallback(async (sessionId: string) => {
    try {
      // Load the session data from the API (same logic as ConversationHistoryPanel)
      const sessionData = await chatService.getSession(sessionId);
      
      // Set the session in the store
      setCurrentSession(sessionId);
      
      // If the session has conversations, load ALL conversations and merge them chronologically
      if (sessionData.conversations && sessionData.conversations.length > 0) {
        // Load all conversations in the session
        const allConversationData = await Promise.all(
          sessionData.conversations.map(conv => chatService.getConversation(conv.id))
        );
        
        // Merge all messages from all conversations chronologically
        const allMessages = allConversationData
          .flatMap(convData => convData.messages)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // Set the most recent conversation ID (for new messages)
        const mostRecentConversation = sessionData.conversations[0];
        setCurrentConversation(mostRecentConversation.id);
        
        // Set all merged messages in the store
        setMessages(allMessages);
      } else {
        // No conversations in this session yet, just set the session
        setCurrentConversation(null);
        setMessages([]);
      }
      
      // Close the history modal
      onClose();
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Failed to load session');
    }
  }, [setCurrentSession, setCurrentConversation, setMessages, onClose]);

  const handleNewChat = useCallback(() => {
    startNewChat();
    onClose();
  }, [startNewChat, onClose]);

  const handleDeleteSession = useCallback(async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Add delete endpoint to API
      // await chatService.deleteSession(sessionId);
      
      // Remove from local state
      setSessionHistory(
        sessionHistory.filter((session: SessionSummary) => session.session_id !== sessionId)
      );
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete session');
    }
  }, [sessionHistory, setSessionHistory]);

  const filteredSessions: SessionSummary[] = sessionHistory.filter((session: SessionSummary) =>
    session.most_recent_conversation_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.conversations && session.conversations.some((conv: SessionSummary['conversations'][number]) => 
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  const formatTimestamp = (timestamp: Date | string) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="relative w-full max-w-md mx-4"
      >
        <GlassmorphicPanel
          variant="glass-panel"
          rounded="xl"
          padding="lg"
          className="relative w-full max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white font-brand">Session History</h2>
            <div className="flex items-center gap-2">
              <MinimizeToggle
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
                className="text-white/70 hover:text-white"
              />
              <GlassButton
                onClick={onClose}
                className="p-2 hover:bg-white/20"
              >
                <X size={20} className="stroke-current" />
              </GlassButton>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:border-white/40 focus:outline-none"
            />
          </div>

          {/* New Chat Button */}
          <GlassButton
            onClick={handleNewChat}
            className="w-full mb-4 bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <Plus size={16} className="mr-2" />
            New Chat
          </GlassButton>

          {/* Content */}
          <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[60vh]' : 'max-h-0'}`}>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">{error}</p>
                <GlassButton
                  onClick={loadSessionHistory}
                  className="px-4 py-2"
                >
                  Try Again
                </GlassButton>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare size={48} className="mx-auto mb-4 text-white/40" />
                <p className="text-white/60">
                  {searchQuery ? 'No sessions found' : 'No sessions yet'}
                </p>
                {!searchQuery && (
                  <p className="text-white/40 text-sm mt-2">
                    Start a new chat to see it here
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {filteredSessions.map((session: SessionSummary) => (
                  <div
                    key={session.session_id}
                    onClick={() => handleSessionSelect(session.session_id)}
                    className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare size={16} className="text-white/60 flex-shrink-0" />
                        <h3 className="text-white font-medium truncate">
                          {session.most_recent_conversation_title || 'New Chat'}
                        </h3>
                      </div>
                      <p className="text-white/60 text-sm truncate">
                        {session.conversations && session.conversations.length > 0 
                          ? session.conversations[0].lastMessage 
                          : 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-white/40" />
                        <span className="text-white/40 text-xs">
                          {formatTimestamp(session.last_active_at)}
                        </span>
                        <span className="text-white/40 text-xs">
                          • {session.conversation_count} conversations
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={16} className="text-white/40" />
                      <button
                        onClick={(e) => handleDeleteSession(session.session_id, e)}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                        title="Delete session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassmorphicPanel>
      </div>
    </div>
  );
};
