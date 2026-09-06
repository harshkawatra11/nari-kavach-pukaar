import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Luminous, not the deck's square ink-stroked look: soft radius, translucent
// surfaces, colour used sparingly. Minimum 44px touch target maintained.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-medium transition-all disabled:pointer-events-none disabled:opacity-50 min-h-11 px-5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-plum",
  {
    variants: {
      variant: {
        default: "bg-plum text-ground hover:bg-plum-deep shadow-sm",
        gold: "bg-gold text-ink hover:brightness-95",
        outline: "bg-surface-strong text-ink border border-border hover:bg-ground-2",
        destructive: "bg-magenta text-ground hover:brightness-95",
        ghost: "bg-transparent hover:bg-surface text-ink-soft",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-4 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} style={{ borderRadius: "9999px" }} {...props} />
  ),
);
Button.displayName = "Button";
