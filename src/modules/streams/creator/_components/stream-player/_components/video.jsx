import { ConnectionState, Track } from 'livekit-client';

import { useConnectionState, useRemoteParticipant, useTracks } from '@livekit/components-react';
import OfflineVideo from './offline-video';
import LoadingVideo from './loading-video';
import LiveVideo from './live-video';
import { Skeleton } from '@/src/components/base';

export default function Video({ hostName, hostIdentity }) {
  const connectionState = useConnectionState();
  const participant = useRemoteParticipant(hostIdentity);
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]).filter(
    (track) => track.participant.identity === hostIdentity
  );

  console.log('connect', connectionState);

  console.log('par', participant);

  let content;

  if (!participant && connectionState === ConnectionState.Connected) {
    content = <OfflineVideo username={hostName} />;
  } else if (!participant || tracks.length === 0) {
    content = <LoadingVideo />;
  } else {
    content = <LiveVideo participant={participant} />;
  }

  return (
    <div className="group relative aspect-video border-b-[0.5px] border-neutral-700 lg:aspect-auto lg:h-[calc(100vh-100px)]">
      {content}
    </div>
  );
}

export const VideoSkeleton = () => {
  return (
    <div className="aspect-video border-x border-background">
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  );
};
