"use client";

import { useEffect, useRef, useState } from "react";

type InitialLoadingOverlayProps = {
  src: string;
  /** Keep overlay visible for at least this long (ms). */
  minVisibleMs?: number;
  /** If true, wait for `document.readyState === "complete"` before starting the loader video. */
  waitForDocumentComplete?: boolean;
  /** Fired once after the overlay is fully removed (phase becomes "gone"). */
  onDismissed?: () => void;
};

export default function InitialLoadingOverlay({
  src,
  minVisibleMs = 2000,
  waitForDocumentComplete = true,
  onDismissed,
}: InitialLoadingOverlayProps) {
  const [phase, setPhase] = useState<"show" | "hide" | "gone">("show");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dismissedOnceRef = useRef(false);
  const onDismissedOnceRef = useRef(false);
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);
  const heroReadyRef = useRef(false);
  const videoStartedRef = useRef(false);
  const mountedAtRef = useRef(0);
  const maybeDismissRef = useRef<(() => void) | null>(null);
  const startedOnceRef = useRef(false);
  const pageReadyRef = useRef(false);

  useEffect(() => {
    mountedAtRef.current = performance.now();

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    // Prevent any scroll/jumps while the loading video is covering the viewport.
    // Note: scrollbar-gutter: stable in CSS handles the scrollbar width compensation.
    // We no longer set paddingRight dynamically to avoid CLS.
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    let raf1 = 0;

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

        if (!onDismissedOnceRef.current) {
          onDismissedOnceRef.current = true;
          onDismissed?.();
        }

        // Restore scroll.
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;

        // Event was already dispatched when fade started.
      }, 340);

      // Additional guard: if something keeps React from repainting, still restore scroll.
      goneTimer = window.setTimeout(() => {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
      }, 850);
    };

    const maybeDismiss = () => {
      if (!pageReadyRef.current) return;
      if (!heroReadyRef.current) return;
      const elapsed = performance.now() - mountedAtRef.current;

      // Always keep the overlay for a minimum duration.
      if (elapsed < minVisibleMs) return;

      // If autoplay is blocked, we still dismiss after `minVisibleMs` once the hero is ready.
      if (videoStartedRef.current || elapsed >= minVisibleMs) dismiss();
    };

    maybeDismissRef.current = maybeDismiss;

    const startOnce = () => {
      if (startedOnceRef.current) return;
      startedOnceRef.current = true;

      // Start the loader video and boot the hero.
      setVideoSrc(src);
      dispatchSiteLoadedOnce();
    };

    // Start the loader only once the document is fully loaded (requested behavior).
    // If the load already happened, we start immediately.
    pageReadyRef.current = !waitForDocumentComplete || document.readyState === "complete";
    raf1 = requestAnimationFrame(() => {
      if (pageReadyRef.current) startOnce();
    });

    const onLoad = () => {
      pageReadyRef.current = true;
      startOnce();
      maybeDismissRef.current?.();
    };

    if (waitForDocumentComplete && !pageReadyRef.current) {
      window.addEventListener("load", onLoad, { once: true });
    }

    // Primary dismissal signal: hero is ready to be shown.
    const onHeroReady = () => {
      heroReadyRef.current = true;
      maybeDismiss();
    };
    window.addEventListener("slowdrag:heroReady", onHeroReady);

    // Safety: never block forever if autoplay fails or load event is delayed.
    const safetyTimer = window.setTimeout(dismiss, Math.max(6000, minVisibleMs + 4000));

    return () => {
      maybeDismissRef.current = null;
      window.removeEventListener("slowdrag:heroReady", onHeroReady);
      window.removeEventListener("load", onLoad);
      if (fadeTimer !== undefined) window.clearTimeout(fadeTimer);
      if (goneTimer !== undefined) window.clearTimeout(goneTimer);
      window.clearTimeout(safetyTimer);

      window.cancelAnimationFrame(raf1);

      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [minVisibleMs, onDismissed, src, waitForDocumentComplete]);

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
        transition: "opacity 320ms ease",
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
        onPlaying={() => {
          videoStartedRef.current = true;
          maybeDismissRef.current?.();
        }}
        onLoadedMetadata={() => {
          // Start playback only once metadata is available and we've had a paint.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const p = videoRef.current?.play?.();
              if (p && typeof (p as Promise<void>).then === "function") {
                (p as Promise<void>)
                  .then(() => {
                    videoStartedRef.current = true;
                    maybeDismissRef.current?.();
                  })
                  .catch(() => {
                    // Ignore autoplay failures; safety timer will dismiss.
                  });
              }
            });
          });
        }}
      >
        {/* Empty track for accessibility - video is muted/decorative */}
        <track kind="captions" />
      </video>
    </div>
  );
}
