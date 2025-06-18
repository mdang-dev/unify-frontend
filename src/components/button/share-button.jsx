import React, { useState } from 'react';
import { Input } from '../ui/input';
import avatar2 from '@/public/images/testAvt.jpg';
import Image from 'next/image';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';

const ShareButton = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const handleAvatarClick = (index) => {
    setSelectedAvatar(index === selectedAvatar ? null : index);
  };

  return (
    <>
      <button onClick={onOpen} className="bg-transparent text-xl dark:text-white">
        <i className="fa-regular fa-paper-plane"></i>
      </button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex-cols flex">
                <h1 className="text-2xl font-bold">Share</h1>
              </ModalHeader>
              <hr className="bg-gray-200"></hr>
              <ModalBody>
                <div className="mt-4">
                  <Input
                    placeholder={'Search...'}
                    className={`h-11 w-full font-bold dark:border-white`}
                  />
                </div>
                <div className="flex justify-around p-3">
                  {[1, 2, 3, 4].map((_, index) => (
                    <div className="text-center" key={index}>
                      <Image
                        src={avatar2}
                        alt={`avtshare-${index}`}
                        className={`h-20 w-20 cursor-pointer rounded-full ${
                          selectedAvatar === index ? 'ring-4 dark:ring-white' : ''
                        }`}
                        onClick={() => handleAvatarClick(index)}
                      />
                      <p className="mt-2 w-20 truncate text-lg font-bold">Tan Vinh</p>
                      {selectedAvatar === index && (
                        <button className="mt-2 rounded bg-blue-500 px-4 py-2 text-white">
                          Send
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter></ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ShareButton;
