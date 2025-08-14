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
    forceMessageSync, // ✅ NEW: Force sync function
    requestMissedMessages, // ✅ NEW: Request missed messages function
    findLocalDuplicates, // ✅ NEW: Duplicate detection function
    removeLocalDuplicates, // ✅ NEW: Duplicate removal function
  } = useChat(chatPartner, user);

  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, messagesEndRef]);

  // ✅ NEW: Debug panel for message synchronization
  const DebugPanel = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    const duplicateCount = findLocalDuplicates(chatMessages).length;
    
    return (
      <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mb-2 text-xs">
        <div className="flex items-center justify-between">
          <span>🐛 Debug Panel</span>
          <div className="space-x-2">
            <button
              onClick={forceMessageSync}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Force Sync
            </button>
            <button
              onClick={requestMissedMessages}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              Check Missed
            </button>
            {duplicateCount > 0 && (
              <button
                onClick={() => {
                  const cleaned = removeLocalDuplicates(chatMessages);
                  console.log(`🧹 Cleaned up ${duplicateCount} duplicate messages`);
                }}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                Clean Duplicates ({duplicateCount})
              </button>
            )}
          </div>
        </div>
        <div className="mt-1 text-gray-600">
          Messages: {chatMessages.length} | 
          WebSocket: {isConnected ? '✅' : '❌'} | 
          Optimistic: {chatMessages.filter(m => m.isOptimistic).length} |
          Duplicates: {duplicateCount}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <ChatHeader chatPartner={chatPartner} />
      
      {/* ✅ NEW: Debug panel in development */}
      <DebugPanel />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef}>
        {chatMessages.map((message) => (
          <MessageItem
            key={message.id || message.clientTempId}
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