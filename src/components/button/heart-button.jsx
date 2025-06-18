import React, { useState } from 'react';
import { Button } from '@heroui/react';

const HeartButton = ({ className = '' }) => {
  const [liked, setLiked] = useState(false);

  const handleClick = () => {
    setLiked(!liked);
  };

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
