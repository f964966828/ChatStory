"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  BarYAxis,
  ChartGrid,
  niceAxisMax,
  useNarrow,
} from "@/components/dashboard/chart-axis";
import {
  fillMonthly,
  fillWeekly,
  fillYearly,
  formatPeriodKey,
  formatWeekRange,
  yearTicksForSeries,
} from "@/components/dashboard/date-utils";
import { EXPORT_IDLE_EVENT, isFineMousePointer } from "@/components/dashboard/export-idle";
import { formatNumber, type ChatAnalysis } from "@/lib/analyze";

export function TimelineChart({
  monthly,
  daily,
  locale,
}: {
  monthly: ChatAnalysis["monthly"];
  daily: ChatAnalysis["daily"];
  locale: string;
}) {
  const { t } = useLocale();
  const [grain, setGrain] = useState<"week" | "month" | "year">("month");
  const series = useMemo(() => {
    if (grain === "week") return fillWeekly(daily);
    const months = fillMonthly(monthly);
    return grain === "year" ? fillYearly(months) : months;
  }, [monthly, daily, grain]);
  const lastIndex = Math.max(series.length - 1, 0);
  const yearTicks = useMemo(
    () => yearTicksForSeries(series, lastIndex),
    [series, lastIndex],
  );
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(lastIndex);
  const [hover, setHover] = useState<number | null>(null);
  const lastTouchAt = useRef(0);
  const narrow = useNarrow();
  const maxSpan = (narrow ? 48 : 72) - 1;
  const startLabel =
    grain === "year"
      ? t("chartRangeStartYear")
      : grain === "week"
        ? t("chartRangeStartWeek")
        : t("chartRangeStart");
  const endLabel =
    grain === "year"
      ? t("chartRangeEndYear")
      : grain === "week"
        ? t("chartRangeEndWeek")
        : t("chartRangeEnd");

  useEffect(() => {
    const last = Math.max(series.length - 1, 0);
    if (last <= maxSpan) {
      setStart(0);
      setEnd(last);
      return;
    }
    setStart(last - maxSpan);
    setEnd(last);
  }, [series, grain, maxSpan]);

  useEffect(() => {
    const onIdle = () => setHover(null);
    window.addEventListener(EXPORT_IDLE_EVENT, onIdle);
    return () => window.removeEventListener(EXPORT_IDLE_EVENT, onIdle);
  }, []);

  const from = Math.min(start, end);
  const to = Math.max(start, end);
  const bars = series.slice(from, to + 1).map((item) => ({
    key: item.key,
    count: item.a + item.b,
  }));
  const max = Math.max(...bars.map((item) => item.count), 1);
  const periodFrom = series[from]?.key ?? "";
  const periodTo = series[to]?.key ?? "";
  const labels = [
    formatPeriodKey(periodFrom, grain),
    formatPeriodKey(
      bars[Math.floor(bars.length / 2)]?.key ?? periodFrom,
      grain,
    ),
    formatPeriodKey(periodTo, grain),
  ];
  const leftPct = lastIndex ? (from / lastIndex) * 100 : 0;
  const rightPct = lastIndex ? (to / lastIndex) * 100 : 100;
  const widthPct = lastIndex ? ((to - from) / lastIndex) * 100 : 100;
  const numberLocale = locale === "en" ? "en" : "zh";
  const axisMax = niceAxisMax(max);
  const peaks = bars
    .map((item, index) => ({ ...item, index }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || b.index - a.index)
    .slice(0, 1);
  const rankByIndex = new Map(
    peaks.map((item, index) => [item.index, index + 1]),
  );

  return (
    <div className="min-w-0">
      <div className="relative flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <h2 className="shrink-0 text-base font-bold sm:text-lg">{t("chartWhenMost")}</h2>
        <div className="flex min-w-0 items-center gap-2">
          {peaks.length ? (
            <div
              data-peak-chip=""
              className="flex min-w-0 items-center gap-0.5 rounded-full border border-card-border bg-white p-0.5"
            >
              {peaks.map((item) => {
                const rank = rankByIndex.get(item.index) ?? 0;
                const active = hover === item.index;
                const label = formatPeriodKey(item.key, grain);
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-label={t("hourPeakLabel", {
                      rank: String(rank),
                      hour: label,
                    })}
                    onPointerEnter={(event) => {
                      if (!isFineMousePointer(event, lastTouchAt.current)) return;
                      setHover(item.index);
                    }}
                    onPointerUp={(event) => {
                      if (event.pointerType === "mouse") return;
                      lastTouchAt.current = performance.now();
                      setHover((current) =>
                        current === item.index ? null : item.index,
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
                    <span className="truncate tabular-nums">{label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        <div
          data-export-ignore="true"
          className="flex shrink-0 items-center gap-1 rounded-full border border-card-border bg-white p-0.5 text-xs font-medium"
          style={{ backgroundColor: "#ffffff" }}
        >
          {(
            [
              ["week", "chartPeriodWeek"],
              ["month", "chartPeriodMonth"],
              ["year", "chartPeriodYear"],
            ] as const
          ).map(([value, key]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setGrain(value);
                setHover(null);
              }}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                backgroundColor: grain === value ? "#b794f6" : "#ffffff",
                color: grain === value ? "#ffffff" : "#78716c",
              }}
              className={`border-0 rounded-full px-2.5 py-1 transition ${
                grain === value
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:bg-accent/10 hover:text-accent-deep"
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>
        <div
          data-export-visible="true"
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full border border-card-border bg-white p-0.5 text-xs font-medium opacity-0"
          style={{ backgroundColor: "#ffffff" }}
        >
          {(
            [
              ["week", "chartPeriodWeek"],
              ["month", "chartPeriodMonth"],
              ["year", "chartPeriodYear"],
            ] as const
          ).map(([value, key]) => (
            <span
              key={value}
              className="rounded-full px-2.5 py-1"
              style={{
                backgroundColor: grain === value ? "#b794f6" : "#ffffff",
                color: grain === value ? "#ffffff" : "#78716c",
              }}
            >
              {t(key)}
            </span>
          ))}
        </div>
        </div>
      </div>
      <div className="mt-3 min-w-0 sm:mt-3.5">
      <div className="flex min-w-0 items-stretch gap-1 sm:gap-2">
        <div className="pt-3">
          <BarYAxis
            max={max}
            locale={numberLocale}
            className="h-28 sm:h-36"
          />
        </div>
        <div
          className="relative min-w-0 flex-1 overflow-visible pt-3"
          onPointerLeave={(event) => {
            if (!isFineMousePointer(event, lastTouchAt.current)) return;
            setHover(null);
          }}
        >
          <div className="relative h-28 overflow-visible sm:h-36">
          <ChartGrid />
          <div className="flex h-full items-end gap-px overflow-visible sm:gap-0.5">
            {bars.map((item, i) => {
              const heightPct = (item.count / axisMax) * 100;
              const rank = rankByIndex.get(i);
              const active = hover === i;
              const idleOpacity = rank
                ? rank === 1
                  ? 1
                  : rank === 2
                    ? 0.86
                    : 0.72
                : 0.35 + (item.count / max) * 0.65;
              return (
                <div
                  key={item.key}
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
                      height: `${Math.max(heightPct, item.count > 0 ? 1.5 : 0)}%`,
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
                    {active ? (
                      <div
                        className={`pointer-events-none absolute bottom-full z-20 mb-1.5 rounded-lg bg-foreground px-2 py-1 font-mono text-[11px] whitespace-nowrap text-white shadow-sm ${
                          i < 2
                            ? "left-0"
                            : i > bars.length - 3
                              ? "right-0"
                              : "left-1/2 -translate-x-1/2"
                        }`}
                      >
                        {t("dayTooltip", {
                          date:
                            grain === "week"
                              ? formatWeekRange(item.key)
                              : formatPeriodKey(item.key, grain),
                          count: formatNumber(item.count, numberLocale),
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </div>
      <div className="mt-1 flex justify-between gap-1 pl-7 font-mono text-[10px] text-muted sm:pl-11 sm:text-[11px]">
        {labels.map((label, index) => (
          <span key={`${label}-${index}`} className="whitespace-nowrap">
            {label}
          </span>
        ))}
      </div>
      {series.length > 1 ? (
        <div className="mt-3 min-w-0 pl-7 sm:mt-4 sm:pl-11">
          {yearTicks.length > 1 ? (
            <div className="relative mb-0.5 h-4" aria-hidden="true">
              {yearTicks.map((tick) => (
                <span
                  key={tick.year}
                  className="absolute top-0 font-mono text-[10px] whitespace-nowrap text-muted/70"
                  style={{
                    left: `${tick.pct}%`,
                    transform: `translateX(-${tick.pct}%)`,
                  }}
                >
                  {tick.year}
                </span>
              ))}
            </div>
          ) : null}
          <div className="relative h-8 touch-none overflow-hidden sm:h-6">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent/20" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent"
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            />
            {yearTicks.map((tick) => (
              <div
                key={`tick-${tick.year}`}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 bg-muted/45"
                style={{ left: `${tick.pct}%` }}
              />
            ))}
            <div
              data-export-visible="true"
              className={`pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-white bg-accent-deep opacity-0 shadow-sm ${
                leftPct > 0 ? "-translate-x-1/2" : ""
              }`}
              style={{ left: `${leftPct}%` }}
            />
            <div
              data-export-visible="true"
              className={`pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-white bg-accent-deep opacity-0 shadow-sm ${
                rightPct >= 100 ? "-translate-x-full" : "-translate-x-1/2"
              }`}
              style={{ left: `${rightPct}%` }}
            />
            <input
              data-export-ignore="true"
              type="range"
              min={0}
              max={lastIndex}
              value={from}
              aria-label={startLabel}
              className="time-range absolute inset-0 w-full"
              onChange={(event) => {
                const next = Number(event.target.value);
                setStart(next);
                if (next > to) {
                  setEnd(next);
                } else if (to - next > maxSpan) {
                  setEnd(next + maxSpan);
                }
              }}
            />
            <input
              data-export-ignore="true"
              type="range"
              min={0}
              max={lastIndex}
              value={to}
              aria-label={endLabel}
              className="time-range absolute inset-0 w-full"
              onChange={(event) => {
                const next = Number(event.target.value);
                setEnd(next);
                if (next < from) {
                  setStart(next);
                } else if (next - from > maxSpan) {
                  setStart(next - maxSpan);
                }
              }}
            />
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
