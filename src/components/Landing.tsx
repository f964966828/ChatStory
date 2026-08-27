"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/components/ChatProvider";
import { ImportGuide } from "@/components/ImportGuide";
import { useLocale } from "@/components/LocaleProvider";
import type { ImportPlatform } from "@/lib/chat-types";
import { acceptForPlatform, importChatFile, isAllowedFileType } from "@/lib/import-chat";
import type { MessageKey } from "@/lib/messages";
import { SITE_LINKS } from "@/lib/site-links";

type LandingProps = {
  onPreviewDashboard: () => void;
  onImported: () => void;
};

export function Landing({ onPreviewDashboard, onImported }: LandingProps) {
  const { t } = useLocale();
  const { addImportedChat } = useChat();
  const [platform, setPlatform] = useState<ImportPlatform>("line");
  const [error, setError] = useState<MessageKey | null>(null);
  const [reading, setReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.location.hash !== "#import") return;
    document.getElementById("import")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const features = [
    {
      icon: "🌙",
      titleKey: "featureHourTitle",
      bodyKey: "featureHourBody",
    },
    {
      icon: "📅",
      titleKey: "featureDayTitle",
      bodyKey: "featureDayBody",
    },
    {
      icon: "👋",
      titleKey: "featureInitiativeTitle",
      bodyKey: "featureInitiativeBody",
    },
    {
      icon: "☁️",
      titleKey: "featureEmojiTitle",
      bodyKey: "featureEmojiBody",
    },
  ] as const;

  const fileHint = {
    name: platform === "line" ? "LINE" : "Meta",
    ext: platform === "line" ? "txt" : "json",
  };
  const errorText =
    error === "uploadErrorType"
      ? t("uploadErrorType", fileHint)
      : error
        ? t(error)
        : null;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!isAllowedFileType(file, platform)) {
      setError("uploadErrorType");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setReading(true);
    try {
      const parsed = await importChatFile(file, platform);
      addImportedChat(parsed, file.name, platform);
      onImported();
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "";
      if (code === "FILE_TOO_LARGE") setError("uploadErrorLarge");
      else if (code === "EMPTY_CHAT") setError("uploadErrorEmpty");
      else if (code === "WRONG_FILE_TYPE") setError("uploadErrorType");
      else if (code === "NOT_TWO_USERS") setError("uploadErrorTwoUsers");
      else if (code === "PARSE_FAILED") setError("uploadErrorParse");
      else setError("uploadErrorGeneric");
    } finally {
      setReading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-8 sm:px-6 sm:py-14">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptForPlatform(platform)}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <p className="inline-flex items-center rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-deep">
              {t("privacyBadge")}
            </p>
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {t("heroLine1")}
            <span className="mt-1 block text-accent-deep">{t("heroLine2")}</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted">
            {t("heroBody")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={onPreviewDashboard}
              className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dim sm:w-auto sm:py-2.5"
            >
              {t("previewDashboard")}
            </button>
          </div>
        </div>

        <Dropzone
          platform={platform}
          reading={reading}
          errorText={errorText}
          onPlatformChange={(next) => {
            setPlatform(next);
            setError(null);
          }}
          onFile={handleFile}
          onPickFile={() => fileInputRef.current?.click()}
        />
      </section>

      <ImportGuide />

      <section className="mt-12 sm:mt-16">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-accent-deep">{t("vizTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("vizBody")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {features.map((item) => (
            <article
              key={item.titleKey}
              className="rounded-2xl border border-card-border bg-card p-4 sm:p-5"
            >
              <p className="text-lg">{item.icon}</p>
              <h3 className="mt-3 text-sm font-semibold">
                {t(item.titleKey as MessageKey)}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                {t(item.bodyKey as MessageKey)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="mt-12 scroll-mt-28 sm:mt-16">
        <h2 className="text-lg font-bold text-accent-deep">{t("faqTitle")}</h2>
        <div className="mt-5 space-y-3">
          <article className="rounded-2xl border border-card-border bg-card p-5">
            <h3 className="text-sm font-semibold text-accent-deep">
              Q. {t("faqExportQ")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              A. {t("faqExportA")}
            </p>
          </article>
          <article className="rounded-2xl border border-card-border bg-card p-5">
            <h3 className="text-sm font-semibold text-accent-deep">
              Q. {t("faqSecurityQ")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              A. {t("faqSecurityA")}
              <SourceCodeLink />
              {t("faqSecurityAAfter")}
            </p>
          </article>
          <article className="rounded-2xl border border-card-border bg-card p-5">
            <h3 className="text-sm font-semibold text-accent-deep">
              Q. {t("faqGroupQ")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              A. {t("faqGroupA")}
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

const IMPORT_PLATFORMS: { id: ImportPlatform; label: string }[] = [
  { id: "line", label: "LINE" },
  { id: "meta", label: "Meta" },
];

function Dropzone({
  platform,
  reading,
  errorText,
  onPlatformChange,
  onFile,
  onPickFile,
}: {
  platform: ImportPlatform;
  reading: boolean;
  errorText: string | null;
  onPlatformChange: (platform: ImportPlatform) => void;
  onFile: (file: File | undefined) => void;
  onPickFile: () => void;
}) {
  const { t } = useLocale();
  const [dragging, setDragging] = useState(false);
  const selected = IMPORT_PLATFORMS.find((item) => item.id === platform);

  return (
    <div
      id="import"
      role="button"
      tabIndex={0}
      onClick={onPickFile}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPickFile();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        onFile(event.dataTransfer.files[0]);
      }}
      className={`rounded-3xl border border-dashed bg-white p-5 text-center shadow-sm transition sm:p-8 ${
        dragging ? "border-accent bg-accent/10" : "border-accent/50"
      }`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white">
        <UploadIcon />
      </div>
      <p className="mt-4 text-sm font-medium">
        {dragging ? t("dropActive") : t("dropTitle")}
      </p>
      <p className={`mt-1 text-sm ${errorText ? "text-rose-500" : "text-muted"}`}>
        {errorText
          ? errorText
          : reading
            ? t("uploadReading")
            : t("currentlySelected", {
                name: selected?.label ?? "",
                ext: platform === "line" ? "txt" : "json",
              })}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5 text-sm sm:text-base">
        {IMPORT_PLATFORMS.map((item) => {
          const active = item.id === platform;
          return (
            <button
              key={item.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onPlatformChange(item.id);
              }}
              className={
                active
                  ? "rounded-full bg-accent px-5 py-2 font-semibold text-white transition hover:bg-accent-dim sm:px-6 sm:py-2.5"
                  : "rounded-full border border-card-border bg-white px-5 py-2 font-semibold text-accent-deep transition hover:border-accent hover:bg-accent/10 sm:px-6 sm:py-2.5"
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SourceCodeLink() {
  const className = "font-medium text-accent-deep underline decoration-accent/40 underline-offset-2";
  if (SITE_LINKS.github) {
    return (
      <a
        href={SITE_LINKS.github}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        source code
      </a>
    );
  }
  return <span className="font-medium text-accent-deep">source code</span>;
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V6m0 0 4 4M12 6 8 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
