'use client';

import React from 'react';
import { useModalStore } from '@/src/stores/modal.store';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ModalDialog({
  icon = ExclamationTriangleIcon,
  buttonClass = 'text-white bg-red-500 hover:bg-red-600',
  title = 'Modal Title',
  handleClick,
  buttonText = 'Confirm',
  children,
}) {
  const { isOpen, closeModal } = useModalStore();

  const renderIcon = () => {
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon;
    return <IconComp className="h-6 w-6 text-red-500" />;
  };

  return (
    <Dialog open={isOpen} onClose={closeModal} className="relative z-10">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
      <div className="fixed inset-0 z-10 flex items-center justify-center">
        <DialogPanel className="rounded bg-white p-6 shadow-lg">
          <div className="flex items-center">
            {renderIcon()}
            <DialogTitle className="ml-3 text-lg font-semibold">{title}</DialogTitle>
          </div>
          <div>{children}</div>
          <div className="mt-6 flex justify-end space-x-2">
            <button
              onClick={closeModal}
              className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleClick}
              className={`rounded px-4 py-2 text-sm font-medium ${buttonClass}`}
            >
              {buttonText}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
