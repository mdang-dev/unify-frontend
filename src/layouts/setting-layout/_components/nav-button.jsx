import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavButton = ({ iconClass, href = '', content = '' }) => {
  const pathname = usePathname();

  return (
    <Link
      className={clsx(
        'group flex h-full w-full items-center rounded-xl px-4 py-3 text-center transition-all duration-200',
        {
          'bg-primary/10 font-medium text-primary': pathname === href,
          'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/50':
            pathname !== href,
        }
      )}
      href={href}
    >
      <i className={`${iconClass} mr-3 text-lg transition-transform group-hover:scale-110`}></i>
      <span className="text-[15px]">{content}</span>
    </Link>
  );
};

export default NavButton;
