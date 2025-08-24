'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Switch } from '@/src/components/ui/switch';
import { Label } from '@/src/components/ui/label';
import { ButtonCommon } from '@/src/components/button';
import { Loader2, Save, X } from 'lucide-react';
import { streamsCommandApi } from '@/src/apis/streams/command/streams.command.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { useAuthStore } from '@/src/stores/auth.store';
import { Skeleton } from '@/src/components/base';

export default function ChatSettingsModal({
  enabled,
  setEnabled,
  delayed,
  setDelayed,
  followersOnly,
  setFollowersOnly,
  isOpen,
  onClose,
  isLoading = false,
}) {
  const t = useTranslations('Streams');
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  
  // Local state for form values with fallback defaults
  const [localSettings, setLocalSettings] = useState({
    isChatEnabled: enabled ?? true,
    isChatDelayed: delayed ?? false,
    isChatFollowersOnly: followersOnly ?? false,
  });

  // Update local state when props change
  useEffect(() => {
    setLocalSettings({
      isChatEnabled: enabled ?? true,
      isChatDelayed: delayed ?? false,
      isChatFollowersOnly: followersOnly ?? false,
    });
  }, [enabled, delayed, followersOnly]);

  // Update chat settings mutation
  const { mutate: updateChatSettings, isPending } = useMutation({
    mutationFn: async (chatSettings) => {
      // Update the settings
      const result = await streamsCommandApi.updateChatSettings(user?.id, chatSettings);
      return result;
    },
    onSuccess: () => {
      toast.success(t('ChatSettingsUpdated'));
      
      // Update local state
      setEnabled(localSettings.isChatEnabled);
      setDelayed(localSettings.isChatDelayed);
      setFollowersOnly(localSettings.isFollowersOnly);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STREAM_CHAT_SETTINGS, user?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LIVE_STREAMS] });
      
      onClose();
    },
    onError: (error) => {
      toast.error(t('ChatSettingsUpdateFailed'));
      console.error('Chat settings update error:', error);
    },
  });

  const handleSave = () => {
    if (!user?.id) {
      toast.error(t('UserNotAuthenticated'));
      return;
    }

    updateChatSettings(localSettings);
  };

  const handleCancel = () => {
    // Reset to original values
    setLocalSettings({
      isChatEnabled: enabled ?? true,
      isChatDelayed: delayed ?? false,
      isChatFollowersOnly: followersOnly ?? false,
    });
    onClose();
  };

  const handleSettingChange = (setting, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

  // Show loading state if settings are still loading
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('ChatSettings')}</DialogTitle>
            <DialogDescription>
              {t('ChatSettingsDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Skeleton for Enable Chat */}
            <div className="flex items-center justify-between rounded-md bg-[#2a2a2a] px-4 py-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-12" />
            </div>

            {/* Skeleton for Delay Chat */}
            <div className="flex items-center justify-between rounded-md bg-[#2a2a2a] px-4 py-3">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-12" />
            </div>

            {/* Skeleton for Followers Only */}
            <div className="flex items-center justify-between rounded-md bg-[#2a2a2a] px-4 py-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>

          {/* Skeleton for buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('ChatSettings')}</DialogTitle>
          <DialogDescription>
            {t('ChatSettingsDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between rounded-md bg-[#2a2a2a] px-4 py-3">
            <Label className="text-base font-medium">{t('EnableChat')}</Label>
            <Switch 
              checked={localSettings.isChatEnabled} 
              onCheckedChange={(value) => handleSettingChange('isChatEnabled', value)} 
            />
          </div>

          <div className="flex items-center justify-between rounded-md bg-[#2a2a2a] px-4 py-3">
            <Label className="text-base font-medium">{t('DelayChat')}</Label>
            <Switch 
              checked={localSettings.isChatDelayed} 
              onCheckedChange={(value) => handleSettingChange('isChatDelayed', value)} 
            />
          </div>

          <div className="flex items-center justify-between rounded-md bg-[#2a2a2a] px-4 py-3">
            <Label className="text-base font-medium">{t('FollowersOnlyChat')}</Label>
            <Switch 
              checked={localSettings.isChatFollowersOnly} 
              onCheckedChange={(value) => handleSettingChange('isChatFollowersOnly', value)} 
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <ButtonCommon
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            {t('Cancel')}
          </ButtonCommon>
          
          <ButtonCommon
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('Updating')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t('SaveChanges')}
              </>
          )}
          </ButtonCommon>
        </div>
      </DialogContent>
    </Dialog>
  );
}
