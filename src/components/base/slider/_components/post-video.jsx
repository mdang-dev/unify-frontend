import React, { useState, useEffect, useRef } from 'react';

const PostVideo = ({ src }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const toggleMute = () => setIsMuted((prev) => !prev);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play();
          setIsPlaying(true);
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        className="absolute right-2 top-2 z-10 rounded-full p-2 text-white transition"
        aria-label={isMuted ? 'Unmute Video' : 'Mute Video'}
      >
        <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
      </button>

      <video
        ref={videoRef}
        autoPlay={isPlaying}
        muted={isMuted}
        loop
        playsInline
        className="object-containt relative z-0 h-full w-full rounded-lg"
      >
        <source src={src} type="video/mp4" />
      </video>
    </>
  );
};

export default PostVideo;
