import Hashtag from '@/src/modules/hashtag';
import { useParams } from 'next/navigation';
import React from 'react';

export default function Page() {
  const { hashtag } = useParams();
  return <Hashtag hashtag={hashtag} />;
}
