"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type NavItem = { label: string; href: string };

type NavbarProps = {
  logoSrc: string;
  logoAltSrc?: string;
  useAltLogo?: boolean;
  show: boolean;            // controls fade-in (hero can toggle)
  slideOnHide?: boolean;    // optionally slide upward when hidden
  brandColor?: string;      // menu bg uses this
  items?: NavItem[];
};

export default function Navbar({
  logoSrc,
  logoAltSrc,
  useAltLogo = false,
  show,
  slideOnHide = false,
  brandColor = "#c6376c",
  items = [
    { label: "HOME", href: "/" },
    { label: "ABOUT", href: "/about" },
    { label: "CONTACT", href: "/contact" },
  ],
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(menuOpen);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  // Close drawer on route change
  useEffect(() => {
    if (!menuOpenRef.current) return;
    const id = requestAnimationFrame(() => setMenuOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  // ESC to close
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Lock scroll when open
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarW > 0) {
      document.body.style.paddingRight = `${scrollbarW}px`;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [menuOpen]);

  const go = (href: string) => {
    setMenuOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Top bar */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          // Never block the page with an invisible full-screen layer.
          // Only the actual controls (logo + hamburger) should receive pointer events.
          pointerEvents: "none",
          opacity: show ? 1 : 0,
          transform: slideOnHide ? (show ? "translateY(0)" : "translateY(-160px)") : undefined,
          transition: slideOnHide ? "opacity 450ms ease, transform 450ms ease" : "opacity 450ms ease",
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div
          className="fixed left-[max(0px,env(safe-area-inset-left))] top-[max(10px,env(safe-area-inset-top))] md:left-9 md:top-7"
          style={{ pointerEvents: show ? "auto" : "none" }}
        >
          <button
            type="button"
            onClick={() => go("/")}
            aria-label="Home"
            className="relative h-[64px] w-[140px] md:h-[96px] md:w-[180px]"
            style={{
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
            }}
          >
            <Image
              src={logoSrc}
              alt="Logo"
              fill
              sizes="(max-width: 768px) 140px, 180px"
              style={{
                objectFit: "contain",
                userSelect: "none",
                opacity: useAltLogo ? 0 : 1,
                transition:
                  "opacity 850ms cubic-bezier(0.16, 1, 0.3, 1)",
                willChange: "opacity",
              }}
            />
            {logoAltSrc ? (
              <Image
                src={logoAltSrc}
                alt="Logo"
                fill
                sizes="(max-width: 768px) 140px, 180px"
                style={{
                  objectFit: "contain",
                  userSelect: "none",
                  opacity: useAltLogo ? 1 : 0,
                  transition:
                    "opacity 850ms cubic-bezier(0.16, 1, 0.3, 1) 60ms",
                  willChange: "opacity",
                }}
              />
            ) : null}
          </button>
        </div>

        {/* Hamburger (a bit down + left) */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="fixed right-[max(8px,env(safe-area-inset-right))] top-[max(10px,env(safe-area-inset-top))] md:right-11 md:top-10"
          style={{
            width: 44,
            height: 44,
            border: 0,
            background: "transparent",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            pointerEvents: show ? "auto" : "none",
          }}
        >
          <span style={{ width: 34, height: 5, borderRadius: 999, background: brandColor, display: "block", marginBottom: 6 }} />
          <span style={{ width: 34, height: 5, borderRadius: 999, background: brandColor, display: "block", marginBottom: 6 }} />
          <span style={{ width: 34, height: 5, borderRadius: 999, background: brandColor, display: "block" }} />
        </button>
      </div>

      {/* Drawer overlay */}
      <div
        aria-hidden={!menuOpen}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 80,
          pointerEvents: menuOpen ? "auto" : "none",
        }}
      >
        {/* Backdrop (click to close) */}
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            opacity: menuOpen ? 1 : 0,
            transition: "opacity 220ms ease",
          }}
        />

        {/* Panel */}
        <aside
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            height: "100%",
            width: "min(420px, 60vw)",
            background: brandColor, // ✅ same as Register button color
            transform: menuOpen ? "translateX(0)" : "translateX(105%)",
            transition: "transform 260ms ease",
            padding: "36px 34px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {/* Close */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
            style={{
              position: "absolute",
              right: 18,
              top: 18,
              width: 42,
              height: 42,
              borderRadius: 10,
              border: "2px solid rgba(0,0,0,0.25)",
              background: "rgba(0,0,0,0.15)",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              fontSize: 20,
              fontWeight: 700,
              color: "#0b0b0b",
            }}
          >
            ×
          </button>

          {/* Menu items */}
          <nav
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",      // ⬅️ center horizontally
                justifyContent: "center",  // ⬆️ center vertically
                gap: 28,                   // 🔥 space between items
            }}
            >
            {items.map((item) => (
                <button
                key={item.href}
                type="button"
                onClick={() => go(item.href)}
              tabIndex={menuOpen ? 0 : -1}
                style={{
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    cursor: "pointer",
                    color: "#0b0b0b",
                    fontSize: 36,
                    letterSpacing: "0.12em",   // more premium spacing
                    textTransform: "uppercase",
                    textAlign: "center",
                    fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                }}
                >
                {item.label}
                </button>
            ))}
        </nav>
        </aside>
      </div>
    </>
  );
}
