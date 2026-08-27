import type { ChatAnalysis } from "@/lib/analyze";
import type { MessageKey } from "@/lib/messages";

export function pad2(value: number) {
  return `${value}`.padStart(2, "0");
}

const WEEKDAY_KEYS: MessageKey[] = [
  "weekdaySun",
  "weekdayMon",
  "weekdayTue",
  "weekdayWed",
  "weekdayThu",
  "weekdayFri",
  "weekdaySat",
];

export function formatDayKey(key: string, t: (key: MessageKey) => string) {
  const [year, month, day] = key.split("-").map(Number);
  if (!year || !month || !day) return key;
  const weekday = t(WEEKDAY_KEYS[new Date(year, month - 1, day).getDay()]);
  return `${year}/${pad2(month)}/${pad2(day)} (${weekday})`;
}

export function formatMonthKey(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return `${year}/${pad2(month)}`;
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

export function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function shiftYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

export function yearTicksForSeries(
  series: { key: string }[],
  lastIndex: number,
) {
  const ticks: { year: string; pct: number }[] = [];
  let prev = "";
  for (let i = 0; i < series.length; i += 1) {
    const year = series[i].key.slice(0, 4);
    if (year === prev) continue;
    ticks.push({ year, pct: lastIndex ? (i / lastIndex) * 100 : 0 });
    prev = year;
  }
  if (ticks.length <= 2) return ticks;
  const minGap = 14;
  const last = ticks[ticks.length - 1];
  const spaced = [ticks[0]];
  for (let i = 1; i < ticks.length - 1; i += 1) {
    const tick = ticks[i];
    if (
      tick.pct - spaced[spaced.length - 1].pct >= minGap &&
      last.pct - tick.pct >= minGap
    ) {
      spaced.push(tick);
    }
  }
  if (last.pct - spaced[spaced.length - 1].pct >= minGap) {
    spaced.push(last);
  } else {
    spaced[spaced.length - 1] = last;
  }
  return spaced;
}

export function formatPeriodKey(key: string, grain: "week" | "month" | "year") {
  if (grain === "year") return key.slice(0, 4);
  if (grain === "week") {
    const start = parseDateKey(key);
    if (Number.isNaN(start.getTime())) return key;
    return `${start.getFullYear()}/${pad2(start.getMonth() + 1)}/${pad2(start.getDate())}`;
  }
  return formatMonthKey(key);
}

export function formatWeekRange(key: string) {
  const start = parseDateKey(key);
  if (Number.isNaN(start.getTime())) return key;
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.getFullYear()}/${pad2(start.getMonth() + 1)}/${pad2(start.getDate())}–${pad2(end.getMonth() + 1)}/${pad2(end.getDate())}`;
}

function weekStartKey(dateKey: string) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toDateKey(date);
}

export function fillMonthly(monthly: ChatAnalysis["monthly"]) {
  if (!monthly.length) {
    return [
      { key: "2024-01", a: 8, b: 5 },
      { key: "2024-02", a: 12, b: 9 },
      { key: "2024-03", a: 18, b: 11 },
      { key: "2024-04", a: 14, b: 16 },
      { key: "2024-05", a: 28, b: 19 },
      { key: "2024-06", a: 22, b: 20 },
      { key: "2024-07", a: 20, b: 14 },
      { key: "2024-08", a: 16, b: 18 },
      { key: "2024-09", a: 24, b: 15 },
      { key: "2024-10", a: 19, b: 21 },
      { key: "2024-11", a: 15, b: 12 },
      { key: "2024-12", a: 21, b: 17 },
    ];
  }
  const byKey = new Map(monthly.map((item) => [item.key, item]));
  const first = monthly[0].key.split("-").map(Number);
  const last = monthly[monthly.length - 1].key.split("-").map(Number);
  let year = first[0];
  let month = first[1];
  const filled: ChatAnalysis["monthly"] = [];
  while (year < last[0] || (year === last[0] && month <= last[1])) {
    const key = `${year}-${`${month}`.padStart(2, "0")}`;
    filled.push(byKey.get(key) ?? { key, a: 0, b: 0 });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return filled;
}

export function fillYearly(monthly: ChatAnalysis["monthly"]) {
  const byYear = new Map<string, { key: string; a: number; b: number }>();
  for (const item of monthly) {
    const year = item.key.slice(0, 4);
    const current = byYear.get(year) ?? { key: year, a: 0, b: 0 };
    current.a += item.a;
    current.b += item.b;
    byYear.set(year, current);
  }
  if (!byYear.size) return [];
  const years = [...byYear.keys()].map(Number).sort((a, b) => a - b);
  const filled: ChatAnalysis["monthly"] = [];
  for (let year = years[0]; year <= years[years.length - 1]; year += 1) {
    const key = `${year}`;
    filled.push(byYear.get(key) ?? { key, a: 0, b: 0 });
  }
  return filled;
}

export function fillWeekly(daily: ChatAnalysis["daily"]) {
  if (!daily.length) return [];
  const byWeek = new Map<string, { key: string; a: number; b: number }>();
  for (const item of daily) {
    const key = weekStartKey(item.date);
    const current = byWeek.get(key) ?? { key, a: 0, b: 0 };
    current.a += item.a;
    current.b += item.b;
    byWeek.set(key, current);
  }
  const keys = [...byWeek.keys()].sort();
  const cursor = parseDateKey(keys[0]);
  const last = parseDateKey(keys[keys.length - 1]);
  const filled: { key: string; a: number; b: number }[] = [];
  while (cursor <= last) {
    const key = toDateKey(cursor);
    filled.push(byWeek.get(key) ?? { key, a: 0, b: 0 });
    cursor.setDate(cursor.getDate() + 7);
  }
  return filled;
}
