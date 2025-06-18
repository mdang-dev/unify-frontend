import Link from 'next/link';
import React from 'react';

const NavButton = ({ iconClass, href = '', title = '', text = '' }) => {
  return (
    <Link
      title={title}
      href={href}
      className={`flex h-10 w-full items-center rounded-md transition delay-100 duration-300 ease-in-out hover:font-bold`}
    >
      <i className={`${iconClass} w-1/5 text-center`}></i> {text}
    </Link>
  );
};

export default NavButton;
