import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1 font-body font-medium text-xs rounded-full",
  {
    variants: {
      variant: {
        default: "bg-plum text-ground",
        gold: "bg-gold text-ink",
        magenta: "bg-magenta text-ground",
        outline: "bg-surface-strong text-ink border border-border",
        idle: "bg-surface text-ink-faint",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} style={{ borderRadius: "9999px" }} {...props} />;
}
