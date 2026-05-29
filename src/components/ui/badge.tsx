import * as React from "react";
import { cn } from "../../lib/utils";

const variants = {
  draft: "border-yellow-400/40 bg-yellow-400/15 text-yellow-100",
  review: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
  ready: "border-green-700/60 bg-green-950/80 text-green-300",
  neutral: "border-white/10 bg-white/5 text-zinc-300",
};

export type BadgeVariant = keyof typeof variants;

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
