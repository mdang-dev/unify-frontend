const Title = ({ content = '' }) => {
  return (
    <p className="my-4 text-sm font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
      {content}
    </p>
  );
};

export default Title;
