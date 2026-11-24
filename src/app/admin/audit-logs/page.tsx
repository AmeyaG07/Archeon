"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminAuditLogsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8 text-center">
      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-[#77736C]">
          System activity is now consolidated in the Overview workspace.
        </p>
        <p className="text-xs text-[#99958D]">
          Redirecting to Overview...
        </p>
      </div>
    </div>
  );
}
