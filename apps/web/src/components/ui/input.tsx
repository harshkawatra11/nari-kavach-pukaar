import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full bg-surface-2 border border-hairline rounded-[var(--radius-md)] px-3",
        "text-[length:var(--text-base)] text-ink placeholder:text-ink-ghost",
        "transition-colors duration-[var(--dur-fast)]",
        "hover:border-hairline-strong focus:border-[var(--focus)] focus:outline-none",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
