import React, { useState } from 'react';
import { Button } from '@heroui/react';

const HeartButton = ({ className = '', postId }) => {
  const [liked, setLiked] = useState(false);

  const handleClick = () => {
    setLiked(!liked);
  };

  // Early return if postId is not provided (for consistency with other buttons)
  if (!postId) {
    console.warn('HeartButton: postId prop is missing');
    return (
      <Button
        className={`min-w-10 bg-transparent dark:text-white ${className}`}
        disabled
        title="Cannot like: post ID missing"
      >
        <i className="fa-regular fa-heart opacity-50"></i>
      </Button>
    );
  }

  return (
    <Button
      onPress={handleClick}
      className={`min-w-10 bg-transparent dark:text-white ${className}`}
    >
      <i
        className={`${liked ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart transition duration-300 ease-in-out`}
      ></i>
    </Button>
  );
};

export default HeartButton;
