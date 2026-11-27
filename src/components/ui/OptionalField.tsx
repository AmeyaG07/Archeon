"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface OptionalFieldProps {
  label: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  labelClassName?: string;
}

export function OptionalField({
  label,
  children,
  defaultOpen = false,
  className = "",
  labelClassName = "font-mono text-xs uppercase tracking-wider text-[#55514A]",
}: OptionalFieldProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between gap-2 py-1 text-left cursor-pointer hover:text-[#171717] transition-colors ${labelClassName}`}
      >
        <span>{label}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="mt-1.5">{children}</div>}
    </div>
  );
}
