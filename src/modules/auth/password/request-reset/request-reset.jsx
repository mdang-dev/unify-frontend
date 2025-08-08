'use client';

import { useState } from 'react';
import { Input } from '@/src/components/ui/input';
import UnifyLogoIcon from '../_components/unify-logo-icon';
import { useMutation } from '@tanstack/react-query';
import { authCommandApi } from '@/src/apis/auth/command/auth.command.api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function RequestReset() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { mutate: sendOtp } = useMutation({
    mutationFn: (email) => authCommandApi.sendOtp(email),
  });

  const handleSubmit = () => {
    setError('');
    if (!email) return setError('Email is required');
    if (!/\S+@\S+\.\S+/.test(email)) return setError('Please enter a valid email address');
    setLoading(true);

    sendOtp(email, {
      onSuccess: () => {
        toast.success('OTP sent to your email');
        router.push(`/password/reset/otp-verification?email=${encodeURIComponent(email)}`);
      },
      onError: (err) => {
        const message = err?.response?.data?.message || err?.message || 'Failed to send OTP';
        setError(message);
      },
      onSettled: () => setLoading(false),
    });
  };

  return (
    <>
      <div className="w-[420px] max-w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex flex-col items-center">
          <UnifyLogoIcon className="h-16 w-16" />
          <h1 className="mt-3 text-xl font-semibold text-neutral-900 dark:text-white">Forgot your password?</h1>
          <p className="mt-1 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Enter your email address and we’ll send you a one-time password (OTP) to verify your identity.
          </p>
        </div>

        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
        <Input
          placeholder="you@example.com"
          type="email"
          className="h-12 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        <button
          className="mt-4 w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-100"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send OTP'}
        </button>

        <div className="mt-4 text-center text-sm text-neutral-700 dark:text-neutral-300">
          Remembered your password?{' '}
          <Link href="/login" className="font-medium underline">
            Back to login
          </Link>
        </div>
      </div>
    </>
  );
}


