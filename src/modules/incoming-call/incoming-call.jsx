'use client';

import { useAuthStore } from '@/src/stores/auth.store';
import { useSocket } from '@/src/hooks/use-socket';
import { useRef } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';

const IncomingCall = () => {

  const [callData, setCallData] = useState(null);
  const user = useAuthStore((s) => s.user);
  const { client, connected } = useSocket();
  const audioRef = useRef(null);

  useEffect(() => {
    if (!client || !user?.id) {
      return;
    }

    const checkConnection = () => {
      try {
        if (!client.connected) {
          return false;
        }

        const subscription = client.subscribe(`/topic/call/${user?.id}`, (message) => {
          try {
            const data = JSON.parse(message.body);
            if (
              typeof data === 'object' &&
              data !== null &&
              data.type !== 'accept' &&
              data.type !== 'reject'
            ) {
              setCallData(data);
            }
          } catch (parseError) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error parsing incoming call message:', parseError);
            }z
          }
        });

        const cleanup = () => {
          try {
            subscription?.unsubscribe();
          } catch (unsubscribeError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Error unsubscribing from call topic:', unsubscribeError);
            }
          }
        };

        return cleanup;
      } catch (subscriptionError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error subscribing to call topic:', subscriptionError);
        }
        return false;
      }
    };

    let cleanup = null;
    const pollInterval = setInterval(() => {
      cleanup = checkConnection();
      if (cleanup) {
        clearInterval(pollInterval);
      }
    }, 500);

    const timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
      if (cleanup) {
        cleanup();
      }
    };
  }, [client, user?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (callData && audio) {
      audio.play().catch((e) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Cannot play ringtone:', e);
        }
      });
    } else if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [callData]);

  const handleAccept = () => {
    if (!connected || !client || !user?.id || !callData) {
      return;
    }

    try {
      if (!client.connected) {
        return;
      }

      client.publish({
        destination: '/app/call.accept',
        body: JSON.stringify({
          fromUser: user?.id,
          acceptedFrom: callData?.callerId,
        }),
      });
      setCallData(null);
      window.open(`/call?room=${callData.room}`, '_blank');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error accepting call:', error);
      }
      setCallData(null);
    }
  };

  const handleReject = () => {
    if (!connected || !client || !user?.id) {
      return;
    }

    try {
      if (!client.connected) {
        return;
      }

      client.publish({
        destination: '/app/call.reject',
        body: JSON.stringify({
          room: callData?.room,
          callerId: callData?.callerId,
          calleeId: user?.id,
        }),
      });
      setCallData(null);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error rejecting call:', error);
      }
      setCallData(null);
    }
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
                          src={callData.avatar || '/images/unify_icon_2.png'}
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
