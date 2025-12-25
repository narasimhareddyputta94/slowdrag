"use client";

import { useEffect, useMemo, useRef } from "react";

function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
  const p = gl.createProgram();
  if (!p) return null;
  const v = createShader(gl, gl.VERTEX_SHADER, vs);
  const f = createShader(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.trim().replace(/^#/, "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = /^[0-9a-fA-F]{6}$/.test(v) ? v : "c6376c";
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  return [r, g, b];
}

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main(){
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// Single-pass organic flow shader masked by a text alpha texture.
// Directional bias is top -> bottom with a 4s sweep.
const FLOW_FRAG = `
precision highp float;
uniform sampler2D u_mask;
uniform vec2 u_res;
uniform float u_time;
uniform float u_reveal;
uniform float u_seed;
uniform vec3 u_brand;
varying vec2 v_uv;

float hash21(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = hash21(i + vec2(0.0,0.0));
  float b = hash21(i + vec2(1.0,0.0));
  float c = hash21(i + vec2(0.0,1.0));
  float d = hash21(i + vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}

float fbm(vec2 p){
  float v = 0.0;
  float a = 0.55;
  for(int i=0;i<5;i++){
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

vec2 flowField(vec2 p){
  float e = 0.18;
  float n1 = fbm(p + vec2(e, 0.0));
  float n2 = fbm(p - vec2(e, 0.0));
  float n3 = fbm(p + vec2(0.0, e));
  float n4 = fbm(p - vec2(0.0, e));
  vec2 g = vec2(n1 - n2, n3 - n4);
  vec2 f = vec2(g.y, -g.x);
  float l = max(0.001, length(f));
  return f / l;
}

void main(){
  vec2 uv = v_uv;
  vec2 px = 1.0 / u_res;

  // Text mask
  float m = texture2D(u_mask, uv).r;
  // Soften edges a bit (canvas AA + texture filtering)
  float a = smoothstep(0.10, 0.85, m);
  if (a < 0.001) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // Reveal: fully invisible before reveal starts.
  // Progresses top -> bottom as u_reveal goes 0..1.
  float r = clamp(u_reveal, 0.0, 1.0);
  float yFront = r * 1.25; // slightly overshoot for a clean finish
  // v_uv.y is bottom->top (0->1). We want reveal to start at TOP and move DOWN.
  float revealMask = smoothstep(-0.10, 0.12, uv.y - (1.0 - yFront));
  a *= revealMask;
  if (a < 0.001) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // 4s top->bottom sweep in UV space (1.0 over 4 seconds)
  float vSpeed = 0.25;
  float t = u_time;

  // Organic flow: curl-ish field + downward bias.
  vec2 p = uv * 2.6 + vec2(u_seed * 0.07, 0.0);
  p.y += 0.35 * sin(t * 0.12 + u_seed);
  vec2 ff = flowField(p + vec2(0.0, t * 0.10));
  ff.y = abs(ff.y) + 0.35;

  vec2 q = uv;
  q.y -= t * vSpeed;
  q += ff * 0.045;
  q.x += (fbm(vec2(uv.y * 1.7, t * 0.08 + u_seed)) - 0.5) * 0.06;

  float n1 = fbm(q * 3.0 + vec2(0.0, t * 0.10));
  float n2 = fbm(q * 7.0 + vec2(t * 0.12, -t * 0.18));
  float n = mix(n1, n2, 0.35);

  // Ridged highlights (gloss feel)
  float rid = 1.0 - abs(2.0 * n - 1.0);
  float gloss = pow(clamp(rid, 0.0, 1.0), 2.6);

  vec3 brand = max(u_brand, vec3(0.0));
  vec3 deep = brand * 0.22;
  vec3 body = mix(deep, brand * 0.78, smoothstep(0.08, 0.95, n));
  vec3 hot = mix(brand, vec3(1.0), 0.55);

  // Large, slow moving light sheet
  float sheet = fbm(q * 1.35 + vec2(0.0, t * 0.06));
  float sheetH = smoothstep(0.55, 0.92, sheet);

  vec3 col = body;
  col += hot * (0.32 * gloss + 0.18 * sheetH);

  // Stroke from mask gradient
  float mL = texture2D(u_mask, uv - vec2(px.x, 0.0)).r;
  float mR = texture2D(u_mask, uv + vec2(px.x, 0.0)).r;
  float mD = texture2D(u_mask, uv - vec2(0.0, px.y)).r;
  float mU = texture2D(u_mask, uv + vec2(0.0, px.y)).r;
  vec2 g = vec2(mR - mL, mU - mD);
  float edge = smoothstep(0.02, 0.14, length(g) * 4.5);
  col = mix(col, vec3(1.0), edge * 0.22);

  // Subtle grain (reduces perceived banding/patterning)
  float gr = (hash21(gl_FragCoord.xy + vec2(u_seed * 100.0, t * 12.0)) - 0.5) * 0.020;
  col *= (1.0 + gr);

  // A tiny lift as it reveals (keeps it feeling intentional/premium).
  col *= (0.70 + 0.30 * r);

  gl_FragColor = vec4(col, a);
}
`;

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

function wrapWords(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  trackingPx: number
) {
  const words = text.trim().split(/\s+/g);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    const w = measureTracked(ctx, next, trackingPx);
    if (w <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function Manifesto() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const inViewRef = useRef(false);
  // Animation time is based on ACTIVE (in-view) time so it doesn't jump.
  const t0Ref = useRef<number>(0);
  const elapsedMsRef = useRef<number>(0);
  const seedRef = useRef<number>(Math.random() * 1000);
  const lastFrameMsRef = useRef<number>(0);
  const revealTargetRef = useRef<number>(0);
  const revealPRef = useRef<number>(0);
  const hasRevealedOnceRef = useRef<boolean>(false);
  const hasStartedOnceRef = useRef<boolean>(false);

  const brand = "#6e1616ff";
  const brandRgb = useMemo(() => hexToRgb01(brand), [brand]);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    const prog = createProgram(gl, VERT, FLOW_FRAG);
    if (!prog) return;

    const aPos = gl.getAttribLocation(prog, "a_pos");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uReveal = gl.getUniformLocation(prog, "u_reveal");
    const uSeed = gl.getUniformLocation(prog, "u_seed");
    const uBrand = gl.getUniformLocation(prog, "u_brand");
    const uMask = gl.getUniformLocation(prog, "u_mask");

    const tri = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tri);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );

    const maskCanvas = document.createElement("canvas");
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    const maskTex = gl.createTexture();
    if (!maskTex) return;
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

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
      }
      maskCanvas.width = w;
      maskCanvas.height = h;

      // Draw mask
      maskCtx.setTransform(1, 0, 0, 1, 0, 0);
      maskCtx.clearRect(0, 0, w, h);
      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, w, h);

      const fontVar = getComputedStyle(document.body)
        .getPropertyValue("--font-offbit")
        .trim();
      const fontFamily = fontVar || "system-ui";

      // Bigger text without changing section height.
      // We target a larger size, but auto-scale down if it would overflow.
      let fontSize = 46 * dpr;
      let lineHeight = fontSize * 1.55;
      let tracking = fontSize * 0.08;
      const maxTextWidth = Math.min(1100 * dpr, w * 0.94);

      const line1 =
        "SLOW DRAG STUDIOS IS A CREATIVE DESIGN AND FILM STUDIO BUILT AGAINST HASTE. OUR WORK RESISTS THE ALGORITHMIC URGE TO RUSH, FLATTEN, SIMPLIFY.";
      const line2 =
        "WE WORK IN PULSE, NOT TEMPO. IN MEMORY, NOT NOISE. WE MAKE FILMS, IMAGES, AND SYSTEMS OF DESIGN THAT STAY LONG AFTER THE SCROLL ENDS.";

      maskCtx.textBaseline = "top";
      maskCtx.fillStyle = "white";

      const maxTextHeight = h ;
      let lines: string[] = [];
      for (let attempt = 0; attempt < 3; attempt++) {
        maskCtx.font = `600 ${fontSize}px ${fontFamily}`;
        lines = [
          ...wrapWords(maskCtx, line1, maxTextWidth, tracking),
          ...wrapWords(maskCtx, line2, maxTextWidth, tracking),
        ];

        const totalH = lines.length * lineHeight;
        if (totalH <= maxTextHeight) break;
        const scale = maxTextHeight / Math.max(1, totalH);
        fontSize *= scale;
        lineHeight = fontSize * 1.85;
        tracking = fontSize * 0.08;
      }

      const totalH = lines.length * lineHeight;
      const startY = (h - totalH) * 0.5;
      for (let i = 0; i < lines.length; i++) {
        const txt = lines[i]!.toUpperCase();
        const tw = measureTracked(maskCtx, txt, tracking);
        const x = (w - tw) * 0.5;
        const y = startY + i * lineHeight;
        drawTrackedText(maskCtx, txt, x, y, tracking);
      }

      // Upload to GL
      gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        maskCanvas
      );
    };

    const render = () => {
      if (!inViewRef.current) return;
      const now = performance.now();
      const activeMs = elapsedMsRef.current + Math.max(0, now - t0Ref.current);
      const t = activeMs / 1000;

      if (!lastFrameMsRef.current) lastFrameMsRef.current = now;
      const dt = Math.max(0, Math.min(0.06, (now - lastFrameMsRef.current) * 0.001));
      lastFrameMsRef.current = now;

      // Smooth-damped reveal: starts invisible on first entry (page load),
      // then never resets while scrolling.
      const revealDelaySeconds = 1.25;
      const revealSeconds = 8.8;
      if (hasRevealedOnceRef.current) {
        // Once revealed, never go back to invisible.
        revealTargetRef.current = 1;
      } else if (t >= revealDelaySeconds) {
        revealTargetRef.current = Math.min(
          1,
          revealTargetRef.current + dt / Math.max(0.001, revealSeconds)
        );
      } else {
        revealTargetRef.current = 0;
      }
      const damp = 1.0 - Math.exp(-dt * 9.0);
      revealPRef.current += (revealTargetRef.current - revealPRef.current) * damp;

      if (!hasRevealedOnceRef.current && revealPRef.current >= 0.995) {
        hasRevealedOnceRef.current = true;
        revealPRef.current = 1;
        revealTargetRef.current = 1;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, tri);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uReveal, revealPRef.current);
      gl.uniform1f(uSeed, seedRef.current);
      gl.uniform3f(uBrand, brandRgb[0], brandRgb[1], brandRgb[2]);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.uniform1i(uMask, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafRef.current = requestAnimationFrame(render);
    };

    const start = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      // Only initialize on the first time the section becomes visible after refresh.
      if (!hasStartedOnceRef.current) {
        hasStartedOnceRef.current = true;
        seedRef.current = Math.random() * 1000;
        elapsedMsRef.current = 0;
        hasRevealedOnceRef.current = false;
        revealTargetRef.current = 0;
        revealPRef.current = 0;
      }

      t0Ref.current = performance.now();
      lastFrameMsRef.current = 0;

      // If reveal already completed, force it to stay visible.
      if (hasRevealedOnceRef.current) {
        revealTargetRef.current = 1;
        revealPRef.current = 1;
      }

      resizeAndRedrawMask();
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      // Pause animation time (and reveal) while offscreen.
      const now = performance.now();
      if (t0Ref.current) {
        elapsedMsRef.current += Math.max(0, now - t0Ref.current);
        t0Ref.current = 0;
      }
    };

    const ro = new ResizeObserver(() => {
      if (!inViewRef.current) return;
      resizeAndRedrawMask();
    });
    ro.observe(section);

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

    return () => {
      io.disconnect();
      ro.disconnect();
      stop();
      gl.deleteTexture(maskTex);
      gl.deleteBuffer(tri);
      gl.deleteProgram(prog);
    };
  }, [brandRgb]);

  return (
    <section
      ref={sectionRef}
      aria-label="Manifesto"
      style={{
        minHeight: "70vh",
        background: "#000",
        display: "grid",
        placeItems: "center",
        padding: 0,
      }}
    >
      <div
        style={{
          width: "min(1200px, 94vw)",
          height: "min(500px, 54vh)",
          position: "relative",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </section>
  );
}
