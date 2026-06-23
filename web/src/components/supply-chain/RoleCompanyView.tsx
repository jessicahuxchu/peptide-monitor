"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  getCompaniesForRole,
  getRolesForPath,
  getChainsForPath,
  supplyChainCompanies,
} from "@/lib/supply-chain/role-data";
import { riskColor } from "@/lib/supply-chain/utils";
import { cn } from "@/lib/utils";

const pathTypeColors = {
  primary: "border-command-teal/40 text-command-teal-bright",
  alternative: "border-blue-500/40 text-blue-400",
  high_risk: "border-command-orange/40 text-command-orange",
};

interface RoleCompanyViewProps {
  activePathId: string;
  selectedRoleId: string | null;
  onSelectRole: (roleId: string) => void;
  selectedChainId: string | null;
  onSelectChain: (chainId: string | null) => void;
}

export function RoleCompanyView({
  activePathId,
  selectedRoleId,
  onSelectRole,
  selectedChainId,
  onSelectChain,
}: RoleCompanyViewProps) {
  const t = useTranslations("supplyChain");
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  const pathRoles = getRolesForPath(activePathId).filter((r) => r.id !== "role-patient");
  const pathChains = getChainsForPath(activePathId);

  const toggleRole = (roleId: string) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  return (
    <div className="grid w-full max-w-full gap-4 lg:grid-cols-2">
      {/* Roles with companies */}
      <div className="min-w-0 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-command-text-muted">
          {t("rolesSection.title")}
        </h3>
        <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
          {pathRoles.map((role) => {
              const companies = getCompaniesForRole(role.id);
              const isExpanded = expandedRoles.has(role.id) || selectedRoleId === role.id;
              const isSelected = selectedRoleId === role.id;

              return (
                <div
                  key={role.id}
                  className={cn(
                    "rounded-xl border bg-command-card-elevated transition-colors",
                    isSelected ? "border-command-teal/40" : "border-command-border",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectRole(role.id);
                      toggleRole(role.id);
                    }}
                    className="flex w-full items-start gap-2 p-3 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-command-text-muted" />
                    ) : (
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-command-text-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-command-text">
                          {t(`roles.${role.roleLabelKey}`)}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                            riskColor(role.riskLevel),
                          )}
                        >
                          {t(`risk.${role.riskLevel}`)}
                        </span>
                        <span className="text-[10px] text-command-text-muted">
                          {role.country} · {role.region}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 flex-1 max-w-[120px] overflow-hidden rounded-full bg-command-border">
                          <div
                            className="h-full rounded-full bg-command-teal"
                            style={{ width: `${role.documentCompletion}%` }}
                          />
                        </div>
                        <span className="text-[9px] tabular-nums text-command-text-muted">
                          {role.documentCompletion}%
                        </span>
                        <span className="text-[10px] text-command-text-muted">
                          {companies.length} {t("rolesSection.companies")}
                        </span>
                      </div>
                      {role.riskNotes && (
                        <p className="mt-1.5 text-[10px] text-command-orange">{role.riskNotes}</p>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {role.requiredDocuments.map((doc) => (
                          <span
                            key={doc}
                            className="rounded border border-command-border px-1.5 py-0.5 text-[9px] text-command-text-muted"
                          >
                            {t(`docTypes.${doc}`)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>

                  {isExpanded && companies.length > 0 && (
                    <div className="border-t border-command-border px-3 pb-3 pt-2">
                      <ul className="space-y-1.5">
                        {companies.map((co) => (
                          <li
                            key={co.id}
                            className="flex items-center justify-between rounded-lg border border-command-border/50 bg-command-card px-2.5 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-command-text">
                                {co.name}
                              </p>
                              <p className="text-[10px] text-command-text-muted">{co.contact}</p>
                            </div>
                            <span
                              className={cn(
                                "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium",
                                co.status === "active"
                                  ? "bg-command-green/10 text-command-green"
                                  : co.status === "prospect"
                                    ? "bg-command-teal/10 text-command-teal-bright"
                                    : "bg-command-orange/10 text-command-orange",
                              )}
                            >
                              {t(`companyStatus.${co.status}`)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Formed chains */}
      <div className="min-w-0 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-command-text-muted">
          {t("rolesSection.formedChains")}
        </h3>
        <div className="space-y-3">
          {pathChains.map((chain) => {
            const isSelected = selectedChainId === chain.id;
            return (
            <button
              key={chain.id}
              type="button"
              onClick={() => onSelectChain(isSelected ? null : chain.id)}
              className={cn(
                "w-full rounded-xl border bg-command-card-elevated p-3 text-left transition-colors",
                pathTypeColors[chain.pathType],
                isSelected && "ring-2 ring-command-teal/50",
              )}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-command-text">{chain.name}</h4>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-medium",
                    chain.status === "active"
                      ? "bg-command-green/10 text-command-green"
                      : chain.status === "forming"
                        ? "bg-command-teal/10 text-command-teal-bright"
                        : "bg-command-red/10 text-command-red",
                  )}
                >
                  {t(`chainStatus.${chain.status}`)}
                </span>
              </div>
              {chain.notes && (
                <p className="mb-2 text-[10px] text-command-text-muted">{chain.notes}</p>
              )}
              <div className="flex flex-wrap items-center gap-1">
                {chain.companyIds.map((coId, i) => {
                  const co = supplyChainCompanies.find((c) => c.id === coId);
                  if (!co) return null;
                  return (
                    <span key={coId} className="flex items-center gap-1">
                      <span className="rounded border border-command-border bg-command-card px-2 py-1 text-[10px] text-command-text">
                        {co.name}
                      </span>
                      {i < chain.companyIds.length - 1 && (
                        <span className="text-command-text-muted">→</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
