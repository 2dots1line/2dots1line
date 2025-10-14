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
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

import { chatService, type ChatMessage, type UiAction, type MediaGenerationAction, type ViewSwitchAction } from '../../services/chatService';
import { userService } from '../../services/userService';
import { useChatStore } from '../../stores/ChatStore';
import { useUserStore } from '../../stores/UserStore';
import { useHUDStore } from '../../stores/HUDStore';
import { useBackgroundVideoStore } from '../../stores/BackgroundVideoStore';
import { useEngagementStore } from '../../stores/EngagementStore';
import { useEngagementContext } from '../../hooks/useEngagementContext';
import { usePathname } from 'next/navigation';
import { ViewTransitionService } from '../../services/viewTransitionService';

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
  const { activeView } = useHUDStore();
  const pathname = usePathname();
  const router = useRouter();
  
  // Determine current view based on route and HUD store state
  const getCurrentView = (): 'chat' | 'cards' | 'cosmos' | 'dashboard' | null => {
    if (pathname === '/cosmos') {
      return 'cosmos';
    }
    // Only return views that are supported by the view context
    if (activeView === 'chat' || activeView === 'cards' || activeView === 'cosmos' || activeView === 'dashboard') {
      return activeView;
    }
    return null;
  };
  
  const currentView = getCurrentView();
  
  // Debug logging for view context
  console.log('ChatInterface - View context:', { 
    pathname, 
    activeView, 
    currentView,
    computedView: currentView 
  });
  
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

  // Engagement tracking
  const { getFormattedEngagementContext } = useEngagementContext();
  const { trackEvent } = useEngagementStore();

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
    // Always scroll to latest message for all sizes when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track scroll events
  useEffect(() => {
    const handleScroll = () => {
      trackEvent({
        type: 'scroll',
        target: 'chat_messages',
        targetType: 'modal',
        view: 'chat',
        metadata: {
          scrollPosition: messagesEndRef.current?.scrollTop || 0
        }
      });
    };

    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => messagesContainer.removeEventListener('scroll', handleScroll);
    }
  }, [trackEvent]);

  // Listen for video generation complete events
  useEffect(() => {
    const handleVideoComplete = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      console.log('[ChatInterface] Video generation complete:', data);
      
      // Trigger a proactive LLM message that naturally mentions the video
      try {
        const token = localStorage.getItem('auth_token');
        const conversationId = currentConversationId || `conv_${Date.now()}`;
        
        // Send a system message to LLM with video ready context
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/v1/conversation/message/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || 'dev-token'}`
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            message: {
              type: 'system_event',
              content: `[SYSTEM: User's video is now ready at ${data.videoUrl}. Naturally mention this in your next response as if you're informing them casually. Include the video using markdown: ![Video](${data.videoUrl})]`
            },
            view_context: currentView || 'chat'
          })
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullResponse = '';
          let botMessageId = `bot-proactive-${Date.now()}`;

          // Create initial bot message
          const initialMessage: ChatMessage = {
            id: botMessageId,
            type: 'bot',
            content: '',
            timestamp: new Date()
          };
          addMessage(initialMessage);

          // Stream the response
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonData = JSON.parse(line.slice(6));
                  if (jsonData.content) {
                    fullResponse += jsonData.content;
                    updateMessage(botMessageId, { content: fullResponse });
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } else {
          // Fallback: just show a simple message with video
          const videoMessage: ChatMessage = {
            id: `bot-video-${Date.now()}`,
            type: 'bot',
            content: `Your video is ready!\n\n![Video](${data.videoUrl})`,
            timestamp: new Date()
          };
          addMessage(videoMessage);
        }
      } catch (error) {
        console.error('[ChatInterface] Error triggering proactive video message:', error);
        // Fallback: simple message
        const videoMessage: ChatMessage = {
          id: `bot-video-${Date.now()}`,
          type: 'bot',
          content: `Your video is ready!\n\n![Video](${data.videoUrl})`,
          timestamp: new Date()
        };
        addMessage(videoMessage);
      }
    };

    window.addEventListener('video_generation_complete', handleVideoComplete);
    return () => window.removeEventListener('video_generation_complete', handleVideoComplete);
  }, [addMessage, updateMessage, currentConversationId, currentView]);

  // Auto-scroll when mini chat expands to show latest messages
  useEffect(() => {
    if (size === 'mini' && isExpanded) {
      // Small delay to ensure the messages area is rendered
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [size, isExpanded]);

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

  // V11.0: WebSocket listener for video generation completion
  useEffect(() => {
    if (!isOpen || !user?.user_id) return;
    
    const socket: Socket = io(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001', {
      auth: {
        token: localStorage.getItem('auth_token') || 'dev-token',
        userId: user.user_id
      }
    });
    
    console.log('[ChatInterface] WebSocket connected for video notifications');
    
    socket.on('video_generation_complete', async (data: any) => {
      console.log('[ChatInterface] Video generation complete:', data);
      
      // Show notification in chat
      const notificationMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: `🎉 ${data.message || 'Your background video is ready!'}\n\n[View in Settings](/settings)`,
        timestamp: new Date()
      };
      addMessage(notificationMessage);
      
      // Reload generated media
      const { loadGeneratedMedia, applyGeneratedVideo } = useBackgroundVideoStore.getState();
      await loadGeneratedMedia();
      
      // Auto-apply to the view context if specified
      if (data.viewContext && data.videoId) {
        applyGeneratedVideo(data.videoId, data.viewContext);
      }
    });
    
    return () => {
      console.log('[ChatInterface] WebSocket disconnected');
      socket.disconnect();
    };
  }, [isOpen, user, addMessage]);

  // Helper function to get appropriate placeholder text based on decision
  // Must be defined before early return
  const getPlaceholderText = useCallback((decision: 'respond_directly' | 'query_memory' | null): string => {
    switch (decision) {
      case 'query_memory':
        return 'recollecting memory...';
      case 'respond_directly':
      case null:
      default:
        return 'thinking...';
    }
  }, []);
  
  /**
   * Type guard to check if an action is a media generation action
   */
  const isMediaGenerationAction = (action: UiAction): action is MediaGenerationAction => {
    return action.action === 'generate_image' || 
           action.action === 'generate_card_image' || 
           action.action === 'generate_background_video';
  };

  /**
   * V11.0: Handle image generation action (dedicated API endpoint)
   */
  const handleImageGeneration = useCallback(async (action: MediaGenerationAction) => {
    console.log('[handleImageGeneration] Called with action:', JSON.stringify(action, null, 2));
    console.log('[handleImageGeneration] action.payload:', action.payload);
    console.log('[handleImageGeneration] action.payload.parameters:', action.payload.parameters);
    
    const { parameters } = action.payload;
    console.log('[handleImageGeneration] Extracted parameters:', parameters);
    
    try {
      // Note: "Generating..." message is now shown by handleActionClick via scenarios.on_confirm.transition_message
      
      // Extract prompt - support both 'prompt' and 'motif' field names
      const prompt = parameters?.prompt || parameters?.motif || '';
      const style = parameters?.style || parameters?.style_pack || undefined;
      const quality = parameters?.quality || 'medium';
      
      console.log('[handleImageGeneration] Extracted values:', { prompt, style, quality });
      
      // Validate prompt before sending
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        console.error('[handleImageGeneration] Invalid prompt!');
        console.error('[handleImageGeneration] Full action object:', action);
        console.error('[handleImageGeneration] parameters object:', parameters);
        console.error('[handleImageGeneration] prompt value:', prompt);
        throw new Error('No valid prompt provided for image generation');
      }
      
      const requestBody = {
        prompt: prompt.trim(),
        style,
        quality,
        viewContext: parameters?.viewContext || 'chat'
      };
      
      console.log('[handleImageGeneration] Request body:', requestBody);
      console.log('[handleImageGeneration] Full action:', action);
      
      const token = localStorage.getItem('auth_token');
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/v1/media/generate-image`;
      console.log('[handleImageGeneration] Calling API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'dev-token'}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('[handleImageGeneration] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[handleImageGeneration] Server error response:', errorData);
        throw new Error(errorData.error || errorData.detail || 'Image generation failed');
      }
      
      const result = await response.json();
      console.log('[handleImageGeneration] Success result:', result);
      
      // Render image inline in chat
      const successMessage: ChatMessage = {
        id: `bot-${Date.now() + 1}`,
        type: 'bot',
        content: `✅ Image generated successfully!\n\n![Generated Image](${result.imageUrl})\n\n*${result.model} • ${result.cost} • ${result.duration}*`,
        timestamp: new Date()
      };
      addMessage(successMessage);
      
    } catch (error) {
      console.error('[handleImageGeneration] Error:', error);
      const errorMessage: ChatMessage = {
        id: `bot-${Date.now() + 1}`,
        type: 'bot',
        content: `❌ Sorry, image generation failed. ${error instanceof Error ? error.message : 'Please try again.'}`,
        timestamp: new Date()
      };
      addMessage(errorMessage);
    }
  }, [addMessage]);
  
  /**
   * V11.0: Handle video generation action
   */
  const handleVideoGeneration = useCallback(async (action: MediaGenerationAction) => {
    const { parameters } = action.payload;
    
    try {
      // Note: "Generating..." message is now shown by handleActionClick via scenarios.on_confirm.transition_message
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/v1/media/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'dev-token'}`
        },
        body: JSON.stringify({
          prompt: parameters?.prompt,
          viewContext: parameters?.viewContext || 'chat',
          mood: parameters?.mood,
          quality: parameters?.quality || 'fast',
          cinematography: parameters?.cinematography,
          useImageSeed: parameters?.useImageSeed || false
        })
      });
      
      // Video generation returns 202 Accepted (async operation)
      if (!response.ok && response.status !== 202) {
        throw new Error('Video generation failed to start');
      }
      
      const result = await response.json();
      
      // Video generation started successfully - no UI message needed
      // The LLM's transition_message (from scenarios.on_confirm) already plays
      console.log('[ChatInterface] Video generation started:', result.jobId);
      
    } catch (error) {
      console.error('Video generation error:', error);
      const errorMessage: ChatMessage = {
        id: `bot-${Date.now() + 1}`,
        type: 'bot',
        content: '❌ Sorry, video generation failed to start. Please try again.',
        timestamp: new Date()
      };
      addMessage(errorMessage);
    }
  }, [addMessage]);

  /**
   * Handle UI action button click (e.g., "Yes" for view switch, media generation)
   * IMPORTANT: Must be defined before early return to maintain hook order
   */
  const handleActionClick = useCallback((action: UiAction, buttonValue: 'confirm' | 'dismiss') => {
    console.log('[handleActionClick] Called with:', { action, buttonValue });
    console.log('[handleActionClick] action type:', action.action);
    console.log('[handleActionClick] action.payload:', action.payload);
    
    if (buttonValue === 'dismiss') {
      // Scenario B: User dismissed
      const dismissScenario = action.payload.scenarios.on_dismiss;
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: dismissScenario.content,
        timestamp: new Date()
      };
      addMessage(botMessage);
      
      trackEvent({
        type: 'click',
        target: 'action_dismiss',
        targetType: 'button',
        view: currentView || 'chat',
        metadata: { action: action.action, target: action.payload.target }
      });
      
      return;
    }
    
    // Type guard for media generation (image)
    if (buttonValue === 'confirm' && (action.action === 'generate_image' || action.action === 'generate_card_image')) {
      if (!isMediaGenerationAction(action)) return; // Type guard
      
      const confirmScenario = action.payload.scenarios.on_confirm;
      
      // Show transition message (like view transitions do)
      const transitionMessage: ChatMessage = {
        id: `transition-${Date.now()}`,
        type: 'bot',
        content: confirmScenario.transition_message || '🎨 Generating your image...',
        timestamp: new Date()
      };
      addMessage(transitionMessage);
      
      // Track confirmation
      trackEvent({
        type: 'click',
        target: 'action_confirm',
        targetType: 'button',
        view: currentView || 'chat',
        metadata: { action: action.action, question: action.question }
      });
      
      // Trigger actual generation
      handleImageGeneration(action);
      return;
    }
    
    // Type guard for media generation (video)
    if (buttonValue === 'confirm' && action.action === 'generate_background_video') {
      if (!isMediaGenerationAction(action)) return; // Type guard
      
      const confirmScenario = action.payload.scenarios.on_confirm;
      
      // Show transition message (like view transitions do)
      const transitionMessage: ChatMessage = {
        id: `transition-${Date.now()}`,
        type: 'bot',
        content: confirmScenario.transition_message || '🎬 Starting video generation...',
        timestamp: new Date()
      };
      addMessage(transitionMessage);
      
      // Track confirmation
      trackEvent({
        type: 'click',
        target: 'action_confirm',
        targetType: 'button',
        view: currentView || 'chat',
        metadata: { action: action.action, question: action.question }
      });
      
      // Trigger actual generation
      handleVideoGeneration(action);
      return;
    }
    
    // Type guard for view switch
    if (buttonValue === 'confirm' && action.action === 'switch_view') {
      const viewAction = action as ViewSwitchAction;
      const confirmScenario = viewAction.payload.scenarios.on_confirm;
      const targetView = viewAction.payload.target.toLowerCase();
      
      // Get transition config
      const transitionConfig = ViewTransitionService.getTransition(
        currentView || 'chat',
        targetView
      );
      
      // 1. Add transition message immediately
      const transitionMessage: ChatMessage = {
        id: `transition-${Date.now()}`,
        type: 'bot',
        content: confirmScenario.transition_message,
        timestamp: new Date()
      };
      addMessage(transitionMessage);
      
      // 2. Track confirmation
      trackEvent({
        type: 'click',
        target: 'action_confirm',
        targetType: 'button',
        view: currentView || 'chat',
        metadata: {
          action: viewAction.action,
          target: targetView,
          question: viewAction.question
        }
      });
      
      // 3. Store main content using ViewTransitionService (single global key)
      ViewTransitionService.storeTransitionContent(
        targetView,
        confirmScenario.main_content,
        transitionConfig?.target_chat_size
      );
      
      // 4. Give user time to read transition message
      const delay = transitionConfig?.transition_delay_ms || 1500;
      setTimeout(() => {
        // 5. Navigate to target view
        const navTarget = ViewTransitionService.getNavigationTarget(targetView);
        
        // Handle navigation based on route and activeView
        if (navTarget.route === '/') {
          // Navigating to main page - set activeView via HUD
          if (navTarget.activeView) {
            useHUDStore.getState().setActiveView(navTarget.activeView as any);
          }
          router.push('/');
        } else {
          // Navigating to dedicated route (e.g., /cosmos)
          router.push(navTarget.route);
        }
        
        console.log(`🔄 ChatInterface: Navigating to ${targetView}`, navTarget);
      }, delay);
    }
    
    // Other actions (open_card, focus_entity, etc.) - future implementation
  }, [router, trackEvent, currentView, addMessage]);

  // Early return after all hooks are defined
  if (!isOpen) return null;

  const handleSendMessage = async () => {
    if ((!message.trim() && !currentAttachment) || isLoading) {
      return;
    }

    // Track input focus/typing engagement
    trackEvent({
      type: 'focus',
      target: 'message_input',
      targetType: 'button',
      view: 'chat',
      metadata: {
        messageLength: message.length,
        hasAttachment: !!currentAttachment
      }
    });
    
    // Auto-expand mini chat when sending a message
    if (size === 'mini' && !isExpanded) {
      setIsExpanded(true);
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
        
        // Track message send event
        trackEvent({
          type: 'click',
          target: 'send_message',
          targetType: 'button',
          view: 'chat',
          metadata: {
            messageLength: messageContent.length,
            hasAttachment: !!currentAttachment
          }
        });

        const engagementContext = getFormattedEngagementContext(30000);
        console.log('🔍 ChatInterface - Engagement context being sent:', engagementContext);
        
        await chatService.sendMessageStreaming(
          {
            message: messageContent,
            conversation_id: currentConversationId || undefined,
            viewContext: currentView ? {
              currentView: currentView as 'chat' | 'cards' | 'cosmos' | 'dashboard',
              viewDescription: undefined // Let the backend use default descriptions
            } : undefined,
            engagementContext: engagementContext || undefined,
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
            
            // If response has ui_actions, attach them to the bot message
            if (response.ui_actions && response.ui_actions.length > 0) {
              console.log('🎬 ChatInterface: Received ui_actions:', response.ui_actions);
              updateMessage(botMessageId, {
                content: accumulatedResponse || getPlaceholderText(currentDecision),
                timestamp: new Date(),
                ui_actions: response.ui_actions
              });
            }
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
        
        {/* Inline action buttons */}
        {msg.ui_actions && msg.ui_actions.length > 0 && (
          <div className="inline-flex items-center gap-2 ml-2">
            {msg.ui_actions.map((action, index) => {
              console.log(`[render] Message ${msg.id} - Action ${index}:`, action);
              console.log(`[render] Action payload:`, action.payload);
              const payload = action.payload as any;
              if (payload.parameters) {
                console.log(`[render] Action parameters:`, payload.parameters);
              }
              return (
                <span key={index} className="inline-flex items-center gap-2">
                  {action.buttons.map((button, btnIndex) => (
                    <button
                      key={btnIndex}
                      onClick={() => handleActionClick(action, button.value)}
                      className={`inline-flex items-center px-4 py-1.5 rounded-full
                                 backdrop-blur-sm border text-sm font-medium
                                 transition-all duration-200 ease-in-out
                                 hover:scale-105 active:scale-95
                                 ${button.value === 'confirm' 
                                   ? 'bg-green-500/10 border-green-400/30 text-green-400 hover:shadow-[0_0_12px_rgba(74,222,128,0.4)]'
                                   : 'bg-gray-500/10 border-gray-400/30 text-gray-400 hover:shadow-[0_0_12px_rgba(156,163,175,0.4)]'
                                 }`}
                      aria-label={`${button.label}: ${action.question}`}
                    >
                      {button.label}
                    </button>
                  ))}
                </span>
              );
            })}
          </div>
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
