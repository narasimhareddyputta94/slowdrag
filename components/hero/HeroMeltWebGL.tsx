"use client";

import { useEffect, useRef } from "react";

type HeroProps = {
  imageSrc: string; // Ensure this points to your SVG
  onScrolledChange?: (scrolled: boolean) => void;
};

// --- Shader Compilation Helpers ---

function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
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
    console.error("Program link error:", gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

// --- THE SHADERS ---

const VERTEX_SHADER = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  // Map -1..1 space to 0..1 UV space
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/**
 * THE "VISCOUS GLOW" FRAGMENT SHADER
 * This is where the magic happens to match your reference image.
 */
const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D u_tex;
uniform vec2 u_res;      // Canvas Resolution
uniform vec2 u_imgRes;   // Image Resolution
uniform float u_time;    // Scroll Progress (0.0 - 1.0ish)

varying vec2 v_uv;

// --- Noise functions for organic variation ---
float hash(float n) { return fract(sin(n) * 43758.5453123); }
float noise(vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*57.0;
    return mix(mix( hash(n+ 0.0), hash(n+ 1.0),f.x),
               mix( hash(n+57.0), hash(n+58.0),f.x),f.y);
}

void main() {
    // 1. Aspect Ratio Correction (Fit the image properly)
    float canvasAspect = u_res.x / u_res.y;
    float imgAspect = u_imgRes.x / u_imgRes.y;
    vec2 ratio = vec2(min((canvasAspect / imgAspect), 1.0), min((imgAspect / canvasAspect), 1.0));
    vec2 pUV = vec2((v_uv.x - 0.5) * ratio.x + 0.5, (v_uv.y - 0.5) * ratio.y + 0.5);

    // 2. Physics Setup
    float progress = u_time; 
    // Gravity accelerates non-linearly feels heavier
    float gravityBase = pow(progress, 1.8) * 1.5; 

    // 3. Columnar Viscosity (The Drip Effect)
    // We create vertical "channels" of varying speeds based on X position and noise.
    // High frequency noise creates thin drips, low freq creates thick ones.
    float dripColumn = noise(vec2(pUV.x * 15.0, progress * 2.0)); // Main drips
    float fineDetail = noise(vec2(pUV.x * 50.0, progress * 5.0)); // Tiny rivulets

    // Combine noise to get total drip velocity factor for this vertical slice
    float dripFactor = smoothstep(0.3, 0.8, dripColumn) * 0.8 + fineDetail * 0.2;
    
    // Calculate how far down this pixel should move.
    // We multiply by UV.y so the bottom melts faster than the top.
    float displacement = gravityBase * (0.5 + dripFactor * 1.5) * (0.2 + pUV.y * 0.8);

    // 4. Horizontal Wobble (Liquid tension as it falls)
    float wobble = sin(pUV.y * 20.0 + progress * 10.0) * (displacement * 0.02);

    // 5. Sampling Coordinate (Look UP to move pixels DOWN)
    vec2 sampleUV = vec2(pUV.x + wobble, pUV.y + displacement);

    // 6. Fetch Texture & Boundary Check
    vec4 texColor = vec4(0.0);
    // Only sample if within bounds, otherwise transparent
    if (sampleUV.y >= 0.0 && sampleUV.y <= 1.0 && sampleUV.x >= 0.0 && sampleUV.x <= 1.0) {
        texColor = texture2D(u_tex, sampleUV);
    }

    // 7. Tearing / Thinning
    // If displacement is huge, the ink thins out and breaks.
    float thinning = smoothstep(1.2, 0.6, displacement * (1.0 - dripFactor*0.5));
    float finalAlpha = texColor.a * thinning;

    // 8. Color Mapping (The Glow Effect)
    // We map the color based on how far the pixel has moved (displacement).
    
    vec3 colSolid = vec3(1.0, 1.0, 1.0);           // Pure White (Solid)
    vec3 colGlow  = vec3(0.8, 0.0, 1.0);           // Neon Purple/Pink (Melting edge)
    vec3 colDark  = vec3(0.15, 0.0, 0.25);         // Dark viscous liquid (Falling)

    // Mix white to glow based on initial movement
    vec3 rgb = mix(colSolid, colGlow, smoothstep(0.0, 0.15, displacement));
    // Mix glow to dark based on heavy movement
    rgb = mix(rgb, colDark, smoothstep(0.15, 0.6, displacement));

    // Final composite
    gl_FragColor = vec4(rgb * finalAlpha, finalAlpha);
}
`;

// --- React Component ---

export default function HeroMeltWebGL({ imageSrc, onScrolledChange }: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Using refs to hold mutable WebGL state without triggering re-renders
  const state = useRef({
    gl: null as WebGLRenderingContext | null,
    prog: null as WebGLProgram | null,
    tex: null as WebGLTexture | null,
    rafId: 0,
    scrollProgress: 0,    // Current smoothed scroll value
    targetProgress: 0,    // Where the scroll wants to be
    imgW: 1,
    imgH: 1,
    isLoaded: false
  });

  // --- The Animation Loop ---
  const renderFrame = () => {
    const { gl, prog, isLoaded, scrollProgress, targetProgress, imgW, imgH } = state.current;
    const canvas = canvasRef.current;
    if (!gl || !prog || !isLoaded || !canvas) return;

    // 1. Physics Lerp (Smoothing)
    // 0.07 defines the "heaviness". Lower = slower, more viscous feel.
    state.current.scrollProgress += (targetProgress - scrollProgress) * 0.07;

    // Optimization: Stop the loop if the animation is settled
    const diff = Math.abs(state.current.scrollProgress - targetProgress);
    if (diff > 0.0005 || (state.current.scrollProgress > 0.001 && state.current.scrollProgress < 0.999)) {
       state.current.rafId = requestAnimationFrame(renderFrame);
    }

    // Clamp progress between 0 and slight overshot for effect
    const p = Math.max(0.0, Math.min(1.1, state.current.scrollProgress));

    // 2. Draw
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0); // Transparent clear
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);

    // Update Uniforms
    gl.uniform1f(gl.getUniformLocation(prog, "u_time"), p);
    gl.uniform2f(gl.getUniformLocation(prog, "u_res"), gl.canvas.width, gl.canvas.height);
    gl.uniform2f(gl.getUniformLocation(prog, "u_imgRes"), imgW, imgH);

    // Draw fullscreen quad (2 triangles = 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  // --- Setup WebGL & Load Image ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Init WebGL Context
    const gl = canvas.getContext("webgl", { 
      alpha: true, 
      premultipliedAlpha: true, 
      antialias: false // Turn off AA for sharper pixel art look if desired
    });
    if (!gl) { console.error("WebGL not supported"); return; }
    state.current.gl = gl;

    // 2. Compile & Link Shader Program
    const prog = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!prog) return;
    state.current.prog = prog;

    // 3. Create Geometry (Big Triangle filling screen)
    // Using a big triangle instead of a quad is slightly more efficient
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.0, -1.0, 
       3.0, -1.0, 
      -1.0,  3.0
    ]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // 4. Texture Configuration
    const tex = gl.createTexture();
    state.current.tex = tex;
    gl.bindTexture(gl.TEXTURE_2D, tex);

    // IMPORTANT: Flips the SVG right-side up
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    // Texture filtering (Linear for smooth melting)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Enable transparency blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // 5. Load the SVG Image
    const img = new Image();
    img.crossOrigin = "anonymous"; // Needed if SVG is external
    img.src = imageSrc;
    img.onload = () => {
      // Update state with image dimensions
      state.current.imgW = img.naturalWidth || 1000;
      state.current.imgH = img.naturalHeight || 1000;
      state.current.isLoaded = true;

      // Upload image data to GPU texture
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      
      // Start the render loop
      renderFrame();
    };

    // --- Event Listeners ---

    const handleScroll = () => {
       const scrollY = window.scrollY;
       const vh = window.innerHeight;
       onScrolledChange?.(scrollY > 50);

       // Calculate melt progress based on viewport height.
       // Divided by vh*0.9 means it fully melts just before one full screen scroll.
       const rawProgress = scrollY / (vh * 0.9);
       state.current.targetProgress = rawProgress;
       
       // Wake up the animation loop if it was sleeping
       cancelAnimationFrame(state.current.rafId);
       state.current.rafId = requestAnimationFrame(renderFrame);
    };
    
    const handleResize = () => {
        if(!canvas.parentElement || !gl) return;
        // Handle High-DPI displays
        const dpr = Math.min(window.devicePixelRatio, 2); 
        const width = canvas.parentElement.clientWidth;
        const height = canvas.parentElement.clientHeight;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        // Force a re-render
        renderFrame();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    // Initial sizing
    handleResize();

    // Cleanup on unmount
    return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(state.current.rafId);
        // Optional WebGL cleanup
        gl.deleteProgram(prog);
        gl.deleteTexture(tex);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]); // Re-run setup if imageSrc changes

  return (
    <div 
        style={{ 
            height: '100vh', 
            width: '100%', 
            background: '#000', // Matches your high-contrast aesthetic
            position: 'relative',
            overflow: 'hidden'
        }}
    >
      <div 
        style={{ 
            width: '100%', 
            height: '100%', 
            // Limits max size for ultra-wide screens so logo doesn't get too huge
            maxWidth: '2000px', 
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}
      >
         <canvas 
            ref={canvasRef} 
            style={{ 
                width: '100%', 
                height: '100%', 
                display: 'block',
                // Ensures canvas doesn't intercept scroll events
                pointerEvents: 'none' 
            }} 
         />
      </div>
    </div>
  );
}