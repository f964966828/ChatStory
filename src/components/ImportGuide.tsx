"use client";

import {
  InstagramLogo,
  LineLogo,
  MessengerLogo,
  ThreadsLogo,
} from "@/components/PlatformLogos";
import { useLocale } from "@/components/LocaleProvider";
import type { MessageKey } from "@/lib/messages";
import Link from "next/link";
import type { ComponentType } from "react";

const GUIDES: {
  href: string;
  name: string;
  apps?: string;
  hintKey: MessageKey;
  logos: ComponentType<{ size?: number }>[];
}[] = [
  {
    href: "/guides/line",
    name: "LINE",
    hintKey: "importHintLine",
    logos: [LineLogo],
  },
  {
    href: "/guides/meta",
    name: "Meta",
    hintKey: "importHintMeta",
    logos: [MessengerLogo, InstagramLogo, ThreadsLogo],
  },
];

export function ImportGuide() {
  const { t } = useLocale();

  return (
    <section className="mt-12 sm:mt-16">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-accent-deep">
          {t("importGuideTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("importGuideBody")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {GUIDES.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="rounded-3xl border border-card-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              {guide.logos.map((Logo, index) => (
                <Logo key={index} size={44} />
              ))}
            </div>
            <h3 className="mt-3 text-base font-bold text-accent-deep">
              {guide.name}
            </h3>
            {guide.apps ? (
              <p className="mt-0.5 text-xs font-medium text-muted">
                {guide.apps}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-muted">{t(guide.hintKey)}</p>
            <p className="mt-4 text-sm font-medium text-accent-dim">
              {t("viewSteps")}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
