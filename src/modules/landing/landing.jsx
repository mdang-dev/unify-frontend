'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Image from 'next/image';
import TectNetwork from '@/public/images/t.jpg';
import DataSecurity from '@/public/images/p.jpg';
import Community from '@/public/images/c.jpg';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/src/components/ui/scroll-area';

export default function Landing() {
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x262626);
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7.5);
    directional.castShadow = true;
    scene.add(directional);

    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff, 
      metalness: 0.2,  
      roughness: 0.2,  
      emissive: 0x000000,  
    });

    const torus = new THREE.Mesh(geometry, material);
    torus.castShadow = true;
    torus.receiveShadow = true;
    torus.position.set(0, 0, 0);
    scene.add(torus);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.ShadowMaterial({ opacity: 0.2 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.2;
    floor.receiveShadow = true;
    scene.add(floor);

    const particleCount = 200;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xffffff, // Neutral 800
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;

    let animationFrameId;
    let lastInteraction = Date.now();
    function animate() {
      const now = Date.now();
      if (now - lastInteraction > 2000) {
        torus.rotation.x += 0.005;
        torus.rotation.y += 0.005;
      }
      particles.rotation.y += 0.002;
      controls.update();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    const onInteraction = () => {
      lastInteraction = Date.now();
    };
    canvas.addEventListener('mousedown', onInteraction);
    canvas.addEventListener('touchstart', onInteraction);

    gsap.fromTo(
      '.title',
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out', delay: 0.5 }
    );
    gsap.fromTo(
      '.subtitle',
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out', delay: 0.7 }
    );
    gsap.fromTo(
      '.buttons',
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 1, ease: 'power2.out', delay: 0.9 }
    );

    const handleScroll = () => {
      const sections = document.querySelectorAll('.terms-section');
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
          gsap.to(section, {
            opacity: 1,
            y: 0,
            scale: 1,
            rotate: 0,
            duration: 0.8,
            ease: 'power2.out',
            delay: index * 0.3,
          });
        } else {
          gsap.to(section, {
            opacity: 0,
            y: 20,
            scale: 0.95,
            rotate: 2,
            duration: 0.8,
            ease: 'power2.out',
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      canvas.removeEventListener('mousedown', onInteraction);
      canvas.removeEventListener('touchstart', onInteraction);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={contentRef}
      className="no-scrollbar relative w-full overflow-y-auto overflow-x-hidden scroll-smooth bg-neutral-800 dark:bg-neutral-900"
    >
      <canvas ref={canvasRef} className="absolute left-0 top-0 h-screen w-full" />

      <div className="relative z-10 flex h-screen flex-col items-center justify-center px-4 text-center text-zinc-200">
        <h1 className="title mb-4 text-5xl font-bold">Welcome to Unify</h1>
        <p className="subtitle mb-8 max-w-2xl text-lg">
          Connect, share, and grow with our community-driven platform.
        </p>
        <div className="buttons flex gap-4">
          <button
            onClick={() => router.push('/register')}
            className="rounded-lg bg-neutral-700 px-6 py-3 font-semibold text-zinc-200 shadow-lg transition-transform hover:scale-105 hover:bg-neutral-600"
          >
            Get Started
          </button>
          <button className="rounded-lg bg-zinc-200 px-6 py-3 font-semibold text-neutral-800 shadow-lg transition-transform hover:scale-105 hover:bg-zinc-300">
            Learn More
          </button>
        </div>
      </div>

      <div className="relative z-10 w-full py-12">
        <div className="mx-auto max-w-6xl px-4">
          {/* Section 1 */}
          <div className="terms-section terms-card mb-12 grid translate-y-20 rotate-1 scale-100 grid-cols-1 items-start gap-6 p-6 opacity-0 md:grid-cols-2">
            <div className="text-zinc-200">
              <h2 className="terms-heading mb-4 text-2xl font-bold">Terms of Service</h2>
              <div className="space-y-3 text-sm text-zinc-300">
                <details className="rounded-lg bg-neutral-700/50 p-4 shadow-sm backdrop-blur-md">
                  <summary className="cursor-pointer list-none font-semibold text-zinc-200">
                    Overview
                  </summary>
                  <p className="mt-2 leading-relaxed">
                    Workaholics creates technologies to help people connect and grow businesses...
                  </p>
                </details>
                <details className="rounded-lg bg-neutral-700/50 p-4 shadow-sm backdrop-blur-md">
                  <summary className="cursor-pointer list-none font-semibold text-zinc-200">
                    Agreement
                  </summary>
                  <p className="mt-2 leading-relaxed">
                    These Terms constitute an agreement between you and Workaholics...
                  </p>
                </details>
                <details className="rounded-lg bg-neutral-700/50 p-4 shadow-sm backdrop-blur-md">
                  <summary className="cursor-pointer list-none font-semibold text-zinc-200">
                    Fees & Ads
                  </summary>
                  <p className="mt-2 leading-relaxed">
                    You do not incur fees for using Unify unless specified...
                  </p>
                </details>
                <details className="rounded-lg bg-neutral-700/50 p-4 shadow-sm backdrop-blur-md">
                  <summary className="cursor-pointer list-none font-semibold text-zinc-200">
                    Data Use
                  </summary>
                  <ScrollArea className="mt-2 max-h-48 rounded-md border border-neutral-600 p-3 dark:border-neutral-700">
                    <div className="space-y-2 text-sm leading-relaxed text-zinc-300">
                      <p>We do not sell your personal data...</p>
                    </div>
                  </ScrollArea>
                </details>
              </div>
            </div>
            <Image
              src={TectNetwork}
              alt="Tech Network"
              className="terms-image h-80 w-full rounded-xl object-cover"
            />
          </div>

          <div className="divider mb-12"></div>

          {/* Section 2 */}
          <div className="terms-section terms-card mb-12 grid translate-y-20 rotate-1 scale-100 grid-cols-1 items-start gap-6 p-6 opacity-0 md:grid-cols-2">
            <div className="order-2 text-zinc-200 md:order-1">
              <h2 className="terms-heading mb-4 text-2xl font-bold">Privacy Policy</h2>
              <div className="space-y-3 text-sm text-zinc-300">
                <p className="leading-relaxed">Understand the types of information we collect...</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>How we collect, use, share...</li>
                  <li>Your rights and where to manage...</li>
                  <li>Examples to make our practices clear...</li>
                </ul>
                <ScrollArea className="max-h-48 rounded-md border border-neutral-600 p-3 dark:border-neutral-700">
                  <div className="space-y-2 text-sm leading-relaxed text-zinc-300">
                    <p>You can shape your experience...</p>
                  </div>
                </ScrollArea>
              </div>
            </div>
            <Image
              src={DataSecurity}
              alt="Data Security"
              className="order-1 h-80 w-full rounded-xl object-cover md:order-2"
            />
          </div>

          <div className="divider mb-12"></div>

          {/* Section 3 */}
          <div className="terms-section terms-card mb-12 grid translate-y-20 rotate-1 scale-100 grid-cols-1 items-start gap-6 p-6 opacity-0 md:grid-cols-2">
            <div className="text-zinc-200">
              <h2 className="terms-heading mb-4 text-2xl font-bold">Community Standards</h2>
              <p className="mb-2 text-sm leading-relaxed text-zinc-300">
                Our standards outline what content is allowed...
              </p>
              <ul className="mb-3 grid list-inside list-disc gap-1 text-sm text-zinc-300 md:grid-cols-2">
                <li>Violence and Incitement</li>
                <li>Bullying and Harassment</li>
                <li>Hateful Conduct</li>
                <li>Privacy Violations</li>
              </ul>
              <details className="rounded-lg bg-neutral-700/50 p-4 shadow-sm backdrop-blur-md">
                <summary className="cursor-pointer list-none font-semibold text-zinc-200">
                  More details
                </summary>
                <ScrollArea className="mt-2 max-h-48 rounded-md border border-neutral-600 p-3 dark:border-neutral-700">
                  <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-zinc-300">
                    <li>Standards apply globally...</li>
                  </ul>
                </ScrollArea>
              </details>
            </div>
            <Image
              src={Community}
              alt="Community"
              className="h-80 w-full rounded-xl object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
