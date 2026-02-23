"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/nav/Navbar";
import HeroShell from "@/components/hero/HeroShell";
import SmoothScrollLenis from "@/components/perf/SmoothScrollLenis";

export default function HomeClient({ brandColor }: { brandColor: string }) {
  const [showNav, setShowNav] = useState(true);
  const [heroInView, setHeroInView] = useState(true);
  const heroWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = heroWrapRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0]?.isIntersecting ?? true;
        setHeroInView(isIntersecting);
      },
      { threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <SmoothScrollLenis enabled />

      <Navbar
        logoSrc="/images/logo.png"
        logoAltSrc="/images/fulllogo.png"
        useAltLogo={!heroInView}
        show={showNav}
        brandColor={brandColor}
      />

      <div ref={heroWrapRef}>
        <HeroShell
          imageSrc="/images/titleimage.svg"
          brandColor={brandColor}
          showCaption
          posterAlt="Slow Drag Studios"
          posterWidth={1920}
          posterHeight={1080}
        />
      </div>
    </>
  );
}
