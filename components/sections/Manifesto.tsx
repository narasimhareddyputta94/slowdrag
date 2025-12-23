export default function Manifesto() {
  return (
    <section
      aria-label="Manifesto"
      style={{
        minHeight: "70vh",
        background: "#000",
        color: "#eaeaea",
        display: "grid",
        placeItems: "center",
        padding: 0,
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
          <strong style={{ color: "#ffffff" }}>SLOW DRAG STUDIOS</strong> IS A
          CREATIVE DESIGN AND FILM STUDIO BUILT AGAINST HASTE. OUR WORK RESISTS
          THE ALGORITHMIC URGE TO RUSH, FLATTEN, SIMPLIFY.
          <br />
          WE WORK IN PULSE, NOT TEMPO. IN MEMORY, NOT NOISE. WE MAKE FILMS,
          IMAGES, AND SYSTEMS OF DESIGN THAT STAY LONG AFTER THE SCROLL ENDS.
        </p>
      </div>
    </section>
  );
}