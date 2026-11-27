"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function ArchitecturalGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const mount = mountRef.current;
    if (!container || !mount) return;

    let animationFrameId = 0;
    let isVisible = false;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.8);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.className =
        "w-full h-full cursor-grab active:cursor-grabbing drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)]";
      mount.appendChild(renderer.domElement);
    } catch (err) {
      console.warn("WebGL initialization failed, using high-definition video fallback:", err);
      setHasWebGL(false);
      return;
    }

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xc6a779, 1.6);
    keyLight.position.set(5, 4, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.0);
    rimLight.position.set(-6, -4, -4);
    scene.add(rimLight);

    // --- MAIN GLOBE GROUP ---
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // --- 1. CORE PLANETARY VIDEO SPHERE ---
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "none";
    let videoSourceAttached = false;

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    const sphereGeo = new THREE.SphereGeometry(2.32, 48, 48);
    const sphereMat = new THREE.MeshBasicMaterial({
      map: videoTexture,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
    });
    const globeSphere = new THREE.Mesh(sphereGeo, sphereMat);
    rootGroup.add(globeSphere);

    // --- 2. ARCHITECTURAL GEODESIC WIREFRAME STRUCTURAL CAGE ---
    const geodesicGeo = new THREE.IcosahedronGeometry(2.55, 2);
    const wireframeGeo = new THREE.WireframeGeometry(geodesicGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0xc6a779,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
    });
    const geodesicMesh = new THREE.LineSegments(wireframeGeo, wireMat);
    rootGroup.add(geodesicMesh);

    // --- 3. CONCENTRIC 3D ARMILLARY GIMBAL RINGS ---
    // Equatorial Datum Ring
    const eqRingGeo = new THREE.RingGeometry(2.88, 2.92, 96);
    const eqRingMat = new THREE.MeshBasicMaterial({
      color: 0xc6a779,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const eqRing = new THREE.Mesh(eqRingGeo, eqRingMat);
    eqRing.rotation.x = Math.PI / 2;
    rootGroup.add(eqRing);

    // Prime Meridian Axial Ring
    const meridianRingGeo = new THREE.RingGeometry(2.98, 3.02, 96);
    const meridianRingMat = new THREE.MeshBasicMaterial({
      color: 0xd97724,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.42,
    });
    const meridianRing = new THREE.Mesh(meridianRingGeo, meridianRingMat);
    meridianRing.rotation.y = Math.PI / 2;
    rootGroup.add(meridianRing);

    // Outer Geodetic Azimuth Ring (Tilted at 23.4° Earth Obliquity)
    const azimuthRingGeo = new THREE.RingGeometry(3.14, 3.17, 96);
    const azimuthRingMat = new THREE.MeshBasicMaterial({
      color: 0xb68a4a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const azimuthRing = new THREE.Mesh(azimuthRingGeo, azimuthRingMat);
    azimuthRing.rotation.z = (23.4 * Math.PI) / 180;
    rootGroup.add(azimuthRing);

    // --- 4. DEGREE TICK MARKS & COMPASS NODES ON OUTER RING ---
    const nodesGroup = new THREE.Group();
    const nodeGeo = new THREE.SphereGeometry(0.035, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const x = Math.cos(angle) * 3.155;
      const y = Math.sin(angle) * 3.155;
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(x, y, 0);
      nodesGroup.add(node);
    }
    azimuthRing.add(nodesGroup);

    // --- 5. NAGPUR ATELIER ARCHITECTURAL BEACON (21.1458° N, 79.0882° E) ---
    const r = 2.36;
    const lat = 21.1458;
    const lon = 79.0882;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const beaconX = -r * Math.sin(phi) * Math.cos(theta);
    const beaconZ = r * Math.sin(phi) * Math.sin(theta);
    const beaconY = r * Math.cos(phi);

    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(beaconX, beaconY, beaconZ);

    // Glowing core point
    const beaconDotGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const beaconDotMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const beaconDot = new THREE.Mesh(beaconDotGeo, beaconDotMat);
    beaconGroup.add(beaconDot);

    // Radial architectural datum needle extending from studio to outer rings
    const needlePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(beaconX * 0.35, beaconY * 0.35, beaconZ * 0.35),
    ];
    const needleGeo = new THREE.BufferGeometry().setFromPoints(needlePoints);
    const needleMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.8,
    });
    const needleLine = new THREE.Line(needleGeo, needleMat);
    beaconGroup.add(needleLine);

    // Pulsing beacon ring
    const beaconRingGeo = new THREE.RingGeometry(0.12, 0.16, 32);
    const beaconRingMat = new THREE.MeshBasicMaterial({
      color: 0xd97724,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const beaconRing = new THREE.Mesh(beaconRingGeo, beaconRingMat);
    beaconRing.lookAt(beaconX * 2, beaconY * 2, beaconZ * 2);
    beaconGroup.add(beaconRing);

    globeSphere.add(beaconGroup);

    // --- MOUSE PARALLAX TRACKING ---
    let targetRotationX = 0.2;
    let targetRotationY = -0.3;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top) / rect.height - 0.5;

      targetRotationX = 0.2 + mouseY * 0.7;
      targetRotationY = -0.3 + mouseX * 0.85;
    };

    const handleMouseLeave = () => {
      targetRotationX = 0.2;
      targetRotationY = -0.3;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    // --- RESIZE OBSERVER ---
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 500;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // --- INTERSECTION OBSERVER FOR LOW POWER ---
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const nextVisible = entries[0].isIntersecting;
        if (nextVisible === isVisible) return;
        isVisible = nextVisible;
        if (isVisible) {
          if (!videoSourceAttached) {
            video.src = "/earth-globe.mp4";
            videoSourceAttached = true;
          }
          if (video.paused) {
            video.play().catch(() => {});
          }
          if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animate);
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
          }
        }
      },
      { rootMargin: "200px 0px", threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    // --- ANIMATION LOOP ---
    let clock = 0;
    const animate = () => {
      if (!isVisible) {
        animationFrameId = 0;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);

      clock += 0.016;

      // Autonomous planetary rotation
      globeSphere.rotation.y += 0.0022;

      // Geodesic wireframe structural rotation
      geodesicMesh.rotation.y += 0.0016;
      geodesicMesh.rotation.x += 0.0006;

      // Armillary rings counter-rotation for rich kinetic depth
      eqRing.rotation.z += 0.0012;
      meridianRing.rotation.z -= 0.0014;
      azimuthRing.rotation.z += 0.0008;

      // Beacon ring pulsating animation
      const pulseScale = 1 + Math.sin(clock * 3.5) * 0.35;
      beaconRing.scale.set(pulseScale, pulseScale, 1);
      beaconRingMat.opacity = 0.4 + (Math.sin(clock * 3.5) + 1) * 0.25;

      // Inertial damping toward mouse position
      rootGroup.rotation.x = THREE.MathUtils.lerp(
        rootGroup.rotation.x,
        targetRotationX,
        0.05
      );
      rootGroup.rotation.y = THREE.MathUtils.lerp(
        rootGroup.rotation.y,
        targetRotationY,
        0.05
      );

      renderer.render(scene, camera);
    };

    // Render one initial frame so canvas is ready when scrolled into view
    renderer.render(scene, camera);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      video.pause();
      video.removeAttribute("src");
      video.load();

      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      videoTexture.dispose();
      geodesicGeo.dispose();
      wireframeGeo.dispose();
      wireMat.dispose();
      eqRingGeo.dispose();
      eqRingMat.dispose();
      meridianRingGeo.dispose();
      meridianRingMat.dispose();
      azimuthRingGeo.dispose();
      azimuthRingMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      beaconDotGeo.dispose();
      beaconDotMat.dispose();
      beaconRingGeo.dispose();
      beaconRingMat.dispose();
      needleGeo.dispose();
      needleMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full aspect-square max-w-[540px] lg:max-w-[620px] mx-auto flex items-center justify-center select-none"
    >
      {/* 3D WebGL Canvas Stage */}
      {hasWebGL ? (
        <div
          ref={mountRef}
          className="w-full h-full flex items-center justify-center"
          aria-label="3D Architectural Armillary Planetary Globe"
        />
      ) : (
        /* Video Fallback in case WebGL is disabled or context is unavailable */
        <div className="relative w-[85%] h-[85%] rounded-full overflow-hidden border border-[#C6A779]/30">
          <video
            autoPlay
            loop
            muted
            playsInline
            src="/earth-globe.mp4"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Radial Soft Ambient Vignette */}
      <div className="absolute inset-0 pointer-events-none rounded-full bg-[radial-gradient(circle_at_center,transparent_45%,#111111_78%)]" />

      {/* Architectural Telemetry HUD Overlays */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A779]/70">
        {/* Top Header Telemetry */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97724] animate-ping" />
            <span className="text-white/80">ARCHEON GLOBAL ATELIER</span>
          </div>
          <span className="text-white/50">21.1458° N · 79.0882° E</span>
        </div>

        {/* Center Target Reticle Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-28 h-28 border border-[#C6A779]/20 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 rounded-full border border-[#D97724]/60" />
          <div className="absolute w-full h-[0.5px] bg-[#C6A779]/15" />
          <div className="absolute h-full w-[0.5px] bg-[#C6A779]/15" />
        </div>

        {/* Bottom Telemetry & Coordinate Ticks */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/40 text-[8px]">GEODESIC DATUM // 1:50</p>
            <p className="text-white/70">NAGPUR SANCTUARY HUB</p>
          </div>
          <div className="text-right">
            <p className="text-[#D97724] text-[8.5px]">ELEV: +310M ASL</p>
            <p className="text-white/40 text-[8px]">AXONOMETRIC AZIMUTH: 315°</p>
          </div>
        </div>
      </div>
    </div>
  );
}
