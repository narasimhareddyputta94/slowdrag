"use client";

import { useLayoutEffect } from "react";

type ScrollLockProps = {
  enabled: boolean;
};

/**
 * CLS-safe scroll lock.
 * Uses overflow:hidden + touch-action:none instead of position:fixed.
 * This prevents layout shift while still blocking scroll.
 */
export default function ScrollLock({ enabled }: ScrollLockProps) {
  useLayoutEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const html = document.documentElement;
    const body = document.body;

    // Save previous styles
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevOverscrollY = html.style.overscrollBehaviorY;
    const prevTouchAction = body.style.touchAction;

    // Block scrolling without repositioning body (avoids CLS)
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehaviorY = "none";
    body.style.touchAction = "none";

    const preventKeys = new Set([
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      " ",
    ]);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (preventKeys.has(e.key)) e.preventDefault();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);

      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.overscrollBehaviorY = prevOverscrollY;
      body.style.touchAction = prevTouchAction;
    };
  }, [enabled]);

  return null;
}
