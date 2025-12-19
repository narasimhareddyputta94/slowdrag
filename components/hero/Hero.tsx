"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type HeroProps = {
  imageSrc: string; // png/jpg/webp (transparent bg, white artwork)
  onScrolledChange?: (scrolled: boolean) => void;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function smoothstep(t: number) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

type ColMeta = {
  ink: number; // 0..1
  top: number; // px
  bottom: number; // px
  delay: number;
  speed: number;
  phase: number;
  wobble: number;
  tear: number;
};

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rgb(r: number, g: number, b: number) {
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

/**
 * White -> Soft neon pink -> Hot molten pink
 * Returns an RGB string. (We keep it simple + controllable.)
 */
function waxColor(t: number) {
  t = clamp(t, 0, 1);

  // Stage 1: white -> soft neon pink
  const s1 = clamp(t / 0.45, 0, 1);
  const c1 = {
    r: mix(255, 255, s1),
    g: mix(255, 118, s1),
    b: mix(255, 196, s1),
  };

  // Stage 2: soft neon -> molten pink (hot wax tone)
  const s2 = clamp((t - 0.45) / 0.55, 0, 1);
  const c2 = {
    r: mix(c1.r, 198, s2),
    g: mix(c1.g, 55, s2),
    b: mix(c1.b, 108, s2),
  };

  return rgb(c2.r, c2.g, c2.b);
}

/**
 * Deterministic “organic” wobble based on column index + scroll progress.
 * (No time input → reverses perfectly when scrolling back.)
 */
function wobbleNoise(colIndex: number, p: number) {
  const x = colIndex * 12.9898 + p * 6.13;
  const s = Math.sin(x) * 43758.5453;
  return s - Math.floor(s); // 0..1
}

export default function Hero({ imageSrc, onScrolledChange }: HeroProps) {
  const router = useRouter();

  const heroRef = useRef<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const srcCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scratchRef = useRef<HTMLCanvasElement | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);

  const [scrolled, setScrolled] = useState(false);
  const [inHero, setInHero] = useState(true);

  const progressRef = useRef(0);
  const columnsRef = useRef<ColMeta[]>([]);
  const dimsRef = useRef({ W: 0, H: 0, block: 8, dpr: 1 });

  const rafRef = useRef<number | null>(null);
  const pendingRenderRef = useRef(false);

  const brandPink = "#c6376c";

  const getDpr = () =>
    typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;

  // scroll → melt progress (fully reversible)
  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 10;
      setScrolled(next);
      onScrolledChange?.(next);

      const meltStart = 2; // start immediately on tiny scroll
      const meltRange = window.innerHeight * 0.85;
      const p = clamp((window.scrollY - meltStart) / meltRange, 0, 1);
      progressRef.current = p;

      requestRender();
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScrolledChange]);

  // track hero visibility (optional: stops effect when hero is offscreen)
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => setInHero(entries[0]?.isIntersecting ?? true),
      { threshold: 0.15 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // load image → bake source
  useEffect(() => {
    const img = new window.Image();
    img.decoding = "async";
    img.src = imageSrc;

    img.onload = () => {
      imgRef.current = img;
      if (!srcCanvasRef.current) srcCanvasRef.current = document.createElement("canvas");
      if (!scratchRef.current) scratchRef.current = document.createElement("canvas");
      layoutAndBakeSource();
      requestRender();
    };

    img.onerror = () => console.error("Hero melt: failed to load", imageSrc);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  // responsive sizing
  useEffect(() => {
    if (!wrapRef.current) return;

    const ro = new ResizeObserver(() => {
      layoutAndBakeSource();
      requestRender();
    });

    ro.observe(wrapRef.current);

    window.addEventListener("resize", () => {
      layoutAndBakeSource();
      requestRender();
    });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", () => {
        layoutAndBakeSource();
        requestRender();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestRender = () => {
    if (pendingRenderRef.current) return;
    pendingRenderRef.current = true;

    rafRef.current = requestAnimationFrame(() => {
      pendingRenderRef.current = false;
      renderFrame();
    });
  };

  const layoutAndBakeSource = () => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const srcCanvas = srcCanvasRef.current;
    if (!wrap || !canvas || !img || !srcCanvas) return;

    const dpr = getDpr();

    // keep your original “big studio logo” feel
    const targetW = Math.min(1800, wrap.clientWidth);
    const aspect = img.naturalWidth / img.naturalHeight;
    const targetH = Math.round(targetW / aspect);

    canvas.style.width = `${targetW}px`;
    canvas.style.height = `${targetH}px`;
    canvas.width = Math.floor(targetW * dpr);
    canvas.height = Math.floor(targetH * dpr);

    srcCanvas.width = canvas.width;
    srcCanvas.height = canvas.height;

    const sctx = srcCanvas.getContext("2d");
    if (!sctx) return;

    sctx.clearRect(0, 0, srcCanvas.width, srcCanvas.height);
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(img, 0, 0, srcCanvas.width, srcCanvas.height);

    // pixel-column resolution (smaller = more premium but heavier)
    const block = Math.max(6, Math.round(7 * dpr));
    const cols = Math.ceil(srcCanvas.width / block);

    dimsRef.current = { W: srcCanvas.width, H: srcCanvas.height, block, dpr };

    // precompute column ink bounds so ONLY the artwork melts
    const data = sctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height).data;
    const threshold = 35;

    const colsMeta: ColMeta[] = new Array(cols);

    for (let c = 0; c < cols; c++) {
      const sx = c * block;
      const sw = Math.min(block, srcCanvas.width - sx);

      let inkCount = 0;
      let totalCount = 0;

      let top = srcCanvas.height;
      let bottom = 0;

      for (let x = sx; x < sx + sw; x++) {
        for (let y = 0; y < srcCanvas.height; y++) {
          const idx = (y * srcCanvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // transparent = not ink
          if (a < 10) {
            totalCount++;
            continue;
          }

          const lum = (r * 0.299 + g * 0.587 + b * 0.114) | 0;
          totalCount++;

          if (lum > threshold) {
            inkCount++;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
          }
        }
      }

      const ink = totalCount ? inkCount / totalCount : 0;
      const hasInk = ink > 0.01 && bottom > 0;

      const phase = Math.random() * Math.PI * 2;
      const wobble = 0.7 + Math.random() * 1.6;

      // more ink = melts earlier & heavier
      const delay = hasInk ? (1 - ink) * (0.18 + Math.random() * 0.35) : 1;
      const speed = hasInk ? 0.72 + ink * (0.85 + Math.random() * 0.9) : 0;

      colsMeta[c] = {
        ink: hasInk ? clamp(ink * 2.2, 0, 1) : 0,
        top: hasInk ? top : 0,
        bottom: hasInk ? bottom : 0,
        delay,
        speed,
        phase,
        wobble,
        tear: hasInk ? (0.45 + Math.random() * 0.9) : 0,
      };
    }

    columnsRef.current = colsMeta;
  };

  const renderFrame = () => {
    const canvas = canvasRef.current;
    const srcCanvas = srcCanvasRef.current;
    const scratch = scratchRef.current;
    if (!canvas || !srcCanvas || !scratch) return;

    const ctx = canvas.getContext("2d");
    const sctx = scratch.getContext("2d");
    if (!ctx || !sctx) return;

    const { W, H, block, dpr } = dimsRef.current;

    const pRaw = inHero ? progressRef.current : 0;
    const p = easeOutCubic(pRaw);

    // background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ✅ base image stays crisp and pure (no blur)
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(srcCanvas, 0, 0);

    // melt params (tuned for “slow burn” + weight)
    const maxShift = H * 0.58;
    const dripSlice = Math.max(2, Math.round(2 * dpr));
    const carveBoost = 0.92;

    // glow taste (only on melted parts)
    const glowBase = 10 * dpr;
    const glowMax = 26 * dpr;

    // slightly pixel-aware deformation
    ctx.imageSmoothingEnabled = false;

    const cols = columnsRef.current.length;

    for (let c = 0; c < cols; c++) {
      const col = columnsRef.current[c];
      if (!col || col.ink <= 0) continue;

      // per-column progress w/ delay (organic)
      const start = col.delay;
      const localRaw = clamp((p - start) / (1 - start), 0, 1);
      if (localRaw <= 0.0001) continue;

      // gravity easing (no linear feel)
      const local = smoothstep(localRaw);

      const sx = c * block;
      const sw = Math.min(block, W - sx);

      const inkTop = col.top;
      const inkBottom = col.bottom;

      // melt starts at the bottom of the actual ink shape
      const cutY = clamp(inkBottom - Math.round(26 * dpr), inkTop, inkBottom);

      // column speed variation + heavier ink drips more
      const shift =
        local *
        maxShift *
        (0.22 + 0.78 * col.ink) *
        col.speed;

      // deterministic wobble (scroll-driven)
      const n = wobbleNoise(c, p);
      const wobbleX =
        (Math.sin((p * 6.2 + col.phase) * col.wobble) * 0.75 +
          (n - 0.5) * 0.9) *
        (3.0 * dpr) *
        local;

      // ✅ carve where material was pulled from (gaps/tears)
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(sx - 1, cutY, sw + 2, shift * carveBoost);

      // ---------- Helper: draw tinted melted slice (with optional stretch) ----------
      const drawTintedSlice = (
        srcY: number,
        srcH: number,
        dstX: number,
        dstY: number,
        dstW: number,
        dstH: number,
        heat: number,
        alpha: number,
        glowAmount: number
      ) => {
        // setup scratch canvas to exact slice
        scratch.width = Math.max(1, Math.floor(dstW));
        scratch.height = Math.max(1, Math.floor(dstH));

        sctx.clearRect(0, 0, scratch.width, scratch.height);
        sctx.globalCompositeOperation = "source-over";

        // draw the original slice into scratch (keeps transparency)
        sctx.drawImage(
          srcCanvas,
          sx,
          srcY,
          sw,
          srcH,
          0,
          0,
          scratch.width,
          scratch.height
        );

        // tint only where pixels exist
        sctx.globalCompositeOperation = "source-in";
        sctx.fillStyle = waxColor(heat);
        sctx.fillRect(0, 0, scratch.width, scratch.height);

        // render onto main canvas (with tasteful bloom)
        ctx.save();
        ctx.globalAlpha = alpha;

        const glow = glowBase + (glowMax - glowBase) * glowAmount;
        ctx.shadowBlur = glow;
        ctx.shadowColor = waxColor(heat * 0.95);

        ctx.drawImage(scratch, dstX, dstY);

        ctx.restore();
      };

      // 1) main pulled-down “molten body” (tinted)
      {
        const srcY = cutY;
        const srcH = H - cutY;

        // heat increases with scroll + a bit extra near the bottom
        const heat = clamp(local * 0.9 + col.ink * 0.25, 0, 1);

        drawTintedSlice(
          srcY,
          srcH,
          sx + wobbleX,
          cutY + shift,
          sw,
          srcH,
          heat,
          0.98,
          local
        );
      }

      // 2) smear trail (thin → stretched, like wax stringing)
      {
        const smearY = clamp(inkBottom - dripSlice, 0, H - dripSlice);

        // thinner/faster drips happen in “emptier” columns too
        const dripVar = 0.65 + (wobbleNoise(c + 19, p) * 0.9);
        const smearStretch = shift * (0.7 + 0.55 * dripVar);

        const heat = clamp(local * 1.05, 0, 1);
        drawTintedSlice(
          smearY,
          dripSlice,
          sx + wobbleX,
          smearY,
          sw,
          dripSlice + smearStretch,
          heat,
          0.58 * local,
          0.75 * local
        );
      }

      // 3) optional “tear ribbons” (controlled chaos, still premium)
      if (local > 0.35) {
        const tearChance = wobbleNoise(c + 77, p);
        if (tearChance > 0.46) {
          const tearH = Math.round((6 + local * 18) * dpr);
          const tearY = clamp(inkBottom - Math.round(10 * dpr), 0, H - tearH);

          const tearStretch = shift * (0.9 + 0.6 * col.tear);
          const heat = clamp(local * 1.0, 0, 1);

          drawTintedSlice(
            tearY,
            tearH,
            sx + wobbleX * 1.1,
            tearY + tearStretch,
            sw,
            tearH * (1.15 + local * 0.28),
            heat,
            0.28 * local,
            0.55 * local
          );
        }
      }
    }

    // cinematic “depth” as it melts (very subtle)
    if (p > 0.16) {
      ctx.globalAlpha = (p - 0.16) * 0.16;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }
  };

  return (
    <section
      ref={(n) => {
        heroRef.current = n;
      }}
      aria-label="Hero"
      style={{
        minHeight: "100vh",
        background: "#000",
        position: "relative",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        ref={(n) => {
          wrapRef.current = n;
        }}
        style={{
          width: "min(1800px, 98vw)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <canvas
          ref={(n) => {
            canvasRef.current = n;
          }}
          aria-hidden="true"
          style={{
            display: "block",
            maxWidth: "100%",
            height: "auto",
            userSelect: "none",
          }}
        />
      </div>

      {/* your existing overlays can stay the same */}
      {scrolled && inHero && (
        <>
          <div
            style={{
              position: "absolute",
              left: 44,
              bottom: 90,
              maxWidth: 420,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 20,
              lineHeight: 1.25,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#e8e8e8",
              opacity: 0.92,
              pointerEvents: "none",
            }}
          >
            “IMAGES&nbsp;&nbsp;BREATHE
            <br />
            BEFORE&nbsp;THEY
            <br />
            SPEAK”
          </div>

          <div
            style={{
              position: "absolute",
              right: 56,
              top: "50%",
              transform: "translateY(-50%)",
              textAlign: "right",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 18,
              lineHeight: 1.35,
              letterSpacing: "0.06em",
              color: "#e8e8e8",
              opacity: 0.9,
              pointerEvents: "none",
            }}
          >
            Rhythm.
            <br />
            Resistance.
            <br />
            Remembrance.
          </div>

          <button
            type="button"
            onClick={() => router.push("/contact")}
            style={{
              position: "absolute",
              right: 34,
              bottom: 32,
              padding: "12px 22px",
              borderRadius: 999,
              border: `2px solid ${brandPink}`,
              background: "rgba(0,0,0,0.35)",
              color: "#fff",
              fontSize: 14,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              backdropFilter: "blur(6px)",
            }}
          >
            CONTACT US
          </button>
        </>
      )}

      {!scrolled && (
        <button
          type="button"
          onClick={() => router.push("/register")}
          style={{
            position: "absolute",
            right: 32,
            bottom: 32,
            padding: "14px 22px",
            borderRadius: 999,
            border: "0",
            background: brandPink,
            color: "#fff",
            fontSize: 14,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: "0 10px 30px rgba(198, 55, 108, 0.35)",
          }}
        >
          Register
        </button>
      )}
    </section>
  );
}
