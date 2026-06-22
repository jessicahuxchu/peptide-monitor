import { cn } from "@/lib/utils";

interface CommandCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CommandCard({
  title,
  subtitle,
  action,
  children,
  className,
}: CommandCardProps) {
  return (
    <section
      className={cn(
        "card-hover flex flex-col rounded-xl border border-command-border bg-command-card p-4 md:p-5",
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-command-text">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-command-text-muted">{subtitle}</p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
