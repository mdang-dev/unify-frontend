'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

export default function TestCallControls({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isChatOpen,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onToggleFullscreen,
  onEndCall
}) {
  return (
    <div className="flex items-center justify-center bg-black/20 backdrop-blur-lg p-4">
      <div className="flex items-center gap-4 rounded-full bg-white/10 px-6 py-3 backdrop-blur-lg">
        
        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 hover:scale-105",
            isMuted 
              ? "bg-red-500 hover:bg-red-600 shadow-lg" 
              : "bg-gray-600 hover:bg-gray-700"
          )}
          title={isMuted ? "Unmute" : "Mute"}
        >
          <i className={cn(
            "text-white text-lg",
            isMuted ? "fa-solid fa-microphone-slash" : "fa-solid fa-microphone"
          )}></i>
        </button>

        {/* Video Toggle Button */}
        <button
          onClick={onToggleVideo}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 hover:scale-105",
            isVideoOff 
              ? "bg-red-500 hover:bg-red-600 shadow-lg" 
              : "bg-gray-600 hover:bg-gray-700"
          )}
          title={isVideoOff ? "Turn on camera" : "Turn off camera"}
        >
          <i className={cn(
            "text-white text-lg",
            isVideoOff ? "fa-solid fa-video-slash" : "fa-solid fa-video"
          )}></i>
        </button>

        {/* Screen Share Button */}
        <button
          onClick={onToggleScreenShare}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 hover:scale-105",
            isScreenSharing 
              ? "bg-blue-500 hover:bg-blue-600 shadow-lg" 
              : "bg-gray-600 hover:bg-gray-700"
          )}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          <i className="fa-solid fa-desktop text-white text-lg"></i>
        </button>

        {/* Chat Toggle Button */}
        <button
          onClick={onToggleChat}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 hover:scale-105",
            isChatOpen 
              ? "bg-blue-500 hover:bg-blue-600 shadow-lg" 
              : "bg-gray-600 hover:bg-gray-700"
          )}
          title={isChatOpen ? "Close chat" : "Open chat"}
        >
          <i className="fa-solid fa-comments text-white text-lg"></i>
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-600 hover:bg-gray-700 transition-all duration-200 hover:scale-105"
          title="Toggle fullscreen"
        >
          <i className="fa-solid fa-expand text-white text-lg"></i>
        </button>

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 hover:scale-105 shadow-lg"
          title="End call"
        >
          <i className="fa-solid fa-phone-slash text-white text-lg"></i>
        </button>
      </div>

      {/* Status Indicators */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-sm">
        {isMuted && (
          <div className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-1 animate-pulse">
            <i className="fa-solid fa-microphone-slash text-xs"></i>
            <span>Muted</span>
          </div>
        )}
        {isVideoOff && (
          <div className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-1 animate-pulse">
            <i className="fa-solid fa-video-slash text-xs"></i>
            <span>Video Off</span>
          </div>
        )}
        {isScreenSharing && (
          <div className="flex items-center gap-1 rounded-full bg-blue-500 px-2 py-1 animate-pulse">
            <i className="fa-solid fa-desktop text-xs"></i>
            <span>Screen Sharing</span>
          </div>
        )}
      </div>

      {/* Call Quality Indicator */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-white text-sm">
        <div className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-1">
          <i className="fa-solid fa-signal text-xs"></i>
          <span>Good</span>
        </div>
      </div>
    </div>
  );
} 