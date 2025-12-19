"use client";

import React from "react";

export default function Manifesto2() {
  return (
    <section
      aria-label="Manifesto2"
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#eaeaea",
        display: "grid",
        placeItems: "center",
        padding: "120px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          textAlign: "center",
          fontFamily: "var(--font-offbit)",
          fontSize: 36,
          lineHeight: 1.55,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <p style={{ margin: 0 }}>
          <span className="text-white font-bold drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            SLOW DRAG STUDIOS
          </span>{" "}
          IS A FILM AND IMAGE-MAKING STUDIO.
          <br />
          WE WORK ACROSS ADVERTISEMENTS, SHORT FILMS, AND DOCUMENTARIES.
          <br />
          OUR CINEMA RESISTS SPEED AND HONOURS WHAT IS OFTEN UNSEEN.
        </p>
      </div>
    </section>
  );
}