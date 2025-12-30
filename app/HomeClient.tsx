"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Navbar from "@/components/nav/Navbar";
import HeroShell from "@/components/hero/HeroShell";
import SmoothScrollLenis from "@/components/perf/SmoothScrollLenis";
import useIsMobile from "@/components/perf/useIsMobile";
import ScrollLock from "@/components/perf/ScrollLock";

export default function HomeClient({ brandColor }: { brandColor: string }) {
  const [showNav, setShowNav] = useState(false);
  const [heroInView, setHeroInView] = useState(true);
  const heroWrapRef = useRef<HTMLDivElement | null>(null);

  // Enable smooth scroll immediately (not waiting for melt to finish)
  const [smoothScrollEnabled, setSmoothScrollEnabled] = useState(true);
  const armedOnceRef = useRef(false);
  const isMobile = useIsMobile();

  const [introLocked, setIntroLocked] = useState(false);
  const introUnlockOnceRef = useRef(false);

  const [introEligibleDesktop, setIntroEligibleDesktop] = useState(false);

  useLayoutEffect(() => {
    const mql = window.matchMedia?.("(min-width: 1024px)");
    const next = mql?.matches ?? false;
    setIntroEligibleDesktop(next);
  }, []);

  useLayoutEffect(() => {
    // Never lock on mobile; only on desktop.
    if (!introEligibleDesktop) {
      setIntroLocked(false);
      return;
    }

    // Allow forcing the intro while testing: /?intro=1
    const forceIntro = new URLSearchParams(window.location.search).get("intro") === "1";

    try {
      const seen = window.localStorage.getItem("slowdrag_intro_seen");
      if (forceIntro || !seen) setIntroLocked(true);
    } catch {
      // If storage is unavailable, default to no lock.
    }
  }, [introEligibleDesktop]);

  const handleIntroUnlock = useCallback(() => {
    if (introUnlockOnceRef.current) return;
    introUnlockOnceRef.current = true;
    setIntroLocked(false);
    try {
      window.localStorage.setItem("slowdrag_intro_seen", "1");
    } catch {
      // ignore
    }
  }, []);

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
      <ScrollLock enabled={introLocked && introEligibleDesktop} />
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
          introAutoplay={introLocked && introEligibleDesktop}
          introUnlockAt={0.5}
          onIntroUnlock={handleIntroUnlock}
        />
      </div>
    </>
  );
}
