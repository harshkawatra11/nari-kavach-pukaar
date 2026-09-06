import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 font-medium text-[length:var(--text-xs)] rounded-[var(--radius-sm)]",
  {
    variants: {
      variant: {
        default: "bg-surface-2 text-ink border border-hairline",
        accent: "bg-accent text-ink",
        alarm: "bg-alarm text-ink",
        idle: "bg-surface-1 text-ink-faint",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
