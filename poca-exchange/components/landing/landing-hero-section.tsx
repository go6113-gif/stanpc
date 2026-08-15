"use client";

import { useRef, useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { LandingHero } from "./landing-hero";

export function LandingHeroSection({ gridRef }: { gridRef?: React.RefObject<HTMLDivElement | null> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSoundOn, setIsSoundOn] = useState(false);

  // Seamless loop: reset timeline before video ends to avoid black screen
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      // If video is very close to the end (98% or more), reset to beginning
      if (
        videoElement.duration &&
        videoElement.currentTime >= videoElement.duration * 0.98
      ) {
        videoElement.currentTime = 0;
      }
    };

    // Fallback: if ended event fires anyway, reset immediately
    const handleEnded = () => {
      videoElement.currentTime = 0;
      videoElement.play().catch(() => {
        // Playback may be blocked by browser policy, continue gracefully
      });
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("ended", handleEnded);

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      videoElement.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Ensure sound state syncs with muted attribute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isSoundOn;
    }
  }, [isSoundOn]);

  const toggleSound = () => {
    setIsSoundOn((prev) => !prev);
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#0F0F12]">
      {/* Background Video - Primary with full preload and seamless looping */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        preload="auto"
        muted={!isSoundOn}
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/videos/landing-hero.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay for Readability - consistent throughout loop */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* Sound Toggle Button */}
      <button
        type="button"
        onClick={toggleSound}
        className="absolute bottom-6 right-6 z-20 rounded-full bg-black/50 p-3 text-white hover:bg-black/70 transition-colors backdrop-blur-sm border border-white/20"
        title={isSoundOn ? "사운드 끄기" : "사운드 켜기"}
        aria-label={isSoundOn ? "사운드 끄기" : "사운드 켜기"}
      >
        {isSoundOn ? (
          <Volume2 size={20} />
        ) : (
          <VolumeX size={20} />
        )}
      </button>

      {/* Hero Content - positioned above video and overlay */}
      <div className="relative z-10">
        <LandingHero gridRef={gridRef} />
      </div>
    </div>
  );
}
