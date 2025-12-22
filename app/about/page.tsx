"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/nav/Navbar";
import { offBit, offBitBold } from "@/app/fonts";

export default function AboutPage() {
  const brandColor = "#c6376c";
  const [showNav, setShowNav] = useState(true);
  const lastScrollYRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;

        const currentY = window.scrollY;
        const prevY = lastScrollYRef.current;
        const delta = currentY - prevY;

        // Always show near the top
        if (currentY <= 12) {
          setShowNav(true);
        } else if (delta > 8) {
          // scrolling down
          setShowNav(false);
        } else if (delta < -8) {
          // scrolling up
          setShowNav(true);
        }

        lastScrollYRef.current = currentY;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ✅ Reuse the same shape path you finalized for Contact
  // (keep this EXACT string in sync with your contact section)
  const contactShapePath = `
M 229.50,170.00
L 456.00,170.00

L 520.00,170.00
Q 540.00,170.00 540.00,187.50
T 560.00,205.00
T 580.00,222.50
Q 580.00,240.00 600.00,240.00
L 1150.00,240.00
Q 1170.00,240.00 1170.00,257.50
Q 1171.44,279.14 1153.13,278.91
Q 1134.81,278.69 1135.63,296.91
T 1115.00,315.00

L 295.00,315.00
Z
`;

  return (
    <main className="min-h-screen w-full bg-[#0b0b0b] text-white">
      <Navbar
        logoSrc="/images/logo.png"
        logoAltSrc="/images/fulllogo.png"
        useAltLogo={true}
        show={showNav}
        slideOnHide={true}
        brandColor={brandColor}
      />

      {/* ===== shape card ===== */}
      <section className="w-full pt-0 pb-14 pl-0 pr-6">
        <div className="relative w-full overflow-visible h-[260px] md:h-[600px]">
          {/* this keeps the shape responsive */}
          <div className="absolute left-0 top-0 w-full overflow-visible -translate-x-[1100px] -translate-y-[620px]">
            <svg
              viewBox="0 0 1400 600"
              className="block h-auto w-[200vw] max-w-none"
              preserveAspectRatio="none"
            >
              {/* Flip only the silhouette (top/bottom swapped; left/right unchanged) */}
              {/* viewBox height is 600, so translateY(600) + scaleY(-1) */}
              <defs>
                <clipPath id="aboutClip">
                  <path d={contactShapePath} transform="translate(0 600) scale(1 -1)" />
                </clipPath>

                {/* subtle glow overlay */}
                <radialGradient id="aboutGlow" cx="40%" cy="25%" r="70%">
                  <stop offset="0%" stopColor="rgba(120,255,255,0.30)" />
                  <stop offset="40%" stopColor="rgba(200,120,255,0.22)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.0)" />
                </radialGradient>

                {/* background gradient */}
                <linearGradient id="aboutBG" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0d1a2a" />
                  <stop offset="40%" stopColor="#3a2a70" />
                  <stop offset="100%" stopColor="#1a0f22" />
                </linearGradient>
              </defs>

              {/* Background inside the shape */}
              <g clipPath="url(#aboutClip)">
                {/* gradient base */}
                <rect x="0" y="0" width="1400" height="600" fill="url(#aboutBG)" />

                {/* “aurora / blur” blobs like your screenshot */}
                <circle cx="180" cy="90" r="170" fill="rgba(120,255,255,0.30)" />
                <circle cx="520" cy="60" r="220" fill="rgba(150,90,255,0.25)" />
                <circle cx="760" cy="170" r="260" fill="rgba(0,255,220,0.18)" />
                <rect x="0" y="0" width="1400" height="600" fill="url(#aboutGlow)" />

                {/* dark overlay to push text contrast */}
                <rect x="0" y="0" width="1400" height="600" fill="rgba(0,0,0,0.35)" />
              </g>

              {/* ABOUT US heading (drawn on top for reliability) */}
              <text
                x="1070"
                y="345"
                className={offBit.className}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize="24"
                fontWeight="700"
                style={{ letterSpacing: "1px" }}
              >
                ABOUT US
              </text>

              {/* removed outline stroke (no border lines) */}
            </svg>
          </div>
        </div>

        {/* Text centered below the coloured image (no background / no borders) */}
        <div className={`${offBit.className} mx-auto mt-6 max-w-7xl px-6 py-16 text-center sm:px-10 sm:py-20 space-y-12`}>
          <p className="font-normal text-white/90 !text-[30px] !leading-relaxed sm:!text-[34px] lg:!text-[40px]">
            Slow Drag Studios is a design and film studio but more importantly,
            <br />
            a way of working.
          </p>

          <p className="font-normal text-white/90 !text-[30px] !leading-relaxed sm:!text-[34px] lg:!text-[40px]">
            We honour process, people, and stories that don’t arrive neatly packaged.
          </p>

          <p className="font-normal text-white/90 !text-[30px] !leading-relaxed sm:!text-[34px] lg:!text-[40px]">
            Our practice is rooted in emotion grief, desire, survival, intimacy,
            <br />
            and resistance and in the everyday spaces where politics quietly unfolds.
          </p>

          <p className="font-normal text-white/90 !text-[30px] !leading-relaxed sm:!text-[34px] lg:!text-[40px]">
            We make space for the marginalised, the silenced, the unseen
            <br />
            not as subjects, but as authors of their own image.
          </p>
        </div>

      </section>
    </main>
  );
}
