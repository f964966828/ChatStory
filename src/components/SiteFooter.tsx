"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { siGithub } from "simple-icons";
import { BrandMark } from "@/components/BrandMark";
import { useLocale } from "@/components/LocaleProvider";
import { SITE_LINKS } from "@/lib/site-links";

export function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer className="mt-auto border-t border-card-border/80 bg-white/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-sm">
            <BrandMark />
          </span>
          <p className="text-sm font-bold text-accent-deep">ChatStory</p>
        </div>
        <nav className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          <ExternalLink href={SITE_LINKS.github} label="GitHub">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              aria-hidden
              className="shrink-0"
            >
              <path d={siGithub.path} fill="currentColor" />
            </svg>
            <span>GitHub</span>
          </ExternalLink>
          <ExternalLink href={SITE_LINKS.feedback} label={t("feedback")}>
            <FeedbackIcon />
            <span>{t("feedback")}</span>
          </ExternalLink>
          <Link
            href="/changelog"
            className="inline-flex items-center gap-1 rounded-full border border-card-border bg-white px-2 py-1 text-[11px] font-medium text-accent-deep transition hover:border-accent hover:bg-accent/10 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
            aria-label={t("changelog")}
          >
            <ChangelogIcon />
            <span>{t("changelog")}</span>
          </Link>
        </nav>
      </div>
    </footer>
  );
}

function ExternalLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  const className =
    "inline-flex items-center gap-1 rounded-full border border-card-border bg-white px-2 py-1 text-[11px] font-medium text-accent-deep transition hover:border-accent hover:bg-accent/10 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs";

  if (!href) {
    return (
      <button type="button" className={className} aria-label={label}>
        {children}
      </button>
    );
  }

  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
    >
      {children}
    </a>
  );
}

function ChangelogIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7h8M8 12h8M8 17h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 4.5h12A1.5 1.5 0 0 1 19.5 6v12a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V6A1.5 1.5 0 0 1 6 4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function FeedbackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H13l-3.6 2.7A.6.6 0 0 1 8.5 18.2V16H7.5A2.5 2.5 0 0 1 5 13.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
