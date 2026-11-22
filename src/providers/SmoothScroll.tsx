"use client";

import React, { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      allowNestedScroll: true,
      prevent: (node) => {
        if (!node || typeof (node as HTMLElement).closest !== "function") return false;
        const el = node as HTMLElement;
        return (
          el.hasAttribute?.("data-lenis-prevent") ||
          el.closest?.("[data-lenis-prevent]") !== null ||
          el.closest?.("[role='dialog']") !== null ||
          el.closest?.("[aria-modal='true']") !== null ||
          el.closest?.(".modal-scrollable") !== null ||
          el.closest?.(".overflow-y-auto") !== null ||
          el.closest?.(".overflow-y-scroll") !== null ||
          el.closest?.(".overflow-auto") !== null ||
          el.tagName === "SELECT" ||
          el.tagName === "TEXTAREA"
        );
      },
    });

    // Sync Lenis scroll with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerUpdate);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    // Check initial body lock
    if (document.body.style.overflow === "hidden") {
      lenis.stop();
    }

    // Watch for document.body style overflow changes (modals locking body scroll)
    const observer = new MutationObserver(() => {
      const isLocked =
        document.body.style.overflow === "hidden" ||
        document.documentElement.style.overflow === "hidden" ||
        document.body.classList.contains("overflow-hidden");

      if (isLocked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      observer.disconnect();
      gsap.ticker.remove(tickerUpdate);
      lenis.destroy();
      ScrollTrigger.refresh();
    };
  }, []);

  return <>{children}</>;
}
