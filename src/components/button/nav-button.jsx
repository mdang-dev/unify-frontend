import Link from 'next/link';
import React from 'react';

const NavButton = React.memo(function NavButton({ iconClass, href = '', title = '' }) {
  return (
    <Link
      title={title}
      href={href}
      // className={`w-full dark:hover:text-black dark:hover:bg-gray-200 flex h-full items-center text-center transition delay-100 ease-in-out duration-100 hover:bg-[#D9D9D9]`}
      className={`flex h-full w-full items-center text-center transition delay-100 duration-100 ease-in-out hover:bg-[#D9D9D9] dark:hover:bg-neutral-700 dark:hover:text-white`}
    >
      <i className={`${iconClass} w-full`}></i>
    </Link>
  );
});

export default NavButton;
