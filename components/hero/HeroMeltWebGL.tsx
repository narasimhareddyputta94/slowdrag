"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useAfterFirstPaint from "@/components/perf/useAfterFirstPaint";
import useSiteLoaded from "@/components/perf/useSiteLoaded";

declare global {
  interface Window {
    __slowdrag_heroRafRunning?: boolean;
  }
}

type HeroProps = {
  imageSrc: string;
  onScrolledChange?: (scrolled: boolean) => void;
  brandColor?: string;
  showCaption?: boolean;
  children?: React.ReactNode;

  /**
   * Optional: DOM poster (helps Lighthouse LCP because canvas/WebGL often yields NO_LCP)
   * Defaults are safe for your /images/titleimage.svg hero.
   */
  posterAlt?: string;
  posterWidth?: number;
  posterHeight?: number;

  // ✅ NEW: fired once when melt reaches the end / lock finishes
  onMeltFinished?: () => void;
};

/* ---------------- Color Helpers ---------------- */
function srgbToLinear(c: number) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function hexToLinearRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace(/^#/, "");
  const v = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return [0.0, 0.0, 0.0];
  const r = parseInt(v.slice(0, 2), 16) / 255;
  const g = parseInt(v.slice(2, 4), 16) / 255;
  const b = parseInt(v.slice(4, 6), 16) / 255;
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "").trim();
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = /^[0-9a-fA-F]{6}$/.test(v) ? v : "c6376c";
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}


export default function HeroMeltWebGL({
  imageSrc,
  onScrolledChange,
  brandColor = "#c6376c",
  showCaption = false,
  children,
  posterAlt = "Slow Drag Studios",
  posterWidth = 1200,
  posterHeight = 600,
  onMeltFinished,
}: HeroProps) {
  const router = useRouter();
  useEffect(() => {
    window.__slowdrag_heroRafRunning = false;
  }, []);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const loopRef = useRef<(() => void) | null>(null);

  const onMeltFinishedRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    onMeltFinishedRef.current = onMeltFinished;
  }, [onMeltFinished]);

  const meltFinishedOnceRef = useRef(false);

  // LCP poster: visible instantly, then fades away once WebGL is ready.
  const [showPoster, setShowPoster] = useState(true);
  const posterHideOnceRef = useRef(false);
  const heroReadyOnceRef = useRef(false);

  const siteLoaded = useSiteLoaded();
  const afterFirstPaint = useAfterFirstPaint();
  const brandLin = useMemo(() => hexToLinearRgb(brandColor), [brandColor]);

  // Keep a shared CSS variable in sync so other pages/sections can match the flow hue.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const { r, g, b } = hexToRgb(brandColor);
    document.documentElement.style.setProperty("--flow-color", brandColor);
    document.documentElement.style.setProperty("--flow-color-rgb", `${r} ${g} ${b}`);
  }, [brandColor]);

  const S = useRef({
    gl: null as WebGLRenderingContext | null,
    maskProg: null as WebGLProgram | null,
    renderProg: null as WebGLProgram | null,
    postProg: null as WebGLProgram | null,
    blitProg: null as WebGLProgram | null,
    triBuf: null as WebGLBuffer | null,
    logoTex: null as WebGLTexture | null,
    maskTexA: null as WebGLTexture | null,
    maskTexB: null as WebGLTexture | null,
    fbA: null as WebGLFramebuffer | null,
    fbB: null as WebGLFramebuffer | null,
    sceneTex: null as WebGLTexture | null,
    sceneFB: null as WebGLFramebuffer | null,
    ping: 0,
    u_mask: {} as Record<string, WebGLUniformLocation | null>,
    u_render: {} as Record<string, WebGLUniformLocation | null>,
    u_post: {} as Record<string, WebGLUniformLocation | null>,
    u_blit: null as WebGLUniformLocation | null,
    raf: 0,
    t0: 0,
    lastFrameMs: 0,
    lastDrawMs: 0,
    seed: 0,
    loaded: false,
    imgW: 1,
    imgH: 1,
    hasEverMelted: false,
    p: 0,
    target: 0,
    lastLayoutW: 0,
    lastLayoutH: 0,
    scrollY: 0,
    virtualScroll: 0,
    // Cache the intended lock distance so it doesn't change mid-gesture
    // (mobile address-bar show/hide can change innerHeight and prematurely finish the melt).
    lockDistance: 0,
    lockDone: false,
    lockActive: false,
    lockScrollY: 0,
    cover: 0,

    // Stop rendering once the melt is complete.
    freeze: false,

    // ✅ Cache manifesto element so we don’t querySelector every frame (big smoothness win)
    manifestoEl: null as HTMLElement | null,
    manifestoBgSet: false,
    manifestoArmed: false,
    manifestoProbeEvery: 0,

    // ✅ Batch scroll fixing into rAF to avoid stutter
    fixScrollRaf: 0,

    // Performance: pause RAF when offscreen / tab hidden
    inView: true,
    pageVisible: true,
  });

  const scheduleFixScroll = () => {
    const s = S.current;
    if (s.fixScrollRaf) return;
    s.fixScrollRaf = window.requestAnimationFrame(() => {
      s.fixScrollRaf = 0;
      if (s.lockActive && !s.lockDone) {
        window.scrollTo(0, s.lockScrollY);
      }
    });
  };

  useEffect(() => {
    loopRef.current = () => {
      const s = S.current;
      const gl = s.gl;
      if (!gl || !s.loaded || !s.maskProg || !s.renderProg || !s.postProg) return;
      if (!s.inView || !s.pageVisible) return;
      if (s.freeze) {
        window.__slowdrag_heroRafRunning = false;
        return;
      }

      // ✅ Hide poster once WebGL is actually running (LCP has already happened)
      if (!posterHideOnceRef.current) {
        posterHideOnceRef.current = true;
        // two rAFs = let browser paint the poster as LCP, then fade it away
        requestAnimationFrame(() => requestAnimationFrame(() => setShowPoster(false)));
      }

      const now = performance.now();

      // Cap FPS on small screens to reduce long tasks + GPU pressure
      const small = window.matchMedia?.("(max-width: 768px)")?.matches ?? false;
      if (small) {
        if (!s.lastDrawMs) s.lastDrawMs = now;
        if (now - s.lastDrawMs < 33) {
          if (loopRef.current && s.inView && s.pageVisible) s.raf = requestAnimationFrame(loopRef.current);
          return;
        }
        s.lastDrawMs = now;
      }
      if (!s.lastFrameMs) s.lastFrameMs = now;
      const dt = Math.max(0, Math.min(0.06, (now - s.lastFrameMs) * 0.001));
      s.lastFrameMs = now;
      const anim = (now - s.t0) * 0.001;

      /* ---------------- SCROLL LOGIC ---------------- */
      const winH = typeof window !== "undefined" ? (window.visualViewport?.height ?? window.innerHeight) : 900;
      // Use a stable lock distance while the hero is pinned.
      // If we recompute from `innerHeight` each frame, mobile UI chrome changes can cause
      // the melt to reach 1.0 too early (looks like the animation "stops" mid-section).
      const lockDistance = s.lockDistance > 0 ? s.lockDistance : winH * 1.35;

      const raw = s.lockDone ? 1.0 : Math.max(0, Math.min(1.0, s.virtualScroll / Math.max(1, lockDistance)));

      // Map scroll progress 1:1 to the melt so it reaches the end only when the hero lock ends.
      // (Previously 1.35 caused the melt to finish early and then "stop" while scroll lock continued.)
      const target = raw;
      s.target = Math.max(s.target, target);

      const ease = 1.0 - Math.exp(-dt * 8.0);
      s.p += (s.target - s.p) * ease;

      if (s.p > 0.001) s.hasEverMelted = true;

      if (onScrolledChange) {
        onScrolledChange(raw > 0.1);
      }

      // Reveal hero copy as the melt progresses.
      if (contentRef.current) {
        const textProgress = Math.max(0, Math.min(1, (s.p - 0.3) / 0.6));
        const smoothText = textProgress * textProgress * (3.0 - 2.0 * textProgress);
        const yOffset = (1.0 - smoothText) * 150;

        contentRef.current.style.opacity = smoothText.toFixed(3);
        contentRef.current.style.transform = `translate3d(0, ${yOffset.toFixed(1)}px, 0)`;
        contentRef.current.style.pointerEvents = smoothText > 0.8 ? "auto" : "none";
      }

      /* ---------------- RENDER ---------------- */
      const progress01 = Math.max(0, Math.min(1, s.p));
      const timeVal = progress01 * 1.25;

      const W = gl.drawingBufferWidth;
      const H = gl.drawingBufferHeight;

      const prevMask = s.ping === 0 ? s.maskTexA : s.maskTexB;
      const nextMask = s.ping === 0 ? s.maskTexB : s.maskTexA;
      const nextFB = s.ping === 0 ? s.fbB : s.fbA;

      gl.bindFramebuffer(gl.FRAMEBUFFER, nextFB);
      gl.viewport(0, 0, W, H);
      gl.disable(gl.BLEND);
      gl.useProgram(s.maskProg);
      gl.uniform2f(s.u_mask.res, W, H);
      gl.uniform2f(s.u_mask.imgRes, s.imgW, s.imgH);
      if (s.u_mask.cover) gl.uniform1f(s.u_mask.cover, s.cover);
      gl.uniform1f(s.u_mask.time, timeVal);
      gl.uniform1f(s.u_mask.anim, anim);
      gl.uniform1f(s.u_mask.seed, s.seed);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, s.logoTex);
      gl.uniform1i(s.u_mask.logo, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, prevMask);
      gl.uniform1i(s.u_mask.prevMask, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, s.sceneFB);
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(s.renderProg);
      gl.uniform2f(s.u_render.res, W, H);
      gl.uniform2f(s.u_render.imgRes, s.imgW, s.imgH);
      if (s.u_render.cover) gl.uniform1f(s.u_render.cover, s.cover);
      gl.uniform1f(s.u_render.anim, anim);
      gl.uniform1f(s.u_render.seed, s.seed);
      gl.uniform1f(s.u_render.progress, progress01);
      gl.uniform3f(s.u_render.brand, brandLin[0], brandLin[1], brandLin[2]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, s.logoTex);
      gl.uniform1i(s.u_render.logo, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, nextMask);
      gl.uniform1i(s.u_render.mask, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(s.postProg);
      gl.uniform2f(s.u_post.res, W, H);
      gl.uniform1f(s.u_post.anim, anim);
      gl.uniform1f(s.u_post.seed, s.seed + timeVal * 10.0);
      gl.uniform1f(s.u_post.progress, progress01);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, s.sceneTex);
      gl.uniform1i(s.u_post.scene, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      s.ping = 1 - s.ping;

      // Do not freeze immediately at completion; keep the subtle flow running until the hero
      // actually leaves the viewport (IntersectionObserver will pause rendering offscreen).

      // If the user hasn't started the melt (no wheel/touch input), render a stable first frame
      // then freeze to avoid a continuous RAF/WebGL loop during Lighthouse.
      if (!s.hasEverMelted && !s.lockActive && !s.lockDone && s.virtualScroll <= 0.5) {
        s.freeze = true;
        window.__slowdrag_heroRafRunning = false;
        return;
      }

      window.__slowdrag_heroRafRunning = true;
      if (loopRef.current && s.inView && s.pageVisible) s.raf = requestAnimationFrame(loopRef.current);
    };

    return () => {
      loopRef.current = null;
    };
  }, [brandColor, brandLin, onScrolledChange]);

  // Pause/resume the WebGL loop when the hero leaves the viewport or when the tab is hidden.
  useEffect(() => {
    const s = S.current;
    const el = containerRef.current;
    if (!el) return;

    const updateRunState = () => {
      if (!s.pageVisible || !s.inView) {
        cancelAnimationFrame(s.raf);
        window.__slowdrag_heroRafRunning = false;
        return;
      }
      if (s.freeze) {
        window.__slowdrag_heroRafRunning = false;
        return;
      }
      if (loopRef.current && s.loaded) {
        cancelAnimationFrame(s.raf);
        window.__slowdrag_heroRafRunning = true;
        s.raf = requestAnimationFrame(loopRef.current);
      }
    };

    const onVis = () => {
      s.pageVisible = !document.hidden;
      updateRunState();
    };
    document.addEventListener("visibilitychange", onVis);

    const io = new IntersectionObserver(
      (entries) => {
        s.inView = entries[0]?.isIntersecting ?? true;
        updateRunState();
      },
      { threshold: 0.01 }
    );
    io.observe(el);

    // initialize
    s.pageVisible = !document.hidden;
    updateRunState();

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
    };
  }, []);

  /* ---------------- NATIVE SCROLL LISTENER ---------------- */
  useEffect(() => {
    const onScroll = () => {
      const s = S.current;
      if (s.lockActive && !s.lockDone) {
        // Don’t fight the browser immediately; batch to rAF
        scheduleFixScroll();
        s.scrollY = s.lockScrollY;
        return;
      }
      s.scrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-lock: intercept wheel/touch while hero is on screen.
  useEffect(() => {
    const s = S.current;
    let lastTouchY = 0;

    let detached = false;
    const prevOverscroll = document.documentElement.style.overscrollBehaviorY;
    const detach = () => {
      if (detached) return;
      detached = true;
      document.documentElement.style.overscrollBehaviorY = prevOverscroll;
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };

    const shouldLockNow = () => {
      if (s.lockDone) return false;
      const el = containerRef.current;
      if (!el) return false;
      const winH = (window.visualViewport?.height ?? window.innerHeight) || 900;
      const rect = el.getBoundingClientRect();
      return rect.top <= 0 && rect.bottom >= winH * 0.85;
    };

    const applyDelta = (dy: number) => {
      const winH = (window.visualViewport?.height ?? window.innerHeight) || 900;
      const lockDistance = s.lockDistance > 0 ? s.lockDistance : winH * 1.35;

      s.virtualScroll = Math.max(0, Math.min(lockDistance, s.virtualScroll + dy));

      if (s.virtualScroll >= lockDistance - 1) {
        if (!s.lockDone) {
          s.lockDone = true;
          s.lockActive = false;

          // Ensure the melt reaches the final state exactly at the end of the lock.
          s.target = 1.0;
          s.p = 1.0;
          s.hasEverMelted = true;

          // Detach heavy listeners as soon as the melt is done.
          detach();

          if (!meltFinishedOnceRef.current) {
            meltFinishedOnceRef.current = true;
            onMeltFinishedRef.current?.();
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!shouldLockNow()) return;
      if (!s.lockActive) {
        s.lockActive = true;
        s.lockScrollY = window.scrollY;
        // Cache once per lock so the end point doesn't drift.
        const baseH = (window.visualViewport?.height ?? window.innerHeight) || 900;
        s.lockDistance = baseH * 1.35;
      }
      if (s.freeze) {
        s.freeze = false;
        if (loopRef.current && s.loaded && s.pageVisible) {
          cancelAnimationFrame(s.raf);
          s.raf = requestAnimationFrame(loopRef.current);
        }
      }
      e.preventDefault();
      applyDelta(e.deltaY);
      scheduleFixScroll();
    };

    const onTouchStart = (e: TouchEvent) => {
      if (shouldLockNow() && !s.lockActive) {
        s.lockActive = true;
        s.lockScrollY = window.scrollY;
        const baseH = (window.visualViewport?.height ?? window.innerHeight) || 900;
        s.lockDistance = baseH * 1.35;
      }
      lastTouchY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!shouldLockNow()) return;
      if (!s.lockActive) {
        s.lockActive = true;
        s.lockScrollY = window.scrollY;
      }
      if (s.freeze) {
        s.freeze = false;
        if (loopRef.current && s.loaded && s.pageVisible) {
          cancelAnimationFrame(s.raf);
          s.raf = requestAnimationFrame(loopRef.current);
        }
      }
      const y = e.touches[0]?.clientY ?? lastTouchY;
      const dy = lastTouchY - y;
      lastTouchY = y;
      e.preventDefault();
      applyDelta(dy);
      scheduleFixScroll();
    };

    document.documentElement.style.overscrollBehaviorY = "none";

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      detach();
    };
  }, []);

  /* ---------------- WEBGL INIT ---------------- */
  useEffect(() => {
    if (!siteLoaded || !afterFirstPaint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let started = false;
    let cleanup: (() => void) | null = null;
    let idleId: number | undefined;
    let timeoutId = 0;

    let inViewForStart = false;
    let startArmed = false;

    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const dispatchHeroReadyOnce = () => {
      if (heroReadyOnceRef.current) return;
      heroReadyOnceRef.current = true;
      window.dispatchEvent(new Event("slowdrag:heroReady"));
    };

    const startNow = () => {
      if (cancelled || started) return;

      // Only start the heavy WebGL work if the hero is actually in view.
      if (!inViewForStart) {
        startArmed = true;
        return;
      }

      started = true;

      if (idleId !== undefined && typeof w.cancelIdleCallback === "function") w.cancelIdleCallback(idleId);
      window.clearTimeout(timeoutId);

      (async () => {
        const mod = await import("./HeroMeltWebGLRuntime");
        if (cancelled) return;

        cleanup = mod.startHeroMeltWebGL({
          canvas,
          imageSrc,
          state: S.current,
          getLoop: () => loopRef.current,
          onHeroReady: dispatchHeroReadyOnce,
        });
      })();
    };

    const onInteraction = () => startNow();
    window.addEventListener("pointerdown", onInteraction, { passive: true, once: true });
    window.addEventListener("wheel", onInteraction, { passive: true, once: true });
    window.addEventListener("touchstart", onInteraction, { passive: true, once: true });
    window.addEventListener("keydown", onInteraction, { passive: true, once: true });

    // Prefer idle to keep PSI/Lighthouse TBT low.
    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(startNow, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(startNow, 2500);
    }

    // Track visibility for start gating.
    const el = containerRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        inViewForStart = entries[0]?.isIntersecting ?? false;
        if (inViewForStart && startArmed) startNow();
      },
      { threshold: 0.01 }
    );
    if (el) io.observe(el);

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("wheel", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
      window.removeEventListener("keydown", onInteraction);

      if (idleId !== undefined && typeof w.cancelIdleCallback === "function") w.cancelIdleCallback(idleId);
      window.clearTimeout(timeoutId);
      io.disconnect();
      cleanup?.();
    };
  }, [afterFirstPaint, imageSrc, siteLoaded]);

  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.("(max-width: 768px)");
    if (!mql) return;

    const onChange = () => setIsSmallScreen(mql.matches);
    onChange();

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    // Legacy Safari
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  const edgePad = "clamp(12px, 3.2vw, 36px)";
  const bottomPad = `calc(${edgePad} + env(safe-area-inset-bottom, 0px))`;
  const leftPad = `calc(${edgePad} + env(safe-area-inset-left, 0px))`;
  const rightPad = `calc(${edgePad} + env(safe-area-inset-right, 0px))`;

  const posterBoxW = `min(${posterWidth}px, 88vw)`;
  const posterBoxH = `min(${Math.max(1, Math.round(posterHeight * 0.867))}px, 40vh)`;

  const posterIsSvg = /\.svg(\?|#|$)/i.test(imageSrc);

  return (
    <section
      ref={containerRef}
      style={{
        height: "100svh",
        minHeight: "100vh",
        width: "100%",
        background: "#000",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100svh",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transform: "translateZ(0)",
        }}
      >
        {/* ✅ DOM poster for LCP (canvas often leads to NO_LCP) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            width: posterBoxW,
            height: posterBoxH,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <Image
            src={imageSrc}
            alt={posterAlt}
            fill
            priority
            unoptimized={posterIsSvg}
            quality={85}
            fetchPriority="high"
            sizes="(max-width: 768px) 88vw, (max-width: 1200px) 1200px, 1920px"
            style={{
              objectFit: "contain",
              opacity: showPoster ? 1 : 0,
              transition: "opacity 420ms ease",
              filter: "contrast(1.02) saturate(1.02)",
            }}
          />
        </div>

        {/* Caption and Contact button */}
        <div
          aria-hidden={!showCaption}
          style={{
            position: "absolute",
            left: leftPad,
            bottom: bottomPad,
            zIndex: 10,
            pointerEvents: "none",
            opacity: showCaption ? 1 : 0,
            transition: "opacity 450ms ease",
            color: "#fff",
            fontFamily: "var(--font-offbit), monospace",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            lineHeight: 1.15,
            fontSize: "clamp(22px, 2.2vw, 34px)",
            maxWidth: "min(44vw, 520px)",
            whiteSpace: "pre-line",
          }}
        >
          {"\u201cIMAGES BREATHE\nBEFORE THEY\nSPEAK\u201d"}
        </div>

        <div
          aria-hidden={!showCaption}
          style={{
            position: "absolute",
            right: rightPad,
            top: isSmallScreen ? "75%" : "50%",
            transform: "translate3d(0,-50%,0)",
            zIndex: 10,
            pointerEvents: "none",
            opacity: showCaption ? 1 : 0,
            transition: "opacity 450ms ease",
            color: "#fff",
            fontFamily: "var(--font-offbit), monospace",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            lineHeight: 1.15,
            fontSize: "clamp(18px, 1.8vw, 28px)",
            maxWidth: "min(42vw, 520px)",
            whiteSpace: "pre-line",
            textAlign: "right",
          }}
        >
          {"RHYTHM\nRESISTANCE.\nREMEMBRANCE,"}
        </div>

        <button
          type="button"
          aria-label="Contact us"
          onClick={() => router.push("/contact")}
          style={{
            position: "absolute",
            right: rightPad,
            bottom: bottomPad,
            zIndex: 10,
            opacity: showCaption ? 1 : 0,
            transition: "opacity 450ms ease",
            pointerEvents: showCaption ? "auto" : "none",
            background: "transparent",
            border: `2px solid ${brandColor}`,
            borderRadius: 999,
            padding: "clamp(9px, 1.2vw, 12px) clamp(14px, 1.6vw, 20px)",
            color: "#fff",
            fontFamily: "var(--font-offbit), monospace",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontSize: "clamp(14px, 1.2vw, 18px)",
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          CONTACT US
        </button>

        {/* MANIFESTO TEXT CONTAINER (Controlled by WebGL Loop) */}
        <div
          ref={contentRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
            opacity: 0,
            pointerEvents: "none",
            willChange: "transform, opacity",
          }}
        >
          {children}
        </div>

        <div
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "2000px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              pointerEvents: "none",
              transform: "translateZ(0)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
