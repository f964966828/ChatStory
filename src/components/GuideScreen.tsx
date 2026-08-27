"use client";

import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  InstagramLogo,
  LineLogo,
  MessengerLogo,
  ThreadsLogo,
} from "@/components/PlatformLogos";
import { useLocale } from "@/components/LocaleProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { LINE_GUIDE, META_GUIDE } from "@/lib/guides";
import { toPinyinSlug } from "@/lib/pinyin";
import Link from "next/link";

const GUIDE_TITLES = {
  line: "guideLine",
  meta: "guideMeta",
  messenger: "guideMeta",
  instagram: "guideMeta",
  threads: "guideMeta",
} as const;

type GuideScreenProps = {
  platform: keyof typeof GUIDE_TITLES;
};

export function GuideScreen({ platform }: GuideScreenProps) {
  const { t } = useLocale();

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
        {platform === "line" ? <LineGuide /> : <MetaGuide />}
      </main>
      <SiteFooter />
    </div>
  );
}

function LineGuide() {
  const { t, locale } = useLocale();
  const copy = LINE_GUIDE[locale];

  return (
    <article>
      <div className="flex items-center gap-3">
        <LineLogo size={40} />
        <h1 className="font-serif text-2xl font-bold text-accent-deep sm:text-3xl">
          {t("guideLine")}
        </h1>
      </div>

      <section className="mt-8 rounded-2xl border border-card-border bg-card px-4 py-4 sm:px-5 sm:py-5">
        <h2 className="text-base font-bold text-accent-deep">{copy.needTitle}</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-foreground">
          {copy.needItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border border-card-border bg-card px-4 py-4 sm:px-5 sm:py-5">
        <h2 className="text-base font-bold text-accent-deep">{copy.phoneTitle}</h2>
        <ol className="mt-4 space-y-3">
          {copy.phoneSteps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-6">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-deep">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-4 rounded-2xl border border-card-border bg-card px-4 py-4 sm:px-5 sm:py-5">
        <h2 className="text-base font-bold text-accent-deep">{copy.saveTitle}</h2>
        <p className="mt-3 text-sm leading-6 text-foreground">{copy.saveBody}</p>
      </section>

      <section className="mt-4 rounded-2xl border border-card-border bg-card px-4 py-4 sm:px-5 sm:py-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-accent-deep">
          <NoticeIcon label={locale === "en" ? "Notice" : "注意"} />
          {copy.pcTitle}
        </h2>
        <p className="mt-3 text-sm leading-6 text-foreground">{copy.pcNote}</p>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/#import"
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dim"
        >
          {t("guideGoImport")}
        </Link>
        <a
          href={copy.officialHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-card-border bg-white px-5 py-2.5 text-sm font-medium text-accent-deep transition hover:border-accent hover:bg-accent/10"
        >
          {t("guideOfficialHelp")}
        </a>
      </div>
    </article>
  );
}

function MetaGuide() {
  const { t, locale } = useLocale();
  const copy = META_GUIDE[locale];

  return (
    <article>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2">
          <MessengerLogo size={36} />
          <InstagramLogo size={36} />
          <ThreadsLogo size={36} />
        </span>
        <h1 className="font-serif text-2xl font-bold text-accent-deep sm:text-3xl">
          {t("guideMeta")}
        </h1>
      </div>

      <section className="mt-8 rounded-2xl border border-card-border bg-card px-4 py-4 sm:px-5 sm:py-5">
        <h2 className="text-base font-bold text-accent-deep">{copy.needTitle}</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-foreground">
          {copy.needItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border border-card-border bg-card px-4 py-4 sm:px-5 sm:py-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-accent-deep">
          <NoticeIcon label={locale === "en" ? "Notice" : "注意"} />
          {copy.noticeTitle}
        </h2>
        <div className="mt-3 space-y-1.5 text-sm leading-6 text-foreground">
          {copy.noticeItems.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-card-border bg-card px-4 py-4 sm:px-5 sm:py-5">
        <h2 className="text-base font-bold text-accent-deep">{copy.exportTitle}</h2>
        <ol className="mt-4 space-y-3">
          {copy.exportStartSteps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-6">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-deep">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
          <li className="flex gap-3 text-sm leading-6">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-deep">
              {copy.exportStartSteps.length + 1}
            </span>
            <div className="min-w-0 flex-1 rounded-xl bg-accent/10 px-3 py-2.5">
              <p className="flex items-center gap-1.5 font-semibold text-accent-deep">
                <NoticeIcon label={locale === "en" ? "Notice" : "特別注意"} />
                {copy.exportOptionsTitle}
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                {copy.exportOptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </li>
          {copy.exportEndSteps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-6">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-deep">
                {copy.exportStartSteps.length + 2 + index}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-4 rounded-2xl border border-card-border bg-card px-4 py-4 sm:px-5 sm:py-5">
        <h2 className="text-base font-bold text-accent-deep">{copy.fileTitle}</h2>
        <p className="mt-3 text-sm leading-6 text-foreground">{copy.fileLead}</p>
        <MetaFilePaths chatFolder={copy.fileChatFolder} />
        <h3 className="mt-4 text-sm font-semibold text-accent-deep">
          {copy.fileFindTitle}
        </h3>
        <ol className="mt-3 space-y-3">
          {copy.fileFindItems.map((item, index) => (
            <li key={item} className="flex gap-3 text-sm leading-6">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-deep">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </section>

      <MetaPinyinConverter
        title={copy.pinyinTitle}
        lead={copy.pinyinLead}
        resultLabel={copy.pinyinResult}
        folderPattern={copy.pinyinFolder}
      />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/#import"
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dim"
        >
          {t("guideGoImport")}
        </Link>
        <a
          href={copy.officialHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-card-border bg-white px-5 py-2.5 text-sm font-medium text-accent-deep transition hover:border-accent hover:bg-accent/10"
        >
          {t("guideOfficialHelpMeta")}
        </a>
      </div>
    </article>
  );
}

const META_FILE_PATHS = [
  {
    label: "Messenger",
    Logo: MessengerLogo,
    folders: ["your_facebook_activity", "messages", "inbox"],
  },
  {
    label: "Instagram",
    Logo: InstagramLogo,
    folders: ["your_instagram_activity", "messages", "inbox"],
  },
  {
    label: "Threads",
    Logo: ThreadsLogo,
    folders: ["messages", "inbox"],
  },
] as const;

function MetaFilePaths({ chatFolder }: { chatFolder: string }) {
  return (
    <div className="mt-3 space-y-2.5">
      {META_FILE_PATHS.map((row) => {
        const parts = [
          ...row.folders.map((folder) => ({ kind: "folder" as const, text: folder })),
          { kind: "chat" as const, text: chatFolder },
          { kind: "file" as const, text: "message_1.json" },
        ];
        return (
          <div
            key={row.label}
            className="rounded-xl border border-card-border/80 bg-white px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <row.Logo size={20} />
              <p className="text-sm font-semibold text-accent-deep">{row.label}</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-y-1.5">
              {parts.map((part, index) => (
                <span key={`${part.kind}-${part.text}`} className="inline-flex items-center">
                  {index > 0 ? (
                    <span className="px-1 text-[11px] text-muted" aria-hidden>
                      /
                    </span>
                  ) : null}
                  <span
                    className={
                      part.kind === "file"
                        ? "rounded-md bg-accent/20 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-accent-deep sm:text-xs"
                        : part.kind === "chat"
                          ? "rounded-md border border-dashed border-accent/45 bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] text-accent-deep sm:text-xs"
                          : "rounded-md bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground sm:text-xs"
                    }
                  >
                    {part.text}
                  </span>
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetaPinyinConverter({
  title,
  lead,
  resultLabel,
  folderPattern,
}: {
  title: string;
  lead: string;
  resultLabel: string;
  folderPattern: string;
}) {
  const [name, setName] = useState("");
  const slug = toPinyinSlug(name);

  return (
    <section className="mt-4 rounded-2xl border border-card-border bg-card px-4 py-4 sm:px-5 sm:py-5">
      <h2 className="text-base font-bold text-accent-deep">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-foreground">{lead}</p>
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        className="mt-3 w-full rounded-xl border border-card-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent"
      />
      {slug ? (
        <div className="mt-3 rounded-xl bg-accent/10 px-3 py-2.5">
          <p className="text-xs font-medium text-accent-deep">{resultLabel}</p>
          <p className="mt-1 font-mono text-sm font-semibold text-foreground">
            {folderPattern.replace("{slug}", slug)}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function NoticeIcon({ label }: { label: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-label={label}
      className="size-5 shrink-0 text-accent-deep"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3.4-9.1 16.2a1 1 0 0 0 .87 1.5h16.46a1 1 0 0 0 .87-1.5L12 3.4Z" />
      <path d="M12 9.5v5" />
      <path d="M12 17.2h.01" />
    </svg>
  );
}
