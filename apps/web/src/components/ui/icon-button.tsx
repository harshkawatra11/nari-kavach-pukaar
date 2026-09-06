"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: "default" | "active" | "danger";
  size?: "sm" | "md";
  side?: "top" | "right" | "bottom" | "left";
}

/** Icon-only control with a mandatory accessible label and a tooltip. Every
 *  icon-only affordance in the app goes through this, so none of them can
 *  ship without a name. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, tone = "default", size = "md", side = "right", className, children, ...props }, ref) => {
    const tones = {
      default: "text-ink-faint hover:text-ink hover:bg-surface-2",
      active: "text-ink bg-surface-3",
      danger: "text-ink-faint hover:text-alarm hover:bg-surface-2",
    };
    return (
      <TooltipProvider delayDuration={400}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={ref}
              aria-label={label}
              className={cn(
                "inline-flex items-center justify-center rounded-[var(--radius-md)] transition-colors duration-[var(--dur-fast)]",
                tones[tone],
                size === "sm" ? "h-8 w-8" : "h-9 w-9",
                className,
              )}
              {...props}
            >
              {children}
            </button>
          </TooltipTrigger>
          <TooltipContent side={side}>{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);
IconButton.displayName = "IconButton";
