"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

/* ---------------- WebGL Helpers ---------------- */
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

/* ---------------- Shaders ---------------- */
const BLIT_FRAG = `precision highp float; uniform sampler2D u_tex; varying vec2 v_uv; void main(){ gl_FragColor = texture2D(u_tex, v_uv); }`;
const VERT = `attribute vec2 a_pos; varying vec2 v_uv; void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const MASK_FRAG = `
precision highp float;
uniform sampler2D u_logo;
uniform sampler2D u_prevMask;
uniform vec2 u_res;
uniform vec2 u_imgRes;
uniform float u_cover;
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
vec2 aspectFitUV(vec2 uv, vec2 canvasPx, vec2 imgPx, float fit){
  float ca = canvasPx.x / canvasPx.y;
  float ia = imgPx.x / imgPx.y;

  vec2 containScale = vec2(1.0);
  vec2 coverScale = vec2(1.0);

  if (ia > ca) {
    containScale.y = ia / ca;
    coverScale.x = ca / ia;
  } else {
    containScale.x = ca / ia;
    coverScale.y = ia / ca;
  }

  float t = clamp(fit, 0.0, 1.0);
  vec2 scale = mix(containScale, coverScale, t);
  return (uv - 0.5) * scale + 0.5;
}
void main() {
  vec2 uv = aspectFitUV(v_uv, u_res, u_imgRes, u_cover);
  float prev0 = texture2D(u_prevMask, v_uv).r;
  float p = clamp(u_time, 0.0, 1.25);
  float t = pow(p, 2.0);

  vec2 px = 1.0 / u_res;
  float sourceAbove = texture2D(u_logo, vec2(uv.x, clamp(uv.y + px.y * 18.0, 0.0, 1.0))).a;
  float columnHold = smoothstep(0.05, 0.32, sourceAbove);
  float laneDelay = (fbm(vec2(uv.x * 4.2 + u_seed, 12.7)) - 0.5) * 0.15;
  float tt = clamp(t - laneDelay, 0.0, 1.25);
  float flowStrength = (0.00035 + 0.0042 * smoothstep(0.08, 0.98, tt)) * mix(0.55, 1.0, columnHold);
  float flowLane = smoothstep(0.10, 0.90, fbm(vec2(uv.x * 7.0 + u_seed, u_anim * 0.10)));
  vec2 ff = flowField(vec2(uv.x * 2.2 + u_seed * 0.07, uv.y * 2.2 + u_anim * 0.10));
  float laneAmt = (0.30 + 0.70 * flowLane);
  float gravAmt = (0.55 + 0.45 * smoothstep(0.10, 1.05, tt));
  float velX = ff.x * flowStrength * laneAmt * mix(0.08, 0.30, columnHold);
  float velY = mix(abs(ff.y), 1.0, 0.55) * flowStrength * (0.60 + 0.55 * laneAmt) * gravAmt * mix(0.85, 1.25, columnHold);
  float carried1 = texture2D(u_prevMask, v_uv + vec2(-velX, velY * 1.1)).r;
  float carried2 = texture2D(u_prevMask, v_uv + vec2(-velX * 1.65, velY * 1.8)).r;
  float carried = max(carried1, carried2 * 0.995);
  float prev = max(prev0, carried * 0.997);

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(prev, 0.0, 0.0, 1.0); return; }
  float a0 = texture2D(u_logo, uv).a;
  if (a0 < 0.001) { gl_FragColor = vec4(prev, 0.0, 0.0, 1.0); return; }

  float aBelow = texture2D(u_logo, uv - vec2(0.0, px.y * 2.0)).a;
  float bottomEdge = clamp(a0 - aBelow, 0.0, 1.0);
  bottomEdge = smoothstep(0.02, 0.22, bottomEdge);

  float frontWob = (fbm(vec2(uv.x * 2.8 + u_seed, 0.6 + u_anim * 0.10)) - 0.5) * 0.24;
  float bottomFirst = smoothstep(0.00, 0.45, tt - uv.y * 1.22 - frontWob);
  float fullReach = smoothstep(0.55, 1.15, tt);
  bottomFirst = mix(bottomFirst, 1.0, fullReach);
  float fullFill = smoothstep(0.92, 1.18, tt);
  float lane = smoothstep(0.16, 0.94, fbm(vec2(uv.x * 7.5 + u_seed, 0.20 + u_anim * 0.07)));
  float micro = noise(vec2(uv.x * 85.0 + u_seed, tt * 2.6 + u_anim * 0.35));
  float channel = mix(lane, micro, 0.20);
  float globN = noise(vec2(uv.x * 18.0 + u_seed, 4.0));
  float globMask = smoothstep(0.60, 0.92, globN) * bottomEdge * columnHold;
  float visc = smoothstep(0.10, 0.70, tt) * (0.55 + 0.45 * channel);
  float edgeBoost = 0.10 + 3.25 * bottomEdge;
  float shimmer = (noise(vec2(uv.x * 10.0 + u_seed, u_anim * 0.75 + uv.y * 3.0)) - 0.5);
  float newMelt = (0.05 + 0.98 * tt) * bottomFirst * edgeBoost * (0.60 + 0.40 * channel) * (1.0 + shimmer * 0.04 * smoothstep(0.05, 0.40, tt));
  newMelt *= columnHold;
  newMelt += fullFill * columnHold * (0.55 + 0.10 * channel);
  newMelt += globMask * visc * (0.12 + 0.25 * tt);
  float creepJ = 0.75 + 0.5 * fbm(vec2(uv.x * 1.4 + u_seed, u_anim * 0.08));
  float creep = smoothstep(0.18, 1.10, tt) * flowLane * 0.055 * columnHold * creepJ;
  float next = max(prev, clamp(newMelt + prev * creep, 0.0, 1.0));
  gl_FragColor = vec4(next, 0.0, 0.0, 1.0);
}
`;

const RENDER_FRAG = `
precision highp float;
uniform sampler2D u_logo;
uniform sampler2D u_mask;
uniform vec2 u_res;
uniform vec2 u_imgRes;
uniform float u_cover;
uniform float u_anim;
uniform float u_seed;
uniform float u_progress;
uniform vec3 u_brand;
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
vec2 aspectFitUV(vec2 uv, vec2 canvasPx, vec2 imgPx, float fit){
  float ca = canvasPx.x / canvasPx.y;
  float ia = imgPx.x / imgPx.y;

  vec2 containScale = vec2(1.0);
  vec2 coverScale = vec2(1.0);

  if (ia > ca) {
    containScale.y = ia / ca;
    coverScale.x = ca / ia;
  } else {
    containScale.x = ca / ia;
    coverScale.y = ia / ca;
  }

  float t = clamp(fit, 0.0, 1.0);
  vec2 scale = mix(containScale, coverScale, t);
  return (uv - 0.5) * scale + 0.5;
}
void main() {
  float m = texture2D(u_mask, v_uv).r;
  vec2 uv = aspectFitUV(v_uv, u_res, u_imgRes, u_cover);
  vec2 uvC = clamp(uv, 0.0, 1.0);
  bool inBounds = !(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0);
  vec4 base = inBounds ? texture2D(u_logo, uvC) : vec4(0.0);
  float baseA = base.a;
  float pr = clamp(u_progress, 0.0, 1.0);

  float melt = smoothstep(0.001, 0.88, m) * pr;

  float colCount = clamp(floor(u_res.x / 6.0), 140.0, 360.0);
  float xi = floor(uvC.x * colCount);
  float xq = (xi + 0.5) / colCount;
  float laneN = smoothstep(0.18, 0.92, noise(vec2(xq * 8.0 + u_seed, 0.20 + u_anim * 0.06)));
  float micro = noise(vec2(xq * 78.0 + u_seed, m * 2.6 + 2.0 + u_anim * 0.18));
  float channel = mix(laneN, micro, 0.18);

  float dripSel = smoothstep(0.25, 0.90, channel);
  float laneCut = mix(0.30, 1.00, dripSel);
  float maskCol = texture2D(u_mask, vec2(v_uv.x, clamp(v_uv.y - 0.05, 0.0, 1.0))).r;
  float columnGate = max(smoothstep(0.07, 0.40, maskCol), smoothstep(0.30, 0.80, baseA));
  float liquidAlpha = clamp(melt * laneCut * columnGate, 0.0, 1.0);

  vec2 px = 1.0 / u_res;
  float mL = texture2D(u_mask, v_uv - vec2(px.x, 0.0)).r;
  float mR = texture2D(u_mask, v_uv + vec2(px.x, 0.0)).r;
  float mD = texture2D(u_mask, v_uv - vec2(0.0, px.y)).r;
  float mU = texture2D(u_mask, v_uv + vec2(0.0, px.y)).r;
  vec2 grad = vec2(mR - mL, mU - mD);

  float edge = smoothstep(0.02, 0.20, length(grad) * 6.0);
  float frontBand = edge * smoothstep(0.06, 0.28, m) * (1.0 - smoothstep(0.62, 0.98, m));

  float globN = noise(vec2(xq * 18.0 + u_seed, 4.0));
  float glob = smoothstep(0.72, 0.92, globN) * frontBand;

  float flowY = u_anim * 0.110;
  float flowX = u_anim * 0.030;
  float streak = fbm(vec2(xi * 0.23 + u_seed * 0.9 + flowX, uvC.y * 6.5 - flowY));
  float streak2 = fbm(vec2(xi * 0.41 + u_seed * 1.7 - flowX * 0.6, uvC.y * 12.0 - flowY * 1.35));
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
  float alphaFlow = (1.0 + glob * 0.40) * (0.82 + 0.34 * streakMask) * (1.0 + slideGlobs * 0.34);
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

  vec3 brand = max(u_brand, vec3(0.0));
  vec3 deep = brand * 0.28;
  vec3 hot  = mix(brand, vec3(1.0), 0.50);
  vec3 body = mix(deep, brand * 0.62, smoothstep(0.0, 1.0, m));
  body *= (0.88 + 0.12 * thick);
  body *= (0.92 + 0.14 * streakMask);

  vec3 rim = hot * frontBand * (0.60 + 0.40 * fres) * 0.92;

  float overLogo = smoothstep(0.06, 0.40, baseA);
  float glowGate = 1.0 - overLogo;

  vec3 halo = hot * (frontBand * 0.72 + edge * 0.12) * glowGate;

  vec3 liquidRGB = (body + rim + halo + hot * spec * 0.10) * liquidAlpha;

  float d0 = hash21(floor(gl_FragCoord.xy) + vec2(u_seed * 17.0, u_anim * 3.0)) - 0.5;
  float dCol = (hash21(vec2(xi + u_seed * 11.0, floor(gl_FragCoord.y * 0.25))) - 0.5) * 0.6;
  float dither = (d0 + dCol) * 0.55;
  float levels = 10.0;
  vec3 poster = floor(liquidRGB * levels + dither) / levels;
  float pixAmt = liquidAlpha * (0.55 + 0.30 * streakMask) * (1.0 - frontBand * 0.65);
  liquidRGB = mix(liquidRGB, poster, clamp(pixAmt, 0.0, 1.0));
  float colJit = (hash21(vec2(xi, u_seed * 3.0)) - 0.5) * 0.06;
  liquidRGB *= (1.0 + colJit * liquidAlpha);

  vec3 logoRGB = vec3(1.0) * baseA;

  vec2 q = v_uv - 0.5;
  float r2 = dot(q, q);
  vec3 bgTop = vec3(0.015, 0.015, 0.020);
  vec3 bgBot = vec3(0.000, 0.000, 0.000);
  vec3 bg = mix(bgTop, bgBot, smoothstep(0.05, 0.92, v_uv.y));
  bg *= (0.92 + 0.08 * smoothstep(0.85, 0.15, r2));

  vec3 rgb = bg + liquidRGB + logoRGB;

  float bloomMask = clamp((frontBand * 1.25 + edge * 0.25) * liquidAlpha * glowGate, 0.0, 1.0);
  float grain = (hash21(gl_FragCoord.xy + u_seed*100.0) - 0.5) * 0.020 * liquidAlpha;
  rgb *= (1.0 + grain);

  gl_FragColor = vec4(rgb, bloomMask);
}
`;

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
vec3 tonemapFilmic(vec3 x){ x = max(vec3(0.0), x); return (x*(2.51*x + 0.03)) / (x*(2.43*x + 0.59) + 0.14); }
void main() {
  vec2 uv = v_uv;
  vec2 px = 1.0 / u_res;
  float pr = clamp(u_progress, 0.0, 1.0);
  if (pr < 0.0001) { gl_FragColor = vec4(texture2D(u_scene, uv).rgb, 1.0); return; }

  vec2 q = uv - 0.5;
  float r2 = dot(q, q);
  float edgeW = smoothstep(0.08, 0.28, r2);
  float jitter = (hash21(vec2(u_seed, u_anim)) - 0.5);
  vec2 off = px * (0.65 + 2.2 * edgeW) * (0.25 * pr) * (0.85 + 0.30 * jitter);

  float rr = texture2D(u_scene, uv + off).r;
  float gg = texture2D(u_scene, uv).g;
  float bb = texture2D(u_scene, uv - off).b;
  vec3 base = vec3(rr, gg, bb);

  vec4 c00 = texture2D(u_scene, uv);
  vec4 c10 = texture2D(u_scene, uv + px*vec2( 1.5, 0.0));
  vec4 c_10 = texture2D(u_scene, uv + px*vec2(-1.5, 0.0));
  vec4 c01 = texture2D(u_scene, uv + px*vec2(0.0, 1.5));
  vec4 c0_1 = texture2D(u_scene, uv + px*vec2(0.0,-1.5));
  vec4 c11 = texture2D(u_scene, uv + px*vec2( 1.5, 1.5));
  vec4 c_11 = texture2D(u_scene, uv + px*vec2(-1.5, 1.5));
  vec4 c1_1 = texture2D(u_scene, uv + px*vec2( 1.5,-1.5));
  vec4 c_1_1 = texture2D(u_scene, uv + px*vec2(-1.5,-1.5));

  vec3 blurRGB = (c00.rgb * c00.a) * 0.204164 + ((c10.rgb * c10.a) + (c_10.rgb * c_10.a) + (c01.rgb * c01.a) + (c0_1.rgb * c0_1.a)) * 0.123841 + ((c11.rgb * c11.a) + (c_11.rgb * c_11.a) + (c1_1.rgb * c1_1.a) + (c_1_1.rgb * c_1_1.a)) * 0.075113;
  float blurA = c00.a * 0.204164 + (c10.a + c_10.a + c01.a + c0_1.a) * 0.123841 + (c11.a + c_11.a + c1_1.a + c_1_1.a) * 0.075113;

  float soft = smoothstep(0.08, 0.65, blurA);
  float bloomMask = soft * soft;
  vec3 bloom = blurRGB * bloomMask * (0.26 + 0.34 * pr);

  float vig = smoothstep(0.98, 0.22, r2);
  base *= vig;

  vec3 color = base + bloom;
  color *= (1.02 + 0.02 * pr);
  color = tonemapFilmic(color);

  float l = luma(color);
  vec3 gray = vec3(l);
  color = mix(gray, color, 1.12);

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
  children,
  posterAlt = "Slow Drag Studios",
  posterWidth = 1200,
  posterHeight = 600,
  onMeltFinished,
}: HeroProps) {
  const router = useRouter();
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

  const shaders = useMemo(() => ({ VERT, MASK_FRAG, RENDER_FRAG, POST_FRAG }), []);
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
    lockDone: false,
    lockActive: false,
    lockScrollY: 0,
    cover: 0,

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

      // ✅ Hide poster once WebGL is actually running (LCP has already happened)
      if (!posterHideOnceRef.current) {
        posterHideOnceRef.current = true;
        // two rAFs = let browser paint the poster as LCP, then fade it away
        requestAnimationFrame(() => requestAnimationFrame(() => setShowPoster(false)));
      }

      const now = performance.now();
      if (!s.lastFrameMs) s.lastFrameMs = now;
      const dt = Math.max(0, Math.min(0.06, (now - s.lastFrameMs) * 0.001));
      s.lastFrameMs = now;
      const anim = (now - s.t0) * 0.001;

      /* ---------------- SCROLL LOGIC ---------------- */
      const winH = typeof window !== "undefined" ? window.innerHeight : 900;
      const lockDistance = winH;

      const raw = s.lockDone ? 1.0 : Math.max(0, Math.min(1.0, s.virtualScroll / Math.max(1, lockDistance)));

      const target = raw * 1.35;
      s.target = Math.max(s.target, target);

      const ease = 1.0 - Math.exp(-dt * 8.0);
      s.p += (s.target - s.p) * ease;

      if (s.p > 0.001) s.hasEverMelted = true;

      if (onScrolledChange) {
        onScrolledChange(raw > 0.1);
      }

      /* ---------------- MANIFESTO REVEAL LOGIC ---------------- */
      if (contentRef.current) {
        // ✅ Find manifesto only when needed (and cache it)
        if (!s.manifestoEl) {
          s.manifestoProbeEvery = (s.manifestoProbeEvery + 1) % 12; // probe ~5 times/sec at 60fps
          if (s.manifestoProbeEvery === 0) {
            const local =
              (contentRef.current.querySelector('section[aria-label="Manifesto"]') as HTMLElement | null) ||
              (typeof document !== "undefined"
                ? (document.querySelector('section[aria-label="Manifesto"]') as HTMLElement | null)
                : null);
            if (local) s.manifestoEl = local;
          }
        }

        const manifestoSection = s.manifestoEl;

        if (manifestoSection) {
          if (!s.manifestoBgSet) {
            manifestoSection.style.backgroundColor = "#000";
            s.manifestoBgSet = true;
          }

          const COLOR_START = 0.62;
          const COLOR_SPAN = 0.95;

          const mixT = Math.max(0, Math.min(1, (s.p - COLOR_START) / COLOR_SPAN));

          // ✅ Skip the heavy CSS-var animation work until we actually reach the color phase
          if (mixT > 0.0001 || s.manifestoArmed) {
            s.manifestoArmed = true;

            const tSmooth = mixT * mixT * (3.0 - 2.0 * mixT);

            const baseMolten = rgbaFromHex(brandColor, tSmooth);
            const strongMolten = rgbaFromHex(brandColor, tSmooth);

            const whiteA1 = Math.max(0, Math.min(1, 0.16 * tSmooth));
            const whiteA2 = Math.max(0, Math.min(1, 0.08 * tSmooth));

            const diff = Math.sqrt(Math.max(0, Math.min(1, mixT)));
            const spotY = -10 + diff * 78;
            const coreA = Math.max(0, Math.min(1, 0.95 * diff));
            const midA = Math.max(0, Math.min(1, 0.55 * diff));
            const haloA = Math.max(0, Math.min(1, 0.18 * diff));

            const spot = `radial-gradient(140% 120% at 50% ${spotY}%, ${rgbaFromHex(brandColor, coreA)} 0%, ${rgbaFromHex(
              brandColor,
              midA
            )} 18%, ${rgbaFromHex(brandColor, haloA)} 44%, ${rgbaFromHex(brandColor, 0)} 72%)`;

            const cloud = `radial-gradient(120% 110% at 50% ${Math.max(-6, spotY - 8)}%, ${rgbaFromHex(
              brandColor,
              haloA
            )} 0%, ${rgbaFromHex(brandColor, 0)} 62%)`;

            const laneA = Math.max(0, Math.min(1, 0.38 * diff));
            const laneSoft = Math.max(0, laneA * 0.18);
            const lanes = `repeating-linear-gradient(90deg, ${rgbaFromHex(brandColor, laneA)} 0px, ${rgbaFromHex(
              brandColor,
              laneA
            )} 22px, ${rgbaFromHex(brandColor, laneSoft)} 46px, ${rgbaFromHex(brandColor, 0)} 120px)`;

            const shimmer = `linear-gradient(90deg, rgba(255,255,255,${whiteA2}) 0%, ${rgbaFromHex(
              brandColor,
              Math.min(1, 0.72 * diff)
            )} 34%, ${rgbaFromHex(brandColor, Math.min(1, 0.72 * diff))} 66%, rgba(255,255,255,${whiteA1}) 100%)`;

            const caustA = Math.max(0, Math.min(1, 0.10 * diff));
            const caust = `repeating-radial-gradient(circle at 50% 0%, rgba(255,255,255,${caustA}) 0 1px, rgba(255,255,255,0) 12px 36px)`;

            const currentA = Math.max(0, Math.min(1, 0.09 * diff));
            const current = `repeating-linear-gradient(0deg, rgba(255,255,255,${currentA}) 0 2px, rgba(255,255,255,${
              currentA * 0.35
            }) 12px, rgba(255,255,255,0) 44px 140px)`;

            const eddyA = Math.max(0, Math.min(1, 0.06 * diff));
            const eddy = `conic-gradient(from ${((anim * 7.0) % 360).toFixed(
              1
            )}deg at 50% 2%, rgba(255,255,255,${eddyA}) 0deg, rgba(255,255,255,0) 95deg, rgba(255,255,255,${
              eddyA * 0.3
            }) 170deg, rgba(255,255,255,0) 255deg, rgba(255,255,255,${eddyA}) 360deg)`;

            const fill = [spot, cloud, lanes, shimmer, caust, current, eddy].join(", ");

            const wobX1 = Math.sin(anim * 0.42 + s.seed * 0.01) * 6.0;
            const wobX2 = Math.sin(anim * 0.33 + 1.7 + s.seed * 0.02) * 8.0;
            const wobX3 = Math.sin(anim * 0.22 + 3.1 + s.seed * 0.03) * 4.0;
            const wobX4 = Math.sin(anim * 0.48 + 0.9 + s.seed * 0.015) * 10.0;
            const wobX5 = Math.sin(anim * 0.55 + 0.4 + s.seed * 0.011) * 12.0;
            const wobX6 = Math.sin(anim * 0.18 + 2.2 + s.seed * 0.017) * 3.0;
            const wobX7 = Math.sin(anim * 0.28 + 0.2 + s.seed * 0.021) * 5.0;

            const driftY1 = (anim * 6.0) % 220;
            const driftY2 = (anim * 4.5) % 220;
            const driftY3 = (anim * 7.5) % 220;
            const driftY4 = (anim * 10.0) % 220;
            const driftY5 = (anim * 5.0) % 220;
            const driftY6 = (anim * 12.5) % 220;
            const driftY7 = (anim * 3.6) % 220;

            const baseY = tSmooth * 105;
            const baseY2 = tSmooth * 95;

            const flowY1 = (baseY + driftY1) % 220;
            const flowY2 = (baseY2 + driftY2) % 220;
            const flowY3 = (baseY * 0.95 + driftY3) % 220;
            const flowY4 = (baseY * 0.85 + driftY4) % 220;
            const flowY5 = (baseY * 0.70 + driftY5) % 220;
            const flowY6 = (baseY * 1.10 + driftY6) % 220;
            const flowY7 = (baseY * 0.25 + driftY7) % 220;

            manifestoSection.style.setProperty("--mf-pos1", `${50 + wobX1}% ${Math.max(0, flowY1 - 24)}%`);
            manifestoSection.style.setProperty("--mf-pos2", `${50 + wobX2}% ${Math.max(0, flowY2 - 18)}%`);
            manifestoSection.style.setProperty("--mf-pos3", `${50 + wobX3}% ${Math.max(0, flowY3 - 10)}%`);
            manifestoSection.style.setProperty("--mf-pos4", `${50 + wobX4}% ${flowY4}%`);
            manifestoSection.style.setProperty("--mf-pos5", `${50 + wobX5}% ${flowY5}%`);
            manifestoSection.style.setProperty("--mf-pos6", `${50 + wobX6}% ${flowY6}%`);
            manifestoSection.style.setProperty("--mf-pos7", `${50 + wobX7}% ${Math.max(0, flowY7 - 4)}%`);

            const breathe = 1 + Math.sin(anim * 0.30) * 0.035;
            const breathe2 = 1 + Math.sin(anim * 0.24 + 1.4) * 0.045;

            manifestoSection.style.setProperty("--mf-size1", `${Math.round(220 * breathe)}% ${Math.round(220 * breathe)}%`);
            manifestoSection.style.setProperty("--mf-size2", `${Math.round(260 * breathe2)}% ${Math.round(220 * breathe)}%`);
            manifestoSection.style.setProperty("--mf-size3", `${Math.round(300 * breathe2)}% ${Math.round(240 * breathe)}%`);
            manifestoSection.style.setProperty("--mf-size4", `${Math.round(260 * breathe)}% ${Math.round(220 * breathe2)}%`);
            manifestoSection.style.setProperty("--mf-size5", `${Math.round(360 * breathe2)}% ${Math.round(320 * breathe2)}%`);
            manifestoSection.style.setProperty("--mf-size6", `${Math.round(260 * breathe)}% ${Math.round(320 * breathe2)}%`);
            manifestoSection.style.setProperty("--mf-size7", `${Math.round(280 * breathe2)}% ${Math.round(240 * breathe)}%`);

            const strokeA = 0.10 + 0.14 * diff;
            manifestoSection.style.setProperty("--mf-stroke", `rgb(255 255 255 / ${strokeA.toFixed(3)})`);

            manifestoSection.style.setProperty("--manifesto-color", baseMolten);
            manifestoSection.style.setProperty("--manifesto-strong", strongMolten);
            manifestoSection.style.setProperty("--manifesto-fill", fill);

            manifestoSection.style.color = baseMolten;
          }
        }

        const textProgress = Math.max(0, Math.min(1, (s.p - 0.3) / 0.6));
        const smoothText = textProgress * textProgress * (3.0 - 2.0 * textProgress);
        const yOffset = (1.0 - smoothText) * 150;

        contentRef.current.style.opacity = smoothText.toFixed(3);
        contentRef.current.style.transform = `translate3d(0, ${yOffset.toFixed(1)}px, 0)`;
        contentRef.current.style.pointerEvents = smoothText > 0.8 ? "auto" : "none";
      }

      /* ---------------- RENDER ---------------- */
      const timeVal = Math.max(0, Math.min(1.25, s.p));
      const progress01 = Math.max(0, Math.min(1, timeVal));

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
        return;
      }
      if (loopRef.current && s.loaded) {
        cancelAnimationFrame(s.raf);
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

    const shouldLockNow = () => {
      if (s.lockDone) return false;
      const el = containerRef.current;
      if (!el) return false;
      const winH = window.innerHeight || 900;
      const rect = el.getBoundingClientRect();
      return rect.top <= 0 && rect.bottom >= winH * 0.85;
    };

    // Inside HeroMeltWebGL.tsx, locate the applyDelta function within the scroll-lock useEffect:

const applyDelta = (dy: number) => {
  const winH = window.innerHeight || 900;
  const lockDistance = winH;
  
  s.virtualScroll = Math.max(0, Math.min(lockDistance, s.virtualScroll + dy));
  
  // Precision check: When the melt hits the bottom of the lock
  if (s.virtualScroll >= lockDistance - 1) { 
    if (!s.lockDone) {
      s.lockDone = true;
      s.lockActive = false;
      
      // Fire the sync signal to Manifesto
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
      }
      e.preventDefault();
      applyDelta(e.deltaY);
      scheduleFixScroll();
    };

    const onTouchStart = (e: TouchEvent) => {
      if (shouldLockNow() && !s.lockActive) {
        s.lockActive = true;
        s.lockScrollY = window.scrollY;
      }
      lastTouchY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!shouldLockNow()) return;
      if (!s.lockActive) {
        s.lockActive = true;
        s.lockScrollY = window.scrollY;
      }
      const y = e.touches[0]?.clientY ?? lastTouchY;
      const dy = lastTouchY - y;
      lastTouchY = y;
      e.preventDefault();
      applyDelta(dy);
      scheduleFixScroll();
    };

    const prevOverscroll = document.documentElement.style.overscrollBehaviorY;
    document.documentElement.style.overscrollBehaviorY = "none";

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      document.documentElement.style.overscrollBehaviorY = prevOverscroll;
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  /* ---------------- WEBGL INIT ---------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: false,
    });

    if (!gl) return;
    const s = S.current;
    s.gl = gl;
    if (!s.seed) s.seed = Math.random() * 1000;
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

    s.triBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, s.triBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    [maskProg, renderProg, postProg, blitProg].forEach((p) => {
      const loc = gl.getAttribLocation(p, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    });

    s.u_mask = {
      logo: gl.getUniformLocation(maskProg, "u_logo"),
      prevMask: gl.getUniformLocation(maskProg, "u_prevMask"),
      res: gl.getUniformLocation(maskProg, "u_res"),
      imgRes: gl.getUniformLocation(maskProg, "u_imgRes"),
      cover: gl.getUniformLocation(maskProg, "u_cover"),
      time: gl.getUniformLocation(maskProg, "u_time"),
      anim: gl.getUniformLocation(maskProg, "u_anim"),
      seed: gl.getUniformLocation(maskProg, "u_seed"),
    };
    s.u_render = {
      logo: gl.getUniformLocation(renderProg, "u_logo"),
      mask: gl.getUniformLocation(renderProg, "u_mask"),
      res: gl.getUniformLocation(renderProg, "u_res"),
      imgRes: gl.getUniformLocation(renderProg, "u_imgRes"),
      cover: gl.getUniformLocation(renderProg, "u_cover"),
      anim: gl.getUniformLocation(renderProg, "u_anim"),
      seed: gl.getUniformLocation(renderProg, "u_seed"),
      progress: gl.getUniformLocation(renderProg, "u_progress"),
      brand: gl.getUniformLocation(renderProg, "u_brand"),
    };
    s.u_post = {
      scene: gl.getUniformLocation(postProg, "u_scene"),
      res: gl.getUniformLocation(postProg, "u_res"),
      anim: gl.getUniformLocation(postProg, "u_anim"),
      seed: gl.getUniformLocation(postProg, "u_seed"),
      progress: gl.getUniformLocation(postProg, "u_progress"),
    };
    s.u_blit = gl.getUniformLocation(blitProg, "u_tex");

    const logoTex = gl.createTexture();
    s.logoTex = logoTex;
    gl.bindTexture(gl.TEXTURE_2D, logoTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const MAX = 4096;
      const iw = img.naturalWidth || 1024;
      const ih = img.naturalHeight || 1024;
      const sc = Math.min(1, Math.min(MAX / iw, MAX / ih));
      const w = Math.max(1, Math.floor(iw * sc));
      const h = Math.max(1, Math.floor(ih * sc));
      s.imgW = w;
      s.imgH = h;

      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const ctx = off.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        gl.bindTexture(gl.TEXTURE_2D, s.logoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      }

      s.loaded = true;
      cancelAnimationFrame(s.raf);
      if (loopRef.current) s.raf = requestAnimationFrame(loopRef.current);
    };

    const resize = () => {
      // ✅ CRITICAL TS FIX: cache parent in a const
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();

      const isSmallScreen = window.matchMedia?.("(max-width: 768px)")?.matches ?? false;
      const isPortrait = rect.height >= rect.width;

      if (isSmallScreen && isPortrait) {
        const ar = rect.height / Math.max(1, rect.width);
        const t = Math.max(0, Math.min(1, (ar - 1.15) / 0.95));
        s.cover = t * 0.45;
      } else {
        s.cover = 0;
      }

      const dprCap = isSmallScreen ? 1.5 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);

      if (Math.abs(rect.width - s.lastLayoutW) < 1 && Math.abs(rect.height - s.lastLayoutH) < 1) return;

      s.lastLayoutW = rect.width;
      s.lastLayoutH = rect.height;

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const W = canvas.width;
      const H = canvas.height;

      if (s.maskTexA) gl.deleteTexture(s.maskTexA);
      if (s.maskTexB) gl.deleteTexture(s.maskTexB);
      if (s.fbA) gl.deleteFramebuffer(s.fbA);
      if (s.fbB) gl.deleteFramebuffer(s.fbB);

      s.maskTexA = makeTex(gl, W, H);
      s.maskTexB = makeTex(gl, W, H);
      s.fbA = s.maskTexA ? attachFB(gl, s.maskTexA) : null;
      s.fbB = s.maskTexB ? attachFB(gl, s.maskTexB) : null;
      s.ping = 0;

      if (s.sceneTex) gl.deleteTexture(s.sceneTex);
      if (s.sceneFB) gl.deleteFramebuffer(s.sceneFB);
      s.sceneTex = makeTex(gl, W, H);
      if (s.sceneTex) s.sceneFB = attachFB(gl, s.sceneTex);
    };

    const ro = new ResizeObserver(() => {
      // Debounce to a frame (avoids resize spam)
      requestAnimationFrame(resize);
    });

    // ✅ TS FIX: cache parent + guard before observe
    const parent = canvas.parentElement;
    if (!parent) return;
    ro.observe(parent);

    resize();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(s.raf);
      if (s.fixScrollRaf) cancelAnimationFrame(s.fixScrollRaf);

      const { gl } = s;
      if (gl) {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    };
  }, [imageSrc, shaders]);

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
        <img
          src={imageSrc}
          alt={posterAlt}
          width={posterWidth}
          height={posterHeight}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          style={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            maxWidth: "min(1200px, 88vw)",
            maxHeight: "min(520px, 40vh)",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            opacity: showPoster ? 1 : 0,
            transition: "opacity 420ms ease",
            zIndex: 2,
            pointerEvents: "none",
            filter: "contrast(1.02) saturate(1.02)",
          }}
        />

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
