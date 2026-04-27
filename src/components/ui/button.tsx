"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  default:
    "bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-950/20 hover:bg-emerald-400",
  outline:
    "border border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10 hover:border-emerald-400/40",
  ghost: "text-zinc-100 hover:bg-white/10",
  destructive:
    "bg-rose-500 text-white shadow-lg shadow-rose-950/20 hover:bg-rose-400",
} as const;

type ButtonVariant = keyof typeof buttonVariants;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
          buttonVariants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";