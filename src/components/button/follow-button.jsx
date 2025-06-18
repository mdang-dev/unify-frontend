'use client';

import { useFollow } from '@/src/hooks/use-follow';
import { useEffect } from 'react';

const FollowButton = ({
  userId,
  followingId,
  classFollowing = '',
  classFollow = '',
  contentFollowing = '',
  contentFollow = '',
}) => {
  const { isFollowing, toggleFollow } = useFollow(userId, followingId);

  return (
    <button
      onClick={() => toggleFollow(!isFollowing)}
      className={isFollowing ? classFollowing : classFollow}
    >
      <span>{isFollowing ? contentFollowing : contentFollow}</span>
    </button>
  );
};

export default FollowButton;
