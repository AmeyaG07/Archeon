"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ServiceItem } from "@/config/siteConfig";
import { useAudio } from "@/providers/AudioProvider";

interface ArchitecturalMonolithsProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
  activeServiceId?: string | null;
  wireframeMode: boolean;
}

function MonolithItem({
  service,
  position,
  onSelect,
  isActive,
  wireframeMode
}: {
  service: ServiceItem;
  position: [number, number, number];
  onSelect: () => void;
  isActive: boolean;
  wireframeMode: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { playSfx } = useAudio();

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const speed = hovered ? 1.5 : 0.6;
    groupRef.current.rotation.y += delta * 0.25 * speed;

    // Hover floating bounce
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 1.6 + position[0]) * 0.2;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        playSfx("click-project");
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        playSfx("beeps");
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Outer Frosted Architectural Glass Casing */}
      <mesh scale={hovered || isActive ? 1.15 : 1.0}>
        <boxGeometry args={[1.7, 2.2, 1.7]} />
        <meshStandardMaterial
          color={hovered || isActive ? service.accentColor : "#44403c"}
          roughness={0.15}
          metalness={0.8}
          transparent
          opacity={hovered ? 0.85 : 0.45}
          wireframe={wireframeMode}
        />
      </mesh>

      {/* Wireframe Outline Edge (Crisp architectural drafting grid) */}
      <lineSegments scale={hovered || isActive ? 1.16 : 1.01}>
        <wireframeGeometry args={[new THREE.BoxGeometry(1.7, 2.2, 1.7)]} />
        <lineBasicMaterial
          color={hovered || isActive ? "#ffffff" : service.accentColor}
          transparent
          opacity={0.85}
        />
      </lineSegments>

      {/* Inner Sculptural Architectural Core */}
      <group scale={0.75} rotation={[0.2, 0.4, 0]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial
            color={service.accentColor}
            emissive={service.accentColor}
            emissiveIntensity={hovered ? 2.5 : 0.9}
            roughness={0.2}
            metalness={0.9}
            wireframe={wireframeMode}
          />
        </mesh>
      </group>

      {/* Orbiting Precision Sparks / Dust Motes */}
      <group rotation={[1, 0, 0]}>
        {[...Array(6)].map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const radius = 1.4;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
            >
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshBasicMaterial color={service.accentColor} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export function ArchitecturalMonoliths({
  services,
  onSelectService,
  activeServiceId,
  wireframeMode
}: ArchitecturalMonolithsProps) {
  // Spatial coordinates along the vertical scroll path
  const positions: [number, number, number][] = [
    [-4.6, -4.5, 2.0],  // 01: Architecture
    [4.8, -10.5, 1.5],  // 02: Interior Design
    [-4.2, -16.5, 2.2], // 03: Landscape Architecture
    [4.5, -22.5, 1.8],  // 04: 3D Visualisation
    [-4.0, -28.5, 2.0]  // 05: Turnkey Execution
  ];

  return (
    <group>
      {services.map((srv, idx) => (
        <MonolithItem
          key={srv.id}
          service={srv}
          position={positions[idx] || [0, -idx * 6, 0]}
          onSelect={() => onSelectService(srv)}
          isActive={activeServiceId === srv.id}
          wireframeMode={wireframeMode}
        />
      ))}
    </group>
  );
}
