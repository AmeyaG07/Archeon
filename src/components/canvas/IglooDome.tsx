"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function IglooDome({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const cageRef = useRef<THREE.LineSegments>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Gentle idle rotation
    groupRef.current.rotation.y += delta * 0.05;

    // React to scroll progress: slowly explode or rotate facets as user scrolls
    if (cageRef.current) {
      cageRef.current.rotation.y -= delta * 0.03;
    }

    if (innerRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 1.5) * 0.15 + 0.85;
      (innerRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 1.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Outer Faceted Geometric Dome */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[2.8, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial
          color="#dbeafe"
          roughness={0.25}
          metalness={0.1}
          transparent
          opacity={0.88}
          flatShading={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe Outline Cage (Iconic Igloo.inc geometric lattice) */}
      <lineSegments ref={cageRef} scale={[1.015, 1.015, 1.015]}>
        <wireframeGeometry args={[new THREE.SphereGeometry(2.8, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52)]} />
        <lineBasicMaterial color="#93c5fd" transparent opacity={0.45} linewidth={1} />
      </lineSegments>

      {/* Igloo Entrance Tunnel */}
      <group position={[0, 0.4, 2.6]} rotation={[0, 0, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.9, 1.0, 1.4, 8, 1, true, -Math.PI * 0.5, Math.PI]} />
          <meshStandardMaterial
            color="#bfdbfe"
            roughness={0.3}
            metalness={0.1}
            flatShading
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Inner Warm/Cyan Core Glow */}
      <mesh ref={innerRef} position={[0, 0.8, 0]}>
        <icosahedronGeometry args={[0.9, 2]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={1.2}
          roughness={0.1}
          metalness={0.9}
          wireframe
        />
      </mesh>

      {/* Floating Shard Rings around the dome */}
      <group position={[0, 1.2, 0]} rotation={[0.2, 0, 0.3]}>
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const radius = 3.6 + Math.sin(i * 1.5) * 0.4;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = (i % 2 === 0 ? 0.3 : -0.3);
          return (
            <mesh key={i} position={[x, y, z]} rotation={[i, i * 0.5, 0]}>
              <boxGeometry args={[0.22, 0.22, 0.08]} />
              <meshStandardMaterial
                color="#60a5fa"
                metalness={0.8}
                roughness={0.2}
                transparent
                opacity={0.7}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
