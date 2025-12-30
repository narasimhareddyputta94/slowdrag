"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ManifestoFlowWebGLProps = {
  /** Same color used by the hero melt animation */
  brandColor?: string;
};

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
}: ManifestoFlowWebGLProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasEnteredViewOnce, setHasEnteredViewOnce] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mql) return;

    const apply = () => setPrefersReducedMotion(mql.matches);
    apply();

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }

    // Legacy Safari
    mql.addListener(apply);
    return () => mql.removeListener(apply);
  }, []);

  // Trigger once when the section enters the viewport.
  useEffect(() => {
    if (hasEnteredViewOnce) return;
    if (prefersReducedMotion) return;

    const el = sectionRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      const t = window.setTimeout(() => setHasEnteredViewOnce(true), 0);
      return () => window.clearTimeout(t);
    }

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries[0]?.isIntersecting ?? false;
        if (!hit) return;
        setHasEnteredViewOnce(true);
        io.disconnect();
      },
      { threshold: 0.2 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasEnteredViewOnce, prefersReducedMotion]);

  // Start ONLY when the section enters the viewport.
  // (Keep `armed` prop for API compatibility; it's not used for the trigger.)
  const shouldStart = prefersReducedMotion || hasEnteredViewOnce;

  // Two-phase start: ensure one paint in the hidden state, then begin animation.
  useEffect(() => {
    if (animate) return;
    if (!shouldStart) return;

    if (prefersReducedMotion) {
      const t = window.setTimeout(() => setAnimate(true), 0);
      return () => window.clearTimeout(t);
    }

    // IMPORTANT: rAF callbacks run *before* paint. A single rAF can flip state
    // before the initial hidden frame ever paints, which makes the transition
    // appear to do nothing. Double-rAF guarantees one painted hidden frame.
    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setAnimate(true));
    });

    return () => {
      if (raf1) window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [animate, prefersReducedMotion, shouldStart]);

  const play = prefersReducedMotion ? true : animate;

  // Total reveal window must be exactly 4.0s (first line start -> last line end).
  const totalSeconds = 4;
  const lineFadeSeconds = prefersReducedMotion ? 0.5 : 0.9;
  const staggerSeconds = useMemo(() => {
    return (totalSeconds - lineFadeSeconds) / Math.max(1, MANIFESTO_LINES.length - 1);
  }, [lineFadeSeconds]);

  return (
    <section
      ref={sectionRef}
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
        {MANIFESTO_LINES.map((line, i) => (
          <div
            key={line}
            className="mf-line"
            style={{
              opacity: 0,
              transform: prefersReducedMotion ? "none" : "translate3d(0, 12px, 0)",
              animationName: play ? (prefersReducedMotion ? "mf-fade-in-opacity" : "mf-fade-in") : "none",
              animationDuration: play ? `${lineFadeSeconds}s` : "0s",
              animationTimingFunction: prefersReducedMotion ? "linear" : "cubic-bezier(0.22, 1, 0.36, 1)",
              animationFillMode: play ? "forwards" : "none",
              animationDelay: play ? `${(i * staggerSeconds).toFixed(3)}s` : "0s",
              willChange: prefersReducedMotion ? undefined : "opacity, transform",
            }}
          >
            {line}
          </div>
        ))}
      </div>

      <style>{`
        .mf-line {
          /* Transition handled inline to avoid any initial flash and ensure deterministic timing. */
        }

        @keyframes mf-fade-in {
          0% {
            opacity: 0;
            transform: translate3d(0, 12px, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes mf-fade-in-opacity {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-line {
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}