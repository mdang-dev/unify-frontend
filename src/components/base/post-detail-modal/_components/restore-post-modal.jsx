'use client';

const RestorePostModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Confirm Restore
        </h3>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          This post will be restored and visible to everyone again.
        </p>
        <div className="flex justify-end gap-4 text-sm">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestorePostModal;
