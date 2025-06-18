'use client';
import React, { useState } from 'react';
import UserInfo from './_components/user-info';
import UserPostList from './_components/user-post-list';
import ModalPost from '../modal-post';

const ModalUser = ({ report, isOpen, onClose }) => {
  const [selectedPost, setSelectedPost] = useState(null);

  if (!isOpen || !report || !report.reportedEntity) return null;

  const { reportedEntity } = report;

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const closePostModal = () => {
    setSelectedPost(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 dark:text-zinc-300">
      <div className="relative flex h-[600px] w-[1000px] flex-row overflow-hidden rounded-lg bg-zinc-200 dark:bg-neutral-900">
        <div className="no-scrollbar w-1/2 overflow-y-auto border-r-1 border-r-zinc-400 p-6 dark:border-r-neutral-800">
          <UserInfo user={reportedEntity} />
          <div className="mt-4 space-y-2 border-t pt-4 dark:border-t-neutral-800">
            <h3 className="text-lg font-semibold">Report Details</h3>
            <p className="text-sm">
              <span className="font-semibold">Reported by:</span> {report.user?.username}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Reported at:</span>{' '}
              {new Date(report.reportedAt).toLocaleString()}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Status:</span> Pending
            </p>
          </div>
        </div>

        <div className="w-1/2 p-6">
          <UserPostList userId={reportedEntity.id} onPostClick={handlePostClick} />
        </div>

        <button
          onClick={onClose}
          className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        {selectedPost && (
          <ModalPost
            report={{ reportedEntity: selectedPost }}
            isOpen={true}
            onClose={closePostModal}
          />
        )}
      </div>
    </div>
  );
};

export default ModalUser;
