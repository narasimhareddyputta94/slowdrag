"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type FilmItem = {
  title: string;
  src: string;
  category: string;
};

export default function MobileFilmsShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const films: FilmItem[] = useMemo(() => {
    // Keep mobile in sync with the desktop FilmsShowcase sources.
    const videoFiles = [
      "Slowdrag 1_subs.mov",
      "Slowdrag 2_subs.mov",
      "Slowdrag 3_subs.mov",
      "Showreel.mov",
    ].sort((a, b) => a.localeCompare(b));

    return videoFiles.map((name) => ({
      title: name.replace(/\.[^./]+$/, ""),
      src: `/website_videos/${encodeURIComponent(name)}`,
      category: "FILM",
    }));
  }, []);

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % films.length);
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + films.length) % films.length);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const updateProgress = () => setProgress((v.currentTime / v.duration) * 100);
    v.addEventListener("timeupdate", updateProgress);
    return () => v.removeEventListener("timeupdate", updateProgress);
  }, [activeIndex]);

  const currentFilm = films[activeIndex];

  return (
    <section className="relative w-full bg-[#020202] text-white flex flex-col overflow-hidden select-none font-offbit">
      {/* Subtle premium backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(1000px 600px at 20% 15%, rgba(20,144,125,0.18), transparent 65%), radial-gradient(900px 520px at 80% 70%, rgba(255,255,255,0.06), transparent 70%)",
        }}
      />
      
      {/* --- 10% HEADER: MUSEUM STYLING --- */}
      <header className="flex flex-col items-center justify-center z-50 px-6 pt-10 pb-6 relative">
        <motion.div 
          initial={{ opacity: 0, letterSpacing: "1em" }}
          animate={{ opacity: 1, letterSpacing: "0.5em" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <h1 className="text-3xl font-black uppercase italic tracking-[0.5em] text-white/90">
            Films
          </h1>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "40px" }}
            transition={{ delay: 0.8, duration: 1 }}
            className="h-[1px] bg-teal-500 mt-3"
          />
        </motion.div>
      </header>

      {/* --- FULLSCREEN PLAYER (16:9) --- */}
      <main 
        className="relative h-[100svh] w-full overflow-hidden flex items-center justify-center"
        onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
        onTouchEnd={(e) => {
          if (!touchStart) return;
          const dist = touchStart - e.changedTouches[0].clientX;
          if (dist > 50) handleNext();
          else if (dist < -50) handlePrev();
          else setIsPlaying(!isPlaying);
          setTouchStart(null);
        }}
      >
        <div className="relative h-full aspect-video overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, filter: "brightness(0.2) contrast(1.2)" }}
              animate={{ opacity: 1, filter: "brightness(1) contrast(1)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
              className="relative w-full h-full"
            >
              <video
                ref={videoRef}
                src={currentFilm.src}
                muted={isMuted}
                autoPlay
                playsInline
                onEnded={handleNext}
                className="w-full h-full object-cover scale-[1.02] pointer-events-none"
              />
              {/* Edge softening gradients */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#020202] to-transparent z-10" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#020202] to-transparent z-10" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Center Play Icon (Only on Pause) */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 flex items-center justify-center z-20"
            >
              <div className="size-20 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- CONTENT BELOW PLAYER --- */}
      <footer className="w-full px-8 pt-10 pb-10 z-50 bg-[#020202]">
        
        <div className="flex flex-col gap-7">
          {/* Narrative Description with Animated Weights */}
          <div className="flex flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="text-center"
              >
                
                <p className="text-[16px] leading-snug text-white/75 max-w-[300px] mx-auto tracking-[0.08em] uppercase">
                  We work across <span className="text-white font-bold italic underline decoration-teal-500/30 underline-offset-4">narrative landscapes</span> to bring experimental emotion to life.
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* INFINITY BUTTON: LIQUID SHINE EFFECT */}
          <Link href="/contact" className="relative group block">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-16 w-full rounded-full bg-white text-black flex items-center justify-center overflow-hidden shadow-[0_20px_40px_rgba(255,255,255,0.12)] ring-1 ring-black/10"
            >
              <motion.div 
                animate={{ x: ['-150%', '150%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-400/40 to-transparent skew-x-[35deg]"
              />
              <div className="absolute inset-0 rounded-full ring-1 ring-white/40" />
              <span className="relative z-10 text-[12px] font-black tracking-[0.6em] uppercase">
                Join Our Story
              </span>
            </motion.div>
          </Link>
        </div>

        {/* Global Progress & Mute */}
        <div className="flex justify-between items-center mt-10">
          <div className="flex gap-2 items-center">
            {films.map((_, i) => (
              <div key={i} className="h-0.5 bg-white/10 w-6 rounded-full overflow-hidden">
                {i === activeIndex && (
                  <motion.div 
                    layoutId="activeBar"
                    className="h-full bg-teal-500"
                    style={{ width: `${progress}%` }}
                  />
                )}
                {i < activeIndex && <div className="h-full bg-white/40 w-full" />}
              </div>
            ))}
          </div>

          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="group flex items-center gap-3 active:scale-90 transition-transform"
          >
            <span className="text-[10px] font-bold tracking-[0.2em] text-white/40 group-hover:text-white transition-colors uppercase">
              {isMuted ? 'Audio Off' : 'Audio On'}
            </span>
            <div className={`size-2 rounded-full ${isMuted ? 'bg-white/20' : 'bg-teal-400 shadow-[0_0_10px_#2dd4bf]'}`} />
          </button>
        </div>
      </footer>

      {/* --- FILM GRAIN & TEXTURE OVERLAY --- */}
      <div className="absolute inset-0 z-[100] pointer-events-none opacity-[0.05] mix-blend-overlay bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Grain.jpg')]" />
    </section>
  );
}