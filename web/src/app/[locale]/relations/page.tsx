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
  getOfferForProduct,
  type CustomerDemand,
  type SupplierProfile,
} from "@/lib/relations/matching";
import { ChevronDown, ChevronRight, X, ArrowRight } from "lucide-react";
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
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<CustomerDemand | null>(null);

  const matchedSuppliers = selectedDemand
    ? matchSuppliersForDemand(selectedDemand, supplierProfiles)
    : [];

  const toggleSupplier = (id: string) => {
    setExpandedSupplierId((prev) => (prev === id ? null : id));
  };

  const toggleCustomer = (id: string) => {
    setExpandedCustomerId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6">
      <CommandCard
        title={t("pages.relations.title")}
        subtitle={t("pages.relations.description")}
      >
        <section className="mb-8">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-command-text-muted">
            <span className="h-2 w-2 rounded-full bg-command-teal" />
            {t("relationsPage.suppliers")}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-command-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-command-border bg-command-card-elevated/50 text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
                  <th className="w-8 p-3" />
                  <th className="p-3">{t("relationsPage.supplierName")}</th>
                  <th className="p-3">{t("relationsPage.location")}</th>
                  <th className="p-3">{t("relationsPage.productCount")}</th>
                  <th className="p-3">{t("crm.contact")}</th>
                  <th className="p-3">{t("relationsPage.docCoverage")}</th>
                </tr>
              </thead>
              <tbody>
                {supplierProfiles.map((sup) => (
                  <SupplierRow
                    key={sup.id}
                    supplier={sup}
                    expanded={expandedSupplierId === sup.id}
                    onToggle={() => toggleSupplier(sup.id)}
                    t={t}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-command-text-muted">
            <span className="h-2 w-2 rounded-full bg-command-orange" />
            {t("relationsPage.customers")}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-command-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-command-border bg-command-card-elevated/50 text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
                  <th className="w-8 p-3" />
                  <th className="p-3">{t("relationsPage.customerName")}</th>
                  <th className="p-3">{t("relationsPage.location")}</th>
                  <th className="p-3">{t("relationsPage.demandProduct")}</th>
                  <th className="p-3">{t("relationsPage.demandQuantity")}</th>
                  <th className="p-3">{t("relationsPage.status")}</th>
                </tr>
              </thead>
              <tbody>
                {customerDemands.map((cust) => (
                  <CustomerRow
                    key={cust.id}
                    customer={cust}
                    expanded={expandedCustomerId === cust.id}
                    onToggle={() => toggleCustomer(cust.id)}
                    onMatch={() => setSelectedDemand(cust)}
                    t={t}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </CommandCard>

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
                {matchedSuppliers.map((sup) => {
                  const offer = getOfferForProduct(sup, selectedDemand.product);
                  return (
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
                        {offer && (
                          <span className="text-sm font-bold tabular-nums text-command-teal-bright">
                            ${offer.price} {offer.unit}
                          </span>
                        )}
                      </div>
                      {offer && (
                        <p className="mt-1 text-[10px] text-command-text-muted">
                          MOQ {offer.moq} · {sup.email}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SupplierRow({
  supplier,
  expanded,
  onToggle,
  t,
}: {
  supplier: SupplierProfile;
  expanded: boolean;
  onToggle: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-b border-command-border/50 transition-colors hover:bg-command-card-elevated/40"
        onClick={onToggle}
      >
        <td className="p-3 text-command-text-muted">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </td>
        <td className="p-3 font-semibold text-command-text">{supplier.name}</td>
        <td className="p-3 text-xs text-command-text-muted">
          {supplier.country} · {supplier.region}
        </td>
        <td className="p-3 text-xs text-command-teal-bright">
          {supplier.products.length} {t("relationsPage.products")}
        </td>
        <td className="p-3 text-xs">{supplier.contact}</td>
        <td className="p-3 text-xs text-command-text-muted">
          {supplier.documents.length} {t("relationsPage.docs")}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-command-border/50 bg-command-card-elevated/20">
          <td colSpan={6} className="p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-command-text-muted">
                  {t("relationsPage.productOffers")}
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-command-text-muted">
                      <th className="pb-1 text-left">{t("relationsPage.demandProduct")}</th>
                      <th className="pb-1 text-left">{t("crm.latestQuote")}</th>
                      <th className="pb-1 text-left">MOQ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplier.productOffers.map((offer) => (
                      <tr key={offer.product} className="border-t border-command-border/40">
                        <td className="py-1.5 font-medium text-command-teal-bright">{offer.product}</td>
                        <td className="py-1.5 tabular-nums">${offer.price} {offer.unit}</td>
                        <td className="py-1.5 text-command-text-muted">{offer.moq}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-command-text-muted">
                  {t("crm.email")}
                </p>
                <p className="text-xs text-command-teal-bright">{supplier.email}</p>
                <p className="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-wider text-command-text-muted">
                  {t("relationsPage.requiredDocs")}
                </p>
                <div className="flex flex-wrap gap-1">
                  {supplier.documents.map((doc) => (
                    <span
                      key={doc}
                      className="rounded border border-command-border px-1.5 py-0.5 text-[9px] text-command-text-muted"
                    >
                      {t(`docTypes.${doc}`)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function CustomerRow({
  customer,
  expanded,
  onToggle,
  onMatch,
  t,
}: {
  customer: CustomerDemand;
  expanded: boolean;
  onToggle: () => void;
  onMatch: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-b border-command-border/50 transition-colors hover:bg-command-card-elevated/40"
        onClick={onToggle}
      >
        <td className="p-3 text-command-text-muted">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </td>
        <td className="p-3 font-semibold text-command-text">{customer.name}</td>
        <td className="p-3 text-xs text-command-text-muted">
          {customer.country} · {customer.region}
        </td>
        <td className="p-3 text-xs text-command-teal-bright">{customer.product}</td>
        <td className="p-3 text-xs">{customer.quantity}</td>
        <td className="p-3">
          <StatusBadge variant={statusVariant[customer.status] ?? "default"}>
            {t(`cooperationStatus.${customer.status}`)}
          </StatusBadge>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-command-border/50 bg-command-card-elevated/20">
          <td colSpan={6} className="p-4">
            <dl className="grid gap-3 text-xs sm:grid-cols-2">
              <Detail label={t("crm.contact")} value={customer.contact} />
              <Detail label={t("crm.email")} value={customer.email} highlight />
              <Detail
                label={t("relationsPage.targetPrice")}
                value={`$${customer.targetPrice} ${customer.priceUnit}`}
                highlight
              />
              <Detail
                label={t("relationsPage.requiredDocs")}
                value={customer.requiredDocuments.map((d) => t(`docTypes.${d}`)).join(" · ")}
              />
            </dl>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMatch();
              }}
              className="mt-4 flex items-center gap-1.5 rounded-lg border border-command-teal/30 bg-command-teal/5 px-3 py-2 text-xs font-medium text-command-teal-bright transition-colors hover:bg-command-teal/10"
            >
              {t("relationsPage.findSuppliers")}
              <ArrowRight className="h-3 w-3" />
            </button>
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-command-text-muted">{label}</dt>
      <dd className={cn("mt-0.5", highlight && "text-command-teal-bright")}>{value}</dd>
    </div>
  );
}
