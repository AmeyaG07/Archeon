"use client";

import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { ArchitecturalCave, LightingMode } from "./ArchitecturalCave";
import { ArchitecturalMonoliths } from "./ArchitecturalMonoliths";
import { ParticleSnow } from "./ParticleSnow";
import { CameraRig } from "./CameraRig";
import { ServiceItem } from "@/config/siteConfig";

interface SceneProps {
  scrollProgress: number;
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
  activeServiceId?: string | null;
  lightingMode: LightingMode;
  wireframeMode: boolean;
}

export function Scene({
  scrollProgress,
  services,
  onSelectService,
  activeServiceId,
  lightingMode,
  wireframeMode
}: SceneProps) {
  const { bgCol, fogCol, sunCol, sunIntensity, ambientCol, ambientIntensity, rimCol } =
    useMemo(() => {
      switch (lightingMode) {
        case "noon":
          return {
            bgCol: "#141210",
            fogCol: "#141210",
            sunCol: "#ffffff",
            sunIntensity: 1.6,
            ambientCol: "#e7e5e4",
            ambientIntensity: 0.8,
            rimCol: "#38bdf8"
          };
        case "sunset":
          return {
            bgCol: "#170a04",
            fogCol: "#170a04",
            sunCol: "#ea580c",
            sunIntensity: 2.0,
            ambientCol: "#fbbf24",
            ambientIntensity: 0.7,
            rimCol: "#f97316"
          };
        case "night":
        default:
          return {
            bgCol: "#09080d",
            fogCol: "#09080d",
            sunCol: "#fef08a",
            sunIntensity: 0.7,
            ambientCol: "#1e1b4b",
            ambientIntensity: 0.45,
            rimCol: "#fbbf24"
          };
      }
    }, [lightingMode]);

  return (
    <div className="fixed inset-0 pointer-events-auto z-0 overflow-hidden">
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
        camera={{
          position: [-13.0, 5.0, 13.0],
          fov: 32,
          near: 0.1,
          far: 120
        }}
      >
        <color attach="background" args={[bgCol]} />
        <fog attach="fog" args={[fogCol, 12, 55]} />

        {/* Ambient & Primary Directional Sunlight */}
        <ambientLight intensity={ambientIntensity} color={ambientCol} />
        <directionalLight
          position={[-14, 25, 12]}
          intensity={sunIntensity}
          color={sunCol}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Skylight Oculus Downlight */}
        <pointLight position={[0, 6.5, -2]} intensity={2.8} distance={22} color={rimCol} />
        {/* Subtle Water Reflection Uplight */}
        <pointLight position={[0, -0.2, 3]} intensity={1.5} distance={14} color="#0d9488" />

        <Suspense fallback={null}>
          <CameraRig scrollProgress={scrollProgress} />
          <ArchitecturalCave
            scrollProgress={scrollProgress}
            lightingMode={lightingMode}
            wireframeMode={wireframeMode}
          />
          <ArchitecturalMonoliths
            services={services}
            onSelectService={onSelectService}
            activeServiceId={activeServiceId}
            wireframeMode={wireframeMode}
          />
          <ParticleSnow count={900} />
        </Suspense>
      </Canvas>
    </div>
  );
}
