"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';

const OtpContext = createContext(null);

export function InputOTP({ value = '', onChange, maxLength = 6, children, className = '' }) {
  const inputsRef = useRef([]);

  // Ensure length
  const safeValue = useMemo(() => (value || '').slice(0, maxLength), [value, maxLength]);

  const setCharAt = (idx, char) => {
    const chars = safeValue.split('');
    chars[idx] = char;
    const next = chars.join('').padEnd(maxLength, '');
    onChange?.(next);
  };

  const focusInput = (idx) => {
    const input = inputsRef.current[idx];
    if (input) input.focus();
  };

  const ctx = useMemo(
    () => ({ value: safeValue, onChange: setCharAt, maxLength, inputsRef, focusInput }),
    [safeValue, maxLength]
  );

  return (
    <OtpContext.Provider value={ctx}>
      <div className={`flex items-center justify-center ${className}`}>{children}</div>
    </OtpContext.Provider>
  );
}

export function InputOTPGroup({ children, className = '' }) {
  return <div className={`flex items-center gap-2 ${className}`}>{children}</div>;
}

export function InputOTPSeparator({ className = '' }) {
  return <div className={`mx-2 h-6 w-px bg-neutral-300 dark:bg-neutral-700 ${className}`} />;
}

export function InputOTPSlot({ index, className = '' }) {
  const ctx = useContext(OtpContext);
  if (!ctx) throw new Error('InputOTPSlot must be used within InputOTP');

  const { value, onChange, maxLength, inputsRef, focusInput } = ctx;
  const char = value[index] || '';

  useEffect(() => {
    if (!inputsRef.current[index]) return;
    inputsRef.current[index].value = char;
  }, [char, index, inputsRef]);

  const handleChange = (e) => {
    const v = e.target.value.replace(/\s/g, '');
    if (v === '') {
      onChange(index, '');
      return;
    }
    const normalized = v.replace(/[^0-9A-Za-z]/g, '').slice(-1);
    if (!normalized) return;
    onChange(index, normalized);
    if (index < maxLength - 1) focusInput(index + 1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && !char && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    }
    if (e.key === 'ArrowRight' && index < maxLength - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\s/g, '');
    if (!text) return;
    e.preventDefault();
    const filtered = text.replace(/[^0-9A-Za-z]/g, '').slice(0, maxLength - index).split('');
    filtered.forEach((c, i) => onChange(index + i, c));
    const nextIndex = Math.min(index + filtered.length, maxLength - 1);
    focusInput(nextIndex);
  };

  return (
    <input
      ref={(el) => (inputsRef.current[index] = el)}
      inputMode="numeric"
      maxLength={1}
      defaultValue={char}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={`h-12 w-12 rounded-md border border-neutral-300 bg-white text-center text-xl font-bold text-neutral-900 outline-none ring-offset-2 focus:ring-2 focus:ring-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:ring-white ${className}`}
    />
  );
}


