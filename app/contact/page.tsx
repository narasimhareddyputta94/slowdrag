import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/footer/Footer";

export default function ContactPage() {
  const brandColor = "#c6376c";
  const brandTeal = "#9c483aff";
  const brandWhite = "#927a7aff";

  // Contact card silhouette (edit this `d` string to control the box shape)
  // Uses the same idea as `shapePath` in Designs/Films.
const contactShapePath = `
M 229.50,0.00
L 456.00,0.00

Q 483.77,0.00 488.00,31.43
Q 492.23,59.13 520.00,62.86
Q 547.77,66.59 552.00,94.29
Q 556.23,121.98 584.00,125.71
Q 611.77,129.45 616.00,157.14
Q 620.23,188.57 648.00,188.57

L 868.57,188.57
A 39.29,39.29 0 0 1 902.86,222.86
L 902.86,474.00
Q 902.86,501.77 874.29,505.89
L 568.00,505.89
Q 540.23,505.89 535.00,537.32
Q 529.77,568.75 501.00,568.75

L 35.43,568.75
Q 7.66,568.75 3.43,537.32
L 3.43,284.29
Q 0.17,234.43 28.50,226.29
Q 56.83,218.15 57.00,188.57
Q 57.17,159.00 85.50,150.86
Q 113.83,142.72 114.00,113.14
Q 114.17,83.56 142.50,75.43
Q 170.83,67.29 171.00,37.71
Q 171.17,8.13 199.50,0.00

Q 214.50,-18.00 229.50,0.00
Z
`;

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
          paddingInlineStart: 20,
          paddingRight: 220,
        }}
      >
        <div className="mx-auto max-w-[1400px] px-10 md:px-16">
          <div className="grid gap-10 lg:gap-16 lg:grid-cols-[1.35fr_0.65fr]">
            {/* Left: form card */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "relative",
                  minHeight: "clamp(520px, 62vh, 680px)",
                  borderRadius: 44,
                  padding: 34,
                  paddingLeft: 120,
                  paddingBottom: 30,
                  display: "flex",
                  flexDirection: "column",
                  color: "#0b0b0b",
                  background: "#000",
                  overflow: "hidden",
                  fontFamily: "var(--font-offbit)",
                }}
              >
                {/* Shape background + border (path-driven like other showcases) */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 1000 600"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  style={{ zIndex: 1 }}
                >
                  <defs>
                    <clipPath id="contact-card-clip" clipPathUnits="userSpaceOnUse">
                      <path d={contactShapePath} />
                    </clipPath>

                    <linearGradient id="contact-card-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={brandWhite} />
                      <stop offset="46%" stopColor={brandTeal} />
                      <stop offset="100%" stopColor={brandColor} />
                    </linearGradient>
                  </defs>

                  <g clipPath="url(#contact-card-clip)">
                    <rect x="0" y="0" width="1000" height="600" fill="url(#contact-card-gradient)" />
                  </g>

                  <path
                    d={contactShapePath}
                    fill="none"
                    stroke="rgba(0,0,0,0.65)"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

              {/* Quote moved onto the contact box near the top-right cut */}
              <div
                style={{
                  position: "absolute",
                  top: 80,
                  right: 100,
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

              <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column" }}>

              <form
                style={{
                  display: "grid",
                  // Push the field "boxes" down inside the card
                  marginTop: "clamp(240px, 26vh, 340px)",
                  marginLeft: "120px",
                  gap: 30,
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
                  rows={7}
                  style={{
                    ...inputStyle,
                    maxWidth: "min(740px, 100%)",
                    borderRadius: 22,
                    paddingTop: 16,
                    resize: "none",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 8,
                  }}
                >
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

              </div>
              </div>

              {/* Same quote, but outside the overflow:hidden card so line 1 isn't clipped */}
              <div
                style={{
                  position: "absolute",
                  right: -70,
                  bottom: -10,
                  zIndex: 20,
                  fontFamily: "var(--font-offbit)",
                  textAlign: "left",
                  letterSpacing: "0.08em",
                  lineHeight: 1.25,
                  fontSize: "clamp(20px, 1.8vw, 24px)",
                  color: "#fff",
                  fontWeight: 900,
                  whiteSpace: "pre",
                  width: "max-content",
                  pointerEvents: "none",
                  textShadow: "0 1px 8px rgba(0,0,0,0.18)",
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


const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  justifySelf: "start",
  border: "3px solid rgba(0,0,0,0.82)",
  borderRadius: 999,
  padding: "12px 16px",
  background: "transparent",
  outline: "none",
  color: "#fff",
  caretColor: "#fff",
  fontFamily: "var(--font-offbit)",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontSize: 14,
};
