"use client";

import React, { useEffect, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { loadDracoGeometry } from "@/utils/dracoLoader";

interface IglooWorldProps {
  scrollProgress: number;
}

export function IglooWorld({ scrollProgress }: IglooWorldProps) {
  const [iglooGeom, setIglooGeom] = useState<THREE.BufferGeometry | null>(null);
  const [outlineGeom, setOutlineGeom] = useState<THREE.BufferGeometry | null>(null);
  const [mountainGeom, setMountainGeom] = useState<THREE.BufferGeometry | null>(null);
  const [groundGeom, setGroundGeom] = useState<THREE.BufferGeometry | null>(null);
  const [ringGeom, setRingGeom] = useState<THREE.BufferGeometry | null>(null);
  const [ring2Geom, setRing2Geom] = useState<THREE.BufferGeometry | null>(null);

  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const iglooGroup = useRef<THREE.Group>(null);

  useEffect(() => {
    loadDracoGeometry("/assets/geometries/igloo.drc").then(setIglooGeom).catch(() => {});
    loadDracoGeometry("/assets/geometries/igloo/igloo_outline.drc").then(setOutlineGeom).catch(() => {});
    loadDracoGeometry("/assets/geometries/mountain.drc").then(setMountainGeom).catch(() => {});
    loadDracoGeometry("/assets/geometries/ground.drc").then(setGroundGeom).catch(() => {});
    loadDracoGeometry("/assets/geometries/shattered_ring.drc").then(setRingGeom).catch(() => {});
    loadDracoGeometry("/assets/geometries/shattered_ring2.drc").then(setRing2Geom).catch(() => {});
  }, []);

  useFrame((state, delta) => {
    // Idle rotation of the rings and subtle core breathing
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.12;
      ringRef.current.rotation.z += delta * 0.05;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.08;
      ring2Ref.current.rotation.x += delta * 0.04;
    }
    if (coreRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2.0) * 0.2 + 0.8;
      (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 2.2;
    }
    if (iglooGroup.current) {
      // Subtle float
      iglooGroup.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. MOUNTAINS (Glacial backdrop) */}
      {mountainGeom && (
        <mesh
          geometry={mountainGeom}
          position={[0, -2, -18]}
          scale={[1.8, 1.8, 1.8]}
        >
          <meshStandardMaterial
            color="#1e1b4b"
            roughness={0.65}
            metalness={0.1}
            flatShading
          />
        </mesh>
      )}

      {/* 2. GROUND TERRAIN (Snow & Ice) */}
      {groundGeom && (
        <mesh
          geometry={groundGeom}
          position={[0, -1.8, 0]}
          scale={[1.2, 1.2, 1.2]}
          receiveShadow
        >
          <meshStandardMaterial
            color="#0d0c18"
            roughness={0.4}
            metalness={0.25}
            flatShading
          />
        </mesh>
      )}

      {/* 3. CENTRAL IGLOO GROUP */}
      <group ref={iglooGroup} position={[0, 0, 0]}>
        {/* Real Draco Igloo Model */}
        {iglooGeom ? (
          <mesh
            geometry={iglooGeom}
            scale={[1.0, 1.0, 1.0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color="#e0e7ff"
              roughness={0.2}
              metalness={0.15}
              transparent
              opacity={0.92}
              flatShading
              side={THREE.DoubleSide}
            />
          </mesh>
        ) : (
          /* Procedural Fallback while geometry parses */
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[2.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <meshStandardMaterial
              color="#dbeafe"
              roughness={0.25}
              metalness={0.1}
              transparent
              opacity={0.88}
              flatShading
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Real Igloo Wireframe Lattice Outline */}
        {outlineGeom ? (
          <lineSegments geometry={outlineGeom} scale={[1.008, 1.008, 1.008]}>
            <lineBasicMaterial color="#67e8f9" transparent opacity={0.65} linewidth={1} />
          </lineSegments>
        ) : (
          <lineSegments scale={[1.01, 1.01, 1.01]}>
            <wireframeGeometry args={[new THREE.SphereGeometry(2.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52)]} />
            <lineBasicMaterial color="#93c5fd" transparent opacity={0.45} linewidth={1} />
          </lineSegments>
        )}

        {/* Inner Glowing Core */}
        <mesh ref={coreRef} position={[0, 0.8, 0]}>
          <icosahedronGeometry args={[0.7, 2]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={1.8}
            roughness={0.1}
            metalness={0.9}
            wireframe
          />
        </mesh>
      </group>

      {/* 4. ORBITING SHATTERED RINGS */}
      {ringGeom && (
        <mesh
          ref={ringRef}
          geometry={ringGeom}
          position={[0, 1.2, 0]}
          scale={[1.1, 1.1, 1.1]}
        >
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0369a1"
            emissiveIntensity={0.6}
            metalness={0.85}
            roughness={0.15}
            transparent
            opacity={0.85}
            flatShading
          />
        </mesh>
      )}

      {ring22GeomCheck(ring2Geom, ring2Ref)}
    </group>
  );
}

function ring22GeomCheck(
  geom: THREE.BufferGeometry | null,
  ref: React.RefObject<THREE.Mesh | null>
) {
  if (!geom) return null;
  return (
    <mesh
      ref={ref as unknown as React.RefObject<THREE.Mesh | null>}
      geometry={geom}
      position={[0, 1.4, 0]}
      scale={[1.2, 1.2, 1.2]}
    >
      <meshStandardMaterial
        color="#818cf8"
        emissive="#4338ca"
        emissiveIntensity={0.5}
        metalness={0.9}
        roughness={0.2}
        transparent
        opacity={0.8}
        flatShading
      />
    </mesh>
  );
}
