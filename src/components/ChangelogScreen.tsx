"use client";

import { useMemo, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/components/LocaleProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { CHANGELOG, CHANGELOG_PAGE_SIZE } from "@/lib/changelog";
import Link from "next/link";

function formatChangelogDate(date: string, locale: "zh" | "en") {
  const endDate = date.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!endDate) return date;
  const [, year, month, day] = endDate.map(Number);
  const weekdayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const weekdays =
    locale === "zh"
      ? ["日", "一", "二", "三", "四", "五", "六"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${date} (${weekdays[weekdayIndex]})`;
}

export function ChangelogScreen() {
  const { t, locale } = useLocale();
  const pageCount = Math.max(
    1,
    Math.ceil(CHANGELOG.length / CHANGELOG_PAGE_SIZE),
  );
  const [page, setPage] = useState(1);
  const entries = useMemo(() => {
    const current = Math.min(page, pageCount);
    const start = (current - 1) * CHANGELOG_PAGE_SIZE;
    return CHANGELOG.slice(start, start + CHANGELOG_PAGE_SIZE);
  }, [page, pageCount]);

  function goToPage(next: number) {
    const current = Math.min(pageCount, Math.max(1, next));
    setPage(current);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-card-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-sm">
              <BrandMark />
            </span>
            <span className="text-sm font-bold tracking-tight text-accent-deep">
              ChatStory
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/"
              className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-accent-dim"
            >
              {t("back")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-serif text-2xl font-bold text-accent-deep sm:text-3xl">
          {t("changelogTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted">{t("changelogBody")}</p>
        <ol className="mt-8 space-y-6">
          {entries.map((entry) => (
            <li
              key={entry.date}
              className="rounded-2xl border border-card-border bg-card px-4 py-4 sm:px-5"
            >
              <p className="font-mono text-sm font-semibold text-accent-deep">
                {formatChangelogDate(entry.date, locale)}
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-foreground">
                {(locale === "en" ? entry.en : entry.zh).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        {pageCount > 1 ? (
          <nav
            aria-label={t("changelogTitle")}
            className="mt-8 flex items-center justify-center gap-1.5"
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-card-border bg-white px-3 text-xs font-medium text-accent-deep transition hover:border-accent hover:bg-accent/10 disabled:pointer-events-none disabled:opacity-40 sm:px-3.5 sm:text-sm"
            >
              <Chevron direction="left" />
              {t("changelogPrev")}
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map(
              (number) => {
                const active = number === page;
                return (
                  <button
                    key={number}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    aria-label={t("changelogPage", { n: String(number) })}
                    onClick={() => goToPage(number)}
                    className={`inline-flex size-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                      active
                        ? "bg-accent text-white shadow-sm"
                        : "border border-card-border bg-white text-accent-deep hover:border-accent hover:bg-accent/10"
                    }`}
                  >
                    {number}
                  </button>
                );
              },
            )}
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => goToPage(page + 1)}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-card-border bg-white px-3 text-xs font-medium text-accent-deep transition hover:border-accent hover:bg-accent/10 disabled:pointer-events-none disabled:opacity-40 sm:px-3.5 sm:text-sm"
            >
              {t("changelogNext")}
              <Chevron direction="right" />
            </button>
          </nav>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={direction === "right" ? "rotate-180" : undefined}
    >
      <path
        d="M14.5 5.5 8 12l6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
