"use client";

import React, { useRef, useEffect } from "react";

export function FooterCosmicCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let mouseX = -1000;
    let mouseY = -1000;
    let isMouseOver = false;

    const parent = canvas.parentElement;

    const resize = () => {
      if (!canvas || !parent) return;
      width = canvas.width = parent.clientWidth;
      height = canvas.height = parent.clientHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isMouseOver = true;
    };

    const onMouseLeave = () => {
      isMouseOver = false;
      mouseX = -1000;
      mouseY = -1000;
    };

    if (parent) {
      parent.addEventListener("mousemove", onMouseMove);
      parent.addEventListener("mouseleave", onMouseLeave);
    }

    // -------------------------------------------------------------
    // 3D GLASS BUBBLE / SPHERE CLASS
    // -------------------------------------------------------------
    class Bubble3D {
      x = 0;
      y = 0;
      radius = 0;
      depth = 1;
      vy = 0;
      vx = 0;
      wobbleSpeed = 0.02;
      angle = 0;
      opacity = 0.4;

      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * (width || 1200);
        this.y = initial ? Math.random() * (height || 500) : (height || 500) + 30;
        this.radius = 14 + Math.random() * 38;
        this.depth = 0.35 + Math.random() * 0.65;
        this.vy = -(0.35 + Math.random() * 0.75) * this.depth;
        this.vx = (Math.random() - 0.5) * 0.3 * this.depth;
        this.wobbleSpeed = 0.015 + Math.random() * 0.03;
        this.angle = Math.random() * Math.PI * 2;
        this.opacity = 0.28 + Math.random() * 0.45;
      }

      update() {
        this.angle += this.wobbleSpeed;
        this.y += this.vy;
        this.x += this.vx + Math.sin(this.angle) * 0.35;

        // Interactive mouse repelling
        if (isMouseOver) {
          const dx = this.x - mouseX;
          const dy = this.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 150;
          if (dist < maxDist && dist > 1) {
            const force = (1 - dist / maxDist) * 2.8;
            this.x += (dx / dist) * force;
            this.y += (dy / dist) * force;
          }
        }

        if (this.y + this.radius < -20) {
          this.reset(false);
        }
      }

      draw() {
        if (!ctx) return;
        const r = this.radius * (0.8 + 0.2 * this.depth);
        ctx.save();
        ctx.translate(this.x, this.y);

        // Ambient outer gold-amber glow
        const glowRad = r * 1.5;
        const glowGrad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, glowRad);
        glowGrad.addColorStop(0, `rgba(217, 119, 36, ${0.16 * this.opacity})`);
        glowGrad.addColorStop(0.6, `rgba(182, 138, 74, ${0.07 * this.opacity})`);
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // 3D Glass Bubble Body (Refractive Translucent Gradient)
        const bodyGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
        bodyGrad.addColorStop(0, `rgba(255, 248, 235, ${0.05 * this.opacity})`);
        bodyGrad.addColorStop(0.68, `rgba(184, 137, 74, ${0.09 * this.opacity})`);
        bodyGrad.addColorStop(0.92, `rgba(217, 119, 36, ${0.28 * this.opacity})`);
        bodyGrad.addColorStop(1, `rgba(255, 255, 255, ${0.65 * this.opacity})`);

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // 3D Rim Stroke (Architectural Iridescent Rim)
        ctx.strokeStyle = `rgba(245, 215, 160, ${0.45 * this.opacity})`;
        ctx.lineWidth = 1.2 * this.depth;
        ctx.stroke();

        // Primary 3D Specular Curved Highlight
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.35, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.75 * this.opacity})`;
        ctx.fill();

        // Secondary bottom soft rim reflection
        ctx.beginPath();
        ctx.ellipse(r * 0.3, r * 0.35, r * 0.22, r * 0.09, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${0.4 * this.opacity})`;
        ctx.fill();

        ctx.restore();
      }
    }

    // -------------------------------------------------------------
    // COSMIC SPACE STAR SYSTEM
    // -------------------------------------------------------------
    class CosmicStar {
      x = 0;
      y = 0;
      z = 1;
      size = 1;
      alpha = 0.5;
      twinkleSpeed = 0.02;
      twinklePhase = 0;
      vx = 0;
      vy = 0;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * (width || 1200);
        this.y = Math.random() * (height || 500);
        this.z = 0.25 + Math.random() * 0.75;
        this.size = (0.7 + Math.random() * 1.6) * this.z;
        this.alpha = 0.2 + Math.random() * 0.75;
        this.twinkleSpeed = 0.015 + Math.random() * 0.035;
        this.twinklePhase = Math.random() * Math.PI * 2;
        this.vx = (Math.random() - 0.5) * 0.12 * this.z;
        this.vy = -(0.08 + Math.random() * 0.2) * this.z;
      }

      update() {
        this.twinklePhase += this.twinkleSpeed;
        this.x += this.vx;
        this.y += this.vy;

        if (isMouseOver) {
          const dx = (mouseX - width / 2) * 0.00025 * this.z;
          const dy = (mouseY - height / 2) * 0.00025 * this.z;
          this.x -= dx;
          this.y -= dy;
        }

        if (this.y < -10) this.y = (height || 500) + 10;
        if (this.x < -10) this.x = (width || 1200) + 10;
        if (this.x > (width || 1200) + 10) this.x = -10;
      }

      draw() {
        if (!ctx) return;
        const curAlpha = Math.max(0.1, (Math.sin(this.twinklePhase) * 0.5 + 0.5) * this.alpha);
        ctx.save();
        ctx.fillStyle = `rgba(250, 240, 220, ${curAlpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 4-Point Starlight Flare for prominent stars
        if (this.size > 1.25 && curAlpha > 0.55) {
          ctx.strokeStyle = `rgba(245, 180, 80, ${curAlpha * 0.38})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(this.x - this.size * 2.8, this.y);
          ctx.lineTo(this.x + this.size * 2.8, this.y);
          ctx.moveTo(this.x, this.y - this.size * 2.8);
          ctx.lineTo(this.x, this.y + this.size * 2.8);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // -------------------------------------------------------------
    // COSMIC NEBULA CLOUD
    // -------------------------------------------------------------
    class CosmicNebulaCloud {
      x = 0;
      y = 0;
      radius = 120;
      vx = 0;
      vy = 0;
      alpha = 0.05;
      isGold = true;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * (width || 1200);
        this.y = Math.random() * (height || 500);
        this.radius = 90 + Math.random() * 160;
        this.vx = (Math.random() - 0.5) * 0.1;
        this.vy = (Math.random() - 0.5) * 0.06;
        this.alpha = 0.035 + Math.random() * 0.065;
        this.isGold = Math.random() > 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -this.radius) this.x = (width || 1200) + this.radius;
        if (this.x > (width || 1200) + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = (height || 500) + this.radius;
        if (this.y > (height || 500) + this.radius) this.y = -this.radius;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        if (this.isGold) {
          grad.addColorStop(0, `rgba(182, 138, 74, ${this.alpha})`);
          grad.addColorStop(0.6, `rgba(200, 98, 30, ${this.alpha * 0.4})`);
          grad.addColorStop(1, "rgba(0,0,0,0)");
        } else {
          grad.addColorStop(0, `rgba(217, 119, 36, ${this.alpha})`);
          grad.addColorStop(0.7, `rgba(140, 45, 15, ${this.alpha * 0.3})`);
          grad.addColorStop(1, "rgba(0,0,0,0)");
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const bubbles = Array.from({ length: 22 }, () => new Bubble3D());
    const stars = Array.from({ length: 80 }, () => new CosmicStar());
    const clouds = Array.from({ length: 6 }, () => new CosmicNebulaCloud());

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Nebula Clouds
      clouds.forEach((c) => {
        c.update();
        c.draw();
      });

      // 2. Draw Stars
      stars.forEach((s) => {
        s.update();
        s.draw();
      });

      // 3. Draw 3D Glass Bubbles / Spheres
      bubbles.forEach((b) => {
        b.update();
        b.draw();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      if (parent) {
        parent.removeEventListener("mousemove", onMouseMove);
        parent.removeEventListener("mouseleave", onMouseLeave);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
