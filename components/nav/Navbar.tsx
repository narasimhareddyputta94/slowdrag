"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type NavItem = { label: string; href: string };

type NavbarProps = {
  logoSrc: string;
  show: boolean;            // controls fade-in (hero can toggle)
  brandColor?: string;      // menu bg uses this
  items?: NavItem[];
};

export default function Navbar({
  logoSrc,
  show,
  brandColor = "#c6376c",
  items = [
    { label: "HOME", href: "/" },
    { label: "ABOUT", href: "/about" },
    { label: "WORK", href: "/work" },
    { label: "CONTACT", href: "/contact" },
  ],
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => setMenuOpen(false), [pathname]);

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
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
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
          transition: "opacity 450ms ease",
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div style={{ position: "fixed", left: 36, top: 28, pointerEvents: show ? "auto" : "none" }}>
          <button
            type="button"
            onClick={() => go("/")}
            aria-label="Home"
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
              width={96}
              height={96}
              style={{ width: 96, height: 96, objectFit: "contain", userSelect: "none" }}
            />
          </button>
        </div>

        {/* Hamburger (a bit down + left) */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          style={{
            position: "fixed",
            right: 44,
            top: 40,
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
