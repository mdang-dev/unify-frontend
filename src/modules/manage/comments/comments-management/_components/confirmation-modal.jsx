'use client';
import { motion } from 'framer-motion';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  confirmColor = 'bg-emerald-600 hover:bg-emerald-700',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="w-[400px] rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900 dark:shadow-neutral-800/50"
      >
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-neutral-100">{title}</h3>
        <p className="mb-6 text-sm text-gray-600 dark:text-neutral-400">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className={`animate-pulse-once relative rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-300 ease-in-out hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-neutral-100`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`animate-pulse-once relative rounded-md px-4 py-2 text-sm font-medium text-white transition-colors duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 ${confirmColor}`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmationModal;
