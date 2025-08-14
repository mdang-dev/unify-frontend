'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import PhotoUploadField from './photo-upload-field';

const OtherReasonModal = ({ isOpen, onClose, onSubmit, postId, urls = [], setUrls, maxImages = 5, disabled = false }) => {
  const t = useTranslations('Home.PostItem.ReportModal.OtherReason');
  const [customReason, setCustomReason] = React.useState('');

  const handleSubmit = async () => {
    if (!customReason.trim()) {
      toast.error(t('PleaseEnterReason'));
      return;
    }

    // Process images and get uploaded URLs
    let uploadedUrls = [];
    if (urls && urls.length > 0) {
      try {
        const formData = new FormData();
        urls.forEach(item => {
          if (item && item.file) {
            formData.append('files', item.file);
          }
        });

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
        }

        const result = await response.json();
        uploadedUrls = result.files.map(file => file.url).filter(url => url != null);
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        toast.warning(`Warning: Image upload failed (${uploadError.message}). The report will be submitted without images.`);
        uploadedUrls = [];
      }
    }

    // Pass the uploaded URLs along with the custom reason
    onSubmit(postId, customReason, uploadedUrls);
  };

  const handleClose = () => {
    setCustomReason('');
    onClose();
  };

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      if (Array.isArray(urls)) {
        urls.forEach((image) => {
          if (image && image.preview) {
            URL.revokeObjectURL(image.preview);
          }
        });
      }
    };
  }, [urls]);

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
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="w-full rounded-md border border-neutral-800 p-2 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-neutral-800"
            placeholder={t('Placeholder')}
            rows={3}
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

        {/* Action buttons */}
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
