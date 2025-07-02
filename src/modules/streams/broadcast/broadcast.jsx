'use client';

import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BroadcastStream from './_components/broadcast-stream';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { streamsQueryApi } from '@/src/apis/streams/query/streams.query.api';
import { streamsCommandApi } from '@/src/apis/streams/command/streams.command.api';
import { addToast } from '@heroui/react';

export default function Broadcast() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { roomId } = router.query;
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // Start stream mutation
  const startMutation = useMutation({
    mutationFn: (roomId) => streamsCommandApi.startStream(roomId),
    onError: () => {
      addToast({
        color: 'danger',
        title: 'Failed to start stream',
        description: 'An error occurred while trying to start the stream.',
      });
    },
  });

  // End stream mutation
  const endMutation = useMutation({
    mutationFn: (roomId) => streamsCommandApi.endStream(roomId),
    onError: () => {
      addToast({
        color: 'danger',
        title: 'Failed to end stream',
        description: 'An error occurred while trying to end the stream.',
      });
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.BROADCAST_STREAM, roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Missing roomId');

      const stream = await streamsQueryApi.getStream(roomId);
      const tokenRes = await streamsQueryApi.getBroadcastToken(roomId, {
        userId: stream?.streamerId,
        username: stream?.streamerUsername,
      });

      return {
        stream,
        token: tokenRes.token,
      };
    },
    enabled: !!roomId,
    onSuccess: ({ stream }) => {
      if (stream?.roomId) {
        startMutation.mutate(stream.roomId);
      }
    },
    onError: (err) => {
      addToast({
        color: 'danger',
        title: 'Failed to load stream',
        description: err?.message || 'Could not fetch stream information.',
      });
    },
  });

  const handleDisconnect = async () => {
    if (data?.stream?.roomId) {
      await endMutation.mutateAsync(data.stream.roomId);
    }
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BROADCAST_STREAM, roomId] });
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Setting up broadcast...</div>
      </div>
    );
  }

  if (error || !data?.stream) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-red-500">{error?.message || 'Stream not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { stream, token } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Broadcasting: {stream.title}</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4">
            <button
              onClick={handleDisconnect}
              className="flex items-center text-red-600 hover:text-red-800"
            >
              <svg className="mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              End Stream
            </button>
          </div>

          <div className="overflow-hidden rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-6">
              <h1 className="mb-2 text-2xl font-bold">{stream.title}</h1>
              <p className="text-gray-600">Broadcasting as {stream.streamerName}</p>
            </div>

            <BroadcastStream
              token={token}
              serverUrl={serverUrl}
              onDisconnect={handleDisconnect}
              streamData={stream}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
