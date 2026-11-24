"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PortfolioProject } from "@/config/siteConfig";
import { useAudio } from "@/providers/AudioProvider";
import { loadDracoGeometry } from "@/utils/dracoLoader";

interface FloatingProjectCubesProps {
  projects: PortfolioProject[];
  onSelectProject: (project: PortfolioProject) => void;
  activeProjectId?: string | null;
}

function ProjectCubeItem({
  project,
  position,
  cubeGeomUrl,
  innerGeomUrl,
  innerScale = 0.8,
  onSelect,
  isActive
}: {
  project: PortfolioProject;
  position: [number, number, number];
  cubeGeomUrl: string;
  innerGeomUrl: string;
  innerScale?: number;
  onSelect: () => void;
  isActive: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { playSfx } = useAudio();

  const [cubeGeom, setCubeGeom] = useState<THREE.BufferGeometry | null>(null);
  const [innerGeom, setInnerGeom] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    loadDracoGeometry(cubeGeomUrl).then(setCubeGeom).catch(() => {});
    loadDracoGeometry(innerGeomUrl).then(setInnerGeom).catch(() => {});
  }, [cubeGeomUrl, innerGeomUrl]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const speed = hovered ? 1.6 : 0.6;
    meshRef.current.rotation.x += delta * 0.2 * speed;
    meshRef.current.rotation.y += delta * 0.35 * speed;

    // Hover floating bounce
    meshRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 1.8 + position[0]) * 0.25;

    // Independent inner object rotation
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.5 * speed;
    }
  });

  return (
    <group
      ref={meshRef}
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
      {/* Outer Frosted Glass Box */}
      {cubeGeom ? (
        <mesh geometry={cubeGeom} scale={hovered || isActive ? 1.15 : 1.0}>
          <meshStandardMaterial
            color={hovered || isActive ? project.accentColor : "#94a3b8"}
            roughness={0.15}
            metalness={0.8}
            transparent
            opacity={hovered ? 0.85 : 0.55}
            flatShading
          />
        </mesh>
      ) : (
        <mesh scale={hovered || isActive ? 1.15 : 1.0}>
          <boxGeometry args={[1.6, 1.6, 1.6]} />
          <meshStandardMaterial
            color={hovered || isActive ? project.accentColor : "#94a3b8"}
            roughness={0.15}
            metalness={0.8}
            transparent
            opacity={hovered ? 0.85 : 0.55}
          />
        </mesh>
      )}

      {/* Wireframe Outline Edge */}
      <lineSegments scale={hovered || isActive ? 1.16 : 1.01}>
        <wireframeGeometry args={[cubeGeom || new THREE.BoxGeometry(1.6, 1.6, 1.6)]} />
        <lineBasicMaterial
          color={hovered || isActive ? "#ffffff" : project.accentColor}
          transparent
          opacity={0.8}
        />
      </lineSegments>

      {/* Real 3D Inner Emblem (Pudgy Penguin / Overpass / Abstract) */}
      <group ref={innerRef} scale={innerScale}>
        {innerGeom ? (
          <mesh geometry={innerGeom} castShadow>
            <meshStandardMaterial
              color={project.accentColor}
              emissive={project.accentColor}
              emissiveIntensity={hovered ? 2.5 : 1.0}
              roughness={0.2}
              metalness={0.9}
              flatShading
            />
          </mesh>
        ) : (
          <mesh rotation={[0.4, 0.4, 0]}>
            <octahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial
              color={project.accentColor}
              emissive={project.accentColor}
              emissiveIntensity={hovered ? 2.0 : 0.8}
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
        )}
      </group>

      {/* Orbiting Particle Sparkles */}
      <group rotation={[1, 0, 0]}>
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const radius = 1.4;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
            >
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshBasicMaterial color={project.accentColor} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export function FloatingProjectCubes({
  projects,
  onSelectProject,
  activeProjectId
}: FloatingProjectCubesProps) {
  // Spatial coordinates matching camera path
  const cubeConfigs = [
    {
      pos: [-4.2, -4.5, 2.5] as [number, number, number],
      cubeGeom: "/assets/geometries/cubes/cube3.drc",
      innerGeom: "/assets/geometries/pudgy.drc",
      scale: 1.1
    },
    {
      pos: [4.5, -11.0, 2.0] as [number, number, number],
      cubeGeom: "/assets/geometries/cubes/cube1.drc",
      innerGeom: "/assets/geometries/overpass_logo.drc",
      scale: 1.2
    },
    {
      pos: [-4.0, -17.5, 3.0] as [number, number, number],
      cubeGeom: "/assets/geometries/cubes/cube2.drc",
      innerGeom: "/assets/geometries/abstract.drc",
      scale: 1.0
    }
  ];

  return (
    <group>
      {projects.map((proj, idx) => {
        const config = cubeConfigs[idx] || cubeConfigs[0];
        return (
          <ProjectCubeItem
            key={proj.id}
            project={proj}
            position={config.pos}
            cubeGeomUrl={config.cubeGeom}
            innerGeomUrl={config.innerGeom}
            innerScale={config.scale}
            onSelect={() => onSelectProject(proj)}
            isActive={activeProjectId === proj.id}
          />
        );
      })}
    </group>
  );
}
