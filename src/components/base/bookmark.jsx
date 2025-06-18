import { useBookmarks } from '@/src/hooks/use-bookmark';

export default function Bookmark({ postId, className, classNameIcon }) {
  const { savedPostsMap, toggleBookmark } = useBookmarks();

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <i
        className={`fa-${savedPostsMap[postId] ? 'solid' : 'regular'} fa-bookmark ${
          savedPostsMap[postId] ? 'text-yellow-400' : classNameIcon
        } cursor-pointer transition hover:opacity-50 focus:opacity-50`}
        onClick={() => toggleBookmark(postId)}
      />
    </div>
  );
}
