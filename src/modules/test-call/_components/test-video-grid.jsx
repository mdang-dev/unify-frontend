'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';
import TestVideoParticipant from './test-video-participant';

export default function TestVideoGrid({ participants, isScreenSharing }) {
  const visibleParticipants = participants.filter(p => !p.isVideoOff);

  if (isScreenSharing) {
    return (
      <div className="flex h-full w-full gap-4">
        {/* Large screen share */}
        <div className="flex-1 rounded-xl overflow-hidden bg-black shadow-2xl">
          <div className="relative h-full w-full bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="mb-4 text-6xl">🖥️</div>
                <h3 className="text-xl font-semibold mb-2">Screen Share</h3>
                <p className="text-gray-300">John Doe is sharing their screen</p>
              </div>
            </div>
            {/* Screen share indicator */}
            <div className="absolute top-4 left-4 rounded-lg bg-blue-500 px-3 py-1 text-sm text-white">
              🖥️ Screen Sharing
            </div>
          </div>
        </div>

        {/* Participant thumbnails */}
        <div className="w-64 space-y-2">
          {visibleParticipants.map((participant) => (
            <div
              key={participant.id}
              className="aspect-video rounded-lg overflow-hidden bg-gray-800 shadow-lg"
            >
              <TestVideoParticipant participant={participant} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default grid layout
  const gridCols = visibleParticipants.length <= 2 ? 'grid-cols-1' : 
                   visibleParticipants.length <= 4 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className={cn(
      "grid h-full w-full gap-4",
      gridCols,
      "md:grid-cols-2 lg:grid-cols-3"
    )}>
      {visibleParticipants.map((participant) => (
        <div
          key={participant.id}
          className="aspect-video rounded-xl overflow-hidden bg-gray-800 shadow-xl"
        >
          <TestVideoParticipant participant={participant} />
        </div>
      ))}
    </div>
  );
} 