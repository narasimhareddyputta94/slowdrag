"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

type HeroProps = {
    imageSrc: string;
    onScrolledChange?: (scrolled: boolean) => void;
  brandColor?: string; // sRGB hex (#rrggbb)
  showCaption?: boolean;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

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

/* ---------------- WebGL helpers ---------------- */
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
        console.error("Program link error:", gl.getProgramInfoLog(p));
        gl.deleteProgram(p);
        return null;
    }
    return p;
}

function makeTex(gl: WebGLRenderingContext, w: number, h: number) {
    const t = gl.createTexture();
    if (!t) return null;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return t;
}

function attachFB(gl: WebGLRenderingContext, tex: WebGLTexture) {
    const fb = gl.createFramebuffer();
    if (!fb) return null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return fb;
}

/* ---------------- Small blit shader (used to preserve masks on resize) ---------------- */
const BLIT_FRAG = `
precision highp float;
uniform sampler2D u_tex;
varying vec2 v_uv;
void main(){
  gl_FragColor = texture2D(u_tex, v_uv);
}
`;

/* ---------------- Shaders ---------------- */
const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// PASS 1: monotonic melt mask (once melted never comes back)
const MASK_FRAG = `
precision highp float;

uniform sampler2D u_logo;
uniform sampler2D u_prevMask;
uniform vec2 u_res;
uniform vec2 u_imgRes;
uniform float u_time;
uniform float u_anim;
uniform float u_seed;

varying vec2 v_uv;

float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = hash21(i + vec2(0.0,0.0));
  float b = hash21(i + vec2(1.0,0.0));
  float c = hash21(i + vec2(0.0,1.0));
  float d = hash21(i + vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}

// slightly smoother noise for flow
float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

// cheap curl-ish flow field (finite differences on fbm)
vec2 flowField(vec2 p){
  float e = 0.18;
  float n1 = fbm(p + vec2(e, 0.0));
  float n2 = fbm(p - vec2(e, 0.0));
  float n3 = fbm(p + vec2(0.0, e));
  float n4 = fbm(p - vec2(0.0, e));
  vec2 g = vec2(n1 - n2, n3 - n4);
  // rotate gradient for a divergence-free-ish look
  vec2 f = vec2(g.y, -g.x);
  float l = max(0.001, length(f));
  return f / l;
}

vec2 aspectFitUV(vec2 uv, vec2 canvasPx, vec2 imgPx){
  float ca = canvasPx.x / canvasPx.y;
  float ia = imgPx.x / imgPx.y;
  vec2 scale = vec2(1.0);
  if (ia > ca) scale.y = ca / ia;
  else scale.x = ia / ca;
  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 uv = aspectFitUV(v_uv, u_res, u_imgRes);

  // previous mask with a tiny downward advection to create "drips"
  float prev0 = texture2D(u_prevMask, v_uv).r;
  float anim = u_anim;
  float p = clamp(u_time, 0.0, 1.25);
  // heavier syrup: slower ramp
  float t = pow(p, 2.35);

  vec2 px = 1.0 / u_res;

  // stay attached to columns of the logo so the melt doesn't flare outward
  float sourceAbove = texture2D(u_logo, vec2(uv.x, clamp(uv.y + px.y * 18.0, 0.0, 1.0))).a;
  float columnHold = smoothstep(0.05, 0.32, sourceAbove);

  // per-column micro delay so it doesn't melt "all at once"
  float laneDelay = (fbm(vec2(uv.x * 4.2 + u_seed, 12.7)) - 0.5) * 0.22;
  float tt = clamp(t - laneDelay, 0.0, 1.25);
  // flow strength increases as melt progresses
  // heavier syrup: slower flow
  float flowStrength = (0.00035 + 0.0042 * smoothstep(0.08, 0.98, tt)) * mix(0.55, 1.0, columnHold);
  float flowLane = smoothstep(0.10, 0.90, fbm(vec2(uv.x * 7.0 + u_seed, anim * 0.10)));
  vec2 ff = flowField(vec2(uv.x * 2.2 + u_seed * 0.07, uv.y * 2.2 + anim * 0.10));
  // natural-ish velocity (gravity-biased curl flow)
  float laneAmt = (0.30 + 0.70 * flowLane);
  float gravAmt = (0.55 + 0.45 * smoothstep(0.10, 1.05, tt));
  float velX = ff.x * flowStrength * laneAmt * mix(0.08, 0.30, columnHold);
  float velY = mix(abs(ff.y), 1.0, 0.55) * flowStrength * (0.60 + 0.55 * laneAmt) * gravAmt * mix(0.85, 1.25, columnHold);

  // multi-sample advection: longer, smoother drips
  float carried1 = texture2D(u_prevMask, v_uv + vec2(-velX, velY * 1.1)).r;
  float carried2 = texture2D(u_prevMask, v_uv + vec2(-velX * 1.65, velY * 1.8)).r;
  float carried = max(carried1, carried2 * 0.995);
  float prev = max(prev0, carried * 0.997);

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(prev, 0.0, 0.0, 1.0);
    return;
  }

  float a0 = texture2D(u_logo, uv).a;
  if (a0 < 0.001) {
    gl_FragColor = vec4(prev, 0.0, 0.0, 1.0);
    return;
  }

  // shape-aware bottom edge
  float aBelow = texture2D(u_logo, uv - vec2(0.0, px.y * 2.0)).a;
  float bottomEdge = clamp(a0 - aBelow, 0.0, 1.0);
  bottomEdge = smoothstep(0.02, 0.22, bottomEdge);

  // heavier easing feels more viscous

  // bottom-first
  // progress front (bottom first) but wavy and staggered
  float frontWob = (fbm(vec2(uv.x * 2.8 + u_seed, 0.6 + anim * 0.10)) - 0.5) * 0.24;
  float bottomFirst = smoothstep(0.00, 0.45, tt - uv.y * 1.22 - frontWob);

  // x drip lanes (slowly evolving so lanes feel alive)
  float lane = smoothstep(0.16, 0.94, fbm(vec2(uv.x * 7.5 + u_seed, 0.20 + anim * 0.07)));
  float micro = noise(vec2(uv.x * 85.0 + u_seed, tt * 2.6 + anim * 0.35));
  float channel = mix(lane, micro, 0.20);

  // globs at bottom edges
  float globN = noise(vec2(uv.x * 18.0 + u_seed, 4.0));
  float globMask = smoothstep(0.60, 0.92, globN) * bottomEdge * columnHold;

  float visc = smoothstep(0.10, 0.70, tt) * (0.55 + 0.45 * channel);

  float edgeBoost = 0.10 + 3.25 * bottomEdge;
  // a touch of "heat shimmer" in when melt starts
  float shimmer = (noise(vec2(uv.x * 10.0 + u_seed, anim * 0.75 + uv.y * 3.0)) - 0.5);
  float newMelt =
    (0.05 + 0.98 * tt) *
    bottomFirst *
    edgeBoost *
    (0.60 + 0.40 * channel) *
    (1.0 + shimmer * 0.04 * smoothstep(0.05, 0.40, tt));

  newMelt *= columnHold;
  newMelt += globMask * visc * (0.12 + 0.25 * tt);

  // let accumulated mask keep creeping downward (still monotonic)
  // slower creep so it feels thick
  float creep = smoothstep(0.28, 1.10, tt) * flowLane * 0.035 * columnHold;
  float next = max(prev, clamp(newMelt + prev * creep, 0.0, 1.0));
  gl_FragColor = vec4(next, 0.0, 0.0, 1.0);
}
`;

// PASS 2: render brand-safe viscous liquid using the mask
// - Logo stays crisp/fully readable (no melting/dissolve)
// - Liquid is pure pink/magenta (no logo sampling/echo inside drips)
// - Bloom/glow is edge-only; we pack an edge bloom mask into scene alpha for POST_FRAG
const RENDER_FRAG = `
precision highp float;

uniform sampler2D u_logo;
uniform sampler2D u_mask;
uniform vec2  u_res;
uniform vec2  u_imgRes;
uniform float u_anim;
uniform float u_seed;
uniform float u_progress;
uniform vec3  u_brand; // linear RGB

varying vec2 v_uv;

float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
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
    for (int i = 0; i < 3; i++) {
        v += a * noise(p);
        p *= 2.02;
        a *= 0.5;
    }
    return v;
}

vec2 aspectFitUV(vec2 uv, vec2 canvasPx, vec2 imgPx){
  float ca = canvasPx.x / canvasPx.y;
  float ia = imgPx.x / imgPx.y;
  vec2 scale = vec2(1.0);
  if (ia > ca) scale.y = ca / ia;
  else scale.x = ia / ca;
  return (uv - 0.5) * scale + 0.5;
}

void main() {
  float m = texture2D(u_mask, v_uv).r;
  vec2 uv = aspectFitUV(v_uv, u_res, u_imgRes);
  vec2 uvC = clamp(uv, 0.0, 1.0);
  bool inBounds = !(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0);

  // Base logo alpha (premultiplied texture); we render it as crisp white.
  vec4 base = inBounds ? texture2D(u_logo, uvC) : vec4(0.0);
  float baseA = base.a;

  float pr = clamp(u_progress, 0.0, 1.0);

  // Mask already grows monotonically and advects downwards into lanes.
  float melt = smoothstep(0.04, 0.88, m) * pr;

  // Keep the top clean: let liquid exist mostly below midline.
  float topHold = smoothstep(0.58, 0.84, uvC.y);
  melt *= (1.0 - 0.85 * topHold);

    // Digital column grid for premium "pixel paint" feel (vertical columns only).
    float colCount = clamp(floor(u_res.x / 6.0), 140.0, 360.0);
    float xi = floor(uvC.x * colCount);
    float xq = (xi + 0.5) / colCount;

    // Lane gating to prevent sideways sheets (locked to columns).
    float laneN = smoothstep(0.18, 0.92, noise(vec2(xq * 8.0 + u_seed, 0.20 + u_anim * 0.06)));
    float micro = noise(vec2(xq * 78.0 + u_seed, m * 2.6 + 2.0 + u_anim * 0.18));
    float channel = mix(laneN, micro, 0.18);
  float dripSel = smoothstep(0.25, 0.90, channel);
  float laneCut = mix(0.14, 0.92, dripSel);

  float maskCol = texture2D(u_mask, vec2(v_uv.x, clamp(v_uv.y - 0.05, 0.0, 1.0))).r;
  float columnGate = max(smoothstep(0.07, 0.40, maskCol), smoothstep(0.30, 0.80, baseA));

  float liquidAlpha = clamp(melt * laneCut * columnGate, 0.0, 1.0);

  // Mask gradient -> normal (used for a controlled wet highlight)
  vec2 px = 1.0 / u_res;
  float mL = texture2D(u_mask, v_uv - vec2(px.x, 0.0)).r;
  float mR = texture2D(u_mask, v_uv + vec2(px.x, 0.0)).r;
  float mD = texture2D(u_mask, v_uv - vec2(0.0, px.y)).r;
  float mU = texture2D(u_mask, v_uv + vec2(0.0, px.y)).r;
  vec2 grad = vec2(mR - mL, mU - mD);

  float edge = smoothstep(0.02, 0.20, length(grad) * 6.0);
  float frontBand = edge * smoothstep(0.06, 0.28, m) * (1.0 - smoothstep(0.62, 0.98, m));

    // Occasional globs at the melt-front, plus continuous slow downward sliding globs.
    float globN = noise(vec2(xq * 18.0 + u_seed, 4.0));
    float glob = smoothstep(0.72, 0.92, globN) * frontBand;

    // "Forever" motion: slow downward flow field inside the liquid, even when pr is finished.
    // This only affects liquid shading/opacity, never the logo.
    float flowY = u_anim * 0.030; // subtle, heavy
    float streak = fbm(vec2(xi * 0.23 + u_seed * 0.9, uvC.y * 6.5 - flowY));
    float streak2 = fbm(vec2(xi * 0.41 + u_seed * 1.7, uvC.y * 12.0 - flowY * 1.35));
    float streakMix = clamp(mix(streak, streak2, 0.35), 0.0, 1.0);
    float streakMask = smoothstep(0.35, 0.88, streakMix);

    float slideGlobs = 0.0;
    for (int i = 0; i < 3; i++) {
        float id = float(i);
        float lane = floor(hash21(vec2(id + 2.1, u_seed)) * colCount);
        float laneX = (lane + 0.5) / colCount;
        float dx = abs(xq - laneX) * colCount;
        float w = exp(-dx * dx * 0.10);

        float sp = mix(0.010, 0.030, hash21(vec2(id + 9.7, u_seed + 13.7)));
        float ph = hash21(vec2(id + 4.3, u_seed + 31.2));
        float yy = fract(ph + u_anim * sp);
        float dy = (uvC.y - yy) / 0.050;
        slideGlobs += w * exp(-dy * dy);
    }
    slideGlobs *= smoothstep(0.10, 0.55, m) * (0.35 + 0.65 * dripSel);

    float alphaFlow = (1.0 + glob * 0.28) * (0.88 + 0.18 * streakMask) * (1.0 + slideGlobs * 0.18);
    liquidAlpha = clamp(liquidAlpha * alphaFlow, 0.0, 1.0);

  vec3 nrm = normalize(vec3(-grad * 3.0, 1.0));
  float microN = (noise(vec2(uvC.x * 140.0 + u_seed, uvC.y * 140.0 + u_anim * 0.60)) - 0.5);
  nrm = normalize(nrm + vec3(microN * 0.20 * liquidAlpha, microN * 0.10 * liquidAlpha, 0.0));

  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 lightDir1 = normalize(vec3(-0.35, 0.55, 0.75));
  vec3 lightDir2 = normalize(vec3( 0.62, 0.15, 0.77));
  vec3 h1 = normalize(lightDir1 + viewDir);
  vec3 h2 = normalize(lightDir2 + viewDir);

  float fres = pow(1.0 - clamp(dot(nrm, viewDir), 0.0, 1.0), 2.2);
  float thick = clamp(smoothstep(0.10, 0.95, m) * (0.65 + 0.35 * dripSel), 0.0, 1.0);
  float glossPow = mix(28.0, 110.0, thick);
  float spec1 = pow(clamp(dot(nrm, h1), 0.0, 1.0), glossPow);
  float spec2 = pow(clamp(dot(nrm, h2), 0.0, 1.0), glossPow * 0.75);
  float spec = (spec1 * 0.95 + spec2 * 0.55) * (0.25 + 0.75 * frontBand);

  // Brand-driven palette (all linear).
  vec3 brand = max(u_brand, vec3(0.0));
  // Ultra-premium preset: deeper body, subtler hot rim.
  vec3 deep = brand * 0.28;                   // inky body
  vec3 hot  = mix(brand, vec3(1.0), 0.50);    // brand -> white mix (rim/glow)

  vec3 body = mix(deep, brand * 0.62, smoothstep(0.0, 1.0, m));
  body *= (0.88 + 0.12 * thick);
    // subtle internal streak contrast (digital paint)
    body *= (0.92 + 0.14 * streakMask);

  // White-hot rim strictly at the melt-front band.
  vec3 rim = hot * frontBand * (0.60 + 0.40 * fres) * 0.92;

  // Glow must never bloom over the logo core.
  float overLogo = smoothstep(0.06, 0.40, baseA);
  float glowGate = 1.0 - overLogo;
  vec3 halo = hot * (frontBand * 0.72 + edge * 0.12) * glowGate;

    vec3 liquidRGB = (body + rim + halo + hot * spec * 0.10) * liquidAlpha;

    // "Impressive pixel treatment" (liquid only): column banding + posterization + dithering.
    float d0 = hash21(floor(gl_FragCoord.xy) + vec2(u_seed * 17.0, u_anim * 3.0)) - 0.5;
    float dCol = (hash21(vec2(xi + u_seed * 11.0, floor(gl_FragCoord.y * 0.25))) - 0.5) * 0.6;
    float dither = (d0 + dCol) * 0.55;

    float levels = 10.0;
    vec3 poster = floor(liquidRGB * levels + dither) / levels;
    // apply mostly in liquid body; keep rim/front cleaner.
    float pixAmt = liquidAlpha * (0.55 + 0.30 * streakMask) * (1.0 - frontBand * 0.65);
    liquidRGB = mix(liquidRGB, poster, clamp(pixAmt, 0.0, 1.0));

    // extra vertical column micro-variation (very subtle)
    float colJit = (hash21(vec2(xi, u_seed * 3.0)) - 0.5) * 0.06;
    liquidRGB *= (1.0 + colJit * liquidAlpha);

  // Logo stays crisp/fully readable: render as pure white using alpha.
  vec3 logoRGB = vec3(1.0) * baseA;

  // Subtle graded-black background (linear). Keeps dark mode premium, not flat #000.
  vec2 q = v_uv - 0.5;
  float r2 = dot(q, q);
  vec3 bgTop = vec3(0.015, 0.015, 0.020);
  vec3 bgBot = vec3(0.000, 0.000, 0.000);
  vec3 bg = mix(bgTop, bgBot, smoothstep(0.05, 0.92, v_uv.y));
  bg *= (0.92 + 0.08 * smoothstep(0.85, 0.15, r2));

  // Compose: background + liquid behind, logo on top.
  vec3 rgb = bg + liquidRGB + logoRGB;

  // Store bloom mask in alpha (edge-only, gated off the logo).
  float bloomMask = clamp((frontBand * 1.25 + edge * 0.25) * liquidAlpha * glowGate, 0.0, 1.0);

  // Micro grain only on liquid.
  float grain = (hash21(gl_FragCoord.xy + u_seed * 100.0) - 0.5) * 0.020 * liquidAlpha;
  rgb *= (1.0 + grain);

  gl_FragColor = vec4(rgb, bloomMask);
}
`;

// PASS 3: cinematic post
const POST_FRAG = `
precision highp float;

uniform sampler2D u_scene;
uniform vec2 u_res;
uniform float u_anim;
uniform float u_seed;
uniform float u_progress;

varying vec2 v_uv;

float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec3 tonemapFilmic(vec3 x){
  x = max(vec3(0.0), x);
  return (x*(2.51*x + 0.03)) / (x*(2.43*x + 0.59) + 0.14);
}

void main() {
  vec2 uv = v_uv;
  vec2 px = 1.0 / u_res;

  // No post at rest: keep the image exactly as rendered.
  float pr = clamp(u_progress, 0.0, 1.0);
  if (pr < 0.0001) {
    gl_FragColor = vec4(texture2D(u_scene, uv).rgb, 1.0);
    return;
  }

  // premium chromatic aberration: only towards edges (keeps center crisp)
  vec2 q = uv - 0.5;
  float r2 = dot(q, q);
  float edgeW = smoothstep(0.08, 0.28, r2);
  float jitter = (hash21(vec2(u_seed, u_anim)) - 0.5);
  vec2 off = px * (0.65 + 2.2 * edgeW) * (0.25 * pr) * (0.85 + 0.30 * jitter);

  float rr = texture2D(u_scene, uv + off).r;
  float gg = texture2D(u_scene, uv).g;
  float bb = texture2D(u_scene, uv - off).b;
  vec3 base = vec3(rr, gg, bb);

  // Edge-only bloom: the scene alpha stores a bloom mask from the liquid edges.
  vec4 c00 = texture2D(u_scene, uv);
  vec4 c10 = texture2D(u_scene, uv + px*vec2( 1.5, 0.0));
  vec4 c_10 = texture2D(u_scene, uv + px*vec2(-1.5, 0.0));
  vec4 c01 = texture2D(u_scene, uv + px*vec2(0.0, 1.5));
  vec4 c0_1 = texture2D(u_scene, uv + px*vec2(0.0,-1.5));
  vec4 c11 = texture2D(u_scene, uv + px*vec2( 1.5, 1.5));
  vec4 c_11 = texture2D(u_scene, uv + px*vec2(-1.5, 1.5));
  vec4 c1_1 = texture2D(u_scene, uv + px*vec2( 1.5,-1.5));
  vec4 c_1_1 = texture2D(u_scene, uv + px*vec2(-1.5,-1.5));

  // Premultiply bloom source by the edge mask so the logo can't contaminate bloom.
  vec3 blurRGB =
    (c00.rgb * c00.a) * 0.204164 +
    ((c10.rgb * c10.a) + (c_10.rgb * c_10.a) + (c01.rgb * c01.a) + (c0_1.rgb * c0_1.a)) * 0.123841 +
    ((c11.rgb * c11.a) + (c_11.rgb * c_11.a) + (c1_1.rgb * c1_1.a) + (c_1_1.rgb * c_1_1.a)) * 0.075113;

  float blurA =
    c00.a * 0.204164 +
    (c10.a + c_10.a + c01.a + c0_1.a) * 0.123841 +
    (c11.a + c_11.a + c1_1.a + c_1_1.a) * 0.075113;

  // Filmic shoulder: soft-knee the bloom mask so it fades into black cleanly.
  float soft = smoothstep(0.08, 0.65, blurA);
  float bloomMask = soft * soft;
  vec3 bloom = blurRGB * bloomMask * (0.26 + 0.34 * pr);

  // vignette (darkens edges only; keeps blacks black)
  float vig = smoothstep(0.98, 0.22, r2);
  base *= vig;

  // combine in linear, then tonemap
  vec3 color = base + bloom;
  // tiny exposure push without lifting blacks
  color *= (1.02 + 0.02 * pr);
  color = tonemapFilmic(color);

  // subtle saturation lift (premium) without shifting blacks
  float l = luma(color);
  vec3 gray = vec3(l);
  color = mix(gray, color, 1.12);

  // grain + micro flicker + very small dithering, gated by luma to avoid noisy blacks
  float gate = smoothstep(0.02, 0.18, l);
  float grain = (hash21(gl_FragCoord.xy + u_seed*100.0) - 0.5) * 0.030 * pr;
  float flicker = (hash21(vec2(u_seed, u_seed*2.0 + u_anim)) - 0.5) * 0.010 * pr;
  float dither = (hash21(gl_FragCoord.xy * 0.5 + vec2(u_seed, u_anim)) - 0.5) / 255.0;
  color *= (1.0 + (grain + flicker) * gate);
  color += dither * gate;

  gl_FragColor = vec4(max(vec3(0.0), color), 1.0);
}
`;

export default function HeroMeltWebGL({
  imageSrc,
  onScrolledChange,
  brandColor = "#c6376c",
  showCaption = false,
}: HeroProps) {
  const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const holdRef = useRef<HTMLElement | null>(null);
    const pinWrapRef = useRef<HTMLDivElement | null>(null);

    const shaders = useMemo(() => ({ VERT, MASK_FRAG, RENDER_FRAG, POST_FRAG }), []);

    const brandLin = useMemo(() => hexToLinearRgb(brandColor), [brandColor]);

    const S = useRef({
        gl: null as WebGLRenderingContext | null,

        triBuf: null as WebGLBuffer | null,

        maskProg: null as WebGLProgram | null,
        renderProg: null as WebGLProgram | null,
        postProg: null as WebGLProgram | null,

        blitProg: null as WebGLProgram | null,
        bu_tex: null as WebGLUniformLocation | null,

        logoTex: null as WebGLTexture | null,

        maskTexA: null as WebGLTexture | null,
        maskTexB: null as WebGLTexture | null,
        fbA: null as WebGLFramebuffer | null,
        fbB: null as WebGLFramebuffer | null,
        ping: 0,

        sceneTex: null as WebGLTexture | null,
        sceneFB: null as WebGLFramebuffer | null,

        // uniforms mask
        mu_logo: null as WebGLUniformLocation | null,
        mu_prevMask: null as WebGLUniformLocation | null,
        mu_res: null as WebGLUniformLocation | null,
        mu_imgRes: null as WebGLUniformLocation | null,
        mu_time: null as WebGLUniformLocation | null,
        mu_anim: null as WebGLUniformLocation | null,
        mu_seed: null as WebGLUniformLocation | null,

        // uniforms render
        ru_logo: null as WebGLUniformLocation | null,
        ru_mask: null as WebGLUniformLocation | null,
        ru_res: null as WebGLUniformLocation | null,
        ru_imgRes: null as WebGLUniformLocation | null,
        ru_anim: null as WebGLUniformLocation | null,
        ru_seed: null as WebGLUniformLocation | null,
        ru_progress: null as WebGLUniformLocation | null,
        ru_brand: null as WebGLUniformLocation | null,

        // uniforms post
        pu_scene: null as WebGLUniformLocation | null,
        pu_res: null as WebGLUniformLocation | null,
        pu_anim: null as WebGLUniformLocation | null,
        pu_seed: null as WebGLUniformLocation | null,
        pu_progress: null as WebGLUniformLocation | null,

        raf: 0,
        p: 0,
        target: 0,
        t0: 0,
        imgW: 1,
        imgH: 1,
        loaded: false,
        seed: Math.random() * 1000,
        ro: null as ResizeObserver | null,
        lastLayoutW: 0,
        lastLayoutH: 0,
        stableVh: 0,
    });

    const loop = () => {
        const s = S.current;
        const gl = s.gl;
        const canvas = canvasRef.current;
        if (!gl || !canvas || !s.loaded || !s.maskProg || !s.renderProg || !s.postProg) return;

        const anim = (performance.now() - s.t0) * 0.001;

        // slower smoothing = thicker feel
        // heavier syrup: slower response to scroll
        s.p += (s.target - s.p) * 0.026;
        const timeVal = Math.max(0, Math.min(1.25, s.p));
        const progress01 = Math.max(0, Math.min(1, timeVal));

        const W = gl.drawingBufferWidth;
        const H = gl.drawingBufferHeight;

        const prevMask = s.ping === 0 ? s.maskTexA : s.maskTexB;
        const nextMask = s.ping === 0 ? s.maskTexB : s.maskTexA;
        const nextFB = s.ping === 0 ? s.fbB : s.fbA;

        // PASS 1: update mask
        gl.bindFramebuffer(gl.FRAMEBUFFER, nextFB);
        gl.viewport(0, 0, W, H);
        gl.disable(gl.BLEND);
        gl.useProgram(s.maskProg);

        gl.uniform2f(s.mu_res, W, H);
        gl.uniform2f(s.mu_imgRes, s.imgW, s.imgH);
        gl.uniform1f(s.mu_time, timeVal);
        if (s.mu_anim) gl.uniform1f(s.mu_anim, anim);
        gl.uniform1f(s.mu_seed, s.seed);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, s.logoTex);
        gl.uniform1i(s.mu_logo, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, prevMask);
        gl.uniform1i(s.mu_prevMask, 1);

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // PASS 2: render wax to scene buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, s.sceneFB);
        gl.viewport(0, 0, W, H);
        gl.disable(gl.BLEND);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(s.renderProg);
        gl.uniform2f(s.ru_res, W, H);
        gl.uniform2f(s.ru_imgRes, s.imgW, s.imgH);
        if (s.ru_anim) gl.uniform1f(s.ru_anim, anim);
        gl.uniform1f(s.ru_seed, s.seed);
        if (s.ru_progress) gl.uniform1f(s.ru_progress, progress01);
        if (s.ru_brand) gl.uniform3f(s.ru_brand, brandLin[0], brandLin[1], brandLin[2]);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, s.logoTex);
        gl.uniform1i(s.ru_logo, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, nextMask);
        gl.uniform1i(s.ru_mask, 1);

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // PASS 3: post to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, W, H);
        gl.disable(gl.BLEND);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(s.postProg);
        gl.uniform2f(s.pu_res, W, H);
        if (s.pu_anim) gl.uniform1f(s.pu_anim, anim);
        gl.uniform1f(s.pu_seed, s.seed + timeVal * 10.0);
        if (s.pu_progress) gl.uniform1f(s.pu_progress, progress01);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, s.sceneTex);
        gl.uniform1i(s.pu_scene, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        s.ping = 1 - s.ping;
        s.raf = requestAnimationFrame(loop);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext("webgl", {
            alpha: false,
            premultipliedAlpha: true,
            antialias: false,
            powerPreference: "high-performance",
        });

        if (!gl) {
            console.error("WebGL not supported");
            return;
        }

        const s = S.current;
        s.gl = gl;
        s.t0 = performance.now();

        const maskProg = createProgram(gl, shaders.VERT, shaders.MASK_FRAG);
        const renderProg = createProgram(gl, shaders.VERT, shaders.RENDER_FRAG);
        const postProg = createProgram(gl, shaders.VERT, shaders.POST_FRAG);
        const blitProg = createProgram(gl, shaders.VERT, BLIT_FRAG);
        if (!maskProg || !renderProg || !postProg || !blitProg) return;

        s.maskProg = maskProg;
        s.renderProg = renderProg;
        s.postProg = postProg;
        s.blitProg = blitProg;

        // big triangle
        const buffer = gl.createBuffer();
        s.triBuf = buffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

        // attributes for each program
        const a0 = gl.getAttribLocation(maskProg, "a_pos");
        gl.enableVertexAttribArray(a0);
        gl.vertexAttribPointer(a0, 2, gl.FLOAT, false, 0, 0);

        const a1 = gl.getAttribLocation(renderProg, "a_pos");
        gl.enableVertexAttribArray(a1);
        gl.vertexAttribPointer(a1, 2, gl.FLOAT, false, 0, 0);

        const a2 = gl.getAttribLocation(postProg, "a_pos");
        gl.enableVertexAttribArray(a2);
        gl.vertexAttribPointer(a2, 2, gl.FLOAT, false, 0, 0);

        const a3 = gl.getAttribLocation(blitProg, "a_pos");
        gl.enableVertexAttribArray(a3);
        gl.vertexAttribPointer(a3, 2, gl.FLOAT, false, 0, 0);

        // uniforms mask
        s.mu_logo = gl.getUniformLocation(maskProg, "u_logo");
        s.mu_prevMask = gl.getUniformLocation(maskProg, "u_prevMask");
        s.mu_res = gl.getUniformLocation(maskProg, "u_res");
        s.mu_imgRes = gl.getUniformLocation(maskProg, "u_imgRes");
        s.mu_time = gl.getUniformLocation(maskProg, "u_time");
        s.mu_anim = gl.getUniformLocation(maskProg, "u_anim");
        s.mu_seed = gl.getUniformLocation(maskProg, "u_seed");

        // uniforms render
        s.ru_logo = gl.getUniformLocation(renderProg, "u_logo");
        s.ru_mask = gl.getUniformLocation(renderProg, "u_mask");
        s.ru_res = gl.getUniformLocation(renderProg, "u_res");
        s.ru_imgRes = gl.getUniformLocation(renderProg, "u_imgRes");
        s.ru_anim = gl.getUniformLocation(renderProg, "u_anim");
        s.ru_seed = gl.getUniformLocation(renderProg, "u_seed");
        s.ru_progress = gl.getUniformLocation(renderProg, "u_progress");
        s.ru_brand = gl.getUniformLocation(renderProg, "u_brand");

        // uniforms post
        s.pu_scene = gl.getUniformLocation(postProg, "u_scene");
        s.pu_res = gl.getUniformLocation(postProg, "u_res");
        s.pu_anim = gl.getUniformLocation(postProg, "u_anim");
        s.pu_seed = gl.getUniformLocation(postProg, "u_seed");
        s.pu_progress = gl.getUniformLocation(postProg, "u_progress");

        s.bu_tex = gl.getUniformLocation(blitProg, "u_tex");

        const setStableVh = () => {
          const pinWrap = pinWrapRef.current;
          if (!pinWrap) return;
          const h = Math.max(1, window.innerHeight || 1);
          if (s.stableVh === h) return;
          s.stableVh = h;
          pinWrap.style.height = `${h}px`;
        };

        const resize = () => {
            if (!canvas.parentElement) return;
            const rect = canvas.parentElement.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            // Prevent mask/scene buffer resets during scroll on mobile (address bar / viewport height changes).
            // Only resize when width changes, or when height changes a lot (orientation/layout shift).
            const prevW = s.lastLayoutW;
            const prevH = s.lastLayoutH;
            const wDelta = Math.abs(rect.width - prevW);
            const hDelta = Math.abs(rect.height - prevH);
            const meaningful = prevW === 0 || prevH === 0 || wDelta > 1 || hDelta > 160;
            if (!meaningful) return;
            s.lastLayoutW = rect.width;
            s.lastLayoutH = rect.height;

            canvas.width = Math.max(1, Math.floor(rect.width * dpr));
            canvas.height = Math.max(1, Math.floor(rect.height * dpr));
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            const W = canvas.width;
            const H = canvas.height;

            const oldMaskTexA = s.maskTexA;
            const oldMaskTexB = s.maskTexB;
            const oldFbA = s.fbA;
            const oldFbB = s.fbB;
            const oldPing = s.ping;
            const oldCurrentMask = oldPing === 0 ? oldMaskTexA : oldMaskTexB;

            // allocate new mask ping-pong
            const newMaskTexA = makeTex(gl, W, H);
            const newMaskTexB = makeTex(gl, W, H);
            const newFbA = newMaskTexA ? attachFB(gl, newMaskTexA) : null;
            const newFbB = newMaskTexB ? attachFB(gl, newMaskTexB) : null;

            // If melt has started, preserve mask across resize so it doesn't "restart".
            const shouldPreserve = !!oldCurrentMask && s.p > 0.01 && !!s.blitProg && !!s.bu_tex;
            if (newFbA && newFbB) {
                gl.viewport(0, 0, W, H);
                gl.disable(gl.BLEND);
                if (shouldPreserve) {
                    gl.useProgram(s.blitProg);
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, oldCurrentMask);
                    gl.uniform1i(s.bu_tex!, 0);

                    gl.bindFramebuffer(gl.FRAMEBUFFER, newFbA);
                    gl.drawArrays(gl.TRIANGLES, 0, 3);

                    gl.bindFramebuffer(gl.FRAMEBUFFER, newFbB);
                    gl.drawArrays(gl.TRIANGLES, 0, 3);

                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                } else {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, newFbA);
                    gl.clearColor(0, 0, 0, 1);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.bindFramebuffer(gl.FRAMEBUFFER, newFbB);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                }
            }

            // swap in new mask resources
            s.maskTexA = newMaskTexA;
            s.maskTexB = newMaskTexB;
            s.fbA = newFbA;
            s.fbB = newFbB;

            // scene buffer
            if (s.sceneTex) gl.deleteTexture(s.sceneTex);
            if (s.sceneFB) gl.deleteFramebuffer(s.sceneFB);

            s.sceneTex = makeTex(gl, W, H);
            if (s.sceneTex) s.sceneFB = attachFB(gl, s.sceneTex);

            s.ping = 0;

            // delete old mask resources after we've potentially copied from them
            if (oldMaskTexA) gl.deleteTexture(oldMaskTexA);
            if (oldMaskTexB) gl.deleteTexture(oldMaskTexB);
            if (oldFbA) gl.deleteFramebuffer(oldFbA);
            if (oldFbB) gl.deleteFramebuffer(oldFbB);
        };

        s.ro = new ResizeObserver(() => resize());
        if (canvas.parentElement) s.ro.observe(canvas.parentElement);
        setStableVh();
        resize();

        // logo texture
        const logoTex = gl.createTexture();
        if (!logoTex) return;
        s.logoTex = logoTex;

        gl.bindTexture(gl.TEXTURE_2D, logoTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // load image (SVG/PNG), rasterize to hi-res
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;

        img.onload = () => {
            // Keep it crisp: never upscale, but allow higher ceiling for large hero images.
            const MAX = 4096;
            const iw = img.naturalWidth || 1024;
            const ih = img.naturalHeight || 1024;
            const sc = Math.min(1, Math.min(MAX / iw, MAX / ih));
            const w = Math.max(1, Math.floor(iw * sc));
            const h = Math.max(1, Math.floor(ih * sc));

            const off = document.createElement("canvas");
            off.width = w;
            off.height = h;
            const ctx = off.getContext("2d");

            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.clearRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                s.imgW = w;
                s.imgH = h;
                gl.bindTexture(gl.TEXTURE_2D, logoTex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
            } else {
                s.imgW = iw;
                s.imgH = ih;
                gl.bindTexture(gl.TEXTURE_2D, logoTex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            }

            s.loaded = true;
            cancelAnimationFrame(s.raf);
            s.raf = requestAnimationFrame(loop);
        };

        // scroll mapping
        const onScroll = () => {
            const el = holdRef.current;
            const pinWrap = pinWrapRef.current;
          const vh = s.stableVh || pinWrap?.clientHeight || window.innerHeight || 1;

            if (!el) {
                const start = vh * 0.02;
                s.target = Math.max(0, window.scrollY - start) / (vh * 0.9);
                onScrolledChange?.(window.scrollY > 10);
                return;
            }

            const rect = el.getBoundingClientRect();
            const total = Math.max(1, el.offsetHeight - vh);
            const raw = Math.max(0, Math.min(1, -rect.top / total));

            // small deadzone so initial load is perfectly still
            const start = 0.02;
            const afterDeadzone = Math.max(0, raw - start) / Math.max(0.0001, 1 - start);

            // Keep the hero pinned for the whole section:
            // - short dwell (no melt)
            // - run the melt over only part of the scroll
            // - hold the completed look visible until the hero ends
            const dwell = 0.10;
            const animSpan = 0.42;
            const t = (afterDeadzone - dwell) / Math.max(0.0001, animSpan);
            const p = Math.max(0, Math.min(1, t));

            // drive the melt a bit past 1 for richer drips
            s.target = p * 1.25;
            onScrolledChange?.(afterDeadzone > 0.001);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        const onResize = () => {
          // Update stable viewport height (no scroll-time layout changes)
          setStableVh();
          resize();
          onScroll();
        };
        window.addEventListener("resize", onResize, { passive: true });
        onScroll();

        return () => {
            window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onResize);
            if (s.ro) s.ro.disconnect();
            cancelAnimationFrame(s.raf);

            try {
                if (s.logoTex) gl.deleteTexture(s.logoTex);

                if (s.maskTexA) gl.deleteTexture(s.maskTexA);
                if (s.maskTexB) gl.deleteTexture(s.maskTexB);
                if (s.fbA) gl.deleteFramebuffer(s.fbA);
                if (s.fbB) gl.deleteFramebuffer(s.fbB);

                if (s.sceneTex) gl.deleteTexture(s.sceneTex);
                if (s.sceneFB) gl.deleteFramebuffer(s.sceneFB);

                if (s.maskProg) gl.deleteProgram(s.maskProg);
                if (s.renderProg) gl.deleteProgram(s.renderProg);
                if (s.postProg) gl.deleteProgram(s.postProg);
                if (s.blitProg) gl.deleteProgram(s.blitProg);

                if (s.triBuf) gl.deleteBuffer(s.triBuf);
            } catch {}
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageSrc, shaders.VERT, shaders.MASK_FRAG, shaders.RENDER_FRAG, shaders.POST_FRAG, brandLin]);

    return (
        <section
            ref={holdRef}
            style={{
                height: "180vh",
                width: "100%",
                background: "#000",
                position: "relative",
          overflow: "visible",
            }}
        >
            <div
                ref={pinWrapRef}
                style={{
            position: "sticky",
            top: 0,
            left: 0,
            right: 0,
                height: "100vh",
            width: "100%",
                    background: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
            overflow: "hidden",
                }}
            >
      <div
        aria-hidden={!showCaption}
        style={{
        position: "absolute",
        left: 36,
        bottom: 28,
        zIndex: 10,
        pointerEvents: "none",
        opacity: showCaption ? 1 : 0,
        transition: "opacity 450ms ease",
        color: "#fff",
        fontFamily: "var(--font-offbit), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        lineHeight: 1.15,
            fontSize: "clamp(22px, 2.2vw, 34px)",
        whiteSpace: "pre-line",
        mixBlendMode: "normal",
        }}
      >
        {"\u201cIMAGES BREATHE\nBEFORE THEY\nSPEAK\u201d"}
      </div>

        <div
          aria-hidden={!showCaption}
          style={{
            position: "absolute",
            right: 36,
            top: "50%",
            transform: "translate3d(0,-50%,0)",
            zIndex: 10,
            pointerEvents: "none",
            opacity: showCaption ? 1 : 0,
            transition: "opacity 450ms ease",
            color: "#fff",
            fontFamily: "var(--font-offbit), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            lineHeight: 1.15,
            fontSize: "clamp(18px, 1.8vw, 28px)",
            whiteSpace: "pre-line",
            textAlign: "right",
            mixBlendMode: "normal",
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
            right: 36,
            bottom: 28,
            zIndex: 10,
            opacity: showCaption ? 1 : 0,
            transition: "opacity 450ms ease",
            pointerEvents: showCaption ? "auto" : "none",

            background: "transparent",
            border: `2px solid ${brandColor}`,
            borderRadius: 999,
            padding: "10px 18px",

            color: "#fff",
            fontFamily:
              "var(--font-offbit), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontSize: "clamp(14px, 1.2vw, 18px)",
            lineHeight: 1,

            cursor: "pointer",
          }}
        >
          CONTACT US
        </button>

                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        maxWidth: "2000px",
                        margin: "0 auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                            pointerEvents: "none",
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
