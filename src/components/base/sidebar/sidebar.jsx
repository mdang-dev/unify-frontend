'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import avatar from '@/public/images/unify_icon_2.svg';
import SearchHorizontalToggle from './_components/search-horizontal-toggle';
import NotificationModal from './_components/notification-modal';
import UnifyLogoIcon from '../unify-logo-icon';
import NavButton from '../../button/nav-button';
import { useAuthStore } from '@/src/stores/auth.store';

const Sidebar = () => {
  const { user } = useAuthStore();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const modalRef = useRef(null);
  const buttonRef = useRef(null);
  const searchComponentRef = useRef(null);
  const toggleRef = useRef(null);
  const [openSearch, setOpenSearch] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const toggleSearch = () => {
    setOpenSearch((prevState) => !prevState);
  };

  const toggleNotification = () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    if (
      modalRef.current &&
      !modalRef.current.contains(event.target) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target)
    ) {
      setIsNotificationOpen(false);
    }
  };

  const handleReload = (e) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.location.reload();
    }
  };

  const handleClickOutsideSearch = (e) => {
    if (
      searchComponentRef.current &&
      !searchComponentRef.current.contains(e.target) &&
      toggleRef.current &&
      !toggleRef.current.contains(e.target)
    ) {
      setOpenSearch(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mousedown', handleClickOutsideSearch);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsNotificationOpen(false);
        setOpenSearch(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!isClient) return null;

  return (
    <SearchHorizontalToggle isOpen={openSearch} searchComponentRef={searchComponentRef}>
      <div className="relative flex flex-row">
        <div className="fixed left-0 top-0 z-50 flex h-screen flex-col border-r-1 border-neutral-400 dark:border-neutral-700">
          <UnifyLogoIcon />
          <NotificationModal
            isNotificationOpen={isNotificationOpen}
            modalRef={modalRef}
            userId={user?.id}
          />
          <ul className="flex w-full grow flex-col justify-center text-2xl">
            <li className="h-16">
              <Link
                title={'Home'}
                href={'/'}
                onClick={handleReload}
                className={`flex h-full w-full items-center text-center transition delay-100 duration-100 ease-in-out hover:bg-[#D9D9D9] dark:hover:bg-neutral-700 dark:hover:text-white`}
              >
                <i className={`fa-solid fa-house w-full`}></i>
              </Link>
            </li>
            <li className="h-16">
              <span onClick={toggleSearch} ref={toggleRef}>
                <NavButton title="Search" href="" iconClass={'fa-solid fa-magnifying-glass'} />
              </span>
            </li>
            <li className="h-16">
              <NavButton title="Explore" href="/explore" iconClass={'fa-solid fa-compass'} />
            </li>
            <li className="h-16">
              <NavButton title="Reels" href="/reels" iconClass={'fa-solid fa-film'} />
            </li>
            <li className="h-16">
              <NavButton
                title="Messages"
                href="/messages"
                iconClass={'fa-brands fa-facebook-messenger'}
              />
            </li>

            <li className="h-16">
              <button
                ref={buttonRef}
                onClick={toggleNotification}
                className="flex h-full w-full items-center text-center transition delay-100 duration-100 ease-in-out hover:bg-[#D9D9D9] dark:hover:bg-neutral-700 dark:hover:text-white"
                title="Notifications"
              >
                <i className="fa-solid fa-bell w-full"></i>
              </button>
            </li>
            <li className="h-16">
              <NavButton
                title="Create post"
                href="/posts"
                iconClass={'fa-regular fa-square-plus'}
              />
            </li>
            <li className="flex h-16 items-center justify-center">
              {user && (
                <Link title="Your profile" href={`/profile/${user.username}`} className="">
                  <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-black dark:border-gray-300">
                    <Image
                      src={user.avatar?.url || avatar}
                      alt="Avatar"
                      width={30}
                      height={30}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Link>
              )}
            </li>
          </ul>
          <Link
            title="Settings"
            className="flex h-20 w-20 items-center text-center text-3xl transition delay-100 duration-100 ease-in-out hover:bg-[#D9D9D9] dark:hover:bg-neutral-700 dark:hover:text-white"
            href="/settings/edit-profile"
          >
            <i className="fa-solid fa-gear w-full"></i>
          </Link>
        </div>
      </div>
    </SearchHorizontalToggle>
  );
};

export default Sidebar;
