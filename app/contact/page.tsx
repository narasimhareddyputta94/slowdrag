import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/footer/Footer";

export default function ContactPage() {
  const brandColor = "#c6376c";
  const brandTeal = "#9c483aff";
  const brandWhite = "#927a7aff";
  const notchWaveD = makeNotchWavePath(7, 11);
  const rightNotchWaveD = makeNotchWavePath(7, 11, { straightLastSegment: true });

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
            <div style={{ position: "relative" }}>
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
                    // Bottom-right cutout for the quote
                    "--brCutW": "clamp(340px, 28vw, 480px)",
                    "--brCutH": "clamp(96px, 12vh, 132px)",
                  } as React.CSSProperties ),
                  background: `linear-gradient(135deg, ${brandWhite} 0%, ${brandTeal} 46%, ${brandColor} 100%)`,
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
                    d={`M0 0 L100 0 ${rightNotchWaveD} L0 0 Z`}
                    fill="#000"
                    transform="translate(100 0) scale(-1 1)"
                  />
                  <path
                    d={`M100 0 ${rightNotchWaveD}`}
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

              {/* Mask the right-side pillar created by shifting the cut (only up to the last curve) */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  // Slightly overlap left to cover any anti-aliased seam/border.
                  width: "calc(var(--rightCutShift) + 3px)",
                  height: "calc(var(--notchLeft) - 37px)",
                  background: "#000",
                  pointerEvents: "none",
                  // Above the notch stroke so the old pillar edge line can't show through.
                  zIndex: 3,
                  boxShadow: "-2px 0 0 #000",
                  borderTopRightRadius: 44,
                }}
              >
              </div>

              {/* Quote moved onto the contact box near the top-right cut */}
              <div
                style={{
                  position: "absolute",
                  top: 80,
                  right: "calc(var(--rightCutShift) + -180px)",
                  zIndex: 10,
                  textAlign: "left",
                  textTransform: "uppercase",
                  whiteSpace: "pre-line",
                  letterSpacing: "0.12em",
                  lineHeight: 1.05,
                  fontWeight: 700,
                  fontSize: "clamp(22px, 2.8vw, 34px)",
                  maxWidth: 320,
                  color: "#fdfcfcff",
                  pointerEvents: "none",
                }}
              >
                {"\u201cLET\u2019S MAKE\nIMAGES\nTHAT STAY.\u201d"}
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
                    className="contact-field placeholder:text-white placeholder:opacity-100"
                    style={{ ...inputStyle, maxWidth: "100%" }}
                    autoComplete="given-name"
                  />

                  <div aria-hidden="true" />

                  <input
                    name="lastName"
                    placeholder="LAST NAME"
                    className="contact-field placeholder:text-white placeholder:opacity-100"
                    style={{ ...inputStyle, maxWidth: "100%" }}
                    autoComplete="family-name"
                  />
                </div>

                <input
                  name="email"
                  placeholder="E-MAIL"
                  className="contact-field placeholder:text-white placeholder:opacity-100"
                  style={inputStyle}
                  autoComplete="email"
                  inputMode="email"
                />

                <textarea
                  name="message"
                  placeholder="PROJECT / COMMENT"
                  className="contact-field placeholder:text-white placeholder:opacity-100"
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
                      border: "2px solid rgba(83, 255, 77, 0.65)",
                      borderRadius: 999,
                      padding: "10px 18px",
                      background: "#000000",
                      color: "#53ff4d",
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

              {/* Bottom-right cutout area for the quote */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  // Slightly overshoot to prevent any anti-aliased/colored seam
                  // from the gradient showing at the edge.
                  right: -2,
                  bottom: -2,
                  width: "calc(var(--brCutW) + 4px)",
                  height: "calc(var(--brCutH) + 4px)",
                  background: "#000",
                  pointerEvents: "none",
                  zIndex: 2,
                
                }}
              >
              </div>
              </div>

              {/* Same quote, but outside the overflow:hidden card so line 1 isn't clipped */}
              <div
                style={{
                  position: "absolute",
                  right: -70,
                  bottom: 10,
                  zIndex: 20,
                  fontFamily: "var(--font-offbit)",
                  textAlign: "left",
                  letterSpacing: "0.08em",
                  lineHeight: 1.25,
                  fontSize: "clamp(16px, 1.8vw, 22px)",
                  color: "#fff",
                  whiteSpace: "pre",
                  width: "max-content",
                  pointerEvents: "none",
                }}
              >
                {"\u201cWorking on something? Send it our way \u2014\nwe\u2019ll take it from there.\u201d"}
              </div>
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
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function makeNotchWavePath(
  segments: number,
  amplitude: number,
  options?: {
    straightLastSegment?: boolean;
    invertSegments?: number[]; // <-- NEW
  }
) {
  const n = Math.max(1, Math.floor(segments));
  const amp = Math.max(0, amplitude);

  const dx = -1;
  const dy = 1;
  const invLen = 1 / Math.hypot(dx, dy);
  const ux = dx * invLen;
  const uy = dy * invLen;
  const px = -uy;
  const py = ux;

  const invert = new Set(options?.invertSegments ?? []);

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

    // default alternating bulge direction (your current logic)
    let sign = i % 2 === 0 ? 1 : -1; // :contentReference[oaicite:1]{index=1}

    // NEW: flip ONLY the curves you want
    if (invert.has(i)) sign *= -1;

    const cx = mx + px * amp * sign;
    const cy = my + py * amp * sign;

    if (options?.straightLastSegment && i === n - 1) {
      d += ` L ${x1.toFixed(3)} ${y0.toFixed(3)} L ${x1.toFixed(3)} ${y1.toFixed(3)}`;
    } else {
      d += ` Q ${cx.toFixed(3)} ${cy.toFixed(3)} ${x1.toFixed(3)} ${y1.toFixed(3)}`;
    }
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
  color: "#ffffff",
  caretColor: "#ffffff",
  fontFamily: "var(--font-offbit)",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontSize: 12,
};
