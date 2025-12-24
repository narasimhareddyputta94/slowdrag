"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type DesignItem = {
  title: string;
  src: string;
};

type Size = { width: number; height: number };

type Row = {
  height: number;
  items: Array<{ src: string; title: string; width: number }>;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function DesignsShowcase() {
  const designs: DesignItem[] = useMemo(
    () => [
      { title: "image1", src: "/images/branding/image1.jpg" },
      { title: "image2", src: "/images/branding/image2.gif" },
      { title: "image3", src: "/images/branding/image3.jpg" },
      { title: "image4", src: "/images/branding/image4.jpg" },
      { title: "image5", src: "/images/branding/image5.jpg" },
      { title: "image6", src: "/images/branding/image6.jpg" },
      { title: "image7", src: "/images/branding/image7.jpg" },
      { title: "image8", src: "/images/branding/image8.jpg" },
      { title: "image9", src: "/images/branding/image9.JPG" },
      { title: "image12", src: "/images/branding/image12.jpg" },
      { title: "image13", src: "/images/branding/image13.jpg" },
      { title: "image14", src: "/images/branding/image14.jpg" },
      { title: "image15", src: "/images/branding/image15.jpg" },
      { title: "image16", src: "/images/branding/image16.jpg" },
      { title: "image17", src: "/images/branding/image17.jpg" },
      { title: "image18", src: "/images/branding/image18.jpg" },
      { title: "image19", src: "/images/branding/image19.jpg" },
      { title: "image20", src: "/images/branding/image20.jpg" },
      { title: "image21", src: "/images/branding/image21.jpg" },
      { title: "image22", src: "/images/branding/image22.jpg" },
      { title: "image23", src: "/images/branding/image23.jpg" },
      { title: "image24", src: "/images/branding/image24.jpg" },
      { title: "image25", src: "/images/branding/image25.jpg" },
      { title: "image26", src: "/images/branding/image26.jpg" },
      { title: "image27", src: "/images/branding/image27.jpg" },
      { title: "image28", src: "/images/branding/image28.jpg" },
    ],
    []
  );

  // Keep the existing arrows: rotate the gallery order.
  const [offset, setOffset] = useState(0);
  const next = () => setOffset((i) => (i + 1) % designs.length);
  const prev = () => setOffset((i) => (i - 1 + designs.length) % designs.length);

  const orderedDesigns = useMemo(() => {
    if (designs.length === 0) return designs;
    const normalized = ((offset % designs.length) + designs.length) % designs.length;
    return [...designs.slice(normalized), ...designs.slice(0, normalized)];
  }, [designs, offset]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<Size>({ width: 0, height: 0 });
  const [aspectBySrc, setAspectBySrc] = useState<Record<string, number>>({});

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const entries = await Promise.all(
        orderedDesigns.map(
          (d) =>
            new Promise<[string, number]>((resolve) => {
              const img = new Image();
              img.decoding = "async";
              img.onload = () => {
                const w = img.naturalWidth || 1;
                const h = img.naturalHeight || 1;
                resolve([d.src, w / h]);
              };
              img.onerror = () => resolve([d.src, 1]);
              img.src = d.src;
            })
        )
      );

      if (cancelled) return;
      setAspectBySrc((prev) => {
        const nextMap = { ...prev };
        for (const [src, ratio] of entries) nextMap[src] = ratio;
        return nextMap;
      });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [orderedDesigns]);

  const rows: Row[] = useMemo(() => {
    const width = containerSize.width;
    const height = containerSize.height;
    if (!width || !height || orderedDesigns.length === 0) return [];

    const gap = clamp(Math.round(width / 90), 8, 14);
    const padding = clamp(Math.round(width / 45), 10, 26);
    const innerWidth = Math.max(0, width - padding * 2);
    const innerHeight = Math.max(0, height - padding * 2);

    const targetRowHeight = clamp(innerHeight / 3.2, 86, 160);
    const minRowHeight = clamp(innerHeight / 5.0, 70, 120);
    const maxRowHeight = clamp(innerHeight / 2.6, 110, 220);

    const result: Row[] = [];
    let rowItems: Array<{ src: string; title: string; ratio: number }> = [];
    let ratioSum = 0;
    let usedHeight = 0;

    const flushRow = (isLastRow: boolean) => {
      if (rowItems.length === 0) return;
      const gaps = gap * Math.max(0, rowItems.length - 1);
      const available = Math.max(1, innerWidth - gaps);

      // Fit row to width; last row can be closer to target height.
      const fittedHeight = available / Math.max(0.001, ratioSum);
      const finalHeight = isLastRow
        ? clamp(fittedHeight, minRowHeight, targetRowHeight)
        : clamp(fittedHeight, minRowHeight, maxRowHeight);

      const nextUsed = usedHeight + finalHeight + (result.length ? gap : 0);
      if (nextUsed > innerHeight) {
        // No space for this row; stop without clipping.
        rowItems = [];
        ratioSum = 0;
        return;
      }

      const items = rowItems.map((it) => ({
        src: it.src,
        title: it.title,
        width: Math.max(1, finalHeight * it.ratio),
      }));

      result.push({ height: finalHeight, items });
      usedHeight = nextUsed;
      rowItems = [];
      ratioSum = 0;
    };

    for (let i = 0; i < orderedDesigns.length; i++) {
      const d = orderedDesigns[i];
      const ratio = aspectBySrc[d.src] ?? 1;
      rowItems.push({ src: d.src, title: d.title, ratio });
      ratioSum += ratio;

      const gaps = gap * Math.max(0, rowItems.length - 1);
      const rowWidthAtTarget = ratioSum * targetRowHeight + gaps;
      if (rowWidthAtTarget >= innerWidth) {
        flushRow(false);
        if (usedHeight >= innerHeight - minRowHeight) break;
      }
    }

    flushRow(true);
    return result;
  }, [aspectBySrc, containerSize.height, containerSize.width, orderedDesigns]);

  const shapePath = `
    M 25,0
    L 600,0
    Q 625,0 625,25
    Q 625,50 650,50
    Q 675,50 675,75
    Q 675,100 700,100
    L 940,100
    Q 965,100 965,125
    L 965,300
    L 980,300
    L 1000,300
    L 1000,350
    L 1000,380
    L 1000,430
    L 1000,455
    L 1000,480
    L 800,480
    L 800,540
    L 800,575
    Q 800,600 775,600
    L 600,600
    Q 700,600 675,600
    L 480,600
    L 400,600
    Q 375,600 375,575
    L 375,550
    Q 375,525 350,525
    L 150,525
    L 125,525
    L 100,525
    L 75,525
    L 10,525
    Q 0,525 0,515
    L 0,300
    Q 0,280 25,280
    L 80,280
    Q 100,280 100,255
    Q 100,230 75,230
    Q 50,230 50,200
    Q 50,170 25,170
    Q 0,170 0,150
    L 0,150
    L 0,25
    Q 0,0 25,0
    Z
  `;

  return (
    <section className="relative w-full min-h-screen bg-black text-white overflow-hidden flex items-center justify-center font-sans">
      <div className="relative w-[96%] md:w-[94%] lg:w-[90%] xl:w-[86%] max-w-[1500px] flex items-center justify-center">
        <div className="relative w-full aspect-[2.05/1] md:aspect-[2.0/1] isolation-isolate">
          {/* SVG layer */}
          <svg
            viewBox="0 0 1000 600"
            className="w-full h-full drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative z-10 pointer-events-none"
            preserveAspectRatio="none"
          >
            <defs>
              <clipPath id="blob-mask-design" clipPathUnits="userSpaceOnUse">
                <path d={shapePath} />
              </clipPath>

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
              <path d={shapePath} fill="url(#warm1)" style={{ mixBlendMode: "screen" }} />
              <path d={shapePath} fill="url(#warm2)" style={{ mixBlendMode: "screen" }} />
              <path d={shapePath} fill="url(#warm3)" style={{ mixBlendMode: "screen" }} />

              <foreignObject x="0" y="0" width="1000" height="600" clipPath="url(#blob-mask-design)">
                <div
                  ref={containerRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      padding: clamp(Math.round(containerSize.width / 45), 10, 26),
                      gap: clamp(Math.round(containerSize.width / 90), 8, 14),
                    }}
                  >
                    {rows.map((row, rowIndex) => (
                      <div
                        key={`row-${rowIndex}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          height: row.height,
                          gap: clamp(Math.round(containerSize.width / 90), 8, 14),
                        }}
                      >
                        {row.items.map((it) => (
                          <div
                            key={it.src}
                            style={{
                              width: it.width,
                              height: row.height,
                              flex: "0 0 auto",
                              background: "rgba(0,0,0,0.35)",
                              borderRadius: 10,
                              overflow: "hidden",
                            }}
                          >
                            <img
                              src={it.src}
                              alt={it.title}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                objectPosition: "center",
                                display: "block",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ))}

                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        mixBlendMode: "overlay",
                        opacity: 0.45,
                        background:
                          "radial-gradient(800px 520px at 30% 35%, rgba(111,231,211,0.10), transparent 60%), radial-gradient(900px 520px at 65% 62%, rgba(198,55,108,0.12), transparent 62%), radial-gradient(700px 420px at 88% 90%, rgba(255,220,140,0.08), transparent 60%)",
                      }}
                    />
                  </div>
                </div>
              </foreignObject>

              <rect
                width="100%"
                height="100%"
                filter="url(#noise-design)"
                style={{ mixBlendMode: "overlay" }}
                clipPath="url(#blob-mask-design)"
              />
            </g>

            <path
              d={shapePath}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
            />
          </svg>

          {/* === HUD INTERFACE === */}

          {/* Top Right Pill ✅ ONLY CHANGE: move TEXT to right with margin-left */}
          <div className="absolute top-[2%] right-[4%] z-[40] mix-blend-normal">
            <button
              className="
                w-[400px] md:w-[520px] lg:w-[620px]
                h-[66px] md:h-[78px]
                bg-transparent
                border border-[#6fe7d3]
                rounded-full
                text-[24px] md:text-[44px]
                font-extrabold
                tracking-[0.20em]
                text-white
                opacity-100
                drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]
                shadow-[0_0_20px_rgba(0,0,0,0.5)]
                uppercase
                select-none
                flex items-center justify-start
                pointer-events-auto
              "
              style={{ color: "#dba9a9ff" }}
            >
              <span className="ml-[40px] md:ml-[110px] lg:ml-[130px]">
                DESIGN
              </span>
            </button>
          </div>

          {/* Bottom Left CTA */}
          <div className="absolute bottom-[3%] left-[1.0%] z-[80] mix-blend-normal">
            <button
              className="
                w-[500px] md:w-[520px] lg:w-[620px]
                h-[56px] md:h-[66px]
                bg-transparent
                border border-[#6fe7d3]
                rounded-full
                text-[13px] md:text-[15px]
                font-extrabold
                tracking-[0.22em]
                text-white
                opacity-100
                drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]
                shadow-[0_0_20px_rgba(0,0,0,0.5)]
                flex items-center justify-center
                select-none
                pointer-events-auto
              "
              style={{ color: "#ffffff" }}
            >
              MAKE US A PART OF YOUR STORY TELLING
            </button>
          </div>

          {/* Left Arrow */}
          <button
            onClick={prev}
            className="
              absolute top-1/2 -translate-y-1/2 -translate-y-[100px] z-[10]
              outline-none bg-transparent border-none p-0 focus:outline-none
              left-[-10px] md:left-[-120px] lg:left-[-160px] xl:left-[-190px]
              mix-blend-normal
              pointer-events-auto
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
              absolute top-1/2 -translate-y-1/2 -translate-y-[100px] z-[10]
              outline-none bg-transparent border-none p-0 focus:outline-none
              right-[-8px] md:right-[-120px] lg:right-[-160px] xl:right-[-190px]
              mix-blend-normal
              pointer-events-auto
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
          <div className="absolute bottom-[1%] right-[5%] z-[10] text-right mix-blend-normal">
            <p className="text-[22px] md:text-[16px] leading-tight text-[#e0e0e0] font-light tracking-wide drop-shadow-md">
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
