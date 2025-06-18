'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import unify_icon_lightmode from '@/public/images/unify_icon_lightmode.svg';
import { useMutation } from '@tanstack/react-query';
import { authCommandApi } from '@/src/apis/auth/command/auth.command.api';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const registerMutation = useMutation({
    mutationFn: authCommandApi.register,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const validateForm = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError('All fields are required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setLoading(true);

    registerMutation.mutate(formData, {
      onSuccess: () => {
        redirect('/login');
      },
      onError: (err) => {
        console.error('❌ Login error:', err?.message);
      },
      onSettled: () => {
        setIsSubmitting(false);
        setLoading(false);
      },
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-12 dark:bg-black sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <Image
              src={unify_icon_lightmode}
              alt="Unify Logo"
              width={126}
              height={128}
              className="mx-auto"
              priority
            />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-3xl font-bold text-black dark:text-white"
          >
            Create your account
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-2 text-sm text-neutral-600 dark:text-neutral-400"
          >
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-black hover:underline dark:text-white">
              Sign in
            </Link>
          </motion.p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          >
            {error}
          </motion.div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="relative block w-full appearance-none rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 placeholder-neutral-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-400 dark:focus:ring-white sm:text-sm"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="relative block w-full appearance-none rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 placeholder-neutral-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-400 dark:focus:ring-white sm:text-sm"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="username"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="relative block w-full appearance-none rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 placeholder-neutral-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-400 dark:focus:ring-white sm:text-sm"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="relative block w-full appearance-none rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 placeholder-neutral-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-400 dark:focus:ring-white sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="relative block w-full appearance-none rounded-xl border border-neutral-200 px-4 py-3 pr-10 text-neutral-900 placeholder-neutral-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-400 dark:focus:ring-white sm:text-sm"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="relative block w-full appearance-none rounded-xl border border-neutral-200 px-4 py-3 pr-10 text-neutral-900 placeholder-neutral-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-400 dark:focus:ring-white sm:text-sm"
                  placeholder="Confirm your password"
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
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-xl border border-transparent bg-black px-4 py-3 text-sm font-medium text-white transition-all hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-100 dark:focus:ring-white"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create account'}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}
