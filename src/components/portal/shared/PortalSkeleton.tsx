"use client";

import React from "react";

interface PortalDashboardSkeletonProps {
  label?: string;
}

/**
 * Architectural editorial shimmer skeleton for portal overview and workspace routes.
 * Matches the ivory/stone (#F2F0EB / #D8D6D0) surface system without layout shift.
 */
export function PortalDashboardSkeleton({
  label = "Loading workspace...",
}: PortalDashboardSkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className="min-h-[70vh] bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12 lg:px-12"
    >
      <span className="sr-only">{label}</span>

      {/* Top Section Header Skeleton */}
      <div className="flex flex-col justify-between gap-5 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end animate-pulse">
        <div className="space-y-3">
          <div className="h-2.5 w-40 rounded bg-[#DFDDD6]" />
          <div className="h-9 w-64 sm:w-80 rounded bg-[#DFDDD6]" />
          <div className="h-3.5 w-72 sm:w-96 rounded bg-[#E6E4DD]" />
        </div>
        <div className="h-10 w-36 rounded bg-[#DFDDD6]" />
      </div>

      {/* 4-Card KPI Strip Skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 animate-pulse">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="border border-[#D8D6D0] bg-white p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-24 rounded bg-[#E6E4DD]" />
              <div className="h-7 w-7 rounded bg-[#F0EEE8]" />
            </div>
            <div className="h-8 w-28 rounded bg-[#DFDDD6]" />
            <div className="h-2.5 w-32 rounded bg-[#ECEAE3]" />
          </div>
        ))}
      </div>

      {/* Main Content Split Grid Skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 animate-pulse">
        <div className="lg:col-span-7 border border-[#D8D6D0] bg-white p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#ECEAE3] pb-4">
            <div className="h-5 w-44 rounded bg-[#DFDDD6]" />
            <div className="h-3 w-20 rounded bg-[#E6E4DD]" />
          </div>
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between border border-[#ECEAE3] bg-[#FAF9F6] p-4"
            >
              <div className="space-y-2.5 flex-1">
                <div className="h-4 w-48 rounded bg-[#DFDDD6]" />
                <div className="h-3 w-32 rounded bg-[#E6E4DD]" />
              </div>
              <div className="h-6 w-24 rounded bg-[#ECEAE3]" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 border border-[#D8D6D0] bg-white p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#ECEAE3] pb-4">
            <div className="h-5 w-36 rounded bg-[#DFDDD6]" />
            <div className="h-3 w-16 rounded bg-[#E6E4DD]" />
          </div>
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="flex items-start gap-3 py-2">
              <div className="h-8 w-8 shrink-0 rounded bg-[#ECEAE3]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 rounded bg-[#DFDDD6]" />
                <div className="h-2.5 w-full rounded bg-[#ECEAE3]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
