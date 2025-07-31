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
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
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
      const response = await fetch(`https://unify-mobile.app.n8n.cloud/webhook/generate-post`, {
        // const response = await fetch(`https://unify-mobile.app.n8n.cloud/webhook-test/generate-post`, {
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
      
      // Handle the new response format with array structure
      if (Array.isArray(data) && data.length > 0) {
        // Find the parse action response
        const parseAction = data.find(item => item.action === 'parse');
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
          
                    // Handle image URL if provided
          if (responseData.imageUrl) {
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
          addToast({
            title: 'Invalid response format',
            description: 'Received unexpected response format from AI service.',
            timeout: 3000,
            color: 'warning',
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
        
        // Handle image URL if provided (legacy format)
        if (responseData.imageUrl) {
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
        addToast({
          title: 'Prompt processed',
          description: 'Your prompt has been processed.',
          timeout: 3000,
          color: 'success',
        });
      }
      
    } catch (error) {
      console.error('Error sending prompt:', error);
      addToast({
        title: 'Prompt failed',
        description: error.message || 'Failed to send prompt. Please try again.',
        timeout: 3000,
        color: 'danger',
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
      addToast({
        title: 'Conversion failed',
        description: 'Failed to convert base64 image to file.',
        timeout: 3000,
        color: 'danger',
      });
      return null;
    }
  };

  const addBase64Image = (base64String, filename = 'image.jpg', mimeType = 'image/jpeg') => {
    const maxFiles = 12;
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    // Check file count
    if (files.length >= maxFiles) {
      addToast({
        title: 'Too many files',
        description: `You can only upload up to ${maxFiles} files.`,
        timeout: 3000,
        color: 'warning',
      });
      return;
    }

    // Convert base64 to File object
    const file = convertBase64ToFile(base64String, filename, mimeType);
    if (!file) return;

    // Check file size
    if (file.size > maxFileSize) {
      addToast({
        title: 'File too large',
        description: `${filename} exceeds the 10MB size limit.`,
        timeout: 3000,
        color: 'warning',
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
      addToast({
        title: 'Some images skipped',
        description: `Only ${remainingSlots} images were added due to file limit.`,
        timeout: 3000,
        color: 'warning',
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
      addToast({
        title: 'Conversion failed',
        description: 'Failed to convert image URL to base64.',
        timeout: 3000,
        color: 'danger',
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
      addToast({
        title: 'URL conversion failed',
        description: error.message || 'Failed to process image from URL.',
        timeout: 3000,
        color: 'danger',
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
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to process image ${i + 1}:`, error);
      }
    }
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
                
                {/* AI Prompt Section - Above Caption */}
                <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-3 shadow-sm dark:from-purple-900/20 dark:to-blue-900/20">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                      <i className="fa-solid fa-robot text-xs text-white"></i>
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">AI Assistant</span>
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
                        input: "bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm text-xs",
                        inputWrapper: "border border-transparent bg-gradient-to-r from-purple-200/50 to-blue-200/50 dark:from-purple-700/30 dark:to-blue-700/30 backdrop-blur-sm hover:from-purple-300/50 hover:to-blue-300/50 dark:hover:from-purple-600/30 dark:hover:to-blue-600/30 transition-all duration-300"
                      }}
                    />
                    <button
                      onClick={handlePromptSubmit}
                      disabled={promptLoading || !prompt.trim()}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-md',
                        'bg-gradient-to-r from-purple-500 to-blue-500 text-white',
                        'hover:from-purple-600 hover:to-blue-600',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'transition-all duration-300 shadow-sm hover:shadow-md',
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
