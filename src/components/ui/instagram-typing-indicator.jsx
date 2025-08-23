'use client';

import { useEffect, useState, useRef } from 'react';

const InstagramTypingIndicator = ({ 
  isTyping = false, 
  username = 'Someone', 
  className = '',
  variant = 'default', // 'default', 'compact', 'minimal'
  showUsername = true
}) => {
  const [dotStates, setDotStates] = useState([false, false, false]);
  const [textOpacity, setTextOpacity] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isTyping) {
      setDotStates([false, false, false]);
      setTextOpacity(0);
      return;
    }

    // Fade in text
    setTextOpacity(1);

    // Complex dot animation sequence
    let frame = 0;
    const animate = () => {
      frame++;
      
      // Create wave-like animation
      const time = Date.now() * 0.003;
      const dot1 = Math.sin(time) > 0.5;
      const dot2 = Math.sin(time + 0.5) > 0.5;
      const dot3 = Math.sin(time + 1) > 0.5;
      
      setDotStates([dot1, dot2, dot3]);
      
      if (isTyping) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isTyping]);

  if (!isTyping) return null;

  const variants = {
    default: {
      container: 'px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl',
      dots: 'w-2 h-2',
      gap: 'gap-2',
      text: 'text-sm',
      shadow: 'shadow-sm'
    },
    compact: {
      container: 'px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl',
      dots: 'w-1.5 h-1.5',
      gap: 'gap-1.5',
      text: 'text-xs',
      shadow: 'shadow-sm'
    },
    minimal: {
      container: 'px-2 py-1',
      dots: 'w-1 h-1',
      gap: 'gap-1',
      text: 'text-xs',
      shadow: ''
    }
  };

  const currentVariant = variants[variant];

  return (
    <div className={`flex items-center ${currentVariant.container} ${currentVariant.shadow} ${className} transition-all duration-300 ease-out`}>
      {/* Avatar placeholder */}
      <div className="relative mr-3">
        <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {username.charAt(0).toUpperCase()}
          </span>
        </div>
        {/* Online indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
      </div>

      {/* Typing dots with enhanced animations */}
      <div className={`flex items-center ${currentVariant.gap} mr-3`}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`${currentVariant.dots} rounded-full transition-all duration-300 ease-out ${
              dotStates[index]
                ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-500/50'
                : 'bg-gray-400 scale-100'
            }`}
            style={{
              animationDelay: `${index * 100}ms`,
              transform: dotStates[index] ? 'scale(1.25)' : 'scale(1)',
              filter: dotStates[index] ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'none'
            }}
          />
        ))}
      </div>

      {/* Typing text with fade-in animation */}
      {showUsername && (
        <div 
          className={`${currentVariant.text} text-gray-700 dark:text-gray-300 font-medium transition-opacity duration-300`}
          style={{ opacity: textOpacity }}
        >
          {username} is typing
        </div>
      )}

      {/* Enhanced pulse effect */}
      <div className="ml-2">
        <div className="relative">
          <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
          <span className="absolute inset-0 inline-block w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </div>
      </div>
    </div>
  );
};

// Compact version for chat lists
export const CompactTypingIndicator = ({ isTyping, username, className }) => (
  <InstagramTypingIndicator
    isTyping={isTyping}
    username={username}
    className={className}
    variant="compact"
  />
);

// Minimal version for inline use
export const MinimalTypingIndicator = ({ isTyping, className }) => (
  <InstagramTypingIndicator
    isTyping={isTyping}
    username=""
    className={className}
    variant="minimal"
    showUsername={false}
  />
);

export default InstagramTypingIndicator;
