'use client';

import { userQueryApi } from '@/src/apis/user/query/user.query.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { useAuthStore } from '@/src/stores/auth.store';
import { useQuery } from '@tanstack/react-query';
import StreamPlayer from './_components/stream-player';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/src/components/base';
import { streamsQueryApi } from '@/src/apis/streams/query/streams.query.api';

export default function Creator() {
  const { username } = useParams();
  const externalUser = useAuthStore((s) => s.user);
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: [QUERY_KEYS.STREAM_BY_USERNAME, username],
    queryFn: () => userQueryApi.getInfoWithStreamByUsername(username),
    enabled: !!username,
  });

  console.log(user);



  return (
    <div className="h-full">
      <StreamPlayer 
        externalUser={externalUser} 
        user={user} 
        stream={user?.stream} 
        currentUserId={externalUser?.id}
      />
    </div>
  );
}
