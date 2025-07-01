import { toast } from 'sonner';
import { useTransition } from 'react';
import { MinusCircle } from 'lucide-react';
import { Hint } from '@/src/components/base';
import { cn, stringToColor } from '@/src/lib/utils';
import { ButtonCommon } from '@/src/components/button';

export default function CommunityItem({
  hostName,
  viewerName,
  participantIdentity,
  participantName,
  participantMetadata,
}) {
  const color = stringToColor(participantName || '');
  const isSelf = participantName === viewerName;
  const isHost = viewerName === hostName;
  const { avatar: viewerAvatar } = JSON.parse(participantMetadata || '{}');

  const handleBlock = () => {
    if (!participantName || isSelf || !isHost) {
    }
  };

  return (
    <div
      className={cn(
        'group flex w-full items-center justify-between rounded-md p-2 text-sm hover:bg-white/5'
      )}
    >
      <div className="flex items-center space-x-2">
        {viewerAvatar ? (
          <img src={viewerAvatar} alt="Avatar" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {participantName?.charAt(0).toUpperCase()}
          </div>
        )}
        <p style={{ color: color }}>{participantName}</p>
      </div>

      {isHost && !isSelf && (
        <Hint label="Block" asChild>
          <ButtonCommon
            onClick={handleBlock}
            className="h-auto w-auto p-1 opacity-0 transition group-hover:opacity-100"
          >
            <MinusCircle className="h-4 w-4 text-muted-foreground" />
          </ButtonCommon>
        </Hint>
      )}
    </div>
  );
}
