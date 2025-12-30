"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
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

  introAutoplay?: boolean;
  introUnlockAt?: number;
  onIntroUnlock?: () => void;
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
  introAutoplay = false,
  introUnlockAt = 0.5,
  onIntroUnlock,
}: HeroShellProps) {
  const [loadFull, setLoadFull] = useState(false);
  const siteLoaded = useSiteLoaded();
  const afterFirstPaint = useAfterFirstPaint();

  // Load the full interactive hero after site is loaded and first paint
  useEffect(() => {
    if (!siteLoaded || !afterFirstPaint || loadFull) return;

    // Preload the module first so we never render a null hero while the chunk downloads.
    // (Rendering null here would collapse a 100svh section -> catastrophic CLS.)
    let cancelled = false;
    import("./HeroMeltWebGL")
      .then(() => {
        if (cancelled) return;
        setLoadFull(true);
      })
      .catch(() => {
        // If preload fails, keep the shell (poster) instead of collapsing.
      });

    return () => {
      cancelled = true;
    };
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
        introAutoplay={introAutoplay}
        introUnlockAt={introUnlockAt}
        onIntroUnlock={onIntroUnlock}
      >
        {children}
      </HeroMeltWebGL>
    );
  }

  // Initial render: just the LCP image shell (no JS-heavy logic)
  return (
    <section
      style={{
        height: "100svh",
        minHeight: "100svh",
        width: "100%",
        background: "#000",
        position: "relative",
        overflowX: "clip",
      }}
    >
      {/* SEO: h1 for page title - visually hidden but crawlable */}
      <h1
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        Slow Drag Studios — Film and Design Studio
      </h1>
      <div
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100svh",
          minHeight: "100svh",
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
            quality={75}
            fetchPriority="high"
            // Optimized sizes: 88vw on mobile (capped at 768px), 
            // 1200px on tablets, 1920px on desktop
            sizes="(max-width: 480px) 420px, (max-width: 768px) 88vw, (max-width: 1200px) 1200px, 1920px"
            style={{
              objectFit: "contain",
              filter: "contrast(1.02) saturate(1.02)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
