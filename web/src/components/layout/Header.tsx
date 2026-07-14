"use client";

import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, Inbox, Shield } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { navItems } from "@/lib/mock-data";
import { filterAlertsForViewer } from "@/lib/alerts/visibility";
import { alerts as fallbackAlerts } from "@/lib/supply-chain/seed-data";
import { useDbResource } from "@/hooks/useDbResource";
import { useViewerProfile } from "@/hooks/useViewerProfile";
import { HexLogo } from "@/components/ui/HexLogo";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const viewerEmail = user?.primaryEmailAddress?.emailAddress ?? null;
  const { isAdmin, reload: reloadProfile } = useViewerProfile();

  const scopedFallback = useMemo(
    () => filterAlertsForViewer(fallbackAlerts, viewerEmail, { isAdmin }),
    [viewerEmail, isAdmin],
  );
  const { data: alertList, reload } = useDbResource("/api/alerts", scopedFallback);
  const unreadAlerts = alertList.filter((a) => a.status === "unread").length;

  useEffect(() => {
    void reload();
    void reloadProfile();
  }, [viewerEmail, reload, reloadProfile]);

  const toggleLocale = () => {
    const next = locale === "en" ? "zh" : "en";
    router.replace(pathname, { locale: next });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-command-border bg-command-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-full items-center justify-between gap-4 px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <HexLogo />
          <span className="hidden text-sm font-bold tracking-wide text-command-teal-bright sm:block">
            {t("header.brand")}
          </span>
        </Link>

        {/* Nav pills */}
        <nav className="hidden items-center rounded-full border border-command-border bg-command-card p-1 lg:flex">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150",
                  isActive
                    ? "bg-command-card-elevated text-command-teal-bright shadow-sm"
                    : "text-command-text-secondary hover:text-command-text",
                )}
              >
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                pathname.startsWith("/admin")
                  ? "border-command-teal/40 bg-command-teal/10 text-command-teal-bright"
                  : "border-command-border text-command-text-secondary hover:border-command-teal/30 hover:text-command-text",
              )}
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t("header.admin")}</span>
            </Link>
          )}

          <Link
            href="/inbox"
            className="relative flex items-center gap-1.5 rounded-full border border-command-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-command-text-secondary transition-colors hover:border-command-teal/30 hover:text-command-text"
          >
            <Inbox className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{t("header.agentInbox")}</span>
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-command-teal animate-pulse-dot" />
          </Link>

          <Link
            href="/alerts"
            className="relative flex items-center gap-1 rounded-full border border-command-border p-1.5 text-command-text-secondary transition-colors hover:border-command-teal/30 hover:text-command-text"
            aria-label={t("header.alerts")}
          >
            <Bell className="h-4 w-4" />
            {unreadAlerts > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-command-orange px-1 text-[9px] font-bold text-black">
                {unreadAlerts}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={toggleLocale}
            className="rounded-full border border-command-border px-2.5 py-1.5 text-[11px] font-semibold text-command-text-secondary transition-colors hover:border-command-teal/30 hover:text-command-teal-bright"
          >
            {locale === "en" ? "EN" : "中"}
          </button>

          {isLoaded && !isSignedIn && (
            <Link
              href="/sign-in"
              className="rounded-full border border-command-teal/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-command-teal-bright transition-colors hover:border-command-teal hover:bg-command-teal/10 md:px-4"
            >
              {t("header.signIn")}
            </Link>
          )}

          {isLoaded && isSignedIn && (
            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    "h-8 w-8 border border-command-border ring-2 ring-command-teal/20",
                },
              }}
            />
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex gap-1 overflow-x-auto border-t border-command-border px-4 py-2 lg:hidden">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all",
                isActive
                  ? "bg-command-card-elevated text-command-teal-bright"
                  : "text-command-text-secondary",
              )}
            >
              {t(`nav.${item.key}`)}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
