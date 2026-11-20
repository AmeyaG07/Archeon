"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ArchitecturalCursor = dynamic(
  () => import("./ArchitecturalCursor").then((m) => m.ArchitecturalCursor),
  { ssr: false }
);

export function ClientCursorWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <ArchitecturalCursor />;
}
