"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/analyze";

export function useNarrow() {
  const [narrow, setNarrow] = useState(
    () => window.matchMedia("(max-width: 639px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return narrow;
}

export function compactTick(value: number, locale: string) {
  if (value >= 10_000) {
    return `${formatNumber(Math.round(value / 1000), locale)}k`;
  }
  if (value >= 1000 && value % 1000 === 0) {
    return `${formatNumber(value / 1000, locale)}k`;
  }
  return formatNumber(value, locale);
}

export function niceAxisMax(value: number) {
  if (value <= 0) return 1;
  const padded = value * 1.05;
  const exp = 10 ** Math.floor(Math.log10(padded));
  const n = padded / exp;
  const nice =
    [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(
      (candidate) => n <= candidate,
    ) ?? 10;
  return nice * exp;
}

export function BarYAxis({
  max,
  locale,
  className,
}: {
  max: number;
  locale: string;
  className?: string;
}) {
  const top = niceAxisMax(max);
  const ticks = [top, top / 2, 0];
  return (
    <div className={`relative w-6 shrink-0 overflow-visible sm:w-9 ${className ?? ""}`}>
      {ticks.map((tick, index) => (
        <span
          key={`${tick}-${index}`}
          className="absolute right-0 font-mono text-[9px] leading-none text-muted sm:text-[10px]"
          style={{
            top: `${(index / 2) * 100}%`,
            transform:
              index === 0
                ? "translateY(0)"
                : index === 2
                  ? "translateY(-100%)"
                  : "translateY(-50%)",
          }}
        >
          {compactTick(tick, locale)}
        </span>
      ))}
    </div>
  );
}

export function ChartGrid() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-x-0 top-0 border-t border-card-border" />
      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-card-border/80" />
      <div className="absolute inset-x-0 bottom-0 border-t border-card-border" />
    </div>
  );
}
