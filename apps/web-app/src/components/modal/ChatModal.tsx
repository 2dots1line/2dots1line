'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  Send, 
  Image, 
  Paperclip, 
  Mic, 
  MicOff,
  Smile,
  MoreVertical
} from 'lucide-react';
import { GlassmorphicPanel, GlassButton, InputField } from '@2dots1line/ui-components';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m here to help you explore your thoughts and experiences. What would you like to talk about today?',
      timestamp: new Date()
    }
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'That\'s an interesting perspective. Can you tell me more about what led you to think about this?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  return (
    <div className="fixed inset-4 z-40 flex items-center justify-center pointer-events-none">
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
            <GlassButton className="p-2 hover:bg-white/20">
              <MoreVertical size={18} className="stroke-current" />
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
                  <p className="text-white/90 text-sm leading-relaxed">
                    {msg.content}
                  </p>
                  <div className="mt-2">
                    <span className="text-xs text-white/50">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
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
              >
                <Image size={18} className="stroke-current" strokeWidth={1.5} />
              </GlassButton>
              <GlassButton
                onClick={handleFileUpload}
                className="p-2 hover:bg-white/20"
                title="Upload file"
              >
                <Paperclip size={18} className="stroke-current" strokeWidth={1.5} />
              </GlassButton>
            </div>

            {/* Message Input */}
            <div className="flex-1">
              <textarea
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
              />
            </div>

            {/* Voice & Send Buttons */}
            <div className="flex gap-2">
              <GlassButton
                onClick={toggleRecording}
                className={`
                  p-2 transition-all duration-200
                  ${isRecording 
                    ? 'bg-red-500/30 hover:bg-red-500/40 text-red-200' 
                    : 'hover:bg-white/20'
                  }
                `}
                title={isRecording ? 'Stop recording' : 'Start voice recording'}
              >
                {isRecording ? (
                  <MicOff size={18} className="stroke-current" strokeWidth={1.5} />
                ) : (
                  <Mic size={18} className="stroke-current" strokeWidth={1.5} />
                )}
              </GlassButton>
              
              <GlassButton
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="
                  p-2 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
                title="Send message"
              >
                <Send size={18} className="stroke-current" strokeWidth={1.5} />
              </GlassButton>
            </div>
          </GlassmorphicPanel>
          
          <p className="text-xs text-white/40 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </GlassmorphicPanel>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => {
          // Handle file upload
          console.log('File selected:', e.target.files?.[0]);
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          // Handle image upload
          console.log('Image selected:', e.target.files?.[0]);
        }}
      />
    </div>
  );
};

export default ChatModal; 