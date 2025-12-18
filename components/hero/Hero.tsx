"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type HeroProps = {
  imageSrc: string;
  onScrolledChange?: (scrolled: boolean) => void; // tells parent when to show navbar
};

export default function Hero({ imageSrc, onScrolledChange }: HeroProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 10;
      setScrolled(next);
      onScrolledChange?.(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScrolledChange]);

  const brandPink = "#c6376c";

  return (
    <section
      aria-label="Hero"
      style={{
        minHeight: "100vh",
        background: "#000",
        position: "relative",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
      }}
    >
      {/* BIG HERO IMAGE */}
      <div style={{ width: "min(1800px, 98vw)", display: "grid", placeItems: "center" }}>
        <Image
          src={imageSrc}
          alt="Slow Drag Studio"
          width={3200}
          height={1800}
          priority
          style={{ width: "100%", height: "auto", objectFit: "contain", userSelect: "none" }}
        />
      </div>

      {/* Text overlays appear after scroll */}
      {scrolled && (
        <>
          {/* Left quote */}
          <div
            style={{
              position: "fixed",
              left: 44,
              bottom: 90,
              maxWidth: 420,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 20,
              lineHeight: 1.25,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#e8e8e8",
              opacity: 0.92,
              zIndex: 40,
            }}
          >
            “IMAGES&nbsp;&nbsp;BREATHE
            <br />
            BEFORE&nbsp;THEY
            <br />
            SPEAK”
          </div>

          {/* Right tagline */}
          <div
            style={{
              position: "fixed",
              right: 56,
              top: "50%",
              transform: "translateY(-50%)",
              textAlign: "right",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 18,
              lineHeight: 1.35,
              letterSpacing: "0.06em",
              color: "#e8e8e8",
              opacity: 0.9,
              zIndex: 40,
            }}
          >
            Rhythm.
            <br />
            Resistance.
            <br />
            Remembrance.
          </div>

          {/* CONTACT button */}
          <button
            type="button"
            onClick={() => router.push("/contact")}
            style={{
              position: "fixed",
              right: 34,
              bottom: 32,
              padding: "12px 22px",
              borderRadius: 999,
              border: `2px solid ${brandPink}`,
              background: "rgba(0,0,0,0.35)",
              color: "#fff",
              fontSize: 14,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              backdropFilter: "blur(6px)",
              zIndex: 40,
            }}
          >
            CONTACT US
          </button>
        </>
      )}

      {/* REGISTER button only at top (no scroll yet) */}
      {!scrolled && (
        <button
          type="button"
          onClick={() => router.push("/register")}
          style={{
            position: "fixed",
            right: 32,
            bottom: 32,
            padding: "14px 22px",
            borderRadius: 999,
            border: "0",
            background: brandPink,
            color: "#fff",
            fontSize: 14,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: "0 10px 30px rgba(198, 55, 108, 0.35)",
            zIndex: 40,
          }}
        >
          Register
        </button>
      )}
    </section>
  );
}
