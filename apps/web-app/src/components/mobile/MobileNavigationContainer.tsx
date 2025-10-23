'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useHUDStore } from '../../stores/HUDStore';
import { useChatStore } from '../../stores/ChatStore';
import { useUserStore } from '../../stores/UserStore';
import { 
  MobileHamburgerMenu
} from '@2dots1line/ui-components';
import type { NavigationItem } from '@2dots1line/ui-components';
import { ContextualSettings } from '../settings/ContextualSettings';
import { 
  Home, 
  MessageCircle, 
  CreditCard, 
  Network 
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
  const { activeView, setActiveView, toggleSettings } = useHUDStore();
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
      // Use the existing loadSession method from ChatStore
      await loadSession(sessionId);
      
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
      {/* Hamburger Button */}
      <button
        onClick={() => setIsMenuOpen(true)}
        className="fixed top-4 left-3 z-50 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:bg-black/80 transition-all"
        title="Menu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      
      {/* Hamburger Menu */}
      <MobileHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
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
    </>
  );
};
