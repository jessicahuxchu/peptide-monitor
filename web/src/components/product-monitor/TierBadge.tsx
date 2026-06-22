import { useTranslations } from "next-intl";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { InventoryTier } from "@/lib/product-monitor/types";

const tierVariant: Record<
  InventoryTier,
  "optimal" | "delayed" | "critical"
> = {
  core: "optimal",
  trial: "delayed",
  avoid: "critical",
};

interface TierBadgeProps {
  tier: InventoryTier;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const t = useTranslations("productMonitor.tiers");

  return (
    <StatusBadge variant={tierVariant[tier]} className={className}>
      {t(tier)}
    </StatusBadge>
  );
}
