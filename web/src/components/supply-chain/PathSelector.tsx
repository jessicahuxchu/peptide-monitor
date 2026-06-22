"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { PathType } from "@/lib/supply-chain/types";

interface PathSelectorProps {
  paths: { id: string; nameKey: string; pathType: PathType }[];
  activePathId: string;
  onChange: (pathId: string) => void;
}

const pathTypeStyles: Record<PathType, string> = {
  primary: "border-command-teal/40 text-command-teal-bright",
  alternative: "border-command-text-muted text-command-text-secondary",
  high_risk: "border-command-orange/40 text-command-orange",
};

export function PathSelector({ paths, activePathId, onChange }: PathSelectorProps) {
  const t = useTranslations("supplyChain");

  return (
    <div className="flex flex-wrap gap-2">
      {paths.map((path) => {
        const isActive = path.id === activePathId;
        return (
          <button
            key={path.id}
            type="button"
            onClick={() => onChange(path.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-medium transition-all duration-150",
              isActive
                ? "bg-command-card-elevated shadow-sm"
                : "bg-command-card hover:border-command-teal/20",
              pathTypeStyles[path.pathType],
            )}
          >
            {t(`paths.${path.nameKey}`)}
          </button>
        );
      })}
    </div>
  );
}
