'use client';

import React, { useState, useEffect } from 'react';
import { useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { cn } from '@/src/lib/utils';
import VideoParticipant from './_components/video-participant';
import CallControls from './_components/call-controls';
import CallHeader from './_components/call-header';
import CallChat from './_components/call-chat';

export default function VideoCallUI() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const screenShareTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  useEffect(() => {
    if (screenShareTrack) {
      setIsScreenSharing(true);
    } else {
      setIsScreenSharing(false);
    }
  }, [screenShareTrack]);

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  const handleToggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
  };

  return (
    <div className={cn(
      "flex h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Main Video Area */}
      <div className={cn(
        "flex flex-1 flex-col",
        isChatOpen && "w-3/4"
      )}>
        {/* Header */}
        <CallHeader 
          participants={participants}
          isScreenSharing={isScreenSharing}
        />

        {/* Video Grid */}
        <div className="flex-1 p-4">
          {isScreenSharing ? (
            <div className="flex h-full w-full gap-4">
              {/* Large screen share */}
              <div className="flex-1 rounded-xl overflow-hidden bg-black shadow-2xl">
                <VideoParticipant 
                  trackRef={screenShareTrack}
                  isScreenShare={true}
                  className="h-full w-full"
                />
              </div>

              {/* Participant thumbnails */}
              <div className="w-64 space-y-2">
                {cameraTracks.map((trackRef, index) => (
                  <div
                    key={trackRef.publication?.trackSid + index}
                    className="aspect-video rounded-lg overflow-hidden bg-gray-800 shadow-lg"
                  >
                    <VideoParticipant 
                      trackRef={trackRef}
                      isScreenShare={false}
                      className="h-full w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid h-full w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cameraTracks.map((trackRef, index) => (
                <div
                  key={trackRef.publication?.trackSid + index}
                  className="aspect-video rounded-xl overflow-hidden bg-gray-800 shadow-xl"
                >
                  <VideoParticipant 
                    trackRef={trackRef}
                    isScreenShare={false}
                    className="h-full w-full"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <CallControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          isChatOpen={isChatOpen}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleChat={handleToggleChat}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </div>

      {/* Chat Sidebar */}
      {isChatOpen && (
        <CallChat 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
} 