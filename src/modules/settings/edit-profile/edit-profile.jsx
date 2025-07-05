'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group';
import { addToast } from '@heroui/toast';
import { useAuthStore } from '@/src/stores/auth.store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userCommandApi } from '@/src/apis/user/command/user.command.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { deleteCookie, setCookie } from '@/src/utils/cookies.util';
import { COOKIE_KEYS } from '@/src/constants/cookie-keys.constant';
import { useRouter } from 'next/navigation';
import { authCommandApi } from '@/src/apis/auth/command/auth.command.api';

const EditProfile = () => {
  const router = useRouter();
  const defaultAvatar = '/images/unify_icon_2.svg';
  const [avatar, setAvatar] = useState(defaultAvatar);
  const fileInputRef = useRef(null);
  const [daysInMonth, setDaysInMonth] = useState(31);
  const [errors, setErrors] = useState({});
  const { user, setUser } = useAuthStore();
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(false);
  const defaultBirthday = { day: '', month: '', year: '' };
  const defaultAvatarObj = { url: defaultAvatar };
  const queryClient = useQueryClient();

  const { mutate: updateUser } = useMutation({
    mutationFn: (data) => userCommandApi.updateUser(data),
  });

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  useEffect(() => {
    if (user) {
      setUserData({
        id: user.id || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        password: user.password || '',
        phone: user.phone || '',
        gender: user.gender || false,
        birthDay: (() => {
          if (!user.birthDay) return { day: '', month: '', year: '' };
          if (typeof user.birthDay === 'string') {
            const [year, month, day] = user.birthDay.split('-');
            return { day, month, year };
          }
          return user.birthDay;
        })(),
        location: user.location || '',
        education: user.education || '',
        status: user.status || 0,
        reportApprovalCount: user.reportApprovalCount || '',
        workAt: user.workAt || '',
        biography: user.biography || '',
        avatar: user.avatar ? { url: user.avatar.url } : { url: defaultAvatar },
      });
      setAvatar(user.avatar && user.avatar.url ? user.avatar.url : defaultAvatar);
      setGender(user.gender || false);
    }
  }, [user]);

  const [gender, setGender] = useState('');
  const handleGenderChange = (value) => {
    setGender(value);
    setUserData((prev) => ({ ...prev, gender: value }));
  };

  useEffect(() => {
    if (!userData.birthDay) return;

    const { month, year } = userData.birthDay;

    if (month && year) {
      const days = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
      setDaysInMonth(days);

      if (parseInt(userData.birthDay.day, 10) > days) {
        setUserData((prev) => ({
          ...prev,
          birthDay: {
            ...prev.birthDay,
            day: days.toString().padStart(2, '0'),
          },
        }));
      }
    }
  }, [userData.birthDay?.month, userData.birthDay?.year]);

  const handleChange = (field, value) => {
    if (field.startsWith('birthDay.')) {
      const birthField = field.split('.')[1];
      const newBirthDay = {
        ...userData.birthDay,
        [birthField]: value.padStart(2, '0'),
      };
      setUserData((prevData) => ({ ...prevData, birthDay: newBirthDay }));
    } else {
      setUserData((prevData) => ({ ...prevData, [field]: value }));
    }
  };

  const logoutUser = async () => {
    try {
      // Try to call logout API, but don't fail if it doesn't work
      await authCommandApi.logout();
    } catch (error) {
      console.warn('Logout API failed, proceeding with client-side logout:', error);
    }
    
    // Always clear local data and redirect
    deleteCookie(COOKIE_KEYS.AUTH_TOKEN);
    queryClient.removeQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });
    setUser(null);
    router.push('/login');
  };

  const validateFormData = (data) => {
    const errors = {};
    if (!data.firstName) errors.firstName = 'First name is required';
    if (!data.lastName) errors.lastName = 'Last name is required';
    if (!data.username) {
      errors.username = 'Username is required';
    } else if (data.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (data.username.length > 30) {
      errors.username = 'Username must be at most 30 characters';
    }
    if (data.biography.length > 100) {
      errors.biography = 'Biography must be at most 100 characters';
    }
    const emailPattern = /^[^@]+@[a-zA-Z0-9-]+\.(com)$/;
    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!emailPattern.test(data.email)) {
      errors.email = "Email must be in the format '@yourdomain.com'";
    }
    if (data.phone && !/^[0-9]{10}$/.test(data.phone)) {
      errors.phone = 'Phone number should be 10 digits';
    }
    if (!data.birthDay.day || data.birthDay.day < 1 || data.birthDay.day > 31) {
      errors.birthDay = errors.birthDay || {};
      errors.birthDay.day = 'Invalid day';
    }
    if (!data.birthDay.month || data.birthDay.month < 1 || data.birthDay.month > 12) {
      errors.birthDay = errors.birthDay || {};
      errors.birthDay.month = 'Invalid month';
    }
    if (!data.birthDay.year || data.birthDay.year < 1900 || data.birthDay.year > 2100) {
      errors.birthDay = errors.birthDay || {};
      errors.birthDay.year = 'Invalid year';
    }
    if (data.birthDay.year && data.birthDay.month && data.birthDay.day) {
      const today = new Date();
      const birthDate = new Date(data.birthDay.year, data.birthDay.month - 1, data.birthDay.day);

      if (birthDate > today) {
        errors.birthDay = errors.birthDay || {};
        errors.birthDay.date = 'Birth date cannot be in the future';
      } else {
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 13) {
          errors.birthDay = errors.birthDay || {};
          errors.birthDay.age = 'You must be at least 13 years old';
        }
      }
    }
    return errors;
  };

  const handleChangeAvatar = (e) => {
    if (!e || !e.target) {
      console.error('Event object is undefined or invalid in handleChangeAvatar');
      return;
    }

    const file = e.target.files[0];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      addToast({
        title: 'Invalid file type',
        description: 'Only images (png, jpeg, jpg, gif) are allowed.',
        timeout: 3000,
        color: 'warning',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      setUserData((prevData) => ({
        ...prevData,
        avatar: { url: reader.result, file },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!userData.avatar.file || !(userData.avatar.file instanceof File)) {
      return userData.avatar.url && userData.avatar.url !== defaultAvatar
        ? { url: userData.avatar.url }
        : null;
    }

    const formData = new FormData();
    formData.append('files', userData.avatar.file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Avatar upload error:', errorText);
      throw new Error(`Failed to upload avatar: ${errorText}`);
    }

    const data = await res.json();
    setAvatar(data.files[0].url);
    return data.files[0];
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateFormData(userData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);

    let avatarData = null;
    try {
      if (userData.avatar.file instanceof File) {
        const uploadedFile = await handleUploadAvatar();
        avatarData = { url: uploadedFile.url };
      } else if (userData.avatar.url && userData.avatar.url !== defaultAvatar) {
        avatarData = { url: userData.avatar.url };
      }
    } catch (error) {
      console.error('Avatar upload failed:', error);
      addToast({
        title: 'Avatar Upload Failed',
        description: 'Failed to upload avatar. Please try again.',
        timeout: 3000,
        color: 'warning',
      });
      setLoading(false);
      return;
    }

    const requestData = {
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      username: userData.username || '',
      email: userData.email || '',
      phone: userData.phone || '',
      gender: userData.gender === true ? true : false,
      birthDay: userData.birthDay && userData.birthDay.year && userData.birthDay.month && userData.birthDay.day
        ? `${userData.birthDay.year}-${userData.birthDay.month.padStart(2, '0')}-${userData.birthDay.day.padStart(2, '0')}`
        : null,
      location: userData.location || '',
      education: userData.education || '',
      workAt: userData.workAt || '',
      biography: userData.biography || '',
      avatar: avatarData,
    };

    console.log('Sending request data:', requestData);
    
    updateUser(requestData, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.USER_PROFILE],
        });
        addToast({
          title: 'Success',
          description: 'Profile update successful.',
          timeout: 3000,
          color: 'success',
        });
        setErrors({});
      },
      onError: (err) => {
        console.error('Update user error:', err);
        console.error('Error response:', err?.response?.data);
        addToast({
          title: 'Error',
          description: 'Error: ' + (err?.response?.data?.message || err?.message || 'Unknown error'),
          timeout: 3000,
          color: 'danger',
        });
      },
      onSettled: () => setLoading(false),
    });
  };
  const handleDeleteAvatar = () => {
    setAvatar(defaultAvatar);
    setUserData((prevData) => ({
      ...prevData,
      avatar: { url: defaultAvatar },
    }));
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl overflow-y-auto px-4 py-8 scrollbar-hide sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Update your personal information and preferences
                  </p>
                </div>
                <button
                  onClick={logoutUser}
                  className="inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <i className="fa-solid fa-sign-out-alt mr-2"></i>
                  Logout
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="divide-y divide-gray-200 dark:divide-neutral-700"
            >
              {/* Avatar Section */}
              <div className="px-6 py-6">
                <div className="flex items-center space-x-6">
                  <div className="group relative">
                    <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-gray-200 dark:border-neutral-700">
                      <Image
                        src={avatar}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-white hover:text-gray-200"
                      >
                        <i className="fa-solid fa-camera text-2xl"></i>
                      </button>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600"
                    >
                      <i className="fa-solid fa-camera mr-2"></i>
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      className="inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <i className="fa-solid fa-trash mr-2"></i>
                      Remove
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleChangeAvatar}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>

              {/* Basic Information */}
              <div className="px-6 py-6">
                <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={userData.firstName || ''}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={userData.lastName || ''}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </label>
                    <input
                      type="text"
                      value={userData.username || ''}
                      onChange={(e) => handleChange('username', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                    />
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="px-6 py-6">
                <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={userData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Location
                    </label>
                    <input
                      type="text"
                      value={userData.location || ''}
                      onChange={(e) => handleChange('location', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="px-6 py-6">
                <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Gender
                    </label>
                    <RadioGroup
                      value={gender === true ? 'Male' : 'Female'}
                      onValueChange={(value) => handleGenderChange(value === 'Male')}
                      className="flex items-center space-x-4"
                    >
                      <label className="flex items-center space-x-2">
                        <RadioGroupItem value="Female" id="female" />
                        <span className="text-gray-700 dark:text-gray-300">Female</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <RadioGroupItem value="Male" id="male" />
                        <span className="text-gray-700 dark:text-gray-300">Male</span>
                      </label>
                    </RadioGroup>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Birth Date
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <select
                        value={userData?.birthDay?.month}
                        onChange={(e) => handleChange('birthDay.month', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                      >
                        <option value="">Month</option>
                        {months.map((month, index) => (
                          <option key={index + 1} value={(index + 1).toString().padStart(2, '0')}>
                            {month}
                          </option>
                        ))}
                      </select>
                      <select
                        value={userData?.birthDay?.day}
                        onChange={(e) => handleChange('birthDay.day', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                      >
                        <option value="">Day</option>
                        {[...Array(daysInMonth)].map((_, i) => (
                          <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                      <select
                        value={userData?.birthDay?.year}
                        onChange={(e) => handleChange('birthDay.year', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                      >
                        <option value="">Year</option>
                        {[...Array(100)].map((_, i) => (
                          <option key={i} value={2024 - i}>
                            {2024 - i}
                          </option>
                        ))}
                      </select>
                    </div>
                    {(errors.birthDay?.day ||
                      errors.birthDay?.month ||
                      errors.birthDay?.year ||
                      errors.birthDay?.date ||
                      errors.birthDay?.age) && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.birthDay?.day ||
                          errors.birthDay?.month ||
                          errors.birthDay?.year ||
                          errors.birthDay?.date ||
                          errors.birthDay?.age}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Education & Work */}
              <div className="px-6 py-6">
                <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                  Education & Work
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Education
                    </label>
                    <input
                      type="text"
                      value={userData.education || ''}
                      onChange={(e) => handleChange('education', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Work
                    </label>
                    <input
                      type="text"
                      value={userData.workAt || ''}
                      onChange={(e) => handleChange('workAt', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Biography */}
              <div className="px-6 py-6">
                <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">About</h2>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Biography
                  </label>
                  <textarea
                    value={userData.biography || ''}
                    onChange={(e) => handleChange('biography', e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                    placeholder="Tell us about yourself..."
                  />
                  {errors.biography && (
                    <p className="mt-1 text-sm text-red-500">{errors.biography}</p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 bg-gray-50 px-6 py-4 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => {
                    setUserData({
                      id: user.id || '',
                      firstName: user.firstName || '',
                      lastName: user.lastName || '',
                      username: user.username || '',
                      email: user.email || '',
                      password: user.password || '',
                      phone: user.phone || '',
                      gender: user.gender || false,
                      birthDay: user.birthDay || { day: '', month: '', year: '' },
                      location: user.location || '',
                      education: user.education || '',
                      status: user.status || 0,
                      reportApprovalCount: user.reportApprovalCount || '',
                      workAt: user.workAt || '',
                      biography: user.biography || '',
                      avatar: user.avatar ? { url: user.avatar.url } : { url: defaultAvatar },
                    });
                    setAvatar(user.avatar && user.avatar.url ? user.avatar.url : defaultAvatar);
                    setGender(user.gender || false);
                    setErrors({});
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProfile;
