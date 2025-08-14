'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import { PhotoUploadField } from './_components';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

const ReportModal = ({ isOpen, onClose, onSubmit, postId }) => {
  const t = useTranslations('Home.PostItem.ReportModal');
  const [selectedReason, setSelectedReason] = React.useState('');
  const [customReason, setCustomReason] = React.useState('');
  const [urls, setUrls] = React.useState([]);
  const [isUploading, setIsUploading] = React.useState(false);

  // Danh sách lý do báo cáo
  const reportReasons = [
    { key: 'Spam', label: t('Reasons.Spam') },
    { key: 'Inappropriate Content', label: t('Reasons.InappropriateContent') },
    { key: 'Harassment', label: t('Reasons.Harassment') },
    { key: 'Violence', label: t('Reasons.Violence') },
    { key: 'Other', label: t('Reasons.Other') }
  ];

  const handleReasonChange = (reason) => {
    setSelectedReason(reason);
    if (reason !== 'Other') {
      setCustomReason(''); // Clear custom reason when selecting other options
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error(t('SelectReason'));
      return;
    }
    
    if (selectedReason === 'Other' && !customReason.trim()) {
      toast.error('Please enter a reason for reporting.');
      return;
    }
    
    // Use custom reason if "Other" is selected, otherwise use the selected reason
    const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    await processAndSubmit(postId, finalReason);
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    setUrls([]);
    onClose();
  };

  // Process images and submit report
  const processAndSubmit = async (postId, reason, passedUrls = []) => {
    try {
      setIsUploading(true);

      let finalUrls = [];

      // If there are images to upload, process them
      if (urls && urls.length > 0) {
        try {
          // Create FormData for the upload API
          const formData = new FormData();
          urls.forEach(item => {
            if (item && item.file) {
              formData.append('files', item.file);
            }
          });
          
          // Upload files to Cloudinary via our API
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
          }
          
          const result = await response.json();
          
          // Extract the Cloudinary URLs from the response
          finalUrls = result.files.map(file => file.url).filter(url => url != null);
          
         // toast.success('Images uploaded successfully');
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          // If upload fails, still submit the report without images
          toast.warning(`Warning: Image upload failed (${uploadError.message}). The report will be submitted without images.`);
          finalUrls = [];
        }
      }
      
      // Add any passed URLs
      if (Array.isArray(passedUrls)) {
        finalUrls = [...finalUrls, ...passedUrls];
      }
      
      // Ensure finalUrls is always an array and contains no null values
      if (!Array.isArray(finalUrls)) {
        finalUrls = [];
      }
      finalUrls = finalUrls.filter(url => url && typeof url === 'string' && url.trim() !== '');
      
      // Submit the report with the processed URLs
      onSubmit(postId, reason, finalUrls);
      
    } catch (error) {
      console.error('Error processing report:', error);
      toast.error('Error processing report. Please try again.');
    } finally {
      setIsUploading(false);
    }
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
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60">
      <div className="z-[9999] mx-4 w-[500px] max-w-[90%] rounded-lg bg-white p-4 shadow-xl dark:bg-neutral-900">
        <h2 className="mb-4 border-b border-neutral-800 pb-2 text-center text-lg font-semibold">
          Why are you reporting this post?
        </h2>

        <div className="mb-4 space-y-3">
          {reportReasons.map((reason) => (
            <div key={reason.key}>
              <div className="flex items-center">
                <input
                  type="radio"
                  id={reason.key}
                  name="reportReason"
                  value={reason.key}
                  checked={selectedReason === reason.key}
                  onChange={(e) => handleReasonChange(e.target.value)}
                  className="h-4 w-4 border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor={reason.key} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {reason.label}
                </label>
              </div>
              
              {/* Show text field only when "Other" is selected */}
              {reason === 'Other' && selectedReason === 'Other' && (
                <div className="ml-6 mt-2">
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please specify your reason..."
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Photo Upload Section */}
        <PhotoUploadField
          urls={urls}
          setUrls={setUrls}
          maxImages={5}
          disabled={isUploading}
        />

        <div className="item-center mx-3 flex gap-2">
          <button
            onClick={handleSubmit}
            className="w-full rounded-md bg-red-500 py-1 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-neutral-500"
            disabled={
              !selectedReason || 
              (selectedReason === 'Other' && !customReason.trim()) || 
              isUploading
            }
          >
            {isUploading ? 'Uploading...' : 'Submit'}
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

export default ReportModal;
