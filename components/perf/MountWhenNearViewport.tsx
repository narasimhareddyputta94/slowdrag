"use client";

import React, { useEffect, useRef, useState } from "react";

type MountWhenNearViewportProps = {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  /** How far outside the viewport we start mounting. */
  rootMargin?: string;
  /** Intersection threshold. */
  threshold?: number;
};

export default function MountWhenNearViewport({
  children,
  placeholder = null,
  rootMargin = "1200px 0px",
  threshold = 0.01,
}: MountWhenNearViewportProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  // Important: keep initial render identical between server + client to avoid hydration mismatch.
  // We always start with the placeholder, then mount in an effect.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;

    if (typeof IntersectionObserver === "undefined") {
      const t = window.setTimeout(() => setMounted(true), 0);
      return () => window.clearTimeout(t);
    }

    const el = hostRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries[0]?.isIntersecting ?? false;
        if (!hit) return;
        setMounted(true);
        io.disconnect();
      },
      { rootMargin, threshold }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [mounted, rootMargin, threshold]);

  return <div ref={hostRef}>{mounted ? children : placeholder}</div>;
}
