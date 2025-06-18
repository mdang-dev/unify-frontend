'use client';
import React from 'react';
import ImpersonationModal from './_components/impersonation-modal';

const ReportUserModal = ({ isOpen, onClose, onSubmit, userId }) => {
  const [selectedReason, setSelectedReason] = React.useState('');
  const [isImpersonationModalOpen, setIsImpersonationModalOpen] = React.useState(false);

  const reportReasons = [
    'This account user may be under 13 years old',
    'This account is impersonating someone else',
    'Post content that should not appear on Unify',
  ];

  const handleReasonChange = (reason) => {
    setSelectedReason(reason);
    if (reason === 'Other') {
      setIsOtherModalOpen(true);
    } else if (reason === 'This account is impersonating someone else') {
      setIsImpersonationModalOpen(true);
    }
  };

  const handleSubmit = () => {
    if (!selectedReason) {
      alert('Please select a reason for reporting.');
      return;
    }
    if (selectedReason !== 'This account is impersonating someone else') {
      onSubmit(userId, selectedReason);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setSelectedReason(false);
    onClose();
  };

  const handleImpersonationSubmit = (userId, impersonationReason) => {
    onSubmit(userId, impersonationReason);
    setIsImpersonationModalOpen(false);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black/60">
        <div className="z-[9999] mx-4 w-[500px] max-w-[90%] rounded-lg bg-white p-4 shadow-xl dark:bg-neutral-900">
          <h2 className="mb-4 border-b border-neutral-800 pb-2 text-center text-lg font-semibold">
            Why are you reporting this post?
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

          <div className="item-center mx-3 flex gap-2">
            <button
              onClick={handleSubmit}
              className="w-full rounded-md bg-red-500 py-1 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-neutral-500"
              disabled={
                !selectedReason ||
                selectedReason === 'Other' ||
                selectedReason === 'This account is impersonating someone else'
              }
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

      <ImpersonationModal
        isOpen={isImpersonationModalOpen}
        onClose={() => setIsImpersonationModalOpen(false)}
        onSubmit={handleImpersonationSubmit}
        userId={userId}
      />
    </>
  );
};

export default ReportUserModal;
