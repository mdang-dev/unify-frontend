'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import iconImg from '@/public/imgs.svg';
import iconHeart from '@/public/heart.svg';
import iconComment from '@/public/comment.svg';
import testImg from '@/public/images/testAvt.jpg';
import avatar from '@/public/images/avt.jpg';
import Link from 'next/link';
import HeartButton from '../button/heart-button';
import CommentButton from './comment-button';
import { Bookmark, Slider, CommentBox } from '.';
import { FollowButton, ShareButton } from '../button';
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Picture({ post, url }) {
  const [isModalVisible, setModalVisible] = useState(false);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const popupRef = useRef(null);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const togglePopup = () => {
    setPopupVisible(!isPopupVisible);
  };

  useEffect(() => {
    const handleClickOver = (event) => {
      if (isPopupVisible && popupRef.current && !popupRef.current.contains(event.target)) {
        setPopupVisible(false);
      }
    };
    document.addEventListener('click', handleClickOver);
    return () => {
      document.removeEventListener('click', handleClickOver);
    };
  }, [isPopupVisible]);

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
        <Image src={iconImg} width={24} height={18} alt={'iconImg'} className={'float-right'} />
        <div
          className={
            'group/edit invisible float-left grid h-full place-content-end text-white group-hover/item:visible'
          }
        >
          <div className={'mb-2'}>
            <Image src={iconHeart} width={20} height={20} alt={'Like'} />
            <p className={'ml-1 text-lg font-bold'}>0</p>
          </div>
          <div className={'mt-2'}>
            <Image src={iconComment} width={20} height={20} alt={'comment'} />
            <p className={'ml-1 text-lg font-bold'}>0</p>
          </div>
        </div>
      </div>

      {isModalVisible && (
        <div
          className={'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'}
        >
          <div className="flex h-[710px] bg-white shadow-lg">
            <div className="flex w-[450px] border-r" alt="img">
              {/* <Image src={url ? url : testImg} width={100} height={100} className={"w-[568px] my-auto"} alt="PostImage" /> */}
              <Slider srcs={post.media} />
            </div>
            <div className={'flex w-[500] flex-col justify-between dark:bg-black dark:text-white'}>
              <div
                className={
                  'flex h-[60px] items-center justify-between rounded-lg border-b border-l px-4 py-3'
                }
              >
                <div className={'flex items-center gap-3'}>
                  <Image src={avatar} className={'size-10 rounded-full text-lg'} alt="" />
                  <b>Username</b>
                  <p className="text-xl">•</p>
                  {/* <Link href="#" className={"font-bold text-blue-600"}>
                    Follow
                  </Link> */}
                  <FollowButton
                    classFollow="font-bold text-md text-blue-600 border-none bg-transparent rounded-none p-0 h-fit justify-start"
                    classFollowing="font-bold text-md border-none bg-transparent text-gray-600 rounded-none p-0 h-fit justify-start"
                  />
                </div>
                <div className="flex">
                  <i
                    className="fas fa-ellipsis-h transition hover:cursor-pointer hover:opacity-75"
                    onClick={togglePopup}
                  ></i>
                  {isPopupVisible && (
                    <div
                      ref={popupRef}
                      className={`${
                        isPopupVisible ? 'animate-fadeInCenter' : 'animate-fadeOutCenter'
                      } fixed inset-0 z-50 flex transform items-center justify-center bg-black bg-opacity-50`}
                      onClick={() => setPopupVisible(false)}
                    >
                      <div
                        className="w-[400px] rounded-3xl bg-zinc-800 py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ul className="text-sm">
                          <li className="cursor-pointer border-b border-gray-600 py-3 text-center font-bold text-red-500 last:border-0">
                            Report
                          </li>
                          <li className="cursor-pointer border-b border-gray-600 py-3 text-center font-bold text-white last:border-0">
                            Go to post
                          </li>
                          <li className="cursor-pointer border-b border-gray-600 py-3 text-center font-bold text-white last:border-0">
                            Share to...
                          </li>
                          <li className="cursor-pointer border-b border-gray-600 py-3 text-center font-bold text-white last:border-0">
                            Copy link
                          </li>
                          <li className="cursor-pointer border-b border-gray-600 py-3 text-center font-bold text-white last:border-0">
                            Embed
                          </li>
                          <li className="cursor-pointer border-b border-gray-600 py-3 text-center font-bold text-white last:border-0">
                            About this account
                          </li>
                          <li className="cursor-pointer border-b border-gray-600 py-3 text-center font-bold text-white last:border-0">
                            Cancel
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div
                className={'flex h-[510px] flex-col gap-4 overflow-auto border-l p-4'}
                alt="commentBox"
              >
                <div className={'flex items-center'}>
                  <Image src={avatar} className={'size-10 rounded-full text-lg'} alt="" />
                  <div className="ml-4 grid grid-rows-2">
                    <div className="flex gap-1">
                      <h6 className="font-bold">@tagname</h6>
                      <p>comment</p>
                    </div>
                    <div className="flex items-end gap-3">
                      <small className="text-gray-400">6d</small>
                      <Link href={'#'}>
                        <small className="font-bold text-gray-400">15 likes</small>
                      </Link>
                      <Link href={'#'}>
                        <small className="font-bold text-gray-400">Reply</small>
                      </Link>
                      <Link href={'#'}>
                        <small className="font-bold text-gray-400">See translation</small>
                      </Link>
                      <Link href={'#'} className="opacity-75 hover:opacity-100">
                        <small>
                          <i className="fas fa-ellipsis-h"></i>
                        </small>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className={'h-[98px] border-l border-t px-2 pb-3 pt-1'} alt="actionBox">
                <div className="flex justify-between">
                  <div className="flex gap-1">
                    <HeartButton className="p-1 !text-[22px]" />
                    <CommentButton className="p-1 !text-[22px]" />
                    <ShareButton className="p-1 !text-[22px]" />
                  </div>
                  <Bookmark className="p-1 !text-[22px]" />
                </div>
                <div className="flex flex-col pl-2">
                  <strong>1000 likes</strong>
                  <small className="text-gray-400">2 days ago</small>
                </div>
              </div>
              <div className={'h-[56px] border-l border-t px-3 pt-1'}>
                <CommentBox />
              </div>
            </div>
          </div>
          <button
            onClick={toggleModal}
            className="absolute right-3 top-3 text-4xl text-gray-200 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
}
