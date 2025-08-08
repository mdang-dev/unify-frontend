'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Image from 'next/image';
import TectNetwork from '@/public/images/tech_network.png';
import DataSecurity from '@/public/images/data_security.png';
import Community from '@/public/images/community.png';
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
      color: 0x4f46e5,
      metalness: 0.7,
      roughness: 0.2,
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
      color: 0x4f46e5,
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
      className="no-scrollbar relative w-full overflow-y-auto overflow-x-hidden scroll-smooth bg-gradient-to-b from-gray-900 to-indigo-900"
    >
      <canvas ref={canvasRef} className="absolute left-0 top-0 h-screen w-full" />

      <div className="relative z-10 flex h-screen flex-col items-center justify-center px-4 text-center text-white">
        <h1 className="title mb-4 text-5xl font-bold">Welcome to Unify</h1>
        <p className="subtitle mb-8 max-w-2xl text-lg">
          Connect, share, and grow with our community-driven platform.
        </p>
        <div className="buttons flex gap-4">
          <button
            onClick={() => router.push('/register')}
            className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold shadow-lg transition-transform hover:scale-105 hover:bg-indigo-500"
          >
            Get Started
          </button>
          <button className="rounded-lg bg-white px-6 py-3 font-semibold text-indigo-600 shadow-lg transition-transform hover:scale-105 hover:bg-gray-100">
            Learn More
          </button>
        </div>
      </div>

      <div className="relative z-10 w-full py-12">
        <div className="mx-auto max-w-6xl px-4">
          {/* Section 1: Terms of Service with collapsible items and scrollable content */}
          <div className="terms-section terms-card mb-12 grid translate-y-20 rotate-1 scale-100 grid-cols-1 items-start gap-6 p-6 opacity-0 md:grid-cols-2">
            <div className="text-white">
              <h2 className="terms-heading mb-4 text-2xl font-bold">Terms of Service</h2>
              <div className="space-y-3 text-sm text-gray-200">
                <details className="rounded-lg bg-white/5 p-4 shadow-sm backdrop-blur-md">
                  <summary className="cursor-pointer list-none font-semibold text-white">Overview</summary>
                  <p className="mt-2 leading-relaxed">
                    Workaholics creates technologies to help people connect and grow businesses. These Terms govern your use of Unify and other products unless separate terms apply.
                  </p>
                </details>
                <details className="rounded-lg bg-white/5 p-4 shadow-sm backdrop-blur-md">
                  <summary className="cursor-pointer list-none font-semibold text-white">Agreement</summary>
                  <p className="mt-2 leading-relaxed">
                    These Terms constitute an agreement between you and Workaholics. If you do not agree, please do not use our services.
                  </p>
                </details>
                <details className="rounded-lg bg-white/5 p-4 shadow-sm backdrop-blur-md">
                  <summary className="cursor-pointer list-none font-semibold text-white">Fees & Ads</summary>
                  <p className="mt-2 leading-relaxed">
                    You do not incur fees for using Unify unless specified. We display relevant ads based on your data preferences.
                  </p>
                </details>
                <details className="rounded-lg bg-white/5 p-4 shadow-sm backdrop-blur-md">
                  <summary className="cursor-pointer list-none font-semibold text-white">Data Use</summary>
                  <ScrollArea className="mt-2 max-h-48 rounded-md border border-white/10 p-3">
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>
                        We do not sell your personal data. We do not share information that directly identifies you unless you grant permission.
                      </p>
                      <p>
                        Advertisers provide audience preferences. We show their ads to people who might be interested and provide performance metrics.
                      </p>
                      <p>
                        We may update these practices over time. Please review this section regularly.
                      </p>
                    </div>
                  </ScrollArea>
                </details>
              </div>
            </div>
            <Image src={TectNetwork} alt="Tech Network" className="terms-image h-80 w-full rounded-xl object-cover" />
          </div>

          <div className="divider mb-12"></div>

          {/* Section 2: Privacy Policy */}
          <div className="terms-section terms-card mb-12 grid translate-y-20 rotate-1 scale-100 grid-cols-1 items-start gap-6 p-6 opacity-0 md:grid-cols-2">
            <div className="order-2 text-white md:order-1">
              <h2 className="terms-heading mb-4 text-2xl font-bold">Privacy Policy</h2>
              <div className="space-y-3 text-sm text-gray-200">
                <p className="leading-relaxed">
                  Understand the types of information we collect and how we use and share that information.
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>How we collect, use, share, store, and transfer information</li>
                  <li>Your rights and where to manage your information</li>
                  <li>Examples to make our practices clear and accessible</li>
                </ul>
                <ScrollArea className="max-h-48 rounded-md border border-white/10 p-3">
                  <div className="space-y-2 text-sm leading-relaxed">
                    <p>
                      You can shape your experience by adjusting privacy settings in the products you use.
                    </p>
                    <p>
                      We include links to resources so you can learn more about topics that interest you.
                    </p>
                  </div>
                </ScrollArea>
              </div>
            </div>
            <Image src={DataSecurity} alt="Data Security" className="order-1 h-80 w-full rounded-xl object-cover md:order-2" />
          </div>

          <div className="divider mb-12"></div>

          {/* Section 3: Community Standards */}
          <div className="terms-section terms-card mb-12 grid translate-y-20 rotate-1 scale-100 grid-cols-1 items-start gap-6 p-6 opacity-0 md:grid-cols-2">
            <div className="text-white">
              <h2 className="terms-heading mb-4 text-2xl font-bold">Community Standards</h2>
              <p className="mb-2 text-sm leading-relaxed text-gray-200">
                Our standards outline what content is allowed and not allowed on our services.
              </p>
              <ul className="mb-3 grid list-inside list-disc gap-1 text-sm text-gray-200 md:grid-cols-2">
                <li>Violence and Incitement</li>
                <li>Bullying and Harassment</li>
                <li>Hateful Conduct</li>
                <li>Privacy Violations</li>
                <li>Spam</li>
                <li>Misinformation</li>
                <li>Cybersecurity</li>
                <li>Account Integrity</li>
              </ul>
              <details className="rounded-lg bg-white/5 p-4 shadow-sm backdrop-blur-md">
                <summary className="cursor-pointer list-none font-semibold text-white">More details</summary>
                <ScrollArea className="mt-2 max-h-48 rounded-md border border-white/10 p-3">
                  <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed">
                    <li>Standards apply globally and to all content, including AI-generated.</li>
                    <li>Some content may require additional context or age restrictions.</li>
                    <li>We value diverse perspectives and work with experts to refine policies.</li>
                  </ul>
                </ScrollArea>
              </details>
            </div>
            <Image src={Community} alt="Community" className="h-80 w-full rounded-xl object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}
