'use client';

import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores/auth.store';
import { callQueryApi } from '@/src/apis/call/query/call.query.api';
import { callCommandApi } from '@/src/apis/call/command/call.command.api';
import { useRef } from 'react';
import { useSocket } from '@/src/hooks/use-socket';
import { addToast } from '@heroui/react';
import { useEffect } from 'react';
import MyVideoConference from './_components/my-video-conference';
import ControlBar from './_components/control-bar';
import { useState } from 'react';

export default function Call() {
  const user = useAuthStore((s) => s.user);
  const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const room = qs?.get('room');
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const code = `${room}-${user?.id}`;
  // Use simplified call socket hook
  const { client, connected } = useSocket(user?.id ?? '');
  const hasLeftRef = useRef(false);
  const timeoutRef = useRef(null);
  const [connecting, setConnecting] = useState(true);
  const [onMounted, setOnMounted] = useState(false);

  useEffect(() => {
    setOnMounted(true);
  }, []);

  const { mutate: leaveCall } = useMutation({
    mutationFn: (code) => callCommandApi.leaveCall(code),
  });

  const { data } = useQuery({
    queryKey: ['TOKEN_CALL', code],
    queryFn: () => callQueryApi.getToken(code),
    enabled: !!room && !!user?.id,
  });

  useEffect(() => {
    if (!connected || !client) return;

    timeoutRef.current = setTimeout(() => {
      addToast({
        color: 'warning',
        title: 'Call Missed',
        description: 'User did not answer the call.',
        timeout: 3000,
      });
      handleLeaveCall();
    }, 60000);

    const subscription = client.subscribe(`/topic/call/${user?.id}`, (message) => {
      const data = JSON.parse(message.body);
      if (data?.type === 'reject') {
        addToast({
          color: 'warning',
          title: 'Call Rejected',
          description: 'The user declined your call.',
          timeout: 3000,
        });

        setTimeout(() => window.close(), 3000);
      }
      if (data?.type === 'accept') {
        clearTimeout(timeoutRef.current);
        setConnecting(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
      clearTimeout(timeoutRef.current);
    };
  }, [connected, client, user?.id]);

  const handleLeaveCall = () => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;
    leaveCall(code);
    window.close();
  };

  if (!onMounted) return null;

  if (!data?.token || !serverUrl) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center space-y-6">
          {/* Spinner */}
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

          {/* Text */}
          <p className="text-lg font-medium tracking-wide text-blue-200">Preparing your call...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {connecting && data?.isCaller && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-4 rounded-xl bg-white/10 px-6 py-4 text-white shadow-xl ring-1 ring-white/20 backdrop-blur-lg">
          <div className="relative h-12 w-12">
            <img
              src={data?.calleeAvatar ?? '/images/unify_icon_2.png'}
              alt="User Avatar"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
            />
            <span className="absolute -right-1 bottom-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">
              Calling {data?.calleeName ?? 'User'}...
            </span>
            <span className="text-xs text-gray-200">Waiting for user to join</span>
          </div>
        </div>
      )}

      <LiveKitRoom
        token={data?.token}
        serverUrl={serverUrl}
        connect
        audio
        video={data?.video}
        className="flex h-screen flex-col bg-gray-900 text-white"
        data-lk-theme="default"
        onDisconnected={handleLeaveCall}
      >
        <MyVideoConference />
        <RoomAudioRenderer />
        <ControlBar />
      </LiveKitRoom>
    </>
  );
}
