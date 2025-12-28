"use client";

import React, { useMemo } from "react";
import useIsMobile from "@/components/perf/useIsMobile";

type ManifestoFlowWebGLProps = {
  /** Same color used by the hero melt animation */
  brandColor?: string;
  /** Becomes true once the hero melt finishes */
  armed?: boolean;
};

// Keep the text exactly as-is (line breaks matter).
const MANIFESTO_LINES = [
  "SLOW DRAG STUDIOS IS A CREATIVE DESIGN",
  "AND FILM STUDIO BUILT AGAINST HASTE. OUR",
  "WORK RESISTS THE ALGORITHMIC URGE TO",
  "RUSH, FLATTEN, SIMPLIFY.",
  "WE WORK IN PULSE, NOT TEMPO. IN MEMORY,",
  "NOT NOISE. WE MAKE FILMS, IMAGES, AND",
  "SYSTEMS OF DESIGN THAT STAY LONG AFTER",
  "THE SCROLL ENDS.",
];

export default function ManifestoFlowWebGL({
  brandColor = "#c6376c",
  armed = false,
}: ManifestoFlowWebGLProps) {
  const isMobile = useIsMobile(768);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);

  const play = armed || prefersReducedMotion;

  // Top->bottom line reveal in ~3s total.
  const staggerSeconds = 0.3;
  const lineFadeSeconds = 0.6;

  return (
    <section
      aria-label="Manifesto"
      style={{
        minHeight: "70vh",
        background: "#000",
        display: "grid",
        placeItems: "center",
        padding: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          padding: "0 20px",
          textAlign: "center",
          textTransform: "uppercase",
          fontFamily: "var(--font-offbit-101)",
          fontWeight: 700,
          lineHeight: 1.55,
          letterSpacing: "0.11em",
          fontSize: "clamp(14px, 3.2vw, 28px)",
          color: brandColor,
          filter:
            "drop-shadow(0 0 10px rgb(255 255 255 / 0.08)) drop-shadow(0 0 20px rgb(0 0 0 / 0.45))",
        }}
      >
        {isMobile ? (
          <p
            className={play ? "mf-paragraph mf-paragraph--play" : "mf-paragraph"}
            style={{
              margin: 0,
              opacity: prefersReducedMotion ? 1 : 0,
              animationDuration: "3s",
            }}
          >
            {MANIFESTO_LINES.join(" ")}
          </p>
        ) : (
          MANIFESTO_LINES.map((line, i) => (
            <div
              key={line}
              className={play ? "mf-line mf-line--play" : "mf-line"}
              style={{
                opacity: prefersReducedMotion ? 1 : 0,
                animationDelay: `${(prefersReducedMotion ? 0 : i * staggerSeconds).toFixed(3)}s`,
                animationDuration: `${lineFadeSeconds}s`,
              }}
            >
              {line}
            </div>
          ))
        )}
      </div>

      <style>{`
        .mf-line {
          opacity: 0;
        }
        .mf-line--play {
          animation-name: mfFadeIn;
          animation-timing-function: ease;
          animation-fill-mode: forwards;
        }
        .mf-paragraph {
          opacity: 0;
        }
        .mf-paragraph--play {
          animation-name: mfFadeIn;
          animation-timing-function: ease;
          animation-fill-mode: forwards;
        }
        @keyframes mfFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-line {
            opacity: 1 !important;
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
