'use client';

import { GlassmorphicPanel, GlassButton, DragHandle, MinimizeToggle } from '@2dots1line/ui-components';
import { 
  MessageSquare, 
  Clock, 
  Trash2, 
  Plus,
  ChevronLeft,
  Search,
  History
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { chatService, type ConversationSummary } from '../../services/chatService';
import { useChatStore } from '../../stores/ChatStore';
import { useHUDStore } from '../../stores/HUDStore';

const DEFAULT_POSITION = { x: 20, y: 120 }; // 20px from left, 120px from top

export const ConversationHistoryPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const panelRef = useRef<HTMLDivElement>(null);
  
  const {
    conversationHistory,
    setConversationHistory,
    loadConversation,
    startNewChat,
    setCurrentConversation,
    setMessages
  } = useChatStore();

  const { setActiveView } = useHUDStore();

  // Load conversation history when panel expands
  useEffect(() => {
    if (isExpanded && conversationHistory.length === 0) {
      loadConversationHistory();
    }
  }, [isExpanded, conversationHistory.length]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!panelRef.current) return;
    
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
    
    // Prevent text selection during drag
    e.preventDefault();
  }, []);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 600, e.clientY - dragOffset.y));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const loadConversationHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await chatService.getConversationHistory(50, 0);
      setConversationHistory(response.conversations);
    } catch (err) {
      console.error('Failed to load conversation history:', err);
      setError('Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  }, [setConversationHistory]);

  const handleNewChat = useCallback(async () => {
    try {
      startNewChat(); // This clears the current conversation and prepares for a new one
      setIsExpanded(false); // Close panel after starting new chat
    } catch (err) {
      console.error('Failed to start new chat:', err);
      setError('Failed to start new chat');
    }
  }, [startNewChat]);

  // Handle conversation selection - RESUME CONVERSATION
  const handleConversationSelect = useCallback(async (conversationId: string) => {
    try {
      // Load the conversation data from the API
      const conversationData = await chatService.getConversation(conversationId);
      
      // Set the conversation in the store
      setCurrentConversation(conversationId);
      
      // Set the messages in the store
      setMessages(conversationData.messages);
      
      setIsExpanded(false); // Close panel after selecting conversation
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError('Failed to load conversation');
    }
  }, [setCurrentConversation, setMessages]);

  const handleDeleteConversation = useCallback(async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering conversation selection
    
    // TODO: Implement delete conversation functionality when API is available
    console.log('Delete conversation functionality not yet implemented');
    
    // if (!confirm('Are you sure you want to delete this conversation?')) {
    //   return;
    // }
    
    // try {
    //   await chatService.deleteConversation(conversationId);
    //   // Remove from local state
    //   setConversationHistory(prev => prev.filter(c => c.id !== conversationId));
    // } catch (err) {
    //   console.error('Failed to delete conversation:', err);
    //   setError('Failed to delete conversation');
    // }
  }, [setConversationHistory]);

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

  // Filter conversations based on search query
  const filteredConversations = conversationHistory.filter(conversation =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      ref={panelRef}
      className="fixed z-50 transition-all duration-300 ease-in-out"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(0)', // Container stays in place
      }}
    >
      {/* Main History Panel - Slides from left to right */}
      <div 
        className="relative transition-transform duration-300 ease-in-out"
        style={{
          transform: isExpanded ? 'translateX(0)' : 'translateX(-240px)', // Slide panel out to the left
        }}
      >
        <GlassmorphicPanel
          variant="glass-panel"
          rounded="xl"
          padding="sm"
          className={`
            w-64 transition-all duration-300 ease-in-out
            ${isDragging ? 'scale-105 shadow-2xl' : 'scale-100'}
            ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          {/* Drag Handle - Mirrors HUD */}
          <DragHandle
            onMouseDown={handleMouseDown}
            className="mb-3 cursor-move"
          >
            <div className="flex items-center justify-center py-2">
              <span className="text-xs text-white/70 font-medium">Conversation History</span>
            </div>
          </DragHandle>

          {/* Search Bar */}
          <div className="mb-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full bg-white/10 border border-white/20 rounded-lg px-8 py-2
                  text-white placeholder-white/50 text-sm
                  focus:outline-none focus:border-white/40
                "
              />
            </div>
          </div>

          {/* New Chat Button */}
          <GlassButton
            onClick={handleNewChat}
            className="w-full mb-3 px-3 py-2 text-sm hover:bg-white/20 flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            New Chat
          </GlassButton>

          {/* Error Display */}
          {error && (
            <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-xs">{error}</p>
            </div>
          )}

          {/* Conversation List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare size={24} className="mx-auto mb-2 text-white/50" />
                <p className="text-white/50 text-sm">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <GlassButton
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation.id)}
                  className="w-full text-left p-3 hover:bg-white/10 transition-colors duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white text-sm font-medium truncate flex-1">
                      {conversation.title}
                    </h4>
                    {/* TODO: Re-enable delete button when API is implemented */}
                    {/* <GlassButton
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      className="p-1 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete conversation"
                    >
                      <Trash2 size={12} className="text-red-300" />
                    </GlassButton> */}
                  </div>
                  
                  <p className="text-white/70 text-xs mb-2 line-clamp-2">
                    {conversation.lastMessage}
                  </p>
                  
                  <div className="flex items-center gap-2 text-white/50 text-xs">
                    <Clock size={12} />
                    <span>{formatTimestamp(conversation.timestamp)}</span>
                    <span>•</span>
                    <span>{conversation.messageCount} messages</span>
                  </div>
                </GlassButton>
              ))
            )}
          </div>
        </GlassmorphicPanel>
      </div>

      {/* Minimize Toggle - Left edge, mirror of HUD chevron */}
      <div className="absolute top-0 left-0 z-50">
        <GlassButton
          onClick={() => setIsExpanded(!isExpanded)}
          className="
            w-10 h-10 rounded-full bg-white/10 border border-white/20
            hover:bg-white/20 transition-all duration-200
            flex items-center justify-center
            group
          "
          title={isExpanded ? "Hide conversation history" : "Show conversation history"}
        >
          <div className="flex items-center gap-1">
            <History size={14} className="text-white/80" />
            <ChevronLeft 
              size={12} 
              className={`
                text-white/80 transition-transform duration-300
                ${isExpanded ? 'rotate-180' : 'rotate-0'}
              `}
            />
          </div>
        </GlassButton>
      </div>
    </div>
  );
};
