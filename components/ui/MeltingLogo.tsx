'use client';
import { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';

// --- THE LIQUID SHADER (The "Secret Sauce") ---
const fragmentShader = `
uniform float uTime;
uniform float uScroll;
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    
    // 1. Create a "Wobble" wave
    float wave = sin(uv.x * 10.0 + uTime) * 0.005;
    
    // 2. The Melt Effect: Pull pixels DOWN (y-axis) based on scroll
    // uScroll controls how "melted" it looks
    float melt = uScroll * (0.8 + wave); 
    
    // 3. Apply the distortion
    vec2 distortedUv = vec2(uv.x, uv.y + melt);
    
    // 4. Cut off pixels that drift too far (keeps it clean)
    if(distortedUv.y > 1.0 || distortedUv.y < 0.0) {
        discard;
    }
    
    vec4 color = texture2D(uTexture, distortedUv);
    gl_FragColor = color;
}
`;

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

function LiquidMesh({ scrollY }: { scrollY: number }) {
  // Load YOUR title image
  const texture = useLoader(TextureLoader, '/images/titleimage.png');
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      
      // Smoothly blend the scroll value (Lerp) for that "heavy liquid" feel
      materialRef.current.uniforms.uScroll.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uScroll.value,
        scrollY * 0.0015, // Sensitivity: Higher number = More melt
        0.1
      );
    }
  });

  return (
    <mesh>
      {/* Plane size: Adjust these numbers to match your image aspect ratio */}
      <planeGeometry args={[7, 4]} /> 
      <shaderMaterial
        ref={materialRef}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={{
          uTexture: { value: texture },
          uTime: { value: 0 },
          uScroll: { value: 0 }
        }}
        transparent={true}
      />
    </mesh>
  );
}

export default function MeltingLogo({ scrollY }: { scrollY: number }) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight />
        <LiquidMesh scrollY={scrollY} />
      </Canvas>
    </div>
  );
}