"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { EXPORT_IDLE_EVENT } from "@/components/dashboard/export-idle";
import { formatDuration } from "@/lib/analyze";

export function InitiativeCompare({
  people,
  format,
}: {
  people: {
    name: string;
    initiated: number;
    avgChars: number;
    avgReplyMs: number;
  }[];
  format: (value: number) => string;
}) {
  const { t } = useLocale();
  const [hover, setHover] = useState<string | null>(null);
  const pair = people.slice(0, 2);
  const mostInitiated = pair.reduce((best, person) =>
    person.initiated > best.initiated ? person : best,
  );
  const longest = pair.reduce((best, person) =>
    person.avgChars > best.avgChars ? person : best,
  );
  const replyCandidates = pair.filter((person) => person.avgReplyMs > 0);
  const fastest = replyCandidates.length
    ? replyCandidates.reduce((best, person) =>
        person.avgReplyMs < best.avgReplyMs ? person : best,
      )
    : pair[0];
  const insights = [
    {
      key: "initiated" as const,
      person: mostInitiated,
      text: t("initiativeStarts"),
      values: pair.map((person) =>
        t("initiativeTimes", { count: format(person.initiated) }),
      ),
    },
    {
      key: "avgReplyMs" as const,
      person: fastest,
      text: t("initiativeRepliesFaster"),
      values: pair.map((person) =>
        person.avgReplyMs > 0 ? formatDuration(person.avgReplyMs) : "—",
      ),
    },
    {
      key: "avgChars" as const,
      person: longest,
      text: t("initiativeWritesLonger"),
      values: pair.map((person) =>
        t("initiativeCharacters", { count: format(person.avgChars) }),
      ),
    },
  ];

  useEffect(() => {
    if (!hover) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-initiative-card]")) return;
      setHover(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [hover]);

  useEffect(() => {
    const onIdle = () => setHover(null);
    window.addEventListener(EXPORT_IDLE_EVENT, onIdle);
    return () => window.removeEventListener(EXPORT_IDLE_EVENT, onIdle);
  }, []);

  return (
    <div className="grid h-full min-w-0 grid-cols-3 gap-2 sm:gap-3">
      {insights.map((insight) => {
        const winnerIndex = pair.findIndex(
          (person) => person === insight.person,
        );
        const otherIndex = winnerIndex === 0 ? 1 : 0;
        const active = hover === insight.key;
        return (
          <article
            key={insight.key}
            data-initiative-card=""
            onPointerEnter={(event) => {
              if (event.pointerType !== "mouse") return;
              if (!window.matchMedia("(hover: hover)").matches) return;
              setHover(insight.key);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType !== "mouse") return;
              if (!window.matchMedia("(hover: hover)").matches) return;
              setHover(null);
            }}
            onPointerUp={(event) => {
              if (event.pointerType === "touch") {
                setHover((current) =>
                  current === insight.key ? null : insight.key,
                );
              }
            }}
            className={`flex min-w-0 flex-col rounded-2xl border bg-white p-3 text-center transition duration-200 sm:p-4 ${
              active
                ? "-translate-y-0.5 border-accent shadow-[0_6px_18px_-10px_rgb(124,92,191,0.55)]"
                : "border-card-border shadow-sm"
            }`}
          >
            <div className="mx-auto mb-3 h-1 w-8 rounded-full bg-accent" />
            <p className="text-lg font-bold text-accent-deep sm:text-xl">
              {insight.person?.name ?? "—"}
            </p>
            <p className="mt-1 text-sm font-medium leading-5 text-foreground sm:text-base">
              {insight.text}
            </p>
            <div className="flex flex-1 items-center justify-center py-4">
              <p className="font-mono text-xl font-bold text-accent-deep sm:text-2xl">
                {insight.values[winnerIndex]}
              </p>
            </div>
            <div className="flex items-center justify-between gap-1 border-t border-card-border pt-2">
              <span
                data-initiative-loser=""
                className={`truncate text-[10px] transition-colors duration-200 sm:text-xs ${
                  active ? "text-foreground" : "text-muted"
                }`}
              >
                {pair[otherIndex]?.name}
              </span>
              <span
                data-initiative-loser=""
                className={`font-mono text-xs transition-colors duration-200 sm:text-sm ${
                  active ? "text-black" : "text-muted"
                }`}
              >
                {insight.values[otherIndex]}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
