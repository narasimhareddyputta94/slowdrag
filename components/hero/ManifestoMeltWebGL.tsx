"use client";

import { useEffect, useMemo, useRef } from "react";

type ManifestoMeltWebGLProps = {
  brandColor?: string;
};

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

function rgbaFromHex(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  const aa = Math.max(0, Math.min(1, a));
  return `rgba(${r}, ${g}, ${b}, ${aa})`;
}

export default function ManifestoMeltWebGL({
  brandColor = "#c6376c",
}: ManifestoMeltWebGLProps) {
  const rafRef = useRef<number | null>(null);
  const seedRef = useRef<number>(0);
  const t0Ref = useRef<number>(0);
  const inViewRef = useRef<boolean>(false);

  // Smooth progress (Hero-like damp): makes the reveal feel premium.
  const lastFrameMsRef = useRef<number>(0);
  const revealTargetRef = useRef<number>(0);
  const revealPRef = useRef<number>(0);

  const smootherstep01 = (x: number) => {
    const t = Math.max(0, Math.min(1, x));
    return t * t * t * (t * (t * 6 - 15) + 10);
  };

  const flowRgb = useMemo(() => hexToRgb(brandColor), [brandColor]);

  // Keep global flow color in sync so CSS fallbacks match.
  useEffect(() => {
    document.documentElement.style.setProperty("--flow-color", brandColor);
    document.documentElement.style.setProperty(
      "--flow-color-rgb",
      `${flowRgb.r} ${flowRgb.g} ${flowRgb.b}`
    );
  }, [brandColor, flowRgb]);

  // Drive the same “liquid behind cutout text” animation used on the home page.
  useEffect(() => {
    const manifestoSection = document.querySelector(
      'section[aria-label="Manifesto"]'
    ) as HTMLElement | null;

    if (!manifestoSection) return;

    if (!seedRef.current) seedRef.current = Math.random() * 1000;

    const start = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // Always restart from 0 when the section re-enters view.
      t0Ref.current = performance.now();
      lastFrameMsRef.current = 0;
      revealTargetRef.current = 0;
      revealPRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!rafRef.current) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const tick = () => {
      if (!inViewRef.current) {
        stop();
        return;
      }

      const now = performance.now();
      const anim = (now - t0Ref.current) / 1000;

      // Frame-rate independent smoothing (mirrors HeroMelt's feel).
      if (!lastFrameMsRef.current) lastFrameMsRef.current = now;
      const dt = Math.max(0, Math.min(0.06, (now - lastFrameMsRef.current) * 0.001));
      lastFrameMsRef.current = now;

      // Ramp in smoothly over a few seconds; then stay fully revealed.
      const revealSeconds = 6.5;
      revealTargetRef.current = Math.min(
        1,
        revealTargetRef.current + dt / Math.max(0.001, revealSeconds)
      );
      const damp = 1.0 - Math.exp(-dt * 8.0);
      revealPRef.current += (revealTargetRef.current - revealPRef.current) * damp;
      const tSmooth = smootherstep01(revealPRef.current);

      manifestoSection.style.backgroundColor = "#000";

      // Keep strong readable highlight while still feeling like back-lit liquid.
      const baseAlpha = 0.92 * (0.70 + 0.30 * tSmooth);
      const strongAlpha = 1.0 * (0.70 + 0.30 * tSmooth);

      const baseMolten = rgbaFromHex(brandColor, baseAlpha);
      const strongMolten = rgbaFromHex(brandColor, strongAlpha);

      const whiteA1 = Math.max(0, Math.min(1, 0.16 * tSmooth));
      const whiteA2 = Math.max(0, Math.min(1, 0.08 * tSmooth));

      // Ink-drop diffusion: radius grows ~sqrt(t), with soft rings.
      // Reveal ramps in, but vertical motion should be continuous top -> bottom.
      const diff = Math.sqrt(tSmooth);

      // 0..220 is the “extended” background travel space used by the CSS layers.
      // This is a looping downward sweep so the effect reads consistently.
      // 220 units per cycle; 4 seconds per top->bottom pass => 55 units/sec
      const sweep = (anim * 55.0) % 220;
      const sweepT = sweep / 220;

      // Map sweep to CSS percent so the hotspot travels from above the section
      // to below it (looping). Add a second offset copy to make the loop seamless.
      const spotY1 = -20 + sweepT * 140;
      const spotY2 = spotY1 - 140;
      const coreA = Math.max(0, Math.min(1, 0.95 * diff));
      const midA = Math.max(0, Math.min(1, 0.55 * diff));
      const haloA = Math.max(0, Math.min(1, 0.18 * diff));

      const spot1 = `radial-gradient(140% 120% at 50% ${spotY1}%, ${rgbaFromHex(brandColor, coreA)} 0%, ${rgbaFromHex(brandColor, midA)} 18%, ${rgbaFromHex(brandColor, haloA)} 44%, ${rgbaFromHex(brandColor, 0)} 72%)`;
      const spot2 = `radial-gradient(140% 120% at 50% ${spotY2}%, ${rgbaFromHex(brandColor, coreA)} 0%, ${rgbaFromHex(brandColor, midA)} 18%, ${rgbaFromHex(brandColor, haloA)} 44%, ${rgbaFromHex(brandColor, 0)} 72%)`;
      const cloud1 = `radial-gradient(120% 110% at 50% ${spotY1 - 10}%, ${rgbaFromHex(brandColor, haloA)} 0%, ${rgbaFromHex(brandColor, 0)} 62%)`;
      const cloud2 = `radial-gradient(120% 110% at 50% ${spotY2 - 10}%, ${rgbaFromHex(brandColor, haloA)} 0%, ${rgbaFromHex(brandColor, 0)} 62%)`;

      const seed = seedRef.current;

      const breatheFlow = 0.90 + 0.10 * Math.sin(anim * 0.22 + seed * 0.03);

      // Replace structured bands with large, drifting liquid “sheets” (radial/elliptical).
      // This removes the last obvious patterning artifacts from linear gradients.
      const sheetA = Math.max(0, Math.min(1, 0.26 * diff)) * (0.88 + 0.12 * breatheFlow);
      const sheetX = 50 + Math.sin(anim * 0.10 + seed * 0.031) * 14.0;
      const sheetY = -14 + sweepT * 138 + Math.sin(anim * 0.15 + seed * 0.019) * 9.0;
      const lanes = `radial-gradient(190% 85% at ${sheetX.toFixed(2)}% ${sheetY.toFixed(2)}%,
        ${rgbaFromHex(brandColor, (sheetA * 0.85))} 0%,
        ${rgbaFromHex(brandColor, (sheetA * 0.45))} 22%,
        ${rgbaFromHex(brandColor, (sheetA * 0.18))} 40%,
        ${rgbaFromHex(brandColor, 0)} 68%)`;

      const shimmerA = Math.max(0, Math.min(1, 0.14 * diff)) * (0.90 + 0.10 * breatheFlow);
      const shimmerX = 50 + Math.sin(anim * 0.13 + seed * 0.027) * 16.0;
      const shimmerY = -18 + sweepT * 142 + Math.sin(anim * 0.12 + seed * 0.015) * 10.0;
      const shimmer = `radial-gradient(160% 75% at ${shimmerX.toFixed(2)}% ${shimmerY.toFixed(2)}%,
        rgba(255,255,255,${(whiteA2 * 0.85).toFixed(4)}) 0%,
        rgba(255,255,255,${(whiteA1 * 0.45).toFixed(4)}) 12%,
        rgba(255,255,255,0) 42%)`;

      // Non-repeating “caustic” blob (avoid repeated rings).
      const caustA = Math.max(0, Math.min(1, 0.065 * diff)) * (0.90 + 0.10 * breatheFlow);
      const caustX = 50 + Math.sin(anim * 0.14 + seed * 0.019) * 10.0;
      const caustY = -12 + sweepT * 132 + Math.sin(anim * 0.17 + seed * 0.007) * 8.0;
      const caust = `radial-gradient(140% 95% at ${caustX.toFixed(2)}% ${caustY.toFixed(2)}%,
        rgba(255,255,255,${(caustA * 0.85).toFixed(4)}) 0%,
        rgba(255,255,255,${(caustA * 0.45).toFixed(4)}) 12%,
        rgba(255,255,255,${(caustA * 0.18).toFixed(4)}) 26%,
        rgba(255,255,255,0) 58%)`;

      // Replace repeating “barcode” currents with one big moving highlight.
      const currentA = Math.max(0, Math.min(1, 0.095 * diff));
      const curX = 50 + Math.sin(anim * 0.11 + seed * 0.022) * 10.0;
      const curY = -10 + sweepT * 128 + Math.sin(anim * 0.17 + seed * 0.014) * 7.0;
      const current = `radial-gradient(120% 70% at ${curX.toFixed(2)}% ${curY.toFixed(2)}%, rgba(255,255,255,${currentA.toFixed(4)}) 0%, rgba(255,255,255,${(currentA * 0.35).toFixed(4)}) 18%, rgba(255,255,255,0) 58%)`;

      // Replace the conic “pie slice” eddy with a soft asymmetric blob.
      const eddyA = Math.max(0, Math.min(1, 0.060 * diff));
      const eddyX = 50 + Math.sin(anim * 0.09 + seed * 0.015) * 9.0;
      const eddyY = -10 + sweepT * 120 + Math.sin(anim * 0.13 + seed * 0.010) * 7.0;
      const eddy = `radial-gradient(110% 70% at ${eddyX.toFixed(2)}% ${eddyY.toFixed(2)}%,
        rgba(255,255,255,${(eddyA * 0.55).toFixed(4)}) 0%,
        rgba(255,255,255,${(eddyA * 0.22).toFixed(4)}) 18%,
        rgba(255,255,255,${(eddyA * 0.10).toFixed(4)}) 34%,
        rgba(255,255,255,0) 62%)`;

      const fill = [spot1, spot2, cloud1, cloud2, lanes, shimmer, caust, current, eddy].join(", ");

      // Continuous flow: keep motion alive even after the initial reveal.
      const wobX1 = Math.sin(anim * 0.42 + seed * 0.01) * 6.0;
      const wobX2 = Math.sin(anim * 0.33 + 1.7 + seed * 0.02) * 8.0;
      const wobX3 = Math.sin(anim * 0.22 + 3.1 + seed * 0.03) * 4.0;
      const wobX4 = Math.sin(anim * 0.48 + 0.9 + seed * 0.015) * 10.0;
      const wobX5 = Math.sin(anim * 0.55 + 0.4 + seed * 0.011) * 12.0;
      const wobX6 = Math.sin(anim * 0.18 + 2.2 + seed * 0.017) * 3.0;
      const wobX7 = Math.sin(anim * 0.28 + 0.2 + seed * 0.021) * 5.0;

      // Continuous downward flow while in view (looping).
      const wrap220 = (v: number) => ((v % 220) + 220) % 220;
      const driftY1 = Math.sin(anim * 0.85 + seed * 0.007) * 10;
      const driftY2 = Math.sin(anim * 0.72 + 1.3 + seed * 0.009) * 12;
      const driftY3 = Math.sin(anim * 0.95 + 2.1 + seed * 0.011) * 9;
      const driftY4 = Math.sin(anim * 0.66 + 0.8 + seed * 0.013) * 14;
      const driftY5 = Math.sin(anim * 0.58 + 2.7 + seed * 0.006) * 11;
      const driftY6 = Math.sin(anim * 0.78 + 1.9 + seed * 0.008) * 13;
      const driftY7 = Math.sin(anim * 0.62 + 0.4 + seed * 0.010) * 8;

      const baseY = sweep;
      const flowY1 = wrap220(baseY + 0 + driftY1);
      const flowY2 = wrap220(baseY + 26 + driftY2);
      const flowY3 = wrap220(baseY + 52 + driftY3);
      const flowY4 = wrap220(baseY + 78 + driftY4);
      const flowY5 = wrap220(baseY + 104 + driftY5);
      const flowY6 = wrap220(baseY + 130 + driftY6);
      const flowY7 = wrap220(baseY + 156 + driftY7);

      manifestoSection.style.setProperty(
        "--mf-pos1",
        `${50 + wobX1}% ${Math.max(0, flowY1 - 24)}%`
      );
      manifestoSection.style.setProperty(
        "--mf-pos1b",
        `${50 + wobX1 * 0.65}% ${Math.max(0, flowY1 - 24)}%`
      );
      manifestoSection.style.setProperty(
        "--mf-pos2",
        `${50 + wobX2}% ${Math.max(0, flowY2 - 18)}%`
      );
      manifestoSection.style.setProperty(
        "--mf-pos2b",
        `${50 + wobX2 * 0.65}% ${Math.max(0, flowY2 - 18)}%`
      );
      manifestoSection.style.setProperty(
        "--mf-pos3",
        `${50 + wobX3}% ${Math.max(0, flowY3 - 10)}%`
      );
      manifestoSection.style.setProperty("--mf-pos4", `${50 + wobX4}% ${flowY4}%`);
      manifestoSection.style.setProperty("--mf-pos5", `${50 + wobX5}% ${flowY5}%`);
      manifestoSection.style.setProperty("--mf-pos6", `${50 + wobX6}% ${flowY6}%`);
      manifestoSection.style.setProperty(
        "--mf-pos7",
        `${50 + wobX7}% ${Math.max(0, flowY7 - 4)}%`
      );

      const breathe = 1 + Math.sin(anim * 0.30) * 0.035;
      const breathe2 = 1 + Math.sin(anim * 0.24 + 1.4) * 0.045;
      manifestoSection.style.setProperty(
        "--mf-size1",
        `${Math.round(220 * breathe)}% ${Math.round(220 * breathe)}%`
      );
      manifestoSection.style.setProperty(
        "--mf-size2",
        `${Math.round(260 * breathe2)}% ${Math.round(220 * breathe)}%`
      );
      manifestoSection.style.setProperty(
        "--mf-size3",
        `${Math.round(300 * breathe2)}% ${Math.round(240 * breathe)}%`
      );
      manifestoSection.style.setProperty(
        "--mf-size4",
        `${Math.round(260 * breathe)}% ${Math.round(220 * breathe2)}%`
      );
      manifestoSection.style.setProperty(
        "--mf-size5",
        `${Math.round(360 * breathe2)}% ${Math.round(320 * breathe2)}%`
      );
      manifestoSection.style.setProperty(
        "--mf-size6",
        `${Math.round(260 * breathe)}% ${Math.round(320 * breathe2)}%`
      );
      manifestoSection.style.setProperty(
        "--mf-size7",
        `${Math.round(280 * breathe2)}% ${Math.round(240 * breathe)}%`
      );

      const strokeA = 0.10 + 0.14 * diff;
      manifestoSection.style.setProperty(
        "--mf-stroke",
        `rgb(255 255 255 / ${strokeA.toFixed(3)})`
      );

      manifestoSection.style.setProperty("--manifesto-color", baseMolten);
      manifestoSection.style.setProperty("--manifesto-strong", strongMolten);
      manifestoSection.style.setProperty("--manifesto-fill", fill);

      // Fallback in case vars don’t cascade for any reason.
      manifestoSection.style.color = baseMolten;

      rafRef.current = requestAnimationFrame(tick);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        const nextInView = entries[0]?.isIntersecting ?? false;
        inViewRef.current = nextInView;
        if (nextInView) start();
        else stop();
      },
      { threshold: 0.15 }
    );

    obs.observe(manifestoSection);

    return () => {
      obs.disconnect();
      stop();
    };
  }, [brandColor]);

  // This component is a driver (CSS vars) and doesn't need to render DOM.
  return null;
}
