"use client";

import React, { useEffect, useRef, useState } from "react";

// Architectural Color Palette for Sleek Magnetic Cursors (NO LABELS)
const PALETTE = [
  "#F59E0B", // Solar Amber
  "#06B6D4", // Electric Cyan
  "#EC4899", // Neon Magenta
  "#10B981", // Emerald
  "#FBBF24", // Warm Gold
  "#38BDF8", // Sky Blue
  "#A855F7", // Royal Violet
  "#E2E8F0", // Platinum White
  "#D97724", // Terracotta Bronze
];

const CURSOR_COUNT = 20;

export function ArchitecturalCursor() {
  const cursorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const coreDotRef = useRef<HTMLDivElement>(null);
  const shockwaveRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    let mouseX = -300;
    let mouseY = -300;
    let coreX = -300;
    let coreY = -300;
    let isInitialized = false;
    let isClicking = false;
    let isHoveringInteractive = false;
    let rafId: number;

    // Physics state for all 20 cursors
    const particles = Array.from({ length: CURSOR_COUNT }).map((_, i) => {
      let ringRadius = 40;
      let baseSpeed = 0.0048;
      let dir = 1;

      if (i < 5) {
        // Ring 1 (Inner): 5 cursors at r = 38px
        ringRadius = 38;
        baseSpeed = 0.0055;
        dir = 1;
      } else if (i < 12) {
        // Ring 2 (Middle, Counter-rotating): 7 cursors at r = 72px
        ringRadius = 72;
        baseSpeed = 0.0036;
        dir = -1;
      } else {
        // Ring 3 (Outer): 8 cursors at r = 110px
        ringRadius = 110;
        baseSpeed = 0.0025;
        dir = 1;
      }

      const angle = (i / CURSOR_COUNT) * Math.PI * 2;

      return {
        x: -300,
        y: -300,
        vx: 0,
        vy: 0,
        ringRadius,
        baseRadius: ringRadius,
        baseSpeed,
        direction: dir,
        angle,
        mass: 1.0 + (i % 4) * 0.15,
      };
    });

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isInitialized) {
        isInitialized = true;
        coreX = mouseX;
        coreY = mouseY;
        particles.forEach((p) => {
          p.x = mouseX + Math.cos(p.angle) * p.ringRadius;
          p.y = mouseY + Math.sin(p.angle) * p.ringRadius;
        });
        setVisible(true);
      }

      // Check for interactive targets (buttons, links)
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          "button, a, input, select, textarea, [role='button'], [data-cursor-interactive]"
        );
        isHoveringInteractive = Boolean(interactive);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isClicking = true;

      // Slow shockwave pulse
      if (shockwaveRef.current) {
        shockwaveRef.current.style.left = `${e.clientX}px`;
        shockwaveRef.current.style.top = `${e.clientY}px`;
        shockwaveRef.current.classList.remove("animate-ping");
        void shockwaveRef.current.offsetWidth;
        shockwaveRef.current.classList.add("animate-ping");
      }

      // Impulse pushes cursors gently outward
      particles.forEach((p) => {
        const dx = p.x - e.clientX;
        const dy = p.y - e.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const impulse = 14 / (dist * 0.05 + 1);
        p.vx += (dx / dist) * impulse;
        p.vy += (dy / dist) * impulse;
      });
    };

    const handleMouseUp = () => {
      isClicking = false;
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const handleMouseEnter = () => {
      setVisible(true);
    };

    // Main 60 FPS Physics Loop
    const render = () => {
      if (isInitialized) {
        // 1. Core magnetic anchor steadily tracks the user mouse pointer
        coreX += (mouseX - coreX) * 0.07;
        coreY += (mouseY - coreY) * 0.07;

        // Position central pip
        if (coreDotRef.current) {
          coreDotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        }

        // Target radius compression factor when hovering interactive element
        const radiusFactor = isClicking ? 0.75 : isHoveringInteractive ? 0.82 : 1.0;

        // 2. Update each orbital cursor
        particles.forEach((p, idx) => {
          // Slow orbital advance
          p.angle += p.baseSpeed * p.direction;

          // Smooth radius interpolation
          p.ringRadius += (p.baseRadius * radiusFactor - p.ringRadius) * 0.08;

          // Desired magnetic target around mouse
          const desiredX = coreX + Math.cos(p.angle) * p.ringRadius;
          const desiredY = coreY + Math.sin(p.angle) * p.ringRadius;

          // Soft magnetic spring force towards orbit position
          const dx = desiredX - p.x;
          const dy = desiredY - p.y;
          const magnetK = 0.04;

          p.vx += dx * (magnetK / p.mass);
          p.vy += dy * (magnetK / p.mass);

          // Gentle inter-cursor repulsion (prevents clumping)
          for (let j = idx + 1; j < CURSOR_COUNT; j++) {
            const other = particles[j];
            const rx = p.x - other.x;
            const ry = p.y - other.y;
            const dSq = rx * rx + ry * ry;
            if (dSq < 450 && dSq > 0.01) {
              const dist = Math.sqrt(dSq);
              const rep = (21 - dist) * 0.016;
              p.vx += (rx / dist) * rep;
              p.vy += (ry / dist) * rep;
              other.vx -= (rx / dist) * rep;
              other.vy -= (ry / dist) * rep;
            }
          }

          // Viscous air drag for calm, slow, graceful drift
          p.vx *= 0.925;
          p.vy *= 0.925;

          // Integrate position
          p.x += p.vx;
          p.y += p.vy;

          // Align orientation tangentially along orbital path
          const tangentAngle =
            (p.angle + (p.direction > 0 ? Math.PI / 2 : -Math.PI / 2)) * (180 / Math.PI);
          const rot = tangentAngle + 135;

          const el = cursorRefs.current[idx];
          if (el) {
            el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${rot}deg)`;
          }
        });
      }

      rafId = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    document.addEventListener("mouseenter", handleMouseEnter, { passive: true });

    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[999999] overflow-hidden transition-opacity duration-300 select-none ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* 20 Pure Sleek Colored Magnetic Cursors (NO LABELS) */}
      {Array.from({ length: CURSOR_COUNT }).map((_, idx) => (
        <div
          key={`magnetic-cursor-${idx}`}
          ref={(el) => {
            cursorRefs.current[idx] = el;
          }}
          className="fixed top-0 left-0 pointer-events-none will-change-transform z-50"
          style={{
            transform: "translate3d(-300px, -300px, 0)",
            transformOrigin: "0 0",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.85))" }}
          >
            <path
              d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
              fill={PALETTE[idx % PALETTE.length]}
              stroke="#000000"
              strokeWidth="1.1"
            />
          </svg>
        </div>
      ))}

      {/* Primary CAD Center Dot (User mouse position) */}
      <div
        ref={coreDotRef}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none will-change-transform z-10"
        style={{ transform: "translate3d(-300px, -300px, 0)" }}
      >
        <div className="h-1.5 w-1.5 rounded-full bg-[#D97724] shadow-[0_0_6px_rgba(217,119,36,0.9)]" />
      </div>

      {/* Shockwave Pulse Indicator on Click */}
      <div
        ref={shockwaveRef}
        className="fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none h-16 w-16 rounded-full border border-[#D97724]/40 opacity-0"
      />
    </div>
  );
}
