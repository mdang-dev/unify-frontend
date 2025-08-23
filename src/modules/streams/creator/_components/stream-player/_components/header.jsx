import { UserAvatar } from '@/src/components/base';
import VerifiedMark from '../../verified-mark';
import { useRemoteParticipant, useRemoteParticipants } from '@livekit/components-react';
import { UserIcon } from 'lucide-react';
import Actions from './actions';

export default function Header({
  imageUrl,
  hostName,
  hostIdentity,
  viewerIdentity,
  currentUserId,
  name,
}) {
  const participants = useRemoteParticipants();
  const participant = useRemoteParticipant(hostIdentity);

  const isLive = !!participant;
  const participantCount = participants.length;

  const hostAsViewer = `host-${hostIdentity}`;
  const isHost = viewerIdentity === hostAsViewer;

  return (
    <div className="flex flex-row items-start justify-between gap-y-4 px-4 pt-4 lg:flex-grow lg:gap-y-0">
      <div className="flex items-center gap-x-3">
        <UserAvatar imageUrl={imageUrl} username={hostName} isLive={isLive} showBadge={isLive} />
        <div className="space-x-1">
          <div className="flex items-center gap-x-2">
            <h2 className="text-lg font-semibold">{hostName}</h2>
            <VerifiedMark />
          </div>
          <p className="text-sm font-semibold">{name}</p>
          {isLive ? (
            <div className="flex items-center gap-x-1 text-xs font-semibold text-rose-500">
              <UserIcon className="h-4 w-4" />
              <p>
                {participantCount} {participantCount === 1 ? 'Viewer' : 'Viewers'}
              </p>
            </div>
          ) : (
            <div className="text-xs font-semibold text-muted-foreground">Offline</div>
          )}
        </div>
      </div>
      <Actions 
        hostIdentity={hostIdentity} 
        currentUserId={currentUserId}
        isHost={isHost} 
      />
    </div>
  );
}
