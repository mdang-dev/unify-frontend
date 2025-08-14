import { useState } from "react";
import { useTranslations } from 'next-intl';

const Caption = ({ text }) => {
  const t = useTranslations('Home.PostItem');
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowMore = text.length > 100;

  if (!shouldShowMore) {
    return (
      <div className="my-2 text-wrap text-sm leading-snug text-gray-800 dark:text-gray-200">
        {text}
      </div>
    );
  }

  return (
    <div className="my-2 text-wrap text-sm leading-snug text-gray-800 dark:text-gray-200">
      {isExpanded ? text : `${text.slice(0, 100)}...`}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="ml-1.5 font-medium text-blue-500 hover:underline focus:outline-none dark:text-blue-400"
      >
        {isExpanded ? t('Caption.Less') : t('Caption.More')}
      </button>
    </div>
  );
};

export default Caption;
