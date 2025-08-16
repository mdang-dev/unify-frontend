'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import unify_icon_lightmode from '@/public/images/unify_icon_lightmode.svg';
import { Input } from '@/src/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { setTokenCookie } from '@/src/utils/cookies.util';
import { useAuthStore } from '@/src/stores/auth.store';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { authCommandApi } from '@/src/apis/auth/command/auth.command.api';
import { useEffect } from 'react';
import { useUser } from '@heroui/react';
import { Turnstile } from '@marsidev/react-turnstile';

export default function LoginPage() {
  const t = useTranslations('Auth.Login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [onMounted, setOnMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginMutation = useMutation({
    mutationFn: authCommandApi.login,
  });

  useEffect(() => {
    setOnMounted(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError(t('AllFieldsRequired'));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError(t('InvalidEmail'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setLoading(true);

    loginMutation.mutate(formData, {
      onSuccess: async ({ token }) => {
        setTokenCookie(token);
        const { scope } = JSON.parse(atob(token.split('.')[1]));
        if (scope === 'ROLE_ADMIN') redirect('/manage/users/list');
        router.push(redirectTo);
      },
      onError: (err) => {
        console.error('❌ Login error:', err);
        setError(t('IncorrectCredentials'));
      },
      onSettled: () => {
        setIsSubmitting(false);
        setLoading(false);
      },
    });
  };

  if (!onMounted) return null;

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
            transition={{
              duration: 0.5,
              ease: [0, 0.71, 0.2, 1.01],
            }}
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
            {t('Title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-2 text-sm text-neutral-600 dark:text-neutral-400"
          >
            {t('Subtitle')}{' '}
            <Link
              href="/register"
              className="font-medium text-black hover:underline dark:text-white"
            >
              {t('SignUp')}
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
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                {t('Email')}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="relative block w-full appearance-none rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 placeholder-neutral-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-400 dark:focus:ring-white sm:text-sm"
                placeholder={t('Email')}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                {t('Password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="relative block w-full appearance-none rounded-xl border border-neutral-200 px-4 py-3 pr-10 text-neutral-900 placeholder-neutral-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-400 dark:focus:ring-white sm:text-sm"
                  placeholder={t('Password')}
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
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-600 dark:bg-neutral-900"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-neutral-900 dark:text-neutral-300"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/password/reset"
                className="font-medium text-black hover:underline dark:text-white"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Turnstile siteKey="0x4AAAAAABsTZMIhxNzGU9zy" className="m-auto" />
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-xl border border-transparent bg-black px-4 py-3 text-sm font-medium text-white transition-all hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-100 dark:focus:ring-white"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t('SignIn')}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}
