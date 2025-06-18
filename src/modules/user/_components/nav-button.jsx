const { default: Link } = require('next/link');

const NavButton = ({ iconClass, href = '', content = '', onClick }) => {
  return (
    <Link
      className="flex items-center justify-center text-neutral-900 transition-colors hover:text-gray-600 dark:text-white"
      href={href}
      onClick={onClick}
    >
      <i className={`${iconClass} text-lg`}></i>
      {content && <span className="ml-2 text-sm font-medium">{content}</span>}
    </Link>
  );
};

export default NavButton;
