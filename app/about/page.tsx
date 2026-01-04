"use client";

import Image from "next/image";
import Navbar from "@/components/nav/Navbar";

export default function AboutPage() {
  const brandColor = "#c6376c";
  const showNav = true;

  // Updated path: Increased the starting X values to pull the left side inward
  const contactShapePath = `
M 420.00,170.00
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
L 420.00,315.00
Z
`;

  return (
    <main className="min-h-screen w-full bg-[#0b0b0b] text-white">
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
        About Us — Slow Drag Studios
      </h1>
      <Navbar
        logoSrc="/images/logo.png"
        logoAltSrc="/images/fulllogo.png"
        useAltLogo={true}
        show={showNav}
        slideOnHide={false}
        brandColor={brandColor}
      />

      <section className="w-full pt-0 pb-14 pl-0 pr-0">
        <div className="relative w-full overflow-visible h-[260px] md:h-[600px]">
          <div className="absolute top-0 left-0 w-full overflow-visible">
            <svg
              viewBox="0 0 1400 600"
              className="block h-auto w-[200vw] max-w-none -translate-x-[36%] -translate-y-[48%]"
              preserveAspectRatio="none"
            >
              <defs>
                <clipPath id="aboutClip">
                  <path d={contactShapePath} transform="translate(0 600) scale(1 -1)" />
                </clipPath>

                <radialGradient id="aboutGlow" cx="40%" cy="25%" r="70%">
                  <stop offset="0%" stopColor="rgba(120,255,255,0.30)" />
                  <stop offset="40%" stopColor="rgba(200,120,255,0.22)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.0)" />
                </radialGradient>

                <linearGradient id="aboutBG" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0d1a2a" />
                  <stop offset="40%" stopColor="#3a2a70" />
                  <stop offset="100%" stopColor="#1a0f22" />
                </linearGradient>
              </defs>

              <g clipPath="url(#aboutClip)">
                <rect x="0" y="0" width="1400" height="600" fill="url(#aboutBG)" />
                <circle cx="180" cy="90" r="170" fill="rgba(120,255,255,0.30)" />
                <circle cx="520" cy="60" r="220" fill="rgba(150,90,255,0.25)" />
                <circle cx="760" cy="170" r="260" fill="rgba(0,255,220,0.18)" />
                <rect x="0" y="0" width="1400" height="600" fill="url(#aboutGlow)" />
                <rect x="0" y="0" width="1400" height="600" fill="rgba(0,0,0,0.35)" />
              </g>

              <text
                x="1070"
                y="345"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize="24"
                fontWeight="700"
                style={{ letterSpacing: "1px", fontFamily: "var(--font-offbit)" }}
              >
                ABOUT US
              </text>
            </svg>
          </div>
        </div>

        <div
          className="mx-auto mt-6 max-w-7xl px-6 py-16 text-center sm:px-10 sm:py-20 space-y-12"
          style={{ fontFamily: "var(--font-offbit)" }}
        >
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

        {/* Team */}
        <section
          className="mx-auto max-w-7xl px-6 pb-16 sm:px-10 sm:pb-20"
          style={{ fontFamily: "var(--font-offbit)" }}
          aria-label="Team"
        >
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <article className="w-full text-center flex flex-col items-center">
              <div className="w-full max-w-[18rem] sm:max-w-[20rem] md:max-w-[22rem] overflow-hidden rounded-[24px]">
                <Image
                  src="/images/sathakshi.png"
                  alt="Shatakshi"
                  width={1200}
                  height={1200}
                  sizes="(max-width: 768px) 92vw, 520px"
                  className="h-auto w-full object-cover"
                  priority={false}
                />
              </div>
              <div className="mt-3 space-y-2 max-w-[34rem]">
                <div className="text-[24px] tracking-[0.08em] text-white">Shatakshi</div>
                <div className="text-[12px] tracking-[0.28em] text-white/80 uppercase">Head of Marketing</div>
                <p
                  className="text-white/90 leading-relaxed"
                  style={{ whiteSpace: "pre-line", fontSize: "clamp(16px, 1.4vw, 20px)" }}
                >
                  {`Shatakshi is an
equal parts liberal arts
scholar and fine arts
practitioner. Carries
both the lenses of the
analytical and the
artistic into every
frame, blending
cultural insight with
visual storytelling.
Scholar by degree,
filmmaker by
obsession.`}
                </p>
              </div>
            </article>

            <article className="w-full text-center flex flex-col items-center">
              <div className="w-full max-w-[18rem] sm:max-w-[20rem] md:max-w-[22rem] overflow-hidden rounded-[24px]">
                <Image
                  src="/images/sujith.png"
                  alt="Sujith"
                  width={1200}
                  height={1200}
                  sizes="(max-width: 768px) 92vw, 520px"
                  className="h-auto w-full object-cover"
                  priority={false}
                />
              </div>
              <div className="mt-3 space-y-2 max-w-[34rem]">
                <div className="text-[24px] tracking-[0.08em] text-white">Sujith</div>
                <div className="text-[12px] tracking-[0.28em] text-white/80 uppercase">Head of Creatives</div>
                <p
                  className="text-white/90 leading-relaxed"
                  style={{ whiteSpace: "pre-line", fontSize: "clamp(16px, 1.4vw, 20px)" }}
                >
                  {`Sujith turns cameras
into portals and
stories into worlds.
Frames are his
playground, light is
his language. A
cinephile by heart,
cinematographer by
craft and a complete
visionary by design.
Snacks disappear
faster than his
dialogues but his
silence says aplenty.`}
                </p>
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}