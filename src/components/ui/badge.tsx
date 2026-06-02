import * as React from "react";
import { cn } from "../../lib/utils";

// Colors are theme-aware: each `badge-*` class is defined in index.css with
// proper contrast (light text on dark themes, dark text on the white theme)
// plus a border and subtle shadow so badges stay legible everywhere.
const variants = {
  active: "badge-status badge-active",
  review: "badge-status badge-review",
  archived: "badge-status badge-neutral",
  inactive: "badge-status badge-inactive",
  neutral: "badge-status badge-neutral",
  draft: "badge-status badge-review",
  ready: "badge-status badge-active",
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
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
