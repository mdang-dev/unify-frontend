'use client';

import { Input } from '@/src/components/ui/input';
import Link from 'next/link';
import UnifyLogoIcon from '../_components/unify-logo-icon';
import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authCommandApi } from '@/src/apis/auth/command/auth.command.api';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const Confirm = () => {
  const searchParam = useSearchParams();
  const email = searchParam.get('email');
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { mutate: resetPassword } = useMutation({
    mutationFn: ({ email, newPassword }) => authCommandApi.resetPassword(email, newPassword),
  });

  const passwordMeetsRequirements = useMemo(() => {
    const lengthOk = newPassword.length >= 8;
    const upperOk = /[A-Z]/.test(newPassword);
    const lowerOk = /[a-z]/.test(newPassword);
    const numberOk = /[0-9]/.test(newPassword);
    const specialOk = /[^A-Za-z0-9]/.test(newPassword);
    return { lengthOk, upperOk, lowerOk, numberOk, specialOk, all: lengthOk && upperOk && lowerOk && numberOk && specialOk };
  }, [newPassword]);

  const handleResetPassword = async () => {
    if (!email) return setError('Missing email. Please restart the reset flow.');
    if (newPassword !== confirmPassword) return setError('Password does not match!');
    if (!passwordMeetsRequirements.all)
      return setError('Password does not meet complexity requirements.');

    setLoading(true);
    setError('');

    resetPassword(
      { email, newPassword },
      {
        onSuccess: () => {
          toast.success('Password reset successfully. Please sign in.');
          router.push('/login');
        },
        onError: (err) => {
          setError(err?.response?.data?.message || err?.message || 'An error occurred!');
        },
        onSettled: () => setLoading(false),
      }
    );
  };
  return (
    <>
      <div className="w-[420px] max-w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex flex-col items-center">
          <UnifyLogoIcon className="h-16 w-16" />
          <h1 className="mt-3 text-xl font-semibold text-neutral-900 dark:text-white">Create a new password</h1>
          <p className="mt-1 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Your new password must be different from previous passwords and meet all requirements below.
          </p>
        </div>

        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">New Password</label>
        <Input
          placeholder="Enter new password"
          type="password"
          className="h-12 w-full"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <label className="mb-1 mt-3 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Confirm Password</label>
        <Input
          placeholder="Re-enter new password"
          type="password"
          className="h-12 w-full"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-800/40">
          <p className="mb-2 text-sm font-medium text-neutral-900 dark:text-white">Password must contain:</p>
          <ul className="list-inside space-y-1 text-left">
            <li className={passwordMeetsRequirements.lengthOk ? 'text-green-600' : 'text-neutral-600 dark:text-neutral-300'}>• Minimum 8 characters</li>
            <li className={passwordMeetsRequirements.upperOk ? 'text-green-600' : 'text-neutral-600 dark:text-neutral-300'}>• At least one uppercase letter (A-Z)</li>
            <li className={passwordMeetsRequirements.lowerOk ? 'text-green-600' : 'text-neutral-600 dark:text-neutral-300'}>• At least one lowercase letter (a-z)</li>
            <li className={passwordMeetsRequirements.numberOk ? 'text-green-600' : 'text-neutral-600 dark:text-neutral-300'}>• At least one number (0-9)</li>
            <li className={passwordMeetsRequirements.specialOk ? 'text-green-600' : 'text-neutral-600 dark:text-neutral-300'}>• At least one special character (!@#$%^&*)</li>
          </ul>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button
          className="mt-4 w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-100"
          onClick={handleResetPassword}
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Confirm'}
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
};

export default Confirm;
