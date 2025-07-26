'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog';
import { Switch } from '@/src/components/ui/switch';
import { Label } from '@/src/components/ui/label';

export default function ChatSettingsModal({
  enabled,
  setEnabled,
  delayed,
  setDelayed,
  followersOnly,
  setFollowersOnly,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md bg-[#2a2a2a] px-4 py-3">
        <Label className="text-base font-medium">Enable chat</Label>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className="flex items-center justify-between rounded-md bg-[#2a2a2a] px-4 py-3">
        <Label className="text-base font-medium">Delay chat</Label>
        <Switch checked={delayed} onCheckedChange={setDelayed} />
      </div>

      <div className="flex items-center justify-between rounded-md bg-[#2a2a2a] px-4 py-3">
        <Label className="text-base font-medium">Must be following to chat</Label>
        <Switch checked={followersOnly} onCheckedChange={setFollowersOnly} />
      </div>
    </div>
  );
}
