'use client';

import { useEffect, useRef, useState } from 'react';
import { useWebSocket } from '@/src/hooks/use-websocket';
import { useAuthStore } from '@/src/stores/auth.store';

const IncomingCall = () => {
  const [callData, setCallData] = useState(null);
  const user = useAuthStore((s) => s.user);
  const { client, connected } = useWebSocket(user?.id ?? '');
  const audioRef = useRef(null);

  useEffect(() => {
    if (!connected || !client) return;

    const subscription = client.subscribe(`/topic/call/${user?.id}`, (message) => {
      const data = JSON.parse(message.body);
      if (
        typeof data === 'object' &&
        data !== null &&
        data.type !== 'accept' &&
        data.type !== 'reject'
      ) {
        setCallData(data);
      }
    });

    return () => subscription?.unsubscribe();
  }, [connected, client, user?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (callData && audio) {
      audio.play().catch((e) => console.warn('Cannot play ringtone:', e));
    } else if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [callData]);

  const handleAccept = () => {
    if (!connected || !client || !user) return;
    if (callData) {
      client.publish({
        destination: '/app/call.accept',
        body: JSON.stringify({
          fromUser: user?.id,
          acceptedFrom: callData?.callerId,
        }),
      });
      setCallData(null);
      window.open(`/call?room=${callData.room}`, '_blank');
    }
  };

  const handleReject = () => {
    if (!connected || !client || !user) return;
    client.publish({
      destination: '/app/call.reject',
      body: JSON.stringify({
        room: callData?.room,
        callerId: callData?.callerId,
        calleeId: user?.id,
      }),
    });
    setCallData(null);
  };

  if (!callData) return null;

  return (
    <>
      <audio ref={audioRef} src="/sounds/ring.mp3" loop preload="auto" />

      <div className="animate-fade-in-up fixed bottom-4 right-4 z-50 flex w-[320px] items-center space-x-4 rounded-xl bg-[#1e1e2f] p-4 shadow-xl ring-1 ring-[#2b65ae]">
        {/* Avatar with pulsing ring */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full border-4 border-[#2b65ae] opacity-40" />
          <img
            src={callData.callerAvatar || '/images/default-avatar.png'}
            alt="Caller Avatar"
            className="relative z-10 h-16 w-16 rounded-full border-4 border-[#2b65ae] object-cover"
          />
        </div>

        {/* Caller Info + Buttons */}
        <div className="flex flex-1 flex-col">
          <p className="text-sm text-gray-400">Incoming call from</p>
          <h2 className="text-lg font-semibold text-white">{callData.callerName || 'Unknown'}</h2>
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleReject}
              className="flex-1 rounded-full bg-red-600 px-4 py-1 text-white transition hover:bg-red-700"
            >
              Reject
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 rounded-full bg-[#2b65ae] px-4 py-1 text-white transition hover:bg-[#245a99]"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default IncomingCall;
