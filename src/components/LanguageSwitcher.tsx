"use client";

import { useLocale } from "@/components/LocaleProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-full border border-card-border bg-white p-1 text-xs font-medium">
      <button
        type="button"
        onClick={() => setLocale("zh")}
        className={`rounded-full px-2 py-1 transition sm:px-3 sm:py-1.5 ${
          locale === "zh"
            ? "bg-accent text-white shadow-sm"
            : "text-muted hover:bg-accent/10 hover:text-accent-deep"
        }`}
      >
        <span className="sm:hidden">中</span>
        <span className="hidden sm:inline">{t("langZh")}</span>
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-full px-2 py-1 transition sm:px-3 sm:py-1.5 ${
          locale === "en"
            ? "bg-accent text-white shadow-sm"
            : "text-muted hover:bg-accent/10 hover:text-accent-deep"
        }`}
      >
        <span className="sm:hidden">EN</span>
        <span className="hidden sm:inline">{t("langEn")}</span>
      </button>
    </div>
  );
}
