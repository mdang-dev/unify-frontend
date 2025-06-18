import React, { useRef, forwardRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// eslint-disable-next-line react/display-name
const PostReels = forwardRef(
  ({ src: initialSrc, muted, loop, onPauseChange, onMuteChange }, ref) => {
    const [isPaused, setIsPaused] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
      console.log('Received src in PostReels:', initialSrc);
      if (!initialSrc) {
        console.error('Invalid or missing src in PostReels');
      }
    }, [initialSrc]);

    useEffect(() => {
      if (videoRef.current && videoRef.current.muted !== muted) {
        videoRef.current.muted = muted;
      }
    }, [muted]);

    const toggleMute = () => {
      const newMuted = !muted;
      if (videoRef.current) videoRef.current.muted = newMuted;
      onMuteChange(newMuted);
    };

    const togglePlayPause = () => {
      const video = videoRef.current;
      if (!video) return;

      if (video.paused) {
        video.play().catch((err) => console.error('Play error:', err));
        setIsPaused(false);
        onPauseChange(false);
      } else {
        video.pause();
        setIsPaused(true);
        onPauseChange(true);
      }
    };

    return (
      <div
        className="absolute inset-0 my-2 flex items-center justify-center overflow-hidden rounded-md border-white/20 shadow-[0_0_900px_rgba(0,0,0,0.1)] dark:shadow-[0_0_500px_rgba(255,255,255,0.1)]"
        onClick={togglePlayPause}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="absolute right-2 top-2 z-10 rounded-full p-2 text-white transition"
          aria-label={muted ? 'Unmute Video' : 'Mute Video'}
        >
          <i className={`fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
        </button>

        <AnimatePresence>
          {isPaused && (
            <motion.div
              className="absolute z-[5] flex h-20 w-20 items-center justify-center rounded-full bg-neutral-800 bg-opacity-55"
              initial={{ opacity: 0, scale: 1.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <i className="fa-solid fa-play text-2xl text-white"></i>
            </motion.div>
          )}
        </AnimatePresence>
        <video
          ref={(el) => {
            ref(el);
            videoRef.current = el;
          }}
          muted={muted}
          loop={loop}
          className="h-full w-[430] rounded-md bg-black"
          playsInline
          onError={(e) => console.error('Video error:', e)}
        >
          {initialSrc ? (
            <source src={initialSrc} type="video/mp4" />
          ) : (
            <p>No valid video source provided.</p>
          )}
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }
);

export default PostReels;
