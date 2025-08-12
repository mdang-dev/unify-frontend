'use client';
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
      return <div className="text-sm italic text-gray-500 dark:text-neutral-400">No media</div>;
    }

    return (
      <div className="space-y-2">
        <span className="text-sm font-semibold text-gray-700 dark:text-neutral-200">
          Post Media:
        </span>
        <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-lg bg-gray-50 p-2 dark:bg-neutral-800">
          {media.map((item, index) => (
            <div key={index} className="relative">
              {item.mediaType === 'VIDEO' ? (
                <video
                  src={item.url}
                  className="h-24 w-full rounded-md object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
                  controls
                  preload="metadata"
                />
              ) : (
                <img
                  src={item.url}
                  alt={`Post media ${index + 1}`}
                  className="h-24 w-full rounded-md object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
                />
              )}
              <div className="absolute bottom-1 right-1 rounded bg-neutral-900 bg-opacity-70 px-1.5 py-0.5 text-xs text-white">
                {item.mediaType}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="no-scrollbar max-h-[85vh] w-[700px] overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900 dark:shadow-neutral-800/50"
      >
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-neutral-100">
          Comment Report Detail
        </h2>

        {/* Report Information */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-neutral-800">
          <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-neutral-200">
            Report Information
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-semibold text-gray-700 dark:text-neutral-300">Reporter:</span>{' '}
              <span className="text-blue-600 dark:text-blue-400">{comment.user?.username}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700 dark:text-neutral-300">
                Reported At:
              </span>{' '}
              <span className="text-gray-900 dark:text-neutral-100">
                {new Date(comment.reportedAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-700 dark:text-neutral-300">Reason:</span>{' '}
              <span className="text-rose-600 dark:text-rose-400">{comment.reason}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700 dark:text-neutral-300">Status:</span>{' '}
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  comment.status === 0
                    ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    : comment.status === 1
                      ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {STATUS_LABELS[comment.status] || comment.status}
              </span>
            </div>
          </div>
        </div>

        {/* Comment Information */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-neutral-800">
          <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-neutral-200">
            Reported Comment
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-semibold text-gray-700 dark:text-neutral-300">
                Comment Author:
              </span>{' '}
              <span className="text-blue-600 dark:text-blue-400">
                {comment.reportedEntity?.username}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-700 dark:text-neutral-300">
                Comment Content:
              </span>
              <div className="mt-1 rounded-lg border-l-4 border-blue-600 bg-white p-3 dark:border-blue-400 dark:bg-neutral-700">
                <span className="text-gray-900 dark:text-neutral-100">
                  {comment.reportedEntity?.content}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Post Information */}
        {postDetails && (
          <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-neutral-800">
            <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-neutral-200">
              Related Post
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-gray-700 dark:text-neutral-300">
                  Post Author:
                </span>{' '}
                <span className="text-emerald-600 dark:text-emerald-300">
                  {postDetails.user?.username}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-neutral-300">
                  Post Caption:
                </span>
                <div className="mt-1 rounded-lg border-l-4 border-emerald-600 bg-white p-3 dark:border-emerald-400 dark:bg-neutral-700">
                  <span className="text-gray-900 dark:text-neutral-100">
                    {postDetails.captions || 'No caption'}
                  </span>
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-neutral-300">
                  Posted At:
                </span>{' '}
                <span className="text-gray-900 dark:text-neutral-100">
                  {new Date(postDetails.postedAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-neutral-300">Audience:</span>{' '}
                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-neutral-700 dark:text-neutral-200">
                  {postDetails.audience}
                </span>
              </div>
              {renderMedia(postDetails.media)}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-2">
          {comment.status === 0 && onApprove && onReject && (
            <>
              <button
                onClick={onApprove}
                disabled={loading}
                className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-600 dark:hover:bg-neutral-700"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing...
                  </div>
                ) : (
                  'Approve'
                )}
              </button>
              <button
                onClick={onReject}
                disabled={loading}
                className="rounded-md bg-zinc-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-500 dark:hover:bg-zinc-600"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing...
                  </div>
                ) : (
                  'Reject'
                )}
              </button>
            </>
          )}
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CommentDetailModal;
