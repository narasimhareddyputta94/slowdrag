"use client";

import React from "react";

const ICON = "#FFFFFF"; // ✅ make icons white

/* swap these with your real URLs */
const LINKS = {
  instagram: "#",
  x: "#",
  facebook: "#",
  contact: "#",
};

function Tile({
  children,
  label,
  href,
}: {
  children: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] shadow-[0_1px_0_rgba(0,0,0,0.18)] transition hover:-translate-y-[1px] active:translate-y-0"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {children}
    </a>
  );
}

function Instagram() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="block h-6 w-6">
      <rect
        x="3.2"
        y="3.2"
        width="17.6"
        height="17.6"
        rx="4.2"
        fill="none"
        stroke={ICON}
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4.1" fill="none" stroke={ICON} strokeWidth="1.8" />
      <circle cx="17.35" cy="6.85" r="1.1" fill={ICON} />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="block h-6 w-6">
      <path d="M6 18L18 6" stroke={ICON} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 6h5l5 6.8V18h-5L8 11.2V6Z"
        fill="none"
        stroke={ICON}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Facebook() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="block h-6 w-6">
      <path
        d="M14 8.7V7.1c0-1 .8-1.8 1.8-1.8h1.9V2.8h-2.5c-2.6 0-4.7 2.1-4.7 4.7v1.2H8.6v2.7h1.9V21h3v-9.6h2.8l.6-2.7H13.5Z"
        fill={ICON}
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer
      className="w-full text-white"
      style={{ backgroundColor: "#128277", fontFamily: "var(--font-offbit)", padding: "20px 0" }}
    >
      <div className="mx-auto max-w-[1400px] px-10 md:px-16">
        <div className="overflow-x-auto">
          <div className="grid min-w-[1100px] grid-cols-3 py-20 md:py-24">
            {/* BOX 1 */}
            <div className="relative flex min-h-[420px] flex-col items-start justify-between pr-14">
              <div className="w-[620px] max-w-full">
                <img
                  src="/images/fulllogo.png"
                  alt="Slow Drag Studio"
                  className="w-[82%] select-none object-contain"
                  draggable={false}
                />
              </div>

              <a
                href={LINKS.contact}
                className="inline-flex items-center justify-center rounded-full border border-black/70 px-8 py-3 text-[16px] tracking-[0.28em] text-[#071f1e] transition hover:bg-black/10" 
              >
                CONTACT&nbsp;US
              </a>
            </div>

            {/* BOX 2 */}
            <div className="flex min-h-[420px] items-center justify-center px-14">
              <div className="text-center">
                <div className="text-[12px] tracking-[0.34em]">SOCIALS</div>
                <div className="mx-auto mt-2 h-[2px] w-[62px] bg-white/90" />

                <div className="mt-6 flex items-center justify-center gap-4">
                  <Tile label="Instagram" href={LINKS.instagram}>
                    <Instagram />
                  </Tile>
                  <Tile label="X" href={LINKS.x}>
                    <XIcon />
                  </Tile>
                  <Tile label="Facebook" href={LINKS.facebook}>
                    <Facebook />
                  </Tile>
                </div>
              </div>
            </div>

            {/* BOX 3 */}
            <div className="flex min-h-[420px] flex-col pl-14" style={{ padding: "100px 0" }}>
              <div className="ml-auto text-right text-[26px] leading-[1.55]">
                <div>Slow Drag Studios makes images that stay.</div>
                <div>They bend time.</div>
                <div>They hold memory.</div>
                <div>They refuse to disappear.</div>
              </div>

              <div className="mt-20 flex w-full justify-center" style={{ padding: "60px 0" }}>
                <div className="text-center">
                  <div className="text-[12px] tracking-[0.34em]">CONTACT DEETS</div>
                  <div className="mx-auto mt-2 h-[2px] w-[122px] bg-white/90" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
