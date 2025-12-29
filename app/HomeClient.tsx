"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/nav/Navbar";
import HeroMeltWebGL from "@/components/hero/HeroMeltWebGL";
import MountWhenNearViewport from "@/components/perf/MountWhenNearViewport";
import SmoothScrollLenis from "@/components/perf/SmoothScrollLenis";

const ManifestoFlowWebGL = dynamic(() => import("@/components/sections/ManifestoFlowWebGL"), {
  ssr: false,
});

export default function HomeClient({ brandColor }: { brandColor: string }) {
  const [showNav, setShowNav] = useState(false);
  const [heroInView, setHeroInView] = useState(true);
  const heroWrapRef = useRef<HTMLDivElement | null>(null);

  const [smoothScrollEnabled, setSmoothScrollEnabled] = useState(false);

  // Armed exactly when Hero reports “melt touched bottom / finished”
  const [manifestoArmed, setManifestoArmed] = useState(false);
  const armedOnceRef = useRef(false);

  const handleMeltFinished = useCallback(() => {
    if (armedOnceRef.current) return;
    armedOnceRef.current = true;
    setManifestoArmed(true);
    setSmoothScrollEnabled(true);
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
      <SmoothScrollLenis enabled={smoothScrollEnabled} />

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

      <MountWhenNearViewport
        // Reserve layout to keep CLS at 0.
        placeholder={
          <section
            style={{ minHeight: "70vh", background: "#000" }}
          />
        }
        rootMargin="0px"
      >
        <ManifestoFlowWebGL brandColor={brandColor} armed={manifestoArmed} />
      </MountWhenNearViewport>
    </>
  );
}
