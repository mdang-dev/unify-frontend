'use client';

import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores/auth.store';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { streamsQueryApi } from '@/src/apis/streams/query/streams.query.api';
import LiveStream from './_components/live-stream';
import { addToast } from '@heroui/react';
import { useParams } from 'next/navigation';
import { streamsCommandApi } from '@/src/apis/streams/command/streams.command.api';

export default function WatchStream() {
  const router = useRouter();
  const { roomId } = useParams();

  const user = useAuthStore((s) => s.user);
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.STREAM_TOKEN, roomId, user?.id],
    enabled: !!roomId && !!user?.id,
    queryFn: async () => {
      if (!roomId || !user?.id) throw new Error('Missing room or user info');

      const stream = await streamsQueryApi.getStream(roomId);
      const tokenRes = await streamsCommandApi.joinStream(roomId, {
        userId: user?.id,
        username: user?.username,
      });

      return { stream, token: tokenRes.token };
    },
    onError: (err) => {
      addToast({
        color: 'danger',
        title: 'Stream Load Failed',
        description: err?.message || 'Unable to join stream. Please try again.',
      });
    },
  });

  const handleDisconnect = () => {};

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading stream...</div>
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
        <title>{stream.title} - Live Stream</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg className="mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to streams
            </button>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-lg">
            <LiveStream token={token} serverUrl={serverUrl} onDisconnect={handleDisconnect} />

            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{stream.title}</h1>
                  <p className="text-gray-600">{stream.streamerName}</p>
                </div>
                <div
                  className={`rounded px-3 py-1 text-sm font-bold text-white ${
                    stream.status === 'LIVE' ? 'bg-red-500' : 'bg-gray-500'
                  }`}
                >
                  {stream.status}
                </div>
              </div>

              {stream.description && <p className="mb-4 text-gray-700">{stream.description}</p>}

              <div className="text-sm text-gray-500">
                Started: {new Date(stream.startTime).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
