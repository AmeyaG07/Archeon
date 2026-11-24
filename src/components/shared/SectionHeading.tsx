import React from "react";

export interface SectionHeadingProps {
  /** Optional metadata eyebrow or disciplinary kicker in monospace */
  eyebrow?: string;
  /** Primary headline rendered in editorial serif */
  title: string;
  /** Optional subtitle or descriptive lead paragraph */
  description?: string;
  /** Accessible heading tag level */
  level?: 1 | 2 | 3 | 4;
  /** Text alignment across container */
  align?: "left" | "center" | "right";
  /** Color theme variant */
  theme?: "light" | "dark";
  /** Optional custom container CSS classes */
  className?: string;
}

const headingTagMap = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
} as const;

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  level = 2,
  align = "left",
  theme = "light",
  className = "",
}) => {
  const HeadingTag = headingTagMap[level] || "h2";

  const alignClasses = {
    left: "text-left items-start",
    center: "text-center items-center mx-auto",
    right: "text-right items-end ml-auto",
  }[align];

  const themeClasses = {
    light: {
      eyebrow: "text-[#B68A4A]",
      title: "text-[#111111]",
      description: "text-[#777777]",
      rule: "border-[#D8D6D0]",
    },
    dark: {
      eyebrow: "text-[#B68A4A]",
      title: "text-[#F2F0EB]",
      description: "text-[#A3A3A3]",
      rule: "border-[#343434]",
    },
  }[theme];

  return (
    <div className={`flex flex-col ${alignClasses} max-w-3xl ${className}`}>
      {eyebrow && (
        <div className="flex items-center space-x-2.5 mb-3 select-none">
          <span className="w-4 h-[1px] bg-[#B68A4A]" aria-hidden="true" />
          <span
            className={`font-mono text-xs uppercase tracking-[0.18em] font-medium ${themeClasses.eyebrow}`}
          >
            {eyebrow}
          </span>
        </div>
      )}

      <HeadingTag
        className={`font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-[-0.02em] leading-[1.08] ${themeClasses.title}`}
      >
        {title}
      </HeadingTag>

      {description && (
        <p
          className={`mt-4 sm:mt-5 font-sans text-base sm:text-lg font-light leading-relaxed max-w-2xl ${themeClasses.description}`}
        >
          {description}
        </p>
      )}
    </div>
  );
};
