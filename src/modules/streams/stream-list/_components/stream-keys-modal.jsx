'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { ButtonCommon } from '@/src/components/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/src/components/ui/select';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';

export default function StreamKeysModal({ isOpen, onClose }) {
  const [ingressType, setIngressType] = useState('RTMP');
  const [showKey, setShowKey] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');

  const handleGenerate = () => {
    console.log('Generating stream with type:', ingressType);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field === 'url' ? 'Stream URL' : 'Stream key'} copied`);

    setTimeout(() => {
      setCopiedField('');
    }, 10000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stream Info</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Select Type */}
          <div className="space-y-1.5">
            <Label>Select Ingress Type</Label>
            <Select value={ingressType} onValueChange={setIngressType}>
              <SelectTrigger>
                <SelectValue placeholder="Select an input" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RTMP">RTMP</SelectItem>
                <SelectItem value="WHIP">WHIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stream URL */}
          <div className="space-y-1.5">
            <Label htmlFor="url">Stream URL</Label>
            <div className="relative">
              <Input
                id="url"
                value={streamUrl}
                placeholder="Stream Url"
                readOnly
                className="pr-10"
              />
              {copiedField === 'url' ? (
                <Check className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2" />
              ) : (
                <Copy
                  className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-primary"
                  onClick={() => copyToClipboard(streamUrl, 'url')}
                />
              )}
            </div>
          </div>

          {/* Stream Key */}
          <div className="space-y-1.5">
            <Label htmlFor="key">Stream Key</Label>
            <div className="relative">
              <Input
                id="key"
                value={streamKey}
                placeholder="Stream Key"
                type={showKey ? 'text' : 'password'}
                readOnly
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-2">
                {showKey ? (
                  <EyeOff
                    className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-primary"
                    onClick={() => setShowKey(false)}
                  />
                ) : (
                  <Eye
                    className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-primary"
                    onClick={() => setShowKey(true)}
                  />
                )}
                {copiedField === 'key' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy
                    className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-primary"
                    onClick={() => copyToClipboard(streamKey, 'key')}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <ButtonCommon variant="outline" onClick={onClose}>
            Cancel
          </ButtonCommon>
          <ButtonCommon onClick={handleGenerate}>Generate</ButtonCommon>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
