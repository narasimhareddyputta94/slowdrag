import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/footer/Footer";

export default function ContactPage() {
  const brandColor = "#c6376c";
  const brandTeal = "#128277";
  const notchWaveD = makeNotchWavePath(7, 11);

  return (
    <main style={{ background: "#000", color: "#fff" }}>
      <Navbar
        logoSrc="/images/logo.png"
        logoAltSrc="/images/fulllogo.png"
        useAltLogo={true}
        show={true}
        brandColor={brandColor}
      />

      <section
        style={{
          minHeight: "100vh",
          paddingTop: 140, // make room for fixed navbar
          paddingBottom: 10,
          paddingInlineStart: 120,
          paddingRight: 220,
        }}
      >
        <div className="mx-auto max-w-[1400px] px-10 md:px-16">
          <div className="grid gap-10 lg:gap-16 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Left: form card */}
            <div
              style={{
                position: "relative",
                minHeight: "clamp(520px, 62vh, 680px)",
                borderRadius: 44,
                padding: 34,
                paddingLeft: 120,
                paddingBottom: 80,
                display: "flex",
                flexDirection: "column",
                color: "#0b0b0b",
                // Notch sizing
                // - Top notch stays as-is
                // - Left notch reduced (shallower) per request
                ...( {
                  "--notchTop": "clamp(280px, 44vh, 360px)",
                  "--notchLeft": "clamp(200px, 32vh, 270px)",
                  // Extra shift for the top-right wavy cut
                  "--rightCutShift": "clamp(170px, 18vh, 240px)",
                } as React.CSSProperties ),
                background:
                  `radial-gradient(1200px 600px at 10% 95%, ${brandTeal} 0%, rgba(18,130,119,0.0) 55%), ` +
                  `radial-gradient(900px 520px at 70% 40%, ${brandColor} 0%, rgba(198,55,108,0.0) 62%), ` +
                  `linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 55%, rgba(0,0,0,0.0) 100%)`,
                boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.65)",
                overflow: "hidden",
                fontFamily: "var(--font-offbit)",
              }}
            >
              {/* Curved top-left cut */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "var(--notchTop)",
                  height: "var(--notchLeft)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              >
                <svg
                  viewBox="0 0 100 100"
                  width="100%"
                  height="100%"
                  preserveAspectRatio="none"
                >
                  {/* Fill the removed corner area with page background */}
                  <path d={`M0 0 L100 0 ${notchWaveD} L0 0 Z`} fill="#000" />
                  {/* Draw the wavy (7-curve) cut border */}
                  <path
                    d={`M100 0 ${notchWaveD}`}
                    fill="none"
                    stroke="rgba(0,0,0,0.65)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>

              {/* Curved top-right cut (mirrored) */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  // shift the wavy cut left; keep its size unchanged
                  right: "var(--rightCutShift)",
                  width: "var(--notchTop)",
                  height: "var(--notchLeft)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              >
                <svg
                  viewBox="0 0 100 100"
                  width="100%"
                  height="100%"
                  preserveAspectRatio="none"
                >
                  {/* Mirror horizontally so the cut sits on the top-right corner */}
                  <path
                    d={`M0 0 L100 0 ${notchWaveD} L0 0 Z`}
                    fill="#000"
                    transform="translate(100 0) scale(-1 1)"
                  />
                  <path
                    d={`M100 0 ${notchWaveD}`}
                    fill="none"
                    stroke="rgba(0,0,0,0.65)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    transform="translate(100 0) scale(-1 1)"
                  />
                </svg>
              </div>

              <form
                style={{
                  display: "grid",
                  marginTop: "auto",
                  gap: 24,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: inputStyle.maxWidth,
                    display: "grid",
                    gridTemplateColumns: "45% 10% 45%",
                    justifySelf: "start",
                  }}
                >
                  <input
                    name="firstName"
                    placeholder="FIRST NAME"
                    style={{ ...inputStyle, maxWidth: "100%" }}
                    autoComplete="given-name"
                  />

                  <div aria-hidden="true" />

                  <input
                    name="lastName"
                    placeholder="LAST NAME"
                    style={{ ...inputStyle, maxWidth: "100%" }}
                    autoComplete="family-name"
                  />
                </div>

                <input
                  name="email"
                  placeholder="E-MAIL"
                  style={inputStyle}
                  autoComplete="email"
                  inputMode="email"
                />

                <textarea
                  name="message"
                  placeholder="PROJECT / COMMENT"
                  rows={6}
                  style={{
                    ...inputStyle,
                    maxWidth: "min(840px, 100%)",
                    borderRadius: 22,
                    paddingTop: 16,
                    resize: "none",
                  }}
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button
                    type="submit"
                    style={{
                      border: "2px solid rgba(0,0,0,0.65)",
                      borderRadius: 999,
                      padding: "10px 18px",
                      background: brandTeal,
                      color: "#0b0b0b",
                      fontFamily: "var(--font-offbit)",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      fontSize: 14,
                      lineHeight: 1,
                      cursor: "pointer",
                    }}
                  >
                    SUBMIT
                  </button>
                </div>
              </form>
            </div>

            {/* Right: quotes */}
            <div
              style={{
                fontFamily: "var(--font-offbit)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 420,
              }}
            >
              <div
                style={{
                  alignSelf: "flex-end",
                  textAlign: "right",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  lineHeight: 1.05,
                  fontSize: "clamp(18px, 2.2vw, 28px)",
                  maxWidth: 420,
                }}
              >
                {"\u201cLET\u2019S MAKE\nIMAGES\nTHAT STAY.\u201d"}
              </div>

              <div
                style={{
                  alignSelf: "flex-end",
                  textAlign: "left",
                  letterSpacing: "0.08em",
                  lineHeight: 1.25,
                  fontSize: "clamp(14px, 1.4vw, 18px)",
                  maxWidth: 520,
                }}
              >
                {"\u201cWorking on something? Send it our way \u2014\nwe\u2019ll take it from there.\u201d"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function makeNotchWavePath(segments: number, amplitude: number) {
  // Builds a wavy path from (100,0) to (0,100) with alternating bulges.
  // segments=7 => 7 arches/inverted arches.
  const n = Math.max(1, Math.floor(segments));
  const amp = Math.max(0, amplitude);

  // Direction along the diagonal and its perpendicular.
  const dx = -1;
  const dy = 1;
  const invLen = 1 / Math.hypot(dx, dy);
  const ux = dx * invLen;
  const uy = dy * invLen;
  // Perpendicular unit vector
  const px = -uy;
  const py = ux;

  let d = "";
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = (i + 1) / n;

    const x0 = 100 * (1 - t0);
    const y0 = 100 * t0;
    const x1 = 100 * (1 - t1);
    const y1 = 100 * t1;

    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;

    const sign = i % 2 === 0 ? 1 : -1;
    const cx = mx + px * amp * sign;
    const cy = my + py * amp * sign;

    d += ` Q ${cx.toFixed(3)} ${cy.toFixed(3)} ${x1.toFixed(3)} ${y1.toFixed(3)}`;
  }
  return d;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 560,
  justifySelf: "start",
  border: "2px solid rgba(0,0,0,0.65)",
  borderRadius: 999,
  padding: "12px 16px",
  background: "transparent",
  outline: "none",
  color: "#0b0b0b",
  fontFamily: "var(--font-offbit)",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontSize: 12,
};
