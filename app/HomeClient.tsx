"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/nav/Navbar";
import HeroMeltWebGL from "@/components/hero/HeroMeltWebGL";
import ManifestoFlowWebGL from "@/components/sections/ManifestoFlowWebGL";

export default function HomeClient({ brandColor }: { brandColor: string }) {
  const [showNav, setShowNav] = useState(false);
  const [heroInView, setHeroInView] = useState(true);
  const heroWrapRef = useRef<HTMLDivElement | null>(null);

  // Armed exactly when Hero reports “melt touched bottom / finished”
  const [manifestoArmed, setManifestoArmed] = useState(false);
  const armedOnceRef = useRef(false);

  const handleMeltFinished = useCallback(() => {
    if (armedOnceRef.current) return;
    armedOnceRef.current = true;
    setManifestoArmed(true);
  }, []);

  useEffect(() => {
    const el = heroWrapRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0]?.isIntersecting ?? true;
        setHeroInView(isIntersecting);

        // Fallback (in case WebGL fails or callback never fires):
        // arm once when hero fully leaves view.
        if (!isIntersecting && !armedOnceRef.current) {
          armedOnceRef.current = true;
          setManifestoArmed(true);
        }
      },
      { threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Navbar
        logoSrc="/images/logo.png"
        logoAltSrc="/images/fulllogo.png"
        useAltLogo={!heroInView}
        show={showNav}
        brandColor={brandColor}
      />

      <div ref={heroWrapRef}>
        <HeroMeltWebGL
          imageSrc="/images/titleimage.svg"
          onScrolledChange={setShowNav}
          brandColor={brandColor}
          showCaption={showNav}
          posterAlt="Slow Drag Studios"
          posterWidth={1200}
          posterHeight={600}
          onMeltFinished={handleMeltFinished}
        />
      </div>

      <ManifestoFlowWebGL brandColor={brandColor} armed={manifestoArmed} />
    </>
  );
}
