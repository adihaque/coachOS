import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-board text-white stamp-btn hover:bg-[var(--board-deep)]",
  secondary: "bg-paper-raised text-ink stamp-btn hover:bg-[var(--board-tint)]",
  ghost: "text-ink hover:bg-[var(--board-tint)] border border-transparent",
  danger: "bg-red-pen text-white stamp-btn hover:brightness-95",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-md",
  md: "text-sm px-4 py-2.5 rounded-lg",
  lg: "text-base px-6 py-3 rounded-lg",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = CommonProps & { href: string };

export function Button({
  variant = "primary", size = "md", children, className, icon, href, ...rest
}: ButtonProps | LinkProps) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:pointer-events-none",
    variantClasses[variant], sizeClasses[size], className
  );

  if (href) {
    return <Link href={href} className={classes}>{icon}{children}</Link>;
  }

  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {icon}{children}
    </button>
  );
}
