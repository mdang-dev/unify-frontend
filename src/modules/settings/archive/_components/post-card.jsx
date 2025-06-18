const PostCard = ({ post, onClick }) => {
  const hasMultipleMedia = post.media.length > 1;
  const firstMedia = post.media[0];

  return (
    <div className="group relative aspect-square cursor-pointer" onClick={() => onClick(post)}>
      <div className="pointer-events-none absolute left-0 right-0 top-0 bg-black/50 p-1 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="text-sm">
          {post.postedAt
            ? (() => {
                const date = new Date(post.postedAt);
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                const yyyy = date.getFullYear();
                return `${mm}-${dd}-${yyyy}`;
              })()
            : ''}
        </p>
      </div>
      {post.media.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center bg-black">
          <p className="text-sm text-white">View article</p>
        </div>
      ) : (
        <div className="h-full w-full overflow-hidden">
          {firstMedia?.mediaType === 'VIDEO' ? (
            <video src={firstMedia?.url} className="h-full w-full object-cover" muted />
          ) : (
            <img src={firstMedia?.url} className="h-full w-full object-cover" alt="Post media" />
          )}
        </div>
      )}
      {hasMultipleMedia && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/50 p-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {post.media.map((mediaItem, index) => (
              <div key={index} className="h-12 w-12 flex-shrink-0">
                {mediaItem?.mediaType === 'VIDEO' ? (
                  <video src={mediaItem?.url} className="h-full w-full object-cover" />
                ) : (
                  <img
                    src={mediaItem?.url}
                    className="h-full w-full object-cover"
                    alt="Media preview"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {hasMultipleMedia && (
        <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/50 px-1 py-0.5 text-xs text-white">
          <i className="fa-solid fa-layer-group" />
        </div>
      )}
      {firstMedia?.mediaType === 'VIDEO' && !hasMultipleMedia && (
        <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/50 px-1 py-0.5 text-xs text-white">
          <i className="fa-solid fa-film" />
        </div>
      )}
    </div>
  );
};

export default PostCard;
