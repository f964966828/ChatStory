import type { ParsedChat } from "@/lib/chat-types";

const LINE_HEADER_PATTERN =
  /^\[LINE\]\s*(?:Chat history with\s+(.+?)|與\s*(.+?)\s*的聊天(?:記錄|紀錄))\s*$/i;

export function parseLineChat(text: string): ParsedChat {
  const usernameB = extractLineUsernameB(text);
  if (!usernameB) {
    console.error("[LINE parser] parse usernameB failed");
    throw new Error("PARSE_FAILED");
  }

  const messages: ParsedChat["messages"] = [];
  let currentDate: LineDate | null = null;
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);

  for (let index = 0; index < lines.length; ) {
    const line = lines[index];
    const date = parseLineDate(line.trim());
    if (date) {
      currentDate = date;
      index += 1;
      continue;
    }
    if (!currentDate || !line.includes("\t")) {
      index += 1;
      continue;
    }

    const [timeText, senderText, ...contentParts] = line.split("\t");
    const time = parseLineTime(timeText.trim());
    const senderName = senderText.trim();
    if (!time || !senderName || contentParts.length === 0) {
      index += 1;
      continue;
    }

    let content = contentParts.join("\t");
    let end = index;
    if (content.startsWith('"') && !isCompleteQuotedField(content)) {
      while (end + 1 < lines.length) {
        const next = lines[end + 1];
        if (parseLineDate(next.trim()) || isLineMessageStart(next)) break;
        end += 1;
        content += `\n${next}`;
        if (isCompleteQuotedField(content)) break;
      }
    }
    content = unquoteTsvField(content);

    const callDurationMs = parseLineCallDuration(content);
    messages.push({
      id: `line-${index + 1}`,
      timestamp: new Date(
        currentDate.year,
        currentDate.month - 1,
        currentDate.day,
        time.hour,
        time.minute,
      ).getTime(),
      senderId: senderName,
      senderName,
      content,
      platform: "line",
      type: callDurationMs == null ? parseLineMessageType(content) : "call",
      ...(callDurationMs == null ? {} : { callDurationMs }),
    });
    index = end + 1;
  }

  const participants = [
    ...new Set(messages.map((message) => message.senderName)),
  ];
  const usernameA = participants.find((name) => name !== usernameB);
  if (
    messages.length === 0 ||
    participants.length !== 2 ||
    !participants.includes(usernameB) ||
    !usernameA
  ) {
    console.error(
      "[LINE parser] expected exactly two participants",
      participants,
    );
    throw new Error("PARSE_FAILED");
  }

  return {
    messages: messages.sort((a, b) => a.timestamp - b.timestamp),
    usernameA,
    usernameB,
  };
}

type LineDate = {
  year: number;
  month: number;
  day: number;
};

const LINE_EN_WEEKDAY =
  "Sun(?:day)?|Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?";
const LINE_WEEKDAY = `(?:[（(][^）)]*[）)]|(?:星期|週|礼拜|禮拜)[日一二三四五六天]|${LINE_EN_WEEKDAY})`;

function parseLineDate(line: string): LineDate | null {
  const zh = new RegExp(
    `^(\\d{4})/(\\d{1,2})/(\\d{1,2})(?:\\s*${LINE_WEEKDAY})?$`,
    "i",
  ).exec(line);
  if (zh) return toLineDate(zh[1], zh[2], zh[3]);

  const dotted = new RegExp(
    `^(\\d{4})\\.\\s*(\\d{1,2})\\.\\s*(\\d{1,2})\\.?(?:\\s*${LINE_WEEKDAY})?$`,
    "i",
  ).exec(line);
  if (dotted) return toLineDate(dotted[1], dotted[2], dotted[3]);

  const en = new RegExp(
    `^(?:${LINE_EN_WEEKDAY}),\\s*(\\d{1,2})/(\\d{1,2})/(\\d{4})$`,
    "i",
  ).exec(line);
  if (!en) return null;
  return toLineDate(en[3], en[1], en[2]);
}

function toLineDate(year: string, month: string, day: string): LineDate {
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };
}

function parseLineTime(
  value: string,
): { hour: number; minute: number } | null {
  const zh = /^(上午|下午)\s*(\d{1,2}):(\d{2})$/.exec(value);
  const en = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value);
  const twentyFourHour = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (twentyFourHour) {
    return {
      hour: Number(twentyFourHour[1]),
      minute: Number(twentyFourHour[2]),
    };
  }
  if (!zh && !en) return null;

  const period = zh?.[1] ?? en?.[3].toUpperCase();
  const rawHour = Number(zh?.[2] ?? en?.[1]);
  const minute = Number(zh?.[3] ?? en?.[2]);
  if (rawHour < 1 || rawHour > 12 || minute < 0 || minute > 59) return null;

  const hour = (rawHour % 12) + (period === "下午" || period === "PM" ? 12 : 0);
  return { hour, minute };
}

function isLineMessageStart(line: string) {
  if (!line.includes("\t")) return false;
  const [timeText, senderText] = line.split("\t");
  return Boolean(parseLineTime(timeText.trim()) && senderText?.trim());
}

function isCompleteQuotedField(value: string) {
  if (!value.startsWith('"')) return true;
  let index = 1;
  while (index < value.length) {
    if (value[index] === '"') {
      if (value[index + 1] === '"') {
        index += 2;
        continue;
      }
      return value.slice(index + 1).trim() === "";
    }
    index += 1;
  }
  return false;
}

function unquoteTsvField(value: string) {
  if (!value.startsWith('"')) return value;
  if (!isCompleteQuotedField(value)) {
    return value.slice(1).replaceAll('""', '"');
  }
  let end = value.length - 1;
  while (end > 0 && value[end] !== '"') end -= 1;
  return value.slice(1, end).replaceAll('""', '"');
}

function parseLineMessageType(
  content: string,
): ParsedChat["messages"][number]["type"] {
  const normalized = content.trim().toLowerCase();
  if (normalized === "[貼圖]" || normalized === "[sticker]") return "sticker";
  if (normalized === "[照片]" || normalized === "[photo]") return "image";
  if (normalized === "[影片]" || normalized === "[video]") return "video";
  return "text";
}

function parseLineCallDuration(content: string): number | null {
  const match =
    /^(?:☎️?\s*)?(?:Call time|通話時間)\s*(\d+):(\d{2})(?::(\d{2}))?\s*$/i.exec(
      content.trim(),
    );
  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2]);
  const third = match[3] == null ? null : Number(match[3]);
  if (second > 59 || (third != null && third > 59)) return null;

  const totalSeconds =
    third == null
      ? first * 60 + second
      : first * 60 * 60 + second * 60 + third;
  return totalSeconds * 1000;
}

export function extractLineUsernameB(text: string): string | null {
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0]?.trim();
  if (!firstLine) return null;
  const match = LINE_HEADER_PATTERN.exec(firstLine);
  return (match?.[1] ?? match?.[2])?.trim() || null;
}
