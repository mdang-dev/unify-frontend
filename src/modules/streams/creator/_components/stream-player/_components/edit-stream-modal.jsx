'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { ButtonCommon } from '@/src/components/button';
import { Loader2, Save, X, Upload, ImageIcon } from 'lucide-react';
import { Skeleton } from '@/src/components/base';
import { streamsCommandApi } from '@/src/apis/streams/command/streams.command.api';
import { streamsQueryApi } from '@/src/apis/streams/query/streams.query.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { useAuthStore } from '@/src/stores/auth.store';
import { uploadFiles } from '@/src/utils/upload-files.util';

export default function EditStreamModal({
  isOpen,
  onClose,
  currentTitle = '',
  currentThumbnailUrl = '',
  userId,
}) {
  const t = useTranslations('Streams');
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  
  // Fetch current stream details when modal opens
  const { data: streamDetails, isLoading: isLoadingStreamDetails } = useQuery({
    queryKey: [QUERY_KEYS.STREAM_DETAILS, userId],
    queryFn: () => streamsQueryApi.getStreamDetails(userId),
    enabled: isOpen && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Local state for form values
  const [localData, setLocalData] = useState({
    title: currentTitle,
    thumbnailUrl: currentThumbnailUrl,
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Update local state when stream details are fetched or props change
  useEffect(() => {
    if (streamDetails) {
      setLocalData({
        title: streamDetails.title || currentTitle,
        thumbnailUrl: streamDetails.thumbnailUrl || currentThumbnailUrl,
      });
    } else {
      setLocalData({
        title: currentTitle,
        thumbnailUrl: currentThumbnailUrl,
      });
    }
  }, [streamDetails, currentTitle, currentThumbnailUrl]);

  // Update stream details mutation
  const { mutate: updateStreamDetails, isPending } = useMutation({
    mutationFn: (streamDetails) => streamsCommandApi.updateStreamDetails(userId, streamDetails),
    onSuccess: () => {
      toast.success(t('StreamDetailsUpdated'));
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STREAM_DETAILS, userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE_BY_USERNAME, user?.username] });
      
      onClose();
    },
    onError: (error) => {
      toast.error(t('StreamDetailsUpdateFailed'));
      console.error('Stream details update error:', error);
    },
  });

  const handleSave = async () => {
    if (!userId) {
      toast.error('User ID not found');
      return;
    }

    // If there's a selected file, upload it first
    if (selectedFile) {
      try {
        setIsUploading(true);
        
        // Prepare file object in the format expected by upload-files.util
        const fileObj = {
          file: selectedFile,
          preview: URL.createObjectURL(selectedFile)
        };
        
        const uploadedFiles = await uploadFiles([fileObj]);
        
        if (uploadedFiles && uploadedFiles.length > 0 && uploadedFiles[0].url) {
          const updatedData = {
            ...localData,
            thumbnailUrl: uploadedFiles[0].url,
          };
          updateStreamDetails(updatedData);
        } else {
          toast.error(t('FailedToUploadThumbnail'));
        }
      } catch (error) {
        toast.error(t('FailedToUploadThumbnail'));
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
      }
    } else {
      // No new file, just update with existing data
      updateStreamDetails(localData);
    }
  };

  const handleCancel = () => {
    // Reset to original values from API or props
    if (streamDetails) {
      setLocalData({
        title: streamDetails.title || currentTitle,
        thumbnailUrl: streamDetails.thumbnailUrl || currentThumbnailUrl,
      });
    } else {
      setLocalData({
        title: currentTitle,
        thumbnailUrl: currentThumbnailUrl,
      });
    }
    setSelectedFile(null);
    onClose();
  };

  const handleInputChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setLocalData(prev => ({
          ...prev,
          thumbnailUrl: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      toast.error(t('SelectValidImage'));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const isDisabled = isPending || isUploading || isLoadingStreamDetails;

  // Show loading state while fetching stream details
  if (isLoadingStreamDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('EditStream')}</DialogTitle>
            <DialogDescription>
              {t('LoadingStreamDetails')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Title Input Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Thumbnail Upload Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              
              {/* Current thumbnail skeleton */}
              <Skeleton className="h-32 w-full rounded-lg" />
              
              {/* Upload area skeleton */}
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          </div>

          {/* Buttons Skeleton */}
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
          <DialogTitle>{t('EditStream')}</DialogTitle>
          <DialogDescription>
            {t('UpdateStreamTitleThumbnail')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('StreamTitle')}</Label>
            <Input
              id="title"
              value={localData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={t('EnterStreamTitle')}
              disabled={isDisabled}
            />
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label>{t('ThumbnailImage')}</Label>
            
            {/* Current thumbnail preview */}
            {localData.thumbnailUrl && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                <img
                  src={localData.thumbnailUrl}
                  alt="Current thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* File upload area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isDisabled}
              />
              
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium text-primary">{t('ClickToUpload')}</span> {t('DragAndDrop')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('ImageFormats')}
                </div>
              </div>
            </div>

            {/* Selected file info */}
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>{selectedFile.name}</span>
                <span className="text-xs">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <ButtonCommon
            variant="outline"
            onClick={handleCancel}
            disabled={isDisabled}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            {t('Cancel')}
          </ButtonCommon>
          
          <ButtonCommon
            onClick={handleSave}
            disabled={isDisabled}
            className="flex items-center gap-2"
          >
            {isDisabled ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isUploading ? t('Uploading') : t('UpdatingStream')}
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
