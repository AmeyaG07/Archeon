"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface CameraRigProps {
  scrollProgress: number; // 0 to 1
}

export function CameraRig({ scrollProgress }: CameraRigProps) {
  const { camera, pointer } = useThree();
  const currentPos = useRef(new THREE.Vector3(-13.0, 5.0, 13.0));
  const currentTarget = useRef(new THREE.Vector3(0, 1.2, 0));

  // Camera FOV is set by the Three.js fiber canvas defaults.
  // Do not mutate hook-provided camera values directly.

  useFrame((_, delta) => {
    const p = Math.max(0, Math.min(1, scrollProgress));

    // Dynamic Waypoints for 5 Services + Hero + Outro:
    let targetX = -13.0;
    let targetY = 5.0;
    let targetZ = 13.0;

    let lookX = 0;
    let lookY = 1.2;
    let lookZ = 0;

    if (p <= 0.20) {
      // 01: Hero -> Architecture
      const t = p / 0.20;
      targetX = THREE.MathUtils.lerp(-13.0, -7.0, t);
      targetY = THREE.MathUtils.lerp(5.0, -4.5, t);
      targetZ = THREE.MathUtils.lerp(13.0, 8.5, t);

      lookX = THREE.MathUtils.lerp(0, -4.6, t);
      lookY = THREE.MathUtils.lerp(1.2, -4.5, t);
      lookZ = THREE.MathUtils.lerp(0, 2.0, t);
    } else if (p <= 0.40) {
      // 02: Architecture -> Interior
      const t = (p - 0.20) / 0.20;
      targetX = THREE.MathUtils.lerp(-7.0, 7.5, t);
      targetY = THREE.MathUtils.lerp(-4.5, -10.5, t);
      targetZ = THREE.MathUtils.lerp(8.5, 8.0, t);

      lookX = THREE.MathUtils.lerp(-4.6, 4.8, t);
      lookY = THREE.MathUtils.lerp(-4.5, -10.5, t);
      lookZ = THREE.MathUtils.lerp(2.0, 1.5, t);
    } else if (p <= 0.60) {
      // 03: Interior -> Landscape
      const t = (p - 0.40) / 0.20;
      targetX = THREE.MathUtils.lerp(7.5, -6.8, t);
      targetY = THREE.MathUtils.lerp(-10.5, -16.5, t);
      targetZ = THREE.MathUtils.lerp(8.0, 8.5, t);

      lookX = THREE.MathUtils.lerp(4.8, -4.2, t);
      lookY = THREE.MathUtils.lerp(-10.5, -16.5, t);
      lookZ = THREE.MathUtils.lerp(1.5, 2.2, t);
    } else if (p <= 0.80) {
      // 04: Landscape -> 3D Visualiser
      const t = (p - 0.60) / 0.20;
      targetX = THREE.MathUtils.lerp(-6.8, 7.2, t);
      targetY = THREE.MathUtils.lerp(-16.5, -22.5, t);
      targetZ = THREE.MathUtils.lerp(8.5, 8.0, t);

      lookX = THREE.MathUtils.lerp(-4.2, 4.5, t);
      lookY = THREE.MathUtils.lerp(-16.5, -22.5, t);
      lookZ = THREE.MathUtils.lerp(2.2, 1.8, t);
    } else if (p <= 0.92) {
      // 05: 3D Visualiser -> Turnkey
      const t = (p - 0.80) / 0.12;
      targetX = THREE.MathUtils.lerp(7.2, -6.5, t);
      targetY = THREE.MathUtils.lerp(-22.5, -28.5, t);
      targetZ = THREE.MathUtils.lerp(8.0, 8.5, t);

      lookX = THREE.MathUtils.lerp(4.5, -4.0, t);
      lookY = THREE.MathUtils.lerp(-22.5, -28.5, t);
      lookZ = THREE.MathUtils.lerp(1.8, 2.0, t);
    } else {
      // Finale: Studio Philosophy & Panorama
      const t = (p - 0.92) / 0.08;
      targetX = THREE.MathUtils.lerp(-6.5, 0.0, t);
      targetY = THREE.MathUtils.lerp(-28.5, -34.0, t);
      targetZ = THREE.MathUtils.lerp(8.5, 13.0, t);

      lookX = THREE.MathUtils.lerp(-4.0, 0, t);
      lookY = THREE.MathUtils.lerp(-28.5, -34.0, t);
      lookZ = THREE.MathUtils.lerp(2.0, 0, t);
    }

    // Parallax mouse damping
    targetX += pointer.x * 0.4;
    targetY += pointer.y * 0.3;

    const lerpSpeed = Math.min(1, delta * 3.5);
    currentPos.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), lerpSpeed);
    currentTarget.current.lerp(new THREE.Vector3(lookX, lookY, lookZ), lerpSpeed);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentTarget.current);
  });

  return null;
}
