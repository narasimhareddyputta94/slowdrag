"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __slowdrag_lenisRunning?: boolean;
  }
}

type SmoothScrollLenisProps = {
  enabled: boolean;
};

export default function SmoothScrollLenis({ enabled }: SmoothScrollLenisProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.__slowdrag_lenisRunning = false;

    if (!enabled) return;

    // Desktop only (avoid mobile/touch Lighthouse regressions).
    const isDesktop = window.matchMedia?.("(min-width: 1024px)")?.matches ?? false;
    if (!isDesktop) return;

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (prefersReducedMotion) return;

    let cancelled = false;
    let started = false;
    let rafId = 0;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;

    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | undefined;
    let timeoutId = 0;

    const start = async () => {
      if (cancelled || started) return;
      started = true;

      const mod = await import("lenis");
      const Lenis = mod.default;

      if (cancelled) return;

      lenis = new Lenis({
        duration: 1.05,
        smoothWheel: true,
      });

      window.__slowdrag_lenisRunning = true;

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = window.requestAnimationFrame(raf);
      };
      rafId = window.requestAnimationFrame(raf);
    };

    const onInteract = () => start();
    window.addEventListener("pointerdown", onInteract, { passive: true, once: true });
    window.addEventListener("wheel", onInteract, { passive: true, once: true });
    window.addEventListener("touchstart", onInteract, { passive: true, once: true });
    window.addEventListener("keydown", onInteract, { passive: true, once: true });

    // Idle fallback for non-interaction sessions (Lighthouse typically doesn't interact)
    // Reduced from 2500ms to 1500ms for faster smooth scroll activation
    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(() => start(), { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(() => start(), 1500);
    }

    return () => {
      // Always clean up (even if we never started)
      cancelled = true;
      window.__slowdrag_lenisRunning = false;

      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("wheel", onInteract);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("keydown", onInteract);

      if (idleId !== undefined && typeof w.cancelIdleCallback === "function") w.cancelIdleCallback(idleId);
      window.clearTimeout(timeoutId);

      window.cancelAnimationFrame(rafId);
      lenis?.destroy();
      lenis = null;
    };
  }, [enabled]);

  return null;
}
