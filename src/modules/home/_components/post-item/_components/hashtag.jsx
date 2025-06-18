import Link from 'next/link';

const Hashtag = ({ content }) => (
  <Link
    href={`/explore/${content}`}
    className="mr-2.5 text-sm text-blue-500 transition-colors hover:underline dark:text-blue-400"
  >
    {content}
  </Link>
);

export default Hashtag;
