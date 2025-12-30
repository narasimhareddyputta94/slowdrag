import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/footer/Footer";

export default function ContactPage() {
  const brandColor = "#c6376c";
  const brandTeal = "#9c483aff";
  const brandWhite = "#927a7aff";

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
    <main className="contact-page" style={{ background: "#000", color: "#fff" }}>
      {/* SEO: h1 for page title - visually hidden but crawlable */}
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
        Contact Slow Drag Studios
      </h1>
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
          paddingTop: 140,
          paddingBottom: 60,
        }}
      >
        <div className="mx-auto max-w-[1400px] px-6 md:px-16">
          <div className="grid gap-10 lg:gap-16 lg:grid-cols-[1.35fr_0.65fr]">
            
            {/* Left: form card */}
            <div style={{ position: "relative" }}>
              <div
                className="contact-card"
                style={{
                  position: "relative",
                  minHeight: "680px", // Base height
                  borderRadius: 44,
                  display: "flex",
                  flexDirection: "column",
                  color: "#0b0b0b",
                  background: "#000",
                  overflow: "hidden",
                  fontFamily: "var(--font-offbit)",
                }}
              >
                {/* SVG Background */}
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

                {/* Inner Quote */}
                <div className="contact-card-quote">
                  {"\u201cLET\u2019S MAKE\nIMAGES\nTHAT STAY.\u201d"}
                </div>

                <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column" }}>
                  <form className="contact-form">
                    <div className="name-row">
                      <input
                        name="firstName"
                        placeholder="FIRST NAME"
                        className="contact-field"
                        autoComplete="given-name"
                      />
                      <input
                        name="lastName"
                        placeholder="LAST NAME"
                        className="contact-field"
                        autoComplete="family-name"
                      />
                    </div>

                    <input
                      name="email"
                      placeholder="E-MAIL"
                      className="contact-field"
                      autoComplete="email"
                      inputMode="email"
                    />

                    <textarea
                      name="message"
                      placeholder="PROJECT / COMMENT"
                      className="contact-field message-field"
                      rows={7}
                    />

                    <div className="contact-actions">
                      <button type="submit" className="contact-submit">
                        SUBMIT
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Outside quote */}
              <div className="contact-outside-quote">
                {"\u201cWorking on something? Send it our way \u2014\nwe\u2019ll take it from there.\u201d"}
              </div>
            </div>

            {/* Right: spacer for desktop layout */}
            <div className="hidden lg:flex" style={{ minHeight: 420 }} />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}