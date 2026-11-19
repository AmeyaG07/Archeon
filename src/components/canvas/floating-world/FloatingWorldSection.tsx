"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "framer-motion";

const IVORY = 0xf2f0eb;
const OBSIDIAN = 0x111111;
const BRONZE = 0xb68a4a;
const CONCRETE = 0x777777;
const WARM = 0xffd699;

const STAGES: { label: string; subtitle: string }[] = [
  { label: "01. Form", subtitle: "Massing and volume" },
  { label: "02. Structure", subtitle: "Exploded shell & louver choreography" },
  { label: "03. Interior & Materiality", subtitle: "Atrium, stair and finish" },
  { label: "04. Landscape", subtitle: "Terrace, water court and planting" },
];

interface WorldProps {
  scrollProgressRef: React.MutableRefObject<number>;
}

// The 3D scene lives inside <Canvas>, so useFrame is valid here (SSR-safe).
function World({ scrollProgressRef }: WorldProps) {
  const pavilionRef = useRef<THREE.Group>(null);
  const roofRef = useRef<THREE.Mesh>(null);
  const louverRefs = useRef<(THREE.Mesh | null)[]>([null, null, null, null, null]);
  const leftWallRef = useRef<THREE.Mesh>(null);
  const rightWallRef = useRef<THREE.Mesh>(null);
  const backWallRef = useRef<THREE.Mesh>(null);
  const interiorRef = useRef<THREE.Group>(null);
  const stairRef = useRef<THREE.Mesh>(null);
  const mezzanineRef = useRef<THREE.Mesh>(null);
  const landscapeRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Mesh>(null);
  const treeRefs = useRef<(THREE.Mesh | null)[]>([null, null, null, null]);
  const intLightRef = useRef<THREE.PointLight>(null);
  const levitationRef = useRef(0);
  const cameraPosRef = useRef(new THREE.Vector3(11, 7, 13));
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0.5, 0));

  const geo = useMemo(
    () => ({
      slab: new THREE.BoxGeometry(1, 1, 1),
      panel: new THREE.BoxGeometry(1, 1, 1),
      louver: new THREE.BoxGeometry(0.06, 2.2, 0.55),
      floor: new THREE.BoxGeometry(1, 0.12, 1),
      stair: new THREE.BoxGeometry(1, 0.16, 1.1),
      balustrade: new THREE.BoxGeometry(0.05, 1, 0.6),
      tree: new THREE.ConeGeometry(0.45, 1.4, 8),
      planter: new THREE.BoxGeometry(0.9, 0.45, 0.9),
      water: new THREE.PlaneGeometry(7, 7),
    }),
    []
  );

  const mat = useMemo(
    () => ({
      obsidian: new THREE.MeshStandardMaterial({ color: OBSIDIAN, roughness: 0.3, metalness: 0.5 }),
      ivory: new THREE.MeshStandardMaterial({ color: IVORY, roughness: 0.55, metalness: 0.1 }),
      bronze: new THREE.MeshStandardMaterial({ color: BRONZE, roughness: 0.35, metalness: 0.75 }),
      concrete: new THREE.MeshStandardMaterial({ color: CONCRETE, roughness: 0.85, metalness: 0.1 }),
      warmGlass: new THREE.MeshStandardMaterial({ color: WARM, emissive: WARM, emissiveIntensity: 2.0, transparent: true, opacity: 0.9 }),
      glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.08, transmission: 0.55, transparent: true, opacity: 0.6, thickness: 0.4 }),
    }),
    []
  );
  // Frame-rate independent animation — scrollProgressRef is written by ScrollTrigger
  // (never a React prop), so this triggers zero re-renders during scroll.
  useFrame((state, delta) => {
    const p = Math.max(0, Math.min(1, scrollProgressRef.current));
    const clock = state.clock.elapsedTime;

    const shellOpen = p <= 0.20 ? 0 : p >= 0.55 ? 1 : (p - 0.20) / 0.35; // 0.20 -> 0.55
    const interiorShow = p <= 0.55 ? 0 : p >= 0.80 ? 1 : (p - 0.55) / 0.25; // 0.55 -> 0.80
    const landscapeRise = p <= 0.80 ? 0 : p >= 1.0 ? 1 : (p - 0.80) / 0.20; // 0.80 -> 1.0

    // Gentle levitation, damped to 0 as the pavilion opens.
    const levTarget = Math.sin(clock * 1.4) * (1 - shellOpen * 0.92);
    levitationRef.current = THREE.MathUtils.damp(levitationRef.current, levTarget, 2.0, delta);
    if (pavilionRef.current) {
      pavilionRef.current.position.y = levitationRef.current;
    }

    // Stage 2: roof lifts, facade panels + bronze louvers explode outward.
    if (roofRef.current) {
      roofRef.current.position.y = THREE.MathUtils.damp(roofRef.current.position.y, 3.1 + shellOpen * 3.0, 3.0, delta);
      roofRef.current.position.z = THREE.MathUtils.damp(roofRef.current.position.z, 0 - shellOpen * 0.7, 3.0, delta);
    }
    if (leftWallRef.current) {
      leftWallRef.current.position.x = THREE.MathUtils.damp(leftWallRef.current.position.x, -2.3 - shellOpen * 1.7, 3.0, delta);
    }
    if (rightWallRef.current) {
      rightWallRef.current.position.x = THREE.MathUtils.damp(rightWallRef.current.position.x, 2.3 + shellOpen * 1.7, 3.0, delta);
    }
    if (backWallRef.current) {
      backWallRef.current.position.z = THREE.MathUtils.damp(backWallRef.current.position.z, -1.9 - shellOpen * 1.0, 3.0, delta);
    }
    [-1.5, -0.75, 0, 0.75, 1.5].forEach((baseX, i) => {
      const ref = louverRefs.current[i];
      if (!ref) return;
      const side = baseX >= 0 ? 1 : -1;
      ref.position.x = THREE.MathUtils.damp(ref.position.x, baseX + side * shellOpen * 1.9, 3.0, delta);
      ref.position.y = THREE.MathUtils.damp(ref.position.y, 1.9 + shellOpen * 0.7, 3.0, delta);
      ref.rotation.y = THREE.MathUtils.damp(ref.rotation.y, shellOpen * 1.15, 3.0, delta);
    });

    // Stage 3: interior rooms reveal (atrium, mezzanine, stair, furniture, warm light).
    if (interiorRef.current) {
      const s = THREE.MathUtils.damp(interiorRef.current.scale.x, interiorShow, 3.0, delta);
      interiorRef.current.scale.set(s, s, s);
      interiorRef.current.position.y = THREE.MathUtils.damp(interiorRef.current.position.y, interiorShow * 0.3, 3.0, delta);
    }
    if (mezzanineRef.current) {
      mezzanineRef.current.position.y = THREE.MathUtils.damp(mezzanineRef.current.position.y, interiorShow * 2.7, 3.0, delta);
    }
    if (stairRef.current) {
      stairRef.current.position.y = THREE.MathUtils.damp(stairRef.current.position.y, interiorShow * 0.55, 3.0, delta);
    }
    if (intLightRef.current) {
      intLightRef.current.intensity = THREE.MathUtils.damp(intLightRef.current.intensity, interiorShow * 2.4, 3.0, delta);
    }

    // Stage 4: terraced plinth, dark water court, courtyard trees rise.
    if (landscapeRef.current) {
      landscapeRef.current.position.y = THREE.MathUtils.damp(landscapeRef.current.position.y, -1.4 + landscapeRise * 1.5, 3.0, delta);
    }
    [-2.1, -0.7, 0.7, 2.1].forEach((x, i) => {
      const ref = treeRefs.current[i];
      if (!ref) return;
      ref.position.y = THREE.MathUtils.damp(ref.position.y, landscapeRise * 1.1, 3.0, delta);
    });

    // Camera choreography: isometric architectural angle, smooth damp.
    const camTgtX = THREE.MathUtils.lerp(11, 8.5, p);
    const camTgtY = THREE.MathUtils.lerp(7, 10.5, p);
    const camTgtZ = THREE.MathUtils.lerp(13, 17, p);
    const camLookY = THREE.MathUtils.lerp(0.5, 1.1, p);
    const lambda = 3.5;
    cameraPosRef.current.x = THREE.MathUtils.damp(cameraPosRef.current.x, camTgtX, lambda, delta);
    cameraPosRef.current.y = THREE.MathUtils.damp(cameraPosRef.current.y, camTgtY, lambda, delta);
    cameraPosRef.current.z = THREE.MathUtils.damp(cameraPosRef.current.z, camTgtZ, lambda, delta);
    cameraTargetRef.current.x = THREE.MathUtils.damp(cameraTargetRef.current.x, 0, lambda, delta);
    cameraTargetRef.current.y = THREE.MathUtils.damp(cameraTargetRef.current.y, camLookY, lambda, delta);
    cameraTargetRef.current.z = THREE.MathUtils.damp(cameraTargetRef.current.z, 0, lambda, delta);

    const { camera } = state;
    camera.position.copy(cameraPosRef.current);
    camera.lookAt(cameraTargetRef.current);
  });

  return (
    <>
      {/* Pavilion — Stage 1 floating volume; Stage 2 exploded shell */}
      <group ref={pavilionRef}>
        <mesh
          geometry={geo.slab}
          material={mat.obsidian}
          position={[0, -0.6, 0]}
          scale={[6, 0.5, 6]}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={geo.slab}
          material={mat.ivory}
          position={[0, 1, 0]}
          scale={[4.6, 2.6, 3.6]}
          castShadow
          receiveShadow
        />
        <mesh
          ref={roofRef}
          geometry={geo.slab}
          material={mat.obsidian}
          position={[0, 3.1, 0]}
          scale={[5.4, 0.28, 4.4]}
          castShadow
          receiveShadow
        />
        <mesh
          ref={leftWallRef}
          geometry={geo.panel}
          material={mat.ivory}
          position={[-2.3, 1.3, 0]}
          scale={[0.3, 2.4, 3.4]}
          castShadow
          receiveShadow
        />
        <mesh
          ref={rightWallRef}
          geometry={geo.panel}
          material={mat.ivory}
          position={[2.3, 1.3, 0]}
          scale={[0.3, 2.4, 3.4]}
          castShadow
          receiveShadow
        />
        <mesh
          ref={backWallRef}
          geometry={geo.panel}
          material={mat.ivory}
          position={[0, 1.3, -1.9]}
          scale={[4.6, 2.4, 0.3]}
          castShadow
          receiveShadow
        />
        {[-1.5, -0.75, 0, 0.75, 1.5].map((x, i) => (
          <mesh
            key={i}
            ref={(el) => {
              louverRefs.current[i] = el;
            }}
            geometry={geo.louver}
            material={mat.bronze}
            position={[x, 1.9, -1.42]}
            castShadow
            receiveShadow
          />
        ))}
        <mesh
          geometry={geo.slab}
          material={mat.warmGlass}
          position={[0, 1.2, -1.41]}
          scale={[2.8, 1.7, 0.04]}
        />
      </group>

      {/* Interior rooms — Stage 3 reveal */}
      <group ref={interiorRef} scale={[0, 0, 0]}>
        <mesh
          geometry={geo.floor}
          material={mat.ivory}
          position={[0, 0, 0]}
          scale={[4, 0.12, 3]}
          receiveShadow
        />
        <mesh
          ref={stairRef}
          geometry={geo.stair}
          material={mat.obsidian}
          position={[-1.4, 0.4, 0.2]}
          scale={[0.9, 0.16, 1.1]}
        />
        <mesh
          ref={mezzanineRef}
          geometry={geo.slab}
          material={mat.concrete}
          position={[0, 2.7, 0]}
          scale={[3, 0.18, 2.4]}
        />
        <mesh
          geometry={geo.floor}
          material={mat.obsidian}
          position={[1.2, 0.18, 0.8]}
          scale={[1.1, 0.05, 0.7]}
        />
        <mesh geometry={geo.balustrade} material={mat.glass} position={[1.5, 1.35, -0.9]} />
        <pointLight
          ref={intLightRef}
          position={[0, 1.6, 0]}
          intensity={0}
          distance={10}
          color={WARM}
          decay={1.5}
        />
      </group>

      {/* Landscape — Stage 4: terraced plinth, water court, courtyard trees */}
      <group ref={landscapeRef} position={[0, -1.4, 0]}>
        <mesh
          geometry={geo.slab}
          material={mat.concrete}
          position={[0, 0, 0]}
          scale={[8, 1, 8]}
          receiveShadow
        />
        <mesh
          ref={waterRef}
          geometry={geo.water}
          material={mat.glass}
          position={[0, 0.2, 0.2]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        {[-2.1, -0.7, 0.7, 2.1].map((x, i) => (
          <group key={i} position={[x, 0, 2]}>
            <mesh
              ref={(el) => {
                treeRefs.current[i] = el;
              }}
              geometry={geo.planter}
              material={mat.concrete}
              position={[0, 0, 0]}
            />
            <mesh geometry={geo.tree} material={mat.obsidian} position={[0, 0.65, 0]} />
          </group>
        ))}
      </group>
    </>
  );
}

interface FloatingWorldSectionProps {
  onOpenConsultation: () => void;
}

export function FloatingWorldSection({ onOpenConsultation }: FloatingWorldSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const lastStageRef = useRef(0);

  // GSAP ScrollTrigger — Lenis-compatible (SmoothScroll already registered the plugin globally)
  // Pins the hero canvas/HUD for the scroll-driven reveal; progress drives the 3D model.
  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.getAll().forEach((t) => t.kill());

    const updateProgress = () => {
      const self = ScrollTrigger.getById("floating-world-scrub");
      if (!self) return;
      const v = Math.max(0, Math.min(1, self.progress));
      scrollProgressRef.current = v;
      setProgress(v);

      let stage = 0;
      if (v >= 0.75) stage = 3;
      else if (v >= 0.55) stage = 2;
      else if (v >= 0.25) stage = 1;
      if (stage !== lastStageRef.current) {
        lastStageRef.current = stage;
        setActiveStage(stage);
      }
    };

    ScrollTrigger.create({
      id: "floating-world-scrub",
      trigger: sectionRef.current,
      start: "top top",
      end: "+=300%",
      scrub: 1,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      onUpdate: updateProgress,
      onRefresh: updateProgress,
    });

    updateProgress();

    return () => {
      ScrollTrigger.getById("floating-world-scrub")?.kill();
    };
  }, []);


  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[100vh] overflow-hidden bg-[#111111]"
    >
      <div className="w-full h-[100vh] block">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [11, 7, 13], fov: 35, near: 0.1, far: 80 }}
          className="w-full h-full block"
        >
          <color attach="background" args={[OBSIDIAN]} />
          <fog attach="fog" args={[OBSIDIAN, 18, 42]} />
          <ambientLight intensity={0.3} color="#f2f0eb" />
          <directionalLight
            position={[-12, 22, 10]}
            intensity={1.1}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <Environment resolution={256}>
            <Lightformer position={[7, 13, 5]} intensity={2.2} type="rect" color="#ffffff" />
            <Lightformer position={[-7, 7, -7]} intensity={1.3} type="rect" color="#f2f0eb" />
          </Environment>
          <ContactShadows
            position={[0, -2.2, 0]}
            opacity={0.55}
            scale={24}
            blur={2.4}
            far={8}
          />
          <World scrollProgressRef={scrollProgressRef} />
        </Canvas>
      </div>

      <AnimatePresence mode="wait">
        {activeStage !== undefined && (
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute top-8 right-8 pointer-events-none text-right z-30"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#777777] block mb-1">
              {Math.round(progress * 100)}%
            </span>
            <motion.h2 className="font-serif text-[clamp(1.5rem,4vw,2.25rem)] font-light text-[#F2F0EB] tracking-[-0.03em] leading-none">
              {STAGES[activeStage].label}
            </motion.h2>
            <p className="mt-2 text-sm font-light leading-relaxed text-[#9CA3AF]">
              {STAGES[activeStage].subtitle}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute top-8 right-5 z-30 pointer-events-none">
        <div className="w-px h-[calc(100vh-3rem)] bg-[#374151]/40 rounded-full">
          <div className="h-full w-full bg-[#B68A4A]" style={{ height: `${progress * 100}%` }} />
        </div>
      </div>
      <div className="absolute bottom-14 left-10 z-30 w-80 pointer-events-auto">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-10 bg-[#B68A4A]" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#B68A4A]">
            Architecture · Interior · Landscape
          </p>
        </div>
        <h1 className="font-serif text-[clamp(2.25rem,7vw,3.75rem)] font-light text-[#F2F0EB] leading-[0.92] tracking-[-0.04em] drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
          Spaces shaped<br />
          <span className="italic text-[#C6A779]">by intention.</span>
        </h1>
        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={onOpenConsultation}
            className="group inline-flex min-h-12 items-center justify-center gap-4 bg-[#F2F0EB] px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#111111] transition-colors duration-300 hover:bg-[#B68A4A] rounded-sm"
          >
            Discuss Your Project
          </button>
          <button
            type="button"
            onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex min-h-12 items-center justify-center gap-4 border border-[#F2F0EB]/35 px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#F2F0EB] transition-colors duration-300 hover:border-[#B68A4A] hover:text-[#B68A4A] rounded-sm"
          >
            Explore Projects
          </button>
        </div>
      </div>
    </section>
  );
}