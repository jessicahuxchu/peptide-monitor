import { CommandCard } from "@/components/ui/CommandCard";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <CommandCard title={title}>
        <p className="text-sm leading-relaxed text-command-text-secondary">
          {description}
        </p>
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-command-border">
          <div className="h-full w-1/3 rounded-full bg-command-teal/60" />
        </div>
      </CommandCard>
    </div>
  );
}
