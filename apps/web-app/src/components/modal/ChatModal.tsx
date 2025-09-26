'use client';

import { 
  GlassmorphicPanel, 
  GlassButton, 
  MarkdownRenderer, 
  FileAttachment,
  useVoiceRecording,
  VoiceRecordingIndicator
} from '@2dots1line/ui-components';
import { 
  X, 
  Send, 
  Image, 
  Paperclip, 
  Mic, 
  MicOff,
  Plus
} from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ChatModal.css';

import { chatService, type ChatMessage } from '../../services/chatService';
import { userService } from '../../services/userService';
import { useChatStore } from '../../stores/ChatStore';


interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Enhanced ChatMessage type to support attachments
interface EnhancedChatMessage extends ChatMessage {
  attachment?: {
    file: File;
    type: 'image' | 'document';
  };
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [currentAttachment, setCurrentAttachment] = useState<File | null>(null);

  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat store state
  const {
    currentConversationId,
    currentSessionId,
    messages,
    isLoading,
    isInitialized,
    sessionHistory,
    isHistoryLoading,
    showHistoryModal,
    setShowHistoryModal,
    setCurrentConversation,
    setCurrentSession,
    setMessages,
    addMessage,
    clearMessages,
    setLoading,
    setInitialized,
    setSessionHistory,
    setHistoryLoading,
    addToSessionHistory,
    updateSessionHistoryItem,
    startNewChat,
    loadSession,
    resetChat
  } = useChatStore();

  const onVoiceError = useCallback((error: string) => {
    console.error('❌ ChatModal - Voice recording error:', error);
  }, []);

  // Voice recording functionality
  const {
    isRecording,
    isSupported: isVoiceSupported,
    transcript,
    interimTranscript,
    error: voiceError,
    toggleRecording,
    abortRecording,
    clearTranscript
  } = useVoiceRecording({
    onError: onVoiceError
  });

  // Handle final transcripts from the hook
  useEffect(() => {
    if (transcript && transcript.trim()) {
      console.log('🎤 ChatModal - Final transcript from hook state:', transcript);
      setMessage(prev => prev + (prev ? ' ' : '') + transcript.trim());
      clearTranscript();
      console.log('✅ ChatModal - Voice transcript appended and cleared from hook');
    }
  }, [transcript, clearTranscript]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat with proactive greeting when modal opens
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const initializeChat = async () => {
        try {
          // Get user ID from localStorage or use a default for development
          const userId = localStorage.getItem('user_id') || 'dev-user-123';
          
          // Fetch proactive greeting
          const proactiveGreeting = await userService.getProactiveGreeting(userId);
          
          // Set initial message with proactive greeting or fallback
          const defaultGreeting = 'Hello! I\'m here to help you explore your thoughts and experiences. What would you like to talk about today?';
          const initialMessage: EnhancedChatMessage = {
            id: '1',
            type: 'bot',
            content: proactiveGreeting || defaultGreeting,
            timestamp: new Date()
          };
          
          setMessages([initialMessage]);
          setInitialized(true);
        } catch (error) {
          console.error('Error fetching proactive greeting:', error);
          
          // Fallback to default greeting
          const defaultGreeting = 'Hello! I\'m here to help you explore your thoughts and experiences. What would you like to talk about today?';
          const fallbackMessage: EnhancedChatMessage = {
            id: '1',
            type: 'bot',
            content: defaultGreeting,
            timestamp: new Date()
          };
          
          setMessages([fallbackMessage]);
          setInitialized(true);
        }
      };
      
      initializeChat();
    }
  }, [isOpen, isInitialized, setMessages, setInitialized]);

  // Refresh session history when modal opens to ensure up-to-date information - NON-BLOCKING
  useEffect(() => {
    if (isOpen && sessionHistory.length > 0) {
      // Use setTimeout to defer the API call to next tick, allowing UI to render first
      const refreshTimeout = setTimeout(async () => {
        try {
          console.log('🔄 Refreshing session history in background...');
          const sessions = await chatService.getSessions(50);
          setSessionHistory(sessions);
          console.log('🔄 Refreshed session history on modal open');
        } catch (error) {
          console.error('Error refreshing session history:', error);
        }
      }, 0); // Defer to next tick
      
      return () => clearTimeout(refreshTimeout);
    }
  }, [isOpen, setSessionHistory]);

  // Load existing conversation if we have a conversation ID - NON-BLOCKING
  useEffect(() => {
    if (isOpen && currentConversationId && messages.length === 0) {
      // Use setTimeout to defer the API call to next tick, allowing UI to render first
      const loadTimeout = setTimeout(() => {
        loadExistingConversation();
      }, 0); // Defer to next tick
      
      return () => clearTimeout(loadTimeout);
    }
  }, [isOpen, currentConversationId]);

  // Check for proactive messages when returning to chat - NON-BLOCKING
  useEffect(() => {
    if (isOpen && currentConversationId && messages.length > 0) {
      // Use setTimeout to defer the API call to next tick, allowing UI to render first
      const checkTimeout = setTimeout(() => {
        checkForProactiveMessages();
      }, 0); // Defer to next tick
      
      return () => clearTimeout(checkTimeout);
    }
  }, [isOpen, currentConversationId]);

  const loadExistingConversation = useCallback(async () => {
    if (!currentConversationId) return;
    
    setLoading(true);
    try {
      const response = await chatService.getConversation(currentConversationId);
      const enhancedMessages: EnhancedChatMessage[] = response.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(enhancedMessages);
      setInitialized(true);
    } catch (error) {
      console.error('Error loading conversation:', error);
      // Fallback to new chat
      startNewChat();
    } finally {
      setLoading(false);
    }
  }, [currentConversationId, setMessages, setInitialized, setLoading, startNewChat]);

  const checkForProactiveMessages = useCallback(async () => {
    if (!currentConversationId || messages.length === 0) return;
    
    try {
      // Get the timestamp of the last message
      const lastMessageTimestamp = messages[messages.length - 1].timestamp;
      
      // Check for new messages from the backend
      const newMessages = await chatService.checkForProactiveMessages(currentConversationId, lastMessageTimestamp);
      
      if (newMessages.length > 0) {
        console.log('📨 Found proactive messages:', newMessages.length);
        
        // Add new messages to the conversation
        const enhancedMessages: EnhancedChatMessage[] = newMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        enhancedMessages.forEach(msg => addMessage(msg));
      }
    } catch (error) {
      console.error('Error checking for proactive messages:', error);
    }
  }, [currentConversationId, messages, addMessage]);

  if (!isOpen) return null;

  const handleSendMessage = async () => {
    if ((!message.trim() && !currentAttachment) || isLoading) return;
    
    const messageContent = message.trim() || (currentAttachment && currentAttachment.type ? `Sharing ${currentAttachment.type.includes('image') ? 'an image' : 'a file'}: ${currentAttachment.name}` : '');
    
    const userMessage: EnhancedChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      conversation_id: currentConversationId || undefined,
      // Don't store File object in message as it can't be serialized
      // The attachment will be handled separately during upload
      attachment: undefined
    };
    
    addMessage(userMessage);
    setMessage('');
    setLoading(true);
    
    try {
      let response;
      
      if (currentAttachment) {
        // Handle file upload
        response = await chatService.uploadFile(
          currentAttachment,
          message.trim() || undefined,
          currentConversationId || undefined,
          currentSessionId || undefined
        );
        setCurrentAttachment(null); // Clear attachment after sending
      } else {
        // Handle text message
        response = await chatService.sendMessage({
          message: messageContent,
          conversation_id: currentConversationId || undefined,
          context: {
            session_id: currentSessionId || undefined, // Use actual session ID from store
            trigger_background_processing: true
          }
        });
      }

      if (response.success && response.response_text) {
        const botMessage: EnhancedChatMessage = {
          id: response.message_id || `bot-${Date.now()}`,
          type: 'bot',
          content: response.response_text,
          timestamp: new Date(response.timestamp || new Date().toISOString()),
          conversation_id: response.conversation_id
        };
        
        addMessage(botMessage);
        setCurrentConversation(response.conversation_id || null);
        
        // Update session ID if provided in response
        if (response.session_id && response.session_id !== currentSessionId) {
          setCurrentSession(response.session_id);
          console.log('🔄 Updated session ID from backend:', response.session_id);
        }
        
        // Update session history with the new conversation
        if (response.conversation_id && response.session_id) {
          updateSessionHistoryItem(response.session_id, {
            most_recent_conversation_title: response.conversation_title || `Conversation: ${new Date().toISOString().slice(0, 19)}`,
            conversation_count: 1, // This will be updated when we load the full session
            last_active_at: new Date()
          });
          console.log('🔄 Updated session history with new conversation:', response.conversation_title);
        }
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: EnhancedChatMessage = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: `I apologize, but I encountered an error processing your message: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceToggle = () => {
    console.log('🎤 ChatModal.handleVoiceToggle - Starting:', {
      isVoiceSupported,
      isRecording,
      voiceError
    });
    
    if (!isVoiceSupported) {
      console.warn('❌ ChatModal.handleVoiceToggle - Voice not supported');
      alert('Voice recording is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    // If currently recording and user clicks again, force abort
    if (isRecording) {
      console.log('🎤 ChatModal.handleVoiceToggle - Force stopping recording');
      abortRecording();
      return;
    }
    
    if (voiceError) {
      console.log('🎤 ChatModal.handleVoiceToggle - Clearing previous error:', voiceError);
    }
    
    console.log('🎤 ChatModal.handleVoiceToggle - Calling toggleRecording...');
    toggleRecording();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enhanced file validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File is too large. Please select a file under 10MB.');
      return;
    }

    // Set as current attachment for preview
    setCurrentAttachment(file);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const clearAttachment = () => {
    setCurrentAttachment(null);
  };

  const renderMessageContent = (msg: EnhancedChatMessage) => {
    return (
      <div>
        {/* Render attachment if present and file is valid */}
        {msg.attachment && msg.attachment.file && msg.attachment.file instanceof File && (
          <div className="mb-2">
            <FileAttachment
              file={msg.attachment.file}
              variant="message"
              showRemoveButton={false}
            />
          </div>
        )}
        
        {/* Render message content with markdown */}
        {msg.content && (
          <MarkdownRenderer 
            content={msg.content}
            variant="chat"
            className="text-white/90 text-sm leading-relaxed"
          />
        )}
        
        <div className="mt-2">
          <span className="text-xs text-white/50">
            {(msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-4 z-40 flex items-center justify-center pointer-events-none">
      {/* Voice Recording Indicator (fixed position) */}
      <VoiceRecordingIndicator
        isRecording={isRecording}
        interimTranscript={interimTranscript}
        error={voiceError ?? undefined}
      />

      {/* Modal Content - Only the modal panel captures pointer events */}
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="none"
        className="relative w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-brand">Dot</h1>
              <p className="text-xs text-white/60">Your reflection companion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* New Chat Button - Always visible Plus button */}
            <GlassButton
              onClick={startNewChat}
              className="p-2 hover:bg-white/20"
              title="Start new chat"
            >
              <Plus size={18} className="stroke-current" />
            </GlassButton>
            <GlassButton
              onClick={onClose}
              className="p-2 hover:bg-white/20"
            >
              <X size={18} className="stroke-current" />
            </GlassButton>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${msg.type === 'user' ? 'order-1' : 'order-2'}`}>
                <GlassmorphicPanel
                  variant="glass-panel"
                  rounded="lg"
                  padding="sm"
                  className={`
                    ${msg.type === 'user' 
                      ? 'bg-white/20 ml-auto' 
                      : 'bg-white/10'
                    }
                  `}
                >
                  {renderMessageContent(msg)}
                </GlassmorphicPanel>
              </div>
              
              {/* Avatar */}
              <div className={`
                w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1
                ${msg.type === 'user' 
                  ? 'bg-white/20 order-2 ml-3' 
                  : 'bg-gradient-to-br from-white/30 to-white/10 order-1 mr-3'
                }
              `}>
                {msg.type === 'user' ? (
                  <div className="w-4 h-4 bg-white/70 rounded-full" />
                ) : (
                  <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/20">
                  {/* File attachment preview */}
        {currentAttachment && currentAttachment.type && currentAttachment.name && (
          <div className="mb-4">
            <FileAttachment
              file={currentAttachment}
              variant="preview"
              onRemove={clearAttachment}
            />
          </div>
        )}

          <GlassmorphicPanel
            variant="glass-panel"
            rounded="lg"
            padding="sm"
            className="flex items-end gap-3"
          >
            {/* File Upload Buttons */}
            <div className="flex gap-2">
              <GlassButton
                onClick={handleImageUpload}
                className="p-2 hover:bg-white/20"
                title="Upload image"
                disabled={isLoading}
              >
                <Image size={18} className="stroke-current" strokeWidth={1.5} />
              </GlassButton>
              <GlassButton
                onClick={handleFileUpload}
                className="p-2 hover:bg-white/20"
                title="Upload file"
                disabled={isLoading}
              >
                <Paperclip size={18} className="stroke-current" strokeWidth={1.5} />
              </GlassButton>
            </div>

            {/* Message Input */}
            <div className="flex-1">
              <textarea
                ref={messageInputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts..."
                className="
                  w-full bg-transparent text-white placeholder-white/50 
                  resize-none outline-none text-sm leading-relaxed
                  min-h-[40px] max-h-[120px] py-2
                "
                rows={1}
                disabled={isLoading}
              />
            </div>

            {/* Voice & Send Buttons */}
            <div className="flex gap-2">
              <GlassButton
                onClick={handleVoiceToggle}
                className={`
                  p-2 transition-all duration-200
                  ${isRecording 
                    ? 'bg-red-500/30 hover:bg-red-500/40 text-red-200' 
                    : isVoiceSupported 
                      ? 'hover:bg-white/20'
                      : 'opacity-50 cursor-not-allowed'
                  }
                `}
                title={
                  !isVoiceSupported 
                    ? 'Voice recording not supported'
                    : isRecording 
                      ? 'Stop recording' 
                      : 'Start voice recording'
                }
                disabled={!isVoiceSupported || isLoading}
              >
                {isRecording ? (
                  <MicOff size={18} className="stroke-current" strokeWidth={1.5} />
                ) : (
                  <Mic size={18} className="stroke-current" strokeWidth={1.5} />
                )}
              </GlassButton>
              
              <GlassButton
                onClick={handleSendMessage}
                disabled={(!message.trim() && !currentAttachment) || isLoading}
                className="
                  p-2 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
                title="Send message"
              >
                {isLoading ? (
                  <div className="animate-spin w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <Send size={18} className="stroke-current" strokeWidth={1.5} />
                )}
              </GlassButton>
            </div>
          </GlassmorphicPanel>
          
          <p className="text-xs text-white/40 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
            {isVoiceSupported && ' • Click mic to record'}
          </p>
        </div>
      </GlassmorphicPanel>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.csv,.json"
        onChange={handleFileSelection}
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileSelection}
      />


    </div>
  );
};

export default ChatModal; 