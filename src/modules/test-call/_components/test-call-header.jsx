'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

export default function TestCallHeader({ participants, isScreenSharing, callDuration }) {
  const activeParticipants = participants.filter(p => !p.isVideoOff);
  const mutedParticipants = participants.filter(p => p.isMuted);

  return (
    <div className="flex items-center justify-between bg-black/20 backdrop-blur-lg p-4">
      {/* Call Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-white font-medium">
            {isScreenSharing ? 'Screen Sharing' : 'Video Call'}
          </span>
        </div>
        
        <div className="text-gray-300 text-sm">
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
          {mutedParticipants.length > 0 && (
            <span className="ml-2 text-yellow-400">
              • {mutedParticipants.length} muted
            </span>
          )}
        </div>
      </div>

      {/* Participants */}
      <div className="flex items-center gap-2">
        {participants.slice(0, 3).map((participant) => (
          <div
            key={participant.id}
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1",
              participant.isLocal 
                ? "bg-blue-500/20 border border-blue-400/30" 
                : "bg-white/10"
            )}
          >
            <div className="relative">
              <img
                src={participant.avatar}
                alt={participant.name}
                className="h-6 w-6 rounded-full object-cover"
              />
              {participant.isSpeaking && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
              )}
              {participant.isMuted && (
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500">
                  <i className="fa-solid fa-microphone-slash text-xs text-white"></i>
                </div>
              )}
            </div>
            <span className="text-white text-sm">{participant.name}</span>
          </div>
        ))}
        
        {participants.length > 3 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white text-xs">
            +{participants.length - 3}
          </div>
        )}
      </div>

      {/* Call Duration */}
      <div className="text-white text-sm">
        <i className="fa-solid fa-clock mr-1"></i>
        <span>{callDuration}</span>
      </div>
    </div>
  );
} 