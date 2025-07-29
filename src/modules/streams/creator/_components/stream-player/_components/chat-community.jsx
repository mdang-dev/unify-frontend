import { Input } from '@/src/components/ui/input';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { useRemoteParticipants, useLocalParticipant } from '@livekit/components-react';
import CommunityItem from './community-item';
import { useState } from 'react';
import { useDebounce } from '@/src/hooks/use-debounce';
import { useMemo } from 'react';

export default function ChatCommunity({ hostName, viewerName, isHidden }) {
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, 500);
  const remoteParticipants = useRemoteParticipants();
  const { localParticipant } = useLocalParticipant();

  const allParticipants = useMemo(
    () => [localParticipant, ...remoteParticipants],
    [localParticipant, remoteParticipants]
  );

  const onChange = (newValue) => {
    setValue(newValue);
  };

  const filteredParticipants = useMemo(() => {
    const deduped = allParticipants.reduce((acc, participant) => {
      const hostAsViewer = `host-${participant.identity}`;
      if (!acc.some((p) => p.identity === hostAsViewer)) {
        acc.push(participant);
      }
      return acc;
    }, []);

    return deduped.filter((participant) => {
      return participant.name?.toLowerCase().includes(debouncedValue.toLowerCase());
    });
  }, [allParticipants, debouncedValue]);

  if (isHidden) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p>Community is disabled</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Input
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search community"
        className="border-white/10"
      />
      <ScrollArea className="mt-4 gap-y-2">
        {filteredParticipants.length === 0 ? (
          <p className="p-2 text-center text-sm text-muted-foreground">No result</p>
        ) : (
          filteredParticipants.map((participant) => (
            <CommunityItem
              key={participant.identity}
              hostName={hostName}
              viewerName={viewerName}
              participantName={participant.name}
              participantIdentity={participant.identity}
              participantMetadata={participant.metadata}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
}
