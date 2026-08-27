"use client";

import { useLocale } from "@/components/LocaleProvider";
import { formatNumber } from "@/lib/analyze";
import type { ImportPlatform, ParsedChat } from "@/lib/chat-types";

export type PendingImport = {
  parsed: ParsedChat;
  fileName: string;
  platform: ImportPlatform;
};

export function ImportReview({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: PendingImport;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t, locale } = useLocale();
  const { parsed, fileName, platform } = pending;
  const range = formatMessageRange(parsed.messages, locale);

  const rows = [
    { label: t("importReviewFile"), value: fileName },
    {
      label: t("importReviewPlatform"),
      value: platform === "line" ? "LINE" : "Meta",
    },
    {
      label: t("importReviewPeople"),
      value: `${parsed.usernameA} · ${parsed.usernameB}`,
    },
    {
      label: t("importReviewMessages"),
      value: formatNumber(parsed.messages.length, locale),
    },
    { label: t("importReviewRange"), value: range },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-8 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-xl rounded-3xl border border-card-border bg-card p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-accent-deep sm:text-3xl">
          {t("importReviewTitle")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {t("importReviewBody")}
        </p>
        <dl className="mt-6 divide-y divide-card-border border-y border-card-border">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 py-3 text-sm"
            >
              <dt className="shrink-0 text-muted">{row.label}</dt>
              <dd className="min-w-0 text-right font-medium break-words">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dim sm:py-2.5"
          >
            {t("importReviewConfirm")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-card-border bg-white px-5 py-3 text-sm font-semibold text-accent-deep transition hover:border-accent hover:bg-accent/10 sm:py-2.5"
          >
            {t("importReviewAnother")}
          </button>
        </div>
      </section>
    </main>
  );
}

function formatMessageRange(
  messages: ParsedChat["messages"],
  locale: string,
) {
  if (messages.length === 0) return "—";
  let start = messages[0].timestamp;
  let end = messages[0].timestamp;
  for (const message of messages) {
    if (message.timestamp < start) start = message.timestamp;
    if (message.timestamp > end) end = message.timestamp;
  }
  return `${formatReviewDate(start, locale)} – ${formatReviewDate(end, locale)}`;
}

function formatReviewDate(timestamp: number, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en" : "zh-Hant", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}
