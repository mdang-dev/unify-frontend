import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, LocalVideoTrack, LocalAudioTrack } from 'livekit-client';

export default function BroadcastStream({ token, serverUrl, onDisconnect, streamData }) {
  const videoRef = useRef();
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !serverUrl) return;

    const connectToRoom = async () => {
      try {
        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        newRoom.on(RoomEvent.Connected, () => {
          setIsConnected(true);
          console.log('Connected to room as broadcaster');
        });

        newRoom.on(RoomEvent.Disconnected, () => {
          setIsConnected(false);
          setIsStreaming(false);
          if (onDisconnect) onDisconnect();
        });

        newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
          setParticipants((prev) => [...prev, participant]);
        });

        newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
          setParticipants((prev) => prev.filter((p) => p.identity !== participant.identity));
        });

        await newRoom.connect(serverUrl, token);
        setRoom(newRoom);
      } catch (err) {
        console.error('Failed to connect to room:', err);
        setError('Failed to connect to broadcast room');
      }
    };

    connectToRoom();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [token, serverUrl, onDisconnect]);

  const startBroadcast = async () => {
    if (!room) return;

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Create local tracks
      const videoTrack = new LocalVideoTrack(stream.getVideoTracks()[0]);
      const audioTrack = new LocalAudioTrack(stream.getAudioTracks()[0]);

      // Attach video to preview
      const videoElement = videoTrack.attach();
      if (videoRef.current) {
        videoRef.current.innerHTML = '';
        videoRef.current.appendChild(videoElement);
      }

      // Publish tracks
      await room.localParticipant.publishTrack(videoTrack);
      await room.localParticipant.publishTrack(audioTrack);

      setIsStreaming(true);
    } catch (err) {
      console.error('Failed to start broadcast:', err);
      setError('Failed to access camera and microphone');
    }
  };

  const stopBroadcast = async () => {
    if (!room) return;

    try {
      // Unpublish all tracks
      room.localParticipant.videoTracks.forEach((publication) => {
        room.localParticipant.unpublishTrack(publication.track);
      });

      room.localParticipant.audioTracks.forEach((publication) => {
        room.localParticipant.unpublishTrack(publication.track);
      });

      setIsStreaming(false);
    } catch (err) {
      console.error('Failed to stop broadcast:', err);
    }
  };

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-gray-100">
        <div className="text-center">
          <p className="mb-2 text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div ref={videoRef} className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white">Connecting...</div>
            </div>
          )}
          {isConnected && !isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white">Ready to broadcast</div>
            </div>
          )}
        </div>

        {isStreaming && (
          <div className="absolute left-4 top-4 flex items-center rounded bg-red-500 px-3 py-1 text-white">
            <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-white"></div>
            LIVE
          </div>
        )}

        {isConnected && (
          <div className="absolute bottom-4 left-4 rounded bg-black bg-opacity-50 px-3 py-1 text-white">
            {participants.length} viewers
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-4">
        {!isStreaming ? (
          <button
            onClick={startBroadcast}
            disabled={!isConnected}
            className="rounded-md bg-red-600 px-6 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Start Broadcast
          </button>
        ) : (
          <button
            onClick={stopBroadcast}
            className="rounded-md bg-gray-600 px-6 py-2 text-white hover:bg-gray-700"
          >
            Stop Broadcast
          </button>
        )}
      </div>

      {streamData && (
        <div className="rounded-lg bg-gray-100 p-4">
          <h3 className="mb-2 font-semibold">RTMP Settings (for OBS/XSplit)</h3>
          <div className="space-y-2 text-sm">
            <div>
              <label className="font-medium">Server URL:</label>
              <div className="break-all rounded border bg-white p-2 font-mono text-xs">
                {streamData.rtmpUrl}
              </div>
            </div>
            <div>
              <label className="font-medium">Stream Key:</label>
              <div className="break-all rounded border bg-white p-2 font-mono text-xs">
                {streamData.rtmpKey}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
