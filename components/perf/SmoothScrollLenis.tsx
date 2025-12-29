"use client";

import { useEffect } from "react";

type SmoothScrollLenisProps = {
  enabled: boolean;
};

export default function SmoothScrollLenis({ enabled }: SmoothScrollLenisProps) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (prefersReducedMotion) return;

    let cancelled = false;
    let rafId = 0;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;

    (async () => {
      const mod = await import("lenis");
      if (cancelled) return;

      const Lenis = mod.default;
      lenis = new Lenis({
        duration: 1.05,
        smoothWheel: true,
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = window.requestAnimationFrame(raf);
      };
      rafId = window.requestAnimationFrame(raf);
    })();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      lenis?.destroy();
      lenis = null;
    };
  }, [enabled]);

  return null;
}
