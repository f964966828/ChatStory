"use client";

import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/components/LocaleProvider";

type SiteHeaderProps = {
  view: "landing" | "dashboard";
  onShowLanding: () => void;
  onShowDashboard: () => void;
};

export function SiteHeader({
  view,
  onShowLanding,
  onShowDashboard,
}: SiteHeaderProps) {
  const { t, locale } = useLocale();

  return (
    <header className="sticky top-0 z-20 border-b border-card-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={onShowLanding}
          className="flex min-w-0 items-center gap-2 text-left sm:gap-2.5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-sm">
            <BrandMark />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-accent-deep">
              ChatStory
            </span>
            <span className="hidden text-[11px] text-muted sm:block">
              {t("tagline")}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <nav className="flex items-center gap-0.5 rounded-full border border-card-border bg-white p-0.5 text-[11px] font-medium sm:gap-1 sm:p-1 sm:text-xs">
            <button
              type="button"
              onClick={onShowLanding}
              className={`rounded-full px-2 py-1.5 transition sm:px-3 ${
                view === "landing"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:bg-accent/10 hover:text-accent-deep"
              }`}
            >
              <StableLabel zh="首頁" en="Home" />
            </button>
            <button
              type="button"
              onClick={onShowDashboard}
              className={`rounded-full px-2 py-1.5 transition sm:px-3 ${
                view === "dashboard"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:bg-accent/10 hover:text-accent-deep"
              }`}
            >
              <StableLabel zh="儀表板" en="Dashboard" />
            </button>
          </nav>
        </div>
      </div>
      <div className="border-t border-accent/20 bg-accent/15">
        <p className="mx-auto max-w-6xl px-3 py-2 text-center text-xs font-medium leading-5 text-accent-deep sm:px-6 sm:text-sm">
          {t("wipBannerLead")}{" "}
          <button
            type="button"
            className="font-semibold underline decoration-accent-deep/40 underline-offset-2"
            onClick={() => {
              onShowLanding();
              window.setTimeout(() => {
                document.getElementById("faq")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 50);
            }}
          >
            {locale === "zh" ? `「${t("faqTitle")}」` : `"${t("faqTitle")}"`}
          </button>
          {locale === "zh" ? "。" : "."}
        </p>
      </div>
    </header>
  );
}

function StableLabel({ zh, en }: { zh: string; en: string }) {
  const { locale } = useLocale();

  return (
    <span className="grid justify-items-center">
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
        {zh}
      </span>
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
        {en}
      </span>
      <span className="col-start-1 row-start-1 whitespace-nowrap">
        {locale === "zh" ? zh : en}
      </span>
    </span>
  );
}
