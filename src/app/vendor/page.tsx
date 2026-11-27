"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export default function VendorPortalPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace("/vendor/projects");
    } else {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="p-12 text-center font-mono text-xs text-[#77736C]">
      Redirecting to Assigned Projects...
    </div>
  );
}
