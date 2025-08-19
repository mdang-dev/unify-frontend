'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import OtherReasonModal from '../../report-modal/_components/other-reason-modal';

const CommentReportModal = ({ isOpen, onClose, onSubmit, commentId }) => {
  const t = useTranslations('Home.PostItem.ReportModal');
  const [selectedReason, setSelectedReason] = React.useState('');
  const [isOtherModalOpen, setIsOtherModalOpen] = React.useState(false);

  // Comment-specific report reasons
  const reportReasons = [
    { key: 'Spam', label: t('Reasons.Spam') },
    { key: 'Harassment or bullying', label: t('Reasons.HarassmentOrBullying') },
    { key: 'Hate speech or discrimination', label: t('Reasons.HateSpeech') },
    { key: 'Violence or threats', label: t('Reasons.ViolenceOrThreats') },
    { key: 'Inappropriate content', label: t('Reasons.InappropriateContent') },
    { key: 'False information', label: t('Reasons.FalseInformation') },
    { key: 'Other', label: t('Reasons.Other') },
  ];

  const handleReasonChange = (reason) => {
    setSelectedReason(reason);
    if (reason === 'Other') {
      setIsOtherModalOpen(true);
    }
  };

  const handleSubmit = () => {
    if (!selectedReason) {
      toast.error(t('SelectReason'));
      return;
    }
    if (selectedReason !== 'Other') {
      onSubmit(commentId, selectedReason);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setIsOtherModalOpen(false);
    onClose();
  };

  // Handle custom reason from OtherReasonModal
  const handleOtherSubmit = (postId, customReason, uploadedUrls) => {
    // For comments, we ignore uploadedUrls since comment reports don't support image uploads
    onSubmit(commentId, customReason);
    setIsOtherModalOpen(false);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="mx-4 w-[400px] max-w-[90vw] overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-neutral-900">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 dark:border-neutral-700">
            <h2 className="text-center text-lg font-semibold text-gray-900 dark:text-white">
              {t('CommentTitle')}
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-300">
              {t('Title').replace('post', 'comment')}
            </p>

            <div className="space-y-1">
              {reportReasons.map((reason) => (
                <div key={reason.key} className="group">
                  <input
                    type="radio"
                    id={reason.key}
                    name="reportReason"
                    value={reason.key}
                    checked={selectedReason === reason.key}
                    onChange={(e) => handleReasonChange(e.target.value)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={reason.key}
                    className={`block w-full cursor-pointer rounded-lg border px-4 py-3 text-left text-sm transition-all duration-200 ${
                      selectedReason === reason.key
                        ? 'border-neutral-800 bg-neutral-800 text-zinc-200 hover:bg-zinc-400 dark:border-zinc-200 dark:bg-zinc-200 dark:text-neutral-800 dark:hover:bg-zinc-400'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {reason.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-gray-200 px-6 py-4 dark:border-neutral-700">
            <button
              onClick={handleClose}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
            >
              {t('Cancel')}
            </button>
            <button
              onClick={handleSubmit}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
                !selectedReason || selectedReason === 'Other'
                  ? 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-neutral-600 dark:text-gray-400'
                  : 'bg-neutral-800 text-zinc-200 hover:bg-zinc-400 dark:bg-zinc-200 dark:text-neutral-800 dark:hover:bg-zinc-400'
              }`}
              disabled={!selectedReason || selectedReason === 'Other'}
            >
              {t('Report')}
            </button>
          </div>
        </div>
      </div>

      <OtherReasonModal
        isOpen={isOtherModalOpen}
        onClose={() => setIsOtherModalOpen(false)}
        onSubmit={handleOtherSubmit}
        postId={commentId}
      />
    </>
  );
};

export default CommentReportModal;
