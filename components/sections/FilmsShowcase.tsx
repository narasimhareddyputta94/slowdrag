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

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";
  const s = Math.floor(totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function PlayIcon({ color, size = 24 }: { color: string; size?: number }) {
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

function CenterPlayButton({ onClick, color }: { onClick: () => void; color: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Play video"
      className="group relative grid size-20 place-items-center rounded-full border-0 bg-black/60 p-0 outline-none backdrop-blur-md ring-1 ring-white/15 transition hover:bg-black/70 active:scale-[0.99] focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
      data-player-control
      style={{
        boxShadow:
          "0 0 0 1px rgba(232,233,56,0.18), 0 18px 45px rgba(0,0,0,0.55)",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 via-white/10 to-transparent opacity-75 transition-opacity duration-200 group-hover:opacity-95"
      />
      <span
        aria-hidden="true"
        className="absolute inset-[1px] rounded-full bg-gradient-to-br from-white/5 to-black/50 opacity-80"
      />
      <span
        aria-hidden="true"
        className="absolute top-[10%] left-1/2 h-[36%] w-[72%] -translate-x-1/2 rounded-full bg-white/10 blur-md"
      />
      <span className="relative z-10 transition-transform duration-200 group-hover:scale-[1.06]">
        <PlayIcon color={color} size={30} />
      </span>
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
      className="group relative grid size-12 place-items-center rounded-full bg-black/60 backdrop-blur-md ring-1 ring-white/15 transition hover:bg-black/70 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
      style={{
        boxShadow:
          "0 0 0 1px rgba(232,233,56,0.18), 0 18px 45px rgba(0,0,0,0.55)",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 via-white/10 to-transparent opacity-75 transition-opacity duration-200 group-hover:opacity-95"
      />
      <span
        aria-hidden="true"
        className="absolute inset-[1px] rounded-full bg-gradient-to-br from-white/5 to-black/50 opacity-80"
      />
      <span
        aria-hidden="true"
        className="absolute top-[10%] left-1/2 h-[36%] w-[72%] -translate-x-1/2 rounded-full bg-white/10 blur-md"
      />
      <span className="relative z-10 transition-transform duration-200 group-hover:scale-[1.05]">
        {children}
      </span>
    </button>
  );
}

export default function FilmsShowcase() {
  const tealColor = "#E8E938";

  const rootRef = useRef<HTMLElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile(768);
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

    const poster = isMobile ? "/images/titleimage-1200.webp" : "/images/titleimage-1920.webp";

    return videoFiles.map((name) => ({
      title: name.replace(/\.[^./]+$/, ""),
      src: `/website_videos/${encodeURIComponent(name)}`,
      poster,
    }));
  }, [isMobile]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userRequestedPlay, setUserRequestedPlay] = useState(false);
  // Autoplay by default once the section is in view (muted), so videos feel continuous.
  const [autoplayArmed, setAutoplayArmed] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pipSupported =
    typeof document !== "undefined" &&
    (document as unknown as { pictureInPictureEnabled?: boolean }).pictureInPictureEnabled === true;

  const autoplayDesired = userRequestedPlay || autoplayArmed;
  const canAttachVideoSrc = canLoadVideo && autoplayDesired;

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
    const v = videoRef.current;
    if (!v) return;

    const onLoadedMetadata = () => setDuration(Number.isFinite(v.duration) ? v.duration : 0);
    const onTimeUpdate = () => setCurrentTime(v.currentTime || 0);
    const onDurationChange = () => setDuration(Number.isFinite(v.duration) ? v.duration : 0);

    v.addEventListener("loadedmetadata", onLoadedMetadata);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("durationchange", onDurationChange);
    onLoadedMetadata();
    onTimeUpdate();

    return () => {
      v.removeEventListener("loadedmetadata", onLoadedMetadata);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("durationchange", onDurationChange);
    };
  }, [canAttachVideoSrc, activeIndex]);

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
  const prev = () => requestIndex((activeIndex - 1 + films.length) % films.length);

  const toggleMute = () => setMuted((m) => !m);

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

  const seekTo = (nextTime: number) => {
    const v = videoRef.current;
    if (!v) return;
    if (!Number.isFinite(nextTime)) return;
    try {
      v.currentTime = Math.max(0, Math.min(nextTime, Number.isFinite(v.duration) ? v.duration : nextTime));
      setCurrentTime(v.currentTime || 0);
    } catch {}
  };

  const togglePlay = () => {
    const v = videoRef.current;
    setUserRequestedPlay(true);
    setAutoplayArmed(true);
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

  const hoverRevealWhenPlaying = isPlaying
    ? "opacity-0 pointer-events-none translate-y-2 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 transition-[opacity,transform] duration-200 ease-out"
    : "opacity-100 pointer-events-auto translate-y-0 transition-[opacity,transform] duration-200 ease-out";

  // =========================
  // ✅ DESKTOP/TABLET LAYOUT
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

  return (
    <section
      ref={rootRef as unknown as React.RefObject<HTMLElement>}
      className="relative w-full min-h-screen text-white overflow-hidden flex items-center justify-center font-sans"
    >
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
          className={isFullscreen ? "group relative w-full h-full" : "group relative w-full aspect-[5/3]"}
          onPointerDown={handlePlayerPointerDown}
          ref={playerRef}
        >
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
                      width: "100%",
                      height: "100%",
                      objectFit: isFullscreen ? "contain" : "cover",
                      objectPosition: "center",
                      display: "block",
                      transform: isFullscreen ? undefined : "scale(1.34)",
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
          {!isPlaying ? (
            <div
              data-player-control
              className={`absolute z-40 ${hoverRevealWhenPlaying}`}
              style={{
                left: "50%",
                top: "48%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <CenterPlayButton onClick={togglePlay} color={tealColor} />
            </div>
          ) : null}

          {/* Top Left Pill */}
          <div data-player-control className={`absolute top-[10%] left-[2.5%] z-30 ${hoverRevealWhenPlaying}`}>
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

          {/* Audio Control (bottom-right) */}
          <div
            data-player-control
            className={`absolute z-40 flex items-center ${hoverRevealWhenPlaying}`}
            style={{ right: "24px", bottom: "80px" }}
          >
            <div className="flex items-center gap-3">
              <ControlButton
                onClick={toggleMute}
                pressed={!muted}
                label={muted ? "Unmute video" : "Mute video"}
              >
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

              <ControlButton
                onClick={toggleFullscreen}
                pressed={isFullscreen}
                label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
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
                  <path d="M9 3H5a2 2 0 0 0-2 2v4" />
                  <path d="M15 3h4a2 2 0 0 1 2 2v4" />
                  <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
                  <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
                </svg>
              </ControlButton>

              {pipSupported ? (
                <ControlButton onClick={togglePiP} pressed={false} label="Picture in Picture">
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
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <rect x="12.5" y="11" width="6" height="5" rx="1" />
                  </svg>
                </ControlButton>
              ) : null}
            </div>
          </div>

          {/* Seek + time (bottom center) */}
          <div
            data-player-control
            className={`absolute z-40 ${hoverRevealWhenPlaying}`}
            style={{ left: "50%", bottom: "22px", transform: "translateX(-50%)" }}
          >
            <div
              className="flex items-center gap-3 rounded-full bg-black/60 backdrop-blur-md ring-1 ring-white/15"
              style={{ padding: "10px 14px" }}
            >
              <div
                className="text-[12px] tracking-[0.14em] text-white/80 whitespace-nowrap"
                style={{ fontFamily: "var(--font-offbit-101)" }}
              >
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              <input
                aria-label="Seek"
                type="range"
                min={0}
                max={Math.max(0, Math.floor(duration || 0))}
                value={Math.min(Math.max(0, Math.floor(currentTime || 0)), Math.max(0, Math.floor(duration || 0)))}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="h-1 w-[240px] accent-[currentColor]"
                style={{ color: tealColor }}
              />
            </div>
          </div>

          {/* Bottom Right CTA */}
          <div data-player-control className={`absolute bottom-[6%] right-[3%] z-30 ${hoverRevealWhenPlaying}`}>
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
            className={`group absolute top-1/2 -translate-y-1/2 z-50 bg-transparent border-none p-0 focus:outline-none ${hoverRevealWhenPlaying}`}
            style={{ left: "-60px" }}
            aria-label="Previous"
          >
            <Image
              src="/images/cursor-new.png"
              alt="Previous"
              width={190}
              height={155}
              style={{ width: "40px", height: "40px" }}
              className="object-contain rotate-225 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(232,233,56,0.6)]"
            />
          </button>

          <button
            data-player-control
            type="button"
            onClick={next}
            className={`group absolute top-1/2 -translate-y-1/2 z-50 bg-transparent border-none p-0 focus:outline-none ${hoverRevealWhenPlaying}`}
            style={{ right: "-60px" }}
            aria-label="Next"
          >
            <Image
              src="/images/cursor-new.png"
              alt="Next"
              width={190}
              height={155}
              style={{ width: "40px", height: "40px" }}
              className="object-contain rotate-45 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(232,233,56,0.6)]"
            />
          </button>

          {/* Bottom Left Menu */}
          <div
            data-player-control
            className="absolute bottom-[2%] left-[1%] z-30 flex flex-col items-start w-[220px] rounded-xl px-3 py-2"
            style={{ left: "-80px", bottom: "-15px" }}
          >
            <div
              className="text-[24px] leading-[1.05] font-normal tracking-[0.02em] text-white"
              style={{
                fontFamily: "var(--font-offbit-101)",
                textShadow: "0 2px 4px rgba(180, 0, 0, 0.9)",
              }}
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
