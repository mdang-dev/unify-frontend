import { UserAvatar } from '@/src/components/base';
import VerifiedMark from '../../verified-mark';
import { useRemoteParticipant, useRemoteParticipants } from '@livekit/components-react';
import { UserIcon } from 'lucide-react';
import Actions from './actions';
import { Skeleton } from '@/src/components/ui/skeleton';

export default function Header({
  imageUrl,
  hostName,
  hostIdentity,
  viewerIdentity,
  currentUserId,
  name,
  description,
  isLoading = false,
}) {
  const participants = useRemoteParticipants();
  const participant = useRemoteParticipant(hostIdentity);

  const isLive = !!participant;
  const participantCount = participants.length;

  const hostAsViewer = `host-${hostIdentity}`;
  const isHost = viewerIdentity === hostAsViewer;

  return (
    <div className="flex flex-row items-center justify-between gap-x-4 px-4 py-2">
      <div className="flex items-center gap-x-3">
        <UserAvatar imageUrl={imageUrl} username={hostName} isLive={isLive} showBadge={isLive} />
        <div className="flex flex-col gap-y-0.5">
          <div className="flex items-center gap-x-2">
            <h2 className="text-sm font-semibold text-foreground">{hostName}</h2>
            <VerifiedMark />
          </div>
          
          {isLoading ? (
            <div className="space-y-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2.5 w-40" />
            </div>
          ) : (
            <>
              <h3 className="text-xs font-medium text-foreground/80 leading-tight">
                {name || 'Untitled Stream'}
              </h3>
              {description && (
                <p className="text-xs text-muted-foreground leading-tight max-w-xs line-clamp-1">
                  {description}
                </p>
              )}
            </>
          )}
          
          <div className="flex items-center gap-x-1.5">
            {isLive ? (
              <>
                <div className="flex items-center gap-x-1 text-xs font-medium text-rose-500">
                  <div className="w-1 h-1 bg-rose-500 rounded-full animate-pulse" />
                  <span>LIVE</span>
                </div>
                <span className="text-xs text-muted-foreground">•</span>
                <div className="flex items-center gap-x-1 text-xs text-rose-500">
                  <UserIcon className="h-2.5 w-2.5" />
                  <span>{participantCount}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-x-1 text-xs text-muted-foreground">
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                <span>Offline</span>
              </div>
            )}
          </div>
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
