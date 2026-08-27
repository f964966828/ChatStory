import type { ParsedChat } from "@/lib/chat-types";

type MetaExport = {
  participants?: { name?: string }[];
  messages?: unknown[];
  title?: string;
};

type MetaRawMessage = {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  sticker?: unknown;
  photos?: unknown;
  videos?: unknown;
  audio_files?: unknown;
  call_duration?: unknown;
  share?: unknown;
};

export function decodeMetaText(value: string) {
  if (!value) return value;
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code > 255) return value;
    bytes[index] = code;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
}

export function readMetaExport(text: string): MetaExport {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("<")) {
    console.error("[Meta parser] expected JSON export");
    throw new Error("PARSE_FAILED");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    console.error("[Meta parser] JSON.parse failed");
    throw new Error("PARSE_FAILED");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    console.error("[Meta parser] JSON root is not an object");
    throw new Error("PARSE_FAILED");
  }

  return parsed as MetaExport;
}

export function parseMetaChat(text: string): ParsedChat {
  const data = readMetaExport(text);
  if (!Array.isArray(data.messages)) {
    console.error("[Meta parser] missing messages array");
    throw new Error("PARSE_FAILED");
  }

  const messages: ParsedChat["messages"] = [];
  for (let index = 0; index < data.messages.length; index += 1) {
    const item = data.messages[index];
    if (!isMetaRawMessage(item)) continue;
    const senderName = decodeMetaText(item.sender_name).trim();
    if (!senderName) continue;
    const durationMs = callDurationMs(item);
    const types = metaMessageTypes(item);
    const rawContent = decodeMetaText(messageContent(item));
    for (let part = 0; part < types.length; part += 1) {
      const type = types[part];
      messages.push({
        id:
          types.length === 1
            ? `meta-${index + 1}`
            : `meta-${index + 1}-${part + 1}`,
        timestamp: item.timestamp_ms,
        senderId: senderName,
        senderName,
        content: type === "image" || type === "video" ? "" : rawContent,
        platform: "meta",
        type,
        ...(type === "call" && durationMs != null
          ? { callDurationMs: durationMs }
          : {}),
      });
    }
  }

  const namedParticipants = [
    ...new Set(
      (data.participants ?? [])
        .map((person) => decodeMetaText(person?.name ?? "").trim())
        .filter(Boolean),
    ),
  ];
  const participants =
    namedParticipants.length === 2
      ? namedParticipants
      : [...new Set(messages.map((message) => message.senderName))];

  const title = decodeMetaText(data.title ?? "").trim();
  const usernameB = participants.includes(title) ? title : participants[0];
  const usernameA = participants.find((name) => name !== usernameB);

  if (
    messages.length === 0 ||
    participants.length !== 2 ||
    !usernameB ||
    !usernameA
  ) {
    console.error(
      "[Meta parser] expected exactly two participants",
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

function metaMessageTypes(
  item: MetaRawMessage,
): ParsedChat["messages"][number]["type"][] {
  const content = decodeMetaText(messageContent(item)).trim();
  if (isOtherNotice(content)) return ["other"];
  if (isCallNotice(content) || callDurationMs(item) != null) return ["call"];
  if (item.sticker || isGifShare(item)) return ["sticker"];
  const mediaTypes: ParsedChat["messages"][number]["type"][] = [
    ...Array.from({ length: mediaCount(item.photos) }, () => "image" as const),
    ...Array.from({ length: mediaCount(item.videos) }, () => "video" as const),
    ...Array.from(
      { length: mediaCount(item.audio_files) },
      () => "video" as const,
    ),
  ];
  const hasText = Boolean(content) && !isOtherNotice(content);
  if (mediaTypes.length > 0) {
    return hasText ? ["text", ...mediaTypes] : mediaTypes;
  }
  if (!content) return [];
  return ["text"];
}

function mediaCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function messageContent(item: MetaRawMessage) {
  return shareLink(item) || item.content || "";
}

function shareLink(item: MetaRawMessage) {
  if (!item.share || typeof item.share !== "object" || Array.isArray(item.share)) {
    return "";
  }
  const link = (item.share as { link?: unknown }).link;
  return typeof link === "string" ? link.trim() : "";
}

function isOtherNotice(content: string) {
  const text = normalizeNotice(content);
  return (
    /傳送了\s*\d+\s*[個份]附件$/u.test(text) ||
    /sent\s+(an|\d+)\s+attachments?$/i.test(text) ||
    /^reacted\s+.+\s+to (your|their) message$/i.test(text) ||
    /^.+ started an (audio|video) call$/i.test(text) ||
    /開始了(語音|視訊)通話$/.test(text) ||
    /撥打了電話給/.test(text) ||
    /錯過了.+來電/.test(text) ||
    /你撥打了電話給/.test(text) ||
    /(語音|視訊)通話已結束$/.test(text) ||
    /^(you|a contact) changed the theme to .+$/i.test(text) ||
    /主題變更為/.test(text) ||
    /^liked a message$/i.test(text) ||
    /對你的訊息.*回應/.test(text) ||
    /對你的訊息.*傳達了/.test(text) ||
    /已新增\s*\d+\s*個.+文字特效/.test(text) ||
    /將你的暱稱設為/.test(text)
  );
}

function isCallNotice(content: string) {
  const text = normalizeNotice(content);
  return /^(audio|video) call ended$/i.test(text);
}

function normalizeNotice(content: string) {
  return content
    .trim()
    .replace(/^[☎☎️]\s*/, "")
    .replace(/[。．.]+$/u, "");
}

function isGifShare(item: MetaRawMessage) {
  const link = shareLink(item);
  return Boolean(link) && link.split(/[?#]/, 1)[0].toLowerCase().endsWith(".gif");
}

function callDurationMs(item: MetaRawMessage) {
  if (typeof item.call_duration !== "number" || !Number.isFinite(item.call_duration)) {
    return null;
  }
  return item.call_duration * 1000;
}

function isMetaRawMessage(value: unknown): value is MetaRawMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.sender_name === "string" &&
    typeof item.timestamp_ms === "number" &&
    Number.isFinite(item.timestamp_ms)
  );
}
