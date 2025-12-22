"use client";

import React from "react";
import Navbar from "@/components/nav/Navbar";

export default function AboutPage() {
  const brandColor = "#c6376c";

  // ✅ Reuse the same shape path you finalized for Contact
  // (keep this EXACT string in sync with your contact section)
  const contactShapePath = `
M 229.50,170.00
L 456.00,170.00

L 520.00,170.00
Q 537.89,169.73 540.00,187.50
Q 542.11,205.27 560.00,205.00
Q 577.89,204.73 580.00,222.50
Q 582.11,240.27 600.00,240.00
L 1150.00,240.00
Q 1172.43,239.68 1166.88,261.41
Q 1171.44,279.14 1153.13,278.91
Q 1130.71,278.58 1136.25,300.31
Q 1141.80,322.03 1119.38,321.72
Q 1096.95,321.40 1102.50,343.13
Q 1108.04,364.85 1085.63,364.53
Q 1063.20,364.21 1068.75,385.94
Q 1074.29,407.66 1051.88,407.34
Q 1029.45,407.02 1035.00,428.75
L 900.00,600.00
L 1250.00,600.00

L 744.00,600.00
L 24.00,600.00
L 0.00,600.00
L 0.00,274.00


L 199.50,40.00
L 229.50,40.00
Z
`;

  return (
    <main className="min-h-screen w-full bg-[#0b0b0b] text-white">
      <Navbar
        logoSrc="/images/logo.png"
        logoAltSrc="/images/fulllogo.png"
        useAltLogo={true}
        show={true}
        brandColor={brandColor}
      />

      {/* ===== shape card ===== */}
      <section className="w-full pt-0 pb-14 pl-0 pr-6">
        <div className="relative w-full">
          {/* this keeps the shape responsive */}
          <div className="relative w-full overflow-visible -translate-x-[1100px] -translate-y-[620px]">
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

                {/* ABOUT US pill (inside the box) */}
                <g>
                  <text
                    x="795"
                    y="108"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="32"
                    fontWeight="700"
                    style={{ letterSpacing: "1px" }}
                  >
                    ABOUT US
                  </text>
                </g>
              </g>

              {/* border stroke for the shape */}
              <path
                d={contactShapePath}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                transform="translate(0 600) scale(1 -1)"
              />
            </svg>
          </div>
        </div>

        {/* Text moved outside the box */}
        <div className="mx-auto mt-10 max-w-[760px] rounded-2xl bg-black/55 px-8 py-7 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-sm">
          <p className="text-sm leading-6 text-white/85">
            Slow Drag Studio is a design and film studio, but more importantly, we are a practice — a way of working.
          </p>

          <p className="mt-4 text-sm leading-6 text-white/80">
            We honour process, people, and stories that don’t arrive neatly packaged. Our practice is rooted in emotion:
            grief, desire, survival, intimacy, and resistance — in the everyday spaces where politics quietly unfolds.
          </p>

          <p className="mt-4 text-sm leading-6 text-white/80">
            We make space for the marginalised, the silenced, the unseen — not as subjects, but as authors of their own image.
          </p>
        </div>
      </section>
    </main>
  );
}
