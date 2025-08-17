'use client';

import { useState, useEffect, useRef } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useTheme } from 'next-themes';

// Simple particle effect component
export function ParticleEffect({ theme }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Setup canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      const particleCount = 50;
      particlesRef.current = [];

      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Particle colors compatible with black/white theme
      const particleColor = theme === 'dark' ? '255, 255, 255' : '100, 100, 100';

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Keep particles within canvas bounds
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${particle.opacity})`;
        ctx.fill();

        // Light twinkling effect
        particle.opacity += (Math.random() - 0.5) * 0.02;
        if (particle.opacity < 0.1) particle.opacity = 0.1;
        if (particle.opacity > 0.6) particle.opacity = 0.6;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: 'transparent' }}
    />
  );
}

export default function CaptchaScreen({ setToken }) {
  const { theme } = useTheme();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-white dark:bg-neutral-900">
      {/* Background particle effect */}
      <ParticleEffect theme={theme} />

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-md px-6 text-center">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-800 shadow-2xl dark:bg-gray-200">
            <svg
              className="h-10 w-10 text-white dark:text-gray-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        </div>

        {/* Main title */}
        <h1 className="mb-4 text-4xl font-extrabold leading-tight text-gray-900 dark:text-white">
          Welcome to Unify
        </h1>

        {/* Status notification */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-xl backdrop-blur-sm dark:border-gray-500 dark:bg-neutral-900/20">
          {isVerifying ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-transparent dark:border-gray-400"></div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">
                Verifying your identity...
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-gray-700 dark:text-gray-300">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.081 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span className="font-semibold">Security Check Required</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Please verify you are human to continue. This helps us protect our platform from
                automated threats.
              </p>
            </div>
          )}
        </div>

        {/* Captcha */}
        <div className="mb-4">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            className="m-auto"
            theme={theme === 'dark' ? 'dark' : 'light'}
            onSuccess={(token) => {
              setIsVerifying(true);
              setTimeout(() => setToken(token), 1500); // Delay to show animation
            }}
          />
        </div>

        {/* Additional information */}
        <div className="text-center">
          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            Protected by Cloudflare Turnstile • Your privacy is important to us
          </p>

          {/* Progress dots */}
          <div className="mt-4 flex justify-center space-x-2">
            <div
              className={`h-2 w-2 rounded-full transition-all duration-300 ${isVerifying ? 'animate-bounce bg-gray-700 dark:bg-gray-300' : 'bg-gray-300 dark:bg-gray-600'}`}
            ></div>
            <div
              className={`h-2 w-2 rounded-full transition-all delay-100 duration-300 ${isVerifying ? 'animate-bounce bg-gray-700 dark:bg-gray-300' : 'bg-gray-300 dark:bg-gray-600'}`}
            ></div>
            <div
              className={`h-2 w-2 rounded-full transition-all delay-200 duration-300 ${isVerifying ? 'animate-bounce bg-gray-700 dark:bg-gray-300' : 'bg-gray-300 dark:bg-gray-600'}`}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
