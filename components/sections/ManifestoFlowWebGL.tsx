"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ManifestoFlowWebGLProps = {
  brandColor?: string;
  /** becomes true once hero has “touched / finished” and you want the manifesto to arm */
  armed?: boolean;
};

const MANIFESTO_COPY =
  "Slow Drag Studios is a creative design and film studio built against haste. Our work resists the algorithmic urge to rush, flatten, simplify. We work in pulse, not tempo. In memory, not noise. We make films, images, and systems of design that stay long after the scroll ends.";

// Match the exact line breaks from the reference screenshot.
const MANIFESTO_LINES = [
  "SLOW DRAG STUDIOS IS A CREATIVE DESIGN",
  "AND FILM STUDIO BUILT AGAINST HASTE. OUR",
  "WORK RESISTS THE ALGORITHMIC URGE TO",
  "RUSH, FLATTEN, SIMPLIFY.",
  "WE WORK IN PULSE, NOT TEMPO. IN MEMORY,",
  "NOT NOISE. WE MAKE FILMS, IMAGES, AND",
  "SYSTEMS OF DESIGN THAT STAY LONG AFTER",
  "THE SCROLL ENDS.",
];

// Letter spacing (tracking) as a fraction of font size.
const TRACKING_FACTOR = 0.11;

// ✅ Requested: full fade-in to the same flow color in 3 seconds
const REVEAL_SECONDS = 3.0;
// Start the reveal/fade a little later to avoid feeling early
const REVEAL_DELAY_MS = 600;

/* ---------------- Color Helpers ---------------- */
function srgbToLinear(c: number) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function clamp255(v: number) {
  return Math.max(0, Math.min(255, v));
}

function hexToRgb255(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const v = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return [0, 0, 0];
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return [r, g, b];
}

function rgb255ToLinear(rgb: [number, number, number]): [number, number, number] {
  return [srgbToLinear(rgb[0] / 255), srgbToLinear(rgb[1] / 255), srgbToLinear(rgb[2] / 255)];
}

function mixRgb255(a: [number, number, number], b: [number, number, number], t: number) {
  const tt = Math.max(0, Math.min(1, t));
  return [
    clamp255(Math.round(a[0] * (1 - tt) + b[0] * tt)),
    clamp255(Math.round(a[1] * (1 - tt) + b[1] * tt)),
    clamp255(Math.round(a[2] * (1 - tt) + b[2] * tt)),
  ] as [number, number, number];
}

function hexToLinearRGB(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const v = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return [0.0, 0.0, 0.0];
  const r = parseInt(v.slice(0, 2), 16) / 255;
  const g = parseInt(v.slice(2, 4), 16) / 255;
  const b = parseInt(v.slice(4, 6), 16) / 255;
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

// Slightly white-red tint for the manifesto “text color” (the flow behind the cutout).
const MANIFESTO_TINT_SRGB: [number, number, number] = [255, 240, 243];
const MANIFESTO_TINT_MIX = 0.65;

/* ---------------- WebGL Helpers ---------------- */
function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function createProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;

  const pr = gl.createProgram();
  if (!pr) return null;

  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  gl.linkProgram(pr);

  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(pr));
    gl.deleteProgram(pr);
    return null;
  }

  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return pr;
}

/* ---------------- Shaders ---------------- */
const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// ✅ Changed: instead of “top->bottom reveal”, we do a uniform 3s fade.
// The canvas is still masked to text via CSS mask-image, so it reads as “text color fades in”.
const FRAG = `
precision mediump float;

varying vec2 v_uv;
uniform float u_time;
uniform vec3 u_color;
uniform float u_reveal;

float hash21(vec2 p){
  p = fract(p*vec2(123.34, 345.45));
  p += dot(p, p+34.345);
  return fract(p.x*p.y);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0,0.0));
  float c = hash21(i + vec2(0.0,1.0));
  float d = hash21(i + vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
}

float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  for(int i=0;i<5;i++){
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = v_uv;

  // animated flow field
  float t = u_time;
  vec2 p = uv * vec2(1.2, 1.0);
  // Softer wobble to reduce visible jitter
  p.x += 0.06*sin(t*0.8 + uv.y*3.0);
  p.y += 0.09*cos(t*0.65 + uv.x*2.0);

  float n = fbm(p*3.2 + vec2(0.0, t*0.25));
  float n2 = fbm(p*6.2 - vec2(t*0.18, 0.0));

  float flow = smoothstep(0.25, 0.9, n*0.7 + n2*0.3);

  // ✅ Uniform reveal (fade) 0..1
  float r = clamp(u_reveal, 0.0, 1.0);
  float revealMask = r;

  vec3 col = u_color;
  // Subtle highlight to avoid blinking
  col += 0.06*vec3(1.0, 0.9, 1.0) * n2;

  vec3 rgb = col * (0.35 + 0.65 * flow);

  // Fade BOTH rgb + alpha so the text comes from “nothing” to full color.
  gl_FragColor = vec4(rgb * revealMask, revealMask);
}
`;

/* ---------------- Mask Helpers (Tracked Text) ---------------- */
function measureTracked(ctx: CanvasRenderingContext2D, text: string, trackingPx: number) {
  if (!text) return 0;
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    w += ctx.measureText(text[i]!).width;
    if (i !== text.length - 1) w += trackingPx;
  }
  return w;
}

function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  trackingPx: number
) {
  let xx = x;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    ctx.fillText(ch, xx, y);
    xx += ctx.measureText(ch).width + (i === text.length - 1 ? 0 : trackingPx);
  }
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export default function ManifestoFlowWebGL({
  brandColor = "#c6376c",
  armed = false,
}: ManifestoFlowWebGLProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackTextRef = useRef<HTMLDivElement | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const [ready, setReady] = useState(false);
  const [textMaskUrl, setTextMaskUrl] = useState<string | null>(null);
  const readyRef = useRef(false);
  const maskReadyRef = useRef(false);

  const didInitRef = useRef(false);
  const inViewRef = useRef(false);

  // Reveal state (smoothed)
  const revealTargetRef = useRef(0);
  const revealPRef = useRef(0);

  // When armed, anchor start so reveal begins at 0 exactly at that moment
  const revealAnchorTopRef = useRef<number | null>(null);
  const revealCompletedRef = useRef(false);

  // Time that only advances while in view (prevents jumping)
  const t0Ref = useRef<number>(0);
  const elapsedMsRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastFrameMsRef = useRef<number>(0);
  const fadeRef = useRef(0);

  const armedRef = useRef(armed);

  useEffect(() => {
    armedRef.current = armed;
    if (armed) {
      revealAnchorTopRef.current = null;
      revealCompletedRef.current = false;
      revealTargetRef.current = 0;
      revealPRef.current = 0;
      fadeRef.current = 0;
    }
  }, [armed]);

  const flowRgb255 = useMemo(() => {
    const base = hexToRgb255(brandColor);
    return mixRgb255(base, MANIFESTO_TINT_SRGB, MANIFESTO_TINT_MIX);
  }, [brandColor]);

  const flowRgbLinear = useMemo(() => rgb255ToLinear(flowRgb255), [flowRgb255]);
  const flowRgbCss = useMemo(
    () => `${flowRgb255[0]} ${flowRgb255[1]} ${flowRgb255[2]}`,
    [flowRgb255]
  );

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl || didInitRef.current) return;
    didInitRef.current = true;

    const canvas = canvasEl;
    const section = canvasEl.parentElement as HTMLElement | null;
    if (!section) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const supportsMask =
      typeof CSS !== "undefined" &&
      (CSS.supports("mask-image", 'url("data:image/png;base64,iVBORw0KGgo=")') ||
        CSS.supports("-webkit-mask-image", 'url("data:image/png;base64,iVBORw0KGgo=")'));

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    if (!supportsMask || !gl) {
      setUseFallback(true);

      const el = fallbackTextRef.current;
      if (!el) return;

      const start = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;

        // resume active-time clock
        t0Ref.current = performance.now();
        lastFrameMsRef.current = 0;
        rafRef.current = requestAnimationFrame(renderFallback);
      };

      const stop = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;

        // pause active-time clock
        const now = performance.now();
        if (t0Ref.current) {
          elapsedMsRef.current += Math.max(0, now - t0Ref.current);
          t0Ref.current = 0;
        }
      };

      const io = new IntersectionObserver(
        (entries) => {
          const next = entries[0]?.isIntersecting ?? false;
          inViewRef.current = next;
          if (next) start();
          else stop();
        },
        { threshold: 0.15 }
      );
      io.observe(section);

      const renderFallback = () => {
        if (!inViewRef.current) return;

        const now = performance.now();
        if (!t0Ref.current) t0Ref.current = now;
        const activeMs = elapsedMsRef.current + Math.max(0, now - t0Ref.current);

        const dtMs = lastFrameMsRef.current ? now - lastFrameMsRef.current : 16.7;
        lastFrameMsRef.current = now;
        const dt = Math.max(0.001, Math.min(0.05, dtMs / 1000));

        let target = 0;
        if (prefersReducedMotion) {
          target = armedRef.current ? 1 : 0;
        } else if (armedRef.current) {
          const rect = section.getBoundingClientRect();
          const vh = Math.max(1, window.innerHeight || 1);

          if (revealAnchorTopRef.current == null) {
            revealAnchorTopRef.current = rect.top;
          }

          const travelPx = revealAnchorTopRef.current - rect.top;
          const revealPxPerSecond = vh * 0.55;
          const delayPxPerSecond = vh * 0.35;
          const delayPx = (REVEAL_DELAY_MS / 1000) * delayPxPerSecond;
          const distancePx = Math.max(1, REVEAL_SECONDS * revealPxPerSecond);

          const raw = (travelPx - delayPx) / distancePx;
          target = clamp01(raw);

          if (!revealCompletedRef.current && target >= 0.999) {
            revealCompletedRef.current = true;
            target = 1;
          }
          if (revealCompletedRef.current) target = 1;
        }

        revealTargetRef.current = target;

        revealPRef.current =
          revealPRef.current +
          (revealTargetRef.current - revealPRef.current) * (1 - Math.exp(-dt * 9.0));

        const revealLinear = prefersReducedMotion ? (armedRef.current ? 1 : 0) : revealPRef.current;
        const reveal = revealLinear * revealLinear * (3.0 - 2.0 * revealLinear);

        let fadeTarget = reveal;
        if (fadeTarget < fadeRef.current) fadeTarget = fadeRef.current;
        fadeRef.current += (fadeTarget - fadeRef.current) * (1 - Math.exp(-dt * 3.5));

        el.style.opacity = String(fadeRef.current);
        rafRef.current = requestAnimationFrame(renderFallback);
      };

      return () => {
        io.disconnect();
        stop();
      };
    }

    const prog = createProgram(gl, VERT, FRAG);
    if (!prog) return;

    const aPos = gl.getAttribLocation(prog, "a_pos");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uColor = gl.getUniformLocation(prog, "u_color");
    const uReveal = gl.getUniformLocation(prog, "u_reveal");

    const tri = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tri);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    // Build the text mask as a data URL (used as CSS mask-image on the canvas)
    const maskCanvas = document.createElement("canvas");
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    const resizeAndRedrawMask = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const rect = section.getBoundingClientRect();
      const wCss = Math.max(1, rect.width);
      const hCss = Math.max(1, rect.height);
      const w = Math.floor(wCss * dpr);
      const h = Math.floor(hCss * dpr);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        gl.viewport(0, 0, w, h);
      }

      maskCanvas.width = w;
      maskCanvas.height = h;

      maskCtx.setTransform(1, 0, 0, 1, 0, 0);
      maskCtx.clearRect(0, 0, w, h);

      // CSS mask uses alpha. Background transparent, draw ONLY text as opaque white.
      maskCtx.globalCompositeOperation = "source-over";

      const fontVar = getComputedStyle(document.body).getPropertyValue("--font-offbit").trim();
      const fontFamily = fontVar || "system-ui";

      // Size logic: big, but auto-scales down if it overflows
      let fontSize = 30 * dpr;
      let lineHeight = fontSize * 1.85;
      let tracking = fontSize * TRACKING_FACTOR;

      const maxTextWidth = Math.min(1100 * dpr, w * 0.94);
      const maxTextHeight = h;

      maskCtx.textBaseline = "top";
      maskCtx.fillStyle = "white";

      for (let attempt = 0; attempt < 6; attempt++) {
        maskCtx.font = `700 ${fontSize}px ${fontFamily}`;
        const totalH = MANIFESTO_LINES.length * lineHeight;
        const widest = Math.max(...MANIFESTO_LINES.map((l) => measureTracked(maskCtx, l, tracking)));

        if (totalH <= maxTextHeight && widest <= maxTextWidth) break;

        const scale = Math.min(
          maxTextHeight / Math.max(1, totalH),
          maxTextWidth / Math.max(1, widest)
        );

        fontSize *= scale;
        lineHeight = fontSize * 1.55;
        tracking = fontSize * TRACKING_FACTOR;
      }

      const totalH = MANIFESTO_LINES.length * lineHeight;
      const startY = (h - totalH) * 0.5;

      for (let i = 0; i < MANIFESTO_LINES.length; i++) {
        const line = MANIFESTO_LINES[i]!;
        maskCtx.font = `700 ${fontSize}px ${fontFamily}`;
        const wLine = measureTracked(maskCtx, line, tracking);
        const x = (w - wLine) * 0.5;
        const y = startY + i * lineHeight;
        drawTrackedText(maskCtx, line, x, y, tracking);
      }

      setTextMaskUrl(maskCanvas.toDataURL("image/png"));
      maskReadyRef.current = true;
    };

    const ro = new ResizeObserver(() => {
      if (!inViewRef.current) return;
      requestAnimationFrame(resizeAndRedrawMask);
    });
    ro.observe(section);

    const start = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      // resume active-time clock
      t0Ref.current = performance.now();
      lastFrameMsRef.current = 0;

      resizeAndRedrawMask();
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      // pause active-time clock
      const now = performance.now();
      if (t0Ref.current) {
        elapsedMsRef.current += Math.max(0, now - t0Ref.current);
        t0Ref.current = 0;
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        const next = entries[0]?.isIntersecting ?? false;
        inViewRef.current = next;
        if (next) start();
        else stop();
      },
      { threshold: 0.15 }
    );
    io.observe(section);

    const render = () => {
      if (!inViewRef.current) return;

      const now = performance.now();
      const base = t0Ref.current || now;
      const activeMs = elapsedMsRef.current + Math.max(0, now - base);

      // dt for smoothing
      const dtMs = lastFrameMsRef.current ? now - lastFrameMsRef.current : 16.7;
      lastFrameMsRef.current = now;
      const dt = Math.max(0.001, Math.min(0.05, dtMs / 1000));

      // ✅ Reveal target ONLY AFTER armed
      let target = 0;

      if (prefersReducedMotion) {
        target = armedRef.current ? 1 : 0;
      } else if (armedRef.current) {
        // Scroll-synced reveal (feels linked to the hero melt scroll, not a timer)
        const rect = section.getBoundingClientRect();
        const vh = Math.max(1, window.innerHeight || 1);

        // Anchor the reveal at the moment the section first becomes visible after arming.
        if (revealAnchorTopRef.current == null) {
          revealAnchorTopRef.current = rect.top;
        }

        const travelPx = revealAnchorTopRef.current - rect.top;

        // Reuse existing tuning knobs:
        // - delay is a small scroll distance before reveal starts
        // - "seconds" maps to a scroll distance so the feel matches previous pacing
        // NOTE: Increasing this value makes the reveal slower (more scroll needed).
        const revealPxPerSecond = vh * 0.55;
        // Keep the delay feel consistent even if we retune reveal speed.
        const delayPxPerSecond = vh * 0.35;
        const delayPx = (REVEAL_DELAY_MS / 1000) * delayPxPerSecond;
        const distancePx = Math.max(1, REVEAL_SECONDS * revealPxPerSecond);

        const raw = (travelPx - delayPx) / distancePx;
        target = clamp01(raw);

        if (!revealCompletedRef.current && target >= 0.999) {
          revealCompletedRef.current = true;
          target = 1;
        }
        if (revealCompletedRef.current) target = 1;
      }

      revealTargetRef.current = target;

      // Smooth reveal
      revealPRef.current =
        revealPRef.current +
        (revealTargetRef.current - revealPRef.current) * (1 - Math.exp(-dt * 9.0));

      const revealLinear = prefersReducedMotion ? (armedRef.current ? 1 : 0) : revealPRef.current;

      // Ease-in-out for smoother start/end.
      const reveal = revealLinear * revealLinear * (3.0 - 2.0 * revealLinear);

      // Keep glow synced to reveal amount
      canvas.style.setProperty("--mf-glow", String(reveal));
      // Monotonic, smoothed fade to avoid visible blinking
      let fadeTarget = reveal;
      if (fadeTarget < fadeRef.current) fadeTarget = fadeRef.current; // never decrease
      fadeRef.current += (fadeTarget - fadeRef.current) * (1 - Math.exp(-dt * 3.5));
      canvas.style.opacity = maskReadyRef.current ? String(fadeRef.current) : "0";

      // Draw
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, tri);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      // time in seconds (active-only)
      const t = activeMs / 1000;

      if (uTime) gl.uniform1f(uTime, t);
      if (uColor) gl.uniform3f(uColor, flowRgbLinear[0], flowRgbLinear[1], flowRgbLinear[2]);
      if (uReveal) gl.uniform1f(uReveal, reveal);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!readyRef.current) {
        readyRef.current = true;
        setReady(true);
      }

      rafRef.current = requestAnimationFrame(render);
    };

    return () => {
      io.disconnect();
      ro.disconnect();
      stop();
      gl.deleteBuffer(tri);
      gl.deleteProgram(prog);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowRgbLinear]);

  return (
    <section
      aria-label="Manifesto"
      aria-describedby="manifesto-a11y"
      style={
        {
        minHeight: "70vh",
        background: "#000",
        display: "grid",
        placeItems: "center",
        padding: 0,
        position: "relative",
        overflow: "hidden",
        "--flow-color-rgb": flowRgbCss,
        } as React.CSSProperties
      }
    >
      {/* Accessible text (not visible) */}
      <p
        id="manifesto-a11y"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {MANIFESTO_COPY}
      </p>

      {/* WebGL canvas (masked to text so the flow only appears in the “holes”) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          display: useFallback ? "none" : "block",
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: 0,
          willChange: "opacity",
          zIndex: 0,

          WebkitMaskImage: textMaskUrl ? `url(${textMaskUrl})` : undefined,
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          WebkitMaskSize: "100% 100%",

          maskImage: textMaskUrl ? `url(${textMaskUrl})` : undefined,
          maskRepeat: "no-repeat",
          maskPosition: "center",
          maskSize: "100% 100%",

          filter:
            "drop-shadow(0 0 calc(10px * var(--mf-glow, 0)) rgb(var(--flow-color-rgb) / 0.35)) drop-shadow(0 0 calc(22px * var(--mf-glow, 0)) rgb(var(--flow-color-rgb) / 0.14))",
        }}
      />

      {/* Fallback (mobile / no WebGL / no mask support): render real text */}
      <div
        ref={fallbackTextRef}
        aria-hidden={!useFallback}
        style={{
          display: useFallback ? "grid" : "none",
          placeItems: "center",
          textAlign: "center",
          padding: "0 20px",
          width: "100%",
          zIndex: 1,
          opacity: 0,
          color: `rgb(${flowRgbCss} / 0.95)`,
          filter:
            "drop-shadow(0 0 calc(10px * var(--mf-glow, 0)) rgb(var(--flow-color-rgb) / 0.35)) drop-shadow(0 0 calc(22px * var(--mf-glow, 0)) rgb(var(--flow-color-rgb) / 0.14))",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            lineHeight: 1.55,
            letterSpacing: "0.11em",
            fontSize: "clamp(14px, 3.2vw, 28px)",
            maxWidth: "1100px",
          }}
        >
          {MANIFESTO_LINES.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
