import * as React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--field)] px-3 text-sm text-[color:var(--text)] shadow-[inset_0_1px_0_var(--inset-light),0_16px_34px_var(--field-shadow)] outline-none backdrop-blur-xl transition duration-300 placeholder:text-[color:var(--muted-soft)] hover:-translate-y-0.5 hover:border-[color:var(--accent-border)] hover:bg-[color:var(--field-hover)] focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--focus-ring)]",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
