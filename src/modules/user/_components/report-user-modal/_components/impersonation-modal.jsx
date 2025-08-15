'use client';
import React from 'react';
import { toast } from 'sonner';

const ImpersonationModal = ({ isOpen, onClose, onSubmit, userId }) => {
  const [selectedImpersonation, setSelectedImpersonation] = React.useState('');

  const impersonationReasons = [
    'Me',
    'The person I follow',
    'Celebrity or public figure',
    'A business or organization',
  ];

  const handleSubmit = () => {
    if (!selectedImpersonation) {
      toast.error('Please select who is being impersonated.');
      return;
    }
    onSubmit(userId, `This account is impersonating someone else: ${selectedImpersonation}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60">
      <div className="z-[9999] mx-4 w-[500px] max-w-[90%] rounded-lg bg-white p-4 shadow-xl dark:bg-neutral-900">
        <h2 className="mb-4 border-b border-neutral-800 pb-2 text-center text-lg font-semibold">
          Who is this account impersonating?
        </h2>

        <div className="mb-4 space-y-3">
          {impersonationReasons.map((reason) => (
            <div key={reason} className="flex items-center">
              <input
                type="radio"
                id={reason}
                name="impersonationReason"
                value={reason}
                checked={selectedImpersonation === reason}
                onChange={(e) => setSelectedImpersonation(e.target.value)}
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
            disabled={!selectedImpersonation}
          >
            Submit
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-md bg-gray-100 py-1 font-semibold text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImpersonationModal;
