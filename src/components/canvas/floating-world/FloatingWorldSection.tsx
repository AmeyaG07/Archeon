"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  Suspense,
} from "react";
import { Canvas } from "@react-three/fiber";
import { FloatingArchitecturalWorld } from "./FloatingArchitecturalWorld";
import { WorldCameraRig } from "./WorldCameraRig";
import { ArrowUpRight } from "lucide-react";

const STAGE_LABELS: Record<number, { title: string; subtitle: string }> = {
  0: { title: "01. Form", subtitle: "Massing and volume" },
  1: { title: "02. Structure", subtitle: "Shell and louver choreography" },
  2: {
    title: "03. Interior & Materiality",
    subtitle: "Space, light and finish",
  },
  3: { title: "04. Landscape", subtitle: "Terrace, water and planting" },
};

export interface FloatingWorldSectionProps {
  onOpenConsultation: () => void;
}

export function FloatingWorldSection({
  onOpenConsultation,
}: FloatingWorldSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const [activeStage, setActiveStage] = useState<0 | 1 | 2 | 3>(0);
  const lastStageRef = useRef<0 | 1 | 2 | 3>(0);
  const prefersReducedRef = useRef(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const isTouchRef = useRef(false);

  const computeProgress = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) return 0;
    const raw = -rect.top / scrollable;
    return Math.max(0, Math.min(1, raw));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    isTouchRef.current = "ontouchstart" in window;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const setReduced = () => {
      prefersReducedRef.current = mq.matches;
      setPrefersReduced(mq.matches);
    };
    setReduced();
    mq.addEventListener("change", setReduced);
    return () => {
      mq.removeEventListener("change", setReduced);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let rafId: number;
    function tick() {
      scrollProgressRef.current = computeProgress();
      if (progressTextRef.current) {
        progressTextRef.current.textContent = `${Math.round(
          scrollProgressRef.current * 100
        )}%`;
      }
      let stage: 0 | 1 | 2 | 3 = 0;
      if (scrollProgressRef.current >= 0.75) stage = 3;
      else if (scrollProgressRef.current >= 0.55) stage = 2;
      else if (scrollProgressRef.current >= 0.25) stage = 1;
      if (stage !== lastStageRef.current) {
        lastStageRef.current = stage;
        setActiveStage(stage);
      }
      rafId = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(rafId);
  }, [computeProgress]);

  const exploreProjects = useCallback(() => {
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
  }, []);
  return (
    <section
      id="home"
      className="relative w-full overflow-hidden bg-[#F2F0EB] text-[#111111]"
    >
      <div ref={sectionRef} className="relative w-full h-[300vh] overflow-x-hidden">
        {prefersReduced ? (
          <div className="sticky top-0 left-0 w-full h-screen bg-[#F2F0EB] flex items-center justify-center">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-light text-[#111111] tracking-tight">
                Floating Architectural World
              </h2>
              <p className="mt-3 text-sm font-light text-[#777777]">
                Static preview — reduced motion enabled
              </p>
            </div>
          </div>
        ) : (
          <div className="sticky top-0 left-0 w-full h-screen pointer-events-none">
            <Canvas
              shadows
              dpr={[1, 2]}
              camera={{ position: [0, 6, 14], fov: 35, near: 0.1, far: 120 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            >
              <ambientLight intensity={0.35} color="#f2f0eb" />
              <directionalLight
                position={[-10, 15, 8]}
                intensity={1.2}
                color="#ffffff"
                castShadow
              />
              <WorldCameraRig
                scrollProgressRef={scrollProgressRef}
                prefersReducedRef={prefersReducedRef}
                isTouchRef={isTouchRef}
              />
              <Suspense fallback={null}>
                <FloatingArchitecturalWorld
                  scrollProgressRef={scrollProgressRef}
                />
              </Suspense>
            </Canvas>
          </div>
        )}

        <div className="absolute bottom-8 right-8 pointer-events-none">
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#777777] mb-1">
              <span ref={progressTextRef}>0%</span>
            </p>
            <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-light leading-none tracking-[-0.04em] text-[#111111]">
              {STAGE_LABELS[activeStage].title}
            </h2>
            <p className="mt-2 text-sm font-light leading-relaxed text-[#33312d]">
              {STAGE_LABELS[activeStage].subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
        <div className="editorial-container max-w-4xl">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-10 bg-[#B68A4A]" />
            <p className="editorial-eyebrow text-[#D0AD75]">
              Architecture · Interior · Landscape
            </p>
          </div>
          <h1 className="max-w-2xl font-serif text-[clamp(3rem,7vw,5.5rem)] font-light leading-[0.88] tracking-[-0.045em] text-[#F2F0EB] drop-shadow-md">
            Spaces shaped<br />
            by <span className="italic text-[#C6A779]">intention.</span>
          </h1>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onOpenConsultation}
              className="group inline-flex min-h-14 items-center justify-center gap-5 bg-[#F2F0EB] px-7 text-[10px] font-medium uppercase tracking-[0.16em] text-[#111111] transition-colors duration-300 hover:bg-[#B68A4A]"
            >
              Discuss Your Project
              <ArrowUpRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </button>
            <button
              type="button"
              onClick={exploreProjects}
              className="inline-flex min-h-14 items-center justify-center border border-[#111111]/30 px-7 text-[10px] font-medium uppercase tracking-[0.16em] text-[#111111] transition-colors duration-300 hover:border-[#B68A4A] hover:text-[#B68A4A]"
            >
              Explore Projects
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
