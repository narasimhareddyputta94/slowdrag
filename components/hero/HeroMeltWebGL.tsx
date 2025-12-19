"use client";

import { useEffect, useMemo, useRef } from "react";

type HeroProps = {
  imageSrc: string;
  onScrolledChange?: (scrolled: boolean) => void;
};

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

  // per-column micro delay so it doesn't melt "all at once"
  float laneDelay = (fbm(vec2(uv.x * 4.2 + u_seed, 12.7)) - 0.5) * 0.22;
  float tt = clamp(t - laneDelay, 0.0, 1.25);
  // flow strength increases as melt progresses
  // heavier syrup: slower flow
  float flowStrength = (0.00035 + 0.0042 * smoothstep(0.08, 0.98, tt));
  float flowLane = smoothstep(0.10, 0.90, fbm(vec2(uv.x * 7.0 + u_seed, anim * 0.10)));
  vec2 ff = flowField(vec2(uv.x * 2.2 + u_seed * 0.07, uv.y * 2.2 + anim * 0.10));
  // natural-ish velocity (gravity-biased curl flow)
  float laneAmt = (0.30 + 0.70 * flowLane);
  float gravAmt = (0.55 + 0.45 * smoothstep(0.10, 1.05, tt));
  float velX = ff.x * flowStrength * laneAmt;
  float velY = mix(abs(ff.y), 1.0, 0.45) * flowStrength * (0.55 + 0.55 * laneAmt) * gravAmt;

  // multi-sample advection: longer, smoother drips
  float carried1 = texture2D(u_prevMask, v_uv + vec2(-velX, velY)).r;
  float carried2 = texture2D(u_prevMask, v_uv + vec2(-velX * 1.75, velY * 1.65)).r;
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

  vec2 px = 1.0 / u_res;

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
  float globMask = smoothstep(0.60, 0.92, globN) * bottomEdge;

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

  newMelt += globMask * visc * (0.12 + 0.25 * tt);

  // let accumulated mask keep creeping downward (still monotonic)
  // slower creep so it feels thick
  float creep = smoothstep(0.28, 1.10, tt) * flowLane * 0.035;
  float next = max(prev, clamp(newMelt + prev * creep, 0.0, 1.0));
  gl_FragColor = vec4(next, 0.0, 0.0, 1.0);
}
`;

// PASS 2: render thick slow glowing liquid using the mask
const RENDER_FRAG = `
precision highp float;

uniform sampler2D u_logo;
uniform sampler2D u_mask;
uniform vec2  u_res;
uniform vec2  u_imgRes;
uniform float u_anim;
uniform float u_seed;
uniform float u_progress;

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

vec2 aspectFitUV(vec2 uv, vec2 canvasPx, vec2 imgPx){
  float ca = canvasPx.x / canvasPx.y;
  float ia = imgPx.x / imgPx.y;
  vec2 scale = vec2(1.0);
  if (ia > ca) scale.y = ca / ia;
  else scale.x = ia / ca;
  return (uv - 0.5) * scale + 0.5;
}

vec4 sampleLogoSafe(sampler2D tex, vec2 uv){
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(tex, uv);
}

float edgeAlpha(sampler2D tex, vec2 uv, vec2 res){
  vec2 px = 1.0 / res;
  float a  = texture2D(tex, uv).a;
  float ax = texture2D(tex, uv + vec2(px.x,0.0)).a;
  float ay = texture2D(tex, uv + vec2(0.0,px.y)).a;
  return abs(a-ax) + abs(a-ay);
}

void main() {
  float m = texture2D(u_mask, v_uv).r;
  vec2 uv = aspectFitUV(v_uv, u_res, u_imgRes);

  bool inBounds = !(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0);
  vec2 uvC = clamp(uv, 0.0, 1.0);

  vec4 base = inBounds ? texture2D(u_logo, uv) : vec4(0.0);
  float baseA = base.a;
  // If we're out of bounds, still allow mask-driven drips to show.
  if (!inBounds && m < 0.001) { gl_FragColor = vec4(0.0); return; }

  // At rest: keep image pixel-perfect.
  float pr = clamp(u_progress, 0.0, 1.0);
  float meltAmt = smoothstep(0.02, 0.85, m) * pr;

  // Keep the top more intact (reference keeps crisp letters while drips form).
  float topHold = smoothstep(0.58, 0.84, uv.y);
  meltAmt *= (1.0 - 0.70 * topHold);

  float anim = u_anim;
  float lane = smoothstep(0.16, 0.94, noise(vec2(uv.x * 8.5 + u_seed, 0.22 + anim * 0.08)));
  float micro = noise(vec2(uv.x * 78.0 + u_seed, m * 2.7 + 3.0 + anim * 0.22));
  float channel = mix(lane, micro, 0.20);

  float visc = smoothstep(0.08, 0.78, m) * (0.62 + 0.38 * channel);

  // A band around the melt-front: prevents the whole logo becoming one big sheet at the end.
  float mBand = smoothstep(0.10, 0.72, m) * (1.0 - smoothstep(0.82, 1.02, m));

  // slow heavy fall (adds a touch of animated ooze)
  float ooze = (noise(vec2(uv.x * 4.6 + u_seed, anim * 0.18 + uv.y * 1.6)) - 0.5);
  float dripSel = smoothstep(0.22, 0.86, channel);
  float g = mBand * (0.10 + 0.90 * dripSel) * (0.70 + 0.30 * visc);
  // still allow a tiny amount of late creep so drips feel heavy, not frozen
  g += pow(clamp(m, 0.0, 1.0), 2.2) * 0.010 * (0.45 + 0.55 * dripSel);
  g *= (1.0 + ooze * 0.035 * smoothstep(0.10, 0.82, m));

  // thicker body
  float widen = smoothstep(0.05, 0.72, g) * (0.0045 + 0.030 * (0.30 + 0.70 * dripSel));
  widen *= (0.85 + 0.65 * smoothstep(0.20, 0.92, m));

  vec2 ff = flowField(vec2(uv.x * 2.0 + u_seed * 0.09, uv.y * 2.0 + anim * 0.10));
  // heavier syrup: reduced lateral splashes
  float wob = (ff.x * 0.85 + ff.y * 0.35) * (0.0007 + 0.010 * visc) * meltAmt;
  wob += sin(uv.y * 14.0 + m * 5.0 + channel * 4.0 + anim * 0.75) * (0.00045 + 0.0065 * visc) * meltAmt;
  float swirl = fbm(vec2(uv.x * 1.05 + u_seed * 0.11, uv.y * 1.05 + anim * 0.14)) - 0.5;
  wob += swirl * (0.00045 + 0.0065 * visc) * meltAmt;

  float head = smoothstep(0.15, 0.85, m) * (0.35 + 0.65 * channel);
  float headPull = head * (0.02 + 0.18 * m);

  // Mask gradient -> fake surface normal (for rim/specular + refraction)
  vec2 px = 1.0 / u_res;
  float mL = texture2D(u_mask, v_uv - vec2(px.x, 0.0)).r;
  float mR = texture2D(u_mask, v_uv + vec2(px.x, 0.0)).r;
  float mD = texture2D(u_mask, v_uv - vec2(0.0, px.y)).r;
  float mU = texture2D(u_mask, v_uv + vec2(0.0, px.y)).r;
  vec2 grad = vec2(mR - mL, mU - mD);
  vec3 nrm = normalize(vec3(-grad * 2.8, 1.0));

  // micro surface detail so the syrup feels less "CG smooth"
  float microN = (noise(vec2(uvC.x * 160.0 + u_seed, uvC.y * 160.0 + u_anim * 0.70)) - 0.5);
  nrm = normalize(nrm + vec3(microN * 0.22 * meltAmt, microN * 0.12 * meltAmt, 0.0));

  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 lightDir1 = normalize(vec3(-0.35, 0.55, 0.75));
  vec3 lightDir2 = normalize(vec3( 0.62, 0.15, 0.77));

  float ndl1 = clamp(dot(nrm, lightDir1), 0.0, 1.0);
  float ndl2 = clamp(dot(nrm, lightDir2), 0.0, 1.0);
  float ndl = ndl1 * 0.78 + ndl2 * 0.22;

  vec3 h1 = normalize(lightDir1 + viewDir);
  vec3 h2 = normalize(lightDir2 + viewDir);

  // thickness-driven gloss: thicker syrup = tighter, "wet" highlight
  float thickForGloss = clamp(smoothstep(0.10, 0.92, m) * (0.55 + 0.45 * smoothstep(0.05, 0.80, g)), 0.0, 1.0);
  float glossPow = mix(24.0, 115.0, thickForGloss);
  float spec1 = pow(clamp(dot(nrm, h1), 0.0, 1.0), glossPow);
  float spec2 = pow(clamp(dot(nrm, h2), 0.0, 1.0), glossPow * 0.75);

  float fres = pow(1.0 - clamp(dot(nrm, viewDir), 0.0, 1.0), 2.2);
  float backL = clamp(dot(nrm, -lightDir1), 0.0, 1.0);

  // IMPORTANT: sample from ABOVE to pull the logo downward into drips.
  // (Sampling with +g smears/clamps the bottom edge into a big blob.)
  vec2 s0p = vec2(uv.x + wob,            uv.y - g - headPull);
  vec2 s1p = vec2(uv.x + wob * 0.65,     uv.y - g * 0.78 - headPull * 0.65);
  vec2 s2p = vec2(uv.x + wob * 0.30,     uv.y - g * 0.52 - headPull * 0.30);
  vec2 s3p = vec2(uv.x + wob * 0.12,     uv.y - g * 0.30);

  // Avoid edge-clamp smearing: treat out-of-bounds samples as transparent.
  vec4 c0 = sampleLogoSafe(u_logo, s0p);
  vec4 c1 = sampleLogoSafe(u_logo, s1p);
  vec4 c2 = sampleLogoSafe(u_logo, s2p);
  vec4 c3 = sampleLogoSafe(u_logo, s3p);

  // Reduce "echo" ghosting of the logo in the melt.
  vec4 tex = c0 * 0.85 + c1 * 0.10 + c2 * 0.04 + c3 * 0.01;

  vec4 l  = sampleLogoSafe(u_logo, s0p + vec2(-widen, 0.0));
  vec4 r  = sampleLogoSafe(u_logo, s0p + vec2( widen, 0.0));
  vec4 ll = sampleLogoSafe(u_logo, s0p + vec2(-widen*2.0, 0.0));
  vec4 rr = sampleLogoSafe(u_logo, s0p + vec2( widen*2.0, 0.0));

  float thickMix = smoothstep(0.02, 0.55, g);
  tex = mix(tex, tex * 0.48 + (l + r) * 0.26 + (ll + rr) * 0.10, thickMix);

  // Keep the original image sharp above the melt.
  float baseKeep = inBounds ? (1.0 - meltAmt) : 0.0;
  vec4 baseOut = vec4(base.rgb * baseKeep, baseA * baseKeep);

  // Keep the logo core color (reference keeps it crisp/white); color comes from the melt + glow.

  // Pixel dissolve: pixels disappear as melt completes.
  // Keep finished state stable (no chunky dissolve). Leave a tiny micro-breakup only at the very end.
  float pix = hash21(floor(uvC * 1400.0) + u_seed * 10.0);
  float dissolve = smoothstep(0.985, 1.00, m) * smoothstep(0.85, 1.00, pr);
  float keepPix = mix(1.0, smoothstep(dissolve - 0.02, dissolve + 0.02, pix), 0.10);

  // Make the melt form into lanes (drips) instead of a full sheet.
  // More negative space between drips (prevents end-state from becoming a solid sheet).
  float laneCut = mix(0.35, 1.0, dripSel);
  float liquidAlpha = tex.a * meltAmt * keepPix * laneCut;

  // colors (pink-only liquid)
  vec3 pinkA = vec3(1.0, 0.24, 0.70);
  vec3 pinkB = vec3(1.0, 0.58, 0.92);

  float heat = smoothstep(0.00, 1.00, g);
  vec3 wax = mix(pinkB, pinkA, heat);

  float e = edgeAlpha(u_logo, s0p, u_res);
  float edgeGlow = smoothstep(0.02, 0.22, e);

  float fresh = smoothstep(0.10, 0.55, m) * (1.0 - smoothstep(0.85, 1.05, m));
  float headGlow = head * (0.35 + 0.65 * smoothstep(0.15, 0.60, g));

  float glowAmt = (edgeGlow * 0.92 + headGlow * 0.85 + fresh * 0.35);
  glowAmt *= (0.32 + 1.22 * smoothstep(0.05, 0.92, g));

  // wet specular envelope (stable, less "sparkly")
  float wet = pow(smoothstep(0.12, 0.70, head) * smoothstep(0.10, 0.90, visc), 1.25);
  wet *= (0.35 + 0.65 * smoothstep(0.08, 0.85, g));

  float spec = (spec1 * 0.95 + spec2 * 0.55) * wet;

  // Melt-front band (used for hot rim + sheen). Needs to be defined before emissive.
  float edge = smoothstep(0.02, 0.22, length(grad) * 5.0);
  float frontBand = edge * smoothstep(0.06, 0.30, m) * (1.0 - smoothstep(0.55, 0.95, m));

  // coverage gate keeps glow attached to the shape, but still lets a halo form
  float coverage = clamp(baseA + liquidAlpha, 0.0, 1.0);
  float covG = smoothstep(0.02, 0.28, coverage);

  // reference-style look: hot white core at edges + magenta halo
  float hotEdge = smoothstep(0.06, 0.22, e) * (0.35 + 0.65 * frontBand) * meltAmt;
  // keep it from washing the whole sheet
  hotEdge *= (0.25 + 0.75 * mBand);
  vec3 hotCore = vec3(1.0) * hotEdge * 1.15;

  vec3 magenta = mix(pinkA, pinkB, 0.55);
  vec3 halo = magenta * glowAmt * (0.65 + 0.55 * fres) * meltAmt;
  halo *= (0.22 + 0.78 * mBand);

  // emissive stays pink-dominant; white is concentrated at the rim only
  vec3 emissive = (halo + hotCore + pinkB * spec * 0.10) * covG;

  // Liquid should stay pink (avoid white source-color bleeding).

  // subtle refraction (only in melted region)
  vec2 refr = nrm.xy * (0.007 + 0.020 * channel) * meltAmt;
  vec4 refrS = sampleLogoSafe(u_logo, uvC + refr);
  vec3 refrSrc = (refrS.a > 0.0001) ? (refrS.rgb / refrS.a) : vec3(0.0);

  // Use refraction only as a subtle brightness/detail signal, not as color.
  float refrLum = dot(refrSrc, vec3(0.2126, 0.7152, 0.0722));
  float detail = smoothstep(0.05, 0.95, refrLum);

  // Reference look: keep a bright white core and let magenta live on edges/glow.
  float thick = clamp(smoothstep(0.08, 0.95, m) * (0.40 + 0.60 * smoothstep(0.05, 0.85, g)) + head * 0.18, 0.0, 1.0);
  float rim = pow(clamp(fres, 0.0, 1.0), 1.15);
  float edgeTint = clamp(0.22 + 0.62 * rim + 0.28 * thick, 0.0, 1.0);

  vec3 coreWhite = vec3(1.0);
  vec3 edgePink = mix(pinkA, pinkB, 0.55);
  vec3 bodyColor = mix(coreWhite, edgePink, edgeTint);

  // slight lighting so the body doesn't feel flat, but never goes dark/purple
  bodyColor *= (0.92 + 0.18 * ndl);
  bodyColor *= (0.88 + 0.22 * detail);
  vec3 body = bodyColor * liquidAlpha;

  // extra highlight for the melt front + wet sheen
  vec3 sheen = (pinkB * (0.08 + 0.24 * ndl) + pinkB * (0.10 + 0.42 * fres) + pinkA * (0.10 + 0.70 * spec));
  sheen *= (0.16 + 0.84 * frontBand) * meltAmt;

  // Multiplicative grain avoids clamping-to-black speckles.
  float grain = (hash21(gl_FragCoord.xy + u_seed*100.0) - 0.5) * 0.02 * meltAmt;
  vec3 rgb = baseOut.rgb + body + emissive + sheen;
  rgb *= (1.0 + grain);

  float outA = clamp(baseOut.a + liquidAlpha, 0.0, 1.0);
  gl_FragColor = vec4(rgb, outA);
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
    gl_FragColor = texture2D(u_scene, uv);
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

  // weighted bloom (soft knee threshold) for a more filmic highlight rolloff
  vec3 c00 = texture2D(u_scene, uv).rgb;
  vec3 c10 = texture2D(u_scene, uv + px*vec2( 1.5, 0.0)).rgb;
  vec3 c_10 = texture2D(u_scene, uv + px*vec2(-1.5, 0.0)).rgb;
  vec3 c01 = texture2D(u_scene, uv + px*vec2(0.0, 1.5)).rgb;
  vec3 c0_1 = texture2D(u_scene, uv + px*vec2(0.0,-1.5)).rgb;
  vec3 c11 = texture2D(u_scene, uv + px*vec2( 1.5, 1.5)).rgb;
  vec3 c_11 = texture2D(u_scene, uv + px*vec2(-1.5, 1.5)).rgb;
  vec3 c1_1 = texture2D(u_scene, uv + px*vec2( 1.5,-1.5)).rgb;
  vec3 c_1_1 = texture2D(u_scene, uv + px*vec2(-1.5,-1.5)).rgb;

  vec3 blur =
    c00 * 0.204164 +
    (c10 + c_10 + c01 + c0_1) * 0.123841 +
    (c11 + c_11 + c1_1 + c_1_1) * 0.075113;

  float lum = luma(base);
  float threshold = 0.88;
  float knee = 0.20;
  float soft = clamp((lum - threshold + knee) / (2.0 * knee), 0.0, 1.0);
  float bloomMask = soft * soft;
  // Brighter bloom to make the white core + halo "pop" like the reference.
  vec3 bloom = blur * bloomMask * (0.28 + 0.42 * pr);

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

export default function HeroMeltWebGL({ imageSrc, onScrolledChange }: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const holdRef = useRef<HTMLElement | null>(null);
  const pinWrapRef = useRef<HTMLDivElement | null>(null);

  const shaders = useMemo(() => ({ VERT, MASK_FRAG, RENDER_FRAG, POST_FRAG }), []);

  const S = useRef({
    gl: null as WebGLRenderingContext | null,

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
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(s.renderProg);
    gl.uniform2f(s.ru_res, W, H);
    gl.uniform2f(s.ru_imgRes, s.imgW, s.imgH);
    if (s.ru_anim) gl.uniform1f(s.ru_anim, anim);
    gl.uniform1f(s.ru_seed, s.seed);
    if (s.ru_progress) gl.uniform1f(s.ru_progress, progress01);

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

    // uniforms post
    s.pu_scene = gl.getUniformLocation(postProg, "u_scene");
    s.pu_res = gl.getUniformLocation(postProg, "u_res");
    s.pu_anim = gl.getUniformLocation(postProg, "u_anim");
    s.pu_seed = gl.getUniformLocation(postProg, "u_seed");
    s.pu_progress = gl.getUniformLocation(postProg, "u_progress");

    s.bu_tex = gl.getUniformLocation(blitProg, "u_tex");

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
      const vh = window.innerHeight || 1;
      const el = holdRef.current;
      const pinWrap = pinWrapRef.current;

      if (!el) {
        const start = vh * 0.02;
        s.target = Math.max(0, window.scrollY - start) / (vh * 0.9);
        onScrolledChange?.(window.scrollY > 10);
        return;
      }

      // Pin behavior: keep the hero perfectly on-screen for the whole section.
      // - fixed while the section spans the viewport
      // - absolute before/after so it participates in normal layout
      if (pinWrap) {
        const rect = el.getBoundingClientRect();
        const within = rect.top <= 0 && rect.bottom >= vh;
        if (within) {
          pinWrap.style.position = "fixed";
          pinWrap.style.top = "0px";
          pinWrap.style.left = "0px";
          pinWrap.style.right = "0px";
        } else if (rect.top > 0) {
          pinWrap.style.position = "absolute";
          pinWrap.style.top = "0px";
          pinWrap.style.left = "0px";
          pinWrap.style.right = "0px";
        } else {
          const topPx = Math.max(0, el.offsetHeight - vh);
          pinWrap.style.position = "absolute";
          pinWrap.style.top = `${topPx}px`;
          pinWrap.style.left = "0px";
          pinWrap.style.right = "0px";
        }
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
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
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
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, shaders.VERT, shaders.MASK_FRAG, shaders.RENDER_FRAG, shaders.POST_FRAG]);

  return (
    <section
      ref={holdRef}
      style={{
        height: "180vh",
        width: "100%",
        background: "#000",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        ref={pinWrapRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100vh",
          width: "100%",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
