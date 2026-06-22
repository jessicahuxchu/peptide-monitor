import { cn } from "@/lib/utils";

type BadgeVariant = "stable" | "optimal" | "delayed" | "critical" | "default";

const variantStyles: Record<BadgeVariant, string> = {
  stable: "text-command-green border-command-green/30 bg-command-green/10",
  optimal: "text-command-teal-bright border-command-teal/30 bg-command-teal/10",
  delayed: "text-command-orange border-command-orange/30 bg-command-orange/10",
  critical: "text-command-red border-command-red/30 bg-command-red/10",
  default: "text-command-text-secondary border-command-border bg-command-card-elevated",
};

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function StatusBadge({
  children,
  variant = "default",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
