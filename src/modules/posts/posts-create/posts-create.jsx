'use client';

import { PhotoIcon } from '@heroicons/react/24/solid';
import { ModalDialog } from '@/src/components/base';
import { useModalStore } from '@/src/stores/modal.store';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Select, SelectItem, Textarea, Spinner } from '@heroui/react';
import PostSwitch from '../_components/post-switch';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';
import { addToast, ToastProvider } from '@heroui/toast';
import { useAuthStore } from '@/src/stores/auth.store';
import { postsCommandApi } from '@/src/apis/posts/command/posts.command.api';
import { hashtagCommandApi } from '@/src/apis/hashtag/command/hashtag.command.api';
import { mediaCommandApi } from '@/src/apis/media/command/media.command.api';
import { useMutation } from '@tanstack/react-query';
import User from './_components/user';
import MediaPreview from '../_components/media-preview';

const PostsCreate = () => {
  const { openModal } = useModalStore();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isLikeVisible, setIsLikeVisible] = useState(false);
  const [isCommentVisible, setIsCommentVisible] = useState(false);
  const [audience, setAudience] = useState('PUBLIC');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const savePostMutation = useMutation({
    mutationFn: postsCommandApi.savedPost,
    onError: (error) => {
      addToast({
        title: 'Post failed',
        description: error.message || 'An error occurred while saving your post.',
        timeout: 3000,
        color: 'danger',
      });
    },
  });

  const insertHashtagsMutation = useMutation({
    mutationFn: hashtagCommandApi.insertHashtags,
    onError: (error) => {
      addToast({
        title: 'Hashtag failed',
        description: error.message || 'Could not save hashtags.',
        timeout: 3000,
        color: 'danger',
      });
    },
  });

  const insertHashtagDetailsMutation = useMutation({
    mutationFn: hashtagCommandApi.insertHashtagDetails,
    onError: (error) => {
      addToast({
        title: 'Hashtag details failed',
        description: error.message || 'Could not link hashtags to post.',
        timeout: 3000,
        color: 'danger',
      });
    },
  });

  const saveMediaMutation = useMutation({
    mutationFn: (media) => mediaCommandApi.savedMedia(media),
    onError: (error) => {
      addToast({
        title: 'Media save failed',
        description: error.message || 'Upload succeeded but media saving failed.',
        timeout: 3000,
        color: 'danger',
      });
    },
  });

  useEffect(() => {
    return () => {
      previews.forEach((file) => URL.revokeObjectURL(file.url));
    };
  }, [previews]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxFiles = 12;
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'video/mp4',
      'video/webm',
    ];

    // Check file count
    if (files.length + selectedFiles.length > maxFiles) {
      addToast({
        title: 'Too many files',
        description: `You can only upload up to ${maxFiles} files.`,
        timeout: 3000,

        color: 'warning',
      });
      return;
    }

    // Validate files
    const validFiles = selectedFiles.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        addToast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported file type.`,
          timeout: 3000,

          color: 'warning',
        });
        return false;
      }

      if (file.size > maxFileSize) {
        addToast({
          title: 'File too large',
          description: `${file.name} exceeds the 10MB size limit.`,
          timeout: 3000,

          color: 'warning',
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    const newPreviews = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
    }));

    setPreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      addToast({
        title: 'No files selected',
        description: 'Please select at least one media file to upload.',
        timeout: 3000,

        color: 'warning',
      });
      return null;
    }

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      return data;
    } catch (error) {
      addToast({
        title: 'Upload failed',
        description: 'Failed to upload media files. Please try again.',
        timeout: 3000,

        color: 'danger',
      });
      return null;
    }
  };

  const handleSave = async () => {
    setLoading(true);

    if (files.length === 0) {
      addToast({
        title: 'No files selected',
        description: 'Please select at least one media file to upload.',
        timeout: 3000,
        color: 'warning',
     
      });
      setLoading(false);
      return;
    }

    try {
      const newPost = {
        captions: caption,
        audience: audience,
        user: user,
        isCommentVisible: isCommentVisible,
        isLikeVisible: isLikeVisible,
        postedAt: new Date().toISOString(),
      };

      const post = await savePostMutation.mutateAsync(newPost);

      // Handle hashtags
      const hashtagList = caption.match(/#[a-zA-Z0-9_]+/g) || [];
      const savedHashtags = hashtagList.length
        ? await insertHashtagsMutation.mutateAsync(hashtagList.map((h) => ({ content: h })))
        : [];

      if (savedHashtags.length > 0) {
        await insertHashtagDetailsMutation.mutateAsync(
          savedHashtags.map((h) => ({
            hashtag: h,
            post: post,
          }))
        );
      }

      // Handle media upload
      const uploadedFiles = await handleUpload();
      if (!uploadedFiles?.files?.length) throw new Error('Failed to upload media');

      const postMedia = uploadedFiles.files.map((file) => ({
        post: post,
        url: file.url,
        fileType: file.file_type,
        size: file.size,
        mediaType: file.media_type.toUpperCase(),
      }));

      await saveMediaMutation.mutateAsync(postMedia);

      // Final success toast
      addToast({
        title: 'Post created!',
        description: 'Your post was published successfully.',
        timeout: 3000,
        color: 'success',
      
      });

      refreshPost();
    } catch (error) {
      addToast({
        title: 'Unexpected Error',
        description: error.message || 'Something went wrong. Please try again.',
        timeout: 3000,
        color: 'danger',
       
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPost = () => {
    setFiles([]);
    setPreviews([]);
    setCaption('');
    setIsCommentVisible(false);
    setIsLikeVisible(false);
    setAudience('PUBLIC');
  };

  const removeFile = (file) => {
    setPreviews((prev) => prev.filter((item) => item.url !== file.url));
    setFiles((prev) => prev.filter((item) => item.url !== file.url));
  };

  return (
    <>
      
      <div className="h-screen overflow-hidden bg-gray-50 dark:bg-neutral-900">
        <div className="mx-auto h-full max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Create New Post
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share your moments with the world
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <ModalDialog
                icon={<ExclamationTriangleIcon className="h-6 w-6 text-red-500" />}
                buttonText="Discard"
                handleClick={refreshPost}
                title="Discard this post?"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  If you leave now, your changes will be lost. Are you sure you want to discard this
                  post?
                </p>
              </ModalDialog>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || files.length === 0}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-white',
                  'bg-indigo-600 hover:bg-indigo-700',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'transition-colors duration-200'
                )}
              >
                {loading ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </div>

          {loading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Spinner
                classNames={{
                  label: 'text-white mt-4 font-medium',
                  base: 'text-white',
                }}
                label="Creating your post..."
                variant="wave"
              />
            </div>
          )}

          <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Media Upload Section */}
            <div className="overflow-y-auto rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <div className="mb-6 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Media</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload photos or videos to share
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500 dark:bg-neutral-700 dark:text-gray-400">
                  {previews.length}/12 files
                </span>
              </div>

              <div
                className={cn(
                  'grid gap-4',
                  previews.length > 0 ? 'grid-cols-2 sm:grid-cols-3' : 'h-[calc(100%-4rem)]'
                )}
              >
                {previews.map((file) => (
                  <MediaPreview key={file.url} file={file} onRemove={removeFile} />
                ))}

                {previews.length < 12 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors',
                      'border-gray-300 dark:border-neutral-600',
                      'hover:border-gray-400 dark:hover:border-neutral-500',
                      'hover:bg-gray-50 dark:hover:bg-neutral-700/50',
                      previews.length === 0 ? 'h-full' : 'aspect-square'
                    )}
                  >
                    <PhotoIcon className="mb-3 h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Click to upload
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png, image/jpeg, image/gif, video/mp4, video/webm"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Post Details Section */}
            <div className="overflow-y-auto rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-neutral-700">
                  <User user={user} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Caption
                  </label>
                  <Textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write your caption here..."
                    minRows={4}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Audience
                  </label>
                  <Select
                    selectedKeys={[audience]}
                    onSelectionChange={(keys) => setAudience(Array.from(keys)[0])}
                    className="w-full"
                  >
                    <SelectItem
                      key="PUBLIC"
                      startContent={<i className="fa-solid fa-earth-asia"></i>}
                    >
                      Public
                    </SelectItem>
                    <SelectItem key="PRIVATE" startContent={<i className="fa-solid fa-lock"></i>}>
                      Private
                    </SelectItem>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Advanced Settings
                  </h3>
                  <PostSwitch
                    onToggle={setIsLikeVisible}
                    title="Hide like and comment counts"
                    subtitle="Keep the focus on your content by hiding engagement metrics"
                  />
                  <PostSwitch
                    onToggle={setIsCommentVisible}
                    title="Turn off commenting"
                    subtitle="Disable comments to control interactions on your post"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostsCreate;
