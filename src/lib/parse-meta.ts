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
    messages.push({
      id: `meta-${index + 1}`,
      timestamp: item.timestamp_ms,
      senderId: senderName,
      senderName,
      content: decodeMetaText(item.content ?? ""),
      platform: "meta",
      type: "text",
    });
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

function isMetaRawMessage(value: unknown): value is MetaRawMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.sender_name === "string" &&
    typeof item.timestamp_ms === "number" &&
    Number.isFinite(item.timestamp_ms)
  );
}
