"use client";

import React, { useMemo, useState } from "react";

type DesignItem = {
  title: string;
  src: string;
};

export default function DesignsShowcase() {
  // Placeholder data for designs
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
  const prev = () => setActiveIndex((i) => (i - 1 + designs.length) % designs.length);

  // Same "Blob" shape path
  const shapePath = `
    M 160,50 
    Q 160,0 210,0 
    L 780,0 
    Q 830,0 830,50 
    L 830,80 
    Q 830,120 870,120 
    L 950,120 
    Q 1000,120 1000,170 
    L 1000,430 
    Q 1000,480 950,480 
    L 750,480 
    Q 700,480 700,530 
    L 700,550 
    Q 700,600 650,600 
    L 200,600 
    Q 150,600 150,550 
    L 150,520 
    Q 150,480 110,480 
    L 50,480 
    Q 0,480 0,430 
    L 0,170 
    Q 0,120 50,120 
    L 120,120 
    Q 160,120 160,80 
    Z
  `;

  return (
    <section className="relative w-full min-h-screen bg-black text-white overflow-hidden flex items-center justify-center font-sans">
      
      {/* Main Player Stage */}
      <div className="relative w-[95%] md:w-[90%] lg:w-[80%] xl:w-[70%] max-w-[1200px] flex items-center justify-center">
        
        {/* Aspect Ratio Box */}
        <div className="relative w-full aspect-[16/10] md:aspect-[1.8/1]">
            
            {/* INVISIBLE MASK DEFINITION */}
            <svg width="0" height="0" className="absolute">
              <defs>
                <clipPath id="blob-mask-design" clipPathUnits="objectBoundingBox">
                  <path transform="scale(0.001, 0.00166)" d={shapePath} />
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
                {/* Gradient 1: Bright Center Yellow/White */}
                <radialGradient id="warm1" cx="40%" cy="40%" r="40%" fx="40%" fy="40%">
                  <stop offset="0%" stopColor="rgba(255, 240, 200, 0.9)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                
                {/* Gradient 2: Rich Orange/Gold */}
                <radialGradient id="warm2" cx="60%" cy="50%" r="55%">
                  <stop offset="0%" stopColor="rgba(255, 140, 0, 0.7)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                
                {/* Gradient 3: Deep Red/Brown edges */}
                <radialGradient id="warm3" cx="80%" cy="80%" r="60%">
                  <stop offset="0%" stopColor="rgba(180, 40, 40, 0.5)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>

                <filter id="noise-design">
                  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
                  <feColorMatrix type="saturate" values="0" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.1" /> 
                  </feComponentTransfer>
                </filter>
              </defs>

              <g>
                <path d={shapePath} fill="#0a0500" /> {/* Darker brownish black background */}
                <path d={shapePath} fill="url(#warm1)" style={{ mixBlendMode: 'screen' }} />
                <path d={shapePath} fill="url(#warm2)" style={{ mixBlendMode: 'screen' }} />
                <path d={shapePath} fill="url(#warm3)" style={{ mixBlendMode: 'screen' }} />
                
                {/* Grain Texture */}
                <rect width="100%" height="100%" filter="url(#noise-design)" style={{ mixBlendMode: 'overlay' }} clipPath="url(#blob-mask-design)" />
              </g>

              {/* The Border Stroke */}
              <path d={shapePath} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            </svg>

            {/* === HUD INTERFACE === */}
            
            {/* 1. Top Right Pill ("DESIGN") */}
            <div className="absolute top-[8%] right-[2.5%] z-30">
               <div className="relative group">
                 <div className="absolute inset-0 bg-[#6fe7d3] blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                 <button className="relative px-8 py-2 bg-black/50 border border-[#6fe7d3] rounded-full backdrop-blur-md text-sm font-bold tracking-[0.25em] text-white hover:bg-[#6fe7d3] hover:text-black transition-all uppercase">
                    DESIGN
                 </button>
               </div>
            </div>

            {/* 2. Bottom Left CTA ("MAKE US A PART...") */}
            <div className="absolute bottom-[6%] left-[3%] z-30">
              <button className="px-8 py-3 bg-black/40 border border-[#6fe7d3] rounded-full backdrop-blur-md text-[10px] md:text-xs font-bold tracking-[0.2em] text-white hover:bg-[#6fe7d3] hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                MAKE US A PART OF YOUR STORY TELLING
              </button>
            </div>

            {/* === NAVIGATION ARROWS (Forced Small Size) === */}
            
            {/* Left Arrow */}
            <button 
              onClick={prev} 
              className="absolute top-1/2 -translate-y-1/2 z-50 outline-none bg-transparent border-none p-0 focus:outline-none"
              style={{ left: '-60px' }} 
              aria-label="Previous"
            >
               <img 
                 src="/images/cursor-new.png" 
                 alt="Previous" 
                 style={{ width: '40px', height: '40px' }}
                 className="object-contain rotate-225 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(232,233,56,0.6)]"
               />
            </button>

            {/* Right Arrow */}
            <button 
              onClick={next} 
              className="absolute top-1/2 -translate-y-1/2 z-50 outline-none bg-transparent border-none p-0 focus:outline-none"
              style={{ right: '-60px' }} 
              aria-label="Next"
            >
               <img 
                 src="/images/cursor-new.png" 
                 alt="Next" 
                 style={{ width: '40px', height: '40px' }}
                 className="object-contain rotate-45 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(232,233,56,0.6)]"
               />
            </button>


            {/* 4. Bottom Right Text Description */}
            <div className="absolute bottom-[6%] right-[5%] z-30 text-right">
              <p className="text-[14px] md:text-[16px] leading-tight text-[#e0e0e0] font-light tracking-wide drop-shadow-md">
                visual systems<br/>
                spanning editorial,<br/>
                spatial,<br/>
                digital design.
              </p>
            </div>

        </div>
      </div>
    </section>
  );
}