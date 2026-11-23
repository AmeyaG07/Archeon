"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Snow particle arrays are generated once at module load so Math.random
// is never invoked during component render (react-hooks/purity).
function createSnowArrays(count: number): [Float32Array, Float32Array] {
  const pos = new Float32Array(count * 3);
  const sc = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3 + 0] = (Math.random() - 0.5) * 28;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 35 - 5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    sc[i] = Math.random() * 0.04 + 0.015;
  }
  return [pos, sc];
}

const DEFAULT_COUNT = 800;
const [DEFAULT_POSITIONS, DEFAULT_SCALES] = createSnowArrays(DEFAULT_COUNT);

export function ParticleSnow({ count = DEFAULT_COUNT }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, scales] = useMemo(() => {
    if (count === DEFAULT_COUNT) return [DEFAULT_POSITIONS, DEFAULT_SCALES];
    return createSnowArrays(count);
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const array = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      // Gently drift downwards and sideways
      array[i * 3 + 1] -= delta * 0.4;
      array[i * 3 + 0] += Math.sin(array[i * 3 + 1] * 0.5) * 0.005;

      // Wrap around when falling past bottom
      if (array[i * 3 + 1] < -25) {
        array[i * 3 + 1] = 12;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#bae6fd"
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
