'use client';

import { useState, useEffect, useRef } from 'react';

const TypingMessageEffect = ({ 
  message = '', 
  isTyping = false, 
  typingSpeed = 50, // milliseconds per character
  className = '',
  variant = 'default', // 'default', 'compact', 'minimal'
  showCursor = true,
  cursorBlinkSpeed = 500 // milliseconds
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursorBlink, setShowCursorBlink] = useState(true);
  const typingIntervalRef = useRef(null);
  const cursorIntervalRef = useRef(null);

  // Typing effect
  useEffect(() => {
    if (!isTyping || !message) {
      setDisplayedMessage('');
      setCurrentIndex(0);
      return;
    }

    // Start typing effect
    if (currentIndex < message.length) {
      typingIntervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev < message.length) {
            setDisplayedMessage(message.substring(0, prev + 1));
            return prev + 1;
          }
          return prev;
        });
      }, typingSpeed);
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [isTyping, message, currentIndex, typingSpeed]);

  // Cursor blink effect
  useEffect(() => {
    if (isTyping && showCursor) {
      cursorIntervalRef.current = setInterval(() => {
        setShowCursorBlink(prev => !prev);
      }, cursorBlinkSpeed);
    }

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, [isTyping, showCursor, cursorBlinkSpeed]);

  // Reset when message changes
  useEffect(() => {
    setDisplayedMessage('');
    setCurrentIndex(0);
  }, [message]);

  if (!isTyping && !displayedMessage) return null;

  const variants = {
    default: {
      container: 'px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-sm',
      message: 'text-sm text-gray-700 dark:text-gray-300',
      cursor: 'text-blue-500'
    },
    compact: {
      container: 'px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm',
      message: 'text-xs text-gray-700 dark:text-gray-300',
      cursor: 'text-blue-500'
    },
    minimal: {
      container: 'px-2 py-1',
      message: 'text-sm text-gray-700 dark:text-gray-300',
      cursor: 'text-blue-500'
    }
  };

  const currentVariant = variants[variant];

  return (
    <div className={`flex items-start ${currentVariant.container} ${className}`}>
      {/* Typing indicator dots */}
      <div className="flex items-center gap-1.5 mr-3 mt-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
      </div>

      {/* Message content with typing effect */}
      <div className="flex-1 min-w-0">
        <div className={`${currentVariant.message} font-medium leading-relaxed`}>
          {displayedMessage}
          {/* Blinking cursor */}
          {showCursor && isTyping && (
            <span 
              className={`inline-block w-0.5 h-4 bg-blue-500 ml-0.5 ${currentVariant.cursor} ${
                showCursorBlink ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-75`}
            />
          )}
        </div>
        
        {/* Typing status */}
        {isTyping && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            typing...
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced version with message preview
export const TypingMessagePreview = ({ 
  message = '', 
  isTyping = false, 
  typingSpeed = 50,
  className = '',
  showPreview = true,
  previewLength = 100 // characters to show in preview
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursorBlink, setShowCursorBlink] = useState(true);
  const typingIntervalRef = useRef(null);
  const cursorIntervalRef = useRef(null);

  // Typing effect
  useEffect(() => {
    if (!isTyping || !message) {
      setDisplayedMessage('');
      setCurrentIndex(0);
      return;
    }

    // Start typing effect
    if (currentIndex < message.length) {
      typingIntervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev < message.length) {
            setDisplayedMessage(message.substring(0, prev + 1));
            return prev + 1;
          }
          return prev;
        });
      }, typingSpeed);
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [isTyping, message, currentIndex, typingSpeed]);

  // Cursor blink effect
  useEffect(() => {
    if (isTyping) {
      cursorIntervalRef.current = setInterval(() => {
        setShowCursorBlink(prev => !prev);
      }, 500);
    }

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, [isTyping]);

  // Reset when message changes
  useEffect(() => {
    setDisplayedMessage('');
    setCurrentIndex(0);
  }, [message]);

  if (!isTyping && !displayedMessage) return null;

  // Create preview text
  const previewText = message.length > previewLength 
    ? message.substring(0, previewLength) + '...'
    : message;

  return (
    <div className={`px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 ${className}`}>
      {/* Message preview with typing effect */}
      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
        {displayedMessage || previewText}
        {/* Blinking cursor */}
        {isTyping && (
          <span 
            className={`inline-block w-0.5 h-4 bg-blue-500 ml-0.5 text-blue-500 ${
              showCursorBlink ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-75`}
          />
        )}
      </div>
      
      {/* Typing status with progress */}
      {isTyping && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            typing...
          </span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
          </div>
        </div>
      )}
    </div>
  );
};

// Minimal inline typing effect
export const InlineTypingEffect = ({ 
  message = '', 
  isTyping = false, 
  typingSpeed = 30,
  className = ''
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const typingIntervalRef = useRef(null);
  const cursorIntervalRef = useRef(null);

  // Typing effect
  useEffect(() => {
    if (!isTyping || !message) {
      setDisplayedMessage('');
      setCurrentIndex(0);
      return;
    }

    if (currentIndex < message.length) {
      typingIntervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev < message.length) {
            setDisplayedMessage(message.substring(0, prev + 1));
            return prev + 1;
          }
          return prev;
        });
      }, typingSpeed);
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [isTyping, message, currentIndex, typingSpeed]);

  // Cursor blink
  useEffect(() => {
    if (isTyping) {
      cursorIntervalRef.current = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 500);
    }

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, [isTyping]);

  useEffect(() => {
    setDisplayedMessage('');
    setCurrentIndex(0);
  }, [message]);

  if (!isTyping && !displayedMessage) return null;

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className="text-gray-700 dark:text-gray-300">
        {displayedMessage}
      </span>
      {isTyping && (
        <span 
          className={`inline-block w-0.5 h-4 bg-blue-500 ml-0.5 ${
            showCursor ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-75`}
        />
      )}
    </span>
  );
};

export default TypingMessageEffect;
