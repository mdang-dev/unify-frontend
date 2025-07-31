'use client';

import React from 'react';
import { Track } from 'livekit-client';
import { cn } from '@/src/lib/utils';

export default function VideoParticipant({ 
  trackRef, 
  isScreenShare = false, 
  className = "",
  participant 
}) {
  if (!trackRef) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-800 text-gray-400",
        className
      )}>
        <div className="text-center">
          <div className="mb-2 text-4xl">
            {isScreenShare ? '🖥️' : '👤'}
          </div>
          <p className="text-sm">
            {isScreenShare ? 'No screen share' : 'No video'}
          </p>
        </div>
      </div>
    );
  }

  const isVideoTrack = trackRef.source === Track.Source.Camera;
  const isScreenShareTrack = trackRef.source === Track.Source.ScreenShare;

  return (
    <div className={cn("relative", className)}>
      {/* Video Element */}
      <video
        ref={(el) => {
          if (el && trackRef.publication?.track) {
            trackRef.publication.track.attach(el);
          }
        }}
        className={cn(
          "h-full w-full object-cover",
          isScreenShare && "object-contain"
        )}
        autoPlay
        playsInline
        muted={trackRef.publication?.isLocal}
      />

      {/* Overlay for participant info */}
      {participant && (
        <div className="absolute bottom-2 left-2 rounded-lg bg-black/50 px-2 py-1 text-xs text-white">
          {participant.name || 'Unknown'}
        </div>
      )}

      {/* Audio indicator */}
      {trackRef.publication?.track?.kind === 'audio' && (
        <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
          <div className="h-2 w-2 rounded-full bg-white"></div>
        </div>
      )}

      {/* Screen share indicator */}
      {isScreenShareTrack && (
        <div className="absolute top-2 left-2 rounded-lg bg-blue-500 px-2 py-1 text-xs text-white">
          🖥️ Screen Share
        </div>
      )}

      {/* Video off indicator */}
      {isVideoTrack && !trackRef.publication?.track && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-gray-400">
            <div className="mb-2 text-4xl">📹</div>
            <p className="text-sm">Camera Off</p>
          </div>
        </div>
      )}
    </div>
  );
} 