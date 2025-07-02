import { motion } from 'framer-motion';
import { STATUS_LABELS } from '../comments-management';



const CommentDetailModal = ({
  isOpen,
  onClose,
  comment,
  onApprove,
  onReject,
  loading,
  postDetails,
}) => {
  if (!isOpen || !comment) return null;

  const renderMedia = (media) => {
    if (!media || media.length === 0) {
      return <div className="text-sm italic text-gray-500">No media</div>;
    }

    return (
      <div className="space-y-2">
        <span className="text-sm font-semibold">Post Media:</span>
        <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
          {media.map((item, index) => (
            <div key={index} className="relative">
              {item.mediaType === 'VIDEO' ? (
                <video
                  src={item.url}
                  className="h-24 w-full rounded-md object-cover"
                  controls
                  preload="metadata"
                />
              ) : (
                <img
                  src={item.url}
                  alt={`Post media ${index + 1}`}
                  className="h-24 w-full rounded-md object-cover"
                />
              )}
              <div className="absolute bottom-1 right-1 rounded bg-black bg-opacity-50 px-1 text-xs text-white">
                {item.mediaType}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="no-scrollbar max-h-[85vh] w-[700px] overflow-y-auto rounded-lg bg-white p-6 dark:bg-neutral-800"
      >
        <h2 className="mb-4 text-xl font-bold">Comment Report Detail</h2>

        {/* Report Information */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-neutral-700">
          <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Report Information
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Reporter:</span>{' '}
              <span className="text-blue-600 dark:text-blue-400">{comment.user?.username}</span>
            </div>
            <div>
              <span className="font-semibold">Reported At:</span>{' '}
              {new Date(comment.reportedAt).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">Reason:</span>{' '}
              <span className="text-red-600 dark:text-red-400">{comment.reason}</span>
            </div>
            <div>
              <span className="font-semibold">Status:</span>{' '}
              <span
                className={`rounded px-2 py-1 text-xs ${
                  comment.status === 0
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : comment.status === 1
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {STATUS_LABELS[comment.status] || comment.status}
              </span>
            </div>
          </div>
        </div>

        {/* Comment Information */}
        <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Reported Comment
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Comment Author:</span>{' '}
              <span className="text-blue-600 dark:text-blue-400">
                {comment.reportedEntity?.username}
              </span>
            </div>
            <div>
              <span className="font-semibold">Comment Content:</span>
              <div className="mt-1 rounded border-l-4 border-blue-500 bg-white p-3 dark:bg-neutral-700">
                {comment.reportedEntity?.content}
              </div>
            </div>
          </div>
        </div>

        {/* Post Information */}
        {postDetails && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
              Related Post
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold">Post Author:</span>{' '}
                <span className="text-green-600 dark:text-green-400">
                  {postDetails.user?.username}
                </span>
              </div>
              <div>
                <span className="font-semibold">Post Caption:</span>
                <div className="mt-1 rounded border-l-4 border-green-500 bg-white p-3 dark:bg-neutral-700">
                  {postDetails.captions || 'No caption'}
                </div>
              </div>
              <div>
                <span className="font-semibold">Posted At:</span>{' '}
                {new Date(postDetails.postedAt).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">Audience:</span>{' '}
                <span className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
                  {postDetails.audience}
                </span>
              </div>
              {renderMedia(postDetails.media)}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-2">
          {comment.status === 0 && (
            <>
              <button
                onClick={onApprove}
                disabled={loading}
                className="rounded-md bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={onReject}
                disabled={loading}
                className="rounded-md bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Reject'}
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CommentDetailModal;
