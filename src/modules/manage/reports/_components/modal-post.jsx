'use client';
import React, { useState, useEffect } from 'react';
import { CommentItem } from '@/src/components/base';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { commentsQueryApi } from '@/src/apis/comments/query/comments.query.api';

const ModalPost = ({ report, isOpen, onClose }) => {
  const [selectedMedia, setSelectedMedia] = useState(null);

  const { reportedEntity } = report;

  const { data: comments = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.COMMENTS_BY_POST, reportedEntity?.id],
    queryFn: () => commentsQueryApi.getCommentsByPostId(reportedEntity?.id),
    enabled: !!reportedEntity?.id,
  });

  useEffect(() => {
    if (reportedEntity?.media?.length > 0) {
      setSelectedMedia(reportedEntity.media[0]);
    } else {
      setSelectedMedia(null);
    }
  }, [reportedEntity]);

  if (!isOpen || !report || !report.reportedEntity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="flex h-[600px] w-[1000px] flex-row overflow-hidden rounded-lg bg-white dark:bg-neutral-900">
        <div className="relative w-1/2 bg-black">
          {selectedMedia ? (
            selectedMedia.mediaType === 'VIDEO' ? (
              <video src={selectedMedia.url} controls className="h-full w-full object-contain" />
            ) : (
              <img
                src={selectedMedia?.url}
                alt="Reported Media"
                className="h-full w-full object-contain"
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white">
              <p>No images/videos available</p>
            </div>
          )}

          {reportedEntity?.media?.length > 1 && (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 transform gap-2 rounded-lg bg-black bg-opacity-50 p-2">
              {(reportedEntity?.media || []).map((item, index) => (
                <div
                  key={index}
                  className={`h-12 w-12 cursor-pointer border-2 ${
                    selectedMedia?.url === item.url ? 'border-blue-500' : 'border-transparent'
                  }`}
                  onClick={() => setSelectedMedia(item)}
                >
                  {item.mediaType === 'VIDEO' ? (
                    <video src={item.url} className="h-full w-full rounded object-cover" />
                  ) : (
                    <img
                      src={item.url}
                      alt="Thumbnail"
                      className="h-full w-full rounded object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-1/2 flex-col">
          <div className="flex items-center justify-between border-b px-4 pb-2 pt-4">
            <div className="flex items-center">
              <div className="relative h-[50px] w-[50px] overflow-hidden rounded-full border-2 border-gray-300">
                {reportedEntity?.avatar?.url ? (
                  <img
                    src={reportedEntity.avatar?.url}
                    alt="Avatar"
                    width={50}
                    height={50}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src="/images/unify_icon_2.svg"
                    alt="Default Avatar"
                    width={50}
                    height={50}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <span className="ml-3 font-bold dark:text-white">
                {reportedEntity.user?.username || 'Unknown'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2">
            <p className="mb-4 text-sm leading-tight dark:text-white">
              <span className="mr-2 font-bold">{reportedEntity.user?.username}</span>
              {reportedEntity.captions || 'No caption'}
            </p>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Posted at: {new Date(reportedEntity.postedAt).toLocaleString()}
            </p>

            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading comments...</p>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>
              )}
            </div>
          </div>

          {/* <div className="border-t px-4 pb-4 pt-2">
            <p className="text-sm dark:text-white">
              <span className="font-semibold">Reported by:</span> {report.userId}
            </p>
            <p className="text-sm dark:text-white">
              <span className="font-semibold">Reported at:</span>{' '}
              {new Date(report.reportedAt).toLocaleString()}
            </p>
            <p className="text-sm dark:text-white">
              <span className="font-semibold">Status:</span> Pending
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ModalPost;