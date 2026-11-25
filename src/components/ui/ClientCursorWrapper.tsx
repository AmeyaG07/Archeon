"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function getCanRenderReticle() {
  if (typeof window === "undefined") return false;
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  return isFinePointer && !reducedMotion;
}

function getServerSnapshot() {
  return false;
}

/**
 * Lightweight desktop-only bronze architectural pointer reticle.
 * Strictly pointer-events-none so native clicking and accessibility are unaffected.
 */
export function ClientCursorWrapper() {
  const enabled = useSyncExternalStore(
    emptySubscribe,
    getCanRenderReticle,
    getServerSnapshot
  );

  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [cursorLabel, setCursorLabel] = useState<string | null>(null);
  const [cursorMode, setCursorMode] = useState<
    "default" | "interactive" | "labeled" | "text"
  >("default");
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  const modeRef = useRef(cursorMode);
  const labelRef = useRef(cursorLabel);
  const visibleRef = useRef(visible);

  useEffect(() => {
    if (!enabled) return;

    let targetX = -200;
    let targetY = -200;
    let ringX = -200;
    let ringY = -200;
    let dotX = -200;
    let dotY = -200;
    let rafId = 0;

    const updateTargetState = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        if (modeRef.current !== "default") {
          modeRef.current = "default";
          setCursorMode("default");
        }
        if (labelRef.current !== null) {
          labelRef.current = null;
          setCursorLabel(null);
        }
        return;
      }

      const labeled = target.closest<HTMLElement>("[data-cursor-label]");
      if (labeled) {
        const nextLabel = labeled.getAttribute("data-cursor-label");
        if (modeRef.current !== "labeled") {
          modeRef.current = "labeled";
          setCursorMode("labeled");
        }
        if (labelRef.current !== nextLabel) {
          labelRef.current = nextLabel;
          setCursorLabel(nextLabel);
        }
        return;
      }

      if (labelRef.current !== null) {
        labelRef.current = null;
        setCursorLabel(null);
      }

      if (target.closest("input, textarea, select, [contenteditable='true']")) {
        if (modeRef.current !== "text") {
          modeRef.current = "text";
          setCursorMode("text");
        }
        return;
      }

      if (
        target.closest(
          "button, a, [role='button'], [data-cursor-interactive]"
        )
      ) {
        if (modeRef.current !== "interactive") {
          modeRef.current = "interactive";
          setCursorMode("interactive");
        }
        return;
      }

      if (modeRef.current !== "default") {
        modeRef.current = "default";
        setCursorMode("default");
      }
    };

    const handleMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      targetX = e.clientX;
      targetY = e.clientY;

      if (!visibleRef.current) {
        ringX = targetX;
        ringY = targetY;
        dotX = targetX;
        dotY = targetY;
        visibleRef.current = true;
        setVisible(true);
      }

      updateTargetState(e.target);
    };

    const handleDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") setPressed(true);
    };

    const handleUp = () => setPressed(false);

    const handleLeave = () => {
      visibleRef.current = false;
      setVisible(false);
      setPressed(false);
    };

    const tick = () => {
      ringX += (targetX - ringX) * 0.16;
      ringY += (targetY - ringY) * 0.16;
      dotX += (targetX - dotX) * 0.65;
      dotY += (targetY - dotY) * 0.65;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerdown", handleDown, { passive: true });
    window.addEventListener("pointerup", handleUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  const scaleFactor = pressed
    ? 0.86
    : cursorMode === "labeled"
    ? 1
    : cursorMode === "interactive"
    ? 1.32
    : cursorMode === "text"
    ? 0.6
    : 1;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[70] overflow-hidden select-none transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Outer Magnetic Bronze Ring / Micro-Label Reticle */}
      <div
        ref={ringRef}
        className="absolute left-0 top-0 will-change-transform"
        style={{ transform: "translate3d(-200px, -200px, 0)" }}
      >
        <div
          style={{ transform: `scale(${scaleFactor})` }}
          className={`flex items-center justify-center rounded-full border transition-all duration-200 ease-out ${
            cursorMode === "labeled" && cursorLabel
              ? "h-14 w-14 border-[#D4AF37]/85 bg-[#111111]/88 shadow-[0_8px_24px_rgba(0,0,0,0.45),0_0_14px_rgba(198,167,121,0.3)] backdrop-blur-md"
              : cursorMode === "interactive"
              ? "h-8 w-8 border-[#D4AF37]/80 bg-[#B68A4A]/12 shadow-[0_0_12px_rgba(198,167,121,0.28)]"
              : cursorMode === "text"
              ? "h-8 w-8 border-[#C6A779]/25 opacity-25"
              : "h-8 w-8 border-[#C6A779]/55"
          }`}
        >
          {cursorMode === "labeled" && cursorLabel && (
            <span className="font-mono text-[8.5px] font-medium uppercase tracking-[0.18em] text-[#F2E5C9]">
              {cursorLabel}
            </span>
          )}
        </div>
      </div>

      {/* Inner Precision Bronze Crosshair Dot */}
      <div
        ref={dotRef}
        className="absolute left-0 top-0 will-change-transform"
        style={{ transform: "translate3d(-200px, -200px, 0)" }}
      >
        <div
          className={`h-1.5 w-1.5 rounded-full bg-[#C6A779] shadow-[0_0_6px_rgba(198,167,121,0.85)] transition-all duration-150 ${
            cursorMode === "labeled" || cursorMode === "text"
              ? "scale-0 opacity-0"
              : pressed
              ? "scale-125 opacity-100"
              : "scale-100 opacity-90"
          }`}
        />
      </div>
    </div>
  );
}
