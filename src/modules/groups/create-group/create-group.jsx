'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { groupsCommandApi } from '@/src/apis/groups/command/groups.command.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { getCookie } from '@/src/utils/cookies.util';
import { COOKIE_KEYS } from '@/src/constants/cookie-keys.constant';
import { useAuthStore } from '@/src/stores/auth.store';
import { getUser } from '@/src/utils/auth.util';
import { useQuery } from '@tanstack/react-query';
import { addToast } from '@heroui/toast';

const privacyOptions = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'PRIVATE', label: 'Private' },
];

export default function CreateGroup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef();

  // Fetch user data using React Query
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get current user ID from token (you might need to adjust this based on your auth setup)
  const getCurrentUserId = () => {
    return user?.id;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        addToast({
          title: 'Invalid file type',
          description: 'Only images (png, jpeg, jpg, gif, webp) are allowed.',
          timeout: 3000,
          color: 'warning',
        });
        return;
      }

      // Validate file size (10MB limit)
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxFileSize) {
        addToast({
          title: 'File too large',
          description: 'File size must be less than 10MB.',
          timeout: 3000,
          color: 'warning',
        });
        return;
      }

      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        addToast({
          title: 'Invalid file type',
          description: 'Only images (png, jpeg, jpg, gif, webp) are allowed.',
          timeout: 3000,
          color: 'warning',
        });
        return;
      }

      // Validate file size (10MB limit)
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxFileSize) {
        addToast({
          title: 'File too large',
          description: 'File size must be less than 10MB.',
          timeout: 3000,
          color: 'warning',
        });
        return;
      }

      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Firebase upload function for group avatar (same pattern as posts-create)
  const handleUpload = async () => {
    if (!avatarFile) {
      addToast({
        title: 'No file selected',
        description: 'Please select an image file to upload.',
        timeout: 3000,
        color: 'warning',
      });
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('files', avatarFile);

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
        description: 'Failed to upload group avatar. Please try again.',
        timeout: 3000,
        color: 'danger',
      });
      return null;
    }
  };

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData) => {
      const ownerId = getCurrentUserId();
      return await groupsCommandApi.createGroup(groupData, ownerId);
    },
    onSuccess: (data) => {
      console.log('Group created successfully:', data);
      addToast({
        title: 'Success',
        description: 'Group created successfully!',
        timeout: 3000,
        color: 'success',
      });
      // Invalidate and refetch groups query
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROUPS] });
      // Redirect to the created group or groups list
      router.push('/groups');
    },
    onError: (error) => {
      console.error('Error creating group:', error);
      setIsSubmitting(false);
      addToast({
        title: 'Error',
        description: error.message || 'Failed to create group. Please try again.',
        timeout: 3000,
        color: 'danger',
      });
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    
    try {
      let coverImageUrl = null;
      
      // Upload avatar to Firebase if file is selected (same pattern as posts-create)
      if (avatarFile) {
        const uploadedFiles = await handleUpload();
        if (!uploadedFiles?.files?.length) throw new Error('Failed to upload avatar');
        coverImageUrl = uploadedFiles.files[0].url;
      }

      const groupData = {
        name: groupName.trim(),
        description: description.trim(),
        privacyType: privacy,
        coverImageUrl: coverImageUrl,
      };

      createGroupMutation.mutate(groupData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
      addToast({
        title: 'Error',
        description: error.message || 'Failed to create group. Please try again.',
        timeout: 3000,
        color: 'danger',
      });
    }
  };

  const isFormValid = groupName.trim().length > 0;

  // Show loading state while user data is being fetched
  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Loading...</div>
        </div>
      </div>
    );
  }

  // Show error state if user data failed to load
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">Failed to load user data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col gap-8 bg-neutral-50 p-6 dark:bg-neutral-900 lg:flex-row">
      {/* Left: Form Section */}
      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-lg flex-col space-y-4 rounded-xl bg-white p-8 shadow-md dark:bg-zinc-900 lg:mx-0 lg:w-1/2">
        <h1 className="mb-2 text-2xl font-bold text-zinc-800 dark:text-zinc-100">Create Group</h1>
        {/* User Info Block */}
        <div className="mb-2 flex items-center gap-4">
          <Image
            src={user.avatar?.url || '/images/avatar.png'}
            alt={user.username || 'User'}
            width={70}
            height={70}
            className="rounded-full border border-zinc-200 object-cover dark:border-zinc-700"
          />
          <div>
            <div className="font-semibold text-zinc-800 dark:text-zinc-100">{user.username || 'User'}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Admin</div>
          </div>
        </div>
        {/* Group Name Input */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 font-semibold text-zinc-800 placeholder-zinc-500 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
        </div>
        {/* Privacy Selector */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Privacy
          </label>
          <select
            className="w-full rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 font-semibold text-zinc-800 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value)}
          >
            {privacyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {/* Group Description */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Description
          </label>
          <textarea
            className="min-h-[80px] w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 font-semibold text-zinc-800 placeholder-zinc-500 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
            placeholder="Describe your group (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        {/* Create Button */}
        <button
          type="submit"
          className={`mt-2 w-full rounded-lg bg-zinc-800 py-2 font-bold text-white shadow-md transition-colors ${isFormValid && !isSubmitting ? 'hover:bg-zinc-700 dark:hover:bg-zinc-700' : 'cursor-not-allowed opacity-60'}`}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create'}
        </button>
        
        {/* Error Message */}
        {createGroupMutation.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            Error: {createGroupMutation.error.message || 'Failed to create group'}
          </div>
        )}
      </form>
      {/* Right: Live Preview Section */}
      <div className="flex w-full items-start justify-center lg:w-1/2">
        <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-neutral-100 p-8 shadow-md dark:bg-zinc-900">
          {/* Group Avatar Upload Box */}
          <div
            className="group relative flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-100 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Group Avatar" fill className="rounded-lg object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                <i className="fa-solid fa-image mb-2 text-4xl"></i>
                <span className="text-sm">Upload Group Cover</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          {/* Group Name Preview */}
          <div className="min-h-[28px] text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            {groupName || <span className="text-zinc-400 dark:text-zinc-500">Group Name</span>}
          </div>
          {/* Privacy Badge */}
          <div className="inline-block w-fit rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {privacyOptions.find((opt) => opt.value === privacy)?.label}
          </div>
          {/* Description Preview */}
          <div className="min-h-[40px] font-semibold text-zinc-600 dark:text-zinc-300">
            {description || (
              <span className="text-zinc-400 dark:text-zinc-500">
                Group description will appear here.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
