"use client";

import { useEffect, useRef } from "react";

type HeroProps = {
  imageSrc: string;
  onScrolledChange?: (scrolled: boolean) => void;
};

// --- Utils ---

function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader Log:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
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
    console.error("Program Log:", gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

// --- Shader Code ---

const VERTEX_SHADER = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/**
 * LIQUID PARTICULATE FRAGMENT SHADER
 * Uses FBM (Fractal Brownian Motion) to simulate millions of particles.
 */
const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_imgRes;
uniform float u_time; // Scroll Progress

varying vec2 v_uv;

// --- Noise Functions ---
// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Fractal Brownian Motion (Detail generator)
// This creates the "granular" pixel feel by layering noise
float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 4; ++i) { // 4 Octaves of detail
        v += a * snoise(x);
        x = rot * x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    // 1. Aspect Ratio Correction
    float canvasAspect = u_res.x / u_res.y;
    float imgAspect = u_imgRes.x / u_imgRes.y;
    vec2 ratio = vec2(min((canvasAspect / imgAspect), 1.0), min((imgAspect / canvasAspect), 1.0));
    vec2 pUV = vec2((v_uv.x - 0.5) * ratio.x + 0.5, (v_uv.y - 0.5) * ratio.y + 0.5);

    float p = u_time; // 0.0 to 1.0
    
    // 2. The Flow Field
    // We create a noise map that dictates how FAST each pixel falls.
    // High frequency (20.0) makes it look like sand/particles.
    float flowMap = fbm(pUV * 20.0 + vec2(0.0, p * 5.0));
    
    // 3. Gravity Physics
    // Base gravity increases with scroll
    float gravity = pow(p, 1.2) * 1.5; 
    
    // Pixel velocity is determined by gravity + the flow map
    // flowMap ranges -1 to 1, so we normalize it
    float velocity = gravity * (0.5 + 0.5 * flowMap); 
    
    // 4. Displacement
    // We sample from ABOVE (y + velocity) to simulate falling down
    vec2 meltUV = vec2(pUV.x, pUV.y + velocity);
    
    // Add tiny horizontal jitter based on velocity (Brownian motion)
    meltUV.x += (fbm(meltUV * 50.0) * 0.005) * p;

    // 5. Sampling
    vec4 color = vec4(0.0);
    
    // Boundary check
    if (meltUV.y >= 0.0 && meltUV.y <= 1.0 && meltUV.x >= 0.0 && meltUV.x <= 1.0) {
        color = texture2D(u_tex, meltUV);
    }
    
    // 6. Droplet Separation (The "Tear" Effect)
    // As pixels fall, the stream should break. 
    // We use a threshold on the noise. If noise is too low, we cut the alpha.
    float tearNoise = fbm(vec2(pUV.x * 10.0, pUV.y * 2.0 - p * 3.0));
    // The deeper the fall (velocity), the more likely to tear
    float tearThreshold = smoothstep(0.0, 1.0, velocity * 1.5); 
    
    // If tearNoise is below threshold, we make it transparent (gap between drops)
    // But we preserve the top of the image (low velocity)
    float mask = smoothstep(tearThreshold - 0.2, tearThreshold + 0.1, tearNoise + 0.2);
    
    // 7. Color Temperature
    // Velocity = Heat. 
    float heat = smoothstep(0.0, 0.8, velocity);
    
    vec3 cold = vec3(1.0); // White
    vec3 hot = vec3(1.0, 0.05, 0.4); // Neon Pink
    vec3 magma = vec3(0.5, 0.0, 0.1); // Dark Magma
    
    vec3 finalColor = mix(cold, hot, heat);
    finalColor = mix(finalColor, magma, smoothstep(0.5, 1.0, heat));
    
    // Apply tearing mask to alpha
    float finalAlpha = color.a * mask;

    // 8. Glow Bloom
    // Add a little additive brightness to the "hot" falling parts
    finalColor += hot * (heat * 0.3) * finalAlpha;

    gl_FragColor = vec4(finalColor * finalAlpha, finalAlpha);
}
`;

export default function HeroMeltWebGL({ imageSrc, onScrolledChange }: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    gl: null as WebGLRenderingContext | null,
    prog: null as WebGLProgram | null,
    tex: null as WebGLTexture | null,
    raf: 0,
    scroll: 0,
    targetScroll: 0,
    imgW: 1000,
    imgH: 1000,
    loaded: false
  });

  const render = () => {
    const { gl, prog, loaded, scroll, targetScroll } = state.current;
    if (!gl || !prog || !loaded) return;

    // Physics Lerp (Damping)
    state.current.scroll += (targetScroll - scroll) * 0.08;
    
    // Optimization: Sleep if settled
    const diff = Math.abs(state.current.scroll - targetScroll);
    if (diff > 0.0001 || (state.current.scroll > 0.001 && state.current.scroll < 0.999)) {
       state.current.raf = requestAnimationFrame(render);
    }

    const p = Math.max(0, Math.min(1.2, state.current.scroll)); // Allow slight over-scroll for impact

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);

    gl.uniform1f(gl.getUniformLocation(prog, "u_time"), p);
    gl.uniform2f(gl.getUniformLocation(prog, "u_res"), gl.canvas.width, gl.canvas.height);
    gl.uniform2f(gl.getUniformLocation(prog, "u_imgRes"), state.current.imgW, state.current.imgH);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true });
    if (!gl) return;
    state.current.gl = gl;

    const prog = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!prog) return;
    state.current.prog = prog;

    // Fullscreen Quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Texture
    const tex = gl.createTexture();
    state.current.tex = tex;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // Load Image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      state.current.imgW = img.naturalWidth;
      state.current.imgH = img.naturalHeight;
      state.current.loaded = true;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      render();
    };

    const handleScroll = () => {
       const vh = window.innerHeight;
       onScrolledChange?.(window.scrollY > 50);
       // Melt factor: how fast it melts relative to scroll
       state.current.targetScroll = window.scrollY / (vh * 0.85);
       cancelAnimationFrame(state.current.raf);
       state.current.raf = requestAnimationFrame(render);
    };
    
    const handleResize = () => {
        if(!canvas.parentElement) return;
        const dpr = Math.min(window.devicePixelRatio, 2);
        canvas.width = canvas.parentElement.clientWidth * dpr;
        canvas.height = canvas.parentElement.clientHeight * dpr;
        render();
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(state.current.raf);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  return (
    <div style={{ height: '100vh', width: '100%', background: '#000', display: 'grid', placeItems: 'center' }}>
      <div style={{ width: '100%', height: '100%', maxWidth: '1800px' }}>
         <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>
  );
}