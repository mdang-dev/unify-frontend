'use client';
import React from 'react';
import PhotoUploadField from './photo-upload-field';

const OtherReasonModal = ({ isOpen, onClose, onSubmit, postId, urls, setUrls, maxImages = 5, disabled = false }) => {
  const [customReason, setCustomReason] = React.useState('');

  const handleSubmit = () => {
    if (!customReason.trim()) {
      alert('Please enter a reason.');
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
          Please specify your reason
        </h2>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium dark:text-gray-500">
            Enter your reason:
          </label>
          <input
            type="text"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="w-full rounded-md border border-neutral-800 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
            placeholder="Type your reason here..."
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
            className="w-full rounded-md bg-red-500 py-1 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-neutral-500"
            disabled={!customReason.trim() || disabled}
          >
            Submit
          </button>
          <button
            onClick={handleClose}
            className="w-full rounded-md bg-gray-100 py-1 font-semibold text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtherReasonModal;
