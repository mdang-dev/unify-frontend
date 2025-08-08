'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

export default function CallHeader({ participants, isScreenSharing }) {
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
        </div>
      </div>

      {/* Participants */}
      <div className="flex items-center gap-2">
        {participants.slice(0, 3).map((participant, index) => (
          <div
            key={participant.id}
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1"
          >
            <img
              src={participant.avatar || '/images/unify_icon_2.png'}
              alt={participant.name}
              className="h-6 w-6 rounded-full object-cover"
            />
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
        <span>00:00</span>
      </div>
    </div>
  );
} 