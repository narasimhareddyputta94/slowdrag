"use client";

type UniformLoc = WebGLUniformLocation | null;

type HeroMeltUniformsMask = {
  logo: UniformLoc;
  prevMask: UniformLoc;
  res: UniformLoc;
  imgRes: UniformLoc;
  cover: UniformLoc;
  time: UniformLoc;
  anim: UniformLoc;
  seed: UniformLoc;
};

type HeroMeltUniformsRender = {
  logo: UniformLoc;
  mask: UniformLoc;
  res: UniformLoc;
  imgRes: UniformLoc;
  cover: UniformLoc;
  anim: UniformLoc;
  seed: UniformLoc;
  progress: UniformLoc;
  brand: UniformLoc;
};

type HeroMeltUniformsPost = {
  scene: UniformLoc;
  res: UniformLoc;
  anim: UniformLoc;
  seed: UniformLoc;
  progress: UniformLoc;
};

export type HeroMeltRuntimeState = {
  gl: WebGLRenderingContext | null;
  maskProg: WebGLProgram | null;
  renderProg: WebGLProgram | null;
  postProg: WebGLProgram | null;
  blitProg: WebGLProgram | null;
  triBuf: WebGLBuffer | null;
  logoTex: WebGLTexture | null;
  maskTexA: WebGLTexture | null;
  maskTexB: WebGLTexture | null;
  fbA: WebGLFramebuffer | null;
  fbB: WebGLFramebuffer | null;
  sceneTex: WebGLTexture | null;
  sceneFB: WebGLFramebuffer | null;
  ping: number;
  u_mask: HeroMeltUniformsMask | Record<string, UniformLoc>;
  u_render: HeroMeltUniformsRender | Record<string, UniformLoc>;
  u_post: HeroMeltUniformsPost | Record<string, UniformLoc>;
  u_blit: UniformLoc;
  raf: number;
  t0: number;
  seed: number;
  loaded: boolean;
  imgW: number;
  imgH: number;
  lastLayoutW: number;
  lastLayoutH: number;
  cover: number;

  /* ── Adaptive DPR ── */
  currentDpr: number;
  dprFrameTimes: Float64Array;
  dprFrameIdx: number;
  dprStableCount: number;
  dprCooldownMs: number;
  dprLastAdjustMs: number;

  /* ── Resize debounce ── */
  resizePending: boolean;
  resizeRafId: number;
  adaptDpr?: (now: number, frameMs: number) => void;
};

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

type HeroMeltRuntimeParams = {
  canvas: HTMLCanvasElement;
  imageSrc: string;
  state: HeroMeltRuntimeState;
  getLoop: () => (() => void) | null;
  onHeroReady: () => void;
};

/* ---------------- WebGL Helpers ---------------- */
function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("[HeroMelt] Shader compile error:", gl.getShaderInfoLog(sh));
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
  if (!v || !f) { console.error("[HeroMelt] Shader(s) failed to compile"); return null; }
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error("[HeroMelt] Program link error:", gl.getProgramInfoLog(p));
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
  float a = hash21(i);
  float b = hash21(i + vec2(1.0,0.0));
  float c = hash21(i + vec2(0.0,1.0));
  float d = hash21(i + vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
// Adaptive FBM: 5th octave fades in with melt progress to save GPU early on
float fbm(vec2 p, float detail){
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  // 5th octave only when detail > 0 (melt has progressed)
  v += a * noise(p) * detail;
  return v;
}

vec2 flowField(vec2 p, float detail){
  float e = 0.18;
  float n1 = fbm(p + vec2(e, 0.0), detail);
  float n2 = fbm(p - vec2(e, 0.0), detail);
  float n3 = fbm(p + vec2(0.0, e), detail);
  float n4 = fbm(p - vec2(0.0, e), detail);
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

  // Adaptive detail: 5th FBM octave fades in after melt starts (saves ~20% GPU early)
  float detail = smoothstep(0.15, 0.50, t);

  vec2 px = 1.0 / u_res;
  float sourceAbove = texture2D(u_logo, vec2(uv.x, clamp(uv.y + px.y * 18.0, 0.0, 1.0))).a;
  float columnHold = smoothstep(0.05, 0.32, sourceAbove);
  float laneDelay = (fbm(vec2(uv.x * 4.2 + u_seed, 12.7), detail) - 0.5) * 0.15;
  float tt = clamp(t - laneDelay, 0.0, 1.25);
  float flowStrength = (0.0004 + 0.0048 * smoothstep(0.08, 0.98, tt)) * mix(0.55, 1.0, columnHold);
  float flowLane = smoothstep(0.10, 0.90, fbm(vec2(uv.x * 7.0 + u_seed, u_anim * 0.08), detail));
  vec2 ff = flowField(vec2(uv.x * 2.2 + u_seed * 0.07, uv.y * 2.2 + u_anim * 0.08), detail);
  float laneAmt = (0.35 + 0.65 * flowLane);
  float gravAmt = (0.55 + 0.45 * smoothstep(0.10, 1.05, tt));
  float velX = ff.x * flowStrength * laneAmt * mix(0.08, 0.28, columnHold);
  float velY = mix(abs(ff.y), 1.0, 0.55) * flowStrength * (0.62 + 0.52 * laneAmt) * gravAmt * mix(0.85, 1.20, columnHold);
  float carried1 = texture2D(u_prevMask, v_uv + vec2(-velX, velY * 1.1)).r;
  float carried2 = texture2D(u_prevMask, v_uv + vec2(-velX * 1.65, velY * 1.8)).r;
  float carried3 = texture2D(u_prevMask, v_uv + vec2(-velX * 2.2, velY * 2.5)).r;
  float carried = max(max(carried1, carried2 * 0.9965), carried3 * 0.993);
  float prev = max(prev0, carried * 0.998);

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(prev, 0.0, 0.0, 1.0); return; }
  float a0 = texture2D(u_logo, uv).a;
  if (a0 < 0.001) { gl_FragColor = vec4(prev, 0.0, 0.0, 1.0); return; }

  float aBelow = texture2D(u_logo, uv - vec2(0.0, px.y * 2.0)).a;
  float bottomEdge = clamp(a0 - aBelow, 0.0, 1.0);
  bottomEdge = smoothstep(0.02, 0.22, bottomEdge);

  float frontWob = (fbm(vec2(uv.x * 2.8 + u_seed, 0.6 + u_anim * 0.08), detail) - 0.5) * 0.20;
  float bottomFirst = smoothstep(0.00, 0.45, tt - uv.y * 1.22 - frontWob);
  float fullReach = smoothstep(0.55, 1.15, tt);
  bottomFirst = mix(bottomFirst, 1.0, fullReach);
  float fullFill = smoothstep(0.88, 1.15, tt);
  float lane = smoothstep(0.16, 0.94, fbm(vec2(uv.x * 7.5 + u_seed, 0.20 + u_anim * 0.06), detail));
  float micro = noise(vec2(uv.x * 85.0 + u_seed, tt * 2.4 + u_anim * 0.28));
  float channel = mix(lane, micro, 0.20);
  float globN = noise(vec2(uv.x * 18.0 + u_seed, 4.0));
  float globMask = smoothstep(0.55, 0.90, globN) * bottomEdge * columnHold;
  float visc = smoothstep(0.10, 0.70, tt) * (0.55 + 0.45 * channel);
  float edgeBoost = 0.12 + 3.8 * bottomEdge;
  float shimmer = (noise(vec2(uv.x * 10.0 + u_seed, u_anim * 0.55 + uv.y * 3.0)) - 0.5);
  float newMelt = (0.05 + 0.98 * tt) * bottomFirst * edgeBoost * (0.60 + 0.40 * channel) * (1.0 + shimmer * 0.03 * smoothstep(0.05, 0.40, tt));
  newMelt *= columnHold;
  newMelt += fullFill * columnHold * (0.55 + 0.10 * channel);
  newMelt += globMask * visc * (0.12 + 0.25 * tt);
  float creepJ = 0.75 + 0.5 * fbm(vec2(uv.x * 1.4 + u_seed, u_anim * 0.06), detail);
  float creep = smoothstep(0.18, 1.10, tt) * flowLane * 0.068 * columnHold * creepJ;
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
    float a = 0.58;
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

  // ── MASK ONLY: use logo alpha, discard RGB ──
  float logoMask = inBounds ? texture2D(u_logo, uvC).a : 0.0;
  float pr = clamp(u_progress, 0.0, 1.0);

  // ── MELT TRANSITION: solid → liquefied ──
  float melt = smoothstep(0.001, 0.88, m) * pr;

  // ── Liquid modulation (drips, streaks, globs) ──
  float colCount = clamp(floor(u_res.x / 6.0), 140.0, 360.0);
  float xi = floor(uvC.x * colCount);
  float xq = (xi + 0.5) / colCount;
  float laneN = smoothstep(0.18, 0.92, noise(vec2(xq * 8.0 + u_seed, 0.20 + u_anim * 0.05)));
  float micro = noise(vec2(xq * 78.0 + u_seed, m * 2.6 + 2.0 + u_anim * 0.14));
  float channel = mix(laneN, micro, 0.18);

  float dripSel = smoothstep(0.25, 0.90, channel);
  float laneCut = mix(0.30, 1.00, dripSel);
  float maskCol = texture2D(u_mask, vec2(v_uv.x, clamp(v_uv.y - 0.05, 0.0, 1.0))).r;
  float columnGate = max(smoothstep(0.07, 0.40, maskCol), smoothstep(0.30, 0.80, logoMask));
  float liquidAlpha = clamp(melt * laneCut * columnGate, 0.0, 1.0);

  // ── Gradient / edge detection from melt mask ──
  vec2 px = 1.0 / u_res;
  float mL = texture2D(u_mask, v_uv - vec2(px.x, 0.0)).r;
  float mR = texture2D(u_mask, v_uv + vec2(px.x, 0.0)).r;
  float mD = texture2D(u_mask, v_uv - vec2(0.0, px.y)).r;
  float mU = texture2D(u_mask, v_uv + vec2(0.0, px.y)).r;
  vec2 grad = vec2(mR - mL, mU - mD);

  float edge = smoothstep(0.02, 0.20, length(grad) * 6.0);
  float frontBand = edge * smoothstep(0.06, 0.28, m) * (1.0 - smoothstep(0.62, 0.98, m));

  // ── Glob + streak modulation ──
  float globN = noise(vec2(xq * 18.0 + u_seed, 4.0));
  float glob = smoothstep(0.72, 0.92, globN) * frontBand;

  float flowY = u_anim * 0.090;
  float flowX = u_anim * 0.025;
  float streak = fbm(vec2(xi * 0.23 + u_seed * 0.9 + flowX, uvC.y * 6.5 - flowY));
  float streak2 = fbm(vec2(xi * 0.41 + u_seed * 1.7 - flowX * 0.6, uvC.y * 12.0 - flowY * 1.35));
  float streakMix = clamp(mix(streak, streak2, 0.35), 0.0, 1.0);
  float streakMask = smoothstep(0.35, 0.88, streakMix);

  // ── Sliding globs ──
  float slideGlobs = 0.0;
  for (int i = 0; i < 5; i++) {
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

  // ── UNIFIED MATERIAL: solid lacquer + liquid are the SAME substance ──
  float solidAlpha = logoMask * (1.0 - melt);
  float materialAlpha = clamp(max(solidAlpha, liquidAlpha), 0.0, 1.0);
  float liquidness = materialAlpha > 0.001 ? clamp(liquidAlpha / materialAlpha, 0.0, 1.0) : 0.0;

  // ═══════════════════════════════════════════════════════════════
  // ── COLOR INFUSION: white lacquer → magenta liquid pigment ──
  // ═══════════════════════════════════════════════════════════════
  vec3 brand = max(u_brand, vec3(0.0));

  // Local infusion driven by melt intensity + global progress
  // Edges & bottom liquefy first → color first. Top stays white longer.
  float localMelt = clamp(m * 1.2 + pr * 0.3, 0.0, 1.0);

  // Edge-driven pigment creep: color bleeds near melt boundary
  float edgeInfluence = smoothstep(0.15, 0.75, m) * edge;
  float infusion = clamp(localMelt + edgeInfluence * 0.25, 0.0, 1.0);

  // Cinematic nonlinear blend: white → brand
  float colorMix = smoothstep(0.0, 0.6, infusion);

  // Internal pigment diffusion: subtle swirling tint before full color
  float diffusionN = noise(vec2(uvC.x * 6.0 + u_seed * 0.3, uvC.y * 5.0 + u_anim * 0.04));
  float diffusion = smoothstep(0.08, 0.40, infusion) * (1.0 - smoothstep(0.55, 0.85, infusion));
  float diffusionAmt = diffusion * (0.08 + 0.12 * diffusionN);
  colorMix = clamp(colorMix + diffusionAmt, 0.0, 1.0);

  vec3 whiteBase = vec3(1.0);
  vec3 baseColor = mix(whiteBase, brand, colorMix);

  // Readability boost: prevent mid-tone muddy dulling during transition
  float readabilityBoost = 1.0 - colorMix * 0.12;
  baseColor *= readabilityBoost;

  // Hot color also transitions from white highlight to magenta highlight
  vec3 hot = mix(vec3(1.0), mix(brand, vec3(1.0), 0.50), colorMix);
  vec3 deep = brand * 0.28;

  // ── PRE-MELT SHIMMER: subtle iridescent pulse on white solid ──
  float preShimmer = (1.0 - smoothstep(0.0, 0.15, infusion)) * materialAlpha;
  float shimmerWave = noise(vec2(uvC.x * 12.0 + u_seed, uvC.y * 8.0 + u_anim * 0.30));
  float shimmerPulse = sin(u_anim * 1.8 + uvC.y * 4.0 + shimmerWave * 3.0) * 0.5 + 0.5;
  float microPulse = sin(u_anim * 3.5 + uvC.x * 6.0) * 0.5 + 0.5;
  float shimmerAmt = preShimmer * shimmerPulse * 0.06 * (0.7 + 0.3 * microPulse);

  // ── NORMALS: flat (solid) → chaotic (liquid) ──
  float nrmStr = mix(0.25, 3.0, liquidness);
  vec3 nrm = normalize(vec3(-grad * nrmStr, 1.0));
  float microN = (noise(vec2(uvC.x * 140.0 + u_seed, uvC.y * 140.0 + u_anim * 0.45)) - 0.5);
  float microAmt = mix(0.03, 0.16, liquidness) * materialAlpha;
  nrm = normalize(nrm + vec3(microN * microAmt, microN * microAmt * 0.5, 0.0));

  // ── LIGHTING: transitions from matte white → glossy wet lacquer ──
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 lightDir1 = normalize(vec3(-0.35, 0.55, 0.75));
  vec3 lightDir2 = normalize(vec3( 0.62, 0.15, 0.77));
  vec3 lightDir3 = normalize(vec3( 0.0, -0.65, 0.75));
  vec3 h1 = normalize(lightDir1 + viewDir);
  vec3 h2 = normalize(lightDir2 + viewDir);
  vec3 h3 = normalize(lightDir3 + viewDir);

  // Fresnel power: gentle on white (1.8) → strong on wet magenta (3.0)
  float fresPow = mix(1.8, 3.0, colorMix);
  float fres = pow(1.0 - clamp(dot(nrm, viewDir), 0.0, 1.0), fresPow);

  // Thickness: solid = fully thick, liquid = varies with melt depth
  float thick_liq = clamp(smoothstep(0.10, 0.95, m) * (0.65 + 0.35 * dripSel), 0.0, 1.0);
  float thick = mix(1.0, thick_liq, liquidness);

  // Gloss: matte white (28) → wet lacquer (140)
  float glossPow = mix(28.0, 140.0, colorMix * thick);
  float spec1 = pow(clamp(dot(nrm, h1), 0.0, 1.0), glossPow);
  float spec2 = pow(clamp(dot(nrm, h2), 0.0, 1.0), glossPow * 0.75);
  float spec3 = pow(clamp(dot(nrm, h3), 0.0, 1.0), glossPow * 0.5);

  // Spec intensity: subtle on white, strong on liquid edges
  float specInt = mix(0.25, 0.30 + 0.75 * frontBand, liquidness);
  specInt *= (0.6 + 0.4 * colorMix); // spec tints with color
  float spec = (spec1 * 1.10 + spec2 * 0.65 + spec3 * 0.30) * specInt;

  // ── DIFFUSE LIGHTING ──
  float diff = clamp(dot(nrm, lightDir1) * 0.55 + dot(nrm, lightDir2) * 0.35 + 0.25, 0.0, 1.0);

  // Body: white solid → magenta depth-modulated liquid
  vec3 solidBody = baseColor * 0.82 * diff;
  vec3 liquidBody = mix(deep, baseColor * 0.62, smoothstep(0.0, 1.0, m));
  liquidBody *= (0.90 + 0.14 * thick_liq);
  liquidBody *= (0.94 + 0.16 * streakMask);
  liquidBody *= diff;
  vec3 body = mix(solidBody, liquidBody, liquidness);

  // Rim light: clean white rim on solid, hot colored rim on liquid
  float rimStr = mix(0.20, 0.65 + 0.45 * fres, liquidness);
  rimStr *= (0.5 + 0.5 * colorMix); // rim intensifies with color
  vec3 rim = hot * edge * rimStr * 1.05;

  // Subsurface scattering: minimal on white, full on colored
  float sssStr = mix(0.03, 0.12, colorMix);
  float sss = smoothstep(0.80, 0.10, thick) * fres * sssStr;

  // Assemble material
  vec3 materialRGB = (body + rim + hot * spec * 0.12 + baseColor * sss) * materialAlpha;

  // Pre-melt shimmer: subtle luminance pulse on un-infused white
  materialRGB += vec3(shimmerAmt) * materialAlpha;

  // ── POSTERIZATION (liquid regions only, fades in with color) ──
  float d0 = hash21(floor(gl_FragCoord.xy) + vec2(u_seed * 17.0, u_anim * 3.0)) - 0.5;
  float dCol = (hash21(vec2(xi + u_seed * 11.0, floor(gl_FragCoord.y * 0.25))) - 0.5) * 0.6;
  float dither = (d0 + dCol) * 0.55;
  float levels = 14.0;
  vec3 poster = floor(materialRGB * levels + dither) / levels;
  float pixAmt = liquidness * colorMix * materialAlpha * (0.55 + 0.30 * streakMask) * (1.0 - frontBand * 0.65);
  materialRGB = mix(materialRGB, poster, clamp(pixAmt, 0.0, 1.0));
  float colJit = (hash21(vec2(xi, u_seed * 3.0)) - 0.5) * 0.06;
  materialRGB *= (1.0 + colJit * colorMix * materialAlpha);

  // ── BACKGROUND ──
  vec2 q = v_uv - 0.5;
  float r2 = dot(q, q);
  vec3 bgTop = vec3(0.015, 0.015, 0.020);
  vec3 bgBot = vec3(0.000, 0.000, 0.000);
  vec3 bg = mix(bgTop, bgBot, smoothstep(0.05, 0.92, v_uv.y));
  bg *= (0.92 + 0.08 * smoothstep(0.85, 0.15, r2));

  vec3 rgb = bg + materialRGB;

  // ── BLOOM MASK: clean white sheen → liquid edge glow ──
  float solidBloom = (1.0 - liquidness) * materialAlpha * (fres * 0.12 + shimmerAmt * 0.5);
  float liquidBloom = (frontBand * 1.25 + edge * 0.25) * liquidness * materialAlpha * colorMix;
  float bloomMask = clamp(solidBloom + liquidBloom, 0.0, 1.0);

  float grain = (hash21(gl_FragCoord.xy + u_seed*100.0) - 0.5) * 0.020 * materialAlpha;
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

  // Early-reject bloom for non-bright pixels (saves ~40% bloom cost)
  float earlyBloomTest = c00.a;
  vec3 bloom = vec3(0.0);
  if (earlyBloomTest > 0.02) {
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
    bloom = blurRGB * bloomMask * (0.28 + 0.34 * pr);
  }

  float vig = smoothstep(1.05, 0.18, r2);
  base *= vig;

  vec3 color = base + bloom;
  color *= (1.02 + 0.02 * pr);
  color = tonemapFilmic(color);

  float l = luma(color);
  vec3 gray = vec3(l);
  color = mix(gray, color, 1.15);

  float gate = smoothstep(0.02, 0.18, l);
  float grain = (hash21(gl_FragCoord.xy + u_seed*100.0) - 0.5) * 0.024 * pr;
  float flicker = (hash21(vec2(u_seed, u_seed*2.0 + u_anim)) - 0.5) * 0.010 * pr;
  float dither = (hash21(gl_FragCoord.xy * 0.5 + vec2(u_seed, u_anim)) - 0.5) / 255.0;

  color *= (1.0 + (grain + flicker) * gate);
  color += dither * gate;

  gl_FragColor = vec4(max(vec3(0.0), color), 1.0);
}
`;

export function startHeroMeltWebGL({ canvas, imageSrc, state, getLoop, onHeroReady }: HeroMeltRuntimeParams) {
  const isSmallScreen = window.matchMedia?.("(max-width: 768px)")?.matches ?? false;
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
  const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  const constrained = prefersReducedMotion || saveData || lowCores;

  // DPR bounds (adaptive will stay within these)
  const DPR_MAX = isSmallScreen ? 1.5 : 2.5;
  const DPR_MIN = isSmallScreen ? 1.0 : 1.25;
  const DPR_FLOOR = constrained ? Math.min(DPR_MAX, 1) : DPR_MIN;

  let cancelled = false;
  const s = state;

  const gl = canvas.getContext("webgl", {
    alpha: false,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: isSmallScreen || constrained ? "low-power" : "high-performance",
    failIfMajorPerformanceCaveat: false,
  });

  if (!gl) return () => {};

  // Explicitly disable unused GPU features
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST);
  gl.disable(gl.SCISSOR_TEST);
  gl.depthMask(false);

  s.gl = gl;
  if (!s.seed) s.seed = Math.random() * 1000;
  s.t0 = performance.now();

  // Initialize adaptive DPR tracking
  const initialDpr = Math.min(window.devicePixelRatio || 1, constrained ? DPR_FLOOR : DPR_MAX);
  s.currentDpr = initialDpr;
  s.dprFrameTimes = new Float64Array(64);
  s.dprFrameIdx = 0;
  s.dprStableCount = 0;
  s.dprCooldownMs = 0;
  s.dprLastAdjustMs = 0;
  s.resizePending = false;
  s.resizeRafId = 0;

  const maskProg = createProgram(gl, VERT, MASK_FRAG);
  const renderProg = createProgram(gl, VERT, RENDER_FRAG);
  const postProg = createProgram(gl, VERT, POST_FRAG);
  const blitProg = createProgram(gl, VERT, BLIT_FRAG);

  if (!maskProg || !renderProg || !postProg || !blitProg) return () => {};

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

  const img = new window.Image();
  img.crossOrigin = "anonymous";
  img.src = imageSrc;

  img.onload = () => {
    if (cancelled) return;

    const MAX = 4096;
    const iw = img.naturalWidth || 1024;
    const ih = img.naturalHeight || 1024;
    // SVGs are vector — upscale to fill 4096 for pixel-perfect quality
    const isSvg = /\.svg(\?|#|$)/i.test(imageSrc);
    const scaleCap = isSvg ? 2 : 1;
    const sc = Math.min(scaleCap, Math.min(MAX / iw, MAX / ih));
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
    onHeroReady();

    cancelAnimationFrame(s.raf);
    const loop = getLoop();
    if (loop) s.raf = requestAnimationFrame(loop);
  };

  // Resize framebuffers only (no shader recompile, no texture re-upload)
  const resizeFramebuffers = (W: number, H: number) => {
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

  const resize = (useDpr?: number) => {
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();

    const isPortrait = rect.height >= rect.width;

    if (isSmallScreen && isPortrait) {
      const ar = rect.height / Math.max(1, rect.width);
      const t = Math.max(0, Math.min(1, (ar - 1.15) / 0.95));
      s.cover = t * 0.45;
    } else {
      s.cover = 0;
    }

    const dpr = useDpr ?? s.currentDpr;

    // Skip if layout dimensions haven't meaningfully changed
    if (
      useDpr === undefined &&
      Math.abs(rect.width - s.lastLayoutW) < 1 &&
      Math.abs(rect.height - s.lastLayoutH) < 1
    ) return;

    s.lastLayoutW = rect.width;
    s.lastLayoutH = rect.height;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    resizeFramebuffers(canvas.width, canvas.height);
    s.resizePending = false;
  };

  // Adaptive DPR: called from the render loop, adjusts DPR based on frame times
  const adaptDpr = (now: number, frameMs: number) => {
    // Record frame time in ring buffer
    s.dprFrameTimes[s.dprFrameIdx & 63] = frameMs;
    s.dprFrameIdx++;

    // Cooldown: don't adjust within 2s of last change
    if (now - s.dprLastAdjustMs < 2000) return;

    // Need at least 30 samples
    const samples = Math.min(s.dprFrameIdx, 64);
    if (samples < 30) return;

    // Compute average frame time
    let sum = 0;
    for (let i = 0; i < samples; i++) sum += s.dprFrameTimes[i];
    const avg = sum / samples;

    const deviceDpr = window.devicePixelRatio || 1;
    const maxDpr = Math.min(deviceDpr, constrained ? DPR_FLOOR : DPR_MAX);

    if (avg > 18 && s.currentDpr > DPR_FLOOR) {
      // Consistently slow — reduce DPR
      s.dprStableCount++;
      if (s.dprStableCount >= 15) {
        const newDpr = Math.max(DPR_FLOOR, s.currentDpr - 0.15);
        if (Math.abs(newDpr - s.currentDpr) > 0.05) {
          s.currentDpr = newDpr;
          s.dprLastAdjustMs = now;
          s.dprStableCount = 0;
          s.dprFrameIdx = 0;
          resize(newDpr);
        }
      }
    } else if (avg < 13 && s.currentDpr < maxDpr) {
      // Consistently fast — increase DPR slightly
      s.dprStableCount++;
      if (s.dprStableCount >= 60) {
        const newDpr = Math.min(maxDpr, s.currentDpr + 0.1);
        if (Math.abs(newDpr - s.currentDpr) > 0.05) {
          s.currentDpr = newDpr;
          s.dprLastAdjustMs = now;
          s.dprStableCount = 0;
          s.dprFrameIdx = 0;
          resize(newDpr);
        }
      }
    } else {
      s.dprStableCount = 0;
    }
  };
  s.adaptDpr = adaptDpr;

  // Debounced ResizeObserver: coalesce rapid resize events
  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!cancelled) resize();
    }, 100) as unknown as number;
  });

  const parent = canvas.parentElement;
  if (parent) ro.observe(parent);

  resize();

  return () => {
    cancelled = true;

    ro.disconnect();
    clearTimeout(resizeTimer);
    cancelAnimationFrame(s.raf);

    try {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {}
  };
}
