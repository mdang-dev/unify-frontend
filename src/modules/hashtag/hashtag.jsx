'use client';

import Picture from '@/src/components/base/explore-picture';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { useQuery } from '@tanstack/react-query';

const Hashtag = ({ hashtag }) => {
  const { data: posts } = useQuery({
    queryKey: [QUERY_KEYS.POSTS_BY_HASHTAG],
    queryFn: () => postsQueryApi.getPostsByHashtag(hashtag),
    enabled: !!hashtag,
  });

  return (
    <div className={'mb-5 mt-8 flex h-auto w-full flex-wrap justify-center'}>
      <div className={'grid grid-cols-4 gap-2'}>
        {posts?.map((post) => {
          return <Picture key={post.id} post={post} url={post?.media[0].url} />;
        })}
      </div>
    </div>
  );
};

export default Hashtag;
