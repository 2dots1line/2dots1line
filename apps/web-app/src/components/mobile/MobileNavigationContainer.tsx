'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useHUDStore } from '../../stores/HUDStore';
import { useChatStore } from '../../stores/ChatStore';
import { useUserStore } from '../../stores/UserStore';
import { chatService } from '../../services/chatService';
import { 
  MobileHamburgerMenu
} from '@2dots1line/ui-components';
import type { NavigationItem } from '@2dots1line/ui-components';
import { ContextualSettings } from '../settings/ContextualSettings';
import { MobileChatView } from '../chat/MobileChatView';
import { 
  Home, 
  MessageCircle, 
  CreditCard, 
  Network,
  ArrowLeft
} from 'lucide-react';

export interface MobileNavigationContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileNavigationContainer: React.FC<MobileNavigationContainerProps> = ({
  children,
  className = ''
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'history' | 'settings' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const router = useRouter();
  const pathname = usePathname();
  const { 
    activeView, 
    setActiveView, 
    toggleSettings,
    mobileCosmosChatOpen,
    setMobileCosmosChatOpen
  } = useHUDStore();
  const { 
    sessionHistory, 
    setSessionHistory, 
    loadSession, 
    startNewChat, 
    setCurrentSession, 
    setCurrentConversation, 
    setMessages,
    setShowHistoryModal 
  } = useChatStore();
  const { logout } = useUserStore();
  
  const currentView = pathname === '/cosmos' ? 'cosmos' : activeView;
  
  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, route: '/' },
    { id: 'chat', label: 'Chat', icon: MessageCircle, route: '/' },
    { id: 'cards', label: 'Cards', icon: CreditCard, route: '/' },
    { id: 'cosmos', label: 'Cosmos', icon: Network, route: '/cosmos' },
  ];
  
  const handleNavigation = (item: NavigationItem) => {
    if (item.id === 'cosmos') {
      router.push('/cosmos');
    } else {
      router.push('/');
      setActiveView(item.id as any);
    }
    setIsMenuOpen(false);
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('navigation-panel-close'));
  };
  
  const handleChatHistory = () => {
    if (expandedSection === 'history') {
      setExpandedSection(null);
    } else {
      setExpandedSection('history');
      // Load session history if not already loaded
      if (sessionHistory.length === 0) {
        loadSessionHistory();
      }
    }
  };
  
  const handleSessionSelect = async (sessionId: string) => {
    try {
      // Load the session data from the API (same logic as desktop ConversationHistoryPanel)
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
      
      setIsMenuOpen(false);
      setExpandedSection(null);
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };
  
  const handleNewChat = () => {
    startNewChat();
    setIsMenuOpen(false);
    setExpandedSection(null);
  };

  const handleCosmosChatOpen = useCallback(async () => {
    // Check if there's transition content waiting to be displayed (without consuming it)
    try {
      const { ViewTransitionService } = await import('../../services/viewTransitionService');
      const transitionData = sessionStorage.getItem(ViewTransitionService.getStorageKey());
    
    let hasTransitionContent = false;
    if (transitionData) {
      try {
        const content = JSON.parse(transitionData);
        hasTransitionContent = content.targetView === 'cosmos';
      } catch (error) {
        // Invalid data, ignore
      }
    }
    
    if (hasTransitionContent) {
      // There's transition content - don't start fresh chat, let it display
      console.log('🎬 MobileNavigationContainer: Transition content detected, preserving chat continuity');
      setMobileCosmosChatOpen(true);
    } else {
      // No transition content - start fresh chat
      console.log('🎬 MobileNavigationContainer: No transition content, starting fresh chat');
      startNewChat();
      setMobileCosmosChatOpen(true);
    }
    } catch (error) {
      console.error('MobileNavigationContainer: Error opening cosmos chat', error);
      // Fallback: just open chat
      startNewChat();
      setMobileCosmosChatOpen(true);
    }
  }, [startNewChat, setMobileCosmosChatOpen]);
  
  const handleSettings = () => {
    if (expandedSection === 'settings') {
      setExpandedSection(null);
    } else {
      setExpandedSection('settings');
    }
  };
  
  
  const handleLogout = () => {
    logout();
    if (pathname === '/cosmos') {
      router.push('/');
    }
    setIsMenuOpen(false);
  };
  
  
  const loadSessionHistory = async () => {
    try {
      // Use the existing chat service to load sessions
      const { chatService } = await import('../../services/chatService');
      const sessions = await chatService.getSessions(50);
      setSessionHistory(sessions);
    } catch (err) {
      console.error('Failed to load session history:', err);
    }
  };
  
  return (
    <>
      {/* Hamburger Button / Back Button - Show back button when cosmos chat is open */}
      {pathname === '/cosmos' && mobileCosmosChatOpen ? (
        <button
          onClick={() => setMobileCosmosChatOpen(false)}
          className="fixed top-4 left-3 z-50 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:bg-black/80 transition-all"
          title="Back to cosmos"
        >
          <ArrowLeft size={16} />
        </button>
      ) : (
        <button
          onClick={() => {
            setIsMenuOpen(true);
            window.dispatchEvent(new CustomEvent('navigation-panel-open'));
          }}
          className="fixed top-4 left-3 z-50 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:bg-black/80 transition-all"
          title="Menu"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      )}
      
      {/* Hamburger Menu */}
      <MobileHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => {
          setIsMenuOpen(false);
          window.dispatchEvent(new CustomEvent('navigation-panel-close'));
        }}
        navigationItems={navigationItems}
        currentView={currentView as string}
        sessionHistory={sessionHistory}
        isLoadingHistory={false}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigate={handleNavigation}
        onChatHistory={handleChatHistory}
        onSettings={handleSettings}
        onLogout={handleLogout}
        onNewChat={handleNewChat}
        onSessionSelect={handleSessionSelect}
        expandedSection={expandedSection}
        onToggleSection={setExpandedSection}
        settingsComponent={<ContextualSettings />}
      />
      
      {/* Content */}
      <div className={className}>
        {children}
      </div>
      
      {/* Mobile Cosmos Chat Toggle Button - Only show on cosmos page when chat is closed */}
      {pathname === '/cosmos' && !mobileCosmosChatOpen && (
        <button
          onClick={handleCosmosChatOpen}
          className="fixed bottom-4 left-4 z-40 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/20 hover:scale-105 transition-all duration-200 shadow-lg"
          title="Ask about your cosmos"
        >
          <MessageCircle size={18} />
        </button>
      )}
      
      {/* Mobile Cosmos Chat */}
      {pathname === '/cosmos' && mobileCosmosChatOpen && (
        <MobileChatView
          onBack={() => setMobileCosmosChatOpen(false)}
        />
      )}
    </>
  );
};
