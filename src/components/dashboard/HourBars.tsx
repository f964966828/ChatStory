"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  BarYAxis,
  ChartGrid,
  niceAxisMax,
} from "@/components/dashboard/chart-axis";
import { pad2 } from "@/components/dashboard/date-utils";
import { EXPORT_IDLE_EVENT, isFineMousePointer } from "@/components/dashboard/export-idle";
import { formatNumber } from "@/lib/analyze";

const HOUR_LABELS = ["00", "04", "08", "12", "16", "20", "24"];

export function HourBars({ hourly }: { hourly: number[] }) {
  const { t, locale } = useLocale();
  const [hover, setHover] = useState<number | null>(null);
  const lastTouchAt = useRef(0);
  const values =
    hourly.length === 24
      ? hourly
      : Array.from(
          { length: 24 },
          (_, i) =>
            [18, 22, 28, 36, 44, 58, 40, 52, 70, 88, 76, 64][Math.floor(i / 2)] ??
            20,
        );
  const max = Math.max(...values, 1);
  const numberLocale = locale === "en" ? "en" : "zh";
  const axisMax = niceAxisMax(max);
  const peaks = values
    .map((count, hour) => ({ hour, count }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.hour - b.hour)
    .slice(0, 3);
  const rankByHour = new Map(
    peaks.map((item, index) => [item.hour, index + 1]),
  );

  useEffect(() => {
    const onIdle = () => setHover(null);
    window.addEventListener(EXPORT_IDLE_EVENT, onIdle);
    return () => window.removeEventListener(EXPORT_IDLE_EVENT, onIdle);
  }, []);

  return (
    <div
      onPointerLeave={(event) => {
        if (!isFineMousePointer(event, lastTouchAt.current)) return;
        setHover(null);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <h2 className="shrink-0 whitespace-nowrap text-base font-bold sm:text-lg">
          {t("chartBusyHours")}
        </h2>
        {peaks.length ? (
          <div
            data-peak-chip=""
            className="flex min-w-0 items-center gap-0.5 rounded-full border border-card-border bg-white p-0.5"
          >
            {peaks.map((item, index) => {
              const rank = index + 1;
              const active = hover === item.hour;
              const hourLabel = `${pad2(item.hour)}:00`;
              return (
                <button
                  key={item.hour}
                  type="button"
                  aria-label={t("hourPeakLabel", {
                    rank: String(rank),
                    hour: hourLabel,
                  })}
                  onPointerEnter={(event) => {
                    if (!isFineMousePointer(event, lastTouchAt.current)) return;
                    setHover(item.hour);
                  }}
                  onPointerUp={(event) => {
                    if (event.pointerType === "mouse") return;
                    lastTouchAt.current = performance.now();
                    setHover((current) =>
                      current === item.hour ? null : item.hour,
                    );
                  }}
                  className={`flex min-w-0 items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] transition sm:px-2 sm:text-[11px] ${
                    active
                      ? "bg-accent text-white"
                      : "text-muted hover:text-accent-deep"
                  }`}
                >
                  <span
                    data-peak-rank=""
                    className={`flex size-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold sm:size-4 sm:text-[9px] ${
                      active
                        ? "bg-white text-accent-deep"
                        : "bg-accent-deep text-white"
                    }`}
                  >
                    {rank}
                  </span>
                  <span className="tabular-nums">{hourLabel}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      <div className="mt-2 sm:mt-2">
        <div className="flex min-w-0 items-stretch gap-1 sm:gap-2">
          <div className="pt-3">
            <BarYAxis
              max={max}
              locale={numberLocale}
              className="h-28 sm:h-36"
            />
          </div>
          <div className="relative min-w-0 flex-1 overflow-visible pt-3">
            <div className="relative h-28 overflow-visible sm:h-36">
            <ChartGrid />
            <div className="flex h-full items-end gap-0.5 overflow-visible">
              {values.map((value, i) => {
                const heightPct = (value / axisMax) * 100;
                const rank = rankByHour.get(i);
                const active = hover === i;
                const idleOpacity = rank
                  ? rank === 1
                    ? 1
                    : rank === 2
                      ? 0.86
                      : 0.72
                  : 0.35 + (value / max) * 0.65;
                return (
                  <div
                    key={i}
                    className="relative flex h-full min-w-0 flex-1 cursor-pointer items-end touch-manipulation"
                    onPointerEnter={(event) => {
                      if (!isFineMousePointer(event, lastTouchAt.current)) return;
                      setHover(i);
                    }}
                    onPointerUp={(event) => {
                      if (event.pointerType === "mouse") return;
                      lastTouchAt.current = performance.now();
                      setHover((current) => (current === i ? null : i));
                    }}
                  >
                    <div
                      className="relative w-full origin-bottom transition-transform duration-150"
                      style={{
                        height: `${Math.max(heightPct, value > 0 ? 1.5 : 0)}%`,
                        transform: active ? "scaleY(1.08)" : "scaleY(1)",
                      }}
                    >
                      <div
                        data-export-chart-bar="true"
                        className={`h-full w-full rounded-t transition-[opacity,background-color] duration-150 ${
                          active || rank ? "bg-accent-deep" : "bg-accent/80"
                        }`}
                        style={{
                          opacity:
                            active ? 1 : hover != null ? 0.22 : idleOpacity,
                        }}
                      />
                      {rank && !active ? (
                        <span
                          className="pointer-events-none absolute left-1/2 top-0 z-10 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent-deep sm:size-2"
                          style={{
                            opacity: hover != null ? 0.22 : 1,
                          }}
                        />
                      ) : null}
                    </div>
                    {active ? (
                      <div
                        className={`pointer-events-none absolute z-20 rounded-lg bg-foreground px-2 py-1 font-mono text-[11px] whitespace-nowrap text-white shadow-sm ${
                          i < 3
                            ? "left-0"
                            : i > 20
                              ? "right-0"
                              : "left-1/2 -translate-x-1/2"
                        }`}
                        style={{
                          bottom: `calc(${Math.max(heightPct, 1.5)}% + 8px)`,
                        }}
                      >
                        {t("hourTooltip", {
                          hour: `${pad2(i)}:00`,
                          count: formatNumber(value, numberLocale),
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-between pl-7 font-mono text-[10px] text-muted sm:pl-11 sm:text-[11px]">
          {HOUR_LABELS.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
