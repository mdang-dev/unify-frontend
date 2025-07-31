'use client';

import React, { useState } from 'react';
import { addToast, ToastProvider } from '@heroui/toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { userCommandApi } from '@/src/apis/user/command/user.command.api';

const UpdatePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordError = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return '';
  };

  const { mutate: changePassword } = useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      userCommandApi.changePassword(currentPassword, newPassword),
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!currentPassword) {
      setErrors((prev) => ({ ...prev, currentPassword: 'Current password is required' }));
      return;
    }

    const passwordError = getPasswordError(newPassword);
    if (passwordError) {
      setErrors((prev) => ({ ...prev, newPassword: passwordError }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    setLoading(true);
    changePassword(
      {
        currentPassword,
        newPassword,
      },
      {
        onSuccess: () => {
          addToast({
            title: 'Success',
            description: 'Password updated successfully',
            type: 'success',
             color: 'success',
          });
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
        onError: () => {
          addToast({
            title: 'Error',
            description: 'Failed to update password',
            type: 'error',
             color: 'danger',
          });
        },
        onSettled: () => setLoading(false),
      }
    );
  };

  return (
    <>
      <ToastProvider placement="top-right" />
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            {/* Header */}
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-black dark:text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-black dark:text-white">Update Password</h1>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    Change your password to keep your account secure
                  </p>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <h2 className="mb-2 text-sm font-medium text-black dark:text-white">
                Password Requirements
              </h2>
              <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                <li className="flex items-center">
                  <i className="fa-solid fa-check-circle mr-2 text-black dark:text-white"></i>
                  At least 8 characters long
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check-circle mr-2 text-black dark:text-white"></i>
                  Contains at least one uppercase letter
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check-circle mr-2 text-black dark:text-white"></i>
                  Contains at least one lowercase letter
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check-circle mr-2 text-black dark:text-white"></i>
                  Contains at least one number
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check-circle mr-2 text-black dark:text-white"></i>
                  Contains at least one special character (!@#$%^&*)
                </li>
              </ul>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-6 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:ring-white"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:ring-white"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:ring-white"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setErrors({});
                  }}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:ring-white"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl border border-transparent bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-100 dark:focus:ring-white"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default UpdatePassword;
