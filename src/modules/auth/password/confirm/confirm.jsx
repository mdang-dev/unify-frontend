'use client';

import { Input } from '@/src/components/ui/input';
import Link from 'next/link';
import UnifyLogoIcon from '../_components/unify-logo-icon';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authCommandApi } from '@/src/apis/auth/command/auth.command.api';
import { useRouter, useSearchParams } from 'next/navigation';

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

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Password does not match!');
      return;
    }

    setLoading(true);
    setError('');

    resetPassword(
      { email, newPassword },
      {
        onSuccess: () => {
          router.push('/login');
        },
        onError: (err) => {
          setError(err?.message || err?.response?.data?.message || 'An occurred!');
        },
        onSettled: () => setLoading(false),
      }
    );
  };
  return (
    <>
      <div>
        <UnifyLogoIcon />
      </div>
      <Input
        placeholder="New Password"
        type="password"
        className="mt-2 h-12 w-[400px]"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <Input
        placeholder="Confirm Password"
        type="password"
        className="mt-2 h-12 w-[400px]"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      {error && <p className="text-red-500">{error}</p>}

      <div className="mt-2 flex items-center gap-1">
        <span>Remembered your password?</span>
        <Link href="/login" className="text-[#0F00E1]">
          Back to login
        </Link>
      </div>

      <button
        className="mt-3 rounded-2xl border bg-black p-2 text-2xl font-bold text-white"
        onClick={handleResetPassword}
        disabled={loading}
      >
        {loading ? 'Resetting...' : 'Confirm'}
      </button>
    </>
  );
};

export default Confirm;
