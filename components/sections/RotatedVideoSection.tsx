"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export default function RotatedVideoSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [sectionHeight, setSectionHeight] = useState<number | null>(null);

  const measure = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.height) setSectionHeight(rect.height);
  }, []);

  useEffect(() => {
    let rafId = 0;
    const schedule = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);

    const el = videoRef.current;
    if (el) {
      el.addEventListener("loadedmetadata", schedule);
      el.addEventListener("loadeddata", schedule);
    }

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && el) {
      ro = new ResizeObserver(schedule);
      ro.observe(el);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      if (el) {
        el.removeEventListener("loadedmetadata", schedule);
        el.removeEventListener("loadeddata", schedule);
      }
      ro?.disconnect();
    };
  }, [measure]);

  return (
    <section
      aria-label="Rotated video"
      className="relative overflow-hidden"
      style={{ width: "100vw", height: sectionHeight ? `${sectionHeight}px` : "100vw" }}
    >
      <video
        ref={videoRef}
        className="absolute left-1/2 top-1/2"
        style={{
          // With rotate(90deg), the bounding-box width equals the element's height.
          // So setting element height to 100vw guarantees the rotated video spans full screen width.
          height: "100vw",
          width: "auto",
          maxWidth: "none",
          maxHeight: "none",
          display: "block",
          transform: "translate(-50%, -50%) rotate(90deg)",
          transformOrigin: "center",
          objectFit: "contain",
        }}
        src="/images/IMG_2293.MP4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    </section>
  );
}
