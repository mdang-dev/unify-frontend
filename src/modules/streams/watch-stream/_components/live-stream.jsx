import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';

export default function LiveStream({ token, serverUrl, onDisconnect }) {
  const videoRef = useRef();
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
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
          console.log('Connected to room');
        });

        newRoom.on(RoomEvent.Disconnected, () => {
          setIsConnected(false);
          if (onDisconnect) onDisconnect();
        });

        newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === Track.Kind.Video) {
            const element = track.attach();
            if (track.kind === Track.Kind.Video) {
              videoRef.current.innerHTML = '';
              const element = track.attach();
              videoRef.current.appendChild(element);
            }
          }
        });

        newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
          setParticipants((prev) => [...prev, participant]);
        });

        newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
          setParticipants((prev) => prev.filter((p) => p.identity !== participant.identity));
        });

        newRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          if (track.kind === Track.Kind.Video) {
            track.detach().forEach((el) => el.remove());
          }
        });

        await newRoom.connect(serverUrl, token);
        setRoom(newRoom);
      } catch (err) {
        console.error('Failed to connect to room:', err);
        setError('Failed to connect to stream');
      }
    };

    connectToRoom();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [token, serverUrl, onDisconnect]);

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
    <div className="relative">
      <div ref={videoRef} className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white">Connecting to stream...</div>
          </div>
        )}
      </div>

      {isConnected && (
        <div className="absolute bottom-4 left-4 rounded bg-black bg-opacity-50 px-3 py-1 text-white">
          {participants.length} viewers
        </div>
      )}
    </div>
  );
}
