"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface WorldCameraRigProps {
  scrollProgressRef: React.MutableRefObject<number>;
  prefersReducedRef?: React.MutableRefObject<boolean>;
  isTouchRef?: React.MutableRefObject<boolean>;
}

export function WorldCameraRig({
  scrollProgressRef,
  prefersReducedRef,
  isTouchRef,
}: WorldCameraRigProps) {
  const { camera, pointer } = useThree();
  const currentPos = useRef(new THREE.Vector3(0, 6, 14));
  const currentTarget = useRef(new THREE.Vector3(0, 1, 0));
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const p = Math.max(0, Math.min(1, scrollProgressRef.current));

    let targetX = 0;
    let targetY = 6;
    let targetZ = 14;
    let lookX = 0;
    let lookY = 1;
    let lookZ = 0;

    if (p <= 0.25) {
      // Stage 01: Form
      const t = p / 0.25;
      targetX = THREE.MathUtils.lerp(-10, 2, t);
      targetY = THREE.MathUtils.lerp(6, 5, t);
      targetZ = THREE.MathUtils.lerp(14, 10, t);
      lookX = THREE.MathUtils.lerp(0, 0, t);
      lookY = THREE.MathUtils.lerp(1, 1, t);
      lookZ = THREE.MathUtils.lerp(0, 0, t);
    } else if (p <= 0.55) {
      // Stage 02: Structure
      const t = (p - 0.25) / 0.30;
      targetX = THREE.MathUtils.lerp(2, -2, t);
      targetY = THREE.MathUtils.lerp(5, 7, t);
      targetZ = THREE.MathUtils.lerp(10, 6, t);
      lookX = THREE.MathUtils.lerp(0, -1, t);
      lookY = THREE.MathUtils.lerp(1, 2, t);
      lookZ = THREE.MathUtils.lerp(0, 0, t);
    } else if (p <= 0.75) {
      // Stage 03: Interior & Materiality
      const t = (p - 0.55) / 0.20;
      targetX = THREE.MathUtils.lerp(-2, 1, t);
      targetY = THREE.MathUtils.lerp(7, 2, t);
      targetZ = THREE.MathUtils.lerp(6, 2, t);
      lookX = THREE.MathUtils.lerp(-1, 0, t);
      lookY = THREE.MathUtils.lerp(2, 0.5, t);
      lookZ = THREE.MathUtils.lerp(0, 0, t);
    } else {
      // Stage 04: Landscape
      const t = (p - 0.75) / 0.25;
      targetX = THREE.MathUtils.lerp(1, -4, t);
      targetY = THREE.MathUtils.lerp(2, 9, t);
      targetZ = THREE.MathUtils.lerp(2, 12, t);
      lookX = THREE.MathUtils.lerp(0, -1, t);
      lookY = THREE.MathUtils.lerp(0.5, 0, t);
      lookZ = THREE.MathUtils.lerp(0, 0, t);
    }

    // Subtle pointer parallax — desktop only, disabled on touch / reduced motion
    if (!(prefersReducedRef?.current || isTouchRef?.current)) {
      targetX += pointer.x * 1.0;
      targetY -= pointer.y * 0.7;
    }

    targetPos.current.set(targetX, targetY, targetZ);
    targetLook.current.set(lookX, lookY, lookZ);

    const lambda = 4.0;
    // Frame-rate independent damping (MathUtils.damp is scalar; applied per component)
    currentPos.current.x = THREE.MathUtils.damp(
      currentPos.current.x,
      targetPos.current.x,
      lambda,
      delta
    );
    currentPos.current.y = THREE.MathUtils.damp(
      currentPos.current.y,
      targetPos.current.y,
      lambda,
      delta
    );
    currentPos.current.z = THREE.MathUtils.damp(
      currentPos.current.z,
      targetPos.current.z,
      lambda,
      delta
    );
    currentTarget.current.x = THREE.MathUtils.damp(
      currentTarget.current.x,
      targetLook.current.x,
      lambda,
      delta
    );
    currentTarget.current.y = THREE.MathUtils.damp(
      currentTarget.current.y,
      targetLook.current.y,
      lambda,
      delta
    );
    currentTarget.current.z = THREE.MathUtils.damp(
      currentTarget.current.z,
      targetLook.current.z,
      lambda,
      delta
    );

    camera.position.copy(currentPos.current);
    camera.lookAt(currentTarget.current);
  });

  return null;
}
