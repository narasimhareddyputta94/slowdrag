"use client";

import React from "react";
import Link from "next/link";

// ✅ SETTING: Icon color set to Black
const ICON = "#000000"; 

/* swap these with your real URLs */
const LINKS = {
  instagram: "#",
  x: "#",
  facebook: "#",
  contact: "/contact",
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
      // Tile Size: h-16 w-16 (64px)
      className="inline-flex h-16 w-16 items-center justify-center rounded-[12px] bg-white shadow-[0_1px_0_rgba(0,0,0,0.18)] transition hover:-translate-y-[1px] active:translate-y-0"
      style={{ 
        WebkitTapHighlightColor: "transparent",
        backgroundColor: "white" 
      }}
    >
      {children}
    </a>
  );
}

function Instagram() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: '36px', height: '36px', display: 'block' }}>
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
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: '36px', height: '36px', display: 'block' }}>
      <path d="M6 18L18 6" stroke={ICON} strokeWidth="2" strokeLinecap="round"/>
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
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: '36px', height: '36px', display: 'block' }}>
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
      className="relative w-full text-white"
      style={{
        // Match navbar brand color
        backgroundColor: "#c6376c",
        fontFamily: "var(--font-offbit)",
        textShadow: "0 2px 12px rgba(0,0,0,0.85)",
      }}
    >
      <div className="relative z-10 mx-auto max-w-[1400px] px-10 md:px-16">
        <div className="overflow-x-auto">
          <div className="grid min-w-[1100px] grid-cols-3 py-14 md:py-16">
            {/* BOX 1 */}
            <div className="relative flex min-h-[320px] flex-col items-start justify-between pr-14">
              <div className="w-[620px] max-w-full">
                <img
                  src="/images/fulllogo.png"
                  alt="Slow Drag Studio"
                  className="w-[82%] select-none object-contain"
                  draggable={false}
                />
              </div>

              {/* ✅ MODIFIED BUTTON */}
              <Link
                href={LINKS.contact}
                aria-label="Contact us"
                className="mb-12 inline-flex items-center justify-center rounded-full no-underline transition hover:bg-black/30 hover:backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black/60"
                style={{
                  background: "transparent",
                  border: "2px solid white",
                  borderRadius: 999,
                  padding: "10px 18px",
                  color: "#fff",
                  fontFamily: "var(--font-offbit), monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  fontSize: "clamp(14px, 1.2vw, 18px)",
                  lineHeight: 1,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                CONTACT US
              </Link>
            </div>

            {/* BOX 2 */}
            <div className="flex min-h-[320px] items-center justify-center px-14">
              <div className="text-center">
                <div className="text-[16px] tracking-[0.34em]">SOCIALS</div>
                <div className="mx-auto mt-2 h-[3px] w-[62px] bg-white" />

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
            <div className="flex min-h-[320px] flex-col pl-14" style={{ padding: "60px 0" }}>
              <div className="ml-auto text-right text-[26px] leading-[1.55]">
                <div>Slow Drag Studios makes images that stay.</div>
                <div>They bend time.</div>
                <div>They hold memory.</div>
                <div>They refuse to disappear.</div>
              </div>

              <div className="mt-10 flex w-full justify-center" style={{ padding: "30px 0" }}>
                <div className="text-center">
                  <div className="text-[12px] tracking-[0.34em]">CONTACT DEETS</div>
                  <div className="mx-auto mt-2 h-[3px] w-[122px] bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}