import Link from 'next/link';

const NavButton = ({ iconClass, href = '', content = '', onClick }) => {
  return (
    <Link className="flex h-full items-center text-center" href={href} onClick={onClick}>
      <i className={`${iconClass}`}></i>
      <span className="">{content}</span>
    </Link>
  );
};

export default NavButton;
