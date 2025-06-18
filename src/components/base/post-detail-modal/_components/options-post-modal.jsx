'use client';

import React, { useState, useCallback } from 'react';
import { redirect, usePathname } from 'next/navigation';
import ReportModal from '../../report-modal';
import { useCreateReport } from '@/src/hooks/use-report';
import { addToast, ToastProvider } from '@heroui/toast';

const OptionsPostModal = ({
  onOpenDeleteModal,
  onOpenArchiveModal,
  onOpenRestoreModal,
  onClose,
  postId,
  isOwner,
  setOpenList,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();
  const { mutate: createReport } = useCreateReport();

  const openReportModal = () => {
    setIsModalOpen(true);
    if (setOpenList) setOpenList(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleReportPost = useCallback(
    (postId, reason) => {
      createReport(
        { endpoint: 'post', reportedId: postId, reason },
        {
          onSuccess: () => {
            addToast({
              title: 'Success',
              description: 'Report post successful.',
              timeout: 3000,
         
              color: 'success',
            });
            closeModal();
            onClose();
          },
          onError: (error) => {
            const errorMessage = error?.message || 'Unknown error';
            addToast({
              title: 'Fail to report post',
              description:
                errorMessage === 'You have reported this content before.'
                  ? 'You have reported this content before.'
                  : 'Error: ' + errorMessage,
              timeout: 3000,
       
              color:
                errorMessage === 'You have reported this content before.' ? 'warning' : 'danger',
            });
            closeModal();
            onClose();
          },
        }
      );
    },
    [createReport, onClose]
  );

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-80 scale-100 transform rounded-lg bg-white shadow-xl transition-all duration-200 hover:scale-105 dark:bg-neutral-800">
          {isOwner ? (
            <>
              <button
                onClick={onOpenDeleteModal}
                className="w-full rounded-t-lg py-3 font-medium text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-700"
              >
                Delete
              </button>
              <button
                onClick={() => redirect(`/posts/${postId}`)}
                className="w-full py-3 font-medium text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-neutral-700"
              >
                Update
              </button>
              {pathname.includes('/archive') ? (
                <button
                  onClick={onOpenRestoreModal}
                  className="w-full py-3 font-medium text-green-500 hover:bg-gray-100 dark:hover:bg-neutral-700"
                >
                  Restore Post
                </button>
              ) : (
                <button
                  onClick={onOpenArchiveModal}
                  className="w-full py-3 font-medium text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-neutral-700"
                >
                  Move to Archive
                </button>
              )}
            </>
          ) : (
            <button
              onClick={openReportModal}
              className="w-full rounded-t-lg py-3 font-medium text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-700"
            >
              Report
            </button>
          )}

          <button className="w-full py-3 font-medium text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-neutral-700">
            Share
          </button>

          <button
            onClick={onClose}
            className="w-full rounded-b-lg py-3 font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
          >
            Close
          </button>
        </div>

        {isModalOpen && (
          <ReportModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onSubmit={handleReportPost}
            postId={postId}
          />
        )}
      </div>
    </>
  );
};

export default OptionsPostModal;
