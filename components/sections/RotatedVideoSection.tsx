"use client";

import MountWhenNearViewport from "@/components/perf/MountWhenNearViewport";
import useAfterFirstPaint from "@/components/perf/useAfterFirstPaint";
import useNearViewport from "@/components/perf/useNearViewport";
import useSiteLoaded from "@/components/perf/useSiteLoaded";
import { useEffect, useRef, useState } from "react";

export default function RotatedVideoSection() {
  const shell = {
    width: "100vw",
    aspectRatio: "3194 / 766",
  } as const;

  const siteLoaded = useSiteLoaded();
  const afterFirstPaint = useAfterFirstPaint();

  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const inView = useNearViewport(sectionRef as unknown as React.RefObject<HTMLElement>, { rootMargin: "0px" });
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (activated) return;
    if (siteLoaded && afterFirstPaint && inView) setActivated(true);
  }, [activated, afterFirstPaint, inView, siteLoaded]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!inView) v.pause();
  }, [inView]);

  return (
    <MountWhenNearViewport
      rootMargin="150px 0px"
      placeholder={<section aria-label="Rotated video" className="relative overflow-hidden" style={shell} />}
    >
      <section
        ref={sectionRef as unknown as React.RefObject<HTMLElement>}
        aria-label="Rotated video"
        className="relative overflow-hidden"
        style={shell}
      >
        <video
          ref={videoRef}
          className="absolute left-1/2 top-1/2"
          style={{
            height: "100vw",
            width: "auto",
            maxWidth: "none",
            maxHeight: "none",
            display: "block",
            transform: "translate(-50%, -50%) rotate(90deg)",
            transformOrigin: "center",
            objectFit: "contain",
          }}
          src={activated ? "/images/IMG_2293.MP4" : undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
        />
      </section>
    </MountWhenNearViewport>
  );
}
