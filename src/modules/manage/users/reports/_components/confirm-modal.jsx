import { motion } from 'framer-motion';
import { useState } from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, action, report }) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-[500px] rounded-lg bg-white p-6 dark:bg-neutral-800"
      >
        <h2 className="mb-4 text-xl font-bold">
          {action === 'approve' ? 'Approve Report' : 'Reject Report'}
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Please provide a reason for {action === 'approve' ? 'approving' : 'rejecting'} this
          report.
        </p>
        <textarea
          className="mb-4 w-full rounded-md border p-3 dark:bg-neutral-700 dark:text-white"
          rows="4"
          placeholder="Enter your reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className={`rounded-md px-4 py-2 text-white ${
              action === 'approve'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-500 hover:bg-red-600'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmModal;
