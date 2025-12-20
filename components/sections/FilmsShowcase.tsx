"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type FilmItem = {
  title: string;
  src: string;
  poster?: string;
};

export default function FilmsShowcase() {
  const brandColor = "#c6376c";
  const tealColor = "#6fe7d3";

  const films: FilmItem[] = useMemo(
    () => [
      { title: "Advertisements", src: "/videos/ads.mp4" },
      { title: "Brand Films", src: "/videos/brand-films.mp4" },
      { title: "Documentaries", src: "/videos/documentaries.mp4" },
      { title: "Short Films", src: "/videos/short-films.mp4" },
    ],
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Keep track of timeouts so we can clear them (prevents "stuck" phase)
  const timeoutsRef = useRef<number[]>([]);
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  // When activeIndex changes, force reload + play from start
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // reset + reload
    try {
      v.currentTime = 0;
    } catch {}
    v.load();

    const p = v.play();
    if (p) p.catch(() => {});
  }, [activeIndex]);

  const requestIndex = (nextIndex: number) => {
    if (nextIndex === activeIndex) return;

    // If user clicks fast, we’ll just restart the transition cleanly
    clearAllTimeouts();

    setPhase("out");

    const t1 = window.setTimeout(() => {
      setActiveIndex(nextIndex);
      setPhase("in");

      const t2 = window.setTimeout(() => {
        setPhase("idle");
      }, 280);

      timeoutsRef.current.push(t2);
    }, 280);

    timeoutsRef.current.push(t1);
  };

  const next = () => requestIndex((activeIndex + 1) % films.length);
  const prev = () => requestIndex((activeIndex - 1 + films.length) % films.length);

  const shapePath = `
    M 120,120
    A 26 26 0 0 0 145,95
    A 26 26 0 0 1 165,70
    A 26 26 0 0 0 190,35
    A 26 26 0 0 1 210,0
    L 780,0
    L 804,0
    A 26 26 0 0 1 830,26
    L 830,40

    A 26 26 0 0 0 855,66
    L 900,65
    L 976,65
    A 26 26 0 0 1 1000,91
    L 1000,530
    A 26 26 0 0 1 974,556
    L 930,555
    L 700,555
    A 28 28 0 0 0 674,600
    L 600,600
    L 200,600
    A 26 26 0 0 1 160,576
    A 26 26 0 0 0 120,552
    A 26 26 0 0 1 80,528
    A 26 26 0 0 0 40,504
    A 26 26 0 0 1 0,480
    L 0,430
    L 0,170
    L 0,146
    A 26 26 0 0 1 26,120
    L 120,120
    Z
  `;

  const active = films[activeIndex];
  const videoOpacity = phase === "out" ? 0 : 1;

  return (
    <section className="relative w-full min-h-screen text-white overflow-hidden flex items-center justify-center font-sans">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black" />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(900px 520px at 55% 45%, rgba(255,255,255,0.06), transparent 60%)",
        }}
      />

      <div className="relative w-[95%] md:w-[90%] lg:w-[80%] xl:w-[70%] max-w-[1200px] flex items-center justify-center z-10">
        <div className="relative w-full aspect-[16/10] md:aspect-[1.8/1]">
          <svg
            viewBox="0 0 1000 600"
            className="w-full h-full drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)] pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <clipPath id="blob-clip" clipPathUnits="userSpaceOnUse">
                <path d={shapePath} />
              </clipPath>

              <radialGradient id="grad1" cx="30%" cy="30%" r="50%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="rgba(111,231,211,0.35)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id="grad2" cx="70%" cy="60%" r="60%">
                <stop offset="0%" stopColor="rgba(198,55,108,0.55)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id="grad3" cx="90%" cy="90%" r="50%">
                <stop offset="0%" stopColor="rgba(255,220,140,0.3)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              <filter id="noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.1" />
                </feComponentTransfer>
              </filter>
            </defs>

            <path d={shapePath} fill="#0a0a0a" />

            <foreignObject x="0" y="0" width="1000" height="600" clipPath="url(#blob-clip)">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  background: "#0a0a0a",
                  overflow: "hidden",
                }}
              >
                {active?.src ? (
                  <video
                    ref={videoRef}
                    src={active.src}
                    poster={active.poster}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                    onCanPlay={() => {
                      const v = videoRef.current;
                      if (!v) return;
                      const p = v.play();
                      if (p) p.catch(() => {});
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      opacity: videoOpacity,
                      transition: "opacity 280ms ease",
                      filter: "contrast(1.08) saturate(1.05)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background:
                        "radial-gradient(800px 520px at 30% 35%, rgba(111,231,211,0.20), transparent 60%), radial-gradient(900px 520px at 65% 62%, rgba(198,55,108,0.28), transparent 62%), radial-gradient(700px 420px at 88% 90%, rgba(255,220,140,0.18), transparent 60%), #0a0a0a",
                      opacity: videoOpacity,
                      transition: "opacity 280ms ease",
                    }}
                  />
                )}

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(900px 560px at 55% 55%, rgba(0,0,0,0.0), rgba(0,0,0,0.55))",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </foreignObject>

            <g clipPath="url(#blob-clip)">
              <rect width="1000" height="600" fill="url(#grad1)" style={{ mixBlendMode: "screen" }} />
              <rect width="1000" height="600" fill="url(#grad2)" style={{ mixBlendMode: "screen" }} />
              <rect width="1000" height="600" fill="url(#grad3)" style={{ mixBlendMode: "screen" }} />
              <rect width="1000" height="600" filter="url(#noise)" style={{ mixBlendMode: "overlay" }} />
            </g>

            <path d={shapePath} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          </svg>

          {/* Top Left Pill */}
          <div className="absolute top-[10%] left-[2.5%] z-30">
            <div className="relative group">
              <div
                className="absolute inset-0 blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-full"
                style={{ background: tealColor }}
              />
              <button
                type="button"
                className="relative w-[260px] h-[48px] px-8 py-3 rounded-full text-base font-bold tracking-[0.25em] text-white transition-all flex items-center justify-end"
                style={{
                  background: "rgba(0, 0, 0, 1)",
                  color: "#fff",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: `3px solid ${tealColor}`,
                  left: "-130px",
                  bottom: "-20px",
                  
                }}
              >
                FILMS
              </button>
            </div>
          </div>

          {/* Bottom Right CTA */}
          <div className="absolute bottom-[6%] right-[3%] z-30">
            <button
              type="button"
                className="relative w-[450px] h-[48px] px-8 py-3 rounded-full text-base font-bold tracking-[0.25em] text-white transition-all flex items-center justify-end"
                style={{
                  background: "rgba(0, 0, 0, 1)",
                  color: "#fff",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: `3px solid ${tealColor}`,
                  right: "-110px",
                  bottom: "-40px",
                  
                }}
            >
              MAKE US A PART OF YOUR STORY TELLING
            </button>
          </div>

          {/* Cursor Arrows */}
          <button
            type="button"
            onClick={prev}
            className="group absolute top-1/2 -translate-y-1/2 z-50 bg-transparent border-none p-0 focus:outline-none"
            style={{ left: "-60px" }}
            aria-label="Previous"
          >
            <img
              src="/images/cursor-new.png"
              alt="Previous"
              style={{ width: "40px", height: "40px" }}
              className="object-contain rotate-225 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(232,233,56,0.6)]"
            />
          </button>

          <button
            type="button"
            onClick={next}
            className="group absolute top-1/2 -translate-y-1/2 z-50 bg-transparent border-none p-0 focus:outline-none"
            style={{ right: "-60px" }}
            aria-label="Next"
          >
            <img
              src="/images/cursor-new.png"
              alt="Next"
              style={{ width: "40px", height: "40px" }}
              className="object-contain rotate-45 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(232,233,56,0.6)]"
            />
          </button>

          {/* Bottom Left Menu */}
          <div
            className="absolute bottom-[2%] left-[1%] z-30 flex flex-col items-start w-[260px] rounded-xl px-3 py-2"
            style={{ left: "-80px",  bottom:"-15px"}}
          >
            <h3
              className="text-[20px] font-normal tracking-[0.1em] mb-2 text-gray-300"
              style={{ textShadow: "0 2px 4px rgba(180, 0, 0, 0.9)" }}
            >
              We work across:
            </h3>

            <div className="flex flex-col w-full gap-1">
              {films.map((f, i) => (
                <button
                  key={f.src}
                  type="button"
                  onClick={() => requestIndex(i)}
                  className="w-full text-left py-1 text-[20px] font-normal tracking-[0.05em] transition-all duration-200 ease-in-out flex items-center gap-2 hover:brightness-225  bg-transparent border-none"
                  style={{
                    color: "#d1d5db",
                    textShadow:
                      i === activeIndex
                        ? `0 0 10px rgba(198, 55, 108, 0.90), 0 0 16px rgba(198, 55, 108, 0.55)`
                        : "0 2px 4px rgba(180, 0, 0, 0.9)",
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
