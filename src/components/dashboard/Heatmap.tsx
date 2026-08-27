"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useNarrow } from "@/components/dashboard/chart-axis";
import {
  formatDayKey,
  parseDateKey,
  shiftYears,
  toDateKey,
} from "@/components/dashboard/date-utils";
import { formatNumber, type ChatAnalysis } from "@/lib/analyze";

function MonthBadge({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-heatmap-month=""
      onClick={onClick}
      className={`flex size-9 shrink-0 appearance-none items-center justify-center rounded-full border-0 bg-accent font-semibold leading-none text-white shadow-sm transition duration-200 sm:size-10 ${
        active
          ? "scale-105 ring-2 ring-accent-deep ring-offset-1"
          : "hover:scale-[1.03] active:scale-95"
      }`}
    >
      {label}
    </button>
  );
}

export function Heatmap({
  title,
  daily,
  locale,
  prevLabel,
  nextLabel,
  onJumpDay,
}: {
  title: string;
  daily: ChatAnalysis["daily"];
  locale: string;
  prevLabel: string;
  nextLabel: string;
  onJumpDay?: (date: string) => void;
}) {
  const { t, locale: uiLocale } = useLocale();
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const currentYear = today.getFullYear();
  const minYear = daily.length
    ? parseDateKey(daily[0].date).getFullYear()
    : currentYear;
  const [year, setYear] = useState(currentYear);

  useEffect(() => {
    setYear(currentYear);
  }, [currentYear, daily]);

  const windowStart =
    year === currentYear ? shiftYears(today, -1) : new Date(year, 0, 1);
  const windowEnd =
    year === currentYear ? today : new Date(year, 11, 31);
  const dateLocale = locale === "en" ? "en" : "zh-Hant";
  const countByDate = useMemo(
    () => new Map(daily.map((item) => [item.date, item.count])),
    [daily],
  );
  const { months } = useMemo(
    () => buildRollingHeatmap(windowStart, windowEnd, countByDate, dateLocale),
    [windowStart, windowEnd, countByDate, dateLocale],
  );
  const { activeDays, maxStreak, streakKeys } = useMemo(
    () => heatmapWindowStats(windowStart, windowEnd, countByDate),
    [windowStart, windowEnd, countByDate],
  );
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(
    null,
  );
  const [selectedStat, setSelectedStat] = useState<"active" | "streak" | null>(
    null,
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  const narrow = useNarrow();
  const numberLocale = uiLocale === "en" ? "en" : "zh";
  const weekCount = months.reduce((sum, month) => sum + month.weeks.length, 0);

  useLayoutEffect(() => {
    if (!narrow) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollLeft = scroller.scrollWidth - scroller.clientWidth;
  }, [narrow, year, weekCount]);

  useEffect(() => {
    if (selectedKey == null && selectedMonthIndex == null) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-heatmap-day]")) return;
      if (target.closest("[data-heatmap-month]")) return;
      setSelectedKey(null);
      setSelectedMonthIndex(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [selectedKey, selectedMonthIndex]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="mr-auto shrink-0 whitespace-nowrap text-base font-bold sm:text-lg">
          {title}
        </h2>
        <div className="order-3 flex w-full shrink-0 justify-center gap-2 sm:order-2 sm:w-auto">
          <button
            type="button"
            data-heatmap-stat=""
            onClick={() => {
              setHoverKey(null);
              setSelectedKey(null);
              setSelectedMonthIndex(null);
              setSelectedStat((current) =>
                current === "active" ? null : "active",
              );
            }}
            className={`flex shrink-0 appearance-none items-baseline gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-sm transition sm:px-3.5 sm:py-1.5 sm:text-base ${
              selectedStat === "active"
                ? "border-accent bg-accent/15"
                : "border-card-border bg-white hover:border-accent"
            }`}
          >
            <span
              className={
                selectedStat === "active" ? "text-accent-deep" : "text-muted"
              }
            >
              {t("statActiveDays")}
            </span>
            <span className="font-mono font-semibold text-accent-deep">
              {formatNumber(activeDays, numberLocale)}
            </span>
          </button>
          <button
            type="button"
            data-heatmap-stat=""
            onClick={() => {
              setHoverKey(null);
              setSelectedKey(null);
              setSelectedMonthIndex(null);
              setSelectedStat((current) =>
                current === "streak" ? null : "streak",
              );
            }}
            className={`flex shrink-0 appearance-none items-baseline gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-sm transition sm:px-3.5 sm:py-1.5 sm:text-base ${
              selectedStat === "streak"
                ? "border-accent bg-accent/15"
                : "border-card-border bg-white hover:border-accent"
            }`}
          >
            <span
              className={
                selectedStat === "streak" ? "text-accent-deep" : "text-muted"
              }
            >
              {t("heatmapMaxStreak")}
            </span>
            <span className="font-mono font-semibold text-accent-deep">
              {formatNumber(maxStreak, numberLocale)}
            </span>
          </button>
        </div>
        <div className="order-2 flex items-center gap-1.5 sm:order-3">
          <button
            type="button"
            aria-label={prevLabel}
            disabled={year <= minYear}
            className="rounded-lg px-2.5 py-1 text-xl leading-none text-muted disabled:opacity-30 sm:text-2xl"
            onClick={() => {
              setSelectedKey(null);
              setSelectedMonthIndex(null);
              setYear((current) => Math.max(minYear, current - 1));
            }}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-5 sm:size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span className="w-14 text-center font-mono text-base font-semibold sm:text-lg">
            {year}
          </span>
          <button
            type="button"
            aria-label={nextLabel}
            disabled={year >= currentYear}
            className="rounded-lg px-2.5 py-1 text-xl leading-none text-muted disabled:opacity-30 sm:text-2xl"
            onClick={() => {
              setSelectedKey(null);
              setSelectedMonthIndex(null);
              setYear((current) => Math.min(currentYear, current + 1));
            }}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-5 sm:size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
      <div className="mt-4 min-w-0 sm:mt-5">
        <div
          ref={scrollerRef}
          className="overflow-x-auto pb-4 sm:overflow-visible sm:pb-0"
        >
          <div
            className="px-2 pt-2 sm:min-w-0 sm:px-0 sm:pt-0"
            style={
              narrow
                ? { minWidth: Math.max(weekCount * 16, 400) }
                : undefined
            }
          >
        <div className="mb-2 flex h-9 items-center gap-[3px] font-mono text-xs text-muted sm:h-10 sm:text-sm">
          {months.map((month, monthIndex) => (
            <Fragment key={`label-${month.label}-${monthIndex}`}>
              {monthIndex > 0 ? (
                <span className="min-w-0" style={{ flex: 0.5 }} />
              ) : null}
              <span
                className="flex min-w-0 items-center justify-center overflow-visible"
                style={{ flex: month.weeks.length }}
              >
                {month.showLabel ? (
                  month.perfect ? (
                    <MonthBadge
                      label={month.label}
                      active={selectedMonthIndex === monthIndex}
                      onClick={() => {
                        setHoverKey(null);
                        setSelectedKey(null);
                        setSelectedMonthIndex((current) =>
                          current === monthIndex ? null : monthIndex,
                        );
                      }}
                    />
                  ) : (
                    <span className="whitespace-nowrap">{month.label}</span>
                  )
                ) : null}
              </span>
            </Fragment>
          ))}
        </div>
        <div
            className="flex min-w-0 flex-1 gap-[3px] overflow-visible"
            onMouseLeave={() => setHoverKey(null)}
          >
            {months.map((month, monthIndex) => {
              let weekOffset = 0;
              for (let i = 0; i < monthIndex; i += 1) {
                weekOffset += months[i].weeks.length;
              }
              return (
                <Fragment key={`${month.label}-${monthIndex}`}>
                  {monthIndex > 0 ? (
                    <div className="min-w-0" style={{ flex: 0.5 }} />
                  ) : null}
                  {month.weeks.map((week, weekIndex) => {
                    const col = weekOffset + weekIndex;
                    return (
                      <div
                        key={`${month.label}-${weekIndex}`}
                        className="flex min-w-0 flex-1 flex-col gap-[3px]"
                      >
                        {week.map((cell, row) => {
                          const hovered = hoverKey === cell.key;
                          const selected = selectedKey === cell.key;
                          const monthActive =
                            selectedMonthIndex === monthIndex && cell.inRange;
                          const statActive =
                            cell.inRange &&
                            ((selectedStat === "active" && cell.count > 0) ||
                              (selectedStat === "streak" &&
                                streakKeys.has(cell.key)));
                          const highlighted =
                            selected || monthActive || statActive;
                          const dimmed =
                            selectedStat === "active"
                              ? cell.count <= 0
                              : selectedStat === "streak"
                                ? !streakKeys.has(cell.key)
                                : (selectedKey != null && !selected) ||
                                  (selectedMonthIndex != null &&
                                    selectedMonthIndex !== monthIndex);
                          const showTip =
                            hovered || (hoverKey == null && selected);
                          return (
                            <span
                              key={cell.key}
                              data-heatmap-day={cell.inRange ? "" : undefined}
                              data-chat-jump={cell.inRange ? "true" : undefined}
                              className={`relative w-full overflow-visible ${
                                cell.inRange ? "cursor-pointer" : ""
                              }`}
                              style={{ aspectRatio: "1 / 1" }}
                              onMouseEnter={() => {
                                if (cell.inRange) setHoverKey(cell.key);
                              }}
                              onClick={() => {
                                if (!cell.inRange) return;
                                setSelectedMonthIndex(null);
                                if (selectedKey === cell.key) {
                                  setSelectedKey(null);
                                  setHoverKey(null);
                                  onJumpDay?.(cell.key);
                                  return;
                                }
                                setSelectedKey(cell.key);
                              }}
                            >
                              <span
                                className="absolute inset-0 rounded-[2px] transition-[transform,opacity,box-shadow] duration-150"
                                style={{
                                  backgroundColor: cell.inRange
                                    ? heatmapCellColor(cell.count)
                                    : "transparent",
                                  opacity: !cell.inRange
                                    ? 0
                                    : dimmed
                                      ? 0.28
                                      : 1,
                                  transform: highlighted
                                    ? selected
                                      ? "scale(1.06)"
                                      : "scale(1.04)"
                                    : "scale(1)",
                                  boxShadow: highlighted
                                    ? "0 0 0 1px var(--accent-deep)"
                                    : "none",
                                  zIndex: highlighted || showTip ? 10 : 1,
                                }}
                              />
                              {showTip ? (
                                <span
                                  className={`pointer-events-none absolute z-20 rounded-lg bg-foreground px-2 py-1 font-mono text-[11px] whitespace-nowrap text-white shadow-sm ${
                                    row === 0 ? "top-full mt-1" : "bottom-full mb-1"
                                  } ${
                                    col < 4
                                      ? "left-0"
                                      : col > weekCount - 5
                                        ? "right-0"
                                        : "left-1/2 -translate-x-1/2"
                                  }`}
                                >
                                  {t("dayTooltip", {
                                    date: formatDayKey(cell.key, t),
                                    count: formatNumber(cell.count, numberLocale),
                                  })}
                                </span>
                              ) : null}
                            </span>
                          );
                        })}
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function heatmapWindowStats(
  rangeStart: Date,
  rangeEnd: Date,
  countByDate: Map<string, number>,
) {
  let activeDays = 0;
  let maxStreak = 0;
  let streak = 0;
  let streakStart: Date | null = null;
  let bestStart: Date | null = null;
  let bestEnd: Date | null = null;
  const cursor = new Date(rangeStart);
  while (cursor <= rangeEnd) {
    if (countByDate.get(toDateKey(cursor))) {
      activeDays += 1;
      if (streak === 0) streakStart = new Date(cursor);
      streak += 1;
      if (streak >= maxStreak) {
        maxStreak = streak;
        bestStart = streakStart;
        bestEnd = new Date(cursor);
      }
    } else {
      streak = 0;
      streakStart = null;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  const streakKeys = new Set<string>();
  if (bestStart && bestEnd) {
    const day = new Date(bestStart);
    while (day <= bestEnd) {
      streakKeys.add(toDateKey(day));
      day.setDate(day.getDate() + 1);
    }
  }
  return { activeDays, maxStreak, streakKeys };
}

function heatmapCellColor(count: number) {
  if (count <= 0) return "#f7f5fb";
  if (count <= 10) return "#e3d6f3";
  if (count <= 50) return "#cdb8eb";
  if (count < 200) return "#a17ad8";
  if (count < 500) return "#8c70c7";
  return "#6e54a6";
}

function buildRollingHeatmap(
  rangeStart: Date,
  rangeEnd: Date,
  countByDate: Map<string, number>,
  locale: string,
) {
  const months: {
    label: string;
    showLabel: boolean;
    perfect: boolean;
    weeks: {
      key: string;
      count: number;
      inRange: boolean;
    }[][];
  }[] = [];
  const cursor = new Date(rangeStart);

  while (cursor <= rangeEnd) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const from = monthStart < rangeStart ? new Date(rangeStart) : monthStart;
    const to = monthEnd > rangeEnd ? new Date(rangeEnd) : monthEnd;

    const fromKey = toDateKey(from);
    const toKey = toDateKey(to);

    const gridStart = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    gridStart.setDate(gridStart.getDate() - ((gridStart.getDay() + 6) % 7));
    const gridEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    gridEnd.setDate(gridEnd.getDate() + (6 - ((gridEnd.getDay() + 6) % 7)));

    const weeks: {
      key: string;
      count: number;
      inRange: boolean;
    }[][] = [];
    const day = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate(),
    );
    while (day <= gridEnd) {
      const week: {
        key: string;
        count: number;
        inRange: boolean;
      }[] = [];
      for (let row = 0; row < 7; row += 1) {
        const key = toDateKey(day);
        const inMonth = key >= fromKey && key <= toKey;
        week.push({
          key: inMonth ? key : `pad-${year}-${month}-${weeks.length}-${row}`,
          inRange: inMonth,
          count: inMonth ? (countByDate.get(key) ?? 0) : 0,
        });
        day.setDate(day.getDate() + 1);
      }
      if (week.some((cell) => cell.inRange)) weeks.push(week);
    }

    const fullMonth =
      from.getTime() === monthStart.getTime() &&
      to.getTime() === monthEnd.getTime();
    let perfect = fullMonth;
    if (perfect) {
      const cursorDay = new Date(monthStart);
      while (cursorDay <= monthEnd) {
        if (!(countByDate.get(toDateKey(cursorDay)) ?? 0)) {
          perfect = false;
          break;
        }
        cursorDay.setDate(cursorDay.getDate() + 1);
      }
    }

    months.push({
      label: monthStart.toLocaleString(locale, { month: "short" }),
      showLabel: from.getTime() === monthStart.getTime(),
      perfect,
      weeks,
    });
    cursor.setTime(to.getTime());
    cursor.setDate(cursor.getDate() + 1);
  }

  return { months };
}
