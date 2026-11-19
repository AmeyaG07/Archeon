import React from "react";
import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "bronze" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
  children: React.ReactNode;
}

export type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined;
  };

export type ButtonAsLink = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    href: string;
    isExternal?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#111111] text-[#F2F0EB] border border-[#111111] hover:bg-[#1C1C1C] hover:border-[#B68A4A] active:bg-[#000000]",
  secondary:
    "bg-[#F2F0EB] text-[#111111] border border-[#D8D6D0] hover:bg-[#FFFFFF] hover:border-[#111111] active:bg-[#E5E3DC]",
  bronze:
    "bg-[#B68A4A] text-[#FFFFFF] border border-[#B68A4A] hover:bg-[#A3783A] hover:border-[#A3783A] active:bg-[#8F662E] shadow-sm",
  outline:
    "bg-transparent text-[#111111] border border-[#111111] hover:bg-[#111111] hover:text-[#F2F0EB] active:bg-[#1C1C1C]",
  ghost:
    "bg-transparent text-[#111111] border border-transparent hover:bg-black/5 active:bg-black/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-xs tracking-wider",
  md: "px-5 py-2.5 text-xs sm:text-sm tracking-widest",
  lg: "px-7 py-3.5 text-sm tracking-widest",
};

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      icon,
      iconPosition = "right",
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-mono uppercase font-medium transition-all duration-200 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B68A4A] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    const content = (
      <>
        {isLoading && (
          <span
            className="mr-2 inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
        )}
        {!isLoading && icon && iconPosition === "left" && (
          <span className="mr-2 inline-flex items-center" aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{children}</span>
        {!isLoading && icon && iconPosition === "right" && (
          <span className="ml-2 inline-flex items-center" aria-hidden="true">
            {icon}
          </span>
        )}
      </>
    );

    // Render as Link if href is provided
    if ("href" in props && props.href) {
      const { href, isExternal, ...anchorProps } = props as ButtonAsLink;
      if (isExternal || href.startsWith("http")) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={combinedClasses}
            {...anchorProps}
          >
            {content}
          </a>
        );
      }

      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={combinedClasses}
          {...anchorProps}
        >
          {content}
        </Link>
      );
    }

    // Default button element
    const buttonProps = props as ButtonAsButton;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={buttonProps.type || "button"}
        disabled={buttonProps.disabled || isLoading}
        aria-busy={isLoading}
        className={combinedClasses}
        {...buttonProps}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
