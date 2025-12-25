"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type FilmItem = {
  title: string;
  src: string;
  poster?: string;
};

function CenterPlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Play video"
      className="group relative grid size-20 place-items-center rounded-full border-0 bg-transparent p-0 outline-none transition active:scale-[0.99] focus:outline-none focus-visible:outline-none"
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

export default function FilmsShowcase() {
  const brandColor = "#c6376c";
  const tealColor = "#6fe7d3";

  const films: FilmItem[] = useMemo(
    () => {
      const videoFiles = [
        "Slowdrag 1_subs.mov",
        "Slowdrag 2_subs.mov",
        "Slowdrag 3_subs.mov",
      ].sort((a, b) => a.localeCompare(b));

      return videoFiles.map((name) => ({
        title: name.replace(/\.[^./]+$/, ""),
        src: `/website_videos/${encodeURIComponent(name)}`,
      }));
    },
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Keep track of timeouts so we can clear them (prevents "stuck" phase)
  const timeoutsRef = useRef<number[]>([]);
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  // When activeIndex changes, force reload + play from start
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = muted;

    // reset + reload
    try {
      v.currentTime = 0;
    } catch {}
    v.load();

    const p = v.play();
    if (p) {
      p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [activeIndex, muted]);

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

  const requestIndex = (nextIndex: number) => {
    if (nextIndex === activeIndex) return;

    // If user clicks fast, we’ll just restart the transition cleanly
    clearAllTimeouts();

    setPhase("out");

    const t1 = window.setTimeout(() => {
      setActiveIndex(nextIndex);
      setPhase("in");

      const t2 = window.setTimeout(() => {
        setPhase("idle");
      }, 280);

      timeoutsRef.current.push(t2);
    }, 280);

    timeoutsRef.current.push(t1);
  };

  const next = () => requestIndex((activeIndex + 1) % films.length);
  const prev = () => requestIndex((activeIndex - 1 + films.length) % films.length);

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

  const shapePath = `
    M 120,120
    A 26 26 0 0 0 145,95
    A 26 26 0 0 1 165,70
    A 26 26 0 0 0 190,35
    A 26 26 0 0 1 210,0
    L 780,0
    L 804,0
    A 26 26 0 0 1 830,26
    L 830,40

    A 26 26 0 0 0 855,66
    L 900,65
    L 976,65
    A 26 26 0 0 1 1000,91
    L 1000,530
    A 26 26 0 0 1 974,556
    L 930,555
    L 700,555
    A 28 28 0 0 0 674,600
    L 600,600
    L 200,600
    A 26 26 0 0 1 160,576
    A 26 26 0 0 0 120,552
    A 26 26 0 0 1 80,528
    A 26 26 0 0 0 40,504
    A 26 26 0 0 1 0,480
    L 0,430
    L 0,170
    L 0,146
    A 26 26 0 0 1 26,120
    L 120,120
    Z
  `;

  const active = films[activeIndex];
  const videoOpacity = phase === "out" ? 0 : 1;

  return (
    <section className="relative w-full min-h-screen text-white overflow-hidden flex items-center justify-center font-sans">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black" />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(900px 520px at 55% 45%, rgba(255,255,255,0.06), transparent 60%)",
        }}
      />

      <div className="relative w-[95%] md:w-[90%] lg:w-[80%] xl:w-[70%] max-w-[1200px] flex items-center justify-center z-10">
        <div
          className="relative w-full aspect-[5/3]"
          onPointerDown={handlePlayerPointerDown}
        >
          <svg
            viewBox="0 0 1000 600"
            className="w-full h-full drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)] pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <clipPath id="blob-clip" clipPathUnits="userSpaceOnUse">
                <path d={shapePath} />
              </clipPath>

              <radialGradient id="grad1" cx="30%" cy="30%" r="50%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="rgba(111,231,211,0.35)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id="grad2" cx="70%" cy="60%" r="60%">
                <stop offset="0%" stopColor="rgba(198,55,108,0.55)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id="grad3" cx="90%" cy="90%" r="50%">
                <stop offset="0%" stopColor="rgba(255,220,140,0.3)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              <filter id="noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.1" />
                </feComponentTransfer>
              </filter>
            </defs>

            <path d={shapePath} fill="#0a0a0a" />

            <foreignObject x="0" y="0" width="1000" height="600" clipPath="url(#blob-clip)">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  background: "#0a0a0a",
                  overflow: "hidden",
                }}
              >
                {active?.src ? (
                  <video
                    ref={videoRef}
                    src={active.src}
                    poster={active.poster}
                    muted={muted}
                    playsInline
                    autoPlay
                    preload="metadata"
                    onEnded={next}
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
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                      display: "block",
                      transform: "scale(1.34)",
                      transformOrigin: "center",
                      opacity: videoOpacity,
                      transition: "opacity 280ms ease",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background:
                        "radial-gradient(800px 520px at 30% 35%, rgba(111,231,211,0.20), transparent 60%), radial-gradient(900px 520px at 65% 62%, rgba(198,55,108,0.28), transparent 62%), radial-gradient(700px 420px at 88% 90%, rgba(255,220,140,0.18), transparent 60%), #0a0a0a",
                      opacity: videoOpacity,
                      transition: "opacity 280ms ease",
                    }}
                  />
                )}
              </div>
            </foreignObject>

            <path d={shapePath} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          </svg>

          {/* Center overlay play button (kept outside SVG so blend layers don't tint it) */}
          {!isPlaying ? (
            <div
              data-player-control
              className="absolute z-40"
              style={{
                left: "50%",
                top: "48%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <CenterPlayButton onClick={togglePlay} />
            </div>
          ) : null}

          {/* Top Left Pill */}
          <div data-player-control className="absolute top-[10%] left-[2.5%] z-30">
            <div className="relative group">
              <div
                className="absolute inset-0 blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-full"
                style={{ background: tealColor }}
              />
              <button
                type="button"
                className="relative w-[260px] h-[48px] px-8 py-3 rounded-full text-base font-bold tracking-[0.25em] text-white transition-all flex items-center justify-end"
                style={{
                  background: "rgba(0, 0, 0, 1)",
                  color: "#fff",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: `3px solid ${tealColor}`,
                  left: "-130px",
                  bottom: "-20px",
                  
                }}
              >
                FILMS
              </button>
            </div>
          </div>

          {/* Audio Control (glossy, bottom-right) */}
          <div
            data-player-control
            className="absolute z-40 flex items-center"
            style={{ right: "24px", bottom: "80px" }}
          >
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
                {muted ? <path d="M22 9l-7 7" /> : <>
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M18.8 6.2a8.5 8.5 0 0 1 0 11.6" />
                </>}
              </svg>
            </ControlButton>
          </div>

          {/* Bottom Right CTA */}
          <div data-player-control className="absolute bottom-[6%] right-[3%] z-30">
            <button
              type="button"
                className="relative w-[450px] h-[48px] px-8 py-3 rounded-full text-base font-bold tracking-[0.25em] text-white transition-all flex items-center justify-end"
                style={{
                  background: "rgba(0, 0, 0, 1)",
                  color: "#fff",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: `3px solid ${tealColor}`,
                  right: "-110px",
                  bottom: "-40px",
                  
                }}
            >
              MAKE US A PART OF YOUR STORY TELLING
            </button>
          </div>

          {/* Cursor Arrows */}
          <button
            data-player-control
            type="button"
            onClick={prev}
            className="group absolute top-1/2 -translate-y-1/2 z-50 bg-transparent border-none p-0 focus:outline-none"
            style={{ left: "-60px" }}
            aria-label="Previous"
          >
            <img
              src="/images/cursor-new.png"
              alt="Previous"
              style={{ width: "40px", height: "40px" }}
              className="object-contain rotate-225 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(232,233,56,0.6)]"
            />
          </button>

          <button
            data-player-control
            type="button"
            onClick={next}
            className="group absolute top-1/2 -translate-y-1/2 z-50 bg-transparent border-none p-0 focus:outline-none"
            style={{ right: "-60px" }}
            aria-label="Next"
          >
            <img
              src="/images/cursor-new.png"
              alt="Next"
              style={{ width: "40px", height: "40px" }}
              className="object-contain rotate-45 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(232,233,56,0.6)]"
            />
          </button>

          {/* Bottom Left Menu */}
          <div
            data-player-control
            className="absolute bottom-[2%] left-[1%] z-30 flex flex-col items-start w-[220px] rounded-xl px-3 py-2"
            style={{ left: "-80px", bottom:"-15px"}}
          >
            <div
              className="text-[24px] leading-[1.05] font-normal tracking-[0.02em] text-white"
              style={{ textShadow: "0 2px 4px rgba(180, 0, 0, 0.9)" }}
            >
              <div>We work across</div>
              <div>narrative</div>
              <div>experimental films,</div>
              <div>commercials & films,</div>
              <div>documentaries</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
