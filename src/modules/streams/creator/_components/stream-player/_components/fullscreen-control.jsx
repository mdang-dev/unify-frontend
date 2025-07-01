import { Maximize, Minimize } from 'lucide-react';
import { Hint } from '@/src/components/base';

export default function FullsrceenControl({ isFullscreen, onToggle }) {
  const Icon = isFullscreen ? Minimize : Maximize;

  const label = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';

  return (
    <div className="flex items-center justify-center gap-4">
      <Hint label={label} asChild>
        <button onClick={onToggle} className="hover:white/10 rounded-lg p-1.5 text-white">
          <Icon className="h-5 w-5" />
        </button>
      </Hint>
    </div>
  );
}
