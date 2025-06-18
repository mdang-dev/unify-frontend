import React, { useState } from 'react';

function CaptionWithMore({ text }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLines = 2;
  const shouldTruncate = text.length > 100;

  return (
    <div>
      <h3 className={`text-sm ${!isExpanded && shouldTruncate ? 'line-clamp-2' : ''}`}>
        {text}
        {!isExpanded && shouldTruncate && (
          <span className="ml-1 cursor-pointer text-gray-400" onClick={() => setIsExpanded(true)}>
            More
          </span>
        )}
      </h3>
      {isExpanded && shouldTruncate && (
        <span className="cursor-pointer text-sm text-gray-400" onClick={() => setIsExpanded(false)}>
          Less
        </span>
      )}
    </div>
  );
}

export default CaptionWithMore;
