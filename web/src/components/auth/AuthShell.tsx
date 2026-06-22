"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { HexLogo } from "@/components/ui/HexLogo";

type AuthMode = "signIn" | "signUp";

type Props = {
  mode: AuthMode;
  children: React.ReactNode;
};

export function AuthShell({ mode, children }: Props) {
  const t = useTranslations("auth");
  const tHeader = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const toggleLocale = () => {
    const next = locale === "en" ? "zh" : "en";
    router.replace(pathname, { locale: next });
  };

  const title = mode === "signIn" ? t("signInTitle") : t("signUpTitle");
  const subtitle =
    mode === "signIn" ? t("signInSubtitle") : t("signUpSubtitle");

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      {/* Left hero panel */}
      <section className="relative flex min-h-[38vh] flex-1 flex-col justify-between overflow-hidden border-b border-command-border bg-command-bg p-6 md:p-8 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="pointer-events-none absolute inset-0 grid-map-bg opacity-40" />
        <div className="auth-glow auth-glow-primary" />
        <div className="auth-glow auth-glow-secondary" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <HexLogo />
            <span className="text-sm font-bold tracking-wide text-command-teal-bright">
              {tHeader("brand")}
            </span>
          </Link>

          <button
            type="button"
            onClick={toggleLocale}
            className="rounded-full border border-command-border bg-command-card/80 px-2.5 py-1.5 text-[11px] font-semibold text-command-text-secondary backdrop-blur-sm transition-colors hover:border-command-teal/30 hover:text-command-teal-bright"
          >
            {locale === "en" ? "EN" : "中"}
          </button>
        </div>

        <div className="relative z-10 mt-8 flex flex-1 flex-col justify-center lg:mt-0 lg:max-w-xl">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-command-teal/80">
            {t("systemStatus")}
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-command-text md:text-4xl lg:text-[2.75rem] lg:leading-tight">
            {t("heroTitle")}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-command-text-secondary md:text-base">
            {t("heroSubtitle")}
          </p>
        </div>

        <p className="relative z-10 mt-8 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-command-text-muted lg:block">
          {t("uplinkStatus")}
        </p>
      </section>

      {/* Right auth panel */}
      <aside className="flex w-full shrink-0 flex-col bg-command-card lg:w-[min(440px,42vw)] lg:min-w-[400px]">
        <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-10 md:py-12">
          <div className="mb-8">
            <span className="inline-flex rounded-full border border-command-teal/30 bg-command-teal/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-command-teal-bright">
              {t("identityTag")}
            </span>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-command-text">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-command-text-secondary">
              {subtitle}
            </p>
          </div>

          <div className="auth-clerk-panel">{children}</div>

          <p className="mt-8 text-center text-sm text-command-text-secondary">
            {mode === "signIn" ? t("noAccount") : t("hasAccount")}{" "}
            <Link
              href={mode === "signIn" ? "/sign-up" : "/sign-in"}
              className="font-medium text-command-teal-bright transition-colors hover:text-command-teal"
            >
              {mode === "signIn" ? t("signUpLink") : t("signInLink")}
            </Link>
          </p>
        </div>
      </aside>
    </div>
  );
}
