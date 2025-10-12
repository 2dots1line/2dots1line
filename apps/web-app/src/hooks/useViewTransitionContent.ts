import { useEffect } from 'react';
import { useChatStore } from '../stores/ChatStore';
import { useHUDStore } from '../stores/HUDStore';
import { ViewTransitionService } from '../services/viewTransitionService';
import type { ChatMessage } from '../services/chatService';

/**
 * Generic hook to handle view transition content display
 * Works for any view (cosmos, cards, chat, dashboard)
 * 
 * @param currentView - Name of current view ('cosmos', 'cards', 'chat', 'dashboard')
 * @param isLoading - Whether the view is currently loading
 * @param isReady - Whether the view is ready to display content
 */
export const useViewTransitionContent = (
  currentView: string,
  isLoading: boolean,
  isReady: boolean
) => {
  const { addMessage, setChatSize } = useChatStore();
  const { setCosmosChatSize, setCardsChatSize } = useHUDStore();

  useEffect(() => {
    // Wait for view to be fully loaded before displaying content
    if (isLoading || !isReady) return;

    const transitionContent = ViewTransitionService.retrieveTransitionContent(currentView);
    
    if (transitionContent) {
      console.log(`🎬 useViewTransitionContent: Displaying content in ${currentView}`);
      
      // Add main content as bot message
      const mainMessage: ChatMessage = {
        id: `transition-${transitionContent.timestamp}`,
        type: 'bot',
        content: transitionContent.content,
        timestamp: new Date(transitionContent.timestamp)
      };
      addMessage(mainMessage);
      
      // Set chat size using the appropriate method for each view
      if (currentView === 'cosmos') {
        setCosmosChatSize(transitionContent.targetChatSize as 'mini' | 'medium');
        console.log(`🎬 useViewTransitionContent: Cosmos chat size set to ${transitionContent.targetChatSize}`);
      } else if (currentView === 'cards') {
        setCardsChatSize(transitionContent.targetChatSize as 'mini' | 'medium');
        console.log(`🎬 useViewTransitionContent: Cards chat size set to ${transitionContent.targetChatSize}`);
      } else {
        // For chat and dashboard views, use ChatStore
        setChatSize(currentView, transitionContent.targetChatSize);
        console.log(`🎬 useViewTransitionContent: Chat size set to ${transitionContent.targetChatSize} for ${currentView}`);
      }
    }
  }, [isLoading, isReady, addMessage, setChatSize, setCosmosChatSize, setCardsChatSize, currentView]);
};

