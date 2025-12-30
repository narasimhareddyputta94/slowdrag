"use client";

import { useEffect, useRef, useState } from "react";

type InitialLoadingOverlayProps = {
  src: string;
};

export default function InitialLoadingOverlay({ src }: InitialLoadingOverlayProps) {
  const [phase, setPhase] = useState<"show" | "hide" | "gone">("show");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dismissedOnceRef = useRef(false);
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    // Prevent any scroll/jumps while the loading video is covering the viewport.
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    let raf1 = 0;
    let raf2 = 0;

    let dismissed = false;
    let fadeTimer: number | undefined;
    let goneTimer: number | undefined;

    const dispatchSiteLoadedOnce = () => {
      if (dismissedOnceRef.current) return;
      dismissedOnceRef.current = true;
      (window as unknown as { __slowdrag_siteLoaded?: boolean }).__slowdrag_siteLoaded = true;
      window.dispatchEvent(new Event("slowdrag:siteLoaded"));
    };

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;

      // Ensure we boot the hero while the overlay is still visible.
      dispatchSiteLoadedOnce();

      // Fade out (still mounted so the transition can run).
      setPhase("hide");

      // After fade, fully remove overlay and restore scroll.
      fadeTimer = window.setTimeout(() => {
        setPhase("gone");

        // Restore scroll.
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;

        // Event was already dispatched when fade started.
      }, 550);

      // Additional guard: if something keeps React from repainting, still restore scroll.
      goneTimer = window.setTimeout(() => {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
      }, 1200);
    };

    // After at least one paint, start the loader video and boot the hero.
    raf1 = requestAnimationFrame(() =>
      (raf2 = requestAnimationFrame(() => {
        setVideoSrc(src);
        dispatchSiteLoadedOnce();
      }))
    );

    // Primary dismissal signal: hero is ready to be shown.
    const onHeroReady = () => dismiss();
    window.addEventListener("slowdrag:heroReady", onHeroReady);

    // Safety: never block forever if autoplay fails or load event is delayed.
    const safetyTimer = window.setTimeout(dismiss, 6000);

    return () => {
      window.removeEventListener("slowdrag:heroReady", onHeroReady);
      if (fadeTimer !== undefined) window.clearTimeout(fadeTimer);
      if (goneTimer !== undefined) window.clearTimeout(goneTimer);
      window.clearTimeout(safetyTimer);

      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);

      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-label="Loading"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        background: "#000",
        overflow: "hidden",
        opacity: phase === "hide" ? 0 : 1,
        transition: "opacity 520ms ease",
        pointerEvents: phase === "hide" ? "none" : "auto",
      }}
    >
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "min(520px, 78vw)",
          height: "min(520px, 78vh)",
          maxWidth: "78vw",
          maxHeight: "78vh",
          display: "block",
          transform: "translate(-50%, -50%) rotate(270deg)",
          transformOrigin: "center",
          objectFit: "contain",
        }}
        src={videoSrc}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedMetadata={() => {
          // Start playback only once metadata is available and we've had a paint.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              void videoRef.current?.play?.().catch(() => {
                // Ignore autoplay failures; safety timer will dismiss.
              });
            });
          });
        }}
      />
    </div>
  );
}
