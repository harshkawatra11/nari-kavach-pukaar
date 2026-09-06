import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Monochrome chrome: colour appears only on the primary action, the danger
// action, and the alarm state (see tokens.css). Everything else is neutral
// surfaces distinguished by tone, not by hue. No inline style overrides; the
// radius scale lives entirely in these class strings.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-[var(--dur-fast)] disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        primary: "bg-accent text-ink hover:bg-accent-hover",
        secondary: "bg-surface-2 text-ink border border-hairline hover:bg-surface-3 hover:border-hairline-strong",
        ghost: "text-ink-soft hover:bg-surface-2 hover:text-ink",
        danger: "bg-alarm text-ink hover:brightness-110",
        quiet: "text-ink-faint hover:text-ink",
      },
      size: {
        sm: "h-8 px-3 text-[length:var(--text-sm)] rounded-[var(--radius-sm)]",
        md: "h-10 px-4 text-[length:var(--text-base)] rounded-[var(--radius-md)]",
        lg: "h-11 px-5 text-[length:var(--text-base)] rounded-[var(--radius-md)]",
        icon: "h-9 w-9 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
