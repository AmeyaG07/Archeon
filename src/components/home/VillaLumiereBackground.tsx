"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RotateCw, Pause, Play, Eye } from "lucide-react";

interface CalloutState {
  id: string;
  num: string;
  name: string;
  x: number;
  y: number;
  visible: boolean;
}

export function VillaLumiereBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phaseStatus, setPhaseStatus] = useState<string>("ASSEMBLED · 1:50");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [callouts, setCallouts] = useState<CalloutState[]>([
    { id: "plinth", num: "01", name: "PLINTH & POOL", x: 0, y: 0, visible: false },
    { id: "level1", num: "02", name: "LIVING PAVILION", x: 0, y: 0, visible: false },
    { id: "level2", num: "03", name: "CANTILEVER STUDIO", x: 0, y: 0, visible: false },
    { id: "roof", num: "04", name: "ROOF CANOPY", x: 0, y: 0, visible: false },
  ]);

  const isPlayingRef = useRef<boolean>(true);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // --- TIMING & CYCLE CONSTANTS ---
    const CYCLE = {
      HOLD_ASSEMBLED: 2.0,
      SEPARATE: 2.4,
      HOLD_SEPARATED: 2.5,
      JOIN: 2.2,
    };
    const TOTAL_CYCLE =
      CYCLE.HOLD_ASSEMBLED + CYCLE.SEPARATE + CYCLE.HOLD_SEPARATED + CYCLE.JOIN;

    const MAX_LIFT = {
      level1: 2.0,
      level2: 5.3,
      roof: 8.9,
    };

    function easeInOutQuint(t: number): number {
      const x = THREE.MathUtils.clamp(t, 0, 1);
      return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
    }

    function staggeredEase(progress: number, start: number, end: number): number {
      const local = THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1);
      return easeInOutQuint(local);
    }

    function computeFloorFractions(rawProgress: number, isJoining: boolean) {
      if (!isJoining) {
        return {
          roof: staggeredEase(rawProgress, 0.0, 0.78),
          level2: staggeredEase(rawProgress, 0.14, 0.9),
          level1: staggeredEase(rawProgress, 0.28, 1.0),
        };
      } else {
        return {
          level1: 1 - staggeredEase(rawProgress, 0.0, 0.72),
          level2: 1 - staggeredEase(rawProgress, 0.14, 0.86),
          roof: 1 - staggeredEase(rawProgress, 0.26, 1.0),
        };
      }
    }

    // --- PROCEDURAL ARCHITECTURAL TEXTURES ---
    function createTravertineTexture(): THREE.CanvasTexture {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(c);
      ctx.fillStyle = "#ece6db";
      ctx.fillRect(0, 0, 512, 512);

      for (let y = 0; y < 512; y += 2) {
        const vein = Math.sin(y * 0.055) * 6 + Math.cos(y * 0.16) * 4;
        const v = Math.round(230 + vein + (Math.random() - 0.5) * 9);
        ctx.fillStyle = `rgb(${v}, ${v - 5}, ${v - 13})`;
        ctx.fillRect(0, y, 512, 2);
      }

      ctx.strokeStyle = "rgba(128, 118, 102, 0.15)";
      ctx.lineWidth = 1.25;
      for (let i = 0; i <= 512; i += 128) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    function createOakTexture(rx = 5, ry = 4): THREE.CanvasTexture {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(c);
      ctx.fillStyle = "#caa276";
      ctx.fillRect(0, 0, 512, 512);

      const plankH = 32;
      for (let y = 0; y < 512; y += plankH) {
        const shift = (Math.random() - 0.5) * 16;
        ctx.fillStyle = `rgb(${200 + shift}, ${160 + shift * 0.85}, ${114 + shift * 0.7})`;
        ctx.fillRect(0, y, 512, plankH);

        for (let g = 0; g < 16; g++) {
          const gy = y + Math.random() * plankH;
          ctx.fillStyle = `rgba(112, 76, 40, ${0.05 + Math.random() * 0.08})`;
          ctx.fillRect(0, gy, 512, 1.2);
        }
        ctx.fillStyle = "rgba(78, 54, 28, 0.22)";
        ctx.fillRect(0, y, 512, 1);
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(rx, ry);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    // --- MATERIALS INITIALIZATION ---
    const travTex = createTravertineTexture();
    const oakTex = createOakTexture(5, 4);
    const oakDeckTex = createOakTexture(6, 4);

    const M = {
      travertine: new THREE.MeshStandardMaterial({
        map: travTex,
        color: 0xf4f0e8,
        roughness: 0.78,
        metalness: 0.02,
      }),
      concrete: new THREE.MeshStandardMaterial({
        color: 0xeae6df,
        roughness: 0.85,
        metalness: 0.02,
      }),
      plaster: new THREE.MeshStandardMaterial({
        color: 0xf6f3ee,
        roughness: 0.88,
        metalness: 0.0,
      }),
      oak: new THREE.MeshStandardMaterial({
        map: oakTex,
        color: 0xd9b386,
        roughness: 0.62,
        metalness: 0.04,
      }),
      oakDeck: new THREE.MeshStandardMaterial({
        map: oakDeckTex,
        color: 0xc99f72,
        roughness: 0.68,
        metalness: 0.03,
      }),
      oakDark: new THREE.MeshStandardMaterial({
        color: 0x997048,
        roughness: 0.58,
        metalness: 0.05,
      }),
      bronze: new THREE.MeshStandardMaterial({
        color: 0x2b2724,
        roughness: 0.36,
        metalness: 0.78,
      }),
      brass: new THREE.MeshStandardMaterial({
        color: 0xc49a56,
        roughness: 0.28,
        metalness: 0.86,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xdbe9ee,
        transparent: true,
        opacity: 0.3,
        roughness: 0.07,
        metalness: 0.05,
        reflectivity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      glassRail: new THREE.MeshPhysicalMaterial({
        color: 0xe4f0f4,
        transparent: true,
        opacity: 0.26,
        roughness: 0.09,
        clearcoat: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      water: new THREE.MeshPhysicalMaterial({
        color: 0x5ca4b5,
        transparent: true,
        opacity: 0.74,
        roughness: 0.12,
        metalness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        side: THREE.DoubleSide,
      }),
      poolBasin: new THREE.MeshStandardMaterial({
        color: 0x3b6370,
        roughness: 0.55,
        metalness: 0.04,
      }),
      boucle: new THREE.MeshStandardMaterial({
        color: 0xf4efe6,
        roughness: 0.95,
      }),
      rug: new THREE.MeshStandardMaterial({
        color: 0xe3dcd1,
        roughness: 0.96,
      }),
      marble: new THREE.MeshStandardMaterial({
        color: 0xf3efe8,
        roughness: 0.22,
        metalness: 0.04,
      }),
      terracotta: new THREE.MeshStandardMaterial({
        color: 0xb86f52,
        roughness: 0.88,
      }),
      foliageLight: new THREE.MeshStandardMaterial({
        color: 0x6f8463,
        roughness: 0.84,
      }),
      foliageDeep: new THREE.MeshStandardMaterial({
        color: 0x51664a,
        roughness: 0.86,
      }),
      bark: new THREE.MeshStandardMaterial({
        color: 0x59493b,
        roughness: 0.9,
      }),
      soil: new THREE.MeshStandardMaterial({
        color: 0x473e36,
        roughness: 0.95,
      }),
      warmGlow: new THREE.MeshStandardMaterial({
        color: 0xfff5e4,
        emissive: 0xffc985,
        emissiveIntensity: 0.75,
        roughness: 0.35,
      }),
      ember: new THREE.MeshStandardMaterial({
        color: 0xe67e3e,
        emissive: 0xd95f1e,
        emissiveIntensity: 0.55,
        roughness: 0.65,
      }),
    };

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    // Soft transparent background to blend into #F2F0EB
    scene.fog = new THREE.FogExp2(0xf2f0eb, 0.012);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 750;

    const isDesktop = width > 1024;
    const shiftX = isDesktop ? 7.8 : width > 768 ? 4.5 : 0.0;

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.2, 220);
    camera.position.set(22.0 + shiftX, 15.0, 24.0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    // Shift target to right side so villa is framed cleanly in the open right half, avoiding left editorial text
    controls.target.set(shiftX, 4.8, 0.0);
    controls.minDistance = 10.0;
    controls.maxDistance = 55.0;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.32;
    // Allow touch scroll through canvas on mobile
    controls.enableZoom = false;

    // Ground plane
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xf2f0eb,
      roughness: 0.96,
      metalness: 0.0,
    });
    const studioFloor = new THREE.Mesh(floorGeo, floorMat);
    studioFloor.position.y = -0.01;
    studioFloor.receiveShadow = true;
    scene.add(studioFloor);

    // Directional Key Sun Light
    const sunLight = new THREE.DirectionalLight(0xfff6eb, 2.3);
    sunLight.position.set(22, 29, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 95;
    const d = 22;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.00035;
    sunLight.shadow.normalBias = 0.025;
    scene.add(sunLight);

    // Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0xfcfbf7, 0xd8cfc2, 0.95);
    scene.add(hemiLight);

    // Fill Light
    const fillLight = new THREE.DirectionalLight(0xdce8f7, 0.42);
    fillLight.position.set(-20, 14, -18);
    scene.add(fillLight);

    // Subtle Architectural Drafting Grid Lines
    const gridPts: number[] = [];
    const gy = 0.015;
    const gsize = 24;
    const gstep = 3.0;
    for (let i = -gsize; i <= gsize; i += gstep) {
      gridPts.push(-gsize, gy, i, gsize, gy, i);
      gridPts.push(i, gy, -gsize, i, gy, gsize);
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(gridPts, 3));
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x8e887d,
      transparent: true,
      opacity: 0.16,
    });
    // Refined Bronze Drafting Frame
    const rx = 12.2, rz = 9.7;
    const framePts = [
      -rx, gy + 0.005, -rz, rx, gy + 0.005, -rz,
      rx, gy + 0.005, -rz, rx, gy + 0.005, rz,
      rx, gy + 0.005, rz, -rx, gy + 0.005, rz,
      -rx, gy + 0.005, rz, -rx, gy + 0.005, -rz,
    ];
    const frameGeo = new THREE.BufferGeometry();
    frameGeo.setAttribute("position", new THREE.Float32BufferAttribute(framePts, 3));
    const frameMat = new THREE.LineBasicMaterial({
      color: 0x9f7947,
      transparent: true,
      opacity: 0.32,
    });

    // --- ENTITIES & GROUPS ---
    const villaMasterGroup = new THREE.Group();
    villaMasterGroup.position.x = shiftX;
    scene.add(villaMasterGroup);

    villaMasterGroup.add(new THREE.LineSegments(gridGeo, gridMat));
    villaMasterGroup.add(new THREE.LineSegments(frameGeo, frameMat));

    const villaRoot = new THREE.Group();
    villaMasterGroup.add(villaRoot);

    function addBox(
      parent: THREE.Group,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      mat: THREE.Material,
      cast = true,
      receive = true
    ): THREE.Mesh {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
      parent.add(mesh);
      return mesh;
    }

    function addCyl(
      parent: THREE.Group,
      rt: number,
      rb: number,
      h: number,
      segs: number,
      x: number,
      y: number,
      z: number,
      mat: THREE.Material,
      cast = true,
      receive = true
    ): THREE.Mesh {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
      parent.add(mesh);
      return mesh;
    }

    function addGlassWall(
      parent: THREE.Group,
      x1: number,
      z1: number,
      x2: number,
      z2: number,
      yBase: number,
      height: number,
      panels = 3
    ) {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(-dz, dx);

      const g = new THREE.Group();
      g.position.set((x1 + x2) * 0.5, yBase, (z1 + z2) * 0.5);
      g.rotation.y = angle;

      const pane = new THREE.Mesh(new THREE.PlaneGeometry(len, height), M.glass);
      pane.position.set(0, height * 0.5, 0);
      g.add(pane);

      addBox(g, len + 0.06, 0.07, 0.08, 0, 0.035, 0, M.bronze);
      addBox(g, len + 0.06, 0.07, 0.08, 0, height - 0.035, 0, M.bronze);

      for (let i = 0; i <= panels; i++) {
        const mx = -len * 0.5 + (i / panels) * len;
        addBox(g, 0.055, height, 0.08, mx, height * 0.5, 0, M.bronze);
      }
      parent.add(g);
    }

    function addGlassRailing(
      parent: THREE.Group,
      x1: number,
      z1: number,
      x2: number,
      z2: number,
      yBase: number,
      height = 1.05
    ) {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(-dz, dx);

      const g = new THREE.Group();
      g.position.set((x1 + x2) * 0.5, yBase, (z1 + z2) * 0.5);
      g.rotation.y = angle;

      const pane = new THREE.Mesh(new THREE.PlaneGeometry(len, height), M.glassRail);
      pane.position.set(0, height * 0.5, 0);
      g.add(pane);

      addBox(g, len, 0.05, 0.05, 0, 0.025, 0, M.bronze);
      addBox(g, len, 0.025, 0.035, 0, height, 0, M.bronze, false, false);
      parent.add(g);
    }

    function addOliveTree(parent: THREE.Group, x: number, y: number, z: number, scale = 1.0) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.scale.setScalar(scale);

      addCyl(g, 0.07, 0.12, 2.2, 10, 0, 1.1, 0, M.bark);
      const b1 = addCyl(g, 0.04, 0.07, 1.3, 8, 0.25, 2.1, 0.12, M.bark);
      b1.rotation.z = -0.45;
      const b2 = addCyl(g, 0.04, 0.06, 1.1, 8, -0.24, 2.0, -0.15, M.bark);
      b2.rotation.z = 0.42;

      const geo = new THREE.IcosahedronGeometry(1, 2);
      [
        [0.0, 2.85, 0.0, 1.42, 0.56, 1.32, M.foliageLight],
        [0.64, 2.55, 0.34, 0.94, 0.44, 0.9, M.foliageDeep],
        [-0.6, 2.48, -0.26, 1.02, 0.45, 0.94, M.foliageLight],
        [0.14, 3.28, -0.2, 0.92, 0.41, 0.86, M.foliageDeep],
      ].forEach(([px, py, pz, sx, sy, sz, mat]) => {
        const leaf = new THREE.Mesh(geo, mat as THREE.Material);
        leaf.position.set(px as number, py as number, pz as number);
        leaf.scale.set(sx as number, sy as number, sz as number);
        leaf.castShadow = true;
        leaf.receiveShadow = true;
        g.add(leaf);
      });
      parent.add(g);
    }

    function addCypressTree(parent: THREE.Group, x: number, y: number, z: number, scale = 1.0) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.scale.setScalar(scale);

      addCyl(g, 0.05, 0.08, 1.2, 8, 0, 0.6, 0, M.bark);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.62, 3.6, 12), M.foliageDeep);
      cone.position.set(0, 2.45, 0);
      cone.castShadow = true;
      cone.receiveShadow = true;
      g.add(cone);

      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.0, 12), M.foliageLight);
      tip.position.set(0.04, 3.15, 0.03);
      tip.castShadow = true;
      tip.receiveShadow = true;
      g.add(tip);

      parent.add(g);
    }

    function addShrubRow(parent: THREE.Group, x: number, y: number, z: number, count = 4, spreadX = 1.6, spreadZ = 0.5) {
      const geo = new THREE.IcosahedronGeometry(0.35, 1);
      for (let i = 0; i < count; i++) {
        const frac = count > 1 ? i / (count - 1) - 0.5 : 0;
        const m = new THREE.Mesh(geo, i % 2 === 0 ? M.foliageLight : M.foliageDeep);
        m.position.set(
          x + frac * spreadX,
          y + 0.19 + (i % 2) * 0.05,
          z + Math.sin(i * 2.1) * spreadZ * 0.35
        );
        m.scale.set(1.12, 0.7, 1.04);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
      }
    }

    // --- PART 1: PLINTH GROUP ---
    const plinthGroup = new THREE.Group();
    villaRoot.add(plinthGroup);

    addBox(plinthGroup, 21.4, 0.24, 16.4, 0, 0.12, 0, M.travertine);
    addBox(plinthGroup, 20.6, 0.44, 15.6, 0, 0.46, 0, M.travertine);

    for (let i = 0; i < 4; i++) {
      addBox(plinthGroup, 3.4, 0.14, 0.56, -1.6, 0.11 + i * 0.15, 7.9 - i * 0.5, M.concrete);
    }

    addBox(plinthGroup, 7.2, 0.08, 5.0, 5.6, 0.67, 4.3, M.poolBasin, false, true);
    addBox(plinthGroup, 7.4, 0.16, 0.22, 5.6, 0.72, 1.8, M.travertine);
    addBox(plinthGroup, 0.22, 0.16, 5.0, 2.0, 0.72, 4.3, M.travertine);
    addBox(plinthGroup, 7.4, 0.12, 0.14, 5.6, 0.7, 6.8, M.bronze);
    addBox(plinthGroup, 0.14, 0.12, 5.0, 9.2, 0.7, 4.3, M.bronze);

    const waterGeo = new THREE.PlaneGeometry(6.95, 4.75, 24, 16);
    waterGeo.rotateX(-Math.PI / 2);
    const waterBasePos = Float32Array.from(waterGeo.attributes.position.array);
    const waterMesh = new THREE.Mesh(waterGeo, M.water);
    waterMesh.position.set(5.6, 0.75, 4.3);
    plinthGroup.add(waterMesh);

    addBox(plinthGroup, 4.8, 0.42, 2.4, -7.2, 0.89, 5.6, M.concrete);
    addBox(plinthGroup, 4.4, 0.06, 2.0, -7.2, 1.08, 5.6, M.soil, false, true);
    addOliveTree(plinthGroup, -8.3, 1.08, 5.5, 1.02);
    addShrubRow(plinthGroup, -6.2, 1.1, 5.6, 4, 2.0, 0.6);

    addBox(plinthGroup, 3.6, 0.42, 4.2, 7.6, 0.89, -4.6, M.concrete);
    addBox(plinthGroup, 3.2, 0.06, 3.8, 7.6, 1.08, -4.6, M.soil, false, true);
    addOliveTree(plinthGroup, 7.6, 1.08, -4.8, 1.12);
    addCypressTree(plinthGroup, 8.3, 1.08, -3.5, 0.92);

    addBox(plinthGroup, 1.6, 0.36, 7.2, -9.1, 0.86, -1.8, M.concrete);
    addBox(plinthGroup, 1.25, 0.06, 6.8, -9.1, 1.02, -1.8, M.soil, false, true);
    addCypressTree(plinthGroup, -9.1, 1.02, -4.0, 1.05);
    addCypressTree(plinthGroup, -9.1, 1.02, -2.0, 0.92);
    addShrubRow(plinthGroup, -9.1, 1.04, 0.2, 3, 0.25, 1.8);

    // --- PART 2: LEVEL 1 GROUP ---
    const level1Group = new THREE.Group();
    villaRoot.add(level1Group);

    const yFloor = 0.68;
    const slabH = 0.36;
    const yTop = yFloor + slabH;
    const wallH = 3.3;

    addBox(level1Group, 14.4, slabH, 9.6, -1.0, yFloor + slabH * 0.5, -1.2, M.concrete);
    addBox(level1Group, 12.6, 0.05, 8.2, -1.2, yTop + 0.025, -1.4, M.oak, false, true);

    addBox(level1Group, 13.4, wallH, 0.34, -1.1, yTop + wallH * 0.5, -5.65, M.travertine);
    addBox(level1Group, 0.34, wallH, 8.8, -7.75, yTop + wallH * 0.5, -1.4, M.travertine);

    for (let i = 0; i < 20; i++) {
      addBox(level1Group, 0.1, wallH - 0.15, 0.14, -6.2 + i * 0.24, yTop + wallH * 0.5, -5.42, M.oakDark);
    }

    [[-7.6, 3.2], [-1.4, 3.2], [5.4, 3.2], [5.4, -5.5]].forEach(([cx, cz]) => {
      addBox(level1Group, 0.22, wallH, 0.22, cx, yTop + wallH * 0.5, cz, M.bronze);
    });

    addGlassWall(level1Group, -7.55, 3.2, -1.55, 3.2, yTop, wallH, 3);
    addGlassWall(level1Group, 0.4, 3.2, 5.3, 3.2, yTop, wallH, 2);
    addGlassWall(level1Group, 5.4, 3.1, 5.4, -5.4, yTop, wallH, 4);

    const yIn = yTop + 0.05;
    addBox(level1Group, 5.2, 0.03, 3.8, -3.5, yIn + 0.015, -0.8, M.rug, false, true);
    addBox(level1Group, 3.4, 0.36, 1.02, -3.8, yIn + 0.22, -2.2, M.boucle);
    addBox(level1Group, 3.4, 0.42, 0.24, -3.8, yIn + 0.56, -2.6, M.boucle);
    addBox(level1Group, 1.05, 0.36, 2.25, -5.0, yIn + 0.22, -1.0, M.boucle);
    addBox(level1Group, 0.24, 0.42, 2.25, -5.42, yIn + 0.56, -1.0, M.boucle);

    const p1 = addBox(level1Group, 0.42, 0.34, 0.14, -4.8, yIn + 0.56, -2.35, M.terracotta);
    p1.rotation.y = 0.28;
    const p2 = addBox(level1Group, 0.42, 0.34, 0.14, -2.6, yIn + 0.56, -2.35, M.terracotta);
    p2.rotation.y = -0.22;

    addBox(level1Group, 1.55, 0.32, 0.95, -3.3, yIn + 0.16, -0.5, M.marble);
    addCyl(level1Group, 0.09, 0.12, 0.28, 12, -3.0, yIn + 0.46, -0.45, M.bronze);

    addBox(level1Group, 3.1, 0.92, 1.05, 0.9, yIn + 0.46, -2.8, M.travertine);
    addBox(level1Group, 3.18, 0.07, 1.12, 0.9, yIn + 0.94, -2.8, M.marble);

    // Cantilevered oak staircase
    const numTreads = 13;
    const sx0 = 1.4, sx1 = 4.65, sz = -4.65;
    const sy0 = yIn + 0.18, sy1 = yTop + wallH - 0.05;
    for (let t = 0; t < numTreads; t++) {
      const f = t / (numTreads - 1);
      addBox(level1Group, 0.34, 0.085, 1.15, THREE.MathUtils.lerp(sx0, sx1, f), THREE.MathUtils.lerp(sy0, sy1, f), sz, M.oak);
    }
    const spineLen = Math.hypot(sx1 - sx0, sy1 - sy0);
    const spine = addBox(level1Group, spineLen, 0.14, 0.12, (sx0 + sx1) * 0.5, (sy0 + sy1) * 0.5 - 0.1, sz, M.bronze);
    spine.rotation.z = Math.atan2(sy1 - sy0, sx1 - sx0);

    // --- PART 3: LEVEL 2 GROUP ---
    const level2Group = new THREE.Group();
    villaRoot.add(level2Group);

    const yBaseL2 = 4.34;
    const slabHL2 = 0.44;
    const yTopL2 = yBaseL2 + slabHL2;
    const wallHL2 = 3.32;

    addBox(level2Group, 15.8, slabHL2, 10.2, 0.5, yBaseL2 + slabHL2 * 0.5, -0.5, M.travertine);
    addBox(level2Group, 15.4, 0.05, 9.8, 0.5, yBaseL2 - 0.025, -0.5, M.oak, false, true);
    addBox(level2Group, 10.6, 0.05, 8.6, -1.7, yTopL2 + 0.025, -0.9, M.oak, false, true);
    addBox(level2Group, 4.4, 0.05, 9.4, 5.9, yTopL2 + 0.025, -0.5, M.oakDeck, false, true);

    addBox(level2Group, 11.4, wallHL2, 0.34, -1.6, yTopL2 + wallHL2 * 0.5, -5.35, M.plaster);
    addBox(level2Group, 0.34, wallHL2, 9.4, -7.2, yTopL2 + wallHL2 * 0.5, -0.7, M.plaster);
    addBox(level2Group, 0.24, wallHL2 - 0.1, 4.4, -2.5, yTopL2 + wallHL2 * 0.5, -2.8, M.travertine);

    addGlassWall(level2Group, -7.0, 3.85, 3.6, 3.85, yTopL2, wallHL2, 5);
    addGlassWall(level2Group, 3.6, 3.85, 3.6, -5.2, yTopL2, wallHL2, 4);

    for (let i = 0; i < 15; i++) {
      const slat = addBox(level2Group, 0.08, wallHL2 + 0.16, 0.28, -6.8 + i * 0.42, yTopL2 + wallHL2 * 0.5, 4.18, M.oakDark);
      slat.rotation.y = 0.22;
    }

    addGlassRailing(level2Group, 3.65, 4.45, 8.25, 4.45, yTopL2 + 0.05, 1.06);
    addGlassRailing(level2Group, 8.25, 4.45, 8.25, -5.45, yTopL2 + 0.05, 1.06);
    addGlassRailing(level2Group, 8.25, -5.45, 3.9, -5.45, yTopL2 + 0.05, 1.06);

    const yInL2 = yTopL2 + 0.05;
    addBox(level2Group, 3.6, 0.08, 1.25, 0.55, yInL2 + 0.76, 0.4, M.oak);
    addBox(level2Group, 0.12, 0.74, 0.95, -0.85, yInL2 + 0.37, 0.4, M.bronze);
    addBox(level2Group, 0.12, 0.74, 0.95, 1.95, yInL2 + 0.37, 0.4, M.bronze);

    // --- PART 4: ROOF GROUP ---
    const roofGroup = new THREE.Group();
    villaRoot.add(roofGroup);

    const yBaseRoof = 8.1;
    const slabHRoof = 0.4;
    const yDeckRoof = yBaseRoof + slabHRoof;

    addBox(roofGroup, 2.5, slabHRoof, 10.8, -6.45, yBaseRoof + slabHRoof * 0.5, -0.5, M.concrete);
    addBox(roofGroup, 10.9, slabHRoof, 10.8, 3.25, yBaseRoof + slabHRoof * 0.5, -0.5, M.concrete);
    addBox(roofGroup, 3.0, slabHRoof, 3.5, -3.7, yBaseRoof + slabHRoof * 0.5, -4.15, M.concrete);
    addBox(roofGroup, 3.0, slabHRoof, 4.3, -3.7, yBaseRoof + slabHRoof * 0.5, 2.75, M.concrete);

    // Fascia trim
    addBox(roofGroup, 16.48, 0.12, 0.14, 0.5, yBaseRoof + slabHRoof - 0.06, 4.9, M.bronze);
    addBox(roofGroup, 16.48, 0.12, 0.14, 0.5, yBaseRoof + slabHRoof - 0.06, -5.9, M.bronze);

    // Skylight pane
    const skylightPane = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), M.glass);
    skylightPane.rotation.x = -Math.PI / 2;
    skylightPane.position.set(-3.7, yDeckRoof + 0.12, -0.9);
    roofGroup.add(skylightPane);

    // Pergola canopy
    const pH = 2.75;
    const pY = yDeckRoof + 0.06;
    const pX0 = -1.2, pX1 = 7.4, pZ0 = -4.2, pZ1 = 2.2;
    const pW = pX1 - pX0, pD = pZ1 - pZ0;
    const pCX = (pX0 + pX1) * 0.5, pCZ = (pZ0 + pZ1) * 0.5;

    [[pX0, pZ0], [pX1, pZ0], [pX0, pZ1], [pX1, pZ1]].forEach(([cx, cz]) => {
      addBox(roofGroup, 0.18, pH, 0.18, cx, pY + pH * 0.5, cz, M.bronze);
    });
    addBox(roofGroup, pW + 0.22, 0.22, 0.18, pCX, pY + pH, pZ0, M.bronze);
    addBox(roofGroup, pW + 0.22, 0.22, 0.18, pCX, pY + pH, pZ1, M.bronze);

    for (let i = 1; i <= 18; i++) {
      const sx = pX0 + (i / 19) * pW;
      addBox(roofGroup, 0.09, 0.16, pD - 0.16, sx, pY + pH, pCZ, M.oak);
    }

    addBox(roofGroup, 3.6, 0.34, 0.95, pCX, pY + 0.22, -2.5, M.boucle);
    addCyl(roofGroup, 0.68, 0.56, 0.36, 24, pCX, pY + 0.18, -0.5, M.concrete);
    addCyl(roofGroup, 0.48, 0.44, 0.08, 20, pCX, pY + 0.34, -0.5, M.ember, false, false);

    // --- ALIGNMENT GUIDES ---
    const guideGroup = new THREE.Group();
    villaRoot.add(guideGroup);

    const corners = [
      [-7.55, -5.6],
      [5.4, -5.6],
      [-7.55, 3.2],
      [5.4, 3.2],
    ];

    interface GuideLineRecord {
      line: THREE.Line;
      x: number;
      z: number;
    }
    const guideLines: GuideLineRecord[] = [];

    corners.forEach(([x, z]) => {
      const pts = [new THREE.Vector3(x, 0.68, z), new THREE.Vector3(x, 9.0, z)];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineDashedMaterial({
        color: 0x9f7947,
        dashSize: 0.32,
        gapSize: 0.24,
        transparent: true,
        opacity: 0,
      });
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      guideGroup.add(line);
      guideLines.push({ line, x, z });
    });

    // 2D Callout projection anchors
    const calloutAnchors = [
      { id: "plinth", group: plinthGroup, localPos: new THREE.Vector3(9.4, 0.9, 5.2) },
      { id: "level1", group: level1Group, localPos: new THREE.Vector3(5.6, 2.7, 3.2) },
      { id: "level2", group: level2Group, localPos: new THREE.Vector3(8.3, 6.4, 3.8) },
      { id: "roof", group: roofGroup, localPos: new THREE.Vector3(8.5, 9.6, 4.5) },
    ];
    const tempVec3 = new THREE.Vector3();

    // --- ANIMATION LOOP ---
    let animationFrameId: number;
    let cycleTime = 0.4;
    const clock = new THREE.Clock();

    function render() {
      animationFrameId = requestAnimationFrame(render);

      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      if (isPlayingRef.current) {
        cycleTime = (cycleTime + dt) % TOTAL_CYCLE;
      }

      const t = cycleTime;
      const t1 = CYCLE.HOLD_ASSEMBLED;
      const t2 = t1 + CYCLE.SEPARATE;
      const t3 = t2 + CYCLE.HOLD_SEPARATED;

      let fractions = { level1: 0, level2: 0, roof: 0 };
      let overallSep = 0;
      let label = "ASSEMBLED";

      if (t < t1) {
        fractions = { level1: 0, level2: 0, roof: 0 };
        overallSep = 0;
        label = "ASSEMBLED";
      } else if (t < t2) {
        const p = (t - t1) / CYCLE.SEPARATE;
        fractions = computeFloorFractions(p, false);
        overallSep = (fractions.level1 + fractions.level2 + fractions.roof) / 3;
        label = "SEPARATING";
      } else if (t < t3) {
        fractions = { level1: 1, level2: 1, roof: 1 };
        overallSep = 1;
        label = "EXPLODED VIEW";
      } else {
        const p = (t - t3) / CYCLE.JOIN;
        fractions = computeFloorFractions(p, true);
        overallSep = (fractions.level1 + fractions.level2 + fractions.roof) / 3;
        label = "JOINING";
      }

      setPhaseStatus(`${label} · 1:50`);

      // Elevate floors
      plinthGroup.position.y = 0;
      level1Group.position.y = fractions.level1 * MAX_LIFT.level1;
      level2Group.position.y = fractions.level2 * MAX_LIFT.level2;
      roofGroup.position.y = fractions.roof * MAX_LIFT.roof;

      // Guides
      const guideAlpha = THREE.MathUtils.clamp((overallSep - 0.03) / 0.28, 0, 0.68);
      guideGroup.visible = guideAlpha > 0.008;
      if (guideGroup.visible) {
        const topY = 8.4 + roofGroup.position.y;
        for (let i = 0; i < guideLines.length; i++) {
          const g = guideLines[i];
          const posAttr = g.line.geometry.attributes.position as THREE.BufferAttribute;
          posAttr.setXYZ(0, g.x, 0.68, g.z);
          posAttr.setXYZ(1, g.x, topY, g.z);
          posAttr.needsUpdate = true;
          g.line.computeLineDistances();
          (g.line.material as THREE.LineDashedMaterial).opacity = guideAlpha;
        }
      }

      // Water ripples
      if (waterMesh && waterBasePos) {
        const pos = waterMesh.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const bx = waterBasePos[i * 3];
          const bz = waterBasePos[i * 3 + 2];
          pos.setY(
            i,
            Math.sin(bx * 1.45 + elapsed * 1.55) * 0.015 +
              Math.cos(bz * 1.75 - elapsed * 1.2) * 0.013
          );
        }
        pos.needsUpdate = true;
        waterMesh.geometry.computeVertexNormals();
      }

      // Update 2D Callouts projected positions
      const w = container ? container.clientWidth : 1200;
      const h = container ? container.clientHeight : 750;
      const showLabels = overallSep > 0.35;

      const nextCallouts = calloutAnchors.map((item) => {
        tempVec3.copy(item.localPos);
        item.group.localToWorld(tempVec3);
        tempVec3.project(camera);

        const isBehind = tempVec3.z > 1;
        const sx = (tempVec3.x * 0.5 + 0.5) * w;
        const sy = (-tempVec3.y * 0.5 + 0.5) * h;

        return {
          id: item.id,
          num:
            item.id === "plinth"
              ? "01"
              : item.id === "level1"
              ? "02"
              : item.id === "level2"
              ? "03"
              : "04",
          name:
            item.id === "plinth"
              ? "PLINTH & POOL"
              : item.id === "level1"
              ? "LIVING PAVILION"
              : item.id === "level2"
              ? "CANTILEVER STUDIO"
              : "ROOF CANOPY",
          x: sx,
          y: sy,
          visible: showLabels && !isBehind,
        };
      });

      setCallouts(nextCallouts);

      controls.update();
      renderer.render(scene, camera);
    }

    render();

    // Resize handling via ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);

      const isD = nw > 1024;
      const sX = isD ? 7.8 : nw > 768 ? 4.5 : 0.0;
      villaMasterGroup.position.x = sX;
      controls.target.set(sX, 4.8, 0.0);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
    >
      {/* Three.js 3D Canvas */}
      <canvas ref={canvasRef} className="block h-full w-full outline-none opacity-80 sm:opacity-95" />

      {/* Solid/Frosted Left Architectural Backdrop for 100% Typography Contrast */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `
            linear-gradient(
              90deg,
              #F2F0EB 0%,
              #F2F0EB 28%,
              rgba(242, 240, 235, 0.7) 38%,
              rgba(242, 240, 235, 0.1) 48%,
              transparent 56%
            ),
            linear-gradient(
              180deg,
              #F2F0EB 0%,
              transparent 12%,
              transparent 88%,
              #F2F0EB 100%
            )
          `,
        }}
      />

      {/* 2D Projected Floating Architectural Floor Callouts */}
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {callouts.map((c) => (
          <div
            key={c.id}
            style={{
              transform: `translate3d(${c.x}px, ${c.y - 12}px, 0)`,
              opacity: c.visible ? 1 : 0,
            }}
            className="absolute top-0 left-0 flex items-center transition-opacity duration-300 will-change-transform"
          >
            <span className="h-2 w-2 rounded-full bg-[#B68A4A] shadow-[0_0_0_3px_rgba(182,138,74,0.25)]" />
            <span className="h-[1px] w-6 bg-[#B68A4A]/70" />
            <div className="flex items-center gap-1.5 rounded-full border border-stone-800/10 bg-[#FCFBF8]/90 px-2.5 py-1 font-mono text-[9px] font-medium tracking-widest text-[#23211E] uppercase shadow-lg backdrop-blur-md">
              <span className="font-bold text-[#B68A4A]">{c.num}</span>
              <span>— {c.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top-Right Ambient Studio Assembly Status Badge */}
      <div className="absolute top-6 right-6 z-20 hidden items-center gap-3 sm:flex">
        <div className="flex items-center gap-2 rounded-full border border-stone-800/10 bg-white/70 px-3.5 py-1.5 font-mono text-[10px] tracking-wider text-stone-700 uppercase shadow-sm backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[#B68A4A] animate-pulse" />
          <span>VILLA LUMIÈRE // {phaseStatus}</span>
        </div>
      </div>
    </div>
  );
}
