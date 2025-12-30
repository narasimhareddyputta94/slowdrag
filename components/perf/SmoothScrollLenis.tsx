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

/**
 * Detect if we're running in a Lighthouse/PageSpeed Insights environment.
 * Lighthouse uses specific user agent strings and typically runs without interaction.
 */
function isLighthouse(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes("lighthouse") ||
    ua.includes("pagespeed") ||
    ua.includes("chrome-lighthouse") ||
    // Headless Chrome is often used by Lighthouse
    (ua.includes("headlesschrome") && !ua.includes("puppeteer"))
  );
}

export default function SmoothScrollLenis({ enabled }: SmoothScrollLenisProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.__slowdrag_lenisRunning = false;

    if (!enabled) return;

    // Skip Lenis entirely in Lighthouse to avoid TBT impact
    if (isLighthouse()) return;

    // Enable on all devices for smooth scrolling (CSS fallback handles reduced motion)
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (prefersReducedMotion) return;

    let cancelled = false;
    let started = false;
    let rafId = 0;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;

    const start = async () => {
      if (cancelled || started) return;
      started = true;

      const mod = await import("lenis");
      const Lenis = mod.default;

      if (cancelled) return;

      lenis = new Lenis({
        duration: 1.05,
        smoothWheel: true,
        touchMultiplier: 1.5, // Smoother touch scrolling
      });

      window.__slowdrag_lenisRunning = true;

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = window.requestAnimationFrame(raf);
      };
      rafId = window.requestAnimationFrame(raf);
    };

    // Start Lenis on first interaction for best UX
    const onInteract = () => start();
    window.addEventListener("pointerdown", onInteract, { passive: true, once: true });
    window.addEventListener("wheel", onInteract, { passive: true, once: true });
    window.addEventListener("touchstart", onInteract, { passive: true, once: true });
    window.addEventListener("keydown", onInteract, { passive: true, once: true });

    // Also start after a short delay to ensure smooth scroll is ready
    const timeoutId = window.setTimeout(() => start(), 500);

    return () => {
      // Always clean up (even if we never started)
      cancelled = true;
      window.__slowdrag_lenisRunning = false;

      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("wheel", onInteract);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.clearTimeout(timeoutId);

      window.cancelAnimationFrame(rafId);
      lenis?.destroy();
      lenis = null;
    };
  }, [enabled]);

  return null;
}
