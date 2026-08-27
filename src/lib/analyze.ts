import type { ChatMessage } from "@/lib/chat-types";
import type { WordCount } from "@/lib/words";

export type ChatAnalysis = {
  totalMessages: number;
  totalCharacters: number;
  activeDays: number;
  durationMs: number;
  callDurationMs: number;
  callCount: number;
  avgPerDay: number;
  hourly: number[];
  weekday: number[];
  daily: { date: string; count: number; a: number; b: number }[];
  monthly: { key: string; a: number; b: number }[];
  senders: {
    name: string;
    messages: number;
    texts: number;
    stickers: number;
    photos: number;
    videos: number;
    ratio: number;
    initiated: number;
    avgChars: number;
    avgReplyMs: number;
    words: WordCount[];
  }[];
  emojis: { emoji: string; count: number }[];
  peakMessageDay: { date: string; count: number } | null;
  peakCallDay: { date: string; durationMs: number } | null;
};

function dateKey(ts: number) {
  const d = new Date(ts);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function monthKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
}

function extractEmojis(text: string) {
  return text.match(/\p{Extended_Pictographic}/gu) ?? [];
}

function countable(message: ChatMessage) {
  return message.type !== "system";
}

/** Quiet this long, and the next message starts a new conversation. */
const SESSION_GAP_MS = 8 * 60 * 60 * 1000;

export function analyzeChat(messages: ChatMessage[]): ChatAnalysis {
  const usable = messages.filter(countable);
  const source = usable.length > 0 ? usable : messages;
  const hourly = Array.from({ length: 24 }, () => 0);
  const weekday = Array.from({ length: 7 }, () => 0);
  const dailyBySender = new Map<string, Map<string, number>>();
  const monthlyBySender = new Map<string, Map<string, number>>();
  const senderMap = new Map<
    string,
    {
      messages: number;
      texts: number;
      stickers: number;
      photos: number;
      videos: number;
      textChars: number;
      textCount: number;
    }
  >();
  const emojiMap = new Map<string, number>();
  let chars = 0;
  let callDurationMs = 0;
  let callCount = 0;
  const callByDay = new Map<string, number>();

  for (const message of source) {
    const date = new Date(message.timestamp);
    hourly[date.getHours()] += 1;
    weekday[(date.getDay() + 6) % 7] += 1;
    const dk = dateKey(message.timestamp);
    const daySenders = dailyBySender.get(dk) ?? new Map<string, number>();
    daySenders.set(
      message.senderName,
      (daySenders.get(message.senderName) ?? 0) + 1,
    );
    dailyBySender.set(dk, daySenders);
    const mk = monthKey(message.timestamp);
    const monthSenders = monthlyBySender.get(mk) ?? new Map<string, number>();
    monthSenders.set(
      message.senderName,
      (monthSenders.get(message.senderName) ?? 0) + 1,
    );
    monthlyBySender.set(mk, monthSenders);
    const stats = senderMap.get(message.senderName) ?? {
      messages: 0,
      texts: 0,
      stickers: 0,
      photos: 0,
      videos: 0,
      textChars: 0,
      textCount: 0,
    };
    stats.messages += 1;
    if (message.type === "sticker") stats.stickers += 1;
    else if (message.type === "image") stats.photos += 1;
    else if (message.type === "video") stats.videos += 1;
    else stats.texts += 1;
    if (message.type === "text") {
      stats.textCount += 1;
      stats.textChars += message.content.length;
    }
    if (message.type === "call") callCount += 1;
    if (message.callDurationMs) {
      callDurationMs += message.callDurationMs;
      callByDay.set(dk, (callByDay.get(dk) ?? 0) + message.callDurationMs);
    }
    senderMap.set(message.senderName, stats);
    chars += message.content.length;
    for (const emoji of extractEmojis(message.content)) {
      emojiMap.set(emoji, (emojiMap.get(emoji) ?? 0) + 1);
    }
  }

  const pairTotal = [...senderMap.entries()]
    .filter(([name]) => name !== "system")
    .sort((a, b) => b[1].messages - a[1].messages)
    .slice(0, 2);
  const pairMessageTotal = pairTotal.reduce(
    (sum, [, stats]) => sum + stats.messages,
    0,
  );
  const pairNames = new Set(pairTotal.map(([name]) => name));
  const initiated = new Map<string, number>();
  const replyTimes = new Map<string, { totalMs: number; count: number }>();
  let lastTs = Number.NEGATIVE_INFINITY;
  let previousMessage: ChatMessage | null = null;
  const chronological = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  for (const message of chronological) {
    const startsSession =
      lastTs === Number.NEGATIVE_INFINITY ||
      message.timestamp - lastTs >= SESSION_GAP_MS;
    if (startsSession && pairNames.has(message.senderName)) {
      initiated.set(
        message.senderName,
        (initiated.get(message.senderName) ?? 0) + 1,
      );
    }
    if (
      previousMessage &&
      previousMessage.senderName !== message.senderName &&
      message.timestamp - previousMessage.timestamp <= SESSION_GAP_MS &&
      pairNames.has(message.senderName)
    ) {
      const reply = replyTimes.get(message.senderName) ?? {
        totalMs: 0,
        count: 0,
      };
      reply.totalMs += message.timestamp - previousMessage.timestamp;
      reply.count += 1;
      replyTimes.set(message.senderName, reply);
    }
    lastTs = message.timestamp;
    previousMessage = message;
  }

  const senders = pairTotal.map(([name, stats]) => {
    const replies = replyTimes.get(name);
    return {
      name,
      messages: stats.messages,
      texts: stats.texts,
      stickers: stats.stickers,
      photos: stats.photos,
      videos: stats.videos,
      ratio: pairMessageTotal ? stats.messages / pairMessageTotal : 0,
      initiated: initiated.get(name) ?? 0,
      avgChars: stats.textCount ? stats.textChars / stats.textCount : 0,
      avgReplyMs: replies ? replies.totalMs / replies.count : 0,
      words: [],
    };
  });

  const nameA = pairTotal[0]?.[0];
  const nameB = pairTotal[1]?.[0];
  const daily = [...dailyBySender.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sendersForDay]) => {
      const a = nameA ? (sendersForDay.get(nameA) ?? 0) : 0;
      const b = nameB ? (sendersForDay.get(nameB) ?? 0) : 0;
      return { date, a, b, count: a + b };
    });

  const monthly = [...monthlyBySender.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, sendersForMonth]) => ({
      key,
      a: nameA ? (sendersForMonth.get(nameA) ?? 0) : 0,
      b: nameB ? (sendersForMonth.get(nameB) ?? 0) : 0,
    }));

  const emojis = [...emojiMap.entries()]
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const first = source[0]?.timestamp ?? 0;
  const last = source[source.length - 1]?.timestamp ?? first;
  const durationMs = Math.max(0, last - first);
  const activeDays = daily.length;
  const avgPerDay = activeDays ? source.length / activeDays : 0;
  const peakMessageDay = daily.reduce<{ date: string; count: number } | null>(
    (best, item) =>
      !best || item.count > best.count
        ? { date: item.date, count: item.count }
        : best,
    null,
  );
  const peakCallDay = [...callByDay.entries()].reduce<
    { date: string; durationMs: number } | null
  >(
    (best, [date, durationMs]) =>
      !best || durationMs > best.durationMs ? { date, durationMs } : best,
    null,
  );

  return {
    totalMessages: source.length,
    totalCharacters: chars,
    activeDays,
    durationMs,
    callDurationMs,
    callCount,
    avgPerDay,
    hourly,
    weekday,
    daily,
    monthly,
    senders,
    emojis,
    peakMessageDay,
    peakCallDay,
  };
}

export function formatDuration(ms: number) {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ${sec % 60}s`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ${min % 60}m`;
  const day = Math.floor(hr / 24);
  return `${day}d ${hr % 24}h`;
}

export function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en" : "zh-Hant", {
    maximumFractionDigits: 1,
  }).format(value);
}
