'use client';

import { useState } from 'react';
const Content = ({ text, maxLength = 100, className = 'text-xs' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded(!isExpanded);
  return (
    <>
      <div className={className}>
        {isExpanded ? text : `${text.slice(0, maxLength)}`}
        {/* <button onClick={toggleExpanded} className="text-gray-500">
          {isExpanded ? "Less" : "More"}
        </button> */}
      </div>
    </>
  );
};

export default Content;
