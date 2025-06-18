'use client';

import { PhotoIcon } from '@heroicons/react/24/solid';
import { ModalDialog } from '@/src/components/base';
import { useModalStore } from '@/src/stores/modal.store';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Select, SelectItem, Textarea } from '@heroui/react';
import PostSwitch from '../_components/post-switch';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';
import { addToast, ToastProvider } from '@heroui/toast';
import { redirect, useParams } from 'next/navigation';
import { Spinner } from '@heroui/react';
import MediaPreview from '../_components/media-preview';
import User from './_components/user';
import { useAuthStore } from '@/src/stores/auth.store';
import { useMutation, useQuery } from '@tanstack/react-query';
import { postsCommandApi } from '@/src/apis/posts/command/posts.command.api';
import { hashtagCommandApi } from '@/src/apis/hashtag/command/hashtag.command.api';
import { mediaCommandApi } from '@/src/apis/media/command/media.command.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';

const PostsUpdate = () => {
  const { openModal } = useModalStore();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isLikeVisible, setIsLikeVisible] = useState(false);
  const [isCommentVisible, setIsCommentVisible] = useState(false);
  const [audience, setAudience] = useState('PUBLIC');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  const { postId } = useParams();
  const [existingFiles, setExistingFiles] = useState([]);
  const { user } = useAuthStore();

  const updatePostMutation = useMutation({
    mutationFn: postsCommandApi.updatePost,
    onError: (error) => {
      addToast({
        title: 'Post failed',
        description: error.message || 'An error occurred while update your post.',
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

  const { data: exitingPosts } = useQuery({
    queryKey: [QUERY_KEYS.POST, postId],
    queryFn: () => postsQueryApi.getPostsById(postId),
    enabled: !!postId,
  });

  useEffect(() => {
    if (exitingPosts) {
      setPost(exitingPosts);
      setPreviews(exitingPosts?.media);
      setCaption(exitingPosts?.captions);
      setAudience(exitingPosts?.audience);
      setIsCommentVisible(exitingPosts?.isCommentVisible);
      setIsLikeVisible(exitingPosts?.isLikeVisible);

      const eFiles = exitingPosts?.media.map((m) => ({
        url: m.url,
        file_type: m.fileType,
        size: m.size,
        media_type: m.mediaType,
      }));
      setExistingFiles([...eFiles]);
      setLoading(false);
    }
  }, [exitingPosts]);

  useEffect(() => {
    handleCommentVisibility(isCommentVisible);
    handleLikeVisibility(isLikeVisible);
  }, [isCommentVisible, isLikeVisible]);

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const handleAudienceChange = (keys) => {
    const selectedValue = Array.from(keys)[0];
    setAudience(selectedValue);
  };

  const handleLikeVisibility = (newValue) => {
    setIsLikeVisible(newValue);
  };

  const handleCommentVisibility = (newValue) => {
    setIsCommentVisible(newValue);
  };

  function handleClick() {
    refreshPost();
    redirect(`/profile/${user.username}`);
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'video/mp4',
      'video/webm',
    ];
    const validFiles = selectedFiles.filter((file) => allowedTypes.includes(file.type));

    if (validFiles.length === 0) {
      alert('Only images (png, jpeg, jpg, gif) and videos (mp4, webm) are allowed.');
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    const newPreviews = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
    }));

    setPreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
  };

  useEffect(() => {
    return () => {
      previews.forEach((file) => URL.revokeObjectURL(file.url));
    };
  }, [previews]);

  const handleUpload = async () => {
    if (files.length === 0 && existingFiles.length === 0) {
      addToast({
        title: 'No files uploaded',
        description: 'Please upload at least one media file (image/video).',
        timeout: 3000,
        color: 'warning',
      });
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    return data;
  };

  const refreshPost = () => {
    setFiles([]);
    setPreviews([]);
    setCaption('');
    setIsCommentVisible(false);
    setIsLikeVisible(false);
    setAudience('PUBLIC');
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validate media
      if (files.length === 0 && existingFiles.length === 0) {
        addToast({
          title: 'No files uploaded',
          description: 'Please upload at least one media file (image/video).',
          timeout: 3000,

          color: 'warning',
        });
        return;
      }

      // Extract hashtags from caption
      const hashtagList = caption
        .toString()
        .split(/(\#[a-zA-Z0-9_]+)/g)
        .filter((word) => word.startsWith('#'));

      if (hashtagList.length > 0) {
        const newHashtags = hashtagList.map((h) => ({ content: h }));

        const savedHashtags = await insertHashtagsMutation.mutateAsync(newHashtags);
        if (!savedHashtags) return;

        const hashtagDetails = savedHashtags.map((h) => ({
          hashtag: h,
          post: post,
        }));

        if (hashtagDetails.length > 0) {
          const savedDetails = await insertHashtagDetailsMutation.mutateAsync(hashtagDetails);
          if (!savedDetails) return;
        }
      }

      const fetchedFiles = await handleUpload();

      let savedMedia = [];
      if (fetchedFiles?.files?.length > 0) {
        const newMedia = fetchedFiles.files.map((file) => ({
          post: post,
          url: file.url,
          fileType: file.file_type,
          size: file.size,
          mediaType: file.media_type.toUpperCase(),
        }));

        savedMedia = await saveMediaMutation.mutateAsync(newMedia);
      }

      const finalMedia = [...savedMedia, ...existingFiles];

      const newPost = {
        ...post,
        captions: caption,
        audience: audience,
        isCommentVisible: isCommentVisible,
        isLikeVisible: isLikeVisible,
        media: finalMedia,
      };

      const updatedPost = await updatePostMutation.mutateAsync(newPost);
      if (!updatedPost) return;

      addToast({
        title: 'Success',
        description:
          'Your post is updated successfully. Other users can now interact with your post.',
        timeout: 3000,
        color: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Encountered an error',
        description: 'Error: ' + error.message || error,
        timeout: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (value) => {
    setPreviews((prevPreviews) => prevPreviews.filter((item) => item.url !== value.url));
    setFiles((prevFiles) => prevFiles.filter((item) => item.url !== value.url));
    setExistingFiles((prevFiles) => prevFiles.filter((item) => item.url !== value.url));
  };

  useEffect(() => {
    console.log('Updated existingFiles:', existingFiles);
  }, [existingFiles]);

  return (
    <>
    
      <div className="h-screen overflow-hidden bg-gray-50 dark:bg-neutral-900">
        <div className="mx-auto h-full max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Post</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your post details</p>
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
                title="Discard changes?"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  If you leave now, your changes will be lost. Are you sure you want to discard
                  editing this post?
                </p>
              </ModalDialog>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || (files.length === 0 && existingFiles.length === 0)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-white',
                  'bg-indigo-600 hover:bg-indigo-700',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'transition-colors duration-200'
                )}
              >
                {loading ? 'Saving...' : 'Save Changes'}
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
                label="Saving your post..."
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
                    isOn={isLikeVisible}
                  />
                  <PostSwitch
                    onToggle={setIsCommentVisible}
                    title="Turn off commenting"
                    subtitle="Disable comments to control interactions on your post"
                    isOn={isCommentVisible}
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

export default PostsUpdate;
