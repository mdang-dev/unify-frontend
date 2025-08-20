import React, { useRef, useEffect } from 'react';
import { useChat } from '@/src/hooks/use-chat';
import { MessageItem } from './message-item';
import { MessageInput } from './message-input';
import { ChatHeader } from './chat-header';

export const ChatMessages = ({ chatPartner, user }) => {
  const {
    chatMessages,
    sendMessage,
    messagesEndRef,
    isConnected,
  } = useChat(user, chatPartner);

  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, messagesEndRef]);

  // Simple debug panel for development
  const DebugPanel = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mb-2 text-xs">
        <div className="flex items-center justify-between">
          <span>🐛 Debug Panel</span>
        </div>
        <div className="mt-1 text-gray-600">
          Messages: {chatMessages.length} | 
          WebSocket: {isConnected ? '✅' : '❌'}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <ChatHeader chatPartner={chatPartner} />
      
      {/* Debug panel in development */}
      <DebugPanel />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef}>
        {chatMessages.map((message) => (
          <MessageItem
            key={message.id || `temp-${message.timestamp}`}
            message={message}
            isOwnMessage={message.sender === user?.id}
            user={user}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput onSendMessage={sendMessage} />
    </div>
  );
}; 