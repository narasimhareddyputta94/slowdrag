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
  // slightly slower, more controllable progression
  float t = pow(p, 2.15);

  // per-column micro delay so it doesn't melt "all at once"
  float laneDelay = (fbm(vec2(uv.x * 4.2 + u_seed, 12.7)) - 0.5) * 0.22;
  float tt = clamp(t - laneDelay, 0.0, 1.25);
  // flow strength increases as melt progresses
  float flowStrength = (0.0005 + 0.0060 * smoothstep(0.06, 0.95, tt));
  float flowLane = smoothstep(0.10, 0.90, fbm(vec2(uv.x * 7.0 + u_seed, anim * 0.10)));
  vec2 ff = flowField(vec2(uv.x * 2.2 + u_seed * 0.07, uv.y * 2.2 + anim * 0.10));
  float flowX = ff.x * flowStrength * (0.30 + 0.70 * flowLane);
  float flowY = (abs(ff.y) * 0.55 + 0.45) * flowStrength * (0.55 + 0.65 * flowLane);
  // sample slightly above to pull mask down over time (monotonic via max)
  float carried = texture2D(u_prevMask, v_uv + vec2(-flowX, flowY)).r;
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
  float creep = smoothstep(0.25, 1.05, tt) * flowLane * 0.06;
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

  float anim = u_anim;
  float lane = smoothstep(0.16, 0.94, noise(vec2(uv.x * 8.5 + u_seed, 0.22 + anim * 0.08)));
  float micro = noise(vec2(uv.x * 78.0 + u_seed, m * 2.7 + 3.0 + anim * 0.22));
  float channel = mix(lane, micro, 0.20);

  float visc = smoothstep(0.10, 0.75, m) * (0.55 + 0.45 * channel);

  // slow heavy fall (adds a touch of animated ooze)
  float ooze = (noise(vec2(uv.x * 6.0 + u_seed, anim * 0.25 + uv.y * 2.0)) - 0.5);
  float g = m * (0.10 + 1.12 * channel) * (0.55 + 0.45 * visc);
  g *= (1.0 + ooze * 0.06 * smoothstep(0.08, 0.75, m));

  float widen = smoothstep(0.04, 0.70, g) * (0.0030 + 0.030 * (0.35 + 0.65 * channel));
  widen *= (0.70 + 0.70 * smoothstep(0.25, 0.95, m));

  vec2 ff = flowField(vec2(uv.x * 2.0 + u_seed * 0.09, uv.y * 2.0 + anim * 0.10));
  float wob = (ff.x * 0.85 + ff.y * 0.35) * (0.0010 + 0.016 * visc) * meltAmt;
  wob += sin(uv.y * 18.0 + m * 6.0 + channel * 5.0 + anim * 0.9) * (0.0006 + 0.010 * visc) * meltAmt;

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
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 lightDir = normalize(vec3(-0.35, 0.55, 0.75));
  float ndl = clamp(dot(nrm, lightDir), 0.0, 1.0);
  vec3 h = normalize(lightDir + viewDir);
  float specN = pow(clamp(dot(nrm, h), 0.0, 1.0), 26.0);
  float fres = pow(1.0 - clamp(dot(nrm, viewDir), 0.0, 1.0), 2.2);

  vec2 s0 = vec2(uv.x + wob,            uv.y + g + headPull);
  vec2 s1 = vec2(uv.x + wob * 0.65,     uv.y + g * 0.78 + headPull * 0.65);
  vec2 s2 = vec2(uv.x + wob * 0.30,     uv.y + g * 0.52 + headPull * 0.30);
  vec2 s3 = vec2(uv.x + wob * 0.12,     uv.y + g * 0.30);

  // clamp sampling so drips can render outside the logo bounds
  vec4 c0 = texture2D(u_logo, clamp(s0, 0.0, 1.0));
  vec4 c1 = texture2D(u_logo, clamp(s1, 0.0, 1.0));
  vec4 c2 = texture2D(u_logo, clamp(s2, 0.0, 1.0));
  vec4 c3 = texture2D(u_logo, clamp(s3, 0.0, 1.0));

  vec4 tex = c0 * 0.58 + c1 * 0.22 + c2 * 0.13 + c3 * 0.07;

  vec4 l  = texture2D(u_logo, clamp(s0 + vec2(-widen, 0.0), 0.0, 1.0));
  vec4 r  = texture2D(u_logo, clamp(s0 + vec2( widen, 0.0), 0.0, 1.0));
  vec4 ll = texture2D(u_logo, clamp(s0 + vec2(-widen*2.0, 0.0), 0.0, 1.0));
  vec4 rr = texture2D(u_logo, clamp(s0 + vec2( widen*2.0, 0.0), 0.0, 1.0));

  float thickMix = smoothstep(0.02, 0.55, g);
  tex = mix(tex, tex * 0.48 + (l + r) * 0.26 + (ll + rr) * 0.10, thickMix);

  // Keep the original image sharp above the melt.
  float baseKeep = inBounds ? (1.0 - meltAmt) : 0.0;
  vec4 baseOut = vec4(base.rgb * baseKeep, baseA * baseKeep);

  float liquidAlpha = tex.a * meltAmt;

  // colors
  vec3 white = vec3(1.0);
  vec3 neon  = vec3(1.0, 0.20, 0.70);
  vec3 hot   = vec3(0.80, 0.06, 0.42);
  vec3 deep  = vec3(0.20, 0.00, 0.10);

  float heat1 = smoothstep(0.00, 0.25, g);
  float heat2 = smoothstep(0.25, 0.95, g);
  vec3 col1 = mix(white, neon, heat1);
  vec3 col2 = mix(col1, hot, heat2);
  vec3 wax  = mix(col2, deep, smoothstep(0.85, 1.10, g));

  float e = edgeAlpha(u_logo, s0, u_res);
  float edgeGlow = smoothstep(0.02, 0.22, e);

  float fresh = smoothstep(0.10, 0.55, m) * (1.0 - smoothstep(0.85, 1.05, m));
  float headGlow = head * (0.35 + 0.65 * smoothstep(0.15, 0.60, g));

  float glowAmt = (edgeGlow * 0.92 + headGlow * 0.85 + fresh * 0.35);
  glowAmt *= (0.32 + 1.22 * smoothstep(0.05, 0.92, g));

  // simple specular sheen to make it feel wet
  float spec = pow(smoothstep(0.10, 0.65, head) * smoothstep(0.08, 0.85, visc), 1.5);
  spec *= (0.35 + 0.65 * smoothstep(0.10, 0.75, g));
  spec *= (0.65 + 0.35 * sin(anim * 1.6 + uv.y * 10.0 + channel * 4.0));

  // emissive glow (not multiplied by alpha)
  vec3 emissive = neon * glowAmt * 1.35 + hot * glowAmt * 0.75 + white * spec * 0.16;

  // Liquid inherits some of the source image color (keeps it recognizable) then warms up.
  vec3 src = (tex.a > 0.0001) ? (tex.rgb / tex.a) : vec3(0.0);

  // subtle refraction (only in melted region)
  vec2 refr = nrm.xy * (0.007 + 0.020 * channel) * meltAmt;
  vec4 refrS = texture2D(u_logo, clamp(uvC + refr, 0.0, 1.0));
  vec3 refrSrc = (refrS.a > 0.0001) ? (refrS.rgb / refrS.a) : vec3(0.0);

  vec3 srcMix = mix(src, refrSrc, 0.35 + 0.25 * fres);
  vec3 srcTint = mix(srcMix, wax, 0.55 + 0.30 * smoothstep(0.10, 0.85, g));
  vec3 body = srcTint * liquidAlpha;

  // extra highlight for the melt front + wet sheen
  float edge = smoothstep(0.02, 0.22, length(grad) * 5.0);
  float frontBand = edge * smoothstep(0.06, 0.30, m) * (1.0 - smoothstep(0.55, 0.95, m));
  vec3 sheen = (white * (0.08 + 0.18 * ndl) + neon * (0.12 + 0.40 * fres) + hot * (0.10 + 0.55 * specN));
  sheen *= (0.18 + 0.82 * frontBand) * meltAmt;

  float grain = (hash21(gl_FragCoord.xy + u_seed*100.0) - 0.5) * 0.02 * meltAmt;
  vec3 rgb = baseOut.rgb + body + emissive * meltAmt + sheen + grain;

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

  // subtle chromatic aberration
  float aberr = 1.0 + 0.22 * pr * (hash21(vec2(u_seed, u_anim)) - 0.5);
  vec2 off = px * aberr;

  float r = texture2D(u_scene, uv + off).r;
  float g = texture2D(u_scene, uv).g;
  float b = texture2D(u_scene, uv - off).b;
  vec3 base = vec3(r,g,b);

  // bloom
  vec3 blur =
    texture2D(u_scene, uv + px*vec2(-2.0,-2.0)).rgb +
    texture2D(u_scene, uv + px*vec2( 0.0,-2.0)).rgb +
    texture2D(u_scene, uv + px*vec2( 2.0,-2.0)).rgb +
    texture2D(u_scene, uv + px*vec2(-2.0, 0.0)).rgb +
    texture2D(u_scene, uv + px*vec2( 0.0, 0.0)).rgb +
    texture2D(u_scene, uv + px*vec2( 2.0, 0.0)).rgb +
    texture2D(u_scene, uv + px*vec2(-2.0, 2.0)).rgb +
    texture2D(u_scene, uv + px*vec2( 0.0, 2.0)).rgb +
    texture2D(u_scene, uv + px*vec2( 2.0, 2.0)).rgb;

  blur *= (1.0/9.0);

  float luma = dot(base, vec3(0.2126, 0.7152, 0.0722));
  float bloomMask = smoothstep(0.16, 0.50, luma);
  vec3 bloom = blur * bloomMask * (1.20 + 1.20 * pr);

  // vignette
  vec2 q = uv - 0.5;
  float vig = smoothstep(0.98, 0.22, dot(q,q));
  base *= vig;

  // grain + micro flicker
  float grain = (hash21(gl_FragCoord.xy + u_seed*100.0) - 0.5) * 0.040 * pr;
  float flicker = (hash21(vec2(u_seed, u_seed*2.0 + u_anim)) - 0.5) * 0.012 * pr;

  vec3 color = base + bloom * pr + grain + flicker;
  color = tonemapFilmic(color);

  gl_FragColor = vec4(color, 1.0);
}
`;

export default function HeroMeltWebGL({ imageSrc, onScrolledChange }: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const shaders = useMemo(() => ({ VERT, MASK_FRAG, RENDER_FRAG, POST_FRAG }), []);

  const S = useRef({
    gl: null as WebGLRenderingContext | null,

    maskProg: null as WebGLProgram | null,
    renderProg: null as WebGLProgram | null,
    postProg: null as WebGLProgram | null,

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
  });

  const loop = () => {
    const s = S.current;
    const gl = s.gl;
    const canvas = canvasRef.current;
    if (!gl || !canvas || !s.loaded || !s.maskProg || !s.renderProg || !s.postProg) return;

    const anim = (performance.now() - s.t0) * 0.001;

    // slower smoothing = thicker feel
    s.p += (s.target - s.p) * 0.040;
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
    if (!maskProg || !renderProg || !postProg) return;

    s.maskProg = maskProg;
    s.renderProg = renderProg;
    s.postProg = postProg;

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

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const W = canvas.width;
      const H = canvas.height;

      // mask ping-pong
      if (s.maskTexA) gl.deleteTexture(s.maskTexA);
      if (s.maskTexB) gl.deleteTexture(s.maskTexB);
      if (s.fbA) gl.deleteFramebuffer(s.fbA);
      if (s.fbB) gl.deleteFramebuffer(s.fbB);

      s.maskTexA = makeTex(gl, W, H);
      s.maskTexB = makeTex(gl, W, H);
      if (s.maskTexA) s.fbA = attachFB(gl, s.maskTexA);
      if (s.maskTexB) s.fbB = attachFB(gl, s.maskTexB);

      // clear masks to 0
      if (s.fbA && s.fbB) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, s.fbA);
        gl.viewport(0, 0, W, H);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, s.fbB);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }

      // scene buffer
      if (s.sceneTex) gl.deleteTexture(s.sceneTex);
      if (s.sceneFB) gl.deleteFramebuffer(s.sceneFB);

      s.sceneTex = makeTex(gl, W, H);
      if (s.sceneTex) s.sceneFB = attachFB(gl, s.sceneTex);

      s.ping = 0;
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
      const start = vh * 0.02; // deadzone so it stays perfectly still on load
      s.target = Math.max(0, window.scrollY - start) / (vh * 0.9);
      onScrolledChange?.(window.scrollY > 10);
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
      style={{
        height: "100vh",
        width: "100%",
        background: "#000",
        position: "relative",
        overflow: "hidden",
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
    </section>
  );
}
