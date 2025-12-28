"use client";

import MountWhenNearViewport from "@/components/perf/MountWhenNearViewport";

export default function RotatedVideoSection() {
  const shell = {
    width: "100vw",
    aspectRatio: "3194 / 766",
  } as const;

  return (
    <MountWhenNearViewport
      rootMargin="400px 0px"
      placeholder={<section aria-label="Rotated video" className="relative overflow-hidden" style={shell} />}
    >
      <section aria-label="Rotated video" className="relative overflow-hidden" style={shell}>
        <video
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
          src="/images/IMG_2293.MP4"
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
