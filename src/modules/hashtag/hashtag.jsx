'use client';

import { useTranslations } from 'next-intl';
import Picture from '@/src/components/base/explore-picture';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

const Hashtag = () => {
  const t = useTranslations('Explore.Hashtag');
  const { hashtag } = useParams();

  const { data: posts, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.POSTS_BY_HASHTAG],
    queryFn: () => postsQueryApi.getPostsByHashtag(hashtag),
    enabled: !!hashtag,
  });

  if (isLoading) {
    return (
      <div className="mb-5 mt-8 flex h-auto w-full flex-wrap justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">{t('Loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-5 mt-8 flex h-auto w-full flex-wrap justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500">{t('Error')}: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="mb-5 mt-8 flex h-auto w-full flex-wrap justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            {t('Title', { hashtag })}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">{t('NoPosts')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={'mb-5 mt-8 flex h-auto w-full flex-wrap justify-center'}>
      <div className="mb-4 w-full text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {t('Title', { hashtag })}
        </h2>
      </div>
      <div className={'grid grid-cols-4 gap-2'}>
        {posts?.map((post) => {
          return <Picture key={post.id} post={post} url={post?.media[0].url} />;
        })}
      </div>
    </div>
  );
};

export default Hashtag;
