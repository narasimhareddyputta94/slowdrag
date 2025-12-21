"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/nav/Navbar";
import Manifesto from "@/components/sections/Manifesto";
import FilmsShowcase from "@/components/sections/FilmsShowcase";
import Manifesto2 from "@/components/sections/Manifesto2";
import DesignsShowcase from "@/components/sections/DesignsShowcase";
import Footer from "@/components/footer/Footer";

import HeroMeltWebGL from "@/components/hero/HeroMeltWebGL";

export default function Home() {
  const [showNav, setShowNav] = useState(false);
  const [heroInView, setHeroInView] = useState(true);
  const heroWrapRef = useRef<HTMLDivElement | null>(null);
  const brandColor = "#c6376c";

  useEffect(() => {
    const el = heroWrapRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => setHeroInView(entries[0]?.isIntersecting ?? true),
      { threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <main>
      <Navbar
        logoSrc="/images/logo.png"
        logoAltSrc="/images/fulllogo.png"
        useAltLogo={!heroInView}
        show={showNav}
        brandColor={brandColor}
      />
      {/* Use SVG for best crispness, PNG also works */}
      <div ref={heroWrapRef}>
        <HeroMeltWebGL
          imageSrc="/images/titleimage.svg"
          onScrolledChange={setShowNav}
          brandColor={brandColor}
          showCaption={showNav}
        />
      </div>
      <Manifesto />
      <FilmsShowcase />
      <Manifesto2 />
      <DesignsShowcase />
      <Footer />
    </main>
  );
}
