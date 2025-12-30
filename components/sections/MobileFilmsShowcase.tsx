"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import useIsMobile from "@/components/perf/useIsMobile";
import useNearViewport from "@/components/perf/useNearViewport";
import useAfterFirstPaint from "@/components/perf/useAfterFirstPaint";
import useSiteLoaded from "@/components/perf/useSiteLoaded";

type FilmItem = {
  title: string;
  src: string;
  poster?: string;
};

function PlayIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
    >
      <path
        d="M10.15 7.25c0-.9.98-1.45 1.75-.99l7.35 4.49c.74.45.74 1.52 0 1.97l-7.35 4.49c-.77.47-1.75-.09-1.75-.99v-9.97Z"
        fill={color}
      />
    </svg>
  );
}

function MiniControlButton({
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
      onClick={onClick}
      aria-label={label}
      className="group relative grid size-11 place-items-center rounded-full bg-black/80 supports-[backdrop-filter]:bg-black/60 backdrop-blur-md ring-1 ring-white/20 transition hover:bg-black/85 supports-[backdrop-filter]:hover:bg-black/70 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      data-player-control
      style={{
        boxShadow: "0 0 0 1px rgba(232,233,56,0.18), 0 18px 45px rgba(0,0,0,0.55)",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 via-white/10 to-transparent opacity-75 transition-opacity duration-200 group-hover:opacity-95"
      />
      <span aria-hidden="true" className="absolute inset-[1px] rounded-full bg-gradient-to-br from-white/5 to-black/50 opacity-80" />
      <span aria-hidden="true" className="absolute top-[10%] left-1/2 h-[36%] w-[72%] -translate-x-1/2 rounded-full bg-white/10 blur-md" />
      <span className="relative z-10 transition-transform duration-200 group-hover:scale-[1.05]">{children}</span>
    </button>
  );
}

function CenterPlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Play video"
      className="group relative grid size-20 place-items-center rounded-full border-0 bg-black/80 supports-[backdrop-filter]:bg-black/60 p-0 outline-none backdrop-blur-md ring-1 ring-white/20 transition hover:bg-black/85 supports-[backdrop-filter]:hover:bg-black/70 active:scale-[0.99] focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      data-player-control
      style={{
        boxShadow: "0 0 0 1px rgba(232,233,56,0.18), 0 18px 45px rgba(0,0,0,0.55)",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 via-white/10 to-transparent opacity-75 transition-opacity duration-200 group-hover:opacity-95"
      />
      <span aria-hidden="true" className="absolute inset-[1px] rounded-full bg-gradient-to-br from-white/5 to-black/50 opacity-80" />
      <span aria-hidden="true" className="absolute top-[10%] left-1/2 h-[36%] w-[72%] -translate-x-1/2 rounded-full bg-white/10 blur-md" />
      <span className="relative z-10 transition-transform duration-200 group-hover:scale-[1.06]">
        <PlayIcon color="#E8E938" size={28} />
      </span>
    </button>
  );
}

export default function MobileFilmsShowcase() {
  const tealColor = "#E8E938";

  const rootRef = useRef<HTMLElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const isSmallScreen = useIsMobile(768);
  const near = useNearViewport(rootRef as unknown as React.RefObject<HTMLElement>, { rootMargin: "150px 0px" });
  const siteLoaded = useSiteLoaded();
  const afterFirstPaint = useAfterFirstPaint();
  const canLoadVideo = siteLoaded && afterFirstPaint && near;

  const films: FilmItem[] = useMemo(() => {
    const videoFiles = [
      "Slowdrag 1_subs.mp4",
      "Slowdrag 2_subs.mp4",
      "Slowdrag 3_subs.mp4",
      "Showreel.mp4",
    ].sort((a, b) => a.localeCompare(b));

    const poster = isSmallScreen ? "/images/titleimage-1200.webp" : "/images/titleimage-1920.webp";
    return videoFiles.map((name) => ({
      title: name.replace(/\.[^./]+$/, ""),
      src: `/website_videos/${encodeURIComponent(name)}`,
      poster,
    }));
  }, [isSmallScreen]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userRequestedPlay, setUserRequestedPlay] = useState(false);
  const [autoplayArmed, setAutoplayArmed] = useState(true);
  const [controlsShown, setControlsShown] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const pipSupported =
    typeof document !== "undefined" &&
    (document as unknown as { pictureInPictureEnabled?: boolean }).pictureInPictureEnabled === true;

  const autoplayDesired = userRequestedPlay || autoplayArmed;
  const canAttachVideoSrc = canLoadVideo && autoplayDesired;
  const controlsVisible = !isPlaying || controlsShown;
  const [rotateFullscreen, setRotateFullscreen] = useState(false);

  // Keep track of timeouts so we can clear them (prevents "stuck" phase)
  const timeoutsRef = useRef<number[]>([]);
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  // Arm autoplay after the page has settled, to reduce initial-load contention.
  // If the user clicks play, we arm immediately.
  useEffect(() => {
    if (!canLoadVideo) return;
    if (userRequestedPlay || autoplayArmed) return;

    const saveData = (navigator as unknown as { connection?: { saveData?: boolean } })?.connection?.saveData;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (saveData || reducedMotion) return;

    let cancelled = false;
    let usedIdleCallback = false;
    let handle: number | undefined;

    const arm = () => {
      if (cancelled) return;
      setAutoplayArmed(true);
    };

    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback;
    const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;

    if (typeof ric === "function") {
      usedIdleCallback = true;
      handle = ric(arm, { timeout: 1500 });
    } else {
      handle = window.setTimeout(arm, 700);
    }

    return () => {
      cancelled = true;
      if (handle === undefined) return;
      if (usedIdleCallback) cic?.(handle);
      else window.clearTimeout(handle);
    };
  }, [canLoadVideo, userRequestedPlay, autoplayArmed]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onFs = () => {
      const fsEl = document.fullscreenElement;
      const el = playerRef.current;
      setIsFullscreen(!!fsEl && !!el && fsEl === el);
    };
    document.addEventListener("fullscreenchange", onFs);
    onFs();
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isFullscreen) {
      setRotateFullscreen(false);
      return;
    }

    const update = () => {
      setRotateFullscreen(window.innerHeight > window.innerWidth);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [isFullscreen]);

  // Duration/time tracking was only used for the mobile seek/progress UI.

  const toggleFullscreen = async () => {
    const v = videoRef.current as unknown as { webkitEnterFullscreen?: () => void } | null;
    if (v?.webkitEnterFullscreen) {
      try {
        v.webkitEnterFullscreen();
      } catch {}
      return;
    }

    const el = playerRef.current as unknown as { requestFullscreen?: () => Promise<void> } | null;
    if (!el) return;

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {}
      return;
    }

    try {
      await el.requestFullscreen?.();
    } catch {}
  };

  const togglePiP = async () => {
    if (!pipSupported) return;
    const v = videoRef.current as unknown as { requestPictureInPicture?: () => Promise<void> } | null;
    if (!v?.requestPictureInPicture) return;

    const anyDoc = document as unknown as { pictureInPictureElement?: Element | null; exitPictureInPicture?: () => Promise<void> };
    try {
      if (anyDoc.pictureInPictureElement) {
        await anyDoc.exitPictureInPicture?.();
        return;
      }
      await v.requestPictureInPicture();
    } catch {}
  };

  // Seek was only used for the mobile seek/progress UI.

  // When activeIndex changes, force reload + play from start
  useEffect(() => {
    if (!canAttachVideoSrc) return;
    const v = videoRef.current;
    if (!v) return;

    v.muted = muted;

    try {
      v.currentTime = 0;
    } catch {}

    v.load();
    const p = v.play();
    if (p) p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [activeIndex, muted, canAttachVideoSrc]);

  // Keep DOM video element in sync with mute state
  useEffect(() => {
    if (!canAttachVideoSrc) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;

    if (!muted) {
      const p = v.play();
      if (p) p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [muted, canAttachVideoSrc]);

  // Pause when offscreen to reduce CPU/battery.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!near) {
      v.pause();
      return;
    }

    if (canAttachVideoSrc && autoplayDesired && isPlaying && v.paused) {
      const p = v.play();
      if (p) p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [near, canAttachVideoSrc, autoplayDesired, isPlaying]);

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

  const toggleMute = () => setMuted((m) => !m);

  const togglePlay = () => {
    const v = videoRef.current;
    setUserRequestedPlay(true);
    setAutoplayArmed(true);
    if (!v) return;

    if (v.paused) {
      setControlsShown(false);
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
    if (isFullscreen) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest?.("[data-player-control]")) return;

    const v = videoRef.current;
    if (!v) return;

    // Mobile UX:
    // - 1st tap while playing: reveal controls
    // - 2nd tap (controls already visible): pause
    if (isPlaying && !controlsVisible) {
      setControlsShown(true);
      return;
    }

    if (!v.paused) {
      v.pause();
      setIsPlaying(false);
    }
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

  const fullscreenRectPath = "M0 0H1000V600H0Z";
  const clipPathD = isFullscreen ? fullscreenRectPath : shapePath;
  const rotateInFullscreen = isFullscreen && rotateFullscreen;

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
              FILMS
            </div>
            <div className="mt-3 h-px w-14 bg-white/15" />
          </div>

          {/* Player (kept same size/shape) */}
          <div className="flex-none pt-1">
            <div
              className={isFullscreen ? "relative w-full h-full" : "relative w-full aspect-[5/3]"}
              onPointerDown={handlePlayerPointerDown}
              ref={playerRef}
            >
              {!isFullscreen ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-5 rounded-[40px] blur-2xl opacity-25"
                  style={{
                    background:
                      "radial-gradient(55% 55% at 50% 48%, rgba(232,233,56,0.22), transparent 70%)",
                  }}
                />
              ) : null}
              <svg
            viewBox="0 0 1000 600"
            className={
              isFullscreen
                ? "w-full h-full"
                : "w-full h-full drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)] pointer-events-none"
            }
            preserveAspectRatio={isFullscreen ? "none" : "xMidYMid meet"}
          >
            <defs>
              <clipPath id="blob-clip" clipPathUnits="userSpaceOnUse">
                <path d={clipPathD} />
              </clipPath>

              <radialGradient
                id="grad1"
                cx="30%"
                cy="30%"
                r="50%"
                fx="30%"
                fy="30%"
              >
                <stop offset="0%" stopColor="rgba(232,233,56,0.35)" />
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

            <path d={clipPathD} fill="#0a0a0a" />

            <foreignObject
              x="0"
              y="0"
              width="1000"
              height="600"
              clipPath="url(#blob-clip)"
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
                    src={canAttachVideoSrc ? active.src : undefined}
                    poster={canLoadVideo ? active.poster : undefined}
                    muted={muted}
                    playsInline
                    controls={isFullscreen}
                    autoPlay={autoplayDesired}
                    preload={canAttachVideoSrc ? "metadata" : "none"}
                    onEnded={next}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onCanPlay={() => {
                      if (!autoplayDesired) return;
                      const v = videoRef.current;
                      if (!v) return;
                      v.muted = muted;
                      const p = v.play();
                      if (p) {
                        p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                      }
                    }}
                    style={{
                      objectFit: "cover",
                      objectPosition: "center",
                      display: "block",
                      position: rotateInFullscreen ? "absolute" : undefined,
                      left: rotateInFullscreen ? "50%" : undefined,
                      top: rotateInFullscreen ? "50%" : undefined,
                      width: rotateInFullscreen ? "100vh" : "100%",
                      height: rotateInFullscreen ? "100vw" : "100%",
                      transform: rotateInFullscreen
                        ? "translate(-50%, -50%) rotate(90deg)"
                        : "scale(1.34)",
                      transformOrigin: "center",
                      opacity: videoOpacity,
                      transition: "opacity 280ms ease",
                    }}
                  >
                    {/* Empty track for accessibility - video is muted/decorative */}
                    <track kind="captions" />
                  </video>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background:
                        "radial-gradient(800px 520px at 30% 35%, rgba(232,233,56,0.20), transparent 60%), radial-gradient(900px 520px at 65% 62%, rgba(198,55,108,0.28), transparent 62%), radial-gradient(700px 420px at 88% 90%, rgba(255,220,140,0.18), transparent 60%), #0a0a0a",
                      opacity: videoOpacity,
                      transition: "opacity 280ms ease",
                    }}
                  />
                )}
              </div>
            </foreignObject>

            {!isFullscreen ? (
              <path
                d={shapePath}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
              />
            ) : null}
          </svg>

          {/* Center overlay play button */}
          {!isFullscreen && !isPlaying ? (
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

          {/* Controls (bottom) */}
          {!isFullscreen ? (
          <div
            data-player-control
            className={`absolute z-40 transition-[opacity,transform] duration-200 ease-out ${
              controlsVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
            }`}
            style={{ left: "50%", bottom: "18px", transform: "translateX(-50%)" }}
          >
            <div
              className="flex items-center gap-3 rounded-full bg-black/80 supports-[backdrop-filter]:bg-black/60 backdrop-blur-md ring-1 ring-white/20 drop-shadow-[0_18px_45px_rgba(0,0,0,0.6)]"
              style={{ padding: "10px 12px" }}
            >
              <MiniControlButton label={isPlaying ? "Pause" : "Play"} onClick={togglePlay}>
                {isPlaying ? (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={tealColor}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
                  >
                    <path d="M7 5v14" />
                    <path d="M17 5v14" />
                  </svg>
                ) : (
                  <PlayIcon color={tealColor} size={22} />
                )}
              </MiniControlButton>

              <MiniControlButton label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={tealColor}
                  strokeWidth="2.4"
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
              </MiniControlButton>

              <MiniControlButton
                label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                onClick={toggleFullscreen}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={tealColor}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
                >
                  <path d="M9 3H5a2 2 0 0 0-2 2v4" />
                  <path d="M15 3h4a2 2 0 0 1 2 2v4" />
                  <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
                  <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
                </svg>
              </MiniControlButton>

              {pipSupported ? (
                <MiniControlButton label="Picture in Picture" onClick={togglePiP}>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={tealColor}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <rect x="12.5" y="11" width="6" height="5" rx="1" />
                  </svg>
                </MiniControlButton>
              ) : null}
            </div>
          </div>
          ) : null}
            </div>
          </div>

          {/* Fixed gap: 10% of viewport height */}
          <div aria-hidden="true" className="h-[10svh]" />

          {/* Bottom: text + CTA */}
          <div className="min-h-[10svh] flex flex-col items-center text-center pt-2">
            <div className="w-full max-w-[22rem]">
              <div className="text-[12px] tracking-[0.22em] uppercase text-white/70">
                We work across
              </div>
              <div
                className="mt-5 text-[22px] leading-[1.08] font-normal tracking-[0.02em] text-white"
                style={{
                  fontFamily: "var(--font-offbit-101)",
                  textShadow: "0 2px 4px rgba(180, 0, 0, 0.9)",
                }}
              >
                <div>narrative</div>
                <div>experimental films,</div>
                <div>commercials & films,</div>
                <div>documentaries</div>
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
                  "0 0 0 1px rgba(232,233,56,0.65), 0 18px 45px rgba(0,0,0,0.55)",
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
