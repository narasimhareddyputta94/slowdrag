import React from "react";

export default function Manifesto2() {
  return (
    <section
      aria-label="Manifesto2"
      className="manifesto2"
      style={{
        minHeight: "70vh",
        background: "transparent",
        color: "#eaeaea",
        display: "grid",
        placeItems: "center",
        padding: 0,
      }}
    >
      <div
        className="manifesto2__inner"
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

      <style>{`
        @media (max-width: 767px) {
          .manifesto2 {
            min-height: 60svh !important;
            padding: 0 24px !important;
          }

          .manifesto2__inner {
            max-width: 520px !important;
            font-size: 20px !important;
            line-height: 1.7 !important;
            letter-spacing: 0.06em !important;
            font-weight: 500 !important;
            text-wrap: balance;
          }
        }
      `}</style>
    </section>
  );
}