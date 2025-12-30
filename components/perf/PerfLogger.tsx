"use client";

import { useEffect, useMemo, useRef } from "react";

declare global {
  interface Window {
    __slowdrag_lenisRunning?: boolean;
    __slowdrag_heroRafRunning?: boolean;
    __slowdrag_perf_rAFPatched?: boolean;
  }
}

function isEnabled() {
  if (typeof window === "undefined") return false;
  const dev = process.env.NODE_ENV !== "production";
  const qp = new URLSearchParams(window.location.search);
  return dev || qp.get("perf") === "1";
}

function safeBool(v: unknown) {
  return v === true;
}

type VideoPlaybackQualityLike = {
  totalVideoFrames?: number;
  droppedVideoFrames?: number;
};

type HTMLVideoElementWithQuality = HTMLVideoElement & {
  getVideoPlaybackQuality?: () => VideoPlaybackQualityLike;
};

export default function PerfLogger() {
  const enabled = useMemo(() => isEnabled(), []);

  const rafCountRef = useRef(0);
  const longTaskCountRef = useRef(0);
  const longTaskTotalMsRef = useRef(0);
  const lastLogAtRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // Patch rAF to count *all* callbacks executed per second.
    if (!window.__slowdrag_perf_rAFPatched) {
      window.__slowdrag_perf_rAFPatched = true;
      const original = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
        return original((t) => {
          rafCountRef.current += 1;
          cb(t);
        });
      }) as typeof window.requestAnimationFrame;
    }

    return () => {
      // Intentionally do not unpatch rAF to avoid breaking other code after hot reload.
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let obs: PerformanceObserver | null = null;
    try {
      obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTaskCountRef.current += 1;
          longTaskTotalMsRef.current += entry.duration;
        }
      });
      obs.observe({ entryTypes: ["longtask"] });
    } catch {
      // Ignore if unsupported.
    }

    return () => {
      try {
        obs?.disconnect();
      } catch {
        // ignore
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      const now = performance.now();
      if (lastLogAtRef.current === 0) lastLogAtRef.current = now;
      const dt = Math.max(1, now - lastLogAtRef.current);

      const rafPerSec = Math.round((rafCountRef.current * 1000) / dt);
      rafCountRef.current = 0;
      lastLogAtRef.current = now;

      const longTasks = longTaskCountRef.current;
      const longTaskTotalMs = Math.round(longTaskTotalMsRef.current);
      longTaskCountRef.current = 0;
      longTaskTotalMsRef.current = 0;

      const lenisRunning = safeBool(window.__slowdrag_lenisRunning);
      const heroRafRunning = safeBool(window.__slowdrag_heroRafRunning);

      const videos = Array.from(document.querySelectorAll("video")) as HTMLVideoElement[];
      const videosWithSrc = videos.filter((v) => Boolean(v.currentSrc || v.getAttribute("src"))).length;
      const videosPlaying = videos.filter((v) => !v.paused && !v.ended).length;
      const videosDecoding = videos.filter((v) => {
        const q = (v as HTMLVideoElementWithQuality).getVideoPlaybackQuality?.();
        if (q && typeof q.totalVideoFrames === "number" && typeof q.droppedVideoFrames === "number") {
          // If frames exist and it isn't paused, assume decoding is happening.
          return q.totalVideoFrames > 0 && !v.paused;
        }
        return !v.paused && (v.readyState ?? 0) >= 2;
      }).length;

      console.log(
        `[slowdrag:perf] raf/s=${rafPerSec} longtasks=${longTasks} longtaskMs=${longTaskTotalMs} ` +
          `lenis=${lenisRunning} heroRAF=${heroRafRunning} videos(src=${videosWithSrc},playing=${videosPlaying},decoding=${videosDecoding})`
      );
    };

    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [enabled]);

  return null;
}
