"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { OpeningPreloader } from "@/components/ui/OpeningPreloader";

export default function PreloaderPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#111111]">
      <OpeningPreloader
        forcePlay
        durationMs={4200}
        onComplete={() => router.push("/")}
      />
    </div>
  );
}
