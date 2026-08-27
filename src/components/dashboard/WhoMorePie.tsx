"use client";

import { useRef, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { useLocale } from "@/components/LocaleProvider";
import type { ChatAnalysis } from "@/lib/analyze";

function piePoint(cx: number, cy: number, radius: number, pct: number) {
  const rad = ((pct * 3.6 - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function pieDonutPath(
  startPct: number,
  endPct: number,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
) {
  const span = endPct - startPct;
  if (span <= 0.05) return "";
  if (span >= 99.95) {
    return `M ${cx} ${cy - outerR} A ${outerR} ${outerR} 0 1 1 ${cx} ${cy + outerR} A ${outerR} ${outerR} 0 1 1 ${cx} ${cy - outerR} M ${cx} ${cy - innerR} A ${innerR} ${innerR} 0 1 0 ${cx} ${cy + innerR} A ${innerR} ${innerR} 0 1 0 ${cx} ${cy - innerR}`;
  }
  const large = span > 50 ? 1 : 0;
  const outerStart = piePoint(cx, cy, outerR, startPct);
  const outerEnd = piePoint(cx, cy, outerR, endPct);
  const innerEnd = piePoint(cx, cy, innerR, endPct);
  const innerStart = piePoint(cx, cy, innerR, startPct);
  return `M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerR} ${innerR} 0 ${large} 0 ${innerStart.x} ${innerStart.y} Z`;
}

function pieSliceOffset(startPct: number, endPct: number, distance: number) {
  const mid = (startPct + endPct) / 2;
  const rad = ((mid * 3.6 - 90) * Math.PI) / 180;
  return { x: Math.cos(rad) * distance, y: Math.sin(rad) * distance };
}

export function WhoMorePie({
  title,
  people,
  labels,
  format,
}: {
  title: string;
  people: ChatAnalysis["senders"];
  labels: {
    messages: string;
    stickers: string;
    photos: string;
    videos: string;
  };
  format: (value: number) => string;
}) {
  const { t } = useLocale();
  const [hover, setHover] = useState<number | null>(null);
  const pair = people.slice(0, 2);
  const total = pair.reduce((sum, person) => sum + person.messages, 0);
  const firstPct = total ? (pair[0].messages / total) * 100 : 50;
  const firstRounded = Math.round(firstPct);
  const percentages = [firstRounded, 100 - firstRounded];
  const colors = ["#b794f6", "#f4b8d0"] as const;
  const metrics = [
    [`💬 ${labels.messages}`, pair[0]?.texts ?? 0, pair[1]?.texts ?? 0],
    [`😆 ${labels.stickers}`, pair[0]?.stickers ?? 0, pair[1]?.stickers ?? 0],
    [`🖼️ ${labels.photos}`, pair[0]?.photos ?? 0, pair[1]?.photos ?? 0],
    [`🎬 ${labels.videos}`, pair[0]?.videos ?? 0, pair[1]?.videos ?? 0],
  ] as const;
  const cx = 60;
  const cy = 60;
  const outerR = 46;
  const innerR = 25;
  const slices =
    pair.length < 2
      ? [{ index: 0, start: 0, end: 100, color: colors[0] }]
      : [
          {
            index: 1,
            start: 0,
            end: 100 - firstPct,
            color: colors[1],
          },
          {
            index: 0,
            start: 100 - firstPct,
            end: 100,
            color: colors[0],
          },
        ];
  const hovered = hover != null ? pair[hover] : null;
  const lastTouchAt = useRef(0);

  function isFineMouse(event: { pointerType: string }) {
    if (event.pointerType !== "mouse") return false;
    if (performance.now() - lastTouchAt.current < 800) return false;
    return window.matchMedia("(hover: hover)").matches;
  }

  function onPersonPointerEnter(
    event: { pointerType: string },
    index: number,
  ) {
    if (!isFineMouse(event)) return;
    setHover(index);
  }

  function onPersonPointerUp(
    event: { pointerType: string },
    index: number,
  ) {
    if (event.pointerType === "mouse") return;
    lastTouchAt.current = performance.now();
    setHover((current) => (current === index ? null : index));
  }

  function onLabelPointerEnter(event: { pointerType: string }) {
    if (!isFineMouse(event)) return;
    setHover(null);
  }

  return (
    <div
      className="grid min-h-0 flex-1 grid-cols-[minmax(8rem,max-content)_minmax(0,1fr)] items-stretch gap-3 sm:grid-cols-[minmax(10rem,max-content)_minmax(0,1fr)] sm:gap-6"
      onPointerLeave={(event) => {
        if (!isFineMouse(event)) return;
        setHover(null);
      }}
    >
      <div className="flex h-full min-h-0 w-max max-w-full flex-col">
        <Header title={title} />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <div
          className="relative size-32 touch-manipulation overflow-visible select-none sm:size-52"
          onPointerUp={(event) => {
            if (event.pointerType === "mouse") return;
            if (
              event.target instanceof Element &&
              event.target.closest("[data-who-more-slice]")
            ) {
              return;
            }
            lastTouchAt.current = performance.now();
            setHover(null);
          }}
        >
          <svg
            viewBox="0 0 120 120"
            className="size-full overflow-visible drop-shadow-sm"
            role="img"
            aria-label={`${pair[0]?.name ?? ""} ${percentages[0]}%, ${pair[1]?.name ?? ""} ${percentages[1]}%`}
          >
            {slices.map((slice) => {
              const path = pieDonutPath(
                slice.start,
                slice.end,
                cx,
                cy,
                outerR,
                innerR,
              );
              if (!path) return null;
              const active = hover === slice.index;
              const dimmed = hover != null && !active;
              const offset =
                active && slice.end - slice.start < 99.95
                  ? pieSliceOffset(slice.start, slice.end, 5)
                  : { x: 0, y: 0 };
              return (
                <g
                  key={slice.index}
                  data-who-more-slice=""
                  className="cursor-pointer transition-[transform,opacity] duration-150"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                    opacity: dimmed ? 0.38 : 1,
                  }}
                  onPointerEnter={(event) =>
                    onPersonPointerEnter(event, slice.index)
                  }
                  onPointerUp={(event) => onPersonPointerUp(event, slice.index)}
                >
                  <path d={path} fill={slice.color} fillRule="evenodd" />
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r={innerR - 0.5} fill="white" />
          </svg>
          {hovered && hover != null ? (
            <div
              data-export-ignore="true"
              className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 rounded-lg bg-foreground px-2 py-1 font-mono text-[11px] whitespace-nowrap text-white shadow-sm"
              style={{ bottom: "100%", marginBottom: 6 }}
            >
              {t("pieTooltip", {
                name: hovered.name,
                pct: String(percentages[hover]),
                count: format(hovered.messages),
              })}
            </div>
          ) : null}
        </div>
        <div className="mx-auto mt-3 w-fit max-w-full space-y-1 text-sm sm:text-base">
          {pair.map((person, index) => {
            const active = hover === index;
            const dimmed = hover != null && !active;
            return (
              <button
                key={`${person.name}-${index}`}
                type="button"
                className={`flex items-center justify-start gap-1.5 border-0 bg-transparent p-0 text-left touch-manipulation transition-opacity duration-150 ${
                  dimmed ? "opacity-40" : "opacity-100"
                }`}
                onPointerEnter={(event) => onPersonPointerEnter(event, index)}
                onPointerUp={(event) => onPersonPointerUp(event, index)}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[index] }}
                />
                <span
                  data-who-more-legend=""
                  className={`whitespace-nowrap font-semibold ${
                    active ? "text-accent-deep" : ""
                  }`}
                >
                  {person.name}
                </span>
                <span className="shrink-0 font-mono text-muted">
                  {percentages[index]}%
                </span>
              </button>
            );
          })}
        </div>
        </div>
      </div>
      <div className="flex h-full min-w-0">
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-card-border bg-white">
        <table className="h-full w-full table-fixed border-collapse">
          <thead>
            <tr className="border-b border-card-border bg-accent/5">
              <th
                className="w-[35%] px-2 py-2"
                onPointerEnter={onLabelPointerEnter}
              />
              {pair.map((person, index) => {
                const active = hover === index;
                const dimmed = hover != null && !active;
                return (
                  <th
                    key={`${person.name}-${index}`}
                    data-who-more-col=""
                    className={`min-w-0 cursor-pointer px-1 py-2 text-center text-xs font-bold touch-manipulation transition-[background-color,opacity] duration-150 sm:px-2 sm:text-sm ${
                      dimmed ? "opacity-40" : "opacity-100"
                    }`}
                    style={{
                      backgroundColor: active
                        ? "rgba(183, 148, 246, 0.16)"
                        : undefined,
                    }}
                    onPointerEnter={(event) => onPersonPointerEnter(event, index)}
                    onPointerUp={(event) => onPersonPointerUp(event, index)}
                  >
                    <span
                      className="mx-auto mb-1 block size-2 rounded-full"
                      style={{ backgroundColor: colors[index] }}
                    />
                    <span className="block truncate">{person.name}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {metrics.map(([label, first, second]) => {
              const firstWins = first > second;
              const secondWins = second > first;
              const values = [first, second];
              const wins = [firstWins, secondWins];
              return (
                <tr
                  key={label}
                  className="h-[25%] border-b border-card-border last:border-b-0"
                >
                  <th
                    className="whitespace-nowrap px-2 py-2 text-left text-sm font-medium text-muted sm:px-3 sm:text-base"
                    onPointerEnter={onLabelPointerEnter}
                  >
                    {label}
                  </th>
                  {values.map((value, index) => {
                    const active = hover === index;
                    const dimmed = hover != null && !active;
                    const isWin = wins[index];
                    const otherWins = wins[index === 0 ? 1 : 0];
                    return (
                      <td
                        key={index}
                        data-who-more-col=""
                        className={`cursor-pointer px-1 py-2 text-center font-mono font-bold touch-manipulation transition-[background-color,opacity] duration-150 sm:px-2 ${
                          isWin
                            ? "text-lg text-black sm:text-xl"
                            : otherWins
                              ? "text-xs text-muted sm:text-sm"
                              : "text-sm text-black"
                        } ${dimmed ? "opacity-40" : "opacity-100"}`}
                        style={{
                          backgroundColor: active
                            ? "rgba(183, 148, 246, 0.16)"
                            : undefined,
                        }}
                        onPointerEnter={(event) =>
                          onPersonPointerEnter(event, index)
                        }
                        onPointerUp={(event) => onPersonPointerUp(event, index)}
                      >
                        {format(value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
