'use client';
import React from 'react';
import PhotoUploadField from '../../../../components/base/report-modal/_components/photo-upload-field';
import { toast } from 'sonner';

// Custom ImpersonationModal component
const ImpersonationModal = ({ isOpen, onClose, onSubmit, userId, urls, setUrls, maxImages = 5, disabled = false }) => {
  const [customReason, setCustomReason] = React.useState('');

  const handleSubmit = async () => {
    if (!customReason.trim()) {
      toast.error('Please enter a reason.');
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
    onSubmit(userId, customReason, uploadedUrls);
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
          Please specify impersonation details
        </h2>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium dark:text-gray-500">
            Enter impersonation details:
          </label>
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="w-full rounded-md border border-neutral-800 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
            placeholder="Please provide details about the impersonation..."
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

const ReportUserModal = ({ isOpen, onClose, onSubmit, userId }) => {
  const [selectedReason, setSelectedReason] = React.useState('');
  const [isImpersonationModalOpen, setIsImpersonationModalOpen] = React.useState(false);
  const [urls, setUrls] = React.useState([]);
  const [isUploading, setIsUploading] = React.useState(false);

  const reportReasons = [
    'This account user may be under 13 years old',
    'This account is impersonating someone else',
    'Post content that should not appear on Unify',
  ];

  const handleReasonChange = (reason) => {
    setSelectedReason(reason);
    if (reason === 'This account is impersonating someone else') {
      setIsImpersonationModalOpen(true);
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for reporting.');
      return;
    }
    
    if (selectedReason !== 'This account is impersonating someone else') {
      await processAndSubmit(userId, selectedReason);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setUrls([]);
    setIsImpersonationModalOpen(false);
    onClose();
  };

  const handleImpersonationClose = () => {
    setIsImpersonationModalOpen(false);
    // Don't reset the selected reason so the user can see their selection
  };

  const handleImpersonationSubmit = async (userId, impersonationReason, impersonationUrls = []) => {
    // The impersonation modal has already processed the images and passed the uploaded URLs
    // We just need to merge them with any images from the main modal
    let finalUrls = [];
    
    // Process any images from the main modal
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
        finalUrls = result.files.map(file => file.url).filter(url => url != null);
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        toast.warning(`Warning: Image upload failed (${uploadError.message}). The report will be submitted without images.`);
        finalUrls = [];
      }
    }
    
    // Add the impersonation modal's uploaded URLs
    if (Array.isArray(impersonationUrls)) {
      finalUrls = [...finalUrls, ...impersonationUrls];
    }
    
    // Ensure finalUrls is always an array and contains no null values
    if (!Array.isArray(finalUrls)) {
      finalUrls = [];
    }
    finalUrls = finalUrls.filter(url => url && typeof url === 'string' && url.trim() !== '');
    
    // Submit the report with the processed URLs
    onSubmit(userId, impersonationReason, finalUrls);
    setIsImpersonationModalOpen(false);
    handleClose();
  };

  const processAndSubmit = async (userId, reason, passedUrls = []) => {
    try {
      setIsUploading(true);
      let finalUrls = [];

      // Process images from the main modal
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
          finalUrls = result.files.map(file => file.url).filter(url => url != null);

        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          toast.warning(`Warning: Image upload failed (${uploadError.message}). The report will be submitted without images.`);
          finalUrls = [];
        }
      }

      // Add any passed URLs (from impersonation modal)
      if (Array.isArray(passedUrls)) {
        finalUrls = [...finalUrls, ...passedUrls];
      }

      // Ensure finalUrls is always an array and contains no null values
      if (!Array.isArray(finalUrls)) {
        finalUrls = [];
      }
      finalUrls = finalUrls.filter(url => url && typeof url === 'string' && url.trim() !== '');
      
      // Submit the report with the processed URLs
      onSubmit(userId, reason, finalUrls);

    } catch (error) {
      console.error('Error processing report:', error);
      toast.error('Error processing report. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

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

  // Show impersonation modal instead of main modal when it's open
  if (isImpersonationModalOpen) {
    return (
      <ImpersonationModal
        isOpen={isImpersonationModalOpen}
        onClose={handleImpersonationClose}
        onSubmit={handleImpersonationSubmit}
        userId={userId}
        urls={urls}
        setUrls={setUrls}
        maxImages={5}
        disabled={isUploading}
      />
    );
  }

  // Show main modal
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60">
      <div className="z-[9999] mx-4 w-[500px] max-w-[90%] rounded-lg bg-white p-4 shadow-xl dark:bg-neutral-900">
        <h2 className="mb-4 border-b border-neutral-800 pb-2 text-center text-lg font-semibold">
          Why are you reporting this user?
        </h2>

        <div className="mb-4 space-y-3">
          {reportReasons.map((reason) => (
            <div key={reason} className="flex items-center">
              <input
                type="radio"
                id={reason}
                name="reportReason"
                value={reason}
                checked={selectedReason === reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                className="h-4 w-4 border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor={reason} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {reason}
              </label>
            </div>
          ))}
        </div>

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
              selectedReason === 'This account is impersonating someone else' ||
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

export default ReportUserModal;