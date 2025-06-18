'use client';

const ArchivePostModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Confirm Archive
        </h3>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          Archived posts will be hidden from your profile. You can restore them later.
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
            className="rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
          >
            Move to Archive
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchivePostModal;
