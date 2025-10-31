import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackgroundVideoSelector } from './BackgroundVideoSelector';
import { useNotificationPreferencesStore } from '../../stores/NotificationPreferencesStore';
import { GlassButton } from '@2dots1line/ui-components';
import { useChatStore } from '../../stores/ChatStore';
import { chatService } from '../../services/chatService';
import { MessageSquare, Search, Plus } from 'lucide-react';

export const ChatSettings: React.FC = () => {
  const { preferences, setEnabled, snoozeFor } = useNotificationPreferencesStore();

  // Compact Session History state and actions (desktop settings integration)
  const {
    sessionHistory,
    setSessionHistory,
    startNewChat,
    setCurrentSession,
    setCurrentConversation,
    setMessages,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load sessions on first open if empty (mirrors mobile behavior)
  useEffect(() => {
    if (sessionHistory.length === 0 && !isLoading) {
      // fire and forget
      void (async () => {
        try {
          setIsLoading(true);
          const sessions = await chatService.getSessions(25);
          setSessionHistory(sessions);
        } catch (err) {
          setError('Failed to load session history');
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [sessionHistory.length, isLoading, setSessionHistory]);

  const filteredSessions = useMemo(() => (
    sessionHistory.filter(session =>
      session.most_recent_conversation_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.conversations && session.conversations.some(conv =>
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    )
  ), [sessionHistory, searchQuery]);

  const loadSessionHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sessions = await chatService.getSessions(25);
      setSessionHistory(sessions);
    } catch (err) {
      setError('Failed to load session history');
    } finally {
      setIsLoading(false);
    }
  }, [setSessionHistory]);

  const handleSessionSelect = useCallback(async (sessionId: string) => {
    try {
      const sessionData = await chatService.getSession(sessionId);
      setCurrentSession(sessionId);

      if (sessionData.conversations && sessionData.conversations.length > 0) {
        const allConversationData = await Promise.all(
          sessionData.conversations.map(conv => chatService.getConversation(conv.id))
        );
        const allMessages = allConversationData
          .flatMap(convData => convData.messages)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const mostRecentConversation = sessionData.conversations[0];
        setCurrentConversation(mostRecentConversation.id);
        setMessages(allMessages);
      } else {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (err) {
      setError('Failed to load session');
    }
  }, [setCurrentSession, setCurrentConversation, setMessages]);

  const handleNewChat = useCallback(() => {
    startNewChat();
  }, [startNewChat]);

  const formatTimestamp = (timestamp: Date | string) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Session History (desktop settings) - moved to top (no top divider) */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-brand text-white/90">Session History</span>
          <GlassButton onClick={handleNewChat} size="sm" className="px-2 py-1">
            <Plus size={12} className="mr-1" /> New Chat
          </GlassButton>
        </div>

        {/* Search + Load */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-7 py-1.5 text-white placeholder-white/50 text-xs focus:outline-none focus:border-white/40"
            />
          </div>
          <GlassButton onClick={loadSessionHistory} size="sm" disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Refresh'}
          </GlassButton>
        </div>

        {error && (
          <div className="mb-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-1 max-h-56 overflow-y-auto">
          {isLoading && sessionHistory.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-6 text-white/50 text-xs">
              {searchQuery ? 'No sessions found' : 'No sessions yet'}
            </div>
          ) : (
            filteredSessions.slice(0, 10).map((session) => (
              <GlassButton
                key={session.session_id}
                onClick={() => handleSessionSelect(session.session_id)}
                className="w-full justify-start text-left px-3 py-2 text-xs hover:bg-white/10"
              >
                <div className="truncate font-medium text-white/90">
                  {session.most_recent_conversation_title || 'New Chat'}
                </div>
                <div className="text-white/60 truncate">
                  {(session.conversations && session.conversations[0]?.lastMessage)
                    ? session.conversations[0].lastMessage
                    : `${formatTimestamp(session.last_active_at)} • ${session.conversation_count} conversations`}
                </div>
              </GlassButton>
            ))
          )}
        </div>
      </div>

      {/* Divider between Session History and Background Video */}
      <div className="border-t border-white/20" />

      {/* Background video */}
      <BackgroundVideoSelector view="chat" />

      {/* Notifications */}
      <div className="pt-3 border-t border-white/20">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-brand text-white/90">Enable notifications</span>
            <button
              onClick={() => setEnabled(!preferences.enabled)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                preferences.enabled ? 'bg-blue-600' : 'bg-white/20'
              }`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                preferences.enabled ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div>
            <button
              onClick={() => snoozeFor(30)}
              className="text-sm font-brand text-white/60 hover:text-white/90 transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
            >
              Snooze 30 min
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

