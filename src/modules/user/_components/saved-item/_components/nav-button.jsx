import Link from "next/link";

const NavButton = ({ iconClass, href = '', content = '', onClick }) => {
  return (
    <Link
      className="flex h-full items-center text-center text-gray-500 transition-colors hover:text-black dark:hover:text-white"
      href={href}
      onClick={onClick}
    >
      <i className={`${iconClass}`}></i>
      <span className="ml-1">{content}</span>
    </Link>
  );
};

export default NavButton;
