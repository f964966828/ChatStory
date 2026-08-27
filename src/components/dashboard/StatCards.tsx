"use client";

import { useEffect, useState } from "react";
import type { StoredDashboard } from "@/components/ChatProvider";
import { useLocale } from "@/components/LocaleProvider";
import { EXPORT_IDLE_EVENT } from "@/components/dashboard/export-idle";
import type { MessageKey } from "@/lib/messages";

export type StatCardData = {
  key: MessageKey;
  value: string;
  detail?: string;
  featured?: boolean;
  compact?: boolean;
  breakdown?: { name: string; count: string }[];
  onJump?: () => void;
};

export function StatCard({
  stat,
  featured = false,
}: {
  stat: StatCardData;
  featured?: boolean;
}) {
  const { t } = useLocale();
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);
  const canHover = !stat.onJump;

  useEffect(() => {
    if (!canHover || !hover) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(`[data-stat-hover="${stat.key}"]`)) return;
      setHover(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [canHover, hover, stat.key]);

  useEffect(() => {
    const onIdle = () => setHover(false);
    window.addEventListener(EXPORT_IDLE_EVENT, onIdle);
    return () => window.removeEventListener(EXPORT_IDLE_EVENT, onIdle);
  }, []);

  if (featured) {
    return (
      <article
        data-stat-hover={stat.key}
        onPointerUp={(event) => {
          if (event.pointerType !== "touch") return;
          setHover((current) => !current);
        }}
        onPointerEnter={(event) => {
          if (event.pointerType !== "mouse") return;
          if (!window.matchMedia("(hover: hover)").matches) return;
          setHover(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== "mouse") return;
          if (!window.matchMedia("(hover: hover)").matches) return;
          setHover(false);
        }}
        className={`flex h-full min-h-48 min-w-0 flex-col overflow-visible rounded-2xl border bg-white transition-[border-color] duration-200 lg:min-h-0 ${
          hover ? "border-accent" : "border-card-border"
        }`}
      >
        <p className="px-4 pt-4 text-left text-lg font-medium tracking-wide text-black sm:px-5 sm:pt-5 sm:text-xl">
          {t(stat.key)}
        </p>
        <div className="flex flex-1 items-center justify-center px-4 text-center sm:px-5">
          <p
            data-stat-hover-value=""
            data-stat-featured-value=""
            className={`inline-block break-all font-mono text-6xl font-bold leading-[0.9] tracking-tighter text-accent-deep transition duration-200 sm:text-[4.25rem] ${
              hover ? "scale-[1.08] -translate-y-1" : ""
            }`}
          >
            {stat.value}
          </p>
        </div>
        {stat.breakdown?.length ? (
          <ul className="grid grid-cols-2 overflow-hidden rounded-b-2xl border-t border-stone-100">
            {stat.breakdown.map((item, index) => (
              <li
                key={index}
                className="min-w-0 px-4 py-3 text-center first:border-r first:border-stone-100 sm:px-5"
              >
                <p className="truncate text-xs text-muted sm:text-sm">{item.name}</p>
                <p
                  data-stat-hover-value=""
                  className={`mt-1 inline-block font-mono text-lg font-semibold transition duration-200 ${
                    hover
                      ? "scale-110 -translate-y-0.5 text-accent-deep"
                      : "text-black"
                  }`}
                >
                  {item.count}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    );
  }
  return (
    <article
      data-chat-jump={stat.onJump ? "true" : undefined}
      data-stat-hover={canHover ? stat.key : undefined}
      role={stat.onJump ? "button" : undefined}
      tabIndex={stat.onJump ? 0 : undefined}
      onClick={stat.onJump}
      onPointerDown={stat.onJump ? () => setPressed(true) : undefined}
      onPointerUp={(event) => {
        setPressed(false);
        if (!canHover || event.pointerType !== "touch") return;
        setHover((current) => !current);
      }}
      onPointerEnter={(event) => {
        if (!canHover) return;
        if (event.pointerType !== "mouse") return;
        if (!window.matchMedia("(hover: hover)").matches) return;
        setHover(true);
      }}
      onPointerLeave={(event) => {
        setPressed(false);
        if (!canHover) return;
        if (event.pointerType !== "mouse") return;
        if (!window.matchMedia("(hover: hover)").matches) return;
        setHover(false);
      }}
      onPointerCancel={() => setPressed(false)}
      onKeyDown={
        stat.onJump
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                stat.onJump?.();
              }
            }
          : undefined
      }
      className={`group flex h-full min-w-0 flex-col rounded-2xl border bg-card px-3 py-3 sm:px-4 sm:py-4 ${
        stat.onJump
          ? `cursor-pointer select-none border-card-border transition duration-200 hover:border-accent hover:shadow-[0_6px_18px_-10px_rgb(124,92,191,0.55)] ${
              pressed
                ? "scale-[0.96] border-accent bg-accent/15"
                : ""
            }`
          : `transition-[border-color] duration-200 ${
              hover ? "border-accent" : "border-card-border"
            }`
      }`}
    >
      <p className="w-full text-left text-xs text-muted sm:text-sm">{t(stat.key)}</p>
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center text-center">
        <p
          data-stat-hover-value={canHover || stat.onJump ? "" : undefined}
          className={`mt-1.5 inline-block max-w-full font-mono font-semibold tracking-tight transition duration-200 sm:mt-2 ${
            stat.compact
              ? "truncate text-sm leading-tight sm:text-lg lg:text-xl"
              : "truncate text-lg leading-tight sm:text-2xl"
          } ${
            canHover && hover
              ? "scale-110 -translate-y-1 text-accent-deep"
              : ""
          } ${
            stat.onJump
              ? "group-hover:scale-110 group-hover:-translate-y-1"
              : ""
          }`}
        >
          {stat.value}
        </p>
        {stat.breakdown?.length ? (
          <ul className="mt-3 w-full space-y-1 text-sm sm:mt-4 sm:space-y-1.5">
            {stat.breakdown.map((item) => (
              <li
                key={item.name}
                className="flex min-w-0 flex-col items-center gap-0.5"
              >
                <span className="min-w-0 truncate font-medium text-black">
                  {item.name}
                </span>
                <span
                  data-stat-hover-value=""
                  className={`inline-block shrink-0 font-mono text-black transition duration-200 ${
                    hover ? "scale-110 -translate-y-0.5" : ""
                  }`}
                >
                  {item.count}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {stat.detail ? (
          <p
            data-stat-hover-value=""
            className={`mt-1 inline-block max-w-full truncate font-mono text-[11px] text-muted transition duration-200 sm:text-xs ${
              canHover && hover ? "scale-105 -translate-y-0.5" : ""
            } ${
              stat.onJump
                ? "group-hover:scale-105 group-hover:-translate-y-0.5"
                : ""
            }`}
          >
            {stat.detail}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function DashboardTabs({
  dashboards,
  activeId,
  onSelect,
}: {
  dashboards: StoredDashboard[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useLocale();

  return (
    <div className="flex flex-wrap gap-1.5">
      {dashboards.map((board) => {
        const selected = board.id === activeId;
        return (
          <button
            key={board.id}
            type="button"
            onClick={() => onSelect(board.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              selected
                ? "border-accent bg-accent text-white shadow-sm"
                : "border-card-border bg-white text-muted hover:border-accent hover:text-accent-deep"
            }`}
          >
            {dashboardLabel(board, t)}
          </button>
        );
      })}
    </div>
  );
}

export function dashboardLabel(
  board: StoredDashboard,
  t: (key: MessageKey, vars?: Record<string, string>) => string,
) {
  return board.kind === "default"
    ? t("dashboardDefault")
    : board.kind === "merge"
      ? t("dashboardMerge", { n: String(board.mergeIndex ?? 1) })
      : t("dashboardImport", { n: String(board.importIndex ?? 1) });
}
