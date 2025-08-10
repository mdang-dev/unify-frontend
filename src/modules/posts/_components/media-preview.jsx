const { default: Image } = require('next/image');

const MediaPreview = ({ file, onRemove }) => {
  const isVideo = file.type?.startsWith('video/') || file.mediaType === 'VIDEO';
  const isBlobOrData = typeof file.url === 'string' && (file.url.startsWith('blob:') || file.url.startsWith('data:'));

  return (
    <div className="group relative">
      <button
        onClick={() => onRemove(file)}
        className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
      >
        <i className="fa-solid fa-xmark text-sm"></i>
      </button>
      {isVideo ? (
        <video
          src={file.url}
          controls
          className="aspect-square w-full rounded-lg border border-gray-200 object-cover dark:border-neutral-700"
        />
      ) : (
        <Image
          src={file.url}
          alt="Preview"
          width={200}
          height={200}
          unoptimized={isBlobOrData}
          className="aspect-square w-full rounded-lg border border-gray-200 object-cover dark:border-neutral-700"
        />
      )}
    </div>
  );
};

export default MediaPreview;
