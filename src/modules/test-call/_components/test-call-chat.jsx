'use client';

import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';


export default function TestCallChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'John Doe',
      message: 'Hey everyone! 👋',
      timestamp: '10:30 AM',
      isLocal: false,
      avatar: '/images/avatar.png'
    },
    {
      id: 2,
      sender: 'You',
      message: 'Hi John! How are you?',
      timestamp: '10:31 AM',
      isLocal: true,
      avatar: '/images/avatar.png'
    },
    {
      id: 3,
      sender: 'Jane Smith',
      message: 'Great to see everyone here! 😊',
      timestamp: '10:32 AM',
      isLocal: false,
      avatar: '/images/avatar.png'
    },
    {
      id: 4,
      sender: 'Mike Johnson',
      message: 'Can everyone hear me okay?',
      timestamp: '10:33 AM',
      isLocal: false,
      avatar: '/images/avatar.png'
    },
    {
      id: 5,
      sender: 'You',
      message: 'Yes, I can hear you clearly!',
      timestamp: '10:34 AM',
      isLocal: true,
      avatar: '/images/avatar.png'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: 'You',
      message: newMessage,
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isLocal: true,
      avatar: '/images/avatar.png'
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="w-1/4 bg-white/10 backdrop-blur-lg border-l border-white/20">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold">Chat</h3>
          <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <i className="fa-solid fa-times text-lg"></i>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 max-h-96 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2",
              message.isLocal ? "justify-end" : "justify-start"
            )}
          >
            {!message.isLocal && (
              <img
                src={message.avatar}
                alt={message.sender}
                className="h-6 w-6 rounded-full object-cover"
              />
            )}
            <div
              className={cn(
                "max-w-xs rounded-lg px-3 py-2",
                message.isLocal
                  ? "bg-blue-500 text-white"
                  : "bg-white/20 text-white"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">
                  {message.sender}
                </span>
                <span className="text-xs opacity-70">
                  {message.timestamp}
                </span>
              </div>
              <p className="text-sm">{message.message}</p>
            </div>
            {message.isLocal && (
              <img
                src={message.avatar}
                alt={message.sender}
                className="h-6 w-6 rounded-full object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-white/20">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg bg-white/20 text-white placeholder-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </form>
      </div>
    </div>
  );
} 