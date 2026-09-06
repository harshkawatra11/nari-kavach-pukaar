import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full bg-surface-strong border border-border px-4 py-2 font-body text-base text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:border-plum focus-visible:bg-ground disabled:opacity-50 transition-colors",
        className,
      )}
      style={{ borderRadius: "0.85rem" }}
      {...props}
    />
  ),
);
Input.displayName = "Input";
