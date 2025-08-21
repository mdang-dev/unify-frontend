'use client';

import { PhotoIcon } from '@heroicons/react/24/solid';
import { ModalDialog } from '@/src/components/base';
import { useModalStore } from '@/src/stores/modal.store';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Spinner, Textarea } from '@heroui/react';
import {
  Select as ShSelect,
  SelectTrigger as ShSelectTrigger,
  SelectContent as ShSelectContent,
  SelectItem as ShSelectItem,
  SelectValue as ShSelectValue,
} from '@/src/components/ui/select';
import { Textarea as ShTextarea } from '@/src/components/ui/textarea';
import PostSwitch from '../_components/post-switch';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/src/stores/auth.store';
import { postsCommandApi } from '@/src/apis/posts/command/posts.command.api';
import { hashtagCommandApi } from '@/src/apis/hashtag/command/hashtag.command.api';
import { mediaCommandApi } from '@/src/apis/media/command/media.command.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import User from './_components/user';
import MediaPreview from '../_components/media-preview';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';

const PostsCreate = () => {
  const { openModal } = useModalStore();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isLikeVisible, setIsLikeVisible] = useState(false);
  const [isCommentVisible, setIsCommentVisible] = useState(false);
  const [audience, setAudience] = useState('PUBLIC');
  const [caption, setCaption] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const savePostMutation = useMutation({
    mutationFn: postsCommandApi.savedPost,
    onError: (error) => {
      toast.error('Post failed', {
        description: error.message || 'An error occurred while saving your post.',
        duration: 3000,
      });
    },
  });

  const insertHashtagsMutation = useMutation({
    mutationFn: hashtagCommandApi.insertHashtags,
    onError: (error) => {
      toast.error('Hashtag failed', {
        description: error.message || 'Could not save hashtags.',
        duration: 3000,
      });
    },
  });

  const insertHashtagDetailsMutation = useMutation({
    mutationFn: hashtagCommandApi.insertHashtagDetails,
    onError: (error) => {
      toast.error('Hashtag details failed', {
        description: error.message || 'Could not link hashtags to post.',
        duration: 3000,
      });
    },
  });

  const saveMediaMutation = useMutation({
    mutationFn: (media) => mediaCommandApi.savedMedia(media),
    onError: (error) => {
      toast.error('Media save failed', {
        description: error.message || 'Upload succeeded but media saving failed.',
        duration: 3000,
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
      toast.warning('Too many files', {
        description: `You can only upload up to ${maxFiles} files.`,
        duration: 3000,
      });
      return;
    }

    // Validate files
    const validFiles = selectedFiles.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.warning('Invalid file type', {
          description: `${file.name} is not a supported file type.`,
          duration: 3000,
        });
        return false;
      }

      if (file.size > maxFileSize) {
        toast.warning('File too large', {
          description: `${file.name} exceeds the 10MB size limit.`,
          duration: 3000,
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
      toast.warning('No files selected', {
        description: 'Please select at least one media file to upload.',
        duration: 3000,
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
      toast.error('Upload failed', {
        description: 'Failed to upload media files. Please try again.',
        duration: 3000,
      });
      return null;
    }
  };

  const handleSave = async () => {
    setLoading(true);

    if (files.length === 0) {
      toast.warning('No files selected', {
        description: 'Please select at least one media file to upload.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    try {
      // Handle media upload first
      const uploadedFiles = await handleUpload();
      if (!uploadedFiles?.files?.length) throw new Error('Failed to upload media');

      const postMedia = uploadedFiles.files.map((file) => ({
        url: file.url,
        fileType: file.file_type,
        size: file.size,
        mediaType: file.media_type.toUpperCase(),
      }));

      const newPost = {
        captions: caption,
        audience: audience,
        user: user,
        isCommentVisible: isCommentVisible,
        isLikeVisible: isLikeVisible,
        postedAt: new Date().toISOString(),
        media: postMedia, // Include media directly in the post object
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

      // Final success toast
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTS_BY_USER, post?.user?.id] });
      toast.success('Post created!', {
        description: 'Your post was published successfully.',
        duration: 3000,
      });

      refreshPost();
    } catch (error) {
      toast.error('Unexpected Error', {
        description: error.message || 'Something went wrong. Please try again.',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPost = () => {
    setFiles([]);
    setPreviews([]);
    setCaption('');
    setPrompt('');
    setIsCommentVisible(false);
    setIsLikeVisible(false);
    setAudience('PUBLIC');
  };

  const removeFile = (file) => {
    // Find the index of the file in previews
    const previewIndex = previews.findIndex((item) => item.url === file.url);

    if (previewIndex !== -1) {
      // Remove from both arrays using the same index
      setPreviews((prev) => prev.filter((_, index) => index !== previewIndex));
      setFiles((prev) => prev.filter((_, index) => index !== previewIndex));
    }
  };

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) {
      return;
    }

    setPromptLoading(true);
    try {
      const response = await fetch(`https://unify-social-media.app.n8n.cloud/webhook/generate-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Clear previous AI-generated data before processing new data
      setCaption('');
      setAudience('PUBLIC');
      setIsCommentVisible(false);
      setIsLikeVisible(false);
      // Clear previous AI-generated images
      const aiGeneratedIndices = [];
      files.forEach((file, index) => {
        if (file.name && file.name.includes('ai-generated-image')) {
          aiGeneratedIndices.push(index);
        }
      });
      // Remove AI-generated images in reverse order to maintain correct indices
      aiGeneratedIndices.reverse().forEach((index) => {
        setPreviews((prev) => prev.filter((_, i) => i !== index));
        setFiles((prev) => prev.filter((_, i) => i !== index));
      });

      // Handle the new response format with array structure
      if (Array.isArray(data) && data.length > 0) {
        // Find the parse action response
        const parseAction = data.find((item) => item.action === 'parse');
        if (parseAction && parseAction.response && parseAction.response.output) {
          const responseData = parseAction.response.output;

          // Update caption if provided
          if (responseData.captions) {
            setCaption(responseData.captions);
          }

          // Update audience if provided
          if (responseData.audience) {
            setAudience(responseData.audience);
          }

          // Update comment visibility if provided
          if (typeof responseData.isCommentVisible === 'boolean') {
            setIsCommentVisible(!responseData.isCommentVisible); // Invert because our state is "turn off commenting"
          }

          // Update like visibility if provided
          if (typeof responseData.isLikeVisible === 'boolean') {
            setIsLikeVisible(!responseData.isLikeVisible); // Invert because our state is "hide like counts"
          }

          // Handle imageUrls array if provided
          if (responseData.imageUrls && Array.isArray(responseData.imageUrls)) {
            try {
              await addMultipleImagesFromUrls(responseData.imageUrls, 'ai-generated-image');
            } catch (error) {
              console.error('Failed to add AI-generated images:', error);
              toast.warning('Images failed', {
                description: 'AI suggested images but failed to add them to your post.',
                duration: 3000,
              });
            }
          }
          // Handle single imageUrl for backward compatibility
          else if (responseData.imageUrl) {
            try {
              await addImageFromUrl(responseData.imageUrl, 'ai-generated-image.jpg');
            } catch (error) {
              console.error('Failed to add AI-generated image:', error);
              toast.warning('Image failed', {
                description: 'AI suggested an image but failed to add it to your post.',
                duration: 3000,
              });
            }
          }
        } else {
          toast.warning('Invalid response format', {
            description: 'Received unexpected response format from AI service.',
            duration: 3000,
          });
        }
      } else if (data && typeof data === 'object') {
        // Handle legacy response format for backward compatibility
        let responseData = data;
        if (data.output && typeof data.output === 'object') {
          responseData = data.output;
        }

        // Update caption if provided
        if (responseData.captions) {
          setCaption(responseData.captions);
        }

        // Update audience if provided
        if (responseData.audience) {
          setAudience(responseData.audience);
        }

        // Update comment visibility if provided
        if (typeof responseData.isCommentVisible === 'boolean') {
          setIsCommentVisible(!responseData.isCommentVisible);
        }

        // Update like visibility if provided
        if (typeof responseData.isLikeVisible === 'boolean') {
          setIsLikeVisible(!responseData.isLikeVisible);
        }

        // Handle imageUrls array if provided
        if (responseData.imageUrls && Array.isArray(responseData.imageUrls)) {
          try {
            await addMultipleImagesFromUrls(responseData.imageUrls, 'ai-generated-image');
          } catch (error) {
            console.error('Failed to add AI-generated images:', error);
            addToast({
              title: 'Images failed',
              description: 'AI suggested images but failed to add them to your post.',
              timeout: 3000,
              color: 'warning',
            });
          }
        }
        // Handle single imageUrl for backward compatibility
        else if (responseData.imageUrl) {
          try {
            await addImageFromUrl(responseData.imageUrl, 'ai-generated-image.jpg');
          } catch (error) {
            console.error('Failed to add AI-generated image:', error);
            addToast({
              title: 'Image failed',
              description: 'AI suggested an image but failed to add it to your post.',
              timeout: 3000,
              color: 'warning',
            });
          }
        }
      } else {
        toast.success('Prompt processed', {
          description: 'Your prompt has been processed.',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error sending prompt:', error);
      toast.error('Prompt failed', {
        description: error.message || 'Failed to send prompt. Please try again.',
        duration: 3000,
      });
    } finally {
      setPromptLoading(false);
    }
  };

  const handlePromptKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit();
    }
  };

  const convertBase64ToFile = (base64String, filename = 'image.jpg', mimeType = 'image/jpeg') => {
    try {
      // Remove data URL prefix if present
      const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');

      // Convert base64 to binary
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      // Create File object
      const file = new File([byteArray], filename, { type: mimeType });

      return file;
    } catch (error) {
      toast.error('Conversion failed', {
        description: 'Failed to convert base64 image to file.',
        duration: 3000,
      });
      return null;
    }
  };

  const addBase64Image = (base64String, filename = 'image.jpg', mimeType = 'image/jpeg') => {
    const maxFiles = 12;
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    // Check file count
    if (files.length >= maxFiles) {
      toast.warning('Too many files', {
        description: `You can only upload up to ${maxFiles} files.`,
        duration: 3000,
      });
      return;
    }

    // Convert base64 to File object
    const file = convertBase64ToFile(base64String, filename, mimeType);
    if (!file) return;

    // Check file size
    if (file.size > maxFileSize) {
      toast.warning('File too large', {
        description: `${filename} exceeds the 10MB size limit.`,
        duration: 3000,
      });
      return;
    }

    // Add file to state
    setFiles((prevFiles) => [...prevFiles, file]);

    // Create preview
    const newPreview = {
      url: URL.createObjectURL(file),
      type: file.type,
    };

    setPreviews((prevPreviews) => [...prevPreviews, newPreview]);
  };

  const addMultipleBase64Images = (base64Array, filenamePrefix = 'image') => {
    const maxFiles = 12;
    const remainingSlots = maxFiles - files.length;

    if (base64Array.length === 0) return;

    // Limit the number of images that can be added
    const imagesToAdd = base64Array.slice(0, remainingSlots);

    if (imagesToAdd.length < base64Array.length) {
      toast.warning('Some images skipped', {
        description: `Only ${remainingSlots} images were added due to file limit.`,
        duration: 3000,
      });
    }

    imagesToAdd.forEach((base64String, index) => {
      const filename = `${filenamePrefix}_${index + 1}.jpg`;
      addBase64Image(base64String, filename);
    });
  };

  const convertUrlToBase64 = async (imageUrl, filename = 'image.jpg', mimeType = 'image/jpeg') => {
    try {
      // Create a canvas to draw the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Create a new image object
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Handle CORS issues

      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Set canvas dimensions to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image on canvas
            ctx.drawImage(img, 0, 0);

            // Convert canvas to base64
            const base64String = canvas.toDataURL(mimeType, 0.8); // 0.8 quality for smaller size

            resolve(base64String);
          } catch (error) {
            reject(new Error('Failed to convert image to base64'));
          }
        };

        img.onerror = () => {
          reject(new Error('Failed to load image from URL'));
        };

        // Set source to trigger loading
        img.src = imageUrl;
      });
    } catch (error) {
      toast.error('Conversion failed', {
        description: 'Failed to convert image URL to base64.',
        duration: 3000,
      });
      return null;
    }
  };

  const addImageFromUrl = async (imageUrl, filename = 'image.jpg', mimeType = 'image/jpeg') => {
    try {
      const base64String = await convertUrlToBase64(imageUrl, filename, mimeType);
      if (base64String) {
        addBase64Image(base64String, filename, mimeType);
      }
    } catch (error) {
      toast.error('URL conversion failed', {
        description: error.message || 'Failed to process image from URL.',
        duration: 3000,
      });
    }
  };

  const addMultipleImagesFromUrls = async (urlArray, filenamePrefix = 'image') => {
    const maxFiles = 12;
    const remainingSlots = maxFiles - files.length;

    if (urlArray.length === 0) return;

    // Limit the number of images that can be added
    const imagesToAdd = urlArray.slice(0, remainingSlots);

    if (imagesToAdd.length < urlArray.length) {
      addToast({
        title: 'Some images skipped',
        description: `Only ${remainingSlots} images were added due to file limit.`,
        timeout: 3000,
        color: 'warning',
      });
    }

    // Process images sequentially to avoid overwhelming the browser
    for (let i = 0; i < imagesToAdd.length; i++) {
      const url = imagesToAdd[i];
      const filename = `${filenamePrefix}_${i + 1}.jpg`;

      try {
        await addImageFromUrl(url, filename);
        // Small delay to prevent overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to process image ${i + 1}:`, error);
      }
    }
  };

  const handleExamplePrompt = (examplePrompt) => {
    setPrompt(examplePrompt);
    // Only fill the prompt box, don't auto-submit
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
                  'rounded-lg px-4 py-2 text-sm font-medium',
                  'bg-neutral-800 text-white hover:bg-zinc-200 hover:text-neutral-800',
                  'dark:bg-zinc-200 dark:text-neutral-800 dark:hover:bg-neutral-400 dark:hover:text-white',
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
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500 dark:bg-neutral-700 dark:text-gray-300">
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

                {/* AI Prompt Section - Above Caption */}
                <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-3 shadow-sm dark:from-purple-900/20 dark:to-blue-900/20">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                      <i className="fa-solid fa-robot text-xs text-white"></i>
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      AI Assistant
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyPress={handlePromptKeyPress}
                      placeholder="Ask AI for help with your post..."
                      minRows={1}
                      className="flex-1"
                      disabled={promptLoading}
                      classNames={{
                        input: 'bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm text-xs',
                        inputWrapper:
                          'border border-transparent bg-gradient-to-r from-purple-200/50 to-blue-200/50 dark:from-purple-700/30 dark:to-blue-700/30 backdrop-blur-sm hover:from-purple-300/50 hover:to-blue-300/50 dark:hover:from-purple-600/30 dark:hover:to-blue-600/30 transition-all duration-300',
                      }}
                    />
                    <button
                      onClick={handlePromptSubmit}
                      disabled={promptLoading || !prompt.trim()}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl',
                        'bg-gradient-to-r from-purple-500 to-blue-500 text-white',
                        'hover:from-purple-600 hover:to-blue-600',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'shadow-sm transition-all duration-300 hover:shadow-md',
                        'transform hover:scale-105 active:scale-95'
                      )}
                    >
                      {promptLoading ? (
                        <Spinner size="sm" color="white" />
                      ) : (
                        <i className="fa-solid fa-paper-plane text-xs"></i>
                      )}
                    </button>
                  </div>

                  {/* Example Prompts */}
                  <div className="mt-3 border-t border-purple-200/50 pt-3 dark:border-purple-700/30">
                    <div className="mb-2 flex items-center gap-2">
                      <i className="fa-solid fa-lightbulb text-xs text-purple-500"></i>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Try these examples:
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleExamplePrompt('A cat playing on the grass')}
                        disabled={promptLoading}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
                          'bg-purple-100 text-purple-700 hover:bg-purple-200',
                          'dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50',
                          'disabled:cursor-not-allowed disabled:opacity-50',
                          'transform hover:scale-105 active:scale-95'
                        )}
                      >
                        🐱 A cat playing on the grass
                      </button>
                      <button
                        onClick={() => handleExamplePrompt('A beautiful sunset over the ocean')}
                        disabled={promptLoading}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
                          'bg-blue-100 text-blue-700 hover:bg-blue-200',
                          'dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50',
                          'disabled:cursor-not-allowed disabled:opacity-50',
                          'transform hover:scale-105 active:scale-95'
                        )}
                      >
                        🌅 A beautiful sunset over the ocean
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Caption
                  </label>
                  <ShTextarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write your caption here..."
                    className="w-full bg-white text-gray-900 placeholder:text-neutral-500 dark:bg-neutral-800 dark:text-gray-100 dark:placeholder:text-neutral-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Audience
                  </label>
                  <ShSelect value={audience} onValueChange={setAudience}>
                    <ShSelectTrigger className="w-full bg-white text-gray-900 dark:bg-neutral-800 dark:text-gray-100">
                      <ShSelectValue placeholder="Select audience" />
                    </ShSelectTrigger>
                    <ShSelectContent className="bg-white dark:bg-neutral-800">
                      <ShSelectItem value="PUBLIC">Public</ShSelectItem>
                      <ShSelectItem value="PRIVATE">Private</ShSelectItem>
                    </ShSelectContent>
                  </ShSelect>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Advanced Settings
                  </h3>
                  <PostSwitch
                    isOn={isLikeVisible}
                    onToggle={setIsLikeVisible}
                    title="Hide like and comment counts"
                    subtitle="Keep the focus on your content by hiding engagement metrics"
                  />
                  <PostSwitch
                    isOn={isCommentVisible}
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
