import { cn } from "../../lib/utils";

type ProgressBarProps = {
  value: number;
  className?: string;
};

export function ProgressBar({ value, className }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-white/10", className)}
    >
      <div
        className="h-full rounded-full bg-brand-300 transition-all duration-300"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
