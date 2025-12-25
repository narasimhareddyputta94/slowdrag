"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/nav/Navbar";
import FilmsShowcase from "@/components/sections/FilmsShowcase";
import MobileFilmsShowcase from "@/components/sections/MobileFilmsShowcase";
import Manifesto2 from "@/components/sections/Manifesto2";
import DesignsShowcase from "@/components/sections/DesignsShowcase";
import RotatedVideoSection from "@/components/sections/RotatedVideoSection";
import Footer from "@/components/footer/Footer";
import HeroMeltWebGL from "@/components/hero/HeroMeltWebGL";
import ManifestoMeltWebGLPage from "./manifestomeltwebgl/page";

export default function Home() {
  const [showNav, setShowNav] = useState(false);
  const [heroInView, setHeroInView] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const heroWrapRef = useRef<HTMLDivElement | null>(null);
  const brandColor = "#c6376c";

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

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
      
      {/* Wrapper to track intersection for nav */}
      <div ref={heroWrapRef}>
        <HeroMeltWebGL
          imageSrc="/images/titleimage.svg"
          onScrolledChange={setShowNav}
          brandColor={brandColor}
          showCaption={showNav}
        >
        </HeroMeltWebGL>
      </div>

<ManifestoMeltWebGLPage />
      {isMobile ? <MobileFilmsShowcase /> : <FilmsShowcase />}
      <Manifesto2 />
      <DesignsShowcase />
      <RotatedVideoSection />
      <Footer />
    </main>
  );
}