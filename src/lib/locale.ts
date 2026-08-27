import type { Locale } from "@/lib/messages";

export const LOCALE_COOKIE = "chatstory-locale";
export const LOCALE_STORAGE_KEY = "chatstory-locale";

export function parseLocale(value: string | undefined | null): Locale {
  return value === "en" ? "en" : "zh";
}

export function persistLocale(locale: Locale) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
