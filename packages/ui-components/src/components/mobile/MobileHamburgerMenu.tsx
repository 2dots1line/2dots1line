'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  MessageCircle, 
  CreditCard, 
  Network, 
  Settings, 
  History, 
  LogOut,
  ChevronRight,
  Plus,
  Search,
  Clock,
  MessageSquare
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  route: string;
}

export interface SessionSummary {
  session_id: string;
  most_recent_conversation_title: string;
  last_active_at: Date | string;
  conversations?: Array<{
    id: string;
    lastMessage: string;
  }>;
  conversation_count: number;
}

export interface MobileHamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  currentView?: string;
  sessionHistory: SessionSummary[];
  isLoadingHistory: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigate: (item: NavigationItem) => void;
  onChatHistory: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onNewChat: () => void;
  onSessionSelect: (sessionId: string) => void;
  expandedSection: 'history' | 'settings' | null;
  onToggleSection: (section: 'history' | 'settings' | null) => void;
  settingsComponent?: React.ReactNode;
}

export const MobileHamburgerMenu: React.FC<MobileHamburgerMenuProps> = ({
  isOpen,
  onClose,
  navigationItems,
  currentView,
  sessionHistory,
  isLoadingHistory,
  searchQuery,
  onSearchChange,
  onNavigate,
  onChatHistory,
  onSettings,
  onLogout,
  onNewChat,
  onSessionSelect,
  expandedSection,
  onToggleSection,
  settingsComponent
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  // Handle swipe left to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;
    
    // If swipe left (negative delta) and significant movement, close menu
    if (deltaX < -50) {
      onClose();
    }
    
    setTouchStartX(null);
  };

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

  const filteredSessions = sessionHistory.filter(session =>
    session.most_recent_conversation_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.conversations && session.conversations.some(conv => 
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      <div 
        ref={menuRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="fixed top-0 left-0 bottom-0 w-72 bg-black/60 backdrop-blur-xl border-r border-white/20 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h2 className="text-lg font-semibold text-white">Navigation</h2>
            <p className="text-xs text-white/50 mt-1">Swipe left or tap outside to close</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Navigation Items */}
        <div className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent size={20} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Divider */}
        <div className="px-4 py-2">
          <div className="border-t border-white/20" />
        </div>
        
        {/* Chat History - Expandable Section */}
        <div className="p-4">
          <button
            onClick={onChatHistory}
            className="w-full flex items-center justify-between p-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <div className="flex items-center gap-3">
              <History size={20} />
              <span className="font-medium">Chat History</span>
            </div>
            <ChevronRight 
              size={16} 
              className={`transition-transform duration-200 ${
                expandedSection === 'history' ? 'rotate-90' : 'rotate-0'
              }`}
            />
          </button>
          
          {/* Expanded Chat History Content */}
          {expandedSection === 'history' && (
            <div className="mt-4 space-y-3 animate-in slide-in-from-top duration-200">
              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-8 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/40"
                />
              </div>
              
              {/* New Chat Button */}
              <button
                onClick={onNewChat}
                className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
              >
                <Plus size={16} />
                <span>New Chat</span>
              </button>
              
              {/* Session List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center py-4">
                    <MessageSquare size={24} className="mx-auto mb-2 text-white/50" />
                    <p className="text-white/50 text-sm">
                      {searchQuery ? 'No sessions found' : 'No sessions yet'}
                    </p>
                  </div>
                ) : (
                  filteredSessions.map((session) => (
                    <button
                      key={session.session_id}
                      onClick={() => onSessionSelect(session.session_id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white text-sm font-medium truncate flex-1">
                          {session.most_recent_conversation_title || 'New Chat'}
                        </h4>
                      </div>
                      
                      <p className="text-white/70 text-xs mb-2 line-clamp-2">
                        {session.conversations && session.conversations.length > 0 
                          ? session.conversations[0].lastMessage 
                          : 'No messages yet'}
                      </p>
                      
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <Clock size={12} />
                        <span>{formatTimestamp(session.last_active_at)}</span>
                        <span>•</span>
                        <span>{session.conversations?.length || 0} conversations</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Settings - Expandable Section */}
        <div className="p-4">
          <button
            onClick={onSettings}
            className="w-full flex items-center justify-between p-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <div className="flex items-center gap-3">
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </div>
            <ChevronRight 
              size={16} 
              className={`transition-transform duration-200 ${
                expandedSection === 'settings' ? 'rotate-90' : 'rotate-0'
              }`}
            />
          </button>
          
          {/* Expanded Settings Content */}
          {expandedSection === 'settings' && (
            <div className="mt-4 space-y-3 animate-in slide-in-from-top duration-200">
              {settingsComponent || (
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/80 text-sm mb-2">Settings</div>
                  <div className="text-white/60 text-xs">
                    Settings will be loaded here based on your current view.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Divider */}
        <div className="px-4 py-2">
          <div className="border-t border-white/20" />
        </div>
        
        
        {/* Logout */}
        <div className="p-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
        
      </div>
    </div>
  );
};
