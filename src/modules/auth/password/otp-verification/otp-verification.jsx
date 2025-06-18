'use client';

import { Input } from '@/src/components/ui/input';
import Link from 'next/link';
import { useState } from 'react';
import UnifyLogoIcon from '../_components/unify-logo-icon';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authCommandApi } from '@/src/apis/auth/command/auth.command.api';

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
    setLoading(true);
    setError('');
    verify(
      {
        email,
        otp: otp.join(''),
      },
      {
        onSuccess: () => {
          router.push(`/password/reset/confirm?email=${email}`);
        },
        onError: (err) => {
          setError(err.message || err?.response?.data?.message || 'An error occurred!');
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
      <div className="flex justify-center gap-3">
        {otp.map((value, index) => (
          <Input
            key={index}
            id={`otp-${index}`}
            type="text"
            value={value}
            maxLength={1}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`h-12 w-12 rounded-md border border-gray-300 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        ))}
      </div>
      <div className={`m-auto flex items-center gap-1`}>
        <span>Remembered your password.</span>
        <Link href={'/login'} className={`text-[#0F00E1]`}>
          Back to login
        </Link>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <button
        className="mt-3 rounded-2xl border bg-black p-2 text-2xl font-bold text-white dark:bg-white dark:text-black"
        onClick={handleVerifyOtp}
        disabled={loading}
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
    </>
  );
};

export default OtpVerification;
