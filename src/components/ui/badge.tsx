import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-line/40 text-foreground-soft",
  accent: "bg-accent-soft text-accent-ink",
  amber: "bg-amber-soft text-amber",
  rose: "bg-rose-soft text-rose",
} as const;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof TONES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
