"use client";

import Image from "next/image";

type HeroShellProps = {
  imageSrc: string;
  brandColor?: string;
  showCaption?: boolean;
  posterAlt?: string;
  posterWidth?: number;
  posterHeight?: number;
};

/**
 * Static hero section — displays the title image, captions, and contact button.
 * Ready for a new animation layer to be added on top.
 */
export default function HeroShell({
  imageSrc,
  brandColor = "#c6376c",
  showCaption = true,
  posterAlt = "Slow Drag Studios",
  posterWidth = 1920,
  posterHeight = 1080,
}: HeroShellProps) {
  const posterBoxW = "clamp(280px, 75vw, 1920px)";
  const posterBoxH = "clamp(200px, 75vh, 1080px)";
  const posterIsSvg = /\.svg(\?|#|$)/i.test(imageSrc);

  const edgePad = "clamp(12px, 3.2vw, 36px)";
  const bottomPad = `calc(${edgePad} + env(safe-area-inset-bottom, 0px))`;
  const leftPad = `calc(${edgePad} + env(safe-area-inset-left, 0px))`;
  const rightPad = `calc(${edgePad} + env(safe-area-inset-right, 0px))`;

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
          position: "relative",
          width: "100%",
          height: "100svh",
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Title Image */}
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
            sizes="(max-width: 480px) 420px, (max-width: 768px) 88vw, (max-width: 1200px) 1200px, 1920px"
            style={{
              objectFit: "contain",
              filter: "contrast(1.02) saturate(1.02)",
            }}
          />
        </div>

        {/* Left caption */}
        <div
          aria-hidden={!showCaption}
          style={{
            position: "absolute",
            left: leftPad,
            bottom: bottomPad,
            zIndex: 10,
            pointerEvents: "none",
            opacity: showCaption ? 1 : 0,
            transition: "opacity 450ms ease",
            color: "#fff",
            fontFamily: "var(--font-offbit), monospace",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            lineHeight: 1.15,
            fontSize: "clamp(22px, 2.2vw, 34px)",
            maxWidth: "min(44vw, 520px)",
            whiteSpace: "pre-line",
          }}
        >
          {"\u201cSTORIES THAT\nREFUSE TO\nRUSH.\u201d"}
        </div>

        {/* Right caption */}
        <div
          aria-hidden={!showCaption}
          style={{
            position: "absolute",
            right: rightPad,
            top: "50%",
            transform: "translate3d(0,-50%,0)",
            zIndex: 10,
            pointerEvents: "none",
            opacity: showCaption ? 1 : 0,
            transition: "opacity 450ms ease",
            color: "#fff",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontStyle: "italic",
            letterSpacing: "0.04em",
            lineHeight: 1.25,
            fontSize: "clamp(18px, 1.8vw, 28px)",
            maxWidth: "min(42vw, 520px)",
            whiteSpace: "pre-line",
            textAlign: "right",
          }}
        >
          {"Rhythm.\nResistance.\nRemembrance."}
        </div>

        {/* Contact button */}
        <a
          href="/contact"
          style={{
            position: "absolute",
            right: rightPad,
            bottom: bottomPad,
            zIndex: 10,
            opacity: showCaption ? 1 : 0,
            transition: "opacity 450ms ease",
            pointerEvents: showCaption ? "auto" : "none",
            background: "transparent",
            border: `2px solid ${brandColor}`,
            borderRadius: 999,
            padding: "clamp(9px, 1.2vw, 12px) clamp(14px, 1.6vw, 20px)",
            color: "#fff",
            fontFamily: "var(--font-offbit), monospace",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontSize: "clamp(14px, 1.2vw, 18px)",
            lineHeight: 1,
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          CONTACT US
        </a>
      </div>
    </section>
  );
}
