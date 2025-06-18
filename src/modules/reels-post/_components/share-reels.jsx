'use client';

import Image from 'next/image';
import { Input } from '@/src/components/ui/input';
import avatar2 from '@/public/images/testAvt.jpg';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
const ShareReels = ({ isOpen, onOpenChange, selectedAvatars, setSelectedAvatars, handleShare }) => {
  const handleAvatarClick = (index) => {
    setSelectedAvatars((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <Modal
      isDismissable={false}
      scrollBehavior="inside"
      size="2xl"
      isKeyboardDismissDisabled={true}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      backdrop="blur"
      className="relative z-50 bg-white dark:bg-neutral-900"
      classNames={{
        backdrop: 'bg-gray-900/50 backdrop-blur-md',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col">
              <h1 className="text-2xl font-bold">Share</h1>
            </ModalHeader>
            <hr className="bg-gray-200" />
            <ModalBody>
              <div className="mt-4">
                <Input
                  placeholder="Search..."
                  className="h-11 w-full font-bold dark:border-white"
                />
              </div>
              <div className="flex justify-around p-3">
                {[1, 2, 3, 4].map((_, index) => (
                  <div className="relative text-center" key={index}>
                    <Image
                      src={avatar2}
                      alt={`avtshare-${index}`}
                      className="h-20 w-20 cursor-pointer rounded-full"
                      onClick={() => handleAvatarClick(index)}
                    />
                    {selectedAvatars.includes(index) && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-xs text-white">
                        ✓
                      </span>
                    )}
                    <p className="mt-2 w-20 truncate text-lg font-bold">Tan Vinh</p>
                  </div>
                ))}
              </div>
            </ModalBody>
            <ModalFooter className="flex justify-center border-t border-gray-200 p-4">
              {selectedAvatars.length > 0 && (
                <button
                  className="w-full max-w-xs rounded-lg bg-blue-500 py-3 font-bold text-white transition-colors hover:bg-blue-600"
                  onClick={handleShare}
                >
                  Share
                </button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ShareReels;
