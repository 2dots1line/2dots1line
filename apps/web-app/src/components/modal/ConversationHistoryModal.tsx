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

import { chatService, type ConversationSummary } from '../../services/chatService';
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
    conversationHistory,
    setConversationHistory,
    setHistoryLoading,
    loadConversation,
    startNewChat,
    setShowHistoryModal
  } = useChatStore();

  const modalRef = useRef<HTMLDivElement>(null);

  // Load conversation history when modal opens
  useEffect(() => {
    if (isOpen && conversationHistory.length === 0) {
      loadConversationHistory();
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

  const loadConversationHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await chatService.getConversationHistory(50, 0);
      setConversationHistory(response.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  }, [setConversationHistory]);

  const handleConversationSelect = useCallback(async (conversationId: string) => {
    try {
      // Load the selected conversation
      loadConversation(conversationId);
      
      // Close the history modal
      onClose();
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
    }
  }, [loadConversation, onClose]);

  const handleNewChat = useCallback(() => {
    startNewChat();
    onClose();
  }, [startNewChat, onClose]);

  const handleDeleteConversation = useCallback(async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Add delete endpoint to API
      // await chatService.deleteConversation(conversationId);
      
      // Remove from local state
      setConversationHistory(conversationHistory.filter(conv => conv.id !== conversationId));
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation');
    }
  }, [conversationHistory, setConversationHistory]);

  const filteredConversations = conversationHistory.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            <h2 className="text-xl font-bold text-white font-brand">Conversation History</h2>
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
              placeholder="Search conversations..."
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
                  onClick={loadConversationHistory}
                  className="px-4 py-2"
                >
                  Try Again
                </GlassButton>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare size={48} className="mx-auto mb-4 text-white/40" />
                <p className="text-white/60">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
                {!searchQuery && (
                  <p className="text-white/40 text-sm mt-2">
                    Start a new conversation to see it here
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                    className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare size={16} className="text-white/60 flex-shrink-0" />
                        <h3 className="text-white font-medium truncate">
                          {conversation.title}
                        </h3>
                        {conversation.status === 'active' && (
                          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-white/60 text-sm truncate">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-white/40" />
                        <span className="text-white/40 text-xs">
                          {formatTimestamp(conversation.timestamp)}
                        </span>
                        <span className="text-white/40 text-xs">
                          • {conversation.messageCount} messages
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={16} className="text-white/40" />
                      <button
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                        title="Delete conversation"
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
