'use client';
import React from 'react';

const DeleteCommentModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-[400px] max-w-[90vw] overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-neutral-900">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 dark:border-neutral-700">
          <h2 className="text-center text-lg font-semibold text-gray-900 dark:text-white">
            Delete Comment
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 dark:bg-neutral-700">
              <i className="fa-solid fa-trash text-2xl text-neutral-800 dark:text-zinc-200"></i>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Are you sure?
            </h3>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              This action cannot be undone. The comment will be permanently deleted.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-200 px-6 py-4 dark:border-neutral-700">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 disabled:opacity-50 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-800 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors duration-200 hover:bg-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-800 dark:hover:bg-zinc-400"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCommentModal;
