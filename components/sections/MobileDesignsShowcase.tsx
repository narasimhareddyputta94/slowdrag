"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type DesignItem = {
  title: string;
  src: string;
};

function CenterPlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Play video"
      className="group relative grid size-20 place-items-center rounded-full border-0 bg-transparent p-0 outline-none transition active:scale-[0.99] focus:outline-none focus-visible:outline-none"
      data-player-control
    >
      <img
        src="/images/play2.png"
        alt=""
        className="relative z-10 h-12 w-12 border-0 object-contain drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)] transition-transform duration-200 group-hover:scale-[1.06]"
      />
    </button>
  );
}

function ControlButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      data-player-control
      className="group relative grid size-12 place-items-center rounded-full bg-black/35 backdrop-blur-md ring-1 ring-white/10 transition hover:bg-black/45 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      style={{
        boxShadow: "0 0 0 1px rgba(111,231,211,0.18), 0 18px 45px rgba(0,0,0,0.55)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 via-white/10 to-transparent opacity-75 transition-opacity duration-200 group-hover:opacity-95"
      />
      <span
        aria-hidden
        className="absolute inset-[1px] rounded-full bg-gradient-to-br from-white/5 to-black/50 opacity-80"
      />
      <span
        aria-hidden
        className="absolute top-[10%] left-1/2 h-[36%] w-[72%] -translate-x-1/2 rounded-full bg-white/10 blur-md"
      />
      <span className="relative z-10 transition-transform duration-200 group-hover:scale-[1.05]">
        {children}
      </span>
    </button>
  );
}

export default function MobileDesignsShowcase() {
  const tealColor = "#6fe7d3";
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const designs: DesignItem[] = useMemo(
    () =>
      [
        { title: "brandbook draft", src: "/mobile_images/brandbook draft.mp4" }
      ],
    []
  );

  const hasDesigns = designs.length > 0;

  const handleNext = () => {
    if (!hasDesigns) return;
    setActiveIndex((prev) => (prev + 1) % designs.length);
  };

  const handlePrev = () => {
    if (!hasDesigns) return;
    setActiveIndex((prev) => (prev - 1 + designs.length) % designs.length);
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Keep DOM video element in sync with mute state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (!muted) {
      const p = v.play();
      if (p) {
        p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  }, [muted]);

  const toggleMute = () => setMuted((m) => !m);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      const p = v.play();
      if (p) {
        p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
      return;
    }
    v.pause();
    setIsPlaying(false);
  };

  const pauseVideo = () => {
    const v = videoRef.current;
    if (!v) return;
    if (!v.paused) {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handlePlayerPointerDown = (e: React.PointerEvent) => {
    if (!isPlaying) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest?.("[data-player-control]")) return;
    pauseVideo();
  };

  const currentDesign = hasDesigns ? designs[activeIndex] : undefined;

  return (
    <section className="relative w-full h-[100svh] bg-[#020202] text-white flex flex-col overflow-hidden select-none font-sans">
      <header className="h-[12vh] flex flex-col items-center justify-center z-50 px-6 relative">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "1em" }}
          animate={{ opacity: 1, letterSpacing: "0.5em" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <h2 className="text-3xl font-black uppercase italic tracking-[0.5em] text-white/90">
            Designs
          </h2>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "40px" }}
            transition={{ delay: 0.8, duration: 1 }}
            className="h-[1px] bg-teal-500 mt-3"
          />
        </motion.div>
      </header>

      <main
        className="relative h-[76vh] w-full overflow-hidden"
        onPointerDown={handlePlayerPointerDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="absolute inset-0 bg-black" />
        <motion.div
          aria-hidden="true"
          className="absolute -inset-12 pointer-events-none opacity-[0.22] blur-2xl"
          animate={{
            x: [0, 10, -8, 0],
            y: [0, -12, 10, 0],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background:
              "radial-gradient(circle at 30% 35%, rgba(45,212,191,0.18), transparent 45%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.10), transparent 52%)",
          }}
        />
        <div className="absolute inset-0 pointer-events-none opacity-[0.10] mix-blend-overlay bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Grain.jpg')]" />

        <AnimatePresence mode="wait">
          {currentDesign ? (
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 36, rotate: 2, scale: 0.98, filter: "brightness(0.3) contrast(1.15)" }}
              animate={{ opacity: 1, x: 0, rotate: 0, scale: 1, filter: "brightness(1) contrast(1)" }}
              exit={{ opacity: 0, x: -36, rotate: -2, scale: 1.02, filter: "blur(14px)" }}
              transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <motion.video
                ref={videoRef}
                src={encodeURI(currentDesign.src)}
                aria-label={currentDesign.title}
                className="absolute inset-0 w-full h-full object-contain"
                muted={muted}
                autoPlay
                loop
                playsInline
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onCanPlay={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  v.muted = muted;
                  const p = v.play();
                  if (p) {
                    p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                  }
                }}
              />

              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#020202] to-transparent z-10" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#020202] to-transparent z-10" />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center text-white/60 px-8 text-center"
            >
              Add images to <span className="text-white/80">public/images/mobile_images/branding</span> and update the
              list in this component.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center overlay play button */}
        {!isPlaying ? (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ pointerEvents: "auto" }}
          >
            <CenterPlayButton onClick={togglePlay} />
          </div>
        ) : null}

        {/* Bottom-right controls: play/pause + mute */}
        <div className="absolute z-30 flex items-center gap-3" style={{ right: "16px", bottom: "16px" }}>
          <ControlButton onClick={togglePlay} pressed={isPlaying} label={isPlaying ? "Pause video" : "Play video"}>
            {isPlaying ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={tealColor}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
              >
                <path d="M7 5v14" />
                <path d="M17 5v14" />
              </svg>
            ) : (
              <img src="/images/play2.png" alt="" className="h-6 w-6 object-contain" />
            )}
          </ControlButton>

          <ControlButton onClick={toggleMute} pressed={!muted} label={muted ? "Unmute video" : "Mute video"}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke={tealColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
            >
              <path d="M11 5L6 9H3v6h3l5 4V5z" />
              {muted ? (
                <path d="M22 9l-7 7" />
              ) : (
                <>
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M18.8 6.2a8.5 8.5 0 0 1 0 11.6" />
                </>
              )}
            </svg>
          </ControlButton>
        </div>
      </main>

      <footer className="h-[12vh] w-full px-8 flex items-center justify-end z-50 bg-[#020202]">
        <div className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
          Hold to pause
        </div>
      </footer>
    </section>
  );
}
