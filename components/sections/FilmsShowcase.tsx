"use client";

import React, { useMemo, useState } from "react";

type FilmItem = {
  title: string;
  src: string;
};

export default function FilmsShowcase() {
  const films: FilmItem[] = useMemo(
    () => [
      { title: "Short Films", src: "" },
      { title: "Documentaries", src: "" },
      { title: "Brand Films", src: "" },
      { title: "Advertisements", src: "" },
    ],
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);

  const next = () => setActiveIndex((i) => (i + 1) % films.length);
  const prev = () => setActiveIndex((i) => (i - 1 + films.length) % films.length);

  // This path creates the "Blob" shape with the specific notches
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
                <clipPath id="blob-mask" clipPathUnits="objectBoundingBox">
                  <path transform="scale(0.001, 0.00166)" d={shapePath} />
                </clipPath>
              </defs>
            </svg>

            {/* === THE SHAPE LAYER === */}
            <svg 
              viewBox="0 0 1000 600" 
              className="w-full h-full drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
              preserveAspectRatio="none"
            >
              <defs>
                <radialGradient id="grad1" cx="30%" cy="30%" r="50%" fx="30%" fy="30%">
                  <stop offset="0%" stopColor="rgba(111,231,211,0.4)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <radialGradient id="grad2" cx="70%" cy="60%" r="60%">
                  <stop offset="0%" stopColor="rgba(198,55,108,0.6)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                 <radialGradient id="grad3" cx="90%" cy="90%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,220,140,0.3)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>

                <filter id="noise">
                  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
                  <feColorMatrix type="saturate" values="0" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.1" /> 
                  </feComponentTransfer>
                </filter>
              </defs>

              <g>
                <path d={shapePath} fill="#0a0a0a" />
                <path d={shapePath} fill="url(#grad1)" style={{ mixBlendMode: 'screen' }} />
                <path d={shapePath} fill="url(#grad2)" style={{ mixBlendMode: 'screen' }} />
                <path d={shapePath} fill="url(#grad3)" style={{ mixBlendMode: 'screen' }} />
                
                {/* Grain Texture */}
                <rect width="100%" height="100%" filter="url(#noise)" style={{ mixBlendMode: 'overlay' }} clipPath="url(#blob-mask)" />
              </g>

              {/* The Border Stroke */}
              <path d={shapePath} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            </svg>

            {/* === HUD INTERFACE === */}
            
            {/* 1. Top Left Pill */}
            <div className="absolute top-[8%] left-[2.5%] z-30">
               <div className="relative group">
                 <div className="absolute inset-0 bg-[#6fe7d3] blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                 <button className="relative px-8 py-2 bg-black/50 border border-[#6fe7d3] rounded-full backdrop-blur-md text-sm font-bold tracking-[0.25em] text-white hover:bg-[#6fe7d3] hover:text-black transition-all">
                    FILMS
                 </button>
               </div>
            </div>

            {/* 2. Bottom Right CTA */}
            <div className="absolute bottom-[6%] right-[3%] z-30">
              <button className="px-8 py-3 bg-black/40 border border-[#6fe7d3] rounded-full backdrop-blur-md text-[10px] md:text-xs font-bold tracking-[0.2em] text-white hover:bg-[#6fe7d3] hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                MAKE US A PART OF YOUR STORY TELLING
              </button>
            </div>

            {/* === CUSTOM CURSOR NAVIGATION ARROWS === */}
            
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
                 // FORCED SIZE via inline style to fix issue
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
                 // FORCED SIZE via inline style to fix issue
                 style={{ width: '40px', height: '40px' }}
                 className="object-contain rotate-45 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(232,233,56,0.6)]"
               />
            </button>


            {/* 4. Bottom Left Menu */}
            <div className="absolute bottom-[2%] left-[1%] z-30 flex flex-col items-start w-[240px]">
              <h3 
                className="text-[14px] font-normal tracking-[0.1em] mb-2 text-gray-300"
                style={{
                    textShadow: '0 2px 4px rgba(180, 0, 0, 0.9)'
                }}
              >
                We work across:
              </h3>
              
              <div className="flex flex-col w-full gap-1">
                {films.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`
                      w-full text-left py-1
                      text-[14px] font-normal tracking-[0.05em]
                      transition-all duration-200 ease-in-out
                      flex items-center gap-2
                      hover:brightness-125
                      bg-transparent border-none
                    `}
                    style={{
                        color: '#d1d5db', 
                        textShadow: i === activeIndex 
                            ? '0 0 8px rgba(220, 38, 38, 1), 0 0 15px rgba(220, 38, 38, 0.8)' 
                            : '0 2px 4px rgba(180, 0, 0, 0.9)'
                    }}
                  >
                    <span className="opacity-80">—</span>
                    {f.title}
                  </button>
                ))}
              </div>
            </div>

        </div>
      </div>
    </section>
  );
}