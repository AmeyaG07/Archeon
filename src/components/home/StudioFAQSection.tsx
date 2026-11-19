
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface StudioFAQItem {
  id: string;
  question: string;
  answer: string;
}

interface StudioFAQSectionProps {
  items: StudioFAQItem[];
}

export function StudioFAQSection({ items }: StudioFAQSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!items.length) return null;

  return (
    <section className="bg-[#F2F0EB] py-24 md:py-36">
      <div className="editorial-container">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Introduction */}
          <div className="lg:col-span-4">
            <p className="editorial-eyebrow text-[#A58A64]">
              05 / Information
            </p>

            <h2 className="mt-6 font-serif text-5xl leading-tight text-[#111111] md:text-6xl">
              Questions
              <br />
              worth asking.
            </h2>

            <p className="mt-7 max-w-sm text-sm leading-8 text-[#77736C]">
              A little more clarity about working with an architecture
              and design studio.
            </p>
          </div>

          {/* Accordion */}
          <div className="lg:col-span-8">
            <div className="border-t border-[#D8D6D0]">
              {items.map((item, index) => {
                const isOpen = openId === item.id;

                return (
                  <div
                    key={item.id}
                    className="border-b border-[#D8D6D0]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenId(isOpen ? null : item.id)
                      }
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${item.id}`}
                      className="flex w-full items-center justify-between gap-6 py-7 text-left md:py-9"
                    >
                      <div className="flex items-start gap-5 md:gap-8">
                        <span className="mt-1 font-mono text-xs text-[#A58A64]">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className="font-serif text-xl leading-snug text-[#171717] md:text-2xl">
                          {item.question}
                        </span>
                      </div>

                      <ChevronDown
                        size={20}
                        strokeWidth={1.4}
                        className={`shrink-0 text-[#A58A64] transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div
                      id={`faq-answer-${item.id}`}
                      hidden={!isOpen}
                      className="pb-8 pl-10 md:pl-16"
                    >
                      <p className="max-w-2xl text-sm leading-8 text-[#6F6B63] md:text-base">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
