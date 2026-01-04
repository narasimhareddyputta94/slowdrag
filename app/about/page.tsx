"use client";

import Image from "next/image";
import { useEffect } from "react";
import Navbar from "@/components/nav/Navbar";

export default function AboutPage() {
  const brandColor = "#c6376c";
  const showNav = true;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-about-reveal]"));
    if (nodes.length === 0) return;

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      nodes.forEach((el) => el.classList.add("about-reveal--in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).classList.add("about-reveal--in");
          io.unobserve(entry.target);
        }
      },
      { root: null, threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    nodes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

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
  <div className="mb-10 text-center">
    <div className="text-[12px] tracking-[0.38em] text-white/70 uppercase">The Team</div>
    <h2 className="mt-3 text-[28px] sm:text-[34px] tracking-[0.06em] text-white">
      People behind the work
    </h2>
    <p className="mx-auto mt-3 max-w-2xl text-white/70 text-[14px] sm:text-[16px] leading-relaxed">
      Craft, taste, and a little chaos — presented with intention.
    </p>
  </div>

  <div className="grid grid-cols-2 gap-6 md:gap-8">
    {/* Card 1 */}
    <article
      data-about-reveal
      className="team-card about-reveal"
      style={{ transitionDelay: "80ms" }}
      onPointerMove={(e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        el.style.setProperty("--mx", `${x}%`);
        el.style.setProperty("--my", `${y}%`);
      }}
    >
      <div className="team-media">
        <div className="team-mediaFrame">
          <Image
            src="/images/sathakshi.png"
            alt="Shatakshi"
            width={1400}
            height={1400}
            sizes="(max-width: 768px) 92vw, 520px"
            className="team-img"
            priority={false}
          />
        </div>
      </div>

      <div className="team-body">
        <div className="team-nameRow">
          <div className="team-name">Shatakshi</div>
          <div className="team-role">Head of Marketing</div>
        </div>

        <p className="team-bio">
          {`Shatakshi is an equal parts liberal arts scholar and fine arts practitioner. Carries both the lenses of the analytical and the artistic into every frame, blending cultural insight with visual storytelling. Scholar by degree, filmmaker by obsession.`}
        </p>

        <div className="team-footer">
          <span className="team-chip">Strategy</span>
          <span className="team-chip">Culture</span>
          <span className="team-chip">Narrative</span>
        </div>
      </div>
    </article>

    {/* Card 2 */}
    <article
      data-about-reveal
      className="team-card about-reveal"
      style={{ transitionDelay: "180ms" }}
      onPointerMove={(e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        el.style.setProperty("--mx", `${x}%`);
        el.style.setProperty("--my", `${y}%`);
      }}
    >
      <div className="team-media">
        <div className="team-mediaFrame">
          <Image
            src="/images/sujith.png"
            alt="Sujith"
            width={1400}
            height={1400}
            sizes="(max-width: 768px) 92vw, 520px"
            className="team-img"
            priority={false}
          />
        </div>
      </div>

      <div className="team-body">
        <div className="team-nameRow">
          <div className="team-name">Sujith</div>
          <div className="team-role">Head of Creatives</div>
        </div>

        <p className="team-bio">
          {`Sujith turns cameras into portals and stories into worlds. Frames are his playground, light is his language. A cinephile by heart, cinematographer by craft and a complete visionary by design. Snacks disappear faster than his dialogues but his silence says aplenty.`}
        </p>

        <div className="team-footer">
          <span className="team-chip">Direction</span>
          <span className="team-chip">Cinematography</span>
          <span className="team-chip">Taste</span>
        </div>
      </div>
    </article>
  </div>
</section>

        <style>{`
  /* Reveal (upgraded: blur + smoother easing) */
  .about-reveal {
    opacity: 0;
    transform: translateY(18px);
    filter: blur(8px);
    transition:
      opacity 900ms cubic-bezier(0.16, 1, 0.3, 1),
      transform 900ms cubic-bezier(0.16, 1, 0.3, 1),
      filter 900ms cubic-bezier(0.16, 1, 0.3, 1);
    will-change: opacity, transform, filter;
  }
  .about-reveal.about-reveal--in {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }

  /* Team cards */
  .team-card {
    --mx: 50%;
    --my: 35%;
    position: relative;
    border-radius: 28px;
    overflow: hidden;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.10);
    box-shadow:
      0 10px 40px rgba(0,0,0,0.45),
      inset 0 1px 0 rgba(255,255,255,0.06);
    transition:
      transform 350ms cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 350ms cubic-bezier(0.16, 1, 0.3, 1),
      border-color 350ms cubic-bezier(0.16, 1, 0.3, 1);
    transform-style: preserve-3d;
  }

  /* Spotlight that follows pointer */
  .team-card::before {
    content: "";
    position: absolute;
    inset: -2px;
    background:
      radial-gradient(600px circle at var(--mx) var(--my),
        rgba(200,120,255,0.22),
        rgba(120,255,255,0.12),
        rgba(0,0,0,0) 60%);
    opacity: 0;
    transition: opacity 300ms ease;
    pointer-events: none;
  }

  /* Subtle animated “sheen” edge */
  .team-card::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(120deg,
        rgba(255,255,255,0) 0%,
        rgba(255,255,255,0.08) 35%,
        rgba(255,255,255,0) 70%);
    transform: translateX(-120%);
    opacity: 0;
    pointer-events: none;
  }

  .team-card:hover {
    transform: translateY(-6px) rotateX(1.2deg);
    border-color: rgba(255,255,255,0.18);
    box-shadow:
      0 18px 70px rgba(0,0,0,0.6),
      0 0 0 1px rgba(198,55,108,0.20),
      inset 0 1px 0 rgba(255,255,255,0.08);
  }
  .team-card:hover::before { opacity: 1; }
  .team-card:hover::after {
    opacity: 1;
    animation: teamSheen 900ms cubic-bezier(0.16, 1, 0.3, 1) 1;
  }

  @keyframes teamSheen {
    0% { transform: translateX(-120%); }
    100% { transform: translateX(120%); }
  }

  .team-media {
    padding: 18px 18px 0 18px;
  }

  .team-mediaFrame {
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    background: rgba(255,255,255,0.04);
    max-width: clamp(200px, 22vw, 260px);
    margin: 0 auto;
  }

  /* Image feels more “editorial”: slightly muted until hover */
  .team-img {
    width: 100%;
    height: auto;
    object-fit: cover;
    transform: scale(1.02);
    filter: grayscale(15%) contrast(0.95) brightness(0.92);
    transition:
      transform 500ms cubic-bezier(0.16, 1, 0.3, 1),
      filter 500ms cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform, filter;
  }
  .team-card:hover .team-img {
    transform: scale(1.06);
    filter: grayscale(0%) contrast(1.05) brightness(1.02);
  }

  /* Tiny noise overlay for premium texture */
  .team-mediaFrame::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.12'/%3E%3C/svg%3E");
    opacity: 0.18;
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  .team-body {
    padding: 16px 18px 18px 18px;
    text-align: center;
  }

  .team-nameRow {
    margin-top: 8px;
    display: grid;
    gap: 6px;
    justify-items: center;
  }

  .team-name {
    font-size: 24px;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.96);
    position: relative;
    display: inline-block;
    padding-bottom: 8px;
  }

  /* Underline anim */
  .team-name::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 44px;
    height: 2px;
    transform: translateX(-50%) scaleX(0.55);
    transform-origin: center;
    background: linear-gradient(90deg,
      rgba(120,255,255,0.0),
      rgba(120,255,255,0.9),
      rgba(200,120,255,0.9),
      rgba(200,120,255,0.0));
    opacity: 0.65;
    transition: transform 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms ease;
  }
  .team-card:hover .team-name::after {
    transform: translateX(-50%) scaleX(1);
    opacity: 1;
  }

  .team-role {
    font-size: 12px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.70);
  }

  .team-bio {
    margin: 14px auto 0 auto;
    max-width: 34rem;
    color: rgba(255,255,255,0.86);
    line-height: 1.75;
    font-size: clamp(14px, 1.05vw, 18px);
  }

  .team-footer {
    margin-top: 16px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .team-chip {
    font-size: 11px;
    letter-spacing: 0.20em;
    text-transform: uppercase;
    padding: 10px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.75);
    transition:
      transform 250ms cubic-bezier(0.16, 1, 0.3, 1),
      background 250ms ease,
      border-color 250ms ease;
  }
  .team-card:hover .team-chip {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.16);
  }

  @media (prefers-reduced-motion: reduce) {
    .about-reveal {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
      transition: none !important;
    }
    .team-card,
    .team-img,
    .team-name::after,
    .team-card::before,
    .team-card::after {
      transition: none !important;
      animation: none !important;
    }
  }
`}</style>

      </section>
    </main>
  );
}