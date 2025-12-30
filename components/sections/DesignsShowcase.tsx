"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import useIsMobile from "@/components/perf/useIsMobile";
import useNearViewport from "@/components/perf/useNearViewport";
import useAfterFirstPaint from "@/components/perf/useAfterFirstPaint";
import useSiteLoaded from "@/components/perf/useSiteLoaded";

type DesignItem = {
  title: string;
  src: string;
  poster?: string;
};

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
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
      data-player-control
      style={{
        boxShadow: "0 0 0 1px rgba(232,233,56,0.18), 0 18px 45px rgba(0,0,0,0.55)",
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

export default function DesignsShowcase() {
  const tealColor = "#E8E938";

  const rootRef = useRef<HTMLElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const isSmallScreen = useIsMobile(768);
  const near = useNearViewport(rootRef as unknown as React.RefObject<HTMLElement>, { rootMargin: "150px 0px" });
  const siteLoaded = useSiteLoaded();
  const afterFirstPaint = useAfterFirstPaint();
  const canLoadVideo = siteLoaded && afterFirstPaint && near;

  const designs: DesignItem[] = useMemo(
    () => [
      {
        title: "brandbook draft",
        src: "/mobile_images/brandbook draft.mp4",
        poster: isSmallScreen ? "/images/titleimage-1200.webp" : "/images/titleimage-1920.webp",
      }
    ],
    [isSmallScreen]
  );

  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userRequestedPlay, setUserRequestedPlay] = useState(false);
  // Autoplay by default once the section is in view (muted), so the design video feels continuous.
  const [autoplayArmed, setAutoplayArmed] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const pipSupported = typeof document !== "undefined" && document.pictureInPictureEnabled === true;

  const autoplayDesired = userRequestedPlay || autoplayArmed;
  const canAttachVideoSrc = canLoadVideo && autoplayDesired;

  const hoverRevealWhenPlaying = isPlaying
    ? "opacity-0 pointer-events-none translate-y-2 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 transition-[opacity,transform] duration-200 ease-out"
    : "opacity-100 pointer-events-auto translate-y-0 transition-[opacity,transform] duration-200 ease-out";

  const startIndex = useMemo(() => {
    const idx = designs.findIndex((d) => d.title === "brandbook draft");
    return idx >= 0 ? idx : 0;
  }, [designs]);

  // Keep the existing arrows: rotate the gallery order.
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    setOffset(startIndex);
  }, [startIndex]);

  const orderedDesigns = useMemo(() => {
    if (designs.length === 0) return designs;
    const normalized = ((offset % designs.length) + designs.length) % designs.length;
    return [...designs.slice(normalized), ...designs.slice(0, normalized)];
  }, [designs, offset]);

  const firstDesign = orderedDesigns[0];

  const next = () => {
    setOffset((i) => (i + 1) % designs.length);
  };
  const prev = () => {
    setOffset((i) => (i - 1 + designs.length) % designs.length);
  };

  const padding = 0;

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

  // Keep DOM video element in sync with mute state
  useEffect(() => {
    if (!canAttachVideoSrc) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (!muted) {
      const p = v.play();
      if (p) {
        p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  }, [muted, canAttachVideoSrc]);

  // Reload + play when media changes
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
    if (p) {
      p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [firstDesign?.src, muted, canAttachVideoSrc]);

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
  }, [canAttachVideoSrc, firstDesign?.src]);

  const toggleMute = () => setMuted((m) => !m);

  const toggleFullscreen = async () => {
    if (typeof document === "undefined") return;
    const el = playerRef.current;
    const v = videoRef.current;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
        return;
      }
      if (el?.requestFullscreen) {
        await el.requestFullscreen();
        return;
      }
      if (v && typeof (v as unknown as { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen === "function") {
        (v as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
      }
    } catch {
      // ignore
    }
  };

  const togglePiP = async () => {
    if (typeof document === "undefined") return;
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement === v) {
        await document.exitPictureInPicture?.();
        return;
      }
      if (typeof (v as unknown as { requestPictureInPicture?: () => Promise<void> }).requestPictureInPicture === "function") {
        await (v as unknown as { requestPictureInPicture: () => Promise<void> }).requestPictureInPicture();
      }
    } catch {
      // ignore
    }
  };

  const seekTo = (nextTime: number) => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = Math.max(0, Math.min(nextTime, Number.isFinite(v.duration) ? v.duration : nextTime));
      setCurrentTime(v.currentTime || 0);
    } catch {
      // ignore
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    setUserRequestedPlay(true);
    setAutoplayArmed(true);
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

  const fullscreenRectPath = "M0 0H1000V600H0Z";
  const clipPathD = isFullscreen ? fullscreenRectPath : shapePath;

  return (
    <section
      ref={rootRef as unknown as React.RefObject<HTMLElement>}
      className="relative w-full min-h-screen bg-black text-white overflow-hidden flex items-center justify-center font-sans"
    >
      <div className="relative w-[96%] md:w-[94%] lg:w-[90%] xl:w-[86%] max-w-[1500px] flex items-center justify-center">
        <div
          className={
            isFullscreen
              ? "group relative w-full h-full isolation-isolate"
              : "group relative w-full aspect-[2.05/1] md:aspect-[2.0/1] isolation-isolate"
          }
          ref={playerRef}
          onPointerDown={handlePlayerPointerDown}
        >
          {/* SVG layer */}
          <svg
            viewBox="0 0 1000 600"
            className={
              isFullscreen
                ? "w-full h-full relative z-10"
                : "w-full h-full drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative z-10 pointer-events-none"
            }
            preserveAspectRatio="none"
          >
            <defs>
              <clipPath id="blob-mask-design" clipPathUnits="userSpaceOnUse">
                <path d={clipPathD} />
              </clipPath>

              <radialGradient
                id="warm1"
                cx="40%"
                cy="40%"
                r="40%"
                fx="40%"
                fy="40%"
              >
                <stop offset="0%" stopColor="rgba(255, 240, 200, 0.9)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              <radialGradient id="warm2" cx="60%" cy="50%" r="55%">
                <stop offset="0%" stopColor="rgba(255, 140, 0, 0.7)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              <radialGradient id="warm3" cx="80%" cy="80%" r="60%">
                <stop offset="0%" stopColor="rgba(180, 40, 40, 0.5)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              <filter id="noise-design">
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

            <g>
              <path d={clipPathD} fill="#0a0500" />
              <path d={clipPathD} fill="url(#warm1)" style={{ mixBlendMode: "screen" }} />
              <path d={clipPathD} fill="url(#warm2)" style={{ mixBlendMode: "screen" }} />
              <path d={clipPathD} fill="url(#warm3)" style={{ mixBlendMode: "screen" }} />

              <foreignObject x="0" y="0" width="1000" height="600" clipPath="url(#blob-mask-design)">
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      justifyContent: "center",
                      padding,
                    }}
                  >
                    {firstDesign ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "stretch",
                            justifyContent: "stretch",
                            overflow: "hidden",
                          }}
                        >
                          <video
                            ref={videoRef}
                            src={canAttachVideoSrc ? encodeURI(firstDesign.src) : undefined}
                            aria-label={firstDesign.title}
                            poster={canLoadVideo ? firstDesign.poster : undefined}
                            muted={muted}
                            autoPlay={autoplayDesired}
                            loop
                            playsInline
                            preload={canAttachVideoSrc ? "metadata" : "none"}
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
                            }}
                          >
                            {/* Empty track for accessibility - video is muted/decorative */}
                            <track kind="captions" />
                          </video>
                        </div>
                      </div>
                    ) : null}

                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        mixBlendMode: "overlay",
                        opacity: 0.45,
                        background:
                          "radial-gradient(800px 520px at 30% 35%, rgba(232,233,56,0.10), transparent 60%), radial-gradient(900px 520px at 65% 62%, rgba(198,55,108,0.12), transparent 62%), radial-gradient(700px 420px at 88% 90%, rgba(255,220,140,0.08), transparent 60%)",
                      }}
                    />
                  </div>
                </div>
              </foreignObject>

              <rect
                width="100%"
                height="100%"
                filter="url(#noise-design)"
                style={{ mixBlendMode: "overlay" }}
                clipPath="url(#blob-mask-design)"
              />
            </g>

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
              className="absolute z-40"
              style={{ left: "50%", top: "48%", transform: "translate(-50%, -50%)" }}
            >
              <CenterPlayButton onClick={togglePlay} color={tealColor} />
            </div>
          ) : null}

          {/* Bottom-right controls: play/pause + mute + fullscreen + PiP */}
          <div
            data-player-control
            className={`absolute z-40 flex items-center gap-3 ${hoverRevealWhenPlaying}`}
            style={{ right: "24px", bottom: "80px" }}
          >
            <ControlButton
              onClick={togglePlay}
              pressed={isPlaying}
              label={isPlaying ? "Pause video" : "Play video"}
            >
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
                <PlayIcon color={tealColor} size={24} />
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
                value={Math.min(
                  Math.max(0, Math.floor(currentTime || 0)),
                  Math.max(0, Math.floor(duration || 0))
                )}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="h-1 w-[240px] accent-[currentColor]"
                style={{ color: tealColor }}
              />
            </div>
          </div>

          {/* === HUD INTERFACE === */}

          {/* Top Right Pill ✅ ONLY CHANGE: move TEXT to right with margin-left */}
          <div className="absolute top-[2%] right-[4%] z-[40] mix-blend-normal">
            <button
              className="
                w-[400px] md:w-[520px] lg:w-[620px]
                h-[66px] md:h-[78px]
                bg-transparent
                border border-[#E8E938]
                rounded-full
                text-[24px] md:text-[44px]
                font-extrabold
                tracking-[0.20em]
                text-white
                opacity-100
                drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]
                shadow-[0_0_20px_rgba(0,0,0,0.5)]
                uppercase
                select-none
                flex items-center justify-start
                pointer-events-auto
              "
              style={{ color: "#dba9a9ff" }}
            >
              <span className="ml-[40px] md:ml-[110px] lg:ml-[130px]">
                DESIGN
              </span>
            </button>
          </div>

          {/* Bottom Left CTA */}
          <div className="absolute bottom-[3%] left-[1.0%] z-[80] mix-blend-normal">
            <button
              className="
                w-[500px] md:w-[520px] lg:w-[620px]
                h-[56px] md:h-[66px]
                bg-transparent
                border border-[#E8E938]
                rounded-full
                text-[13px] md:text-[15px]
                font-extrabold
                tracking-[0.22em]
                text-white
                opacity-100
                drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]
                shadow-[0_0_20px_rgba(0,0,0,0.5)]
                flex items-center justify-center
                select-none
                pointer-events-auto
              "
              style={{ color: "#ffffff" }}
            >
              MAKE US A PART OF YOUR STORY TELLING
            </button>
          </div>

          {/* Left Arrow */}
          <button
            onClick={prev}
            className="
              absolute top-1/2 -translate-y-1/2 -translate-y-[100px] z-[10]
              outline-none bg-transparent border-none p-0 focus:outline-none
              left-[-10px] md:left-[-120px] lg:left-[-160px] xl:left-[-190px]
              mix-blend-normal
              pointer-events-auto
            "
            aria-label="Previous"
          >
            <Image
              src="/images/cursor-new.png"
              alt="Previous"
              width={190}
              height={155}
              style={{ width: "40px", height: "40px" }}
              className="object-contain rotate-225 transition-transform duration-300 hover:scale-110 drop-shadow-[0_0_8px_rgba(232,233,56,0.6)]"
            />
          </button>


          {/* Right Arrow */}
          <button
            onClick={next}
            className="
              absolute top-1/2 -translate-y-1/2 -translate-y-[100px] z-[10]
              outline-none bg-transparent border-none p-0 focus:outline-none
              right-[-8px] md:right-[-120px] lg:right-[-160px] xl:right-[-190px]
              mix-blend-normal
              pointer-events-auto
            "
            aria-label="Next"
          >
            <Image
              src="/images/cursor-new.png"
              alt="Next"
              width={190}
              height={155}
              style={{ width: "40px", height: "40px" }}
              className="object-contain rotate-45 transition-transform duration-300 hover:scale-110 drop-shadow-[0_0_8px_rgba(232,233,56,0.6)]"
            />
          </button>

          {/* Bottom Right Text */}
          <div className="absolute bottom-[1%] right-[5%] z-[10] text-right mix-blend-normal">
            <p className="text-[22px] md:text-[16px] leading-tight text-[#e0e0e0] font-light tracking-wide drop-shadow-md">
              visual systems
              <br />
              spanning editorial,
              <br />
              spatial,
              <br />
              digital design.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
