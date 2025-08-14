'use client';
import React from 'react';
import { useTranslations } from 'next-intl';

const OtherReasonModal = ({ isOpen, onClose, onSubmit, postId }) => {
  const t = useTranslations('Home.PostItem.ReportModal.OtherReason');
  const [customReason, setCustomReason] = React.useState('');

  const handleSubmit = () => {
    if (!customReason.trim()) {
      alert(t('PleaseEnterReason'));
      return;
    }

    // Pass the urls along with the custom reason
    onSubmit(postId, customReason, urls);
  };

  const handleClose = () => {
    setCustomReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60">
      <div className="mx-4 w-[500px] max-w-[90%] rounded-lg bg-white p-4 shadow-xl dark:bg-neutral-900">
        <h2 className="mb-4 border-b border-neutral-800 pb-2 text-center text-lg font-semibold">
          {t('Title')}
        </h2>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium dark:text-gray-500">
            {t('Label')}
          </label>
          <input
            type="text"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="w-full rounded-md border border-neutral-800 p-2 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-neutral-800"
            placeholder={t('Placeholder')}
          />
        </div>

        {/* Photo Upload Section */}
        <div className="mb-4">
          <PhotoUploadField
            urls={urls}
            setUrls={setUrls}
            maxImages={maxImages}
            disabled={disabled}
          />
        </div>

        {/* Nút hành động */}
        <div className="item-center mx-3 flex gap-2">
          <button
            onClick={handleSubmit}
            className="w-full rounded-md bg-neutral-800 py-1 font-semibold text-zinc-200 hover:bg-zinc-400 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-neutral-500"
            disabled={!customReason.trim()}
          >
            {t('../Submit')}
          </button>
          <button
            onClick={handleClose}
            className="w-full rounded-md bg-gray-100 py-1 font-semibold text-gray-700 hover:bg-gray-200"
          >
            {t('../Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtherReasonModal;
