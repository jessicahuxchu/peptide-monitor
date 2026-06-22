"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDbResource } from "@/hooks/useDbResource";
import {
  supplierProfiles as fallbackSuppliers,
  customerDemands as fallbackDemands,
  matchSuppliersForDemand,
  type CustomerDemand,
} from "@/lib/relations/matching";
import { X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const statusVariant = {
  active: "optimal",
  negotiating: "delayed",
  prospect: "default",
} as const;

const relationsFallback = {
  suppliers: fallbackSuppliers,
  demands: fallbackDemands,
};

export default function RelationsPage() {
  const t = useTranslations();
  const { data } = useDbResource("/api/relations", relationsFallback);
  const { suppliers: supplierProfiles, demands: customerDemands } = data;
  const [selectedDemand, setSelectedDemand] = useState<CustomerDemand | null>(null);

  const matchedSuppliers = selectedDemand
    ? matchSuppliersForDemand(selectedDemand, supplierProfiles)
    : [];

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6">
      <CommandCard
        title={t("pages.relations.title")}
        subtitle={t("pages.relations.description")}
      >
        <div className="grid w-full max-w-full gap-6 lg:grid-cols-2">
          {/* Suppliers */}
          <section className="min-w-0">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-command-text-muted">
              <span className="h-2 w-2 rounded-full bg-command-teal" />
              {t("relationsPage.suppliers")}
            </h3>
            <div className="space-y-3">
              {supplierProfiles.map((sup) => (
                <article
                  key={sup.id}
                  className="card-hover rounded-xl border border-command-border bg-command-card-elevated p-4"
                >
                  <h4 className="font-semibold text-command-text">{sup.name}</h4>
                  <p className="mt-0.5 text-xs text-command-text-muted">
                    {sup.country} · {sup.region}
                  </p>
                  <dl className="mt-3 space-y-1.5 text-xs">
                    <Row label={t("crm.contact")} value={sup.contact} />
                    <Row label={t("crm.email")} value={sup.email} highlight />
                    <Row label={t("crm.products")} value={sup.products.join(", ")} />
                    <Row
                      label={t("crm.latestQuote")}
                      value={`$${sup.price} ${sup.unit} · MOQ ${sup.moq}`}
                      highlight
                    />
                  </dl>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {sup.documents.map((doc) => (
                      <span
                        key={doc}
                        className="rounded border border-command-border px-1.5 py-0.5 text-[9px] text-command-text-muted"
                      >
                        {t(`docTypes.${doc}`)}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Customers */}
          <section className="min-w-0">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-command-text-muted">
              <span className="h-2 w-2 rounded-full bg-command-orange" />
              {t("relationsPage.customers")}
            </h3>
            <div className="space-y-3">
              {customerDemands.map((cust) => (
                <article
                  key={cust.id}
                  className="card-hover rounded-xl border border-command-border bg-command-card-elevated p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-command-text">{cust.name}</h4>
                      <p className="mt-0.5 text-xs text-command-text-muted">
                        {cust.country} · {cust.region}
                      </p>
                    </div>
                    <StatusBadge variant={statusVariant[cust.status] ?? "default"}>
                      {t(`cooperationStatus.${cust.status}`)}
                    </StatusBadge>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-xs">
                    <Row label={t("crm.contact")} value={cust.contact} />
                    <Row label={t("crm.email")} value={cust.email} highlight />
                    <Row label={t("relationsPage.demandProduct")} value={cust.product} />
                    <Row label={t("relationsPage.demandQuantity")} value={cust.quantity} />
                    <Row
                      label={t("relationsPage.targetPrice")}
                      value={`$${cust.targetPrice} ${cust.priceUnit}`}
                      highlight
                    />
                  </dl>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {cust.requiredDocuments.map((doc) => (
                      <span
                        key={doc}
                        className="rounded border border-command-border px-1.5 py-0.5 text-[9px] text-command-text-muted"
                      >
                        {t(`docTypes.${doc}`)}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDemand(cust)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-command-teal/30 bg-command-teal/5 px-3 py-2 text-xs font-medium text-command-teal-bright transition-colors hover:bg-command-teal/10"
                  >
                    {t("relationsPage.findSuppliers")}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </CommandCard>

      {/* Matching panel */}
      {selectedDemand && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-command-border bg-command-card p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-command-text">
                  {t("relationsPage.matchTitle")}
                </h3>
                <p className="mt-1 text-xs text-command-text-muted">
                  {selectedDemand.name} · {selectedDemand.product}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDemand(null)}
                className="rounded-full p-1 text-command-text-muted hover:bg-command-card-elevated hover:text-command-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 rounded-lg border border-command-border bg-command-card-elevated p-3 text-xs">
              <p className="text-command-text-muted">{t("relationsPage.requiredDocs")}</p>
              <p className="mt-1 text-command-text-secondary">
                {selectedDemand.requiredDocuments.map((d) => t(`docTypes.${d}`)).join(" · ")}
              </p>
            </div>

            {matchedSuppliers.length === 0 ? (
              <p className="py-4 text-center text-sm text-command-orange">
                {t("relationsPage.noMatch")}
              </p>
            ) : (
              <div className="max-h-[50vh] space-y-2 overflow-y-auto">
                {matchedSuppliers.map((sup) => (
                  <div
                    key={sup.id}
                    className="rounded-xl border border-command-teal/30 bg-command-teal/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-command-text">{sup.name}</p>
                        <p className="text-[10px] text-command-text-muted">
                          {sup.contact} · {sup.country}
                        </p>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-command-teal-bright">
                        ${sup.price} {sup.unit}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-command-text-muted">
                      MOQ {sup.moq} · {sup.email}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-command-text-muted">{label}</dt>
      <dd className={cn(highlight && "text-command-teal-bright")}>{value}</dd>
    </div>
  );
}
