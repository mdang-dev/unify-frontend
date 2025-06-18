const Skeleton = ({ className, variant = 'rect', width, height, rounded = false }) => {
  return (
    <div
      className={`relative overflow-hidden bg-zinc-200 dark:bg-neutral-800 ${className} ${
        variant === 'circle' ? 'rounded-full' : rounded ? 'rounded-lg' : 'rounded'
      }`}
      style={{ width, height }}
    >
      <div
        className="animate-shimmer absolute inset-0 bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800"
        style={{
          backgroundSize: '200% 100%',
          animation: 'shimmer 2.5s infinite',
        }}
      />
    </div>
  );
};

const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = shimmerStyles;
  document.head.appendChild(styleSheet);
}

export default Skeleton;
