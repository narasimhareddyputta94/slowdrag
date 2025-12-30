"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import useIsMobile from "@/components/perf/useIsMobile";
import useNearViewport from "@/components/perf/useNearViewport";
import useAfterFirstPaint from "@/components/perf/useAfterFirstPaint";
import useSiteLoaded from "@/components/perf/useSiteLoaded";

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
      className="group relative grid size-16 place-items-center rounded-full border-0 bg-transparent p-0 outline-none transition active:scale-[0.99] focus:outline-none focus-visible:outline-none"
    >
      <Image
        src="/images/play2.png"
        alt=""
        width={64}
        height={64}
        className="relative z-10 h-10 w-10 border-0 object-contain drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)] transition-transform duration-200 group-hover:scale-[1.06]"
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
        boxShadow:
          "0 0 0 1px rgba(111,231,211,0.18), 0 18px 45px rgba(0,0,0,0.55)",
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

function MiniIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full bg-white/5 ring-1 ring-white/10 backdrop-blur-md active:scale-[0.98] transition"
    >
      {children}
    </button>
  );
}

export default function MobileDesignShowcase() {
  const tealColor = "#6fe7d3";

  const rootRef = useRef<HTMLElement | null>(null);
  const isSmallScreen = useIsMobile(768);
  const near = useNearViewport(rootRef as unknown as React.RefObject<HTMLElement>, { rootMargin: "150px 0px" });
  const siteLoaded = useSiteLoaded();
  const afterFirstPaint = useAfterFirstPaint();
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (activated) return;
    if (siteLoaded && afterFirstPaint && near) setActivated(true);
  }, [activated, afterFirstPaint, near, siteLoaded]);

  const canLoadVideo = activated;

  const films: FilmItem[] = useMemo(() => {
    // Keep identical media to DesignsShowcase
    const poster = isSmallScreen ? "/images/titleimage-1200.webp" : "/images/titleimage-1920.webp";
    return [{ title: "brandbook draft", src: "/mobile_images/brandbook draft.mp4", poster }];
  }, [isSmallScreen]);

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
    if (!canLoadVideo) return;
    const v = videoRef.current;
    if (!v) return;

    v.muted = muted;

    try {
      v.currentTime = 0;
    } catch {}

    v.load();
    const p = v.play();
    if (p) p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [activeIndex, muted, canLoadVideo]);

  // Keep DOM video element in sync with mute state
  useEffect(() => {
    if (!canLoadVideo) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;

    if (!muted) {
      const p = v.play();
      if (p) p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [muted, canLoadVideo]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!near) {
      v.pause();
      return;
    }

    if (canLoadVideo && isPlaying && v.paused) {
      const p = v.play();
      if (p) p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [near, canLoadVideo, isPlaying]);

  const requestIndex = (nextIndex: number) => {
    if (nextIndex === activeIndex) return;

    clearAllTimeouts();
    setPhase("out");

    const t1 = window.setTimeout(() => {
      setActiveIndex(nextIndex);
      setPhase("in");

      const t2 = window.setTimeout(() => setPhase("idle"), 280);
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
      if (p) p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      return;
    }

    v.pause();
    setIsPlaying(false);
  };

  const active = films[activeIndex];
  const videoOpacity = phase === "out" ? 0 : 1;

  // =========================
  // ✅ DESKTOP/TABLET LAYOUT (DUPLICATED FOR MOBILE EDITS)
  // =========================

  const handlePlayerPointerDown = (e: React.PointerEvent) => {
    if (!isPlaying) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest?.("[data-player-control]")) return;

    const v = videoRef.current;
    if (!v) return;
    if (!v.paused) {
      v.pause();
      setIsPlaying(false);
    }
  };

  const shapePath = `
    M 25,0
    L 600,0
    Q 625,0 625,25
    Q 625,50 650,50
    Q 675,50 675,75
    Q 675,100 700,100
    L 940,100
    Q 965,100 965,125
    L 965,300
    L 980,300
    L 1000,300
    L 1000,350
    L 1000,380
    L 1000,430
    L 1000,455
    L 1000,480
    L 800,480
    L 800,540
    L 800,575
    Q 800,600 775,600
    L 600,600
    Q 700,600 675,600
    L 480,600
    L 400,600
    Q 375,600 375,575
    L 375,550
    Q 375,525 350,525
    L 150,525
    L 125,525
    L 100,525
    L 75,525
    L 10,525
    Q 0,525 0,515
    L 0,300
    Q 0,280 25,280
    L 80,280
    Q 100,280 100,255
    Q 100,230 75,230
    Q 50,230 50,200
    Q 50,170 25,170
    Q 0,170 0,150
    L 0,150
    L 0,25
    Q 0,0 25,0
    Z
  `;

  return (
    <section
      ref={rootRef as unknown as React.RefObject<HTMLElement>}
      className="relative w-full min-h-[100svh] text-white overflow-hidden font-sans bg-[#020202]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black" />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(900px 520px at 55% 45%, rgba(255,255,255,0.06), transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[560px] px-5">
        <div className="min-h-[100svh] flex flex-col pt-2 pb-6">
          {/* Top 20%: FILMS */}
          <div className="h-[20svh] min-h-[120px] flex flex-col items-center justify-center text-center">
            <div
              className="text-[42px] font-black tracking-[0.40em] uppercase text-white/90"
              style={{ fontFamily: "var(--font-offbit-101)" }}
            >
              DESIGN
            </div>
            <div className="mt-3 h-px w-14 bg-white/15" />
          </div>

          {/* Player (kept same size/shape) */}
          <div className="flex-none pt-1">
            <div className="relative w-full aspect-[5/3]" onPointerDown={handlePlayerPointerDown}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-5 rounded-[40px] blur-2xl opacity-25"
                style={{
                  background:
                    "radial-gradient(55% 55% at 50% 48%, rgba(111,231,211,0.22), transparent 70%)",
                }}
              />
              <svg
            viewBox="0 0 1000 600"
            className="w-full h-full drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)] pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <clipPath id="blob-clip-design" clipPathUnits="userSpaceOnUse">
                <path d={shapePath} />
              </clipPath>

              <radialGradient
                id="grad1"
                cx="30%"
                cy="30%"
                r="50%"
                fx="30%"
                fy="30%"
              >
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
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.8"
                  numOctaves="3"
                  stitchTiles="stitch"
                />
                <feColorMatrix type="saturate" values="0" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.1" />
                </feComponentTransfer>
              </filter>
            </defs>

            <path d={shapePath} fill="#0a0a0a" />

            <foreignObject
              x="0"
              y="0"
              width="1000"
              height="600"
              clipPath="url(#blob-clip-design)"
            >
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
                    src={canLoadVideo ? encodeURI(active.src) : undefined}
                              poster={canLoadVideo ? active.poster : undefined}
                    muted={muted}
                    playsInline
                    autoPlay
                    loop
                    preload={canLoadVideo ? "metadata" : "none"}
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

            <path
              d={shapePath}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
            />
          </svg>

          {/* Center overlay play button */}
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
            </div>
          </div>

          {/* Fixed gap: 10% of viewport height */}
          <div aria-hidden="true" className="h-[10svh]" />

          {/* Bottom: text + CTA */}
          <div className="min-h-[10svh] flex flex-col items-center text-center pt-2">
            <div className="w-full max-w-[22rem]">
              
              <div
                className="mt-5 text-[22px] leading-[1.08] font-normal tracking-[0.02em] text-white"
                style={{
                  fontFamily: "var(--font-offbit-101)",
                  textShadow: "0 2px 4px rgba(180, 0, 0, 0.9)",
                }}
              >
                <div>visual systems</div>
                <div>spanning editorial,</div>
                <div>spatial,</div>
                <div>digital design</div>
              </div>
            </div>

            {/* Gap between copy and CTA: 10% viewport height */}
            <div aria-hidden="true" className="h-[10svh]" />

            <a
              href="/contact"
              aria-label="Join our story"
              className="group relative flex w-full max-w-[240px] mx-auto min-h-[34px] items-center justify-center overflow-hidden rounded-full bg-transparent text-center px-6 py-5 text-[10px] font-black tracking-[0.42em] uppercase no-underline transition active:scale-[0.99]"
              style={{
                color: tealColor,
                backgroundColor: "rgba(0,0,0,0.22)",
                boxShadow:
                  "0 0 0 1px rgba(111,231,211,0.65), 0 18px 45px rgba(0,0,0,0.55)",
              }}
            >
              <span
                className="relative z-10 no-underline"
                style={{ fontFamily: "var(--font-offbit-101)" }}
              >
                JOIN OUR STORY
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
