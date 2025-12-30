"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import useSiteLoaded from "@/components/perf/useSiteLoaded";
import useAfterFirstPaint from "@/components/perf/useAfterFirstPaint";

// Dynamically load the full interactive hero - this is the heavy part
const HeroMeltWebGL = dynamic(() => import("./HeroMeltWebGL"), {
  ssr: false,
  loading: () => null, // Shell handles loading UI
});

type HeroShellProps = {
  imageSrc: string;
  onScrolledChange?: (scrolled: boolean) => void;
  brandColor?: string;
  showCaption?: boolean;
  children?: React.ReactNode;
  posterAlt?: string;
  posterWidth?: number;
  posterHeight?: number;
  onMeltFinished?: () => void;
};

/**
 * Lightweight hero shell that renders the LCP image immediately,
 * then lazy-loads the full interactive HeroMeltWebGL component.
 */
export default function HeroShell({
  imageSrc,
  onScrolledChange,
  brandColor = "#c6376c",
  showCaption = false,
  children,
  posterAlt = "Slow Drag Studios",
  posterWidth = 1920,
  posterHeight = 960,
  onMeltFinished,
}: HeroShellProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadFull, setLoadFull] = useState(false);
  const siteLoaded = useSiteLoaded();
  const afterFirstPaint = useAfterFirstPaint();

  // Load the full interactive hero after site is loaded and first paint
  useEffect(() => {
    if (siteLoaded && afterFirstPaint && !loadFull) {
      setLoadFull(true);
    }
  }, [siteLoaded, afterFirstPaint, loadFull]);

  const posterBoxW = `min(${posterWidth}px, 88vw)`;
  const posterBoxH = `min(${Math.max(1, Math.round(posterHeight * 0.867))}px, 40vh)`;
  const posterIsSvg = /\.svg(\?|#|$)/i.test(imageSrc);

  // When the full component is loaded, render it instead
  if (loadFull) {
    return (
      <HeroMeltWebGL
        imageSrc={imageSrc}
        onScrolledChange={onScrolledChange}
        brandColor={brandColor}
        showCaption={showCaption}
        posterAlt={posterAlt}
        posterWidth={posterWidth}
        posterHeight={posterHeight}
        onMeltFinished={onMeltFinished}
      >
        {children}
      </HeroMeltWebGL>
    );
  }

  // Initial render: just the LCP image shell (no JS-heavy logic)
  return (
    <section
      ref={containerRef}
      style={{
        height: "100svh",
        minHeight: "100vh",
        width: "100%",
        background: "#000",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100svh",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transform: "translateZ(0)",
        }}
      >
        {/* LCP Image - renders immediately */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            width: posterBoxW,
            height: posterBoxH,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <Image
            src={imageSrc}
            alt={posterAlt}
            fill
            priority
            unoptimized={posterIsSvg}
            quality={85}
            fetchPriority="high"
            sizes="(max-width: 768px) 88vw, (max-width: 1200px) 1200px, 1920px"
            style={{
              objectFit: "contain",
              filter: "contrast(1.02) saturate(1.02)",
            }}
          />
        </div>

        {/* Canvas placeholder - will be replaced by full component */}
        <div
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "2000px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <canvas
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              pointerEvents: "none",
              transform: "translateZ(0)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
