import React from "react";

export type ContainerSize = "narrow" | "content" | "wide" | "full";

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article" | "main" | "header" | "footer";
  size?: ContainerSize;
  className?: string;
  children: React.ReactNode;
}

const sizeClasses: Record<ContainerSize, string> = {
  narrow: "max-w-4xl",      // ~896px: Ideal for editorial essays & case study reading
  content: "max-w-7xl",     // ~1280px: Standard architectural grid container
  wide: "max-w-[1536px]",   // ~1536px: Expansive portfolio & photographic showcases
  full: "w-full max-w-none", // Edge-to-edge
};

export const Container: React.FC<ContainerProps> = ({
  as: Component = "div",
  size = "content",
  className = "",
  children,
  ...props
}) => {
  return (
    <Component
      className={`mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-12 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
