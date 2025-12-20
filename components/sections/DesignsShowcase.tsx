"use client";

import React, { useMemo, useState } from "react";

type DesignItem = {
  title: string;
  src: string;
};

export default function DesignsShowcase() {
  const designs: DesignItem[] = useMemo(
    () => [
      { title: "Editorial", src: "" },
      { title: "Spatial", src: "" },
      { title: "Digital", src: "" },
    ],
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);

  const next = () => setActiveIndex((i) => (i + 1) % designs.length);
  const prev = () =>
    setActiveIndex((i) => (i - 1 + designs.length) % designs.length);

  // ✅ UPDATED: smaller-radius quarter-turn curves (sharper, more "quarter circle" feel)
  // ✅ ONLY THIS STRING IS CHANGED — nothing else touched.
  const shapePath = `
    M 25,0
    L 805,0
    Q 830,0 830,25
    L 830,80
    L 830,100
    Q 830,120 850,120
    L 975,120
    Q 1000,120 1000,145
    L 1000,430
    L 1000,455
    Q 1000,480 975,480
    L 750,480
    L 725,480
    Q 700,480 700,505
    L 700,550
    L 700,575
    Q 700,600 675,600
    L 200,600
    L 175,600
    Q 150,600 150,575
    L 150,520
    L 150,500
    Q 150,480 130,480
    L 50,480
    L 25,480
    Q 0,480 0,455
    L 0,170
    L 0,25
    Q 0,0 25,0
    Z
  `;

  return (
    <section className="relative w-full min-h-screen bg-black text-white overflow-hidden flex items-center justify-center font-sans">
      {/* Main Player Stage (WIDER like reference) */}
      <div className="relative w-[96%] md:w-[94%] lg:w-[90%] xl:w-[86%] max-w-[1500px] flex items-center justify-center">
        {/* Aspect Ratio Box (SHORTER height like reference) */}
        <div className="relative w-full aspect-[2.05/1] md:aspect-[2.0/1]">
          {/* INVISIBLE MASK DEFINITION */}
          <svg width="0" height="0" className="absolute">
            <defs>
              <clipPath id="blob-mask-design" clipPathUnits="objectBoundingBox">
                {/* 1000 x 600 -> 1 x 1 mapping */}
                <path transform="scale(0.001, 0.0016667)" d={shapePath} />
              </clipPath>
            </defs>
          </svg>

          {/* === THE SHAPE LAYER (WARM ORANGE THEME) === */}
          <svg
            viewBox="0 0 1000 600"
            className="w-full h-full drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
            preserveAspectRatio="none"
          >
            <defs>
              <radialGradient
                id="warm1"
                cx="40%"
                cy="40%"
                r="40%"
                fx="40%"
                fy="40%"
              >
                <stop offset="0%" stopColor="rgba(255, 240, 200, 0.9)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              <radialGradient id="warm2" cx="60%" cy="50%" r="55%">
                <stop offset="0%" stopColor="rgba(255, 140, 0, 0.7)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              <radialGradient id="warm3" cx="80%" cy="80%" r="60%">
                <stop offset="0%" stopColor="rgba(180, 40, 40, 0.5)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              <filter id="noise-design">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.8"
                  numOctaves="3"
                  stitchTiles="stitch"
                />
                <feColorMatrix type="saturate" values="0" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.1" />
                </feComponentTransfer>
              </filter>
            </defs>

            <g>
              <path d={shapePath} fill="#0a0500" />
              <path
                d={shapePath}
                fill="url(#warm1)"
                style={{ mixBlendMode: "screen" }}
              />
              <path
                d={shapePath}
                fill="url(#warm2)"
                style={{ mixBlendMode: "screen" }}
              />
              <path
                d={shapePath}
                fill="url(#warm3)"
                style={{ mixBlendMode: "screen" }}
              />

              {/* Grain Texture */}
              <rect
                width="100%"
                height="100%"
                filter="url(#noise-design)"
                style={{ mixBlendMode: "overlay" }}
                clipPath="url(#blob-mask-design)"
              />
            </g>

            {/* Border Stroke */}
            <path
              d={shapePath}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
            />
          </svg>

          {/* === HUD INTERFACE === */}

          {/* Top Right Pill */}
          <div className="absolute top-[8%] right-[2.5%] z-30">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#6fe7d3] blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
              <button className="relative px-8 py-2 bg-black/50 border border-[#6fe7d3] rounded-full backdrop-blur-md text-sm font-bold tracking-[0.25em] text-white hover:bg-[#6fe7d3] hover:text-black transition-all uppercase">
                DESIGN
              </button>
            </div>
          </div>

          {/* Bottom Left CTA */}
          <div className="absolute bottom-[6%] left-[3%] z-30">
            <button className="px-8 py-3 bg-black/40 border border-[#6fe7d3] rounded-full backdrop-blur-md text-[10px] md:text-xs font-bold tracking-[0.2em] text-white hover:bg-[#6fe7d3] hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              MAKE US A PART OF YOUR STORY TELLING
            </button>
          </div>

          {/* === NAVIGATION ARROWS (MOVED TOWARD SCREEN EDGES) === */}

          {/* Left Arrow */}
          <button
            onClick={prev}
            className="
              absolute top-1/2 -translate-y-1/2 z-50
              outline-none bg-transparent border-none p-0 focus:outline-none
              left-[-10px] md:left-[-120px] lg:left-[-160px] xl:left-[-190px]
            "
            aria-label="Previous"
          >
            <img
              src="/images/cursor-new.png"
              alt="Previous"
              style={{ width: "40px", height: "40px" }}
              className="object-contain rotate-225 transition-transform duration-300 hover:scale-110 drop-shadow-[0_0_8px_rgba(232,233,56,0.6)]"
            />
          </button>

          {/* Right Arrow */}
          <button
            onClick={next}
            className="
              absolute top-1/2 -translate-y-1/2 z-50
              outline-none bg-transparent border-none p-0 focus:outline-none
              right-[-8px] md:right-[-120px] lg:right-[-160px] xl:right-[-190px]
            "
            aria-label="Next"
          >
            <img
              src="/images/cursor-new.png"
              alt="Next"
              style={{ width: "40px", height: "40px" }}
              className="object-contain rotate-45 transition-transform duration-300 hover:scale-110 drop-shadow-[0_0_8px_rgba(232,233,56,0.6)]"
            />
          </button>

          {/* Bottom Right Text */}
          <div className="absolute bottom-[6%] right-[5%] z-30 text-right">
            <p className="text-[14px] md:text-[16px] leading-tight text-[#e0e0e0] font-light tracking-wide drop-shadow-md">
              visual systems
              <br />
              spanning editorial,
              <br />
              spatial,
              <br />
              digital design.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
