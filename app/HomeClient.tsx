"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/nav/Navbar";
import HeroShell from "@/components/hero/HeroShell";
import SmoothScrollLenis from "@/components/perf/SmoothScrollLenis";
import useIsMobile from "@/components/perf/useIsMobile";

export default function HomeClient({ brandColor }: { brandColor: string }) {
  const [showNav, setShowNav] = useState(false);
  const [heroInView, setHeroInView] = useState(true);
  const heroWrapRef = useRef<HTMLDivElement | null>(null);

  const [smoothScrollEnabled, setSmoothScrollEnabled] = useState(false);
  const armedOnceRef = useRef(false);
  const isMobile = useIsMobile();

  const handleMeltFinished = useCallback(() => {
    if (armedOnceRef.current) return;
    armedOnceRef.current = true;
    setSmoothScrollEnabled(true);
  }, []);

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
      <SmoothScrollLenis enabled={smoothScrollEnabled} />

      <Navbar
        logoSrc="/images/logo.png"
        logoAltSrc="/images/fulllogo.png"
        useAltLogo={!heroInView}
        show={showNav}
        brandColor={brandColor}
      />

      <div ref={heroWrapRef}>
        <HeroShell
          imageSrc={
            isMobile
              ? "/images/titleimage-1200.webp"
              : "/images/titleimage-1920.webp"
          }
          onScrolledChange={setShowNav}
          brandColor={brandColor}
          showCaption={showNav}
          posterAlt="Slow Drag Studios"
          posterWidth={isMobile ? 1200 : 1920}
          posterHeight={isMobile ? 600 : 960}
          onMeltFinished={handleMeltFinished}
        />
      </div>
    </>
  );
}
