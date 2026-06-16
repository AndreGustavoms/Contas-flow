import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

interface SelectProps<T extends string = string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function Select<T extends string = string>({
  value,
  options,
  onChange,
  disabled = false,
  className,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-4 text-sm font-medium transition-all duration-200 outline-none",
          "bg-[color:var(--field)] text-[color:var(--text)]",
          open
            ? "border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/20"
            : "border-[color:var(--border)] hover:border-[color:var(--accent-border)]",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span>{selected?.label ?? "—"}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[color:var(--muted)] transition-transform duration-200",
            open && "rotate-180 text-[color:var(--accent)]",
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-[color:var(--accent-border)] bg-[color:var(--page-bg)] shadow-[0_8px_32px_-8px_var(--accent-glow),0_4px_16px_-4px_rgba(0,0,0,.7)]"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={active}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  "flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150",
                  active
                    ? "bg-[color:var(--accent-surface)] text-[color:var(--accent-soft)] font-semibold"
                    : "text-[color:var(--text)] hover:bg-[color:var(--accent-surface)] hover:text-[color:var(--text)]",
                )}
              >
                <span>{opt.label}</span>
                {active && <Check className="h-3.5 w-3.5 text-[color:var(--accent)]" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
