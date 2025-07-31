'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

export default function TestVideoParticipant({ participant }) {
  const { name, avatar, isSpeaking, isMuted, isVideoOff, isLocal } = participant;

  if (isVideoOff) {
    return (
      <div className="relative h-full w-full bg-gradient-to-br from-gray-700 to-gray-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-300">
            <div className="mb-2 text-4xl">📹</div>
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-gray-400">Camera Off</p>
          </div>
        </div>
        
        {/* Participant name overlay */}
        <div className="absolute bottom-2 left-2 rounded-lg bg-black/50 px-2 py-1 text-xs text-white">
          {name}
        </div>

        {/* Muted indicator */}
        {isMuted && (
          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500">
            <i className="fa-solid fa-microphone-slash text-xs text-white"></i>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-gray-600 to-gray-700">
      {/* Mock video background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 opacity-20"></div>
      
      {/* Mock video pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
      </div>

      {/* Participant avatar overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <img
            src={avatar}
            alt={name}
            className="mx-auto h-16 w-16 rounded-full object-cover border-4 border-white/20"
          />
          <p className="mt-2 text-white font-medium">{name}</p>
        </div>
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 animate-pulse">
          <div className="h-2 w-2 rounded-full bg-white"></div>
        </div>
      )}

      {/* Muted indicator */}
      {isMuted && (
        <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500">
          <i className="fa-solid fa-microphone-slash text-xs text-white"></i>
        </div>
      )}

      {/* Local participant indicator */}
      {isLocal && (
        <div className="absolute bottom-2 right-2 rounded-lg bg-blue-500 px-2 py-1 text-xs text-white">
          You
        </div>
      )}

      {/* Participant name overlay */}
      <div className="absolute bottom-2 left-2 rounded-lg bg-black/50 px-2 py-1 text-xs text-white">
        {name}
      </div>
    </div>
  );
} 