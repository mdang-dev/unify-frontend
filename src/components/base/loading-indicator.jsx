'use client';

import React from 'react';

const LoadingIndicator = ({ 
  isLoading, 
  text = "Loading...", 
  size = "default",
  className = "" 
}) => {
  if (!isLoading) return null;

  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-6 w-6", 
    large: "h-8 w-8"
  };

  const textSizes = {
    small: "text-sm",
    default: "text-base",
    large: "text-lg"
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`}></div>
      <span className={`text-gray-600 dark:text-gray-400 ${textSizes[size]}`}>
        {text}
      </span>
    </div>
  );
};

export default LoadingIndicator;
