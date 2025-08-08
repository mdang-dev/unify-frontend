'use client';

import { Input } from '@/src/components/ui/input';
import Link from 'next/link';
import { useState } from 'react';
import UnifyLogoIcon from '../_components/unify-logo-icon';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authCommandApi } from '@/src/apis/auth/command/auth.command.api';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/src/components/ui/input-otp';

const OtpVerification = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const router = useRouter();
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const { mutate: verify } = useMutation({
    mutationFn: ({ email, otp }) => authCommandApi.verifyOtp(email, otp),
  });

  const handleVerifyOtp = async () => {
    if (!email) {
      setError('Missing email. Please restart the reset flow.');
      return;
    }
    if (otp.join('').length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    setError('');
    verify(
      {
        email,
        otp: otp.join(''),
      },
      {
        onSuccess: () => {
          toast.success('OTP verified. Continue to reset your password.');
          router.push(`/password/reset/confirm?email=${email}`);
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
          <h1 className="mt-3 text-xl font-semibold text-neutral-900 dark:text-white">Enter the OTP</h1>
          <p className="mt-1 text-center text-sm text-neutral-600 dark:text-neutral-400">
            We sent a 6-digit OTP to <span className="font-medium">{email}</span>. Enter it below to continue.
          </p>
        </div>

        <InputOTP
          value={otp.join('')}
          onChange={(next) => setOtp(next.split('').slice(0, 6).concat(Array(6).fill('')).slice(0, 6))}
          maxLength={6}
          className="justify-center"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button
          className="mt-4 w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-100"
          onClick={handleVerifyOtp}
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
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

export default OtpVerification;
