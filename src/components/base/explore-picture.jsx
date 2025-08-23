'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import iconImg from '@/public/imgs.svg';
import iconHeart from '@/public/heart.svg';
import iconComment from '@/public/comment.svg';
import testImg from '@/public/images/testAvt.jpg';
import PostDetailModal from './post-detail-modal/post-detail-modal';

export default function Picture({ post, url }) {
  const [isModalVisible, setModalVisible] = useState(false);

  // Early return if post is not provided
  if (!post) {
    console.warn('Picture: post prop is missing');
    return (
      <div className="flex h-72 w-72 items-center justify-center bg-gray-200 dark:bg-gray-700">
        <p className="text-gray-500 dark:text-gray-400">Post data unavailable</p>
      </div>
    );
  }

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  return (
    <>
      <div
        onClick={toggleModal}
        className={'group/item h-72 w-72 cursor-pointer p-3 hover:bg-opacity-95'}
        style={{
          backgroundImage: `url(${url ? url : testImg.src})`,
          backgroundPosition: 'center',
          backgroundSize: '100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Image 
          src={iconImg} 
          width={24} 
          height={18} 
          alt={'iconImg'} 
          className={'float-right'} 
        />
        <div
          className={
            'group/edit invisible float-left grid h-full place-content-end text-white group-hover/item:visible'
          }
        >
          <div className={'mb-2'}>
            <Image src={iconHeart} width={20} height={20} alt={'Like'} />
            <p className={'ml-1 text-lg font-bold'}>{post?.likeCount || 0}</p>
          </div>
          <div className={'mt-2'}>
            <Image src={iconComment} width={20} height={20} alt={'comment'} />
            <p className={'ml-1 text-lg font-bold'}>{post?.commentCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Use the existing PostDetailModal component */}
      {isModalVisible && (
        <PostDetailModal
          post={post}
          onClose={toggleModal}
          onArchive={() => {}}
          onDelete={() => {}}
        />
      )}
    </>
  );
}
