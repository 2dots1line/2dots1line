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
  Plus,
  Globe,
  Maximize2,
  Minimize2
} from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { chatService, type ChatMessage } from '../../services/chatService';
import { userService } from '../../services/userService';
import { useChatStore } from '../../stores/ChatStore';
import { useUserStore } from '../../stores/UserStore';

export type ChatSize = 'full' | 'medium' | 'mini';

interface ChatInterfaceProps {
  size: ChatSize;
  isOpen: boolean;
  onClose?: () => void;
  onSizeChange?: (size: 'medium' | 'mini') => void;
  className?: string;
  embedded?: boolean; // Whether this is embedded in another view (cards/cosmos)
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  size, 
  isOpen, 
  onClose, 
  onSizeChange,
  className = '',
  embedded = false
}) => {
  const [message, setMessage] = useState('');
  const [currentAttachment, setCurrentAttachment] = useState<File | null>(null);
  const [currentDecision, setCurrentDecision] = useState<'respond_directly' | 'query_memory' | null>(null);
  const [isExpanded, setIsExpanded] = useState(size === 'mini' ? false : true);

  // Debug logging
  console.log('ChatInterface render:', { size, isExpanded, onSizeChange: !!onSizeChange });

  const { user } = useUserStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea function
  const autoResizeTextarea = useCallback(() => {
    const textarea = messageInputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const minHeight = size === 'mini' ? 32 : 40;
      const maxHeight = size === 'mini' ? 80 : 120;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [size]);

  // Chat store state
  const {
    currentConversationId,
    currentSessionId,
    messages,
    isLoading,
    isInitialized,
    setCurrentConversation,
    setCurrentSession,
    setMessages,
    addMessage,
    updateMessage,
    setLoading,
    setInitialized,
    startNewChat
  } = useChatStore();

  const onVoiceError = useCallback((error: string) => {
    console.error('❌ ChatInterface - Voice recording error:', error);
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
      setMessage(prev => prev + (prev ? ' ' : '') + transcript.trim());
      clearTranscript();
    }
  }, [transcript, clearTranscript]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (size !== 'mini') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, size]);

  // Initialize chat with proactive greeting when opened
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const initializeChat = async () => {
        try {
          const userId = user?.user_id;
          
          if (!userId) {
            const defaultGreeting = 'Hello! I\'m here to help you explore your thoughts and experiences. What would you like to talk about today?';
            const fallbackMessage: ChatMessage = {
              id: '1',
              type: 'bot',
              content: defaultGreeting,
              timestamp: new Date()
            };
            setMessages([fallbackMessage]);
            setInitialized(true);
            return;
          }
          
          const proactiveGreeting = await userService.getProactiveGreeting(userId);
          const defaultGreeting = 'Hello! I\'m here to help you explore your thoughts and experiences. What would you like to talk about today?';
          const initialMessage: ChatMessage = {
            id: '1',
            type: 'bot',
            content: proactiveGreeting || defaultGreeting,
            timestamp: new Date()
          };
          
          setMessages([initialMessage]);
          setInitialized(true);
        } catch (error) {
          console.error('Error fetching proactive greeting:', error);
          const defaultGreeting = 'Hello! I\'m here to help you explore your thoughts and experiences. What would you like to talk about today?';
          const fallbackMessage: ChatMessage = {
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
  }, [isOpen, isInitialized, user, setMessages, setInitialized]);

  // Auto-resize textarea when message changes or component mounts
  useEffect(() => {
    if (isOpen) {
      autoResizeTextarea();
    }
  }, [message, isOpen, autoResizeTextarea]);

  if (!isOpen) return null;

  // Helper function to get appropriate placeholder text based on decision
  const getPlaceholderText = (decision: 'respond_directly' | 'query_memory' | null): string => {
    switch (decision) {
      case 'query_memory':
        return 'recollecting memory...';
      case 'respond_directly':
      case null:
      default:
        return 'thinking...';
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !currentAttachment) || isLoading) {
      return;
    }
    
    setLoading(true);
    setCurrentDecision(null);
    
    const messageContent = message.trim() || (currentAttachment && currentAttachment.type ? `Sharing ${currentAttachment.type.includes('image') ? 'an image' : 'a file'}: ${currentAttachment.name}` : '');
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      conversation_id: currentConversationId || undefined,
      attachment: undefined
    };
    
    addMessage(userMessage);
    setMessage('');
    
    try {
      let response;
      let accumulatedResponse = '';
      
      if (currentAttachment) {
        response = await chatService.uploadFile(
          currentAttachment,
          message.trim() || undefined,
          currentConversationId || undefined,
          currentSessionId || undefined
        );
        setCurrentAttachment(null);
      } else {
        let botMessageId = `bot-${Date.now()}`;
        let finalResponse: any = null;
        
        const initialBotMessage: ChatMessage = {
          id: botMessageId,
          type: 'bot',
          content: getPlaceholderText(currentDecision),
          timestamp: new Date(),
          conversation_id: currentConversationId || undefined
        };
        addMessage(initialBotMessage);
        
        await chatService.sendMessageStreaming(
          {
            message: messageContent,
            conversation_id: currentConversationId || undefined,
            context: {
              session_id: currentSessionId || undefined,
              trigger_background_processing: true
            }
          },
          (chunk: string) => {
            accumulatedResponse += chunk;
            const displayContent = accumulatedResponse || getPlaceholderText(currentDecision);
            updateMessage(botMessageId, {
              content: displayContent,
              timestamp: new Date()
            });
          },
          (metadata: any) => {
            if (metadata.conversation_id) {
              setCurrentConversation(metadata.conversation_id);
            }
            if (metadata.session_id && metadata.session_id !== currentSessionId) {
              setCurrentSession(metadata.session_id);
            }
          },
          (response: any) => {
            finalResponse = response;
          },
          (error: Error) => {
            updateMessage(botMessageId, {
              content: `I apologize, but I encountered an error processing your message: ${error.message}. Please try again.`,
              timestamp: new Date()
            });
          },
          userMessage.id,
          (decision: 'respond_directly' | 'query_memory') => {
            setCurrentDecision(decision);
            if (!accumulatedResponse) {
              updateMessage(botMessageId, {
                content: getPlaceholderText(decision),
                timestamp: new Date()
              });
            }
          }
        );
        
        response = finalResponse || { success: true, response_text: accumulatedResponse };
      }

      if (response && response.success && response.response_text && !accumulatedResponse) {
        const botMessage: ChatMessage = {
          id: response.message_id || `bot-${Date.now()}`,
          type: 'bot',
          content: response.response_text,
          timestamp: new Date(response.timestamp || new Date().toISOString()),
          conversation_id: response.conversation_id
        };
        
        addMessage(botMessage);
        setCurrentConversation(response.conversation_id || null);
        
        if (response.session_id && response.session_id !== currentSessionId) {
          setCurrentSession(response.session_id);
        }
      } else if (response && !response.success) {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
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
    if (!isVoiceSupported) {
      alert('Voice recording is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    if (isRecording) {
      abortRecording();
      return;
    }
    
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

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File is too large. Please select a file under 10MB.');
      return;
    }

    setCurrentAttachment(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const clearAttachment = () => {
    setCurrentAttachment(null);
  };

  const renderMessageContent = (msg: ChatMessage) => {
    return (
      <div>
        {msg.attachment && msg.attachment.file && msg.attachment.file instanceof File && (
          <div className="mb-2">
            <FileAttachment
              file={msg.attachment.file}
              variant="message"
              showRemoveButton={false}
            />
          </div>
        )}
        
        {msg.content && (
          <MarkdownRenderer 
            content={msg.content}
            variant="chat"
            className={`text-sm leading-relaxed ${
              msg.content === 'thinking...' || msg.content === 'recollecting memory...'
                ? 'text-white/60 italic animate-pulse' 
                : 'text-white/90'
            }`}
          />
        )}
        
        {size !== 'mini' && (
          <div className="mt-2">
            <span className="text-xs text-white/50">
              {(msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Size-specific configurations
  const getSizeConfig = () => {
    switch (size) {
      case 'full':
        return {
          containerClass: 'fixed inset-4 z-40 flex items-center justify-center pointer-events-none',
          panelClass: 'relative w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden pointer-events-auto',
          headerPadding: 'p-6',
          messagesPadding: 'p-6',
          inputPadding: 'p-6',
          showHeader: true,
          showMessages: true,
          maxMessages: 50
        };
      case 'medium':
        return {
          containerClass: embedded ? 'relative w-full h-full' : 'fixed inset-8 z-40 flex items-center justify-center pointer-events-none',
          panelClass: embedded ? 'relative w-full h-full flex flex-col overflow-hidden' : 'relative w-full max-w-2xl h-[70vh] flex flex-col overflow-hidden pointer-events-auto',
          headerPadding: 'p-4',
          messagesPadding: 'p-4',
          inputPadding: 'p-4',
          showHeader: true,
          showMessages: true,
          maxMessages: 20
        };
      case 'mini':
        return {
          containerClass: embedded ? 'relative w-full' : 'fixed bottom-4 right-4 z-[1010] pointer-events-none',
          panelClass: embedded ? 'relative w-full' : 'relative w-80 max-h-[60vh] flex flex-col overflow-hidden pointer-events-auto',
          headerPadding: 'p-3',
          messagesPadding: 'p-3',
          inputPadding: 'p-3',
          showHeader: !embedded,
          showMessages: isExpanded, // Only show messages when manually expanded
          maxMessages: 5
        };
      default:
        return getSizeConfig();
    }
  };

  const config = getSizeConfig();
  const displayMessages = size === 'mini' ? messages.slice(-config.maxMessages) : messages;

  return (
    <div className={`${config.containerClass} ${className}`}>
      {/* Voice Recording Indicator (only for full and medium) */}
      {size !== 'mini' && (
        <VoiceRecordingIndicator
          isRecording={isRecording}
          interimTranscript={interimTranscript}
          error={voiceError ?? undefined}
        />
      )}

      {/* Modal Content */}
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="none"
        className={config.panelClass}
      >
        {/* Header */}
        {config.showHeader && (
          <div className={`flex items-center justify-between ${config.headerPadding} border-b border-white/20`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-brand">Dot</h1>
                {size !== 'mini' && (
                  <p className="text-xs text-white/60">Your reflection companion</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {size === 'mini' && (
                <>
                  {!isExpanded ? (
                    <GlassButton
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Expanding mini chat');
                        setIsExpanded(true);
                      }}
                      className="p-2 hover:bg-white/20 cursor-pointer z-10"
                      title="Expand chat"
                    >
                      <Maximize2 size={16} className="stroke-current" />
                    </GlassButton>
                  ) : (
                    <>
                      <GlassButton
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Expanding to medium from mini');
                          onSizeChange?.('medium');
                        }}
                        className="p-2 hover:bg-white/20 cursor-pointer z-10"
                        title="Expand to medium"
                      >
                        <Maximize2 size={16} className="stroke-current" />
                      </GlassButton>
                      <GlassButton
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Collapsing mini chat');
                          setIsExpanded(false);
                        }}
                        className="p-2 hover:bg-white/20 cursor-pointer z-10"
                        title="Collapse to mini"
                      >
                        <Minimize2 size={16} className="stroke-current" />
                      </GlassButton>
                    </>
                  )}
                </>
              )}
              {size === 'medium' && (
                <GlassButton
                  onClick={() => onSizeChange?.('mini')}
                  className="p-2 hover:bg-white/20"
                  title="Collapse to mini"
                >
                  <Minimize2 size={16} className="stroke-current" />
                </GlassButton>
              )}
              {size !== 'mini' && (
                <GlassButton
                  onClick={startNewChat}
                  className="p-2 hover:bg-white/20"
                  title="Start new chat"
                >
                  <Plus size={18} className="stroke-current" />
                </GlassButton>
              )}
              {onClose && (
                <GlassButton
                  onClick={onClose}
                  className="p-2 hover:bg-white/20"
                >
                  <X size={18} className="stroke-current" />
                </GlassButton>
              )}
            </div>
          </div>
        )}

        {/* Messages Area */}
        {config.showMessages && (
          <div className={`flex-1 overflow-y-auto ${config.messagesPadding} space-y-4 custom-scrollbar`}>
            {displayMessages.map((msg) => (
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
        )}

        {/* Input Area */}
        <div className={`${config.inputPadding} border-t border-white/20`}>
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
            className="flex flex-col gap-3"
          >
            {/* Message Input - Full width above buttons */}
            <div className="w-full">
              <textarea
                ref={messageInputRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setTimeout(autoResizeTextarea, 0);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything"
                className="
                  w-full bg-transparent text-white placeholder-white/50 
                  resize-none outline-none text-sm leading-relaxed
                  min-h-[32px] max-h-[120px] py-2
                "
                rows={1}
                disabled={isLoading}
              />
            </div>

            {/* All Buttons in One Row */}
            <div className="flex gap-2 items-center">
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
              <GlassButton
                className="p-2 hover:bg-white/20"
                title="Web search"
                disabled={isLoading}
              >
                <Globe size={18} className="stroke-current" strokeWidth={1.5} />
              </GlassButton>
              
              {/* Spacer to push voice and send to the right */}
              <div className="flex-1" />
              
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
          
          {size !== 'mini' && (
            <p className="text-xs text-white/40 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
              {isVoiceSupported && ' • Click mic to record'}
            </p>
          )}
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

export default ChatInterface;
