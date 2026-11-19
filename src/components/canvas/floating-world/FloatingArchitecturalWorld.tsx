"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface FloatingArchitecturalWorldProps {
  scrollProgressRef: React.MutableRefObject<number>;
}

const IVORY = 0xf2f0eb;
const OBSIDIAN = 0x111111;
const BRONZE = 0xb68a4a;
const CONCRETE = 0x777777;

export function FloatingArchitecturalWorld({
  scrollProgressRef,
}: FloatingArchitecturalWorldProps) {
  const rootRef = useRef<THREE.Group>(null);
  const roofRef = useRef<THREE.Mesh>(null);
  const louverRefs = useRef<(THREE.Mesh | null)[]>([null, null, null, null]);
  const leftWallRef = useRef<THREE.Mesh>(null);
  const rightWallRef = useRef<THREE.Mesh>(null);
  const interiorRef = useRef<THREE.Group>(null);
  const landscapeRef = useRef<THREE.Group>(null);
  const intLightRef = useRef<THREE.PointLight>(null);
  const levitationRef = useRef(0);

  const geo = useMemo(
    () => ({
      slab: new THREE.BoxGeometry(1, 0.4, 1),
      wall: new THREE.BoxGeometry(1, 1, 1),
      louver: new THREE.BoxGeometry(0.05, 2, 0.6),
      floor: new THREE.BoxGeometry(1, 0.1, 1),
      stair: new THREE.BoxGeometry(1, 0.15, 1),
      balustrade: new THREE.BoxGeometry(0.05, 1, 0.6),
      tree: new THREE.ConeGeometry(0.4, 1.2, 8),
      planter: new THREE.BoxGeometry(0.8, 0.4, 0.8),
      water: new THREE.PlaneGeometry(4, 4),
    }),
    []
  );

  const mat = useMemo(
    () => ({
      ivory: new THREE.MeshStandardMaterial({
        color: IVORY,
        roughness: 0.6,
        metalness: 0.1,
      }),
      obsidian: new THREE.MeshStandardMaterial({
        color: OBSIDIAN,
        roughness: 0.3,
        metalness: 0.4,
      }),
      bronze: new THREE.MeshStandardMaterial({
        color: BRONZE,
        roughness: 0.4,
        metalness: 0.7,
      }),
      concrete: new THREE.MeshStandardMaterial({
        color: CONCRETE,
        roughness: 0.8,
        metalness: 0.1,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.1,
        transmission: 0.6,
        transparent: true,
        opacity: 0.65,
        thickness: 0.5,
      }),
    }),
    []
  );
  useFrame((state, delta) => {
    const p = Math.max(0, Math.min(1, scrollProgressRef.current));
    const clock = state.clock.elapsedTime;

    const shellOpen = p <= 0.20 ? 0 : p >= 0.55 ? 1 : (p - 0.20) / 0.35;
    const interiorShow = p <= 0.35 ? 0 : p >= 0.75 ? 1 : (p - 0.35) / 0.40;
    const landscapeRise = p <= 0.65 ? 0 : p >= 1.0 ? 1 : (p - 0.65) / 0.35;

    const levTarget = Math.sin(clock * 0.8) * (1 - shellOpen * 0.7);
    levitationRef.current = THREE.MathUtils.damp(levitationRef.current, levTarget, 2.0, delta);
    if (rootRef.current) {
      rootRef.current.position.y = levitationRef.current;
    }

    if (roofRef.current) {
      roofRef.current.position.y = THREE.MathUtils.damp(
        roofRef.current.position.y,
        3.4 + shellOpen * 1.6,
        3.0,
        delta
      );
      roofRef.current.position.z = THREE.MathUtils.damp(
        roofRef.current.position.z,
        0 - shellOpen * 0.8,
        3.0,
        delta
      );
    }
    if (leftWallRef.current) {
      leftWallRef.current.position.x = THREE.MathUtils.damp(
        leftWallRef.current.position.x,
        -1.9 - shellOpen * 0.6,
        3.0,
        delta
      );
    }
    if (rightWallRef.current) {
      rightWallRef.current.position.x = THREE.MathUtils.damp(
        rightWallRef.current.position.x,
        1.9 + shellOpen * 0.6,
        3.0,
        delta
      );
    }
    [-1.2, -0.4, 0.4, 1.2].forEach((baseX, i) => {
      const ref = louverRefs.current[i];
      if (!ref) return;
      const slide = baseX + (baseX > 0 ? 1 : -1) * shellOpen * 1.4;
      ref.position.x = THREE.MathUtils.damp(ref.position.x, slide, 3.0, delta);
      ref.position.y = THREE.MathUtils.damp(ref.position.y, 2.4 + shellOpen * 1.2, 3.0, delta);
      ref.rotation.z = THREE.MathUtils.damp(ref.rotation.z, shellOpen * 0.15, 3.0, delta);
    });

    if (interiorRef.current) {
      const s = THREE.MathUtils.damp(interiorRef.current.scale.x, interiorShow, 3.0, delta);
      interiorRef.current.scale.set(s, s, s);
      interiorRef.current.position.y = THREE.MathUtils.damp(
        interiorRef.current.position.y,
        interiorShow * 0.5,
        3.0,
        delta
      );
    }
    if (intLightRef.current) {
      intLightRef.current.intensity = THREE.MathUtils.damp(
        intLightRef.current.intensity,
        interiorShow * 2.0,
        3.0,
        delta
      );
    }

    if (landscapeRef.current) {
      landscapeRef.current.position.y = THREE.MathUtils.damp(
        landscapeRef.current.position.y,
        -1.6 + landscapeRise * 1.2,
        3.0,
        delta
      );
    }
  });

  return (
    <group ref={rootRef}>
      <group>
        <mesh
          ref={roofRef}
          geometry={geo.slab}
          material={mat.concrete}
          position={[0, 3.4, 0]}
          scale={[4.2, 0.45, 3.2]}
          castShadow
          receiveShadow
        />
        <mesh
          ref={leftWallRef}
          geometry={geo.wall}
          material={mat.ivory}
          position={[-1.9, 2, 0]}
          scale={[0.35, 2.4, 2.6]}
          castShadow
          receiveShadow
        />
        <mesh
          ref={rightWallRef}
          geometry={geo.wall}
          material={mat.ivory}
          position={[1.9, 2, 0]}
          scale={[0.35, 2.4, 2.6]}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={geo.wall}
          material={mat.ivory}
          position={[0, 2, -1.5]}
          scale={[2.6, 2.4, 0.35]}
          castShadow
          receiveShadow
        />
        {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
          <mesh
            key={i}
            ref={(el) => {
              louverRefs.current[i] = el;
            }}
            geometry={geo.louver}
            material={mat.bronze}
            position={[x, 2.4, 0]}
            castShadow
            receiveShadow
          />
        ))}
      </group>

      <group ref={interiorRef} scale={[0, 0, 0]} position={[0, 0, 0]}>
        <mesh
          geometry={geo.floor}
          material={mat.ivory}
          position={[0, 0, 0]}
          scale={[3.4, 0.12, 3]}
          receiveShadow
        />
        <mesh
          geometry={geo.wall}
          material={mat.concrete}
          position={[0, 1, -0.6]}
          scale={[2.6, 1.8, 0.3]}
        />
        <mesh
          geometry={geo.stair}
          material={mat.obsidian}
          position={[-1.2, 0.4, 0.4]}
          scale={[0.9, 0.15, 1.1]}
        />
        <mesh
          geometry={geo.floor}
          material={mat.obsidian}
          position={[1.0, 0.12, 0.6]}
          scale={[1.1, 0.05, 0.5]}
        />
        <mesh
          geometry={geo.balustrade}
          material={mat.glass}
          position={[1.5, 1.1, -0.8]}
        />
      </group>

      <group ref={landscapeRef} position={[0, -1.6, 0]}>
        <mesh
          geometry={geo.slab}
          material={mat.concrete}
          position={[0, 0, 0]}
          scale={[6, 0.8, 6]}
          receiveShadow
        />
        <mesh
          geometry={geo.water}
          material={mat.glass}
          position={[0, 0.2, 0.2]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        {[
          [-2, -2],
          [2, -2],
          [-2, 2],
          [2, 2],
        ].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh geometry={geo.planter} material={mat.concrete} position={[0, 0, 0]} />
            <mesh geometry={geo.tree} material={mat.obsidian} position={[0, 0.6, 0]} />
          </group>
        ))}
      </group>

      <pointLight
        ref={intLightRef}
        position={[0, 1.2, 0]}
        distance={10}
        color={0xffd699}
        decay={1.5}
      />
      <directionalLight
        position={[-10, 15, 8]}
        intensity={1.2}
        color={0xffffff}
        castShadow
      />
      <ambientLight intensity={0.35} color={0xf2f0eb} />
    </group>
  );
}
