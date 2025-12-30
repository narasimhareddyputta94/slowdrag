"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  const [introLocked, setIntroLocked] = useState(() => {
    if (typeof window === "undefined") return false;

    const eligible = window.matchMedia?.("(min-width: 1024px)")?.matches ?? false;
    if (!eligible) return false;

    const forceIntro = new URLSearchParams(window.location.search).get("intro") === "1";
    try {
      const seen = window.localStorage.getItem("slowdrag_intro_seen");
      return forceIntro || !seen;
    } catch {
      return false;
    }
  });
  const introUnlockOnceRef = useRef(false);

  const [introEligibleDesktop, setIntroEligibleDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(min-width: 1024px)")?.matches ?? false;
  });

  useEffect(() => {
    const mql = window.matchMedia?.("(min-width: 1024px)");
    if (!mql) return;

    const recompute = () => {
      const eligible = mql.matches;
      setIntroEligibleDesktop(eligible);

      if (!eligible) {
        setIntroLocked(false);
        return;
      }

      const forceIntro = new URLSearchParams(window.location.search).get("intro") === "1";
      try {
        const seen = window.localStorage.getItem("slowdrag_intro_seen");
        setIntroLocked(forceIntro || !seen);
      } catch {
        setIntroLocked(false);
      }
    };

    const onChange = () => recompute();
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
  }, []);

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
