"use client";

import React from "react";

type ManifestoFlowWebGLProps = {
  brandColor?: string;
};

const MANIFESTO_LINES = [
  "SLOW DRAG STUDIOS IS A CREATIVE DESIGN",
  "AND FILM STUDIO BUILT AGAINST HASTE. OUR",
  "WORK RESISTS THE ALGORITHMIC URGE TO",
  "RUSH, FLATTEN, SIMPLIFY.",
  "WE WORK IN PULSE, NOT TEMPO. IN MEMORY,",
  "NOT NOISE. WE MAKE FILMS, IMAGES, AND",
  "SYSTEMS OF DESIGN THAT STAY LONG AFTER",
  "THE SCROLL ENDS.",
];

export default function ManifestoFlowWebGL({
  brandColor = "#c6376c",
}: ManifestoFlowWebGLProps) {
  return (
    <section
      aria-label="Manifesto"
      style={{
        minHeight: "70vh",
        background: "#000",
        display: "grid",
        placeItems: "center",
        padding: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          padding: "0 20px",
          textAlign: "center",
          textTransform: "uppercase",
          fontFamily: "var(--font-offbit-101)",
          fontWeight: 700,
          lineHeight: 1.55,
          letterSpacing: "0.11em",
          fontSize: "clamp(14px, 3.2vw, 28px)",
          color: brandColor,
        }}
      >
        {MANIFESTO_LINES.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </section>
  );
}