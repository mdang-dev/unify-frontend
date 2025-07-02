import { GridLayout, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import ParticipantTile from './_components/participant-tile';

export default function MyVideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const screenShareTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  const layoutHeight = 'calc(100vh - var(--lk-control-bar-height))';

  if (screenShareTrack) {
    return (
      <div className="flex h-full w-full" style={{ height: layoutHeight }}>
        {/* Large screen share on the left */}
        <div className="flex-1 bg-black">
          <ParticipantTile trackRef={screenShareTrack} />
        </div>

        {/* Small participant cams stacked on right and vertically centered */}
        <div className={`flex w-1/5 flex-col justify-center gap-2 overflow-y-auto bg-gray-900 p-2`}>
          {cameraTracks.map((trackRef, index) => (
            <div
              key={trackRef.publication?.trackSid + index}
              className="aspect-video overflow-hidden rounded"
            >
              <ParticipantTile trackRef={trackRef} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default to Carousel layout when no screen share
  return (
    <GridLayout tracks={cameraTracks} style={{ height: layoutHeight }}>
      <ParticipantTile />
    </GridLayout>
  );
}
