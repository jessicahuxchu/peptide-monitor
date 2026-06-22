import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

type AppLocale = "en" | "zh";

const DATE_LOCALE: Record<AppLocale, string> = {
  en: "en-US",
  zh: "zh-CN",
};

export function formatDate(value: string | Date, locale: AppLocale): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(DATE_LOCALE[locale]);
}

export function formatDateTime(value: string | Date, locale: AppLocale): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(DATE_LOCALE[locale]);
}
