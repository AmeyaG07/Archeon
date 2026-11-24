"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type LightingMode = "noon" | "sunset" | "night";

interface ArchitecturalCaveProps {
  scrollProgress: number;
  lightingMode: LightingMode;
  wireframeMode: boolean;
}

export function ArchitecturalCave({
  scrollProgress,
  lightingMode,
  wireframeMode
}: ArchitecturalCaveProps) {
  const caveGroupRef = useRef<THREE.Group>(null);
  const colonnadeRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Mesh>(null);
  const skylightGlowRef = useRef<THREE.Mesh>(null);

  // Colors based on lighting mode
  const { stoneColor, accentGlow, waterColor, roughness } = useMemo(() => {
    switch (lightingMode) {
      case "noon":
        return {
          stoneColor: "#78716c", // Warm natural concrete/travertine
          accentGlow: "#ffffff",
          waterColor: "#0f766e",
          roughness: 0.35
        };
      case "sunset":
        return {
          stoneColor: "#7c2d12", // Terracotta ochre raking light
          accentGlow: "#f59e0b",
          waterColor: "#115e59",
          roughness: 0.4
        };
      case "night":
      default:
        return {
          stoneColor: "#1c1917", // Nocturnal basalt
          accentGlow: "#fbbf24",
          waterColor: "#042f2e",
          roughness: 0.25
        };
    }
  }, [lightingMode]);

  useFrame((state, delta) => {
    if (colonnadeRef.current) {
      // Subtle architectural breathing
      colonnadeRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.05;
    }
    if (skylightGlowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 1.5) * 0.15 + 0.85;
      (skylightGlowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 1.8;
    }
    if (waterRef.current) {
      // Subtle caustic shimmer
      (waterRef.current.material as THREE.MeshStandardMaterial).roughness =
        0.1 + Math.sin(state.clock.elapsedTime * 2.0) * 0.05;
    }
  });

  return (
    <group ref={caveGroupRef} position={[0, -0.5, 0]}>
      {/* 1. MONOLITHIC BRUTALIST CAVE WALLS (Carved Subterranean Strata) */}
      <group position={[0, 3, -12]}>
        {/* Rear Mega-Wall */}
        <mesh receiveShadow>
          <boxGeometry args={[45, 24, 2]} />
          <meshStandardMaterial
            color={stoneColor}
            roughness={roughness}
            metalness={0.2}
            wireframe={wireframeMode}
          />
        </mesh>

        {/* Diagonal Slanted Strata / Light-Well Canopy */}
        <mesh position={[0, 11, 4]} rotation={[-0.45, 0, 0]} receiveShadow>
          <boxGeometry args={[42, 14, 1.8]} />
          <meshStandardMaterial
            color={stoneColor}
            roughness={roughness}
            metalness={0.25}
            wireframe={wireframeMode}
          />
        </mesh>
      </group>

      {/* 2. ARCHITECTURAL TRAVERTINE COLONNADE & PAVILION */}
      <group ref={colonnadeRef} position={[0, 0, 0]}>
        {/* Stepped Plinth / Terrace Floor */}
        <mesh position={[0, -0.4, 0]} receiveShadow>
          <boxGeometry args={[16, 0.8, 16]} />
          <meshStandardMaterial
            color={lightingMode === "night" ? "#292524" : "#a8a29e"}
            roughness={0.2}
            metalness={0.1}
            wireframe={wireframeMode}
          />
        </mesh>

        {/* Rhythmic Architectural Columns */}
        {[-5.5, -2.75, 2.75, 5.5].map((x, i) => (
          <group key={i} position={[x, 2.5, -3.5]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.7, 6.2, 0.7]} />
              <meshStandardMaterial
                color={lightingMode === "night" ? "#44403c" : "#d6d3d1"}
                roughness={0.25}
                metalness={0.2}
                wireframe={wireframeMode}
              />
            </mesh>
            {/* Column Capital / Lighting Accent */}
            <mesh position={[0, 3.15, 0]}>
              <boxGeometry args={[0.9, 0.15, 0.9]} />
              <meshStandardMaterial
                color={accentGlow}
                emissive={accentGlow}
                emissiveIntensity={lightingMode === "night" ? 1.5 : 0.3}
              />
            </mesh>
          </group>
        ))}

        {/* Cantilevered Floating Roof Slab */}
        <mesh position={[0, 5.7, -2]} castShadow receiveShadow>
          <boxGeometry args={[15, 0.6, 12]} />
          <meshStandardMaterial
            color={stoneColor}
            roughness={roughness}
            metalness={0.3}
            wireframe={wireframeMode}
          />
        </mesh>

        {/* Central Skylight Oculus Void & Glowing Core */}
        <mesh ref={skylightGlowRef} position={[0, 5.8, -2]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2.2, 32]} />
          <meshStandardMaterial
            color={accentGlow}
            emissive={accentGlow}
            emissiveIntensity={2.0}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 3. REFLECTIVE SUBTERRANEAN WATER POOL (Floor Basin) */}
      <mesh
        ref={waterRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.65, 4]}
        receiveShadow
      >
        <planeGeometry args={[38, 28, 64, 64]} />
        <meshStandardMaterial
          color={waterColor}
          roughness={0.08}
          metalness={0.9}
          transparent
          opacity={0.88}
          wireframe={wireframeMode}
        />
      </mesh>

      {/* 4. FLOATING ARCHITECTURAL BEACONS / AMBIENT PRISMS */}
      <group position={[0, 1.5, 0]}>
        {[...Array(6)].map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const radius = 6.5;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          return (
            <mesh key={i} position={[x, 0.5 + (i % 2) * 0.4, z]} rotation={[0, angle, 0.3]}>
              <octahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial
                color={accentGlow}
                emissive={accentGlow}
                emissiveIntensity={lightingMode === "night" ? 1.8 : 0.5}
                roughness={0.1}
                metalness={0.8}
                wireframe={wireframeMode}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
