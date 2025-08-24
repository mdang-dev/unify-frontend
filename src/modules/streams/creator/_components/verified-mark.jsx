import { Check } from 'lucide-react';

export default function VerifiedMark() {
  return (
    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 p-0.5">
      <Check className="h-4 w-[10px] stroke-[4px] text-primary" />
    </div>
  );
}
